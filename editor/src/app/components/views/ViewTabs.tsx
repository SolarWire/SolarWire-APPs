import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { ViewType } from '../../types/app';
import FileView from './FileView';
import RequirementView from './RequirementView';
import SolarWireView from './SolarWireView';
import VersionView from './VersionView';
import GitView from './GitView';
import { getSelectedItemForView } from '../../shared/utils/file-utils';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import './ViewTabs.css';

const ViewTabs: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  const { setSelectedFile } = useFileStore();

  const views: { type: ViewType; label: string; testId: string }[] = [
    { type: 'file', label: 'File', testId: 'view-files' },
    { type: 'requirement', label: 'Req', testId: 'view-requirements' },
    { type: 'solarwire', label: 'Solar', testId: 'view-pages' },
    { type: 'git', label: 'Git', testId: 'view-git' },
  ];

  const renderViewContent = () => {
    switch (currentView) {
      case 'file':
        return <FileView />;
      case 'requirement':
        return <RequirementView />;
      case 'solarwire':
        return <SolarWireView />;
      case 'version':
        return <VersionView />;
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
              className={view.testId}
            >
              {view.label}
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
