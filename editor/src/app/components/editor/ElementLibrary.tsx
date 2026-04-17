import React from 'react';
import './ElementLibrary.css';

interface Element {
  type: string;
  name: string;
  icon: string;
}

interface ElementLibraryProps {
  compact?: boolean;
}

function ElementLibrary({ compact = false }: ElementLibraryProps): React.ReactElement {
  const elements: Element[] = [
    { type: 'rectangle', name: 'Rectangle', icon: '⬜' },
    { type: 'rounded-rectangle', name: 'Rounded', icon: '⬛' },
    { type: 'circle', name: 'Circle', icon: '⭕' },
    { type: 'text', name: 'Text', icon: '📝' },
    { type: 'line', name: 'Line', icon: '📏' },
    { type: 'image', name: 'Image', icon: '🖼️' },
    { type: 'placeholder', name: 'Placeholder', icon: '📦' },
    { type: 'table', name: 'Table', icon: '📊' },
  ];

  const handleDragStart = (e: React.DragEvent, element: Element): void => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (compact) {
    return (
      <div className="element-library-compact">
        {elements.map((element) => (
          <div
            key={element.type}
            className="element-item-compact"
            draggable
            onDragStart={(e) => handleDragStart(e, element)}
            title={element.name}
          >
            <span className="element-icon">{element.icon}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="element-library">
      <div className="toolbar-title">Elements</div>
      <div className="element-grid">
        {elements.map((element) => (
          <div
            key={element.type}
            className="element-item library-element"
            draggable
            onDragStart={(e) => handleDragStart(e, element)}
          >
            <span className="element-icon">{element.icon}</span>
            <span className="element-name">{element.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ElementLibrary;
