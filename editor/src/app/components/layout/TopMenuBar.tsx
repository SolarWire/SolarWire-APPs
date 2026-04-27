import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import SettingsModal from '../ui/SettingsModal';
import ComponentLibraryManagerModal from '../editor/ComponentLibraryManagerModal';
import './TopMenuBar.css';

const TopMenuBar: React.FC = () => {
  const { theme, setTheme } = useAppStore();
  const { saveFile } = useFileStore();
  const { isModified, mode } = useEditorStore();
  const isSpacePressed = useSolarWireStore(s => s.isSpacePressed);
  const setIsSpacePressed = useSolarWireStore(s => s.setIsSpacePressed);
  const { showComponentManager, setShowComponentManager } = useComponentLibraryStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        alert('File dialog is only available in the Electron app');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openDirectory'],
      });

      if (paths && paths.length > 0) {
        const { openDirectoryAtPath } = useFileStore.getState();
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
          title="Open Directory (Ctrl+O)"
        >
          📂
        </button>
        
        <button 
          className={`save-button ${isModified ? 'modified' : ''}`} 
          onClick={handleSave} 
          title="Save (Ctrl+S)"
          disabled={!isModified}
        >
          💾
        </button>
        
        <div className="spacer"></div>
        <button 
          className="theme-toggle-button" 
          data-testid="theme-toggle"
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          className="component-library-manager-button" 
          onClick={() => setShowComponentManager(true)} 
          title="组件库管理"
        >
          📦
        </button>
        <button 
          className="settings-button" 
          onClick={() => setIsSettingsOpen(true)} 
          title="Settings"
        >
          ⚙️
        </button>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      {showComponentManager && (
        <ComponentLibraryManagerModal onClose={() => setShowComponentManager(false)} />
      )}
    </>
  );
};

export default TopMenuBar;
