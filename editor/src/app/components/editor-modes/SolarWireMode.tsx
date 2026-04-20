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
import { getElementRelatedLines, updateLineAttribute, bringElementsToFront, alignElements } from '../../../shared/utils/solarwire-utils';
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
    const sortedElementIds = selectedElements
      .map(id => parseInt(id))
      .filter(lineNum => !isNaN(lineNum))
      .sort((a, b) => b - a);
    
    const newLines = [...lines];
    sortedElementIds.forEach(lineNum => {
      const lineIndex = lineNum - 1;
      if (lineIndex >= 0 && lineIndex < newLines.length) {
        newLines.splice(lineIndex, 1);
      }
    });
    
    const newContent = newLines.join('\n');
    setContent(newContent);
    setSelectedElements([]);
  }, [selectedElements, content, setContent, setSelectedElements]);

  const [clipboardContent, setClipboardContent] = useState<string | null>(null);

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
        const selectedLines = selectedElements
          .map((id) => parseInt(id))
          .filter((lineNum) => !isNaN(lineNum) && lineNum > 0 && lineNum <= lines.length)
          .map((lineNum) => lines[lineNum - 1]);
        if (selectedLines.length > 0) {
          setClipboardContent(selectedLines.join('\n'));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboardContent && !e.target) {
        const activeElement = document.activeElement;
        const isEditor = activeElement?.tagName === 'TEXTAREA' || 
                         activeElement?.getAttribute('contenteditable') === 'true' ||
                         activeElement?.closest('.monaco-editor');
        if (isEditor) return;

        e.preventDefault();
        const offset = 15;
        const adjustedContent = clipboardContent.replace(
          /@\((\d+),\s*(\d+)\)/g,
          (_, x, y) => `@(${parseInt(x) + offset}, ${parseInt(y) + offset})`
        ).replace(
          /->\((\d+),\s*(\d+)\)/g,
          (_, x, y) => `->(${parseInt(x) + offset}, ${parseInt(y) + offset})`
        );
        
        const currentContent = content.trimEnd();
        const newContent = `${currentContent}\n${adjustedContent}`;
        setContent(newContent);
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
        
        {/* 固定工具栏：在 header 下方 */}
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
                <LayerPanel onSelectElement={(id) => setSelectedElements([id])} />
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
