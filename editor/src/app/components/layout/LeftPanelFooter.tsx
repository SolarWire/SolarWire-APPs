import React from 'react';
import { useStatusStore } from '../../stores/statusStore';
import { useAppStore } from '../../stores/appStore';
import { getNextTheme, THEME_LIST } from '../../../shared/types/app';
import './LeftPanelFooter.css';

const LeftPanelFooter: React.FC = () => {
  const { filePath, fileStatus, editorStatus } = useStatusStore();
  const { theme, setTheme, openSettings } = useAppStore();

  const fileName = filePath ? filePath.split(/[/\\]/).pop() || '' : '';
  const { isModified, cursorPosition } = fileStatus;
  const { mode, zoom } = editorStatus;

  const toggleTheme = () => {
    setTheme(getNextTheme(theme));
  };

  const currentThemeItem = THEME_LIST.find(t => t.id === theme);

  const contextStatus = mode === 'solarwire'
    ? `${zoom}%`
    : `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`;

  return (
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
          title={currentThemeItem?.label ?? '切换主题'}
        >
          {currentThemeItem?.icon ?? '🎨'}
        </button>
        <button
          className="left-panel-footer-btn"
          onClick={openSettings}
          title="设置"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default LeftPanelFooter;
