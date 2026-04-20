import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import { useEditorStore } from '../../stores/editorStore';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const { mode } = useEditorStore();

  switch (mode) {
    case 'markdown':
      return <MarkdownMode />;
    case 'solarwire':
      return <SolarWireMode />;
    case 'blank':
    default:
      return <BlankMode />;
  }
};

export default RightPanel;
