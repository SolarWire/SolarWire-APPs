import React from 'react';
import VersionView from './VersionView';
import './VersionGitTabs.css';

const VersionGitTabs: React.FC = () => {
  return (
    <div className="version-git-tabs-container">
      <div className="view-tabs">
        <div className="view-tab active" data-testid="view-versions">Version</div>
      </div>
      <div className="view-content">
        <VersionView />
      </div>
    </div>
  );
};

export default VersionGitTabs;
