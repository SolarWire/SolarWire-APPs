import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/Toast';
import { useAppStore } from './stores/appStore';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import './styles/global.css';
import './components/ui/Toast.css';

function App(): React.ReactElement {
  const { setTheme } = useAppStore();
  const { openDirectoryAtPath, currentPath } = useFileStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  return (
    <>
      <div className="app">
        <AppLayout />
      </div>
      <ToastContainer />
    </>
  );
}

export default App;
