import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSolarWireUIStore } from '../../stores/solarWireUIStore';
import { useSettingsStore } from '../../stores/settingsStore';
import SettingsModal from '../ui/SettingsModal';
import ElementLibrary from '../editor/ElementLibrary';
import { bringElementsToFront, alignElements } from "../../../shared/utils/solarwire-utils";
import './TopMenuBar.css';

interface SolarWireToolbarProps {
}

const SolarWireToolbar: React.FC<SolarWireToolbarProps> = () => {
  const { content, setContent } = useEditorStore();
  const { selectedElements, selectionTool, setSelectionTool } = useSolarWireStore();
  const { showNotes, setShowNotes, zoomLevel, setZoomLevel, isSpacePressed } = useSolarWireUIStore();
  const { isPanMode, setIsPanMode } = useSolarWireStore();
  const { primaryColor } = useSettingsStore();

  const selectionTools = [
    { id: 'select', label: 'Select', icon: '🖱️', description: 'Click to select, Shift+Click to multi-select' },
    { id: 'box-inclusive', label: 'Box Select', icon: '📦', description: 'Drag to box select (inclusive)' }
  ];

  const handleBringToFront = () => {
    if (selectedElements.length === 0) return;
    const newContent = bringElementsToFront(content, selectedElements);
    setContent(newContent);
  };

  const handleAlign = (alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElements.length < 2) return;
    const newContent = alignElements(content, selectedElements, alignmentType);
    setContent(newContent);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 25));
  };

  return (
    <div className="solarwire-toolbar">
      <div className="toolbar-section pan-section">
        <button
          className={`pan-tool-button ${(isPanMode || isSpacePressed) ? 'active' : ''}`}
          onClick={() => setIsPanMode(!isPanMode)}
          title="Pan Mode: Hold space or click to toggle"
        >
          <span className="tool-icon">👆</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section selection-section">
        <div className="selection-tools">
          {selectionTools.map(tool => (
            <button
              key={tool.id}
              className={`selection-tool-button ${selectionTool === tool.id && !isPanMode && !isSpacePressed ? 'active' : ''}`}
              onClick={() => {
                setSelectionTool(tool.id as 'select' | 'box-inclusive');
                setIsPanMode(false);
              }}
              title={tool.description}
            >
              <span className="tool-icon">{tool.icon}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section display-section">
        <button
          className={`note-toggle-button ${showNotes ? 'active' : ''}`}
          onClick={() => setShowNotes(!showNotes)}
          title={showNotes ? 'Hide Notes' : 'Show Notes'}
        >
          {showNotes ? '👁️' : '🙈'}
        </button>
        <div className="zoom-controls">
          <button className="zoom-button" onClick={handleZoomOut}>-</button>
          <span className="zoom-label">{zoomLevel}%</span>
          <button className="zoom-button" onClick={handleZoomIn}>+</button>
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section actions-section">
        <button
          className="action-button"
          onClick={handleBringToFront}
          disabled={selectedElements.length === 0}
          title="Bring to Front"
        >
          <span className="tool-icon">⬆️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section align-section">
        <button
          className="action-button"
          onClick={() => handleAlign('left')}
          disabled={selectedElements.length < 2}
          title="Align Left"
        >
          <span className="tool-icon">⬅️</span>
        </button>
        <button
          className="action-button"
          onClick={() => handleAlign('center-h')}
          disabled={selectedElements.length < 2}
          title="Align Center Horizontally"
        >
          <span className="tool-icon">↔️</span>
        </button>
        <button
          className="action-button"
          onClick={() => handleAlign('right')}
          disabled={selectedElements.length < 2}
          title="Align Right"
        >
          <span className="tool-icon">➡️</span>
        </button>
        <button
          className="action-button"
          onClick={() => handleAlign('top')}
          disabled={selectedElements.length < 2}
          title="Align Top"
        >
          <span className="tool-icon">⬆️</span>
        </button>
        <button
          className="action-button"
          onClick={() => handleAlign('center-v')}
          disabled={selectedElements.length < 2}
          title="Align Center Vertically"
        >
          <span className="tool-icon">↕️</span>
        </button>
        <button
          className="action-button"
          onClick={() => handleAlign('bottom')}
          disabled={selectedElements.length < 2}
          title="Align Bottom"
        >
          <span className="tool-icon">⬇️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section elements-section">
        <ElementLibrary compact />
      </div>
    </div>
  );
};

const TopMenuBar: React.FC = () => {
  const { theme, setTheme } = useAppStore();
  const { saveFile } = useFileStore();
  const { isModified, mode } = useEditorStore();
  const { isSpacePressed, setIsSpacePressed } = useSolarWireUIStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSave = async () => {
    await saveFile();
  };

  return (
    <>
      <div className="top-menu-bar menu-bar" data-testid="menu-bar">
        <img className="app-logo" src="/logo.svg" alt="SolarWire" />
        <div className="app-title">SolarWire Editor</div>
        
        <button 
          className={`save-button ${isModified ? 'modified' : ''}`} 
          onClick={handleSave} 
          title="Save (Ctrl+S)"
          disabled={!isModified}
        >
          💾 Save
        </button>
        
        <div className="spacer"></div>
        <button 
          className="theme-toggle-button" 
          data-testid="theme-toggle"
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          className="settings-button" 
          onClick={() => setIsSettingsOpen(true)} 
          title="Settings"
        >
          ⚙️
        </button>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default TopMenuBar;
