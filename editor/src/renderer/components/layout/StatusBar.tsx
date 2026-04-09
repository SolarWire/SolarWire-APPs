import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import './StatusBar.css';

const StatusBar: React.FC = () => {
  const { selectedFile } = useFileStore();

  return (
    <div className="status-bar">
      {selectedFile ? (
        <div className="status-text">{selectedFile.path}</div>
      ) : (
        <div className="status-text">Ready</div>
      )}
    </div>
  );
};

export default StatusBar;
