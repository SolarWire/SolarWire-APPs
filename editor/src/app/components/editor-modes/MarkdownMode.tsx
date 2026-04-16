import React, { useEffect } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './MarkdownMode.css';

function MarkdownMode(): JSX.Element {
  const { content, setContent } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet, updateFileContent } = useFileStore();

  // 加载选中文件的内容
  useEffect(() => {
    // 只有当不是在编辑 snippet 时，才从 fileContent 加载内容
    if (selectedFile && fileContent && !currentSnippet) {
      setContent(fileContent);
    }
  }, [selectedFile, fileContent, currentSnippet, setContent]);

  const handleChange = (value: string): void => {
    setContent(value);
    if (selectedFile) {
      updateFileContent(selectedFile, value);
    }
  };

  return (
    <TabProvider defaultTab="preview">
      <div className="markdown-mode">
        <TabList className="markdown-tabs">
          <Tab id="preview" title="预览">
            预览
          </Tab>
          <Tab id="editor" title="编辑器">
            编辑器
          </Tab>
        </TabList>
        <div className="markdown-content">
          <TabPanel id="editor">
            <MonacoEditor
              language="markdown"
              value={content}
              onChange={handleChange}
              height="100%"
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