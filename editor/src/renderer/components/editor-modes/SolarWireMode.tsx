import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import ResizableDivider from '../ui/ResizableDivider';
import SolarWirePreview from '../editor/SolarWirePreview';
import PropertyPanel from '../editor/PropertyPanel';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSolarWireUIStore } from '../../stores/solarWireUIStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getElementRelatedLines, updateLineAttribute, updateLineCoords } from '../../utils/solarwire-utils';
import './SolarWireMode.css';

function SolarWireMode(): JSX.Element {
  const { content, setContent, undo } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet } = useFileStore();
  const { selectedElements, selectionTool, isPanMode } = useSolarWireStore();
  const { showNotes, setShowNotes, zoomLevel, setZoomLevel, isSpacePressed, setIsSpacePressed } = useSolarWireUIStore();
  const { primaryColor } = useSettingsStore();
  const [codePanelWidth, setCodePanelWidth] = useState(300);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(250);

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

    // 检查是否按住 shift 键
    const step = e.shiftKey ? 10 : 1;
    
    let dx = 0;
    let dy = 0;

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
          if (elementData.isLine && elementData.x2 !== null && elementData.y2 !== null) {
            // 线段：使用 updateLineCoords 一次性更新所有坐标
            newContent = updateLineCoords(
              newContent, elementLine,
              elementData.x + dx, elementData.y + dy,
              elementData.x2 + dx, elementData.y2 + dy
            );
          } else {
            if (dx !== 0) {
              newContent = updateLineAttribute(newContent, elementLine, 'x', elementData.x + dx);
            }
            if (dy !== 0) {
              newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
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
    let x2: number | null = null;
    let y2: number | null = null;
    let isLine = false;

    // 检查是否是线段元素：以 -- 开头
    if (line.trimStart().startsWith('--')) {
      isLine = true;
    }

    // 尝试匹配 @(x1,y1)->(x2,y2) 格式
    const lineCoordPattern = /@\((\d+),\s*(\d+)\)->\((\d+),\s*(\d+)\)/;
    const lineMatch = line.match(lineCoordPattern);
    if (lineMatch) {
      x = parseInt(lineMatch[1]);
      y = parseInt(lineMatch[2]);
      x2 = parseInt(lineMatch[3]);
      y2 = parseInt(lineMatch[4]);
    } else {
      // 尝试匹配 @(x1,y1) 格式（只有起点）
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
      
      // 如果是线段，也获取 x2 和 y2
      if (isLine) {
        const x2Match = line.match(/x2=(\d+)/);
        const y2Match = line.match(/y2=(\d+)/);
        if (x2Match) x2 = parseInt(x2Match[1]);
        if (y2Match) y2 = parseInt(y2Match[1]);
      }
    }

    return { x, y, x2, y2, isLine };
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

  const handleCodePanelResize = (newWidth: number) => {
    setCodePanelWidth(newWidth);
  };

  const handlePreviewPanelResize = (newWidth: number) => {
    setPreviewPanelWidth(newWidth);
  };

  return (
    <div className="solarwire-mode" style={{ height: '100%' }}>
      <div className="code-panel" style={{ width: `${codePanelWidth}px`, height: '100%' }}>
        <MonacoEditor
          language="solarwire"
          value={content}
          onChange={setContent}
          height="100%"
          highlightLines={highlightLines}
          primaryColor={primaryColor}
        />
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleCodePanelResize}
        currentSize={codePanelWidth}
        minSize={200}
        maxSize={600}
      />
      <div className="preview-panel" style={{ flex: 1, minWidth: '200px', height: '100%', position: 'relative' }}>
        <div className="preview-content" style={{ height: '100%' }}>
          <SolarWirePreview 
            zoomLevel={zoomLevel}
            selectionTool={selectionTool}
            showNotes={showNotes}
            onZoomChange={setZoomLevel}
            isPanMode={isPanMode}
            isSpacePressed={isSpacePressed}
          />
        </div>
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handlePreviewPanelResize}
        currentSize={previewPanelWidth}
        minSize={200}
        maxSize={400}
        reverse={true}
      />
      <div className="sidebar-panel" style={{ width: `${previewPanelWidth}px`, height: '100%' }}>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default SolarWireMode;
