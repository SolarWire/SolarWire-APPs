import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useAppStore } from '../../stores/appStore';
import { feedback } from '../../stores/feedbackStore';
import { getNextTheme, THEME_LIST } from '../../../shared/types/app';
import './LeftPanelHeader.css';

const LeftPanelHeader: React.FC = () => {
  const { saveFile, openDirectoryAtPath } = useFileStore();
  const { isModified } = useEditorStore();
  const { theme, setTheme, openSettings } = useAppStore();

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

  const toggleTheme = () => {
    setTheme(getNextTheme(theme));
  };

  const currentThemeItem = THEME_LIST.find(t => t.id === theme);

  return (
    <div className="left-panel-header">
      <div className="left-panel-header-left">
        <img className="left-panel-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="SolarWire" />
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
      <div className="left-panel-header-right">
        <button
          className="left-panel-action-btn"
          onClick={toggleTheme}
          title={currentThemeItem?.label ?? '切换主题'}
        >
          {currentThemeItem?.icon ?? '🎨'}
        </button>
        <button
          className="left-panel-action-btn"
          onClick={openSettings}
          title="设置"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default LeftPanelHeader;
