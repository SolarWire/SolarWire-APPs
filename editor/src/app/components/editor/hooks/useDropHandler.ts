import type React from 'react';
import { usePreviewStore } from '../../../stores/previewStore';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { feedback } from '../../../stores/feedbackStore';
import { isInsideMultilineNoteContent } from '../../../../shared/utils/solarwire-utils';
import { getProjectDir } from '../../../../shared/utils/preview-utils';
import { saveImageToAssetsDir, getImageSizeFromBlob } from '../../../hooks/useImageDrop';
import { parse } from '../../../../lib/parser';
import type { Element as SolarWireElement } from '../../../../lib/parser/types';

function validateDropContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  if (content.length > 100000) {
    return false;
  }

  const dangerousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /<script/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.innerHTML/i,
    /\.outerHTML/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}

export interface UseDropHandlerOptions {
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  effectiveContent: string;
  effectiveSetContent: (c: string) => void;
  allowImageElements: boolean;
  fileDir: string | undefined;
  currentPath: string | undefined;
  selectedFile: { path?: string } | undefined;
  imageCacheRef: React.MutableRefObject<Record<string, string>>;
  setImageCacheTick: (t: number) => void;
  handleImageAdded: (assetPath: string, x: number, y: number, size?: { width: number; height: number }) => void;
  handleImageDragOver: (e: React.DragEvent) => void;
}

export interface UseDropHandlerReturn {
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOverCombined: (e: React.DragEvent) => void;
}

