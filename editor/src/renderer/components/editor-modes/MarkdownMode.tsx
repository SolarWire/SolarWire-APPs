import React, { useEffect, useState } from 'react';
import MonacoEditor from '../editor/MonacoEditor';
import ResizableDivider from '../ui/ResizableDivider';
import MarkdownPreview from '../editor/MarkdownPreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import './MarkdownMode.css';

function MarkdownMode(): JSX.Element {
  const { content, setContent } = useEditorStore();
  const { selectedFile, fileContent, currentSnippet, updateFileContent } = useFileStore();
  const [editorPanelWidth, setEditorPanelWidth] = useState(300);

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

  const handleEditorPanelResize = (newWidth: number) => {
    setEditorPanelWidth(newWidth);
  };

  return (
    <div className="markdown-mode" style={{ height: '100%' }}>
      <div className="editor-panel" style={{ width: `${editorPanelWidth}px`, height: '100%' }}>
        <MonacoEditor
          language="markdown"
          value={content}
          onChange={handleChange}
          height="100%"
        />
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleEditorPanelResize}
        currentSize={editorPanelWidth}
        minSize={200}
        maxSize={800}
      />
      <div className="preview-panel" style={{ height: '100%' }}>
        <MarkdownPreview />
      </div>
    </div>
  );
}

export default MarkdownMode;