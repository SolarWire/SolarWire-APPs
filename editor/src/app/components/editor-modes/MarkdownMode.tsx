import React, { useEffect, useState } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import './MarkdownMode.css';

function MarkdownMode(): JSX.Element {
  const { content, setContent } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet, updateFileContent } = useFileStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');

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
    <div className="markdown-mode" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="markdown-tabs">
        <button 
          className={`markdown-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          title="预览"
        >
          <span className="tab-icon">{/* 眼睛图标 */}</span>
          预览
        </button>
        <button 
          className={`markdown-tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
          title="编辑器"
        >
          <span className="tab-icon">{/* 代码图标 */}</span>
          编辑器
        </button>
      </div>
      <div className="markdown-content" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'editor' ? (
          <MonacoEditor
            language="markdown"
            value={content}
            onChange={handleChange}
            height="100%"
          />
        ) : (
          <MarkdownPreview />
        )}
      </div>
    </div>
  );
}

export default MarkdownMode;