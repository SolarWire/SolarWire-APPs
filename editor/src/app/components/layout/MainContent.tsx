import React, { useState, useRef, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import ResizableDivider from '../ui/ResizableDivider';
import './MainContent.css';

const MainContent: React.FC = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // 直接读取左侧面板的实际宽度
  const updateLeftPanelWidth = () => {
    if (leftPanelRef.current) {
      const actualWidth = leftPanelRef.current.offsetWidth;
      if (actualWidth > 0 && actualWidth !== leftPanelWidth) {
        setLeftPanelWidth(actualWidth);
      }
    }
  };

  // 监听左侧面板宽度变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateLeftPanelWidth();
    });

    if (leftPanelRef.current) {
      resizeObserver.observe(leftPanelRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 初始化时也更新一次
  useEffect(() => {
    updateLeftPanelWidth();
  }, []);

  const handleLeftPanelResize = (newWidth: number) => {
    // 确保宽度不会小于最小值或大于最大值
    const clampedWidth = Math.max(150, Math.min(600, newWidth));
    setLeftPanelWidth(clampedWidth);
  };

  // 添加保护机制，确保宽度始终有效
  useEffect(() => {
    if (leftPanelWidth <= 0 || isNaN(leftPanelWidth)) {
      setLeftPanelWidth(300);
    }
  }, [leftPanelWidth]);

  return (
    <div className="main-content">
      <div 
        ref={leftPanelRef}
        className="left-panel-container" 
        style={{ width: `${leftPanelWidth}px` }}
      >
        <LeftPanel />
      </div>
      <ResizableDivider
        orientation="vertical"
        onResize={handleLeftPanelResize}
        currentSize={leftPanelWidth}
        minSize={150}
        maxSize={600}
      />
      <div className="right-panel">
        <RightPanel />
      </div>
    </div>
  );
};

export default MainContent;
