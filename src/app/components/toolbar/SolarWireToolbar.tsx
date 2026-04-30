import React from 'react';
import ElementLibrary from '../editor/ElementLibrary';
import { SelectionTool } from '../../stores/solarWireStore';
import './SolarWireToolbar.css';

type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';

interface ToolbarState {
  showLayerPanel: boolean;
  showComponentLibrary: boolean;
  showNotes: boolean;
  zoomLevel: number;
  isPanMode: boolean;
  isSpacePressed: boolean;
  selectionTool: SelectionTool;
  selectedCount: number;
  snapToGuides: boolean;
}

interface ToolbarCallbacks {
  onToggleLayerPanel: () => void;
  onToggleComponentLibrary: () => void;
  onToggleNotes: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTogglePanMode: () => void;
  onSelectTool: (tool: SelectionTool) => void;
  onBringToFront: () => void;
  onAlign: (type: AlignmentType) => void;
  onExportSvg: () => void;
  onToggleSnapGuides: () => void;
}

interface SolarWireToolbarProps {
  state: ToolbarState;
  callbacks: ToolbarCallbacks;
}

const selectionTools = [
  { id: 'select' as const, label: '点选', icon: '🖱️', description: '点击选中元素，Shift+点击切换选中状态' },
  { id: 'box-include' as const, label: '包含框选', icon: '⬚', description: '完全包含在框内的元素才会被选中' },
  { id: 'box-intersect' as const, label: '交叉框选', icon: '⬛', description: '与框相交的元素都会被选中' }
];

const SolarWireToolbar: React.FC<SolarWireToolbarProps> = ({ state, callbacks }) => {
  const {
    showLayerPanel, showComponentLibrary, showNotes,
    zoomLevel, isPanMode, isSpacePressed, selectionTool, selectedCount, snapToGuides
  } = state;
  const {
    onToggleLayerPanel, onToggleComponentLibrary, onToggleNotes,
    onZoomIn, onZoomOut, onTogglePanMode, onSelectTool,
    onBringToFront, onAlign, onExportSvg, onToggleSnapGuides
  } = callbacks;

  return (
    <div className="solarwire-toolbar">
      <div className="toolbar-section sidebar-section">
        <button
          className={`unified-tool-button layers-toggle-button ${showLayerPanel ? 'active' : ''}`}
          onClick={onToggleLayerPanel}
          title="Toggle Layers Panel"
        >
          ☰
        </button>
        <button
          className={`unified-tool-button component-library-toggle-button ${showComponentLibrary ? 'active' : ''}`}
          onClick={onToggleComponentLibrary}
          title="Toggle Component Library"
        >
          📦
        </button>
        <button
          className={`unified-tool-button note-toggle-button ${showNotes ? 'active' : ''}`}
          onClick={onToggleNotes}
          title={showNotes ? 'Hide Notes' : 'Show Notes'}
        >
          {showNotes ? '👁️' : '🙈'}
        </button>
        <button
          className={`unified-tool-button snap-guides-button ${snapToGuides ? 'active' : ''}`}
          onClick={onToggleSnapGuides}
          title="Toggle Smart Snap Guides"
        >
          <span className="tool-icon">🧲</span>
        </button>
      <div className="toolbar-divider"></div>
        <div className="zoom-controls">
          <button className="zoom-button" onClick={onZoomOut}>-</button>
          <span className="zoom-label">{zoomLevel}%</span>
          <button className="zoom-button" onClick={onZoomIn}>+</button>
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section pan-section">
        <button
          className={`unified-tool-button pan-tool-button ${(isPanMode || isSpacePressed) ? 'active' : ''}`}
          onClick={onTogglePanMode}
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
              className={`unified-tool-button selection-tool-button ${selectionTool === tool.id && !isPanMode && !isSpacePressed ? 'active' : ''}`}
              onClick={() => {
                onSelectTool(tool.id);
                if (isPanMode) onTogglePanMode();
              }}
              title={tool.description}
            >
              <span className="tool-icon">{tool.icon}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section actions-section">
        <button className="unified-tool-button action-button" onClick={onBringToFront} disabled={selectedCount === 0} title="Bring to Front">
          <span className="tool-icon">⬆️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section align-section">
        <button className="unified-tool-button action-button" onClick={() => onAlign('left')} disabled={selectedCount < 2} title="Align Left">
          <span className="tool-icon">⬅️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('center-h')} disabled={selectedCount < 2} title="Align Center Horizontally">
          <span className="tool-icon">↔️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('right')} disabled={selectedCount < 2} title="Align Right">
          <span className="tool-icon">➡️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('top')} disabled={selectedCount < 2} title="Align Top">
          <span className="tool-icon">⬆️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('center-v')} disabled={selectedCount < 2} title="Align Center Vertically">
          <span className="tool-icon">↕️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('bottom')} disabled={selectedCount < 2} title="Align Bottom">
          <span className="tool-icon">⬇️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section elements-section">
        <ElementLibrary compact />
      </div>
      <div className="toolbar-spacer"></div>
      <div className="toolbar-section export-section">
        <button
          className="unified-tool-button export-svg-button"
          onClick={onExportSvg}
          title="Export as SVG"
        >
          📥
        </button>
      </div>
    </div>
  );
};

export default SolarWireToolbar;
export type { AlignmentType, ToolbarState, ToolbarCallbacks };
