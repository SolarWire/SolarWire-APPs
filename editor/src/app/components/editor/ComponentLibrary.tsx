import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { Component } from '../../../shared/types/component';
import { componentLibraryManager } from '../../services/ComponentLibraryManager';
import { generateThumbnailBatch } from '../../../lib/components/thumbnail-generator';
import './ComponentLibrary.css';

interface ComponentLibraryProps {
  onDropToCanvas: (component: Component, x: number, y: number) => void;
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onDropToCanvas }) => {
  const {
    libraries,
    activeLibraryId,
    setActiveLibrary,
    searchQuery,
    setSearchQuery,
    activeCategoryId,
    setActiveCategoryId,
    showComponentManager,
    setShowComponentManager,
    openManagerAtComponent,
  } = useComponentLibraryStore();

  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const [componentParseErrors, setComponentParseErrors] = useState<Map<string, string>>(new Map());

  const activeLibrary = useMemo(() => {
    return libraries.find(lib => lib.metadata.id === activeLibraryId) || null;
  }, [libraries, activeLibraryId]);

  const activeLibraryIdRef = activeLibrary?.metadata.id;
  const activeLibraryComponentCount = activeLibrary?.components.length;
  const activeLibraryCodeHash = activeLibrary?.components.map(c => c.id + ':' + (c.code?.length || 0)).join('|');

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
      const components = activeLibrary.components.map(c => ({ id: c.id, code: c.code }));
      
      try {
        const results = await generateThumbnailBatch(components, (completed, total, componentId, success) => {
          if (cancelled) return;
          setLoadingProgress({ current: completed, total });
          
          if (!success) {
            const component = activeLibrary.components.find(c => c.id === componentId);
            if (component) {
              setComponentParseErrors(prev => new Map(prev).set(componentId, component.name));
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

    return () => {
      cancelled = true;
    };
  }, [activeLibraryIdRef, activeLibraryComponentCount, activeLibraryCodeHash]);

  const filteredComponents = useMemo(() => {
    if (!activeLibrary) return [];

    let components = activeLibrary.components;

    if (activeCategoryId) {
      components = components.filter(c => c.categoryId === activeCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      components = components.filter(
        c => c.name.toLowerCase().includes(query) || 
             c.description?.toLowerCase().includes(query)
      );
    }

    return components;
  }, [activeLibrary, activeCategoryId, searchQuery]);

  const handleDragStart = useCallback((e: React.DragEvent, component: Component) => {
    e.dataTransfer.setData('text/plain', component.code);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const categories = useMemo(() => {
    if (!activeLibrary) return [];
    return activeLibrary.categories.filter(c => c.parentId === null);
  }, [activeLibrary]);

  const handleOpenManagerForFailedComponent = useCallback((libraryId: string, componentId: string) => {
    openManagerAtComponent(libraryId, componentId);
  }, [openManagerAtComponent]);

  if (libraries.length === 0) {
    return (
      <div className="component-library">
        <div className="component-library-header">
          <span>组件库</span>
        </div>
        <div className="component-library-empty">
          <div className="component-library-empty-icon">📦</div>
          <div>暂无组件库</div>
          <div className="component-library-empty-hint">
            点击顶部导航栏的组件库管理按钮添加
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="component-library">
      <div className="component-library-header">
        <span>组件库</span>
        <div className="component-library-actions">
          <button title="导入组件库" onClick={() => {
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
          }}>➕</button>
        </div>
      </div>

      <div className="component-library-selector">
        <select
          value={activeLibraryId || ''}
          onChange={(e) => setActiveLibrary(e.target.value || null)}
          className="component-library-select"
        >
          {libraries.map(lib => (
            <option key={lib.metadata.id} value={lib.metadata.id}>
              {lib.metadata.name}
            </option>
          ))}
        </select>
      </div>

      <div className="component-library-search">
        <input
          type="text"
          placeholder="搜索组件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="component-library-categories">
          <button
            className={`component-library-category-btn ${!activeCategoryId ? 'active' : ''}`}
            onClick={() => setActiveCategoryId(null)}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`component-library-category-btn ${activeCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="component-library-content">
        {isLoading && loadingProgress && (
          <div className="component-library-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              正在生成组件缩略图... ({loadingProgress.current}/{loadingProgress.total})
            </div>
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {componentParseErrors.size > 0 && (
          <div className="component-library-errors">
            {Array.from(componentParseErrors.entries()).map(([componentId, componentName], index) => (
              <div key={index} className="error-item">
                <span className="error-icon">❌</span>
                <span className="error-text">{componentName}: 解析失败</span>
                <button 
                  className="error-fix-btn"
                  onClick={() => handleOpenManagerForFailedComponent(activeLibraryId || '', componentId)}
                >
                  修复
                </button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredComponents.length === 0 ? (
          <div className="component-library-empty">
            <div>暂无组件</div>
          </div>
        ) : (
          <div className="component-grid">
            {filteredComponents.map(component => {
              const thumbnail = thumbnails.get(component.id);
              const isParseError = componentParseErrors.has(component.id);

              return (
                <div
                  key={component.id}
                  className="component-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  title={component.description || component.name}
                >
                  <div className="component-thumbnail">
                    {isParseError ? (
                      <div className="thumbnail-error">
                        <span className="error-emoji">❌</span>
                        <button 
                          className="thumbnail-fix-btn"
                          onClick={() => handleOpenManagerForFailedComponent(activeLibraryId || '', component.id)}
                          title="修复组件"
                        >
                          🔧
                        </button>
                      </div>
                    ) : thumbnail ? (
                      <div dangerouslySetInnerHTML={{ __html: thumbnail }} />
                    ) : (
                      <div className="thumbnail-loading">
                        <div className="loading-spinner small"></div>
                      </div>
                    )}
                  </div>
                  <div className="component-info">
                    <div className="component-name">{component.name}</div>
                    {component.description && (
                      <div className="component-description">{component.description}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
