import React, { useEffect, useState, useRef } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './MarkdownMode.css';

function MarkdownMode(): React.ReactElement {
  const { content, setContent } = useEditorStore();
  const { selectedFile, fullFileContent, currentSnippet, syncFullFileContent } = useFileStore();

  const currentFilePathRef = useRef<string | null>(null);
  const wasSnippetModeRef = useRef<boolean>(false);

  useEffect(() => {
    const isNowSnippetMode = !!currentSnippet;

    if (selectedFile && fullFileContent && !currentSnippet) {
      if (wasSnippetModeRef.current && currentFilePathRef.current === selectedFile.path) {
        setContent(fullFileContent);
        wasSnippetModeRef.current = false;
      }
      else if (currentFilePathRef.current !== selectedFile.path) {
        setContent(fullFileContent);
        currentFilePathRef.current = selectedFile.path;
      }
    }

    if (isNowSnippetMode) {
      wasSnippetModeRef.current = true;
    }
  }, [selectedFile?.path, fullFileContent, currentSnippet]);

  const handleChange = (value: string): void => {
    setContent(value);
    syncFullFileContent(value);
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
