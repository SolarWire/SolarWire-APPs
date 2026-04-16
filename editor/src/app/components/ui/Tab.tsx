import React, { createContext, useContext, useState, ReactNode } from 'react';
import './Tab.css';

interface TabContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className = '' }) => {
  return (
    <div className={`tab-list ${className}`}>
      {children}
    </div>
  );
};

interface TabProps {
  id: string;
  children: ReactNode;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({
  id,
  children,
  icon,
  badge,
  disabled = false,
  className = ''
}) => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('Tab must be used within TabProvider');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === id;

  return (
    <button
      className={`tab ${isActive ? 'active' : ''} ${className}`}
      onClick={() => setActiveTab(id)}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
    >
      {icon && <span className="tab-icon">{icon}</span>}
      <span className="tab-content">{children}</span>
      {badge && (
        <span className="tab-badge">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children, className = '' }) => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('TabPanel must be used within TabProvider');
  }

  const { activeTab } = context;
  if (activeTab !== id) {
    return null;
  }

  return (
    <div className={`tab-panel ${className}`} role="tabpanel">
      {children}
    </div>
  );
};

interface TabProviderProps {
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  children
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || '');

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const setActiveTab = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export { TabContext };
