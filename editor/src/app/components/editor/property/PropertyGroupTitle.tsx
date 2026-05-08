import React, { useState, useCallback, useRef, useEffect } from 'react';

interface PropertyGroupTitleProps {
  title: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}

const PropertyGroupTitle: React.FC<PropertyGroupTitleProps> = ({ title, defaultCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(0);
  const [animating, setAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    if (contentRef.current) {
      heightRef.current = contentRef.current.scrollHeight;
    }
    setCollapsed(prev => !prev);
    setAnimating(true);
  }, []);

  useEffect(() => {
    if (!animating && !collapsed && contentRef.current) {
      heightRef.current = contentRef.current.scrollHeight;
    }
  }, [children, animating, collapsed]);

  const handleTransitionEnd = useCallback(() => {
    setAnimating(false);
  }, []);

  const maxHeight = collapsed ? 0 : (animating ? heightRef.current : undefined);

  return (
    <div className="property-group-wrapper">
      <div className="property-group-title" onClick={handleToggle}>
        <span className={`property-group-arrow${collapsed ? ' collapsed' : ''}`}>▶</span>
        {title}
      </div>
      <div
        className={`property-group-content${collapsed ? ' collapsed' : ''}`}
        style={collapsed || animating ? { maxHeight, overflow: 'hidden' } : undefined}
        ref={contentRef}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="property-group-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PropertyGroupTitle;
