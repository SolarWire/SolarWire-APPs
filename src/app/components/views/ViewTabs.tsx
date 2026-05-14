import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { ViewType } from '../../../shared/types/app';
import FileView from './FileView';
import ComponentLibraryManagerView from './ComponentLibraryManagerView';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './ViewTabs.css';

const ViewTabs: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();

  const views: { type: ViewType; emoji: string; title: string }[] = [
    { type: 'file', emoji: '📁', title: '文件管理器' },
    { type: 'componentLibraryManager', emoji: '🧩', title: '组件库管理' },
  ];

  const renderViewContent = () => {
    switch (currentView) {
      case 'file':
        return <FileView />;
      case 'componentLibraryManager':
        return <ComponentLibraryManagerView />;
      default:
        return null;
    }
  };

  return (
    <TabProvider activeTab={currentView} onTabChange={(tabId) => setCurrentView(tabId as ViewType)}>
      <div className="view-tabs-container">
        <TabList className="view-tabs">
          {views.map((view) => (
            <Tab
              key={view.type}
              id={view.type}
              title={view.title}
            >
              {view.emoji}
            </Tab>
          ))}
        </TabList>
        <div className="view-content">
          <TabPanel id={currentView}>
            {renderViewContent()}
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
};

export default ViewTabs;
