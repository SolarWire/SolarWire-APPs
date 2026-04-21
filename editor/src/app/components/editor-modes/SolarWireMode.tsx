import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWirePreview from '../editor/SolarWirePreview';
import PropertyPanel from '../editor/PropertyPanel';
import ElementLibrary from '../editor/ElementLibrary';
import LayerPanel from '../editor/LayerPanel';
import ShortcutPanel from '../editor/ShortcutPanel';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getElementRelatedLines, updateLineAttribute, bringElementsToFront, alignElements, detectNoteBounds, detectTableBounds } from '../../../shared/utils/solarwire-utils';
import { parse } from '../../../lib/parser';
import type { Element as SolarWireElement } from '../../../lib/parser/types';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './SolarWireMode.css';

function SolarWireMode(): React.ReactElement {
  const { content, setContent, undo } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet } = useFileStore();
  const { selectedElements, selectionTool, isPanMode, setSelectionTool, setIsPanMode, showNotes, setShowNotes, zoomLevel, setZoomLevel, isSpacePressed, setIsSpacePressed, setSelectedElements, selectElements } = useSolarWireStore();
  const { primaryColor, showGrid, gridSize, snapToGrid, setShowGrid, setGridSize, setSnapToGrid } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleTabChange = useCallback((tab: 'visual' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code' && selectedElements.length > 0) {
      setScrollTrigger(prev => prev + 1);
      setHighlightTrigger(prev => prev + 1);
    }
  }, [selectedElements.length]);

  const selectionTools = [
    { id: 'select', label: '点选', icon: '🖱️', description: '点击选中元素，Shift+点击切换选中状态' },
    { id: 'box-include', label: '包含框选', icon: '⬚', description: '完全包含在框内的元素才会被选中' },
    { id: 'box-intersect', label: '交叉框选', icon: '⬛', description: '与框相交的元素都会被选中' }
  ];

  const handleBringToFront = () => {
    if (selectedElements.length === 0) return;
    const { content: newContent, newElementIds } = bringElementsToFront(content, selectedElements);
    setContent(newContent);
    setSelectedElements(newElementIds);
  };

  const handleAlign = (alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElements.length < 2) return;
    const newContent = alignElements(content, selectedElements, alignmentType);
    setContent(newContent);
  };

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
      
      let startLine = lineNum;
      let endLine = lineNum;
      
      if (isTable) {
        const bounds = detectTableBounds(content, lineNum);
        startLine = bounds.startLine;
        endLine = bounds.endLine;
      } else {
        const bounds = detectNoteBounds(content, lineNum);
        startLine = bounds.startLine;
        endLine = bounds.endLine;
      }
      
      const id = el.location?.line?.toString() || lineNum.toString();
      elementBlocks.push({ startLine, endLine, id });
    });

    const idToBlock = new Map<string, { startLine: number; endLine: number }>();
    elementBlocks.forEach(block => {
      idToBlock.set(block.id, { startLine: block.startLine, endLine: block.endLine });
    });

    const allLineIndices = new Set<number>();
    elementBlocks.forEach(block => {
      for (let i = block.startLine - 1; i < block.endLine; i++) {
        allLineIndices.add(i);
      }
    });

    const nonElementLines: { index: number; content: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (!allLineIndices.has(i)) {
        nonElementLines.push({ index: i, content: lines[i] });
      }
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
        for (let i = block.startLine - 1; i < block.endLine; i++) {
          reorderedLines.push(lines[i]);
        }
      }
    });
    
    if (nonElementEnd.length > 0) {
      reorderedLines.push('');
      nonElementEnd.forEach(n => reorderedLines.push(n.content));
    }
    
    while (reorderedLines.length > 0 && reorderedLines[reorderedLines.length - 1].trim() === '') {
      reorderedLines.pop();
    }
    
    const newContent = reorderedLines.join('\n');
    setContent(newContent);
    
    const newSelectedIds = selectedElements
      .map(oldId => oldIdToNewId.get(oldId))
      .filter((id): id is string => id !== undefined);
    setSelectedElements(newSelectedIds);
  }, [content, setContent, setSelectedElements, selectedElements]);

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 25));
  };

  const highlightLines = React.useMemo(() => {
    if (selectedElements.length === 0) {
      return [];
    }
    
    const lines: number[] = [];
    selectedElements.forEach((elementId) => {
      const elementLine = parseInt(elementId);
      if (!isNaN(elementLine)) {
        const relatedLines = getElementRelatedLines(content, elementLine);
        lines.push(...relatedLines);
      }
    });
    return lines;
  }, [selectedElements, content]);

  useEffect(() => {
    if (selectedFile && fileContent && !currentSnippet) {
      setContent(fileContent);
    }
  }, [selectedFile, fileContent, currentSnippet, setContent]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const isEditing = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).isContentEditable ||
      (activeElement as any).classList?.contains('monaco-editor')
    );
    
    if (isEditing || selectedElements.length === 0) return;

    let dx = 0;
    let dy = 0;

    const step = e.shiftKey ? 10 : 1;

    switch (e.key) {
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      default:
        return;
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
            if (elementData.x2) {
              newContent = updateLineAttribute(newContent, elementLine, 'x2', elementData.x2 + dx);
            }
          }
          if (dy !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
            if (elementData.y2) {
              newContent = updateLineAttribute(newContent, elementLine, 'y2', elementData.y2 + dy);
            }
          }
        }
      }
    });
    setContent(newContent);
  }, [selectedElements, content, setContent]);

  const getElementDataFromContent = (content: string, lineNum: number) => {
    const lines = content.split(/\r?\n/);
    if (lineNum < 1 || lineNum > lines.length) return null;
    const line = lines[lineNum - 1];
    let x = 0;
    let y = 0;
    let x2 = 0;
    let y2 = 0;

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

  const handleDeleteSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    
    const lines = content.split(/\r?\n/);
    
    // 收集所有需要删除的行号范围
    const linesToDelete = new Set<number>();
    
    selectedElements.forEach((elementId) => {
      const lineNum = parseInt(elementId);
      if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) return;
      
      const line = lines[lineNum - 1];
      const trimmedLine = line.trim();
      
      // 判断是否是表格元素
      const isTableElement = trimmedLine.startsWith('##');
      
      if (isTableElement) {
        // 使用表格边界检测
        const { startLine, endLine } = detectTableBounds(content, lineNum);
        for (let i = startLine; i <= endLine; i++) {
          linesToDelete.add(i);
        }
      } else {
        // 使用note边界检测
        const { startLine, endLine } = detectNoteBounds(content, lineNum);
        for (let i = startLine; i <= endLine; i++) {
          linesToDelete.add(i);
        }
      }
    });
    
    // 从后往前删除，避免行号偏移
    const sortedLines = Array.from(linesToDelete).sort((a, b) => b - a);
    const newLines = [...lines];
    sortedLines.forEach(lineNum => {
      const index = lineNum - 1;
      if (index >= 0 && index < newLines.length) {
        newLines.splice(index, 1);
      }
    });
    
    // 清理多余的空行（删除区域前后的空行）
    let finalLines = newLines.filter((line, idx) => {
      if (line.trim() !== '') return true;
      // 如果是空行，检查上下是否都是空行或是文件开头/结尾
      const prevIsEmpty = idx === 0 || newLines[idx - 1]?.trim() === '';
      const nextIsEmpty = idx === newLines.length - 1 || newLines[idx + 1]?.trim() === '';
      // 只保留连续空行中的第一个
      return !(prevIsEmpty && nextIsEmpty);
    });
    
    // 移除末尾多余的空行
    while (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') {
      finalLines.pop();
    }
    
    const newContent = finalLines.join('\n');
    setContent(newContent);
    setSelectedElements([]);
  }, [selectedElements, content, setContent, setSelectedElements]);

  const [clipboardContent, setClipboardContent] = useState<string | null>(null);
  const [clipboardOriginalPos, setClipboardOriginalPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElements.length > 0) {
        e.preventDefault();
        const lines = content.split(/\r?\n/);
        const processedLineNums = new Set<number>();
        const allLinesToCopy: string[] = [];
        let firstElementPos: { x: number; y: number } | null = null;

        selectedElements
          .map((id) => parseInt(id))
          .filter((lineNum) => !isNaN(lineNum) && lineNum > 0 && lineNum <= lines.length)
          .forEach((lineNum) => {
            if (processedLineNums.has(lineNum)) return;

            const relatedLines = getElementRelatedLines(content, lineNum);
            const startLine = relatedLines[0];
            const endLine = relatedLines[relatedLines.length - 1];

            const coordMatch = lines[startLine - 1]?.match(/@\((\d+),\s*(\d+)\)/);
            if (!firstElementPos && coordMatch) {
              firstElementPos = { x: parseInt(coordMatch[1]), y: parseInt(coordMatch[2]) };
            }

            for (let i = startLine; i <= endLine; i++) {
              if (!processedLineNums.has(i)) {
                allLinesToCopy.push(lines[i - 1]);
                processedLineNums.add(i);
              }
            }
          });

        if (allLinesToCopy.length > 0) {
          setClipboardContent(allLinesToCopy.join('\n'));
          setClipboardOriginalPos(firstElementPos);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardContent) {
        const activeElement = document.activeElement;
        const isEditor = activeElement?.tagName === 'TEXTAREA' || 
                         activeElement?.getAttribute('contenteditable') === 'true' ||
                         activeElement?.closest('.monaco-editor');
        if (isEditor) return;

        e.preventDefault();
        const lines = content.split(/\r?\n/);
        let offsetX = 15;
        let offsetY = 15;

        if (selectedElements.length > 0) {
          const firstSelectedLine = selectedElements[0];
          const lineNum = parseInt(firstSelectedLine);
          if (!isNaN(lineNum) && lineNum > 0 && lineNum <= lines.length) {
            const relatedLines = getElementRelatedLines(content, lineNum);
            const startLine = relatedLines[0];
            const coordMatch = lines[startLine - 1]?.match(/@\((\d+),\s*(\d+)\)/);
            if (coordMatch) {
              const targetX = parseInt(coordMatch[1]);
              const targetY = parseInt(coordMatch[2]);
              if (clipboardOriginalPos) {
                offsetX = targetX - clipboardOriginalPos.x + 20;
                offsetY = targetY - clipboardOriginalPos.y + 20;
              } else {
                offsetX = 15;
                offsetY = 15;
              }
            }
          }
        }

        const adjustedContent = clipboardContent.replace(
          /@\((\d+),\s*(\d+)\)/g,
          (_, x, y) => `@(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
        ).replace(
          /->\((\d+),\s*(\d+)\)/g,
          (_, x, y) => `->(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
        );
        
        const currentContent = content.trimEnd();
        const newContent = `${currentContent}\n${adjustedContent}`;
        setContent(newContent);

        const newLines = adjustedContent.split(/\r?\n/);
        const startLineNum = currentContent.split(/\r?\n/).length + 1;
        const newElementIds: string[] = [];
        for (let i = 0; i < newLines.length; i++) {
          newElementIds.push((startLineNum + i).toString());
        }
        if (newElementIds.length > 0) {
          setSelectedElements(newElementIds);
        }
      }
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
        const isEditor = activeElement?.tagName === 'TEXTAREA' || 
                         activeElement?.getAttribute('contenteditable') === 'true' ||
                         activeElement?.closest('.monaco-editor');
        if (!isEditor) {
          setShowGrid(!showGrid);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeElement = document.activeElement;
        const isMonacoEditor = activeElement?.closest('.monaco-editor');
        const isTextInput = activeElement?.tagName === 'TEXTAREA' || 
                            activeElement?.getAttribute('contenteditable') === 'true';
        
        if (!isMonacoEditor && !isTextInput) {
          e.preventDefault();
          const lines = content.split(/\r?\n/);
          const allElementIds = lines
            .map((_, index) => (index + 1).toString())
            .filter((_, idx) => {
              return lines[idx].trim().length > 0;
            });
          setSelectedElements(allElementIds);
        }
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowShortcuts(prev => !prev);
      }
    };

    const handleKeyUpEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [undo, handleKeyDown, selectedElements, content, clipboardContent, clipboardOriginalPos]);

  return (
    <TabProvider activeTab={activeTab} onTabChange={(tabId) => handleTabChange(tabId as 'visual' | 'code')}>
      <div className="solarwire-mode">
        <div className="solarwire-header">
          <TabList className="solarwire-tabs">
            <Tab id="visual" title="可视化编辑">
              🎨
            </Tab>
            <Tab id="code" title="代码编辑">
              💻
            </Tab>
          </TabList>
        </div>
        
        {/* 固定工具栏：在 header 下方，仅在可视化编辑时显示 */}
        {activeTab === 'visual' && (
        <div className="solarwire-toolbar-fixed">
          <div className="solarwire-toolbar">
            <div className="toolbar-section pan-section">
              <button
                className={`pan-tool-button ${(isPanMode || isSpacePressed) ? 'active' : ''}`}
                onClick={() => setIsPanMode(!isPanMode)}
                title="Pan Mode: Hold space or click to toggle"
              >
                <span className="tool-icon">👆</span>
              </button>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section selection-section">
              <div className="selection-tools">
                {selectionTools.map(tool => (
                  <button
                    key={tool.id}
                    className={`selection-tool-button ${selectionTool === tool.id && !isPanMode && !isSpacePressed ? 'active' : ''}`}
                    onClick={() => {
                      setSelectionTool(tool.id as 'select' | 'box-include' | 'box-intersect');
                      setIsPanMode(false);
                    }}
                    title={tool.description}
                  >
                    <span className="tool-icon">{tool.icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section display-section">
              <button
                className={`note-toggle-button ${showNotes ? 'active' : ''}`}
                onClick={() => setShowNotes(!showNotes)}
                title={showNotes ? 'Hide Notes' : 'Show Notes'}
              >
                {showNotes ? '👁️' : '🙈'}
              </button>
              <button
                className={`grid-toggle-button ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title={showGrid ? 'Hide Grid (G)' : 'Show Grid (G)'}
              >
                ▦
              </button>
              <button
                className={`snap-toggle-button ${snapToGrid ? 'active' : ''}`}
                onClick={() => setSnapToGrid(!snapToGrid)}
                title={snapToGrid ? 'Disable Snap' : 'Enable Snap'}
              >
                🧲
              </button>
              <button
                className={`layers-toggle-button ${showLayerPanel ? 'active' : ''}`}
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                title="Toggle Layers Panel"
              >
                ☰
              </button>
              <div className="zoom-controls">
                <button className="zoom-button" onClick={handleZoomOut}>-</button>
                <span className="zoom-label">{zoomLevel}%</span>
                <button className="zoom-button" onClick={handleZoomIn}>+</button>
              </div>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section actions-section">
              <button
                className="action-button"
                onClick={handleBringToFront}
                disabled={selectedElements.length === 0}
                title="Bring to Front"
              >
                <span className="tool-icon">⬆️</span>
              </button>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section align-section">
              <button
                className="action-button"
                onClick={() => handleAlign('left')}
                disabled={selectedElements.length < 2}
                title="Align Left"
              >
                <span className="tool-icon">⬅️</span>
              </button>
              <button
                className="action-button"
                onClick={() => handleAlign('center-h')}
                disabled={selectedElements.length < 2}
                title="Align Center Horizontally"
              >
                <span className="tool-icon">↔️</span>
              </button>
              <button
                className="action-button"
                onClick={() => handleAlign('right')}
                disabled={selectedElements.length < 2}
                title="Align Right"
              >
                <span className="tool-icon">➡️</span>
              </button>
              <button
                className="action-button"
                onClick={() => handleAlign('top')}
                disabled={selectedElements.length < 2}
                title="Align Top"
              >
                <span className="tool-icon">⬆️</span>
              </button>
              <button
                className="action-button"
                onClick={() => handleAlign('center-v')}
                disabled={selectedElements.length < 2}
                title="Align Center Vertically"
              >
                <span className="tool-icon">↕️</span>
              </button>
              <button
                className="action-button"
                onClick={() => handleAlign('bottom')}
                disabled={selectedElements.length < 2}
                title="Align Bottom"
              >
                <span className="tool-icon">⬇️</span>
              </button>
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section elements-section">
              <ElementLibrary compact />
            </div>
            <div className="toolbar-divider"></div>
            <div className="toolbar-section help-section">
              <button
                className="help-button"
                onClick={() => setShowShortcuts(true)}
                title="Keyboard Shortcuts (?)"
              >
                ?
              </button>
            </div>
          </div>
        </div>
        )}

        <div className="solarwire-content">
          <TabPanel id="code">
            <div className="code-panel">
              <MonacoEditor
                language="solarwire"
                value={content}
                onChange={setContent}
                height="100%"
                highlightLines={highlightLines}
                scrollTrigger={scrollTrigger}
                highlightTrigger={highlightTrigger}
              />
            </div>
          </TabPanel>
          <TabPanel id="visual">
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
            />
            
            {/* 属性面板：固定右侧 */}
            {selectedElements.length > 0 && (
              <div className="property-panel-fixed">
                <PropertyPanel />
              </div>
            )}

            {/* 图层面板：固定左侧 */}
            {showLayerPanel && (
              <div className="layer-panel-fixed">
                <LayerPanel 
                  onSelectElement={(id) => setSelectedElements([id])}
                  onReorderElements={handleReorderElements}
                />
              </div>
            )}
          </TabPanel>
        </div>
      </div>

      <ShortcutPanel isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </TabProvider>
  );
}

export default SolarWireMode;
