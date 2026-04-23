import type {
  ElementType,
  ClipboardElementData,
  CopyOptions,
  PasteOptions,
  CopyResult,
  PasteResult
} from './types';
import { useClipboardStore } from './clipboardStore';
import { getElementRelatedLines } from '../../../shared/utils/solarwire-utils';

export async function extractImageBase64(
  imagePath: string,
  fileDir: string
): Promise<string | null> {
  const api = (window as any).api;
  if (!api?.readImageAsBase64) return null;

  try {
    const fullPath = `${fileDir}/${imagePath}`;
    const base64 = await api.readImageAsBase64(fullPath);
    return base64;
  } catch (e) {
    console.warn('Failed to extract image for clipboard:', e);
    return null;
  }
}

export function adjustCoordinates(
  content: string,
  offsetX: number,
  offsetY: number
): string {
  const lines = content.split(/\r?\n/);

  const adjustedLines = lines.map((line) => {
    let isFirstCoord = true;

    let result = line.replace(
      /@\((\d+(\.\d+)?),\s*(\d+(\.\d+)?)\)/g,
      (match) => {
        if (!isFirstCoord) {
          return match;
        }
        isFirstCoord = false;

        const coordMatch = match.match(/@\((\d+(\.\d+)?),\s*(\d+(\.\d+)?)\)/);
        if (coordMatch) {
          const x = Math.round(parseFloat(coordMatch[1]) + offsetX);
          const y = Math.round(parseFloat(coordMatch[3]) + offsetY);
          return `@(${x}, ${y})`;
        }
        return match;
      }
    );

    result = result.replace(
      /->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,
      (_, x, y) => `->(${Math.round(parseInt(x) + offsetX)}, ${Math.round(parseInt(y) + offsetY)})`
    );

    return result;
  });

  return adjustedLines.join('\n');
}

export function getElementType(content: string, lineNumber: number): ElementType {
  const lines = content.split(/\r?\n/);
  if (lineNumber < 1 || lineNumber > lines.length) return 'unknown';

  const line = lines[lineNumber - 1].trim();

  if (line.startsWith('##')) return 'table';
  if (line.startsWith('--')) return 'line';
  if (line.startsWith('<')) return 'image';
  if (line.startsWith('[?"')) return 'placeholder';
  if (line.startsWith('((')) return 'circle';
  if (line.startsWith('("')) return 'rounded-rectangle';
  if (line.startsWith('[')) return 'rectangle';
  if (line.startsWith('"')) return 'text';

  return 'unknown';
}

export async function copyElements(options: CopyOptions): Promise<CopyResult> {
  const { elementIds, content, fileDir } = options;

  if (elementIds.length === 0) {
    return { success: false, elementCount: 0, hasImages: false, error: 'No elements selected' };
  }

  const lines = content.split(/\r?\n/);
  const processedLineNums = new Set<number>();
  const elementDataList: Array<{
    elementId: string;
    lineNum: number;
    startLine: number;
    endLine: number;
    x: number;
    y: number;
    type: ElementType;
    imagePath?: string;
    imageBase64?: string;
  }> = [];

  let referencePos: { x: number; y: number } | null = null;

  const sortedElementIds = [...elementIds].sort((a, b) => {
    const lineA = parseInt(a);
    const lineB = parseInt(b);
    return lineA - lineB;
  });

  for (const elementId of sortedElementIds) {
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) continue;
    if (processedLineNums.has(lineNum)) continue;

    const relatedLines = getElementRelatedLines(content, lineNum);
    const startLine = relatedLines[0];
    const endLine = relatedLines[relatedLines.length - 1];

    const firstLineInBlock = lines[startLine - 1];
    const coordMatch = firstLineInBlock.match(/@\((\d+),\s*(\d+)\)/);

    let x = 0;
    let y = 0;

    if (coordMatch) {
      x = parseInt(coordMatch[1]);
      y = parseInt(coordMatch[2]);

      if (!referencePos || x < referencePos.x || (x === referencePos.x && y < referencePos.y)) {
        referencePos = { x, y };
      }
    }

    for (let i = startLine; i <= endLine; i++) {
      processedLineNums.add(i);
    }

    const elementType = getElementType(content, lineNum);
    let imagePath: string | undefined;
    let imageBase64: string | undefined;

    if (elementType === 'image') {
      const imageMatch = lines[startLine - 1].match(/<([^>]+)>/);
      if (imageMatch) {
        imagePath = imageMatch[1];
        if (fileDir && imagePath) {
          const base64 = await extractImageBase64(imagePath, fileDir);
          imageBase64 = base64 ?? undefined;
        }
      }
    }

    elementDataList.push({
      elementId,
      lineNum,
      startLine,
      endLine,
      x,
      y,
      type: elementType,
      imagePath,
      imageBase64
    });
  }

  if (elementDataList.length === 0) {
    return { success: false, elementCount: 0, hasImages: false, error: 'No valid elements found' };
  }

  const clipboardElements: ClipboardElementData[] = [];
  const allLinesToCopy: string[] = [];

  for (const data of elementDataList) {
    for (let i = data.startLine; i <= data.endLine; i++) {
      allLinesToCopy.push(lines[i - 1]);
    }

    clipboardElements.push({
      id: data.elementId,
      lineNumber: data.lineNum,
      content: '',
      type: data.type,
      originalX: data.x,
      originalY: data.y,
      imagePath: data.imagePath,
      imageBase64: data.imageBase64
    });
  }

  const copyText = allLinesToCopy.join('\n');

  useClipboardStore.getState().setClipboardContent(
    clipboardElements,
    referencePos || { x: 0, y: 0 },
    copyText
  );

  return {
    success: true,
    elementCount: clipboardElements.length,
    hasImages: clipboardElements.some(el => el.type === 'image')
  };
}

