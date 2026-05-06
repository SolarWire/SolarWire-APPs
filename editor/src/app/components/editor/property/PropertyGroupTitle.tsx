import React, { useState, useCallback } from 'react';

interface PropertyGroupTitleProps {
  title: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}

const PropertyGroupTitle: React.FC<PropertyGroupTitleProps> = ({ title, defaultCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleToggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div className="property-group-wrapper">
      <div className="property-group-title" onClick={handleToggle}>
        <span className={`property-group-arrow${collapsed ? ' collapsed' : ''}`}>▶</span>
        {title}
      </div>
      {!collapsed && children && (
        <div className="property-group-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default PropertyGroupTitle;
