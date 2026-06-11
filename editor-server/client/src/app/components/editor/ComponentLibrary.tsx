import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { useEditorStore } from '../../stores/editorStore';
import { useAppStore } from '../../stores/appStore';
import { Component, isComponentUncategorized } from '../../../shared/types/component';
import { useComponentThumbnails } from './hooks/useComponentThumbnails';
import './ComponentLibrary.css';

function sanitizeSvg(svg: string): string {
  if (!svg) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const removeTags = ['script', 'iframe', 'embed', 'object', 'foreignObject'];
    removeTags.forEach(tag => doc.querySelectorAll(tag).forEach(el => el.remove()));
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
        if (attr.name === 'href' && attr.value.startsWith('javascript:')) el.removeAttribute(attr.name);
        if (attr.name === 'xlink:href' && attr.value.startsWith('javascript:')) el.removeAttribute(attr.name);
      });
    });
    const svgEl = doc.querySelector('svg');
    return svgEl ? svgEl.outerHTML : '';
  } catch {
    return '';
  }
}

interface ComponentLibraryProps {
  onDropToCanvas: (component: Component, x: number, y: number) => void;
}

interface ComponentCardProps {
  component: Component;
  thumbnail: string | undefined;
  isParseError: boolean;
  onDragStart: (e: React.DragEvent, component: Component) => void;
  onFixError: (componentInternalId: string) => void;
}

