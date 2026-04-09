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
import { getElementRelatedLines, updateLineAttribute } from '../../utils/solarwire-utils';
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
      activeElement.isContentEditable ||
      (activeElement as any).classList?.contains('monaco-editor')
    );
    
    if (isEditing || selectedElements.length === 0) return;

    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp':
        dy = -1;
        break;
      case 'ArrowDown':
        dy = 1;
        break;
      case 'ArrowLeft':
        dx = -1;
        break;
      case 'ArrowRight':
        dx = 1;
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
          }
          if (dy !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
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

    return { x, y };
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
