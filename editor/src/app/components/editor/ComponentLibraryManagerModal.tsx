import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useComponentLibraryStore, TreeNodeType } from '../../stores/componentLibraryStore';
import { ComponentLibrary, Component, ComponentCategory } from '../../../shared/types/component';
import SolarWirePreview from './SolarWirePreview';
import './ComponentLibraryManagerModal.css';

interface ComponentLibraryManagerModalProps {
  onClose: () => void;
}

type EditTabType = 'properties' | 'visual' | 'code';

interface DragState {
  id: string;
  type: TreeNodeType;
  libraryId: string;
}

interface DragOverState {
  id: string;
  type: TreeNodeType;
  position: 'before' | 'after' | 'inside';
}

function sanitizeSvg(svg: string): string {
  if (!svg) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    doc.querySelectorAll('script').forEach(s => s.remove());
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
        if (attr.name === 'href' && attr.value.startsWith('javascript:')) el.removeAttribute(attr.name);
      });
    });
    const svgEl = doc.querySelector('svg');
    return svgEl ? svgEl.outerHTML : '';
  } catch {
    return '';
  }
}

const ComponentLibraryManagerModal: React.FC<ComponentLibraryManagerModalProps> = ({ onClose }) => {
  const {
    libraries, selectedNodeId, selectedNodeType, expandedNodes,
    setSelectedNode, toggleNode, removeLibrary, exportLibrary, updateLibrary,
    createLibrary, createCategory, updateCategory, deleteCategory,
    createComponent, updateComponent, deleteComponent, moveCategory, moveComponent,
  } = useComponentLibraryStore();

  const [libraryEditTab, setLibraryEditTab] = useState<EditTabType>('properties');
  const [categoryEditTab, setCategoryEditTab] = useState<EditTabType>('properties');
  const [componentEditTab, setComponentEditTab] = useState<EditTabType>('properties');
  const [showNewLibraryForm, setShowNewLibraryForm] = useState(false);
  const [newLibraryData, setNewLibraryData] = useState({ name: '', id: '', description: '', version: '1.0.0', author: '' });
  const [draggedNode, setDraggedNode] = useState<DragState | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverState | null>(null);

  const selectedLibrary = useMemo(() => {
    if (selectedNodeType === 'library') return libraries.find(lib => lib.metadata.id === selectedNodeId) || null;
    return libraries.find(lib => lib.metadata.id === useComponentLibraryStore.getState().selectedLibraryId) || null;
  }, [libraries, selectedNodeId, selectedNodeType]);

  const selectedCategory = useMemo(() => {
    if (!selectedLibrary || selectedNodeType !== 'category' || !selectedNodeId) return null;
    return selectedLibrary.categories.find(c => c.id === selectedNodeId) || null;
  }, [selectedLibrary, selectedNodeId, selectedNodeType]);

  const selectedComponent = useMemo(() => {
    if (!selectedLibrary || selectedNodeType !== 'component' || !selectedNodeId) return null;
    return selectedLibrary.components.find(c => c.id === selectedNodeId) || null;
  }, [selectedLibrary, selectedNodeId, selectedNodeType]);

  const getUncategorizedComponents = useCallback((library: ComponentLibrary | null) => {
    if (!library) return [];
    const categoryIds = new Set(library.categories.map(c => c.id));
    return library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  }, []);

  const handleCreateLibrary = async () => {
    if (!newLibraryData.name.trim()) return;
    const lib = await createLibrary({ ...newLibraryData, id: newLibraryData.id || `lib-${Date.now()}` });
    setShowNewLibraryForm(false);
    setNewLibraryData({ name: '', id: '', description: '', version: '1.0.0', author: '' });
    setSelectedNode(lib.metadata.id, 'library', lib.metadata.id);
  };

  const handleImportLibrary = () => {
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
  };

  const handleRemoveLibrary = async (libraryId: string) => {
    const lib = libraries.find(l => l.metadata.id === libraryId);
    if (!lib) return;
    if (window.confirm(`确定要从编辑器中移除「${lib.metadata.name}」吗？\n\n此操作仅从编辑器中移除引用，不会删除实际文件。`)) {
      await removeLibrary(libraryId);
      if (selectedNodeId === libraryId) setSelectedNode(null, null, null);
    }
  };

  const handleDeleteCategory = async (libraryId: string, categoryId: string) => {
    const cat = selectedLibrary?.categories.find(c => c.id === categoryId);
    if (!cat) return;
    const comps = selectedLibrary?.components.filter(c => c.categoryId === categoryId) || [];
    const msg = comps.length > 0
      ? `确定要删除「${cat.name}」吗？\n\n该分类下的 ${comps.length} 个组件将移到未分类。`
      : `确定要删除「${cat.name}」吗？`;
    if (window.confirm(msg)) {
      await deleteCategory(libraryId, categoryId);
      if (selectedNodeId === categoryId) setSelectedNode(null, null, null);
    }
  };

  const handleDeleteComponent = async (libraryId: string, componentId: string) => {
    const comp = selectedLibrary?.components.find(c => c.id === componentId);
    if (!comp) return;
    if (window.confirm(`确定要删除「${comp.name}」吗？`)) {
      await deleteComponent(libraryId, componentId);
      if (selectedNodeId === componentId) setSelectedNode(null, null, null);
    }
  };

  const handleCreateCategory = async (libraryId: string) => {
    const cat = await createCategory(libraryId, { name: '新分类' });
    toggleNode(libraryId);
    setSelectedNode(cat.id, 'category', libraryId);
  };

  const handleCreateComponent = async (libraryId: string, categoryId: string | null) => {
    const comp = await createComponent(libraryId, categoryId, { name: '新组件', code: '' });
    if (categoryId) toggleNode(categoryId);
    setSelectedNode(comp.id, 'component', libraryId);
    setComponentEditTab('code');
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: TreeNodeType, libraryId: string) => {
    setDraggedNode({ id, type, libraryId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type, libraryId }));
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
    setDragOverTarget(null);
  };

  const computeDropPosition = (e: React.DragEvent, targetType: TreeNodeType): 'before' | 'after' | 'inside' => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    if (targetType === 'library') return y < height / 2 ? 'before' : 'after';
    if (y < height * 0.33) return 'before';
    if (y > height * 0.66) return 'after';
    return 'inside';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, targetType: TreeNodeType) => {
    e.preventDefault();
    if (!draggedNode) return;
    if (draggedNode.id === targetId && draggedNode.type === targetType) return;

    const currentSelectedLibraryId = useComponentLibraryStore.getState().selectedLibraryId;

    if (targetType === 'library') {
      if (draggedNode.libraryId !== currentSelectedLibraryId && !expandedNodes.has(targetId)) {
        toggleNode(targetId);
      }
    } else if (targetType === 'category' && !expandedNodes.has(targetId)) {
      toggleNode(targetId);
    } else if (targetType === 'component') {
      const targetComp = libraries.flatMap(l => l.components).find(c => c.id === targetId);
      if (targetComp?.categoryId && !expandedNodes.has(targetComp.categoryId)) {
        toggleNode(targetComp.categoryId);
      }
    }

    setDragOverTarget({ id: targetId, type: targetType, position: computeDropPosition(e, targetType) });
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: TreeNodeType) => {
    e.preventDefault();
    if (!draggedNode || !dragOverTarget) return;
    const { id: sourceId, type: sourceType, libraryId: sourceLibraryId } = draggedNode;
    const { position } = dragOverTarget;

    if (sourceType === 'category' && targetType === 'category') {
      const resolvedPosition = position === 'inside' ? 'after' : position;
      moveCategory(sourceLibraryId, sourceId, targetId, targetId, resolvedPosition);
    } else if (sourceType === 'category' && targetType === 'library') {
      moveCategory(sourceLibraryId, sourceId, targetId, null, position);
    } else if (sourceType === 'component' && targetType === 'category') {
      const targetLib = libraries.find(l => l.categories.some(c => c.id === targetId));
      const targetLibraryId = targetLib?.metadata.id || sourceLibraryId;
      if (position === 'inside') {
        moveComponent(sourceLibraryId, sourceId, targetLibraryId, targetId, '', 'after');
      } else {
        moveComponent(sourceLibraryId, sourceId, targetLibraryId, targetId, '', position);
      }
    } else if (sourceType === 'component' && targetType === 'component') {
      const targetLib = libraries.find(l => l.components.some(c => c.id === targetId));
      const targetComp = targetLib?.components.find(c => c.id === targetId);
      const resolvedCategoryId = targetComp?.categoryId || null;
      const resolvedPosition = position === 'inside' ? 'after' : position;
      moveComponent(sourceLibraryId, sourceId, targetLib?.metadata.id || sourceLibraryId, resolvedCategoryId, targetId, resolvedPosition);
    }

    setDraggedNode(null);
    setDragOverTarget(null);
  };

  const handleDropOnUncategorized = (libraryId: string) => {
    if (!draggedNode) return;
    const { id: sourceId, type: sourceType, libraryId: sourceLibraryId } = draggedNode;
    if (sourceType === 'component') {
      moveComponent(sourceLibraryId, sourceId, libraryId, null, '', 'after');
    }
    setDraggedNode(null);
    setDragOverTarget(null);
  };

  return (
    <div className="component-library-manager-overlay">
      <div className="component-library-manager-header">
        <div className="component-library-manager-title">📦 组件库管理</div>
        <button className="component-library-manager-close" onClick={onClose}>✕</button>
      </div>
      <div className="component-library-manager-content">
        <div className="manager-tree-panel">
          <div className="manager-tree-list">
            {libraries.map((library) => (
              <LibraryTreeNode
                key={library.metadata.id}
                library={library}
                isSelected={selectedNodeId === library.metadata.id && selectedNodeType === 'library'}
                isExpanded={expandedNodes.has(library.metadata.id)}
                onToggle={() => toggleNode(library.metadata.id)}
                onSelect={() => setSelectedNode(library.metadata.id, 'library', library.metadata.id)}
                onDragStart={(e) => handleDragStart(e, library.metadata.id, 'library', library.metadata.id)}
                onDragOver={(e) => handleDragOver(e, library.metadata.id, 'library')}
                onDrop={(e) => handleDrop(e, library.metadata.id, 'library')}
                onDragEnd={handleDragEnd}
                dragOverTarget={dragOverTarget}
                onCreateCategory={() => handleCreateCategory(library.metadata.id)}
                onDeleteCategory={handleDeleteCategory}
                onCreateComponent={handleCreateComponent}
                isPreset={library.metadata.id.startsWith('preset-')}
                hasUncategorized={getUncategorizedComponents(library).length > 0}
                uncategorizedCount={getUncategorizedComponents(library).length}
                onDragOverCategory={(e, id) => handleDragOver(e, id, 'category')}
                onDropOnCategory={(e, id) => handleDrop(e, id, 'category')}
                onDragOverUncategorized={(e) => { e.preventDefault(); if (draggedNode) setDragOverTarget({ id: 'uncategorized', type: 'category', position: 'inside' }); }}
                onDropOnUncategorized={() => handleDropOnUncategorized(library.metadata.id)}
                selectedNodeId={selectedNodeId}
                selectedNodeType={selectedNodeType}
                expandedNodes={expandedNodes}
                onDragStartNode={handleDragStart}
              />
            ))}
          </div>
          <div className="manager-tree-actions">
            {showNewLibraryForm ? (
              <div className="new-library-form">
                <input type="text" placeholder="组件库名称 *" value={newLibraryData.name} onChange={(e) => setNewLibraryData({ ...newLibraryData, name: e.target.value })} autoFocus />
                <input type="text" placeholder="ID（留空自动生成）" value={newLibraryData.id} onChange={(e) => setNewLibraryData({ ...newLibraryData, id: e.target.value })} />
                <input type="text" placeholder="描述" value={newLibraryData.description} onChange={(e) => setNewLibraryData({ ...newLibraryData, description: e.target.value })} />
                <input type="text" placeholder="版本" value={newLibraryData.version} onChange={(e) => setNewLibraryData({ ...newLibraryData, version: e.target.value })} />
                <input type="text" placeholder="作者" value={newLibraryData.author} onChange={(e) => setNewLibraryData({ ...newLibraryData, author: e.target.value })} />
                <div className="new-library-form-actions">
                  <button className="btn-small btn-primary" onClick={handleCreateLibrary}>创建</button>
                  <button className="btn-small" onClick={() => { setShowNewLibraryForm(false); setNewLibraryData({ name: '', id: '', description: '', version: '1.0.0', author: '' }); }}>取消</button>
                </div>
              </div>
            ) : (
              <div className="tree-action-buttons">
                <button className="btn-tree" onClick={() => setShowNewLibraryForm(true)}>📦 新建组件库</button>
                <button className="btn-tree" onClick={handleImportLibrary}>📥 导入组件库</button>
              </div>
            )}
          </div>
        </div>
        <div className="manager-edit-panel">
          {selectedNodeType === 'library' && selectedLibrary && (
            <LibraryEditPanel library={selectedLibrary} activeTab={libraryEditTab} onTabChange={setLibraryEditTab}
              onUpdate={(updates) => updateLibrary(selectedLibrary.metadata.id, updates)}
              onExport={() => exportLibrary(selectedLibrary.metadata.id)}
              onRemove={() => handleRemoveLibrary(selectedLibrary.metadata.id)}
              onCreateCategory={() => handleCreateCategory(selectedLibrary.metadata.id)}
              isPreset={selectedLibrary.metadata.id.startsWith('preset-')} />
          )}
          {selectedNodeType === 'category' && selectedLibrary && selectedCategory && (
            <CategoryEditPanel library={selectedLibrary} category={selectedCategory} activeTab={categoryEditTab} onTabChange={setCategoryEditTab}
              onUpdate={(updates) => updateCategory(selectedLibrary.metadata.id, selectedCategory.id, updates)}
              onDelete={() => handleDeleteCategory(selectedLibrary.metadata.id, selectedCategory.id)}
              onCreateComponent={() => handleCreateComponent(selectedLibrary.metadata.id, selectedCategory.id)} />
          )}
          {selectedNodeType === 'component' && selectedLibrary && selectedComponent && (
            <ComponentEditPanel library={selectedLibrary} component={selectedComponent} activeTab={componentEditTab} onTabChange={setComponentEditTab}
              onUpdate={(updates) => updateComponent(selectedLibrary.metadata.id, selectedComponent.id, updates)}
              onDelete={() => handleDeleteComponent(selectedLibrary.metadata.id, selectedComponent.id)} />
          )}
          {!selectedNodeType && (
            <div className="edit-empty-state">
              <div>📋</div>
              <div>选择左侧的组件库、分类或组件进行编辑</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface LibraryTreeNodeProps {
  library: ComponentLibrary;
  isSelected: boolean; isExpanded: boolean; onToggle: () => void; onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragOverTarget: DragOverState | null;
  onCreateCategory: () => void;
  onDeleteCategory: (libraryId: string, categoryId: string) => void;
  onCreateComponent: (libraryId: string, categoryId: string | null) => void;
  isPreset: boolean; hasUncategorized: boolean; uncategorizedCount: number;
  onDragOverCategory: (e: React.DragEvent, id: string) => void;
  onDropOnCategory: (e: React.DragEvent, id: string) => void;
  onDragOverUncategorized: (e: React.DragEvent) => void;
  onDropOnUncategorized: () => void;
  selectedNodeId: string | null; selectedNodeType: TreeNodeType | null; expandedNodes: Set<string>;
  onDragStartNode: (e: React.DragEvent, id: string, type: TreeNodeType, libraryId: string) => void;
}

const LibraryTreeNode: React.FC<LibraryTreeNodeProps> = ({
  library, isSelected, isExpanded, onToggle, onSelect,
  onDragStart, onDragOver, onDrop, onDragEnd, dragOverTarget,
  onCreateCategory, onDeleteCategory, onCreateComponent, isPreset, hasUncategorized, uncategorizedCount,
  onDragOverCategory, onDropOnCategory, onDragOverUncategorized, onDropOnUncategorized,
  selectedNodeId, selectedNodeType, expandedNodes, onDragStartNode,
}) => {
  const isDropTarget = dragOverTarget?.id === library.metadata.id && dragOverTarget?.type === 'library';
  return (
    <div className={`tree-node tree-node-library ${isSelected ? 'selected' : ''} ${isDropTarget ? `drop-${dragOverTarget?.position}` : ''}`}>
      <div className="tree-node-content" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} onClick={onToggle}>
        <span className="tree-node-toggle">{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📦</span>
        <span className="tree-node-name">{library.metadata.name}</span>
        <span className="tree-node-count">({library.components.length})</span>
        <button className="tree-node-edit-btn" title="编辑" onClick={(e) => { e.stopPropagation(); onSelect(); }}>✏️</button>
        <button className="tree-node-add-btn" title="新建分类" onClick={(e) => { e.stopPropagation(); onCreateCategory(); }}>+</button>
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {library.categories.map((cat) => (
            <CategoryTreeNode key={cat.id} library={library} category={cat}
              isSelected={selectedNodeId === cat.id && selectedNodeType === 'category'}
              isExpanded={expandedNodes.has(cat.id)}
              onToggle={() => useComponentLibraryStore.getState().toggleNode(cat.id)}
              onSelect={() => useComponentLibraryStore.getState().setSelectedNode(cat.id, 'category', library.metadata.id)}
              onDragOverCategory={onDragOverCategory} onDropOnCategory={onDropOnCategory}
              onDragStart={(e, id, type, libId) => { e.stopPropagation(); onDragStartNode(e, id, type, libId); }}
              onDragEnd={onDragEnd} dragOverTarget={dragOverTarget}
              onCreateComponent={() => onCreateComponent(library.metadata.id, cat.id)}
              onDelete={() => onDeleteCategory(library.metadata.id, cat.id)}
              selectedNodeId={selectedNodeId} selectedNodeType={selectedNodeType} />
          ))}
          {hasUncategorized && (
            <UncategorizedNode library={library} count={uncategorizedCount}
              isSelected={selectedNodeId === 'uncategorized' && selectedNodeType === 'category'}
              isExpanded={expandedNodes.has('uncategorized')}
              onToggle={() => useComponentLibraryStore.getState().toggleNode('uncategorized')}
              onSelect={() => useComponentLibraryStore.getState().setSelectedNode('uncategorized', 'category', library.metadata.id)}
              onDragOverUncategorized={onDragOverUncategorized} onDropOnUncategorized={onDropOnUncategorized}
              onDragEnd={onDragEnd} dragOverTarget={dragOverTarget}
              onCreateComponent={() => onCreateComponent(library.metadata.id, null)}
              selectedNodeId={selectedNodeId} selectedNodeType={selectedNodeType} />
          )}
        </div>
      )}
    </div>
  );
};

interface CategoryTreeNodeProps {
  library: ComponentLibrary; category: ComponentCategory;
  isSelected: boolean; isExpanded: boolean; onToggle: () => void; onSelect: () => void;
  onCreateComponent: () => void; onDelete: () => void;
  onDragStart: (e: React.DragEvent, id: string, type: TreeNodeType, libraryId: string) => void;
  onDragOverCategory: (e: React.DragEvent, categoryId: string) => void;
  onDropOnCategory: (e: React.DragEvent, categoryId: string) => void;
  onDragEnd: () => void; dragOverTarget: DragOverState | null;
  selectedNodeId: string | null; selectedNodeType: TreeNodeType | null;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  library, category, isSelected, isExpanded, onToggle, onSelect,
  onCreateComponent, onDelete, onDragStart, onDragOverCategory, onDropOnCategory, onDragEnd, dragOverTarget,
  selectedNodeId, selectedNodeType,
}) => {
  const components = library.components.filter(c => c.categoryId === category.id);
  const isDropTarget = dragOverTarget?.id === category.id && dragOverTarget?.type === 'category';
  return (
    <div className={`tree-node tree-node-category ${isSelected ? 'selected' : ''} ${isDropTarget ? `drop-${dragOverTarget?.position}` : ''}`}>
      <div className="tree-node-content" draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(e, category.id, 'category', library.metadata.id); }}
        onDragOver={(e) => onDragOverCategory(e, category.id)}
        onDrop={(e) => onDropOnCategory(e, category.id)}
        onDragEnd={onDragEnd} onClick={onToggle}>
        <span className="tree-node-toggle">{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📁</span>
        <span className="tree-node-name">{category.name}</span>
        <span className="tree-node-count">({components.length})</span>
        <button className="tree-node-edit-btn" title="编辑" onClick={(e) => { e.stopPropagation(); onSelect(); }}>✏️</button>
        <button className="tree-node-add-btn" title="新建组件" onClick={(e) => { e.stopPropagation(); onCreateComponent(); }}>+</button>
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {components.map((comp) => (
            <ComponentTreeNode key={comp.id} component={comp} libraryId={library.metadata.id}
              isSelected={selectedNodeId === comp.id && selectedNodeType === 'component'}
              onSelect={() => useComponentLibraryStore.getState().setSelectedNode(comp.id, 'component', library.metadata.id)}
              onDragStart={onDragStart} onDragOverComponent={onDragOverCategory} onDropOnComponent={onDropOnCategory}
              onDragEnd={onDragEnd} dragOverTarget={dragOverTarget} />
          ))}
        </div>
      )}
    </div>
  );
};

