import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import SolarWirePreview from './SolarWirePreview';
import CanvasPreview from './CanvasPreview';
import PropertyPanel from './PropertyPanel';
import ComponentLibrary from './ComponentLibrary';
import LayerPanel from './LayerPanel';
import SolarWireToolbar from '../toolbar/SolarWireToolbar';
import ErrorPanel from './ErrorPanel';
import ErrorCard from './ErrorCard';
import { useSolarWireStore, SelectionTool } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { getElementRelatedLines, updateLineAttribute, bringElementsToFront, alignElements, detectElementBounds, validateDropContent } from '../../../shared/utils/solarwire-utils';
import { parse } from '../../../lib/parser';
import type { Element as SolarWireElement } from '../../../lib/parser/types';
import { Component } from '../../../shared/types/component';
import { copyElements, pasteElements, copyToSystemClipboard } from '../../services/clipboard';
import { fileDialogService } from '../../services/file-dialog-service';
import { showToast } from '../../services/toast-service';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import './SolarWireVisualEditor.css';

/**
 * SolarWire 可视化编辑器组件属性接口
 */
interface SolarWireVisualEditorProps {
  /** 编辑器内容 */
  content: string;
  /** 内容变化回调 */
  onContentChange: (content: string) => void;
  /** 外部内容（用于组件编辑模式） */
  externalContent?: string;
  /** 外部内容变化回调 */
  onExternalContentChange?: (content: string) => void;
  /** 是否显示图层面板（外部控制） */
  showLayerPanel?: boolean;
  /** 图层面板显示状态变化回调 */
  onShowLayerPanelChange?: (show: boolean) => void;
  /** 是否显示组件库（外部控制） */
  showComponentLibrary?: boolean;
  /** 组件库显示状态变化回调 */
  onShowComponentLibraryChange?: (show: boolean) => void;
  /** 是否允许图片元素 */
  allowImageElements?: boolean;
  /** 语法错误列表 */
  syntaxErrors?: any[];
  /** 设置语法错误列表 */
  setSyntaxErrors?: (errors: any[]) => void;
  /** 切换到代码tab并定位到指定行 */
  onSwitchToCodeTab?: (line: number, column: number) => void;
}

/**
 * SolarWire 可视化编辑器组件
 * 提供可视化编辑功能，包括元素拖拽、缩放、对齐、图层管理等
 */
