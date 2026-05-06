import React, { useState } from 'react';
import { useStatusStore } from '../../stores/statusStore';
import { useAppStore } from '../../stores/appStore';
import SettingsModal from '../ui/SettingsModal';
import './LeftPanelFooter.css';

const LeftPanelFooter: React.FC = () => {
  const { filePath, fileStatus, editorStatus } = useStatusStore();
  const { theme, setTheme } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fileName = filePath ? filePath.split(/[/\\]/).pop() || '' : '';
  const { isModified, cursorPosition } = fileStatus;
  const { mode, zoom } = editorStatus;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const contextStatus = mode === 'solarwire'
    ? `${zoom}%`
    : `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`;

  return (
    <>
      <div className="left-panel-footer">
        <div className="left-panel-footer-info">
          <div className="left-panel-footer-file">
            📄 {fileName}
            {isModified && <span className="modified-dot"> ●</span>}
          </div>
          <div className="left-panel-footer-status">
            {contextStatus}
          </div>
        </div>
        <div className="left-panel-footer-actions">
          <button
            className="left-panel-footer-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换亮色主题' : '切换暗色主题'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="left-panel-footer-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default LeftPanelFooter;