interface UncategorizedNodeProps {
  library: ComponentLibrary; count: number;
  isSelected: boolean; isExpanded: boolean; onToggle: () => void; onSelect: () => void;
  onDragOverUncategorized: (e: React.DragEvent) => void;
  onDropOnUncategorized: () => void;
  onDragEnd: () => void; dragOverTarget: DragOverState | null;
  onCreateComponent: () => void;
  selectedNodeId: string | null; selectedNodeType: TreeNodeType | null;
}

const UncategorizedNode: React.FC<UncategorizedNodeProps> = ({
  library, count, isSelected, isExpanded, onToggle, onSelect,
  onDragOverUncategorized, onDropOnUncategorized, onDragEnd, dragOverTarget, onCreateComponent,
  selectedNodeId, selectedNodeType,
}) => {
  const categoryIds = new Set(library.categories.map(c => c.id));
  const uncategorizedComponents = library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  const isDropTarget = dragOverTarget?.id === 'uncategorized' && dragOverTarget?.type === 'category';
  return (
    <div className={`tree-node tree-node-category ${isSelected ? 'selected' : ''} ${isDropTarget ? `drop-${dragOverTarget?.position}` : ''}`}>
      <div className="tree-node-content" onDragOver={onDragOverUncategorized}
        onDrop={(e) => { e.preventDefault(); onDropOnUncategorized(); }} onClick={onToggle}>
        <span className="tree-node-toggle">{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📁</span>
        <span className="tree-node-name">未分类</span>
        <span className="tree-node-count">({count})</span>
        <button className="tree-node-add-btn" title="新建组件" onClick={(e) => { e.stopPropagation(); onCreateComponent(); }}>+</button>
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {uncategorizedComponents.map((comp) => (
            <ComponentTreeNode key={comp.id} component={comp} libraryId={library.metadata.id}
              isSelected={selectedNodeId === comp.id && selectedNodeType === 'component'}
              onSelect={() => useComponentLibraryStore.getState().setSelectedNode(comp.id, 'component', library.metadata.id)}
              onDragStart={() => {}} onDragOverComponent={onDragOverUncategorized}
              onDropOnComponent={(e) => { e.preventDefault(); onDropOnUncategorized(); }}
              onDragEnd={onDragEnd} dragOverTarget={dragOverTarget} />
          ))}
        </div>
      )}
    </div>
  );
};

