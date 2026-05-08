import { useCallback, useRef } from 'react';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { bringElementsToFront, alignElements, detectElementBounds, validateDropContent } from '../../../../shared/utils/solarwire-utils';
import { ensureTableHasRows } from '../../../../shared/utils/table-source-utils';
import { parse } from '../../../../lib/parser';
import { renderElement, createRenderContext } from '../../../../lib/renderer';
import type { Element as SolarWireElement } from '../../../../lib/parser/types';
import { Component } from '../../../../shared/types/component';
import { feedback } from '../../../stores/feedbackStore';
import { fileDialogService } from '../../../services/file-dialog-service';

export interface UseEditorActionsOptions {
  content: string;
  effectiveContent: string;
  handleContentChange: ((content: string) => void) | undefined;
  getSvgContentRef: React.RefObject<(() => string | null) | null>;
  setShowComponentLibrary: (show: boolean) => void;
}

export interface UseEditorActionsReturn {
  handleDeleteSelected: () => void;
  handleBringToFront: () => void;
  handleAlign: (alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  handleReorderElements: (reorderedIds: string[]) => void;
  handleDropComponentToCanvas: (component: Component, x: number, y: number) => void;
  handleExportSvg: () => Promise<void>;
}

export function useEditorActions({
  content,
  effectiveContent,
  handleContentChange,
  getSvgContentRef,
  setShowComponentLibrary,
}: UseEditorActionsOptions): UseEditorActionsReturn {
  const exportOpIdRef = useRef<string>('');

  const handleDeleteSelected = useCallback(() => {
    const { selectedElements, setSelectedElements } = useSolarWireStore.getState();
    if (selectedElements.length === 0) return;
    const lines = content.split(/\r?\n/);
    const linesToDelete = new Set<number>();
    selectedElements.forEach((elementId) => {
      const lineNum = parseInt(elementId);
      if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) return;
      const bounds = detectElementBounds(content, lineNum);
      for (let i = bounds.getStartLine(); i <= bounds.getEndLine(); i++) linesToDelete.add(i);
    });
    const sortedLines = Array.from(linesToDelete).sort((a, b) => b - a);
    const newLines = [...lines];
    sortedLines.forEach(lineNum => {
      const index = lineNum - 1;
      if (index >= 0 && index < newLines.length) newLines.splice(index, 1);
    });
    let finalLines = newLines.filter((line, idx) => {
      if (line.trim() !== '') return true;
      const prevIsEmpty = idx === 0 || newLines[idx - 1]?.trim() === '';
      const nextIsEmpty = idx === newLines.length - 1 || newLines[idx + 1]?.trim() === '';
      return !(prevIsEmpty && nextIsEmpty);
    });
    while (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') finalLines.pop();
    handleContentChange?.(finalLines.join('\n'));
    setSelectedElements([]);
  }, [content, handleContentChange]);

  const handleBringToFront = useCallback(() => {
    const { selectedElements, setSelectedElements } = useSolarWireStore.getState();
    if (selectedElements.length === 0) return;
    const { content: newContent, newElementIds } = bringElementsToFront(content, selectedElements);
    handleContentChange?.(newContent);
    setSelectedElements(newElementIds);
  }, [content, handleContentChange]);

  const handleAlign = useCallback((alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    const { selectedElements } = useSolarWireStore.getState();
    if (selectedElements.length < 2) return;
    let elementsBounds: Map<number, { x: number; y: number; width: number; height: number }> | undefined;
    try {
      const ast = parse(effectiveContent);
      const context = createRenderContext(ast.declarations, effectiveContent);
      elementsBounds = new Map();
      ast.elements.forEach((elem: SolarWireElement) => {
        const lineNum = elem.location?.line;
        if (lineNum && selectedElements.includes(lineNum.toString())) {
          const result = renderElement(elem, context);
          elementsBounds!.set(lineNum, {
            x: result.bounds.x,
            y: result.bounds.y,
            width: result.bounds.width,
            height: result.bounds.height
          });
        }
      });
    } catch {
      elementsBounds = undefined;
    }
    const newContent = alignElements(content, selectedElements, alignmentType, elementsBounds);
    handleContentChange?.(newContent);
  }, [content, handleContentChange, effectiveContent]);

  const handleReorderElements = useCallback((reorderedIds: string[]) => {
    const { selectedElements, setSelectedElements } = useSolarWireStore.getState();
    const lines = content.split(/\r?\n/);
    const ast = parse(content);
    const elementBlocks: { startLine: number; endLine: number; id: string }[] = [];
    ast.elements.forEach((el: SolarWireElement) => {
      const lineNum = el.location?.line || 0;
      if (lineNum < 1 || lineNum > lines.length) return;
      const line = lines[lineNum - 1];
      if (!line) return;
      const bounds = detectElementBounds(content, lineNum);
      elementBlocks.push({ startLine: bounds.getStartLine(), endLine: bounds.getEndLine(), id: lineNum.toString() });
    });
    const idToBlock = new Map<string, { startLine: number; endLine: number }>();
    elementBlocks.forEach(block => idToBlock.set(block.id, { startLine: block.startLine, endLine: block.endLine }));
    const allLineIndices = new Set<number>();
    elementBlocks.forEach(block => {
      for (let i = block.startLine - 1; i < block.endLine; i++) allLineIndices.add(i);
    });
    const nonElementLines: { index: number; content: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (!allLineIndices.has(i)) nonElementLines.push({ index: i, content: lines[i] });
    }
    const reorderedLines: string[] = [];
    const nonElementStart = nonElementLines.filter(n => n.index < Math.min(...elementBlocks.map(b => b.startLine - 1)));
    const nonElementEnd = nonElementLines.filter(n => n.index > Math.max(...elementBlocks.map(b => b.endLine - 1)));
    nonElementStart.forEach(n => reorderedLines.push(n.content));
    const oldIdToNewId = new Map<string, string>();
    reorderedIds.forEach(id => {
      const block = idToBlock.get(id);
      if (block) {
        const newId = (reorderedLines.length + 1).toString();
        oldIdToNewId.set(id, newId);
        for (let i = block.startLine - 1; i < block.endLine; i++) reorderedLines.push(lines[i]);
      }
    });
    if (nonElementEnd.length > 0) {
      reorderedLines.push('');
      nonElementEnd.forEach(n => reorderedLines.push(n.content));
    }
    while (reorderedLines.length > 0 && reorderedLines[reorderedLines.length - 1].trim() === '') reorderedLines.pop();
    handleContentChange?.(reorderedLines.join('\n'));
    const newSelectedIds = selectedElements.map(oldId => oldIdToNewId.get(oldId)).filter((id): id is string => id !== undefined);
    setSelectedElements(newSelectedIds);
  }, [content, handleContentChange]);

  const handleDropComponentToCanvas = useCallback((component: Component, x: number, y: number) => {
    if (!component.code) {
      feedback.toast.error('Component code is empty');
      return;
    }
    if (!validateDropContent(component.code)) {
      feedback.toast.error('Invalid or unsafe component code');
      return;
    }
    try {
      const adjustedCode = component.code.split(/\r?\n/).map((line) => {
        let resultLine = line;
        resultLine = resultLine.replace(/@\((\-?\d+),\s*(\-?\d+)\)/g, (match) => {
          const m = match.match(/@\((\-?\d+),\s*(\-?\d+)\)/);
          if (m) {
            const nx = x + parseInt(m[1], 10);
            const ny = y + parseInt(m[2], 10);
            return `@(${nx},${ny})`;
          }
          return match;
        });
        resultLine = resultLine.replace(/->\(\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/g, (match) => {
          const m = match.match(/->\(\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/);
          if (m) {
            const nx = x + parseInt(m[1], 10);
            const ny = y + parseInt(m[2], 10);
            return `->(${nx},${ny})`;
          }
          return match;
        });
        return resultLine;
      }).join('\n');
      const adjustedCodeWithRows = ensureTableHasRows(adjustedCode);
      const newContent = content.trimEnd() + '\n\n' + adjustedCodeWithRows;
      handleContentChange?.(newContent);
      setShowComponentLibrary(false);
      const existingLineCount = content.trimEnd().split(/\r?\n/).length;
      setTimeout(() => {
        try {
          const ast = parse(newContent);
          const newElementIds = ast.elements
            .filter((el: SolarWireElement) => (el.location?.line ?? 0) > existingLineCount)
            .map((el: SolarWireElement) => String(el.location?.line));
          if (newElementIds.length > 0) {
            useSolarWireStore.getState().setSelectedElements(newElementIds);
          }
        } catch {}
      }, 50);
    } catch (error) {
      console.error('Failed to drop component:', error);
      feedback.toast.error(`Failed to drop component: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [content, handleContentChange, setShowComponentLibrary]);

  const handleExportSvg = useCallback(async () => {
    if (!getSvgContentRef.current) {
      const opId = feedback.operation.start('export', 'Export not available');
      feedback.operation.fail(opId, 'Export not available');
      return;
    }
    const svgContent = getSvgContentRef.current();
    if (!svgContent) {
      const opId = feedback.operation.start('export', 'No content to export');
      feedback.operation.fail(opId, 'No content to export');
      return;
    }
    const svgWithXmlDecl = svgContent.trim().startsWith('<?xml') ? svgContent : `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`;
    exportOpIdRef.current = feedback.operation.start('export', 'Choosing location...');
    const filePath = await fileDialogService.saveFileDialog({
      filters: [{ name: 'SVG Files', extensions: ['svg'] }],
      defaultPath: 'solarwire-export.svg'
    });
    if (!filePath) {
      feedback.operation.removeOperation(exportOpIdRef.current);
      exportOpIdRef.current = '';
      return;
    }
    const blob = new Blob([svgWithXmlDecl], { type: 'image/svg+xml' });
    const arrayBuffer = await blob.arrayBuffer();
    const api = (window as any).api;
    if (api?.writeFile) {
      await api.writeFile(filePath, new Uint8Array(arrayBuffer));
      feedback.operation.complete(exportOpIdRef.current, 'SVG saved successfully!');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solarwire-export.svg';
      a.click();
      URL.revokeObjectURL(url);
      feedback.operation.complete(exportOpIdRef.current, 'SVG downloaded!');
    }
    exportOpIdRef.current = '';
  }, []);

  return {
    handleDeleteSelected,
    handleBringToFront,
    handleAlign,
    handleReorderElements,
    handleDropComponentToCanvas,
    handleExportSvg,
  };
}
