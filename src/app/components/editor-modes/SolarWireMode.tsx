import React, { useState, useCallback, useEffect } from 'react';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWireVisualEditor from '../editor/SolarWireVisualEditor';
import ErrorPanel from '../editor/ErrorPanel';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { getElementRelatedLines } from '../../../shared/utils/solarwire-utils';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import './SolarWireMode.css';

/**
 * SolarWire 编辑模式组件
 * 提供可视化编辑和代码编辑两种模式
 */
function SolarWireMode(): React.ReactElement {
  // 编辑器内容和设置内容的方法
  const { content, setContent, undo } = useEditorStore();
  // 文件相关状态
  const { selectedFile, fileContent, currentSnippet, setFileContent } = useFileStore();
  // 选中的元素 ID 列表
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  // 选择元素的方法
  const setSelectedElements = useSolarWireStore(s => s.setSelectedElements);
  // 缩放级别
  const zoomLevel = useSolarWireStore(s => s.zoomLevel);
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  // 滚动触发器
  const [scrollTrigger, setScrollTrigger] = useState(0);
  // 高亮触发器
  const [highlightTrigger, setHighlightTrigger] = useState(0);
  // 语法错误状态 - 使用统一的语法错误服务
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);

  // 监听语法错误服务
  useEffect(() => {
    const listener = {
      onErrorsChanged: (errors: SyntaxError[]) => {
        setSyntaxErrors(errors);
      }
    };

    syntaxErrorService.addListener(listener);
    return () => {
      syntaxErrorService.removeListener(listener);
    };
  }, []);

  // 监听错误跳转事件
  useEffect(() => {
    const handleJumpToErrorEvent = (event: CustomEvent) => {
      const { line, column } = event.detail;
      
      // 切换到代码编辑tab
      setActiveTab('code');
      
      // 设置滚动触发器，让编辑器跳转到错误行
      setTimeout(() => {
        // 不临时设置错误状态，直接使用当前的错误状态
        setScrollTrigger(prev => prev + 1);
        setHighlightTrigger(prev => prev + 1);
      }, 100);
    };

    window.addEventListener('jumpToError', handleJumpToErrorEvent as EventListener);
    return () => {
      window.removeEventListener('jumpToError', handleJumpToErrorEvent as EventListener);
    };
  }, []);

  /**
   * 处理内容变化，同步到 fileStore
   */
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setFileContent(newContent);
    
    // 触发实时渲染器检测
    syntaxErrorService.runRendererCheck(newContent);
  }, [setContent, setFileContent]);

  /**
   * 处理错误跳转
   * 切换到代码编辑tab并定位到错误行
   */
  const handleJumpToError = useCallback((line: number, column: number) => {
    // 切换到代码编辑tab
    setActiveTab('code');
    
    // 设置滚动触发器，让编辑器跳转到错误行
    setTimeout(() => {
      setScrollTrigger(prev => prev + 1);
      setHighlightTrigger(prev => prev + 1);
    }, 100);
  }, []);

  /**
   * 处理标签页切换
   * @param tab 标签页类型
   */
  const handleTabChange = useCallback((tab: 'visual' | 'code') => {
    setActiveTab(tab);
    if (tab === 'code' && selectedElements.length > 0) {
      // 延迟触发，确保 TabPanel 已经挂载
      setTimeout(() => {
        setScrollTrigger(prev => prev + 1);
        setHighlightTrigger(prev => prev + 1);
      }, 50);
    }
  }, [selectedElements.length]);

  /**
   * 计算需要高亮的行号
   */
  const highlightLines = React.useMemo(() => {
    if (selectedElements.length === 0) return [];
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

  // 同步文件内容到编辑器
  useEffect(() => {
    if (selectedFile && fileContent && !currentSnippet) {
      if (content !== fileContent) {
        setContent(fileContent);
      }
    }
  }, [selectedFile?.path, fileContent, currentSnippet, content]);

  // 同步 editorStore.content 到 fileStore.fileContent，确保保存功能正常工作
  useEffect(() => {
    if (selectedFile) {
      const { setFileContent } = useFileStore.getState();
      setFileContent(content);
    }
  }, [content, selectedFile]);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDownEvent);
    return () => window.removeEventListener('keydown', handleKeyDownEvent);
  }, [undo]);

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
                onChange={handleContentChange}
                height="100%"
                highlightLines={highlightLines}
                errorLines={syntaxErrors.map(e => e.line)}
                scrollTrigger={scrollTrigger}
                highlightTrigger={highlightTrigger}
              />
              {syntaxErrors.length > 0 && (
                <ErrorPanel 
                  errors={syntaxErrors}
                  onJumpToError={handleJumpToError}
                />
              )}
            </div>
          </TabPanel>
          <TabPanel id="visual">
            <SolarWireVisualEditor
              content={content}
              onContentChange={handleContentChange}
              syntaxErrors={syntaxErrors}
              setSyntaxErrors={setSyntaxErrors}
            />
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
}

export default SolarWireMode;
