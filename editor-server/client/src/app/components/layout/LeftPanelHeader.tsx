import React, { useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useAppStore } from '../../stores/appStore';
import { getNextTheme, THEME_LIST } from '../../../shared/types/app';
import UploadModal from '../editor/UploadModal';
import './LeftPanelHeader.css';

const LeftPanelHeader: React.FC = () => {
  const { saveFile } = useFileStore();
  const { isModified } = useEditorStore();
  const { theme, setTheme, openSettings } = useAppStore();
  const [showUploadModal, setShowUploadModal] = useState(false);

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
          onClick={() => setShowUploadModal(true)}
          title="上传文件到指定目录"
        >
          📁
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

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};

export default LeftPanelHeader;