interface ComponentTreeNodeProps {
  component: Component; libraryId: string;
  isSelected: boolean; onSelect: () => void;
  onDragStart: (e: React.DragEvent, id: string, type: TreeNodeType, libraryId: string) => void;
  onDragOverComponent: (e: React.DragEvent, componentId: string) => void;
  onDropOnComponent: (e: React.DragEvent, componentId: string) => void;
  onDragEnd: () => void; dragOverTarget: DragOverState | null;
}

const ComponentTreeNode: React.FC<ComponentTreeNodeProps> = ({
  component, libraryId, isSelected, onSelect,
  onDragStart, onDragOverComponent, onDropOnComponent, onDragEnd, dragOverTarget,
}) => {
  const isDropTarget = dragOverTarget?.id === component.id && dragOverTarget?.type === 'component';
  return (
    <div className={`tree-node tree-node-component ${isSelected ? 'selected' : ''} ${isDropTarget ? `drop-${dragOverTarget?.position}` : ''}`}>
      <div className="tree-node-content" draggable
        onDragStart={(e) => { e.stopPropagation(); onDragStart(e, component.id, 'component', libraryId); }}
        onDragOver={(e) => onDragOverComponent(e, component.id)}
        onDrop={(e) => onDropOnComponent(e, component.id)}
        onDragEnd={onDragEnd} onClick={onSelect}>
        <span className="tree-node-indent"></span>
        <span className="tree-node-icon">🧩</span>
        <span className="tree-node-name">{component.name}</span>
      </div>
    </div>
  );
};

