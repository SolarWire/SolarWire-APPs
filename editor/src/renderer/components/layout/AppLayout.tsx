import React from 'react';
import TopMenuBar from './TopMenuBar';
import MainContent from './MainContent';
import StatusBar from './StatusBar';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <TopMenuBar />
      <MainContent />
      <StatusBar />
    </div>
  );
};

export default AppLayout;
