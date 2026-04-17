import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import VersionDiffMode from '../editor-modes/VersionDiffMode';
import { useEditorStore } from '../../stores/editorStore';
import { useGitDiffStore } from '../../stores/gitDiffStore';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const { mode } = useEditorStore();
  const { isDiffMode } = useGitDiffStore();

  if (isDiffMode) {
    return <VersionDiffMode />;
  }

  const renderEditorMode = () => {
    switch (mode) {
      case 'markdown':
        return <MarkdownMode />;
      case 'solarwire':
        return <SolarWireMode />;
      case 'version':
        return <VersionDiffMode />;
      case 'blank':
      default:
        return <BlankMode />;
    }
  };

  return renderEditorMode();
};

export default RightPanel;