interface LibraryEditPanelProps {
  library: ComponentLibrary; activeTab: EditTabType; onTabChange: (tab: EditTabType) => void;
  onUpdate: (updates: Partial<ComponentLibrary>) => void; onExport: () => void; onRemove: () => void;
  onCreateCategory: () => void; isPreset: boolean;
}

const LibraryEditPanel: React.FC<LibraryEditPanelProps> = ({ library, activeTab, onTabChange, onUpdate, onExport, onRemove, onCreateCategory, isPreset }) => (
  <div className="edit-panel">
    <div className="edit-panel-header">
      <div className="edit-panel-title"><span className="edit-panel-icon">📦</span><span>{library.metadata.name}</span></div>
      <div className="edit-panel-actions">
        <button className="btn-icon-btn" onClick={onCreateCategory} title="新建分类">📁+</button>
        <button className="btn-icon-btn" onClick={onExport} title="导出">💾</button>
        {!isPreset && <button className="btn-icon-btn btn-danger" onClick={onRemove} title="移除">🗑️</button>}
      </div>
    </div>
    <div className="edit-tabs">
      <button className={`edit-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => onTabChange('properties')}>📋</button>
      <button className={`edit-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => onTabChange('code')}>📝</button>
    </div>
    <div className="edit-tab-content">
      {activeTab === 'properties' && (
        <div className="properties-form">
          <div className="form-group"><label>名称</label><input type="text" value={library.metadata.name} onChange={(e) => onUpdate({ metadata: { ...library.metadata, name: e.target.value } })} /></div>
          <div className="form-group"><label>描述</label><textarea value={library.metadata.description || ''} onChange={(e) => onUpdate({ metadata: { ...library.metadata, description: e.target.value } })} rows={3} /></div>
          <div className="form-group"><label>版本</label><input type="text" value={library.metadata.version} onChange={(e) => onUpdate({ metadata: { ...library.metadata, version: e.target.value } })} /></div>
          <div className="form-group"><label>作者</label><input type="text" value={library.metadata.author || ''} onChange={(e) => onUpdate({ metadata: { ...library.metadata, author: e.target.value } })} /></div>
          <div className="form-group"><label>ID</label><span className="readonly-value">{library.metadata.id}</span></div>
          <div className="form-group"><label>$schema</label><span className="readonly-value">{library.$schema}</span></div>
        </div>
      )}
      {activeTab === 'code' && (
        <div className="code-editor-area">
          <textarea className="metadata-code-editor" value={`id: ${library.metadata.id}\n$schema: ${library.$schema}\nname: ${library.metadata.name}\ndescription: ${library.metadata.description || ''}\nversion: ${library.metadata.version}\nauthor: ${library.metadata.author || ''}\ncreatedAt: ${library.metadata.createdAt}\nupdatedAt: ${library.metadata.updatedAt}`} readOnly rows={12} />
        </div>
      )}
    </div>
  </div>
);

