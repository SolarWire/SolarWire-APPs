import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useComponentLibraryStore, TreeNodeType } from '../../stores/componentLibraryStore';
import { Component, ComponentCategory, makeNodeId, makeUncategorizedKey, isPresetLibrary } from '../../../shared/types/component';
import type { ComponentLibrary } from '../../../shared/types/component';
import SolarWireVisualEditor from './SolarWireVisualEditor';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { componentLibraryManager } from '../../services/ComponentLibraryManager';
import { generateThumbnailBatch } from '../../../lib/components/thumbnail-generator';
import { showToast } from '../../services/toast-service';
import './ComponentLibrary.css';

/**
 * SVG 安全清理函数
 * 移除危险标签和属性以防止 XSS 攻击
 * 注意：缩略图是内部生成的，不使用此函数清理
 */
function sanitizeSvg(svg: string): string {
  if (!svg) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    // 移除危险的标签和属性
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
    return svgEl ? svgEl.outerHTML : svg;
  } catch {
    return svg;
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

/**
 * 组件卡片组件
 * 显示单个组件的缩略图和信息
 */
const ComponentCard = React.memo<ComponentCardProps>(({ component, thumbnail, isParseError, onDragStart, onFixError }) => {
  // 缩略图是内部生成的，不需要安全清理
  return (
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
          <div className="thumbnail-svg-container" dangerouslySetInnerHTML={{ __html: thumbnail }} />
        ) : (
          <div className="thumbnail-loading"><div className="loading-spinner small"></div></div>
        )}
      </div>
      <div className="component-info">
        <div className="component-name">{component.name}</div>
        {component.description && <div className="component-description">{component.description}</div>}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只比较关键props
  return (
    prevProps.component.internalId === nextProps.component.internalId &&
    prevProps.component.name === nextProps.component.name &&
    prevProps.component.description === nextProps.component.description &&
    prevProps.thumbnail === nextProps.thumbnail &&
    prevProps.isParseError === nextProps.isParseError
  );
});

/**
 * 组件库主组件
 * 提供组件库浏览、搜索、拖拽等功能
 */
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onDropToCanvas }) => {
  // 组件库状态
  const libraries = useComponentLibraryStore(s => s.libraries);
  const activeLibraryId = useComponentLibraryStore(s => s.activeLibraryId);
  const searchQuery = useComponentLibraryStore(s => s.searchQuery);
  const activeCategoryId = useComponentLibraryStore(s => s.activeCategoryId);
  const isInitialized = useComponentLibraryStore(s => s.isInitialized);
  const initialize = useComponentLibraryStore(s => s.initialize);
  const setActiveLibrary = useComponentLibraryStore(s => s.setActiveLibrary);
  const setSearchQuery = useComponentLibraryStore(s => s.setSearchQuery);
  const setActiveCategoryId = useComponentLibraryStore(s => s.setActiveCategoryId);
  const openManagerAtComponent = useComponentLibraryStore(s => s.openManagerAtComponent);
  const importLibrary = useComponentLibraryStore(s => s.importLibrary);

  // 本地状态
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const [componentParseErrors, setComponentParseErrors] = useState<Map<string, string>>(new Map());
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化组件库 - 在组件挂载时自动初始化
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // 获取当前激活的组件库
  const activeLibrary = useMemo(() => {
    return libraries.find(lib => lib.metadata.id === activeLibraryId) || null;
  }, [libraries, activeLibraryId]);

  // 用于触发缩略图重新生成的依赖项
  const activeLibraryIdValue = activeLibrary?.metadata.id;
  const activeLibraryComponentCount = activeLibrary?.components.length;
  const activeLibraryComponentIds = useMemo(() => {
    return activeLibrary?.components.map(c => c.internalId).join(',') || '';
  }, [activeLibrary?.components]);

  /**
   * 缩略图生成逻辑
   * 1. 检查是否有缓存的缩略图
   * 2. 如果没有缓存，批量生成缩略图
   * 3. 生成完成后缓存结果
   */
  useEffect(() => {
    if (!activeLibrary) {
      setThumbnails(new Map());
      setComponentParseErrors(new Map());
      return;
    }

    const cachedThumbnails = componentLibraryManager.getThumbnailCache(activeLibrary.metadata.id);
    
    if (cachedThumbnails.size > 0) {
      setThumbnails(cachedThumbnails);
      setComponentParseErrors(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadingProgress({ current: 0, total: activeLibrary.components.length });

    const generateThumbnails = async () => {
      const components = activeLibrary.components.map(c => ({ internalId: c.internalId, code: c.code }));

      try {
        const results = await generateThumbnailBatch(components, (completed, total, componentInternalId, success) => {
          if (cancelled) return;
          setLoadingProgress({ current: completed, total });

          if (!success) {
            const component = activeLibrary.components.find(c => c.internalId === componentInternalId);
            if (component) {
              setComponentParseErrors(prev => new Map(prev).set(componentInternalId, component.name));
            }
          }
        }, 120, 80);

        if (!cancelled) {
          componentLibraryManager.setThumbnailCache(activeLibrary.metadata.id, results);
          setThumbnails(results);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to generate thumbnails:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setLoadingProgress(null);
        }
      }
    };

    generateThumbnails();

    return () => { cancelled = true; };
  }, [activeLibraryIdValue, activeLibraryComponentCount, activeLibraryComponentIds]);

  const filteredComponents = useMemo(() => {
    if (!activeLibrary) return [];

    let components = [...activeLibrary.components];

    if (activeCategoryId) {
      components = components.filter(c => c.categoryId === activeCategoryId);
    } else if (!searchQuery) {
      const categoryOrder = activeLibrary.categories.map(c => c.id);
      const getCatOrder = (categoryId: string | undefined) => {
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
  }, [activeLibraryId, activeLibrary?.components, activeLibrary?.categories, activeCategoryId, searchQuery]);

  const handleDragStart = useCallback((e: React.DragEvent, component: Component) => {
    e.dataTransfer.setData('text/plain', component.code);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'component',
      name: component.name,
      code: component.code
    }));
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
    return activeLibrary.categories;
  }, [activeLibraryId, activeLibrary?.categories.length]);

  const needsExpandButton = categories.length > 6;

  const handleOpenManagerForFailedComponent = useCallback((libraryId: string, componentId: string) => {
    openManagerAtComponent(libraryId, componentId);
  }, [openManagerAtComponent]);

  const handleFixError = useCallback((componentInternalId: string) => {
    handleOpenManagerForFailedComponent(activeLibraryId || '', componentInternalId);
  }, [activeLibraryId, handleOpenManagerForFailedComponent]);

  if (libraries.length === 0) {
    return (
      <div className="component-library">
        <div className="component-library-header"><span>组件库</span></div>
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
            {filteredComponents.map((component) => {
              const thumbnail = thumbnails.get(component.internalId);
              return (
                <ComponentCard
                  key={component.internalId}
                  component={component}
                  thumbnail={thumbnail}
                  isParseError={componentParseErrors.has(component.internalId)}
                  onDragStart={handleDragStart}
                  onFixError={handleFixError}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
