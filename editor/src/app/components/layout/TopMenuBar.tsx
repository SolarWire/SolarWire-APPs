import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import SettingsModal from '../ui/SettingsModal';
import ComponentLibraryManagerModal from '../editor/ComponentLibraryManagerModal';
import ElementLibrary from '../editor/ElementLibrary';
import { bringElementsToFront, alignElements } from "../../../shared/utils/solarwire-utils";
import './TopMenuBar.css';

interface SolarWireToolbarProps {
}

const SolarWireToolbar: React.FC<SolarWireToolbarProps> = () => {
  const { content, setContent } = useEditorStore();
  const { currentPath } = useFileStore();
  const { selectedElements, selectionTool, setSelectionTool, showNotes, setShowNotes, zoomLevel, setZoomLevel, isSpacePressed, isPanMode, setIsPanMode, setSelectedElements } = useSolarWireStore();
  const { primaryColor } = useSettingsStore();

  const handleInsertImage = async () => {
    if (!currentPath) {
      alert('Please open a folder first');
      return;
    }

    const api = (window as any).api;
    if (!api || !api.openFileDialog) {
      alert('File dialog not available');
      return;
    }

    try {
      const paths = await api.openFileDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
      });

      if (!paths || paths.length === 0) return;

      const file = paths[0];
      const fileName = file.split(/[\\/]/).pop() || file;
      const fileExt = fileName.split('.').pop()?.toLowerCase() || 'png';

      const assetsDir = `${currentPath}/assets/images`;
      await api.ensureDir(assetsDir);

      const timestamp = Date.now();
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const destPath = `${assetsDir}/${timestamp}_${sanitizedName}`;
      await api.copyFile(file, destPath);

      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const maxDim = 400;
        let w = Math.min(maxDim, img.width);
        let h = w / aspect;
        if (h > maxDim) {
          h = maxDim;
          w = h * aspect;
        }

        const relativePath = `assets/images/${timestamp}_${sanitizedName}`;
        const viewPort = { width: 1440, height: 900 };
        const x = Math.round(viewPort.width / 4);
        const y = Math.round(viewPort.height / 4);
        const imgLine = `<${relativePath}> @(${x}, ${y}) w=${Math.round(w)} h=${Math.round(h)}`;

        const currentContent = content.trimEnd();
        const newContent = `${currentContent}\n\n${imgLine}`;
        setContent(newContent);

        const lines = newContent.split(/\r?\n/);
        const imgLineNum = lines.length.toString();
        setSelectedElements([imgLineNum]);
      };

      img.onerror = () => alert('Failed to load image');
      img.src = destPath;
    } catch (err) {
      console.error('Insert image failed:', err);
      alert('Failed to insert image');
    }
  };

  const selectionTools = [
    { id: 'select', label: '点选', icon: '🖱️', description: '点击选中元素，Shift+点击切换选中状态' },
    { id: 'box-include', label: '包含框选', icon: '⬚', description: '完全包含在框内的元素才会被选中' },
    { id: 'box-intersect', label: '交叉框选', icon: '⬛', description: '与框相交的元素都会被选中' }
  ];

  const handleBringToFront = () => {
    if (selectedElements.length === 0) return;
    const { content: newContent, newElementIds } = bringElementsToFront(content, selectedElements);
    setContent(newContent);
    setSelectedElements(newElementIds);
  };

  const handleAlign = (alignmentType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (selectedElements.length < 2) return;
    const newContent = alignElements(content, selectedElements, alignmentType);
    setContent(newContent);
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 25));
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
                setSelectionTool(tool.id as 'select' | 'box-include' | 'box-intersect');
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
        <button
          className="action-button"
          onClick={handleInsertImage}
          title="Insert Image"
        >
          <span className="tool-icon">🖼️</span>
        </button>
        <ElementLibrary compact />
      </div>
    </div>
  );
};

const TopMenuBar: React.FC = () => {
  const { theme, setTheme } = useAppStore();
  const { saveFile } = useFileStore();
  const { isModified, mode } = useEditorStore();
  const { isSpacePressed, setIsSpacePressed } = useSolarWireStore();
  const { showComponentManager, setShowComponentManager, initialize } = useComponentLibraryStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    initialize().catch(err => console.warn('Component library init failed:', err));
  }, [initialize]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSave = async () => {
    await saveFile();
  };

  const handleOpen = async () => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        alert('File dialog is only available in the Electron app');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openDirectory'],
      });

      if (paths && paths.length > 0) {
        const { openDirectoryAtPath } = useFileStore.getState();
        if (openDirectoryAtPath) {
          await openDirectoryAtPath(paths[0]);
        }
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  return (
    <>
      <div className="top-menu-bar menu-bar" data-testid="menu-bar">
        <img className="app-logo" src="/logo.svg" alt="SolarWire" />
        
        <button 
          className="open-button" 
          onClick={handleOpen} 
          title="Open Directory (Ctrl+O)"
        >
          📂
        </button>
        
        <button 
          className={`save-button ${isModified ? 'modified' : ''}`} 
          onClick={handleSave} 
          title="Save (Ctrl+S)"
          disabled={!isModified}
        >
          💾
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
          className="component-library-manager-button" 
          onClick={() => setShowComponentManager(true)} 
          title="组件库管理"
        >
          📦
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
      {showComponentManager && (
        <ComponentLibraryManagerModal onClose={() => setShowComponentManager(false)} />
      )}
    </>
  );
};

export default TopMenuBar;
