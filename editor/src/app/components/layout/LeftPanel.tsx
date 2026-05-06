import React from 'react';
import ViewTabs from '../views/ViewTabs';
import LeftPanelHeader from './LeftPanelHeader';
import LeftPanelFooter from './LeftPanelFooter';
import './LeftPanel.css';

const LeftPanel: React.FC = () => {
  return (
    <div className="left-panel">
      <LeftPanelHeader />
      <ViewTabs />
      <LeftPanelFooter />
    </div>
  );
};

export default LeftPanel;
