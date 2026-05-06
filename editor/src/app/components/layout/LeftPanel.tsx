import React from 'react';
import ViewTabs from '../views/ViewTabs';
import LeftPanelHeader from './LeftPanelHeader';
import './LeftPanel.css';

const LeftPanel: React.FC = () => {
  return (
    <div className="left-panel">
      <LeftPanelHeader />
      <ViewTabs />
    </div>
  );
};

export default LeftPanel;
