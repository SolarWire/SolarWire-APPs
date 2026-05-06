import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { useAppStore } from './stores/appStore';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import { useI18nStore } from './stores/i18nStore';
import { EditorProvider } from './context/EditorContext';
import { FeedbackProvider } from './components/feedback/FeedbackProvider';
import { systemMonitorService } from './services/system-monitor-service';
import './styles/global.css';

function App(): React.ReactElement {
  const { setTheme } = useAppStore();
  const { openDirectoryAtPath, currentPath } = useFileStore();
  const { loadSettings } = useSettingsStore();
  const { loadLanguage } = useI18nStore();

  useEffect(() => {
    loadSettings();
    loadLanguage();
  }, [loadSettings, loadLanguage]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('solarwire-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    if (!currentPath) {
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

  // 清理系统监控服务
  useEffect(() => {
    return () => {
      systemMonitorService.destroy();
    };
  }, []);

  return (
    <EditorProvider>
      <div className="app">
        <AppLayout />
        <FeedbackProvider />
      </div>
    </EditorProvider>
  );
}

export default App;
