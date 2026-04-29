import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import ComponentLibraryManagerMode from '../editor-modes/ComponentLibraryManagerMode';
import ImagePreview from '../editor/ImagePreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const { mode } = useEditorStore();
  const { selectedFile } = useFileStore();
  
  // 使用文件路径作为key，确保文件切换时触发动画
  const fileKey = selectedFile ? selectedFile.path : 'none';
  const modeKey = `${mode}-${fileKey}`;

  switch (mode) {
    case 'image':
      return <ImagePreview key={modeKey} />;
    case 'markdown':
      return <MarkdownMode key={modeKey} />;
    case 'solarwire':
      return <SolarWireMode key={modeKey} />;
    case 'componentLibraryManager':
      return <ComponentLibraryManagerMode key={modeKey} />;
    case 'blank':
    default:
      return <BlankMode key={modeKey} />;
  }
};

export default RightPanel;
