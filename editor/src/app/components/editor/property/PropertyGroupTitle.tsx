import React, { useState, useCallback, useRef, useEffect } from 'react';

interface PropertyGroupTitleProps {
  title: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}

const PropertyGroupTitle: React.FC<PropertyGroupTitleProps> = ({ title, defaultCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, collapsed]);

  const handleToggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div className="property-group-wrapper">
      <div className="property-group-title" onClick={handleToggle}>
        <span className={`property-group-arrow${collapsed ? ' collapsed' : ''}`}>▶</span>
        {title}
      </div>
      <div
        className={`property-group-content${collapsed ? ' collapsed' : ''}`}
        style={collapsed ? { maxHeight: 0 } : { maxHeight: contentHeight ?? 500 }}
        ref={contentRef}
      >
        <div className="property-group-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PropertyGroupTitle;
