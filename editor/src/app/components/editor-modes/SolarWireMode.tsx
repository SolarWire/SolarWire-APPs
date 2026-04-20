import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWirePreview from '../editor/SolarWirePreview';
import PropertyPanel from '../editor/PropertyPanel';
import ElementLibrary from '../editor/ElementLibrary';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getElementRelatedLines, updateLineAttribute, bringElementsToFront, alignElements } from '../../../shared/utils/solarwire-utils';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './SolarWireMode.css';

function SolarWireMode(): React.ReactElement {
  const { content, setContent, undo } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet } = useFileStore();
  const { selectedElements, selectionTool, isPanMode, setSelectionTool, setIsPanMode, showNotes, setShowNotes, zoomLevel, setZoomLevel, isSpacePressed, setIsSpacePressed, setSelectedElements } = useSolarWireStore();
  const { primaryColor } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [highlightTrigger, setHighlightTrigger] = useState(0);

  const handleTabChange = useCallback((tab: 'visual' | 'code') => {
    setActiveTab(tab);
    // 切换到代码编辑器时，触发高亮更新（不滚动，保留之前的滚动位置）
    if (tab === 'code' && selectedElements.length > 0) {
      setHighlightTrigger(prev => prev + 1);
    }
  }, [selectedElements.length]);

  const selectionTools = [
    { id: 'select', label: 'Select', icon: '🖱️', description: 'Click to select, Shift+Click to multi-select' },
    { id: 'box-inclusive', label: 'Box Select', icon: '📦', description: 'Drag to box select (inclusive)' }
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

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 25));
  };

  // 将选中的元素ID转换为行号，包括note的多行内容
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
    // 只有当不是在编辑 snippet 时，才从 fileContent 加载内容
    if (selectedFile && fileContent && !currentSnippet) {
      setContent(fileContent);
    }
  }, [selectedFile, fileContent, currentSnippet, setContent]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 检查是否有输入框或编辑器有焦点
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

    // 检查是否按住了Shift键，如果是，则每次移动10px
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
            // 如果是线段元素，同时更新终点x坐标
            if (elementData.x2) {
              newContent = updateLineAttribute(newContent, elementLine, 'x2', elementData.x2 + dx);
            }
          }
          if (dy !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
            // 如果是线段元素，同时更新终点y坐标
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

    // 检查是否是线段元素，获取终点坐标
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

  // 处理空格键事件，实现临时激活视角移动状态
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // 方向键移动元素
      handleKeyDown(e);
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
  }, [undo, handleKeyDown]);

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
            />
            
            {/* 悬浮工具栏 */}
            <div className="solarwire-toolbar-floating">
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
                          setSelectionTool(tool.id as 'select' | 'box-inclusive');
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
              </div>
            </div>
            
            {/* 悬浮属性面板 */}
            {selectedElements.length > 0 && (
              <div className="sidebar-panel">
                <PropertyPanel />
              </div>
            )}
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
}

export default SolarWireMode;