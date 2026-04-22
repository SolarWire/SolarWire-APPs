import React, { useEffect, useState } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './MarkdownMode.css';

function MarkdownMode(): React.ReactElement {
  const { content, setContent } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet, updateFileContent } = useFileStore();

  // 加载选中文件的内容
  useEffect(() => {
    if (selectedFile && fileContent && !currentSnippet) {
      const editorContent = useEditorStore.getState().content;
      if (editorContent !== fileContent) {
        setContent(fileContent);
      }
    }
  }, [selectedFile?.path, fileContent, currentSnippet]);

  const handleChange = (value: string): void => {
    setContent(value);
    if (selectedFile) {
      updateFileContent(selectedFile, value);
    }
  };

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