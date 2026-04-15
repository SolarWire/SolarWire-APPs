import React, { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import { useAppStore } from './stores/appStore';
import { useFileStore } from './stores/fileStore';
import { useSettingsStore } from './stores/settingsStore';
import './styles/global.css';

function App(): JSX.Element {
  const { setTheme } = useAppStore();
  const { openDirectoryAtPath, currentPath } = useFileStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // 初始化设置
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // 初始化主题（如果有保存的主题）
    const savedTheme = localStorage.getItem('solarwire-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    // 自动打开上次保存的文件夹
    if (!currentPath) {
      const lastPath = localStorage.getItem('solarwire-last-path');
      if (lastPath && openDirectoryAtPath) {
        openDirectoryAtPath(lastPath);
      }
    }
  }, [currentPath, openDirectoryAtPath]);

  // 当路径改变时，保存到localStorage
  useEffect(() => {
    if (currentPath) {
      localStorage.setItem('solarwire-last-path', currentPath);
    }
  }, [currentPath]);

  return (
    <div className="app">
      <AppLayout />
    </div>
  );
}

export default App;
