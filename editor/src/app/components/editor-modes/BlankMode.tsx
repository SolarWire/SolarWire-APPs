import React from 'react';
import './BlankMode.css';

const BlankMode: React.FC = () => {
  return (
    <div className="blank-mode" style={{ height: '100%' }}>
      <div className="blank-mode-content">
        <div className="blank-mode-icon">
          <img src="/logo.svg" alt="SolarWire" className="blank-mode-logo" />
        </div>
        <div className="blank-mode-title">Welcome to SolarWire Editor</div>
        <div className="blank-mode-text">
          Open a file from the File view to get started
        </div>
      </div>
    </div>
  );
};

export default BlankMode;
