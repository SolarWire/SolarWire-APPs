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
  const { openDirectoryAtPath, openFileAtPath, currentPath } = useFileStore();
  const { loadSettings } = useSettingsStore();
  const { loadLanguage } = useI18nStore();
  const pendingOpenPathRef = React.useRef<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadLanguage();
  }, [loadSettings, loadLanguage]);

  useEffect(() => {
    const api = (window as any).api;
    if (!api || !api.onOpenPath) return;

    const cleanup = api.onOpenPath(async (data: { filePath: string | null; dirPath: string | null }) => {
      if (data.filePath) {
        pendingOpenPathRef.current = data.filePath;
        if (openFileAtPath) {
          await openFileAtPath(data.filePath);
        }
      } else if (data.dirPath) {
        pendingOpenPathRef.current = data.dirPath;
        if (openDirectoryAtPath) {
          await openDirectoryAtPath(data.dirPath);
        }
      }
    });

    return cleanup;
  }, [openFileAtPath, openDirectoryAtPath]);

  useEffect(() => {
    if (!currentPath && !pendingOpenPathRef.current) {
      const lastPath = localStorage.getItem('solarwire-last-path');
      if (lastPath && openDirectoryAtPath) {
        openDirectoryAtPath(lastPath);
      }
    }
  }, [currentPath, openDirectoryAtPath]);

  useEffect(() => {
    if (currentPath) {
      localStorage.setItem('solarwire-last-path', currentPath);
    }
  }, [currentPath]);

  return (
    <div className="app">
      <AppLayout />
      <FeedbackProvider />
      <SettingsModal isOpen={settingsModalOpen} onClose={closeSettings} />
    </div>
  );
}

export default App;
