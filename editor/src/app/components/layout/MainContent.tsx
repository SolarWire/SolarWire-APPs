import React, { useState } from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import ResizableDivider from '../ui/ResizableDivider';
import './MainContent.css';

const MainContent: React.FC = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);

  const handleLeftPanelResize = (newWidth: number) => {
    setLeftPanelWidth(newWidth);
  };

  return (
    <div className="main-content">
      <div className="left-panel-container" style={{ width: `${leftPanelWidth}px` }}>
        <LeftPanel />
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleLeftPanelResize}
        currentSize={leftPanelWidth}
        minSize={150}
        maxSize={600}
      />
      <div className="right-panel-container">
        <RightPanel />
      </div>
    </div>
  );
};

export default MainContent;
