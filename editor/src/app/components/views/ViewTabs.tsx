import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { ViewType } from '../../types/app';
import FileView from './FileView';
import RequirementView from './RequirementView';
import SolarWireView from './SolarWireView';
import VersionView from './VersionView';
import GitView from './GitView';
import './ViewTabs.css';

const ViewTabs: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();

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
    <div className="view-tabs-container">
      <div className="view-tabs">
        {views.map((view) => (
          <div
            key={view.type}
            className={`view-tab ${currentView === view.type ? 'active' : ''}`}
            data-testid={view.testId}
            onClick={() => setCurrentView(view.type)}
          >
            {view.label}
          </div>
        ))}
      </div>
      <div className="view-content">{renderViewContent()}</div>
    </div>
  );
};

export default ViewTabs;
