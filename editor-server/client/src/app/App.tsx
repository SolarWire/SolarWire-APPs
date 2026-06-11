import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import SettingsModal from './components/ui/SettingsModal';
import { useAppStore } from './stores/appStore';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import { useI18nStore } from './stores/i18nStore';
import { FeedbackProvider } from './components/feedback/FeedbackProvider';
import './styles/global.css';

function App(): React.ReactElement {
  const { settingsModalOpen, closeSettings } = useAppStore();
  const { openDirectoryAtPath, currentPath } = useFileStore();
  const { loadSettings } = useSettingsStore();
  const { loadLanguage } = useI18nStore();

  useEffect(() => {
    loadSettings();
    loadLanguage();
  }, [loadSettings, loadLanguage]);

  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const api = window.api;
        if (api?.getDefaultDirectory) {
          const defaultDir = await api.getDefaultDirectory();
          if (defaultDir && openDirectoryAtPath) {
            await openDirectoryAtPath(defaultDir);
          }
        }
      } catch (err) {
        console.warn('Failed to initialize workspace:', err);
      }
    };

    if (!currentPath) {
      initWorkspace();
    }
  }, [currentPath, openDirectoryAtPath]);

  return (
    <div className="app">
      <AppLayout />
      <FeedbackProvider />
      <SettingsModal isOpen={settingsModalOpen} onClose={closeSettings} />
    </div>
  );
}

export default App;