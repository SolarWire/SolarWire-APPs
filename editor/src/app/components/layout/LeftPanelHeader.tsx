import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { feedback } from '../../stores/feedbackStore';
import './LeftPanelHeader.css';

const LeftPanelHeader: React.FC = () => {
  const { saveFile, openDirectoryAtPath } = useFileStore();
  const { isModified } = useEditorStore();

  const handleOpen = async () => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        feedback.toast.error('此功能仅在Electron应用中可用');
        return;
      }
      const paths: string[] = await api.openFileDialog({ properties: ['openDirectory'] });
      if (paths && paths.length > 0 && openDirectoryAtPath) {
        await openDirectoryAtPath(paths[0]);
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  const handleSave = async () => {
    await saveFile();
  };

  return (
    <div className="left-panel-header">
      <img className="left-panel-logo" src="/logo.svg" alt="SolarWire" />
      <div className="left-panel-actions">
        <button
          className="left-panel-action-btn"
          onClick={handleOpen}
          title="打开目录"
        >
          📂
        </button>
        <button
          className={`left-panel-action-btn ${isModified ? 'modified' : ''}`}
          onClick={handleSave}
          disabled={!isModified}
          title="保存"
        >
          💾
        </button>
      </div>
    </div>
  );
};

export default LeftPanelHeader;
