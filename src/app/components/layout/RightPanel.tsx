import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import ComponentLibraryManagerMode from '../editor-modes/ComponentLibraryManagerMode';
import ImagePreview from '../editor/ImagePreview';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const { mode } = useEditorStore();
  const { selectedFile, currentSnippet } = useFileStore();
  const { selectedNodeId } = useComponentLibraryStore();

  // 使用文件路径作为key，确保文件切换时触发动画
  const fileKey = selectedFile ? selectedFile.path : 'none';
  const modeKey = `${mode}-${fileKey}`;

  // SolarWire 模式下，使用 snippet ID 作为 key 的一部分，确保切换 snippet 时触发动画
  const snippetKey = currentSnippet ? `${currentSnippet.id}-${currentSnippet.snippetIndex}` : 'none';
  const solarWireKey = `${modeKey}-${snippetKey}`;

  // 组件库模式下，使用选中的节点ID作为key的一部分，确保切换编辑时触发动画
  const componentLibraryKey = selectedNodeId ? `${modeKey}-${selectedNodeId}` : modeKey;

  switch (mode) {
    case 'image':
      return <ImagePreview key={modeKey} />;
    case 'markdown':
      return <MarkdownMode key={modeKey} />;
    case 'solarwire':
      return <SolarWireMode key={solarWireKey} />;
    case 'componentLibraryManager':
      return <ComponentLibraryManagerMode key={componentLibraryKey} />;
    case 'blank':
    default:
      return <BlankMode key={modeKey} />;
  }
};

export default RightPanel;
