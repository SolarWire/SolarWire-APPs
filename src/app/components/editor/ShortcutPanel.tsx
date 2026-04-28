import React from 'react';
import './ShortcutPanel.css';

interface ShortcutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Selection
  { keys: 'Click', description: 'Select element', category: 'Selection' },
  { keys: 'Shift+Click', description: 'Add/remove selection', category: 'Selection' },
  { keys: 'Ctrl+A', description: 'Select all', category: 'Selection' },
  { keys: 'Drag', description: 'Box select', category: 'Selection' },

  // Edit
  { keys: 'Ctrl+Z', description: 'Undo', category: 'Edit' },
  { keys: 'Ctrl+C', description: 'Copy selected', category: 'Edit' },
  { keys: 'Ctrl+V', description: 'Paste', category: 'Edit' },
  { keys: 'Delete/Backspace', description: 'Delete selected', category: 'Edit' },

  // Move
  { keys: '↑/↓/←/→', description: 'Move selected (1px)', category: 'Move' },
  { keys: 'Shift+↑/↓/←/→', description: 'Move selected (10px)', category: 'Move' },
  { keys: 'Hold Space', description: 'Pan canvas', category: 'Move' },

  // Resize
  { keys: 'Drag handles', description: 'Resize element', category: 'Resize' },
  { keys: 'Shift+Drag', description: 'Proportional resize', category: 'Resize' },
  { keys: 'Shift+Line drag', description: 'Snap H/V', category: 'Resize' },

  // View
  { keys: 'Scroll', description: 'Zoom in/out', category: 'View' },
  { keys: 'Double-click', description: 'Reset zoom', category: 'View' },
  { keys: 'G', description: 'Toggle grid', category: 'View' },
  { keys: '?', description: 'Shortcut panel', category: 'View' },

  // Canvas
  { keys: 'N', description: 'Selection tool', category: 'Canvas' },
  { keys: 'I', description: 'Box inclusive tool', category: 'Canvas' },
];

const SHORTCUTPanel: React.FC<ShortcutPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [...new Set(SHORTCUTS.map(s => s.category))];

  return (
    <div className="shortcut-overlay" onClick={onClose}>
      <div className="shortcut-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcut-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="shortcut-close" onClick={onClose}>✕</button>
        </div>
        <div className="shortcut-content">
          {categories.map(category => (
            <div key={category} className="shortcut-category">
              <h4>{category}</h4>
              {SHORTCUTS.filter(s => s.category === category).map((shortcut, idx) => (
                <div key={idx} className="shortcut-item">
                  <span className="shortcut-keys">{shortcut.keys}</span>
                  <span className="shortcut-desc">{shortcut.description}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SHORTCUTPanel;
