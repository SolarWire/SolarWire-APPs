import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useTranslation } from '../../hooks/useTranslation';
import { showToast } from '../../services/toast-service';
import SettingsModal from '../ui/SettingsModal';
import './TopMenuBar.css';

const TopMenuBar: React.FC = () => {
  const { theme, setTheme, setCurrentView } = useAppStore();
  const { saveFile, openDirectoryAtPath } = useFileStore();
  const { isModified, mode } = useEditorStore();
  const isSpacePressed = useSolarWireStore(s => s.isSpacePressed);
  const setIsSpacePressed = useSolarWireStore(s => s.setIsSpacePressed);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSave = async () => {
    await saveFile();
  };

  const handleOpen = async () => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        showToast('File dialog is only available in the Electron app', 'error');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openDirectory'],
      });

      if (paths && paths.length > 0) {
        if (openDirectoryAtPath) {
          await openDirectoryAtPath(paths[0]);
        }
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  return (
    <>
      <div className="top-menu-bar menu-bar" data-testid="menu-bar">
        <img className="app-logo" src="/logo.svg" alt="SolarWire" />
        
        <button 
          className="open-button" 
          onClick={handleOpen} 
          title={t.file.openFile}
        >
          📂
        </button>
        
        <button 
          className={`save-button ${isModified ? 'modified' : ''}`} 
          onClick={handleSave} 
          title={t.file.saveFile}
          disabled={!isModified}
        >
          💾
        </button>
        
        <div className="spacer"></div>
        <button 
          className="theme-toggle-button" 
          data-testid="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          className="settings-button" 
          onClick={() => setIsSettingsOpen(true)} 
          aria-label="Open settings"
        >
          ⚙️
        </button>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default TopMenuBar;