export async function pasteElements(options: PasteOptions): Promise<PasteResult> {
  const { content, targetPosition, selectedElementId, setContent, setSelectedElements, fileDir } = options;
  const store = useClipboardStore.getState();

  let clipboardText: string;
  let offsetX = 0;
  let offsetY = 0;

  if (store.hasContent && store.rawContent) {
    clipboardText = store.rawContent;

    if (store.referencePosition) {
      offsetX = targetPosition.x - store.referencePosition.x;
      offsetY = targetPosition.y - store.referencePosition.y;
    }
  } else {
    try {
      clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || clipboardText.trim().length === 0) {
        return { success: false, newContent: content, newElementIds: [], error: 'Clipboard is empty' };
      }
    } catch (e) {
      console.error('Failed to read clipboard:', e);
      return { success: false, newContent: content, newElementIds: [], error: 'Failed to read clipboard' };
    }
  }

  let adjustedContent = adjustCoordinates(clipboardText, offsetX, offsetY);

  if (fileDir) {
    const api = (window as any).api;
    const imagePathRegex = /<([^>]+\.(?:png|jpg|jpeg|gif|webp|svg))>/gi;
    const matches = [...adjustedContent.matchAll(imagePathRegex)];

    if (matches.length > 0 && api?.copyFile && api?.ensureDir) {
      for (const match of matches) {
        const originalPath = match[1];
        if (originalPath.startsWith('assets/images/')) {
          continue;
        }
        const originalFullPath = `${fileDir}/${originalPath}`;
        const fileName = originalPath.split(/[\\/]/).pop() || `image_${Date.now()}.png`;
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newRelativePath = `assets/images/${timestamp}_${sanitizedName}`;
        const newFullPath = `${fileDir}/${newRelativePath}`;

        try {
          await api.ensureDir(`${fileDir}/assets/images`);
          await api.copyFile(originalFullPath, newFullPath);
          adjustedContent = adjustedContent.replace(`<${originalPath}>`, `<${newRelativePath}>`);
        } catch (err) {
          console.warn(`Failed to copy image: ${originalPath}`, err);
        }
      }
    }
  }

  const lines = content.split(/\r?\n/);
  const insertLine = lines.length;

  const newLines = [
    ...lines.slice(0, insertLine),
    adjustedContent,
    ...lines.slice(insertLine)
  ];

  const newContent = newLines.join('\n');

  const clipboardLines = adjustedContent.split(/\r?\n/);
  const startLineNum = insertLine + 1;
  const newElementIds: string[] = [];

  for (let i = 0; i < clipboardLines.length; i++) {
    const lineContent = clipboardLines[i].trim();
    if (lineContent.length > 0) {
      newElementIds.push((startLineNum + i).toString());
    }
  }

  setContent(newContent);

  if (newElementIds.length > 0) {
    setSelectedElements(newElementIds);
  }

  return {
    success: true,
    newContent,
    newElementIds
  };
}

export async function copyToSystemClipboard(): Promise<boolean> {
  const store = useClipboardStore.getState();

  if (!store.hasContent || !store.rawContent) {
    return false;
  }

  try {
    const items: ClipboardItem[] = [];

    const textBlob = new Blob([store.rawContent], { type: 'text/plain' });
    items.push(new ClipboardItem({
      'text/plain': textBlob
    }));

    const imageElements = store.elements.filter(el => el.type === 'image' && el.imageBase64);

    for (const element of imageElements) {
      if (element.imageBase64) {
        try {
          const base64Data = element.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const mimeType = element.imagePath?.endsWith('.png') ? 'image/png' : 'image/jpeg';
          const blob = new Blob([bytes], { type: mimeType });
          items.push(new ClipboardItem({
            [mimeType]: blob
          }));
        } catch (e) {
          console.warn('Failed to add image to clipboard:', e);
        }
      }
    }

    await navigator.clipboard.write(items);
    return true;
  } catch (e) {
    console.warn('Failed to write to system clipboard:', e);
    try {
      await navigator.clipboard.writeText(store.rawContent);
      return true;
    } catch (textError) {
      console.error('Failed to write text to clipboard:', textError);
      return false;
    }
  }
}
