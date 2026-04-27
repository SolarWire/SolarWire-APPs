import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import SolarWirePreview from './SolarWirePreview';
import PropertyPanel from './PropertyPanel';
import ComponentLibrary from './ComponentLibrary';
import LayerPanel from './LayerPanel';
import SolarWireToolbar from '../toolbar/SolarWireToolbar';
import { useSolarWireStore, SelectionTool } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { getElementRelatedLines, updateLineAttribute, bringElementsToFront, alignElements, detectNoteBounds, detectTableBounds } from '../../../shared/utils/solarwire-utils';
import { parse } from '../../../lib/parser';
import type { Element as SolarWireElement } from '../../../lib/parser/types';
import { Component } from '../../../shared/types/component';
import { copyElements, pasteElements, copyToSystemClipboard } from '../../services/clipboard';
import './SolarWireVisualEditor.css';

interface SolarWireVisualEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  showLayerPanel?: boolean;
  onShowLayerPanelChange?: (show: boolean) => void;
  showComponentLibrary?: boolean;
  onShowComponentLibraryChange?: (show: boolean) => void;
  allowImageElements?: boolean;
}

function SolarWireVisualEditor({
  content,
  onContentChange,
  externalContent,
  onExternalContentChange,
  showLayerPanel: externalShowLayerPanel,
  onShowLayerPanelChange,
  showComponentLibrary: externalShowComponentLibrary,
  onShowComponentLibraryChange,
  allowImageElements = true
}: SolarWireVisualEditorProps): React.ReactElement {
  const isExternalMode = externalContent !== undefined;
  const effectiveContent = isExternalMode ? externalContent : content;
  const handleContentChange = isExternalMode ? onExternalContentChange : onContentChange;

  const [internalShowLayerPanel, setInternalShowLayerPanel] = useState(false);
  const [internalShowComponentLibrary, setInternalShowComponentLibrary] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [exportNotification, setExportNotification] = useState<{ type: 'progress' | 'success' | 'error'; message: string; error?: string } | null>(null);
  const getSvgContentRef = useRef<(() => string | null) | null>(null);

  const handleExportSvg = useCallback(async () => {
    if (!getSvgContentRef.current) {
      setExportNotification({ type: 'error', message: 'Export not available' });
      return;
    }

    const svgContent = getSvgContentRef.current();
    if (!svgContent) {
      setExportNotification({ type: 'error', message: 'No content to export' });
      return;
    }

    const svgWithXmlDecl = svgContent.trim().startsWith('<?xml') ? svgContent : `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`;

    const api = (window as any).api;
    if (!api?.saveFileDialog) {
      const blob = new Blob([svgWithXmlDecl], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solarwire-export.svg';
      a.click();
      URL.revokeObjectURL(url);
      setExportNotification({ type: 'success', message: 'SVG downloaded!' });
      setTimeout(() => setExportNotification(null), 3000);
      return;
    }

    setExportNotification({ type: 'progress', message: 'Choosing location...' });
    const result = await api.saveFileDialog({
      filters: [{ name: 'SVG Files', extensions: ['svg'] }],
      defaultPath: 'solarwire-export.svg'
    });

    if (!result || result.canceled) {
      setExportNotification(null);
      return;
    }

    if (!result.filePath) {
      setExportNotification({ type: 'error', message: 'No file path selected' });
      return;
    }

    setExportNotification({ type: 'progress', message: 'Saving...' });
    try {
      await api.writeFile(result.filePath, svgWithXmlDecl, true);
      setExportNotification({ type: 'success', message: 'SVG saved!' });
      setTimeout(() => setExportNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExportNotification({ type: 'error', message: 'Save failed', error: errorMessage });
    }
  }, []);

  const clearExportNotification = useCallback(() => {
    setExportNotification(null);
  }, []);

  const showLayerPanel = externalShowLayerPanel !== undefined ? externalShowLayerPanel : internalShowLayerPanel;
  const showComponentLibrary = externalShowComponentLibrary !== undefined ? externalShowComponentLibrary : internalShowComponentLibrary;
  const setShowLayerPanel = onShowLayerPanelChange || setInternalShowLayerPanel;
  const setShowComponentLibrary = onShowComponentLibraryChange || setInternalShowComponentLibrary;

  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const selectionTool = useSolarWireStore(s => s.selectionTool);
  const isPanMode = useSolarWireStore(s => s.isPanMode);
  const setSelectionTool = useSolarWireStore(s => s.setSelectionTool);
  const setIsPanMode = useSolarWireStore(s => s.setIsPanMode);
  const showNotes = useSolarWireStore(s => s.showNotes);
  const setShowNotes = useSolarWireStore(s => s.setShowNotes);
  const zoomLevel = useSolarWireStore(s => s.zoomLevel);
  const setZoomLevel = useSolarWireStore(s => s.setZoomLevel);
  const isSpacePressed = useSolarWireStore(s => s.isSpacePressed);
  const setIsSpacePressed = useSolarWireStore(s => s.setIsSpacePressed);
  const setSelectedElements = useSolarWireStore(s => s.setSelectedElements);
  const selectElements = useSolarWireStore(s => s.selectElements);
  const { showGrid, gridSize, snapToGrid, setShowGrid, setGridSize, setSnapToGrid } = useSettingsStore();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const previewEl = document.querySelector('.solarwire-preview');
    if (!previewEl || !previewEl.contains(e.target as Node)) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getElementDataFromContent = (content: string, lineNum: number) => {
    const lines = content.split(/\r?\n/);
    if (lineNum < 1 || lineNum > lines.length) return null;
    const line = lines[lineNum - 1];
    let x = 0, y = 0, x2 = 0, y2 = 0;
    const coordPattern = /@\((\d+),\s*(\d+)\)/;
    const match = line.match(coordPattern);
    if (match) {
      x = parseInt(match[1]);
      y = parseInt(match[2]);
    } else {
      const xMatch = line.match(/x=(\d+)/);
      const yMatch = line.match(/y=(\d+)/);
      if (xMatch) x = parseInt(xMatch[1]);
      if (yMatch) y = parseInt(yMatch[1]);
    }
    const lineEndPattern = /->\((\d+),\s*(\d+)\)/;
    const lineEndMatch = line.match(lineEndPattern);
    if (lineEndMatch) {
      x2 = parseInt(lineEndMatch[1]);
      y2 = parseInt(lineEndMatch[2]);
    } else {
      const x2Match = line.match(/x2=(\d+)/);
      const y2Match = line.match(/y2=(\d+)/);
      if (x2Match) x2 = parseInt(x2Match[1]);
      if (y2Match) y2 = parseInt(y2Match[1]);
    }
    return { x, y, x2, y2 };
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const isEditing = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).isContentEditable ||
      (activeElement as any).classList?.contains('monaco-editor')
    );
    if (isEditing || selectedElements.length === 0) return;
    let dx = 0, dy = 0;
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
      default: return;
    }
    e.preventDefault();
    let newContent = content;
    selectedElements.forEach((elementId) => {
      const elementLine = parseInt(elementId);
      if (!isNaN(elementLine)) {
        const elementData = getElementDataFromContent(newContent, elementLine);
        if (elementData) {
          if (dx !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'x', elementData.x + dx);
            if (elementData.x2) newContent = updateLineAttribute(newContent, elementLine, 'x2', elementData.x2 + dx);
          }
          if (dy !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
            if (elementData.y2) newContent = updateLineAttribute(newContent, elementLine, 'y2', elementData.y2 + dy);
          }
        }
      }
    });
    handleContentChange?.(newContent);
  }, [selectedElements, content, handleContentChange]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    const lines = content.split(/\r?\n/);
    const linesToDelete = new Set<number>();
    selectedElements.forEach((elementId) => {
      const lineNum = parseInt(elementId);
      if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) return;
      const line = lines[lineNum - 1];
      const trimmedLine = line.trim();
      const isTableElement = trimmedLine.startsWith('##');
      if (isTableElement) {
        const { startLine, endLine } = detectTableBounds(content, lineNum);
        for (let i = startLine; i <= endLine; i++) linesToDelete.add(i);
      } else {
        const { startLine, endLine } = detectNoteBounds(content, lineNum);
        for (let i = startLine; i <= endLine; i++) linesToDelete.add(i);
      }
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
  }, [selectedElements, content, handleContentChange, setSelectedElements]);

  const handleBringToFront = useCallback(() => {
    if (selectedElements.length === 0) return;
    const { content: newContent, newElementIds } = bringElementsToFront(content, selectedElements);
    handleContentChange?.(newContent);
    setSelectedElements(newElementIds);
  }, [selectedElements, content, handleContentChange, setSelectedElements]);

  const handleAlign = useCallback((alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElements.length < 2) return;
    const newContent = alignElements(content, selectedElements, alignmentType);
    handleContentChange?.(newContent);
  }, [selectedElements, content, handleContentChange]);

  const handleReorderElements = useCallback((reorderedIds: string[]) => {
    const lines = content.split(/\r?\n/);
    const ast = parse(content);
    const elementBlocks: { startLine: number; endLine: number; id: string }[] = [];
    ast.elements.forEach((el: SolarWireElement) => {
      const lineNum = el.location?.line || 0;
      if (lineNum < 1 || lineNum > lines.length) return;
      const line = lines[lineNum - 1];
      if (!line) return;
      const trimmedLine = line.trim();
      const isTable = trimmedLine.startsWith('##');
      let startLine = lineNum, endLine = lineNum;
      if (isTable) {
        const bounds = detectTableBounds(content, lineNum);
        startLine = bounds.startLine; endLine = bounds.endLine;
      } else {
        const bounds = detectNoteBounds(content, lineNum);
        startLine = bounds.startLine; endLine = bounds.endLine;
      }
      elementBlocks.push({ startLine, endLine, id: lineNum.toString() });
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
  }, [content, handleContentChange, selectedElements, setSelectedElements]);

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel + 10, 200));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel - 10, 25));

  const handleDropComponentToCanvas = useCallback((component: Component, x: number, y: number) => {
    if (!component.code) return;
    const adjustedCode = component.code.split(/\r?\n/).map((line) => {
      let resultLine = line;
      resultLine = resultLine.replace(/@\((\d+),\s*(\d+)\)/g, (match) => {
        const m = match.match(/@\((\d+),\s*(\d+)\)/);
        if (m) return `@(${Math.max(0, x + parseInt(m[1], 10))},${Math.max(0, y + parseInt(m[2], 10))})`;
        return match;
      });
      resultLine = resultLine.replace(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, (match) => {
        const m = match.match(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (m) return `->(${Math.max(0, x + parseInt(m[1], 10))},${Math.max(0, y + parseInt(m[2], 10))})`;
        return match;
      });
      return resultLine;
    }).join('\n');
    handleContentChange?.(content.trimEnd() + '\n\n' + adjustedCode);
    setShowComponentLibrary(false);
  }, [content, handleContentChange, setShowComponentLibrary]);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
        const activeElement = document.activeElement;
        const isEditing = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable ||
          (activeElement as any).classList?.contains('monaco-editor')
        );
        if (!isEditing) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
      handleKeyDown(e);
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isEditor = activeElement?.tagName === 'TEXTAREA' || activeElement?.getAttribute('contenteditable') === 'true' || activeElement?.closest('.monaco-editor');
        if (!isEditor) setShowGrid(!showGrid);
      }
    };
    const handleKeyUpEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [handleKeyDown, handleDeleteSelected, selectedElements, showGrid]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = () => closeContextMenu();
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu(); };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu, closeContextMenu]);

  const toolbarState = useMemo(() => ({
    showLayerPanel,
    showComponentLibrary,
    showNotes,
    snapToGrid,
    zoomLevel,
    isPanMode,
    isSpacePressed,
    selectionTool,
    selectedCount: selectedElements.length
  }), [showLayerPanel, showComponentLibrary, showNotes, snapToGrid, zoomLevel, isPanMode, isSpacePressed, selectionTool, selectedElements.length]);

  const toolbarCallbacks = useMemo(() => ({
    onToggleLayerPanel: () => setShowLayerPanel(!showLayerPanel),
    onToggleComponentLibrary: () => setShowComponentLibrary(!showComponentLibrary),
    onToggleNotes: () => setShowNotes(!showNotes),
    onToggleSnap: () => setSnapToGrid(!snapToGrid),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onTogglePanMode: () => setIsPanMode(!isPanMode),
    onSelectTool: (tool: SelectionTool) => {
      setSelectionTool(tool);
      if (isPanMode) setIsPanMode(false);
    },
    onBringToFront: handleBringToFront,
    onAlign: handleAlign,
    onExportSvg: handleExportSvg
  }), [showLayerPanel, showComponentLibrary, showNotes, snapToGrid, isPanMode, handleZoomIn, handleZoomOut, handleBringToFront, handleAlign, handleExportSvg]);

  return (
    <div className="solarwire-visual-editor">
      <SolarWireToolbar state={toolbarState} callbacks={toolbarCallbacks} />

      <div className="solarwire-content">
        <SolarWirePreview
          zoomLevel={zoomLevel}
          selectionTool={selectionTool}
          showNotes={showNotes}
          onZoomChange={setZoomLevel}
          isPanMode={isPanMode}
          isSpacePressed={isSpacePressed}
          showGridProp={showGrid}
          snapToGridProp={snapToGrid}
          gridSizeProp={gridSize}
          externalContent={externalContent}
          onExternalContentChange={onExternalContentChange}
          onContextMenu={handleContextMenu}
          allowImageElements={allowImageElements}
          onRequestExportSvg={(fn) => { getSvgContentRef.current = fn; }}
        />

        {selectedElements.length > 0 && (
          <div className="property-panel-fixed">
            <PropertyPanel externalContent={externalContent} onExternalContentChange={onExternalContentChange} />
          </div>
        )}

        {showLayerPanel && (
          <div className="layer-panel-fixed">
            <LayerPanel onSelectElement={(id) => setSelectedElements([id])} onReorderElements={handleReorderElements} />
          </div>
        )}

        {showComponentLibrary && (
          <div className="component-library-panel-fixed">
            <ComponentLibrary onDropToCanvas={handleDropComponentToCanvas} />
          </div>
        )}

        {exportNotification && (
          <div className={`export-notification ${exportNotification.type}`}>
            {exportNotification.type === 'progress' && <span className="spinner"></span>}
            {exportNotification.type === 'success' && <span className="icon">✓</span>}
            {exportNotification.type === 'error' && <span className="icon">✗</span>}
            <div className="notification-content">
              <span className="notification-message">{exportNotification.message}</span>
              {exportNotification.error && (
                <div className="notification-error">{exportNotification.error}</div>
              )}
            </div>
            {exportNotification.type === 'error' && (
              <button className="notification-close" onClick={clearExportNotification}>×</button>
            )}
          </div>
        )}

        {contextMenu && (
          <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
            <button className="context-menu-item" onClick={async () => {
              if (selectedElements.length > 0) {
                const result = await copyElements({ elementIds: selectedElements, content });
                if (result.success) await copyToSystemClipboard();
              }
              closeContextMenu();
            }}>
              复制 (Copy)
            </button>
            <button className="context-menu-item" onClick={async () => {
              if (!handleContentChange) return;
              const targetPos = contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 200, y: 200 };
              const result = await pasteElements({ content, targetPosition: targetPos, setContent: handleContentChange, setSelectedElements: (ids) => useSolarWireStore.getState().setSelectedElements(ids) });
              if (result.success) handleContentChange?.(result.newContent);
              closeContextMenu();
            }}>
              粘贴 (Paste)
            </button>
            <button className="context-menu-item" onClick={() => {
              handleDeleteSelected();
              closeContextMenu();
            }}>
              删除 (Delete)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SolarWireVisualEditor;
