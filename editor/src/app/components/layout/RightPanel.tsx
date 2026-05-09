import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import TableMode from '../editor-modes/TableMode';
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

  const fileKey = selectedFile ? selectedFile.path : 'none';
  const modeKey = `${mode}-${fileKey}`;

  const snippetKey = currentSnippet ? `${currentSnippet.id}-${currentSnippet.snippetIndex}` : 'none';
  const solarWireKey = `${modeKey}-${snippetKey}`;

  const componentLibraryKey = selectedNodeId ? `${modeKey}-${selectedNodeId}` : modeKey;

  switch (mode) {
    case 'image':
      return <ImagePreview key={modeKey} />;
    case 'markdown':
      return <MarkdownMode key={modeKey} />;
    case 'solarwire':
      return <SolarWireMode key={solarWireKey} />;
    case 'table':
      return <TableMode key={modeKey} />;
    case 'componentLibraryManager':
      return <ComponentLibraryManagerMode key={componentLibraryKey} />;
    case 'blank':
    default:
      return <BlankMode key={modeKey} />;
  }
};

export default RightPanel;