function SolarWireVisualEditor({
  content,
  onContentChange,
  externalContent,
  onExternalContentChange,
  showLayerPanel: externalShowLayerPanel,
  onShowLayerPanelChange,
  showComponentLibrary: externalShowComponentLibrary,
  onShowComponentLibraryChange,
  allowImageElements = true,
  syntaxErrors,
  setSyntaxErrors,
  onSwitchToCodeTab
}: SolarWireVisualEditorProps): React.ReactElement {
  // 判断是否为外部模式（组件编辑模式）
  const isExternalMode = externalContent !== undefined;
  // 有效内容（外部模式使用外部内容，否则使用编辑器内容）
  const effectiveContent = isExternalMode ? externalContent : content;
  // 有效内容设置方法
  const handleContentChange = isExternalMode ? onExternalContentChange : onContentChange;

  // 内部状态：图层面板显示状态
  const [internalShowLayerPanel, setInternalShowLayerPanel] = useState(false);
  // 内部状态：组件库显示状态
  const [internalShowComponentLibrary, setInternalShowComponentLibrary] = useState(false);
  // 右键菜单位置
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // 导出通知状态
  const [exportNotification, setExportNotification] = useState<{ type: 'progress' | 'success' | 'error'; message: string; error?: string } | null>(null);
  // SVG 内容获取函数引用
  const getSvgContentRef = useRef<(() => string | null) | null>(null);

  /**
   * 处理 SVG 导出
   * 将当前画布导出为 SVG 文件
   */
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

    setExportNotification({ type: 'progress', message: 'Choosing location...' });
    const filePath = await fileDialogService.saveFileDialog({
      filters: [{ name: 'SVG Files', extensions: ['svg'] }],
      defaultPath: 'solarwire-export.svg'
    });

    if (!filePath) {
      setExportNotification(null);
      return;
    }

    const blob = new Blob([svgWithXmlDecl], { type: 'image/svg+xml' });
    const arrayBuffer = await blob.arrayBuffer();
    const api = (window as any).api;
    if (api?.writeFile) {
      // 使用 Electron API 写入文件
      await api.writeFile(filePath, new Uint8Array(arrayBuffer));
      setExportNotification({ type: 'success', message: 'SVG saved successfully!' });
    } else {
      // 回退到浏览器下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solarwire-export.svg';
      a.click();
      URL.revokeObjectURL(url);
      setExportNotification({ type: 'success', message: 'SVG downloaded!' });
    }
    setTimeout(() => setExportNotification(null), 3000);
  }, []);

  /**
   * 清除导出通知
   */
  const clearExportNotification = useCallback(() => {
    setExportNotification(null);
  }, []);

  // 图层面板和组件库的显示状态
  const showLayerPanel = externalShowLayerPanel !== undefined ? externalShowLayerPanel : internalShowLayerPanel;
  const showComponentLibrary = externalShowComponentLibrary !== undefined ? externalShowComponentLibrary : internalShowComponentLibrary;
  const setShowLayerPanel = onShowLayerPanelChange || setInternalShowLayerPanel;
  const setShowComponentLibrary = onShowComponentLibraryChange || setInternalShowComponentLibrary;

  // SolarWire store 状态
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
  // 设置相关状态
  const { showGrid, gridSize, snapToGrid, setShowGrid, setGridSize, setSnapToGrid, renderMode } = useSettingsStore();

  // 语法错误状态
  const [internalSyntaxErrors, setInternalSyntaxErrors] = useState<any[]>([]);

  // 使用外部传入的语法错误状态，否则使用内部状态
  const currentSyntaxErrors = syntaxErrors || internalSyntaxErrors;
  const currentSetSyntaxErrors = setSyntaxErrors || setInternalSyntaxErrors;

  /**
   * 处理语法错误检测
   * 使用统一的语法错误服务
   */
  useEffect(() => {
    
    // 启动渲染器错误监听
    syntaxErrorService.startRendererErrorMonitoring();
    
    // 监听错误变化
    const listener = {
      onErrorsChanged: (errors: SyntaxError[]) => {
        if (setSyntaxErrors) {
          setSyntaxErrors(errors);
        }
      }
    };
    
    syntaxErrorService.addListener(listener);
    
    // 在内容变化时清除之前的错误，让渲染器重新检测
    syntaxErrorService.clearErrors();
    
    return () => {
      syntaxErrorService.removeListener(listener);
      syntaxErrorService.stopRendererErrorMonitoring();
    };
  }, [content, setSyntaxErrors]);

  /**
   * 跳转到错误位置
   * 切换到代码编辑tab并定位到错误行，添加红色高亮
   */
  const handleJumpToError = useCallback((line: number, column: number) => {
    
    // 如果有外部提供的切换函数，使用它
    if (onSwitchToCodeTab) {
      onSwitchToCodeTab(line, column);
    } else {
      // 否则使用原有的方式切换到代码模式
      const { setRenderMode } = useSettingsStore.getState();
      setRenderMode('code' as any);
      
      // 触发 tab 切换和滚动
      setTimeout(() => {
        // 通过设置 renderMode 来触发 SolarWireMode 的 tab 切换
        // 同时触发滚动和高亮
        const event = new CustomEvent('jumpToError', { 
          detail: { line, column } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [onSwitchToCodeTab]);

  /**
   * 处理右键菜单
   * 在预览区域右键时显示上下文菜单
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const previewEl = document.querySelector('.solarwire-preview');
    if (!previewEl || !previewEl.contains(e.target as Node)) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  /**
   * 关闭右键菜单
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * 从内容中获取元素数据
   * @param content 文档内容
   * @param lineNum 行号
   * @returns 元素坐标数据
   */
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
  }, [content, handleContentChange, selectedElements, setSelectedElements]);

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel + 10, 200));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel - 10, 25));

  const handleDropComponentToCanvas = useCallback((component: Component, x: number, y: number) => {
    if (!component.code) {
      showToast('Component code is empty', 'error');
      return;
    }
    
    // 验证组件代码是否安全
    if (!validateDropContent(component.code)) {
      showToast('Invalid or unsafe component code', 'error');
      return;
    }
    
    try {
      const adjustedCode = component.code.split(/\r?\n/).map((line) => {
        let resultLine = line;
        resultLine = resultLine.replace(/@\((\d+),\s*(\d+)\)/g, (match) => {
          const m = match.match(/@\((\d+),\s*(\d+)\)/);
          if (m) {
            const nx = x + parseInt(m[1], 10);
            const ny = y + parseInt(m[2], 10);
            return `@(${Math.max(0, nx)},${Math.max(0, ny)})`;
          }
          return match;
        });
        resultLine = resultLine.replace(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, (match) => {
          const m = match.match(/->\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
          if (m) {
            const nx = x + parseInt(m[1], 10);
            const ny = y + parseInt(m[2], 10);
            return `->(${Math.max(0, nx)},${Math.max(0, ny)})`;
          }
          return match;
        });
        return resultLine;
      }).join('\n');
      handleContentChange?.(content.trimEnd() + '\n\n' + adjustedCode);
      setShowComponentLibrary(false);
    } catch (error) {
      console.error('Failed to drop component:', error);
      showToast(`Failed to drop component: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
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
        {renderMode === 'canvas' ? (
          <CanvasPreview onElementClick={(id) => setSelectedElements([id])} />
        ) : (
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
            hasSyntaxErrors={currentSyntaxErrors.length > 0}
          />
        )}

        {currentSyntaxErrors.length > 0 && (
          <>
            {currentSyntaxErrors.slice(0, 3).map((error: SyntaxError, index: number) => (
              <ErrorCard 
                key={`${error.line}-${error.column}-${index}`}
                error={error}
                onViewInCode={handleJumpToError}
              />
            ))}
          </>
        )}

        {selectedElements.length > 0 && (
          <div className="property-panel-fixed">
            <PropertyPanel externalContent={externalContent} onExternalContentChange={onExternalContentChange} />
          </div>
        )}

        {showLayerPanel && (
          <div className="layer-panel-fixed">
            <LayerPanel 
              onSelectElement={(id) => setSelectedElements([id])} 
              onReorderElements={handleReorderElements}
              externalContent={externalContent}
            />
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
              // 使用 setSelectedElements 而非 getState()，避免直接访问 store 状态
              const result = await pasteElements({ content, targetPosition: targetPos, setContent: handleContentChange, setSelectedElements: setSelectedElements });
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