export function useDropHandler(options: UseDropHandlerOptions): UseDropHandlerReturn {
  const {
    getSvgCoords,
    effectiveContent,
    effectiveSetContent,
    allowImageElements,
    fileDir,
    currentPath,
    selectedFile,
    imageCacheRef,
    setImageCacheTick,
    handleImageAdded,
    handleImageDragOver,
  } = options;

  const setDragPreviewElement = usePreviewStore((s) => s.setDragPreviewElement);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const dragPreviewElement = usePreviewStore.getState().dragPreviewElement;
    if (dragPreviewElement) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        ...dragPreviewElement,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y),
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();

    const plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        type: 'component',
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y),
        code: plainText,
      });
      return;
    }

    const jsonData = e.dataTransfer.getData('application/json');
    if (!jsonData) return;

    try {
      const elementData = JSON.parse(jsonData);
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        type: elementData.type,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y),
      });
    } catch (error) {
      console.error('Drag enter error:', error);
    }
  };

  const handleDragLeave = () => {
    setDragPreviewElement(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragPreviewElement(null);

    try {
      const files: File[] = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const relativePath = await saveImageToAssetsDir(file, fileDir || '');
            const size = await getImageSizeFromBlob(file);
            handleImageAdded(relativePath, e.clientX + i * 20, e.clientY + i * 20, size);
          } catch (error) {
            console.error('Failed to save image:', error);
            feedback.toast.error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        return;
      }

      const plainText = e.dataTransfer.getData('text/plain');
      if (plainText) {
        if (!validateDropContent(plainText)) {
          feedback.toast.error('Invalid or unsafe content');
          return;
        }

        const svgCoords = getSvgCoords(e.clientX, e.clientY);
        const x = Math.round(svgCoords.x);
        const y = Math.round(svgCoords.y);

        const originalLines = plainText.split(/\r?\n/);
        const noteLineIndices = new Set<number>();
        for (let i = 0; i < originalLines.length; i++) {
          if (isInsideMultilineNoteContent(originalLines, i)) {
            noteLineIndices.add(i);
          }
        }

        const adjustedCode = originalLines
          .map((line, lineIndex) => {
            if (noteLineIndices.has(lineIndex)) {
              return line;
            }

            let resultLine = line;

            resultLine = resultLine.replace(
              /@\((\d+),\s*(\d+)\)/g,
              (match) => {
                const m = match.match(/@\((\d+),\s*(\d+)\)/);
                if (m) {
                  const nx = x + parseInt(m[1], 10);
                  const ny = y + parseInt(m[2], 10);
                  return `@(${nx},${ny})`;
                }
                return match;
              }
            );

            resultLine = resultLine.replace(
              /->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,
              (match) => {
                const m = match.match(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
                if (m) {
                  const nx = x + parseInt(m[1], 10);
                  const ny = y + parseInt(m[2], 10);
                  return `->(${nx},${ny})`;
                }
                return match;
              }
            );

            return resultLine;
          })
          .join('\n');

        const currentContent = effectiveContent || '';
        const newContent = currentContent.trimEnd() + '\n\n' + adjustedCode;
        effectiveSetContent(newContent);

        const existingLineCount = currentContent.trimEnd().split(/\r?\n/).length;
        setTimeout(() => {
          try {
            const ast = parse(newContent);
            const newElementIds = ast.elements
              .filter((el: SolarWireElement) => (el.location?.line ?? 0) > existingLineCount)
              .map((el: SolarWireElement) => String(el.location?.line));
            if (newElementIds.length > 0) {
              useSolarWireStore.getState().selectElements(newElementIds);
            }
          } catch {}
        }, 50);

        return;
      }

      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const elementData = JSON.parse(jsonData);
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      const x = Math.round(svgCoords.x);
      const y = Math.round(svgCoords.y);

      let newLine = '';
      switch (elementData.type) {
        case 'rectangle':
          newLine = `["Rectangle"] @(${x},${y}) w=100 h=50`;
          break;
        case 'circle':
          newLine = `("Circle") @(${x},${y})`;
          break;
        case 'text':
          newLine = `"Text" @(${x},${y})`;
          break;
        case 'line':
          newLine = `-- @(${x},${y})->(${x + 100},${y})`;
          break;
        case 'image':
          if (!allowImageElements) {
            feedback.toast.error('Image elements are not allowed in component editing mode');
            return;
          }
          {
            const api = (window as any).api;
            if (!api || !api.openFileDialog) {
              feedback.toast.error('File dialog not available');
              return;
            }
            const projectDir = getProjectDir(currentPath ?? '', selectedFile?.path);
            if (!projectDir) {
              feedback.toast.error('Please open a project directory first');
              return;
            }
            try {
              const paths = await api.openFileDialog({
                properties: ['openFile'],
                filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
              });
              if (!paths || paths.length === 0) return;
              const filePath = paths[0];
              const fileName = filePath.split(/[\\/]/).pop() || 'image.png';
              const timestamp = Date.now();
              const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
              const relativePath = `assets/images/${timestamp}_${sanitizedName}`;

              feedback.toast.info('Copying image...');

              try {
                await api.ensureDir(`${projectDir}/assets/images`);
              } catch (dirErr) {
                const errMsg = dirErr instanceof Error ? dirErr.message : String(dirErr);
                feedback.toast.error(`Failed to create assets directory: ${errMsg}`);
                return;
              }
              try {
                await api.copyFile(filePath, `${projectDir}/${relativePath}`);
              } catch (copyErr) {
                const errMsg = copyErr instanceof Error ? copyErr.message : String(copyErr);
                feedback.toast.error(`Failed to copy image file: ${errMsg}`);
                return;
              }

              feedback.toast.success('Image added successfully');

              const img = new Image();
              img.onload = () => {
                const aspect = img.width / img.height;
                const maxDim = 400;
                let w = Math.min(maxDim, img.width);
                let h = w / aspect;
                if (h > maxDim) { h = maxDim; w = h * aspect; }
                const line = `<${relativePath}> @(${x},${y}) w=${Math.round(w)} h=${Math.round(h)}`;
                const currentContent = effectiveContent || '';
                const newContent = currentContent.trimEnd() + '\n' + line;
                effectiveSetContent(newContent);
              };
              img.onerror = () => {
                const line = `<${relativePath}> @(${x},${y})`;
                const currentContent = effectiveContent || '';
                const newContent = currentContent.trimEnd() + '\n' + line;
                effectiveSetContent(newContent);
              };
              img.src = filePath;
            } catch (err) {
              console.error('Image insert failed:', err);
              const errMsg = err instanceof Error ? err.message : String(err);
              feedback.toast.error(`Failed to add image: ${errMsg}`);
            }
            return;
          }
        case 'placeholder':
          newLine = `[?"Placeholder"] @(${x},${y}) w=100 h=50`;
          break;
        case 'table':
          newLine = `## @(${x},${y}) w=200 h=100`;
          break;
        default:
          return;
      }

      const currentContent = effectiveContent || '';
      const newContent = currentContent.trimEnd() + '\n' + newLine;
      effectiveSetContent(newContent);

    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleDragOverCombined = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const dragPreviewElement = usePreviewStore.getState().dragPreviewElement;
    if (dragPreviewElement) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setDragPreviewElement({
        ...dragPreviewElement,
        x: Math.round(svgCoords.x),
        y: Math.round(svgCoords.y),
      });
    }

    handleImageDragOver(e);
  };

  return {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragOverCombined,
  };
}
