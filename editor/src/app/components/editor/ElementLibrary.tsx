import React, { useState, useMemo } from 'react';
import './ElementLibrary.css';

interface Element {
  type: string;
  name: string;
  icon: string;
  category: 'basic' | 'advanced' | 'data';
}

interface ElementLibraryProps {
  compact?: boolean;
}

function ElementLibrary({ compact = false }: ElementLibraryProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const elements: Element[] = [
    { type: 'rectangle', name: 'Rectangle', icon: '⬜', category: 'basic' },
    { type: 'rounded-rectangle', name: 'Rounded', icon: '⬛', category: 'basic' },
    { type: 'circle', name: 'Circle', icon: '⭕', category: 'basic' },
    { type: 'text', name: 'Text', icon: '📝', category: 'basic' },
    { type: 'line', name: 'Line', icon: '📏', category: 'basic' },
    { type: 'image', name: 'Image', icon: '🖼️', category: 'advanced' },
    { type: 'placeholder', name: 'Placeholder', icon: '📦', category: 'advanced' },
    { type: 'table', name: 'Table', icon: '📊', category: 'data' },
  ];

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'basic', label: '基础' },
    { key: 'advanced', label: '高级' },
    { key: 'data', label: '数据' },
  ];

  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      const matchesSearch = el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || el.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, elements]);

  const handleDragStart = (e: React.DragEvent, element: Element): void => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (compact) {
    return (
      <div className="element-library-compact">
        {filteredElements.map((element) => (
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
      <div className="element-library-header">
        <div className="toolbar-title">元素库</div>
      </div>

      <div className="element-search-wrapper">
        <input
          type="text"
          className="element-search-input"
          placeholder="搜索元素..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="element-category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="element-grid">
        {filteredElements.length > 0 ? (
          filteredElements.map((element) => (
            <div
              key={element.type}
              className="element-item library-element"
              draggable
              onDragStart={(e) => handleDragStart(e, element)}
            >
              <span className="element-icon">{element.icon}</span>
              <span className="element-name">{element.name}</span>
            </div>
          ))
        ) : (
          <div className="element-search-empty">
            未找到匹配的元素
          </div>
        )}
      </div>
    </div>
  );
}

export default ElementLibrary;