interface CategoryEditPanelProps {
  library: ComponentLibrary; category: ComponentCategory;
  activeTab: EditTabType; onTabChange: (tab: EditTabType) => void;
  onUpdate: (updates: Partial<ComponentCategory>) => void; onDelete: () => void; onCreateComponent: () => void;
}

const CategoryEditPanel: React.FC<CategoryEditPanelProps> = ({ library, category, activeTab, onTabChange, onUpdate, onDelete, onCreateComponent }) => {
  const componentCount = library.components.filter(c => c.categoryId === category.id).length;
  return (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <div className="edit-panel-title"><span className="edit-panel-icon">📁</span><span>{category.name}</span><span className="edit-panel-badge">{componentCount} 个组件</span></div>
        <div className="edit-panel-actions">
          <button className="btn-icon-btn" onClick={onCreateComponent} title="新建组件">➕</button>
          <button className="btn-icon-btn btn-danger" onClick={onDelete} title="删除分类">🗑️</button>
        </div>
      </div>
      <div className="edit-tabs">
        <button className={`edit-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => onTabChange('properties')}>📋</button>
        <button className={`edit-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => onTabChange('code')}>📝</button>
      </div>
      <div className="edit-tab-content">
        {activeTab === 'properties' && (
          <div className="properties-form">
            <div className="form-group"><label>名称</label><input type="text" value={category.name} onChange={(e) => onUpdate({ name: e.target.value })} /></div>
            <div className="form-group"><label>ID</label><span className="readonly-value">{category.id}</span></div>
          </div>
        )}
        {activeTab === 'code' && (
          <div className="code-editor-area">
            <textarea className="metadata-code-editor" value={`id: ${category.id}\nname: ${category.name}\nparentId: ${category.parentId || 'null'}`} readOnly rows={6} />
          </div>
        )}
      </div>
    </div>
  );
};

