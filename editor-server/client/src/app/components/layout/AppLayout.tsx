import React, { useEffect } from 'react';
import MainContent from './MainContent';
import { useFileStore } from '../../stores/fileStore';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  const { saveFile } = useFileStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveFile]);

  return (
    <div className="app-layout">
      <MainContent />
    </div>
  );
};

export default AppLayout;