const ComponentCard = React.memo<ComponentCardProps>(({ component, thumbnail, isParseError, onDragStart, onFixError }) => (
  <div
    className="component-card"
    draggable
    onDragStart={(e) => onDragStart(e, component)}
    title={component.description || component.name}
  >
    <div className="component-thumbnail">
      {isParseError ? (
        <div className="thumbnail-error">
          <span className="error-emoji">❌</span>
          <button className="thumbnail-fix-btn" onClick={() => onFixError(component.internalId)} title="修复组件">🔧</button>
        </div>
      ) : thumbnail ? (
        <div className="thumbnail-svg-container" dangerouslySetInnerHTML={{ __html: sanitizeSvg(thumbnail) }} />
      ) : (
        <div className="thumbnail-loading"><div className="loading-spinner small"></div></div>
      )}
    </div>
    <div className="component-info">
      <div className="component-name">{component.name}</div>
      {component.description && <div className="component-description">{component.description}</div>}
    </div>
  </div>
));

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onDropToCanvas }) => {
  const libraries = useComponentLibraryStore(s => s.libraries);
  const activeLibraryId = useComponentLibraryStore(s => s.activeLibraryId);
  const searchQuery = useComponentLibraryStore(s => s.searchQuery);
  const activeCategoryId = useComponentLibraryStore(s => s.activeCategoryId);
  const setActiveLibrary = useComponentLibraryStore(s => s.setActiveLibrary);
  const setSearchQuery = useComponentLibraryStore(s => s.setSearchQuery);
  const setActiveCategoryId = useComponentLibraryStore(s => s.setActiveCategoryId);
  const openManagerAtComponent = useComponentLibraryStore(s => s.openManagerAtComponent);
  const setMode = useEditorStore(s => s.setMode);
  const setCurrentView = useAppStore(s => s.setCurrentView);

  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLibrary = useMemo(() => {
    return libraries.find(lib => lib.metadata.id === activeLibraryId) || null;
  }, [libraries, activeLibraryId]);

  const {
    thumbnails,
    parseErrors: componentParseErrors,
    isLoading,
    loadingProgress,
    refresh: refreshThumbnails,
  } = useComponentThumbnails({
    libraryId: activeLibrary?.metadata.id,
    components: activeLibrary?.components ?? [],
  });

  const filteredComponents = useMemo(() => {
    if (!activeLibrary) return [];

    let components = [...activeLibrary.components];

    if (activeCategoryId) {
      if (activeCategoryId === 'uncategorized') {
        components = components.filter(c => isComponentUncategorized(c.categoryId, activeLibrary.categories));
        // 如果未分类没有组件，返回空数组
        if (components.length === 0) return [];
      } else {
        components = components.filter(c => c.categoryId === activeCategoryId);
      }
    } else if (!searchQuery) {
      const categoryOrder = activeLibrary.categories.map(c => c.id);
      const getCatOrder = (categoryId: string | null | undefined) => {
        if (!categoryId) return categoryOrder.length;
        const idx = categoryOrder.indexOf(categoryId);
        return idx >= 0 ? idx : categoryOrder.length;
      };
      components.sort((a, b) => {
        const aCatIndex = getCatOrder(a.categoryId);
        const bCatIndex = getCatOrder(b.categoryId);
        if (aCatIndex !== bCatIndex) return aCatIndex - bCatIndex;
        const aIndex = activeLibrary.components.findIndex(c => c.internalId === a.internalId);
        const bIndex = activeLibrary.components.findIndex(c => c.internalId === b.internalId);
        return aIndex - bIndex;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      components = components.filter(
        c => c.name.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)
      );
    }

    return components;
  }, [activeLibrary?.components, activeLibrary?.categories, activeCategoryId, searchQuery]);

  const handleDragStart = useCallback((e: React.DragEvent, component: Component) => {
    e.dataTransfer.setData('text/plain', component.code);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 150);
  }, [setSearchQuery]);

  const categories = useMemo(() => {
    if (!activeLibrary) return [];
    const uncategorizedComponents = activeLibrary.components.filter(c => isComponentUncategorized(c.categoryId, activeLibrary.categories));
    const hasUncategorized = uncategorizedComponents.length > 0;

    if (hasUncategorized) {
      return [...activeLibrary.categories, { id: 'uncategorized', name: '未分类' }];
    }
    return activeLibrary.categories;
  }, [activeLibrary?.categories, activeLibrary?.components]);

  const needsExpandButton = categories.length > 6;

  const handleOpenManagerForFailedComponent = useCallback((libraryId: string, componentId: string) => {
    openManagerAtComponent(libraryId, componentId);
  }, [openManagerAtComponent]);

  const handleFixError = useCallback((componentInternalId: string) => {
    handleOpenManagerForFailedComponent(activeLibraryId || '', componentInternalId);
    setMode('componentLibraryManager');
    setCurrentView('componentLibraryManager');
  }, [activeLibraryId, handleOpenManagerForFailedComponent, setMode, setCurrentView]);

  const handleImportLibrary = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.swc,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await useComponentLibraryStore.getState().importLibrary(file);
        } catch (err) {
          alert(`导入失败：${err instanceof Error ? err.message : '未知错误'}`);
        }
      }
    };
    input.click();
  }, []);

  // 自动初始化组件库
  useEffect(() => {
    const initialize = useComponentLibraryStore.getState().initialize;
    initialize();
  }, []);

  if (libraries.length === 0) {
    return (
      <div className="component-library">
        <div className="component-library-header">
          <span>组件库</span>
          <div className="component-library-actions">
            <button title="刷新组件库" onClick={() => {
              const initialize = useComponentLibraryStore.getState().initialize;
              initialize();
            }}>🔄</button>
          </div>
        </div>
        <div className="component-library-empty">
          <div className="component-library-empty-icon">📦</div>
          <div>暂无组件库</div>
          <div className="component-library-empty-hint">点击顶部导航栏的组件库管理按钮添加</div>
        </div>
      </div>
    );
  }

  return (
    <div className="component-library">
      <div className="component-library-header">
        <span>组件库</span>
        <div className="component-library-actions">
          <button title="刷新组件库" onClick={refreshThumbnails}>🔄</button>
        </div>
      </div>

      <div className="component-library-selector">
        <select value={activeLibraryId || ''} onChange={(e) => setActiveLibrary(e.target.value || null)} className="component-library-select">
          {libraries.map(lib => (
            <option key={lib.metadata.id} value={lib.metadata.id}>{lib.metadata.name}</option>
          ))}
        </select>
      </div>

      <div className="component-library-search">
        <input type="text" placeholder="搜索组件..." value={searchQuery} onChange={handleSearchChange} />
      </div>

      {categories.length > 0 && (
        <div className="component-library-categories-wrapper">
          <div className={`component-library-categories ${categoriesExpanded ? 'expanded' : ''}`}>
            <button className={`component-library-category-btn ${!activeCategoryId ? 'active' : ''}`} onClick={() => setActiveCategoryId(null)}>全部</button>
            {categories.map((cat) => (
              <button key={cat.id} className={`component-library-category-btn ${activeCategoryId === cat.id ? 'active' : ''}`} onClick={() => setActiveCategoryId(cat.id)}>{cat.name}</button>
            ))}
          </div>
          {needsExpandButton && !categoriesExpanded && <button className="categories-expand-btn" onClick={() => setCategoriesExpanded(true)}>展开 ▼</button>}
          {needsExpandButton && categoriesExpanded && <button className="categories-expand-btn" onClick={() => setCategoriesExpanded(false)}>收起 ▲</button>}
        </div>
      )}

      <div className="component-library-content">
        {isLoading && loadingProgress && (
          <div className="component-library-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在生成组件缩略图... ({loadingProgress.current}/{loadingProgress.total})</div>
            <div className="loading-progress-bar">
              <div className="loading-progress-fill" style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}></div>
            </div>
          </div>
        )}

        {!isLoading && filteredComponents.length === 0 ? (
          <div className="component-library-empty"><div>暂无组件</div></div>
        ) : (
          <div className="component-grid">
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.internalId}
                component={component}
                thumbnail={thumbnails.get(component.internalId)}
                isParseError={componentParseErrors.has(component.internalId)}
                onDragStart={handleDragStart}
                onFixError={handleFixError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
