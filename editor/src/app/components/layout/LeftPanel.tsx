import React, { useState } from 'react';
import ViewTabs from '../views/ViewTabs';
import VersionGitTabs from '../views/VersionGitTabs';
import ResizableDivider from '../ui/ResizableDivider';
import { useAppStore } from '../../stores/appStore';
import './LeftPanel.css';

const LeftPanel: React.FC = () => {
  const { currentView } = useAppStore();
  const [topPanelHeight, setTopPanelHeight] = useState(300);
  
  const shouldShowBottomPanel = currentView === 'file' || currentView === 'requirement' || currentView === 'solarwire';
  const shouldFillHeight = currentView === 'git' || currentView === 'version';

  const handleTopPanelResize = (newHeight: number) => {
    setTopPanelHeight(newHeight);
  };

  return (
    <div className="left-panel">
      <div className="left-panel-top" style={{ height: shouldFillHeight ? '100%' : `${topPanelHeight}px` }}>
        <ViewTabs />
      </div>
      {shouldShowBottomPanel && (
        <>
          <ResizableDivider
            orientation="horizontal"
            onResize={handleTopPanelResize}
            currentSize={topPanelHeight}
            minSize={150}
            maxSize={600}
          />
          <div className="left-panel-bottom">
            <VersionGitTabs />
          </div>
        </>
      )}
    </div>
  );
};

export default LeftPanel;
