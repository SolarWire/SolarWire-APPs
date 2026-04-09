import React from 'react';
import BlankMode from '../editor-modes/BlankMode';
import MonacoMode from '../editor-modes/MonacoMode';
import SolarWireMode from '../editor-modes/SolarWireMode';
import MarkdownMode from '../editor-modes/MarkdownMode';
import VersionDiffMode from '../editor-modes/VersionDiffMode';
import { useEditorStore } from '../../stores/editorStore';
import { useGitStore } from '../../stores/gitStore';
import './RightPanel.css';

const RightPanel: React.FC = () => {
  const { mode } = useEditorStore();
  const { isDiffMode } = useGitStore();

  if (isDiffMode) {
    return (
      <div className="right-panel" style={{ height: '100%' }}>
        <VersionDiffMode />
      </div>
    );
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

  return (
    <div className="right-panel" style={{ height: '100%' }}>
      {renderEditorMode()}
    </div>
  );
};

export default RightPanel;
