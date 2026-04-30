import React, { useEffect, useState, useRef } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './MarkdownMode.css';

/**
 * Markdown 编辑模式组件
 * 提供 Markdown 文档的编辑和预览功能
 */
function MarkdownMode(): React.ReactElement {
  // 编辑器内容和设置内容的方法
  const { content, setContent } = useEditorStore();
  // 文件相关状态
  const { selectedFile, fileContent, currentSnippet, updateFileContent } = useFileStore();
  
  // 跟踪当前文件路径，只在文件切换时加载内容
  const currentFilePathRef = useRef<string | null>(null);
  // 跟踪是否为snippet模式
  const wasSnippetModeRef = useRef<boolean>(false);

  // 加载选中文件的内容
  useEffect(() => {
    const isNowSnippetMode = !!currentSnippet;
    
    if (selectedFile && fileContent && !currentSnippet) {
      // 从snippet模式切换到md模式时，需要重新加载完整内容
      if (wasSnippetModeRef.current && currentFilePathRef.current === selectedFile.path) {
        setContent(fileContent);
        wasSnippetModeRef.current = false;
      }
      // 只在文件路径变化时才加载内容
      else if (currentFilePathRef.current !== selectedFile.path) {
        setContent(fileContent);
        currentFilePathRef.current = selectedFile.path;
      }
    }
    
    // 更新snippet模式状态
    if (isNowSnippetMode) {
      wasSnippetModeRef.current = true;
    }
  }, [selectedFile?.path, fileContent, currentSnippet]);

  /**
   * 处理内容变化
   * @param value 新内容
   */
  const handleChange = (value: string): void => {
    setContent(value);
  };

  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');

  return (
    <TabProvider activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as 'preview' | 'editor')}>
      <div className="markdown-mode">
        <TabList className="markdown-tabs">
          <Tab id="preview" title="预览">
            👁️
          </Tab>
          <Tab id="editor" title="编辑器">
            ✏️
          </Tab>
        </TabList>
        <div className="markdown-content">
          <TabPanel id="editor">
            <MonacoEditor
              language="markdown"
              value={content}
              onChange={handleChange}
              height="100%"
              preserveScrollPosition={true}
              scrollKey="markdown-editor"
            />
          </TabPanel>
          <TabPanel id="preview">
            <MarkdownPreview />
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
}

export default MarkdownMode;