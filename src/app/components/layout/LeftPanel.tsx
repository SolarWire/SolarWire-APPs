import React from 'react';
import ViewTabs from '../views/ViewTabs';
import { useAppStore } from '../../stores/appStore';
import './LeftPanel.css';

const LeftPanel: React.FC = () => {
  const { currentView } = useAppStore();

  return (
    <div className="left-panel">
      <ViewTabs />
    </div>
  );
};

export default LeftPanel;
