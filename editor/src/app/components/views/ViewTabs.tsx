import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { ViewType } from '../../../shared/types/app';
import FileView from './FileView';
import RequirementView from './RequirementView';
import SolarWireView from './SolarWireView';
import GitView from './GitView';
import { getSelectedItemForView } from '../../../shared/utils/file-utils';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './ViewTabs.css';

const ViewTabs: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  const { setSelectedFile } = useFileStore();

  const views: { type: ViewType; emoji: string; title: string }[] = [
    { type: 'file', emoji: '📁', title: '文件管理器' },
    { type: 'requirement', emoji: '📋', title: '需求文档' },
    { type: 'solarwire', emoji: '🎨', title: 'SolarWire' },
    { type: 'git', emoji: '🔀', title: '版本控制' },
  ];

  const renderViewContent = () => {
    switch (currentView) {
      case 'file':
        return <FileView />;
      case 'requirement':
        return <RequirementView />;
      case 'solarwire':
        return <SolarWireView />;
      case 'git':
        return <GitView />;
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