interface ComponentEditPanelProps {
  library: ComponentLibrary; component: Component;
  activeTab: EditTabType; onTabChange: (tab: EditTabType) => void;
  onUpdate: (updates: Partial<Component>) => void; onDelete: () => void;
}

const ComponentEditPanel: React.FC<ComponentEditPanelProps> = ({ library, component, activeTab, onTabChange, onUpdate, onDelete }) => {
  const [componentCode, setComponentCode] = useState(component.code || '');

  useEffect(() => {
    setComponentCode(component.code || '');
  }, [component.code]);

  return (
  <div className="edit-panel">
    <div className="edit-panel-header">
      <div className="edit-panel-title"><span className="edit-panel-icon">🧩</span><span>{component.name}</span></div>
      <div className="edit-panel-actions">
        <button className="btn-icon-btn btn-danger" onClick={onDelete} title="删除组件">🗑️</button>
      </div>
    </div>
    <div className="edit-tabs">
      <button className={`edit-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => onTabChange('properties')}>🔧</button>
      <button className={`edit-tab ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => onTabChange('visual')}>🎨</button>
      <button className={`edit-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => onTabChange('code')}>💻</button>
    </div>
    <div className="edit-tab-content">
      {activeTab === 'properties' && (
        <div className="properties-form">
          <div className="form-group"><label>ID</label><span className="readonly-value">{component.id}</span></div>
          <div className="form-group"><label>名称</label><input type="text" value={component.name} onChange={(e) => onUpdate({ name: e.target.value })} /></div>
          <div className="form-group"><label>描述</label><textarea value={component.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} rows={2} /></div>
          <div className="form-group"><label>分类</label>
            <select value={component.categoryId || ''} onChange={(e) => onUpdate({ categoryId: e.target.value || undefined })}>
              <option value="">未分类</option>
              {library.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      )}
      {activeTab === 'visual' && (
        <SolarWirePreview
          externalContent={component.code || ''}
          onExternalContentChange={(newCode: string) => onUpdate({ code: newCode })}
          zoomLevel={1}
          selectionTool="select"
          showNotes={false}
        />
      )}
      {activeTab === 'code' && (
        <div className="code-editor-area">
          <textarea className="component-code-editor" value={componentCode} onChange={(e) => setComponentCode(e.target.value)} onBlur={() => onUpdate({ code: componentCode })} rows={20} spellCheck={false} />
        </div>
      )}
    </div>
  </div>
  );
};

export default ComponentLibraryManagerModal;
