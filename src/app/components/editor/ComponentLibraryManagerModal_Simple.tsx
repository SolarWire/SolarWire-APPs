import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { useComponentLibraryStore, TreeNodeType } from '../../stores/componentLibraryStore';
import { ComponentLibrary, Component, ComponentCategory, makeUncategorizedKey, isPresetLibrary } from '../../../shared/types/component';
import { showToast } from '../../services/toast-service';
import ConfirmModal from '../ui/ConfirmModal';
import './ComponentLibraryManagerModal.css';

interface TreeNodeContextValue {
  selectedLibraryId: string | null;
  selectedCategoryId: string | null;
  selectedComponentId: string | null;
  selectedNodeType: TreeNodeType | null;
  expandedNodes: string[];
  toggleNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null, nodeType: TreeNodeType | null, libraryId: string | null) => void;
}

const TreeNodeContext = createContext<TreeNodeContextValue | null>(null);

const useTreeNodeContext = () => {
  const context = useContext(TreeNodeContext);
  if (!context) {
    throw new Error('useTreeNodeContext must be used within TreeNodeProvider');
  }
  return context;
};

interface ComponentLibraryManagerModalProps {
  onClose: () => void;
}

const ComponentLibraryManagerModal: React.FC<ComponentLibraryManagerModalProps> = ({ onClose }) => {
  const {
    libraries, selectedNodeId, selectedNodeType, expandedNodes,
    setSelectedNode, toggleNode, removeLibrary, exportLibrary, updateLibrary,
    createLibrary, createCategory, updateCategory, deleteCategory,
    createComponent, updateComponent, deleteComponent, importLibrary,
  } = useComponentLibraryStore();

  const [libraryEditTab, setLibraryEditTab] = useState<'properties' | 'categories' | 'components'>('properties');
  const [categoryEditTab, setCategoryEditTab] = useState<'properties' | 'components'>('properties');
  const [componentEditTab, setComponentEditTab] = useState<'properties' | 'code' | 'preview'>('code');
  const [showNewLibraryForm, setShowNewLibraryForm] = useState(false);
  const [newLibraryData, setNewLibraryData] = useState({ name: '', id: '', description: '', version: '1.0.0', author: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; id?: string }>({});

  const selectedLibraryId = useComponentLibraryStore(s => s.selectedLibraryId);
  const selectedComponentId = useComponentLibraryStore(s => s.selectedComponentId);
  const selectedCategoryId = useComponentLibraryStore(s => s.selectedCategoryId);

  const selectedLibrary = useMemo(() => {
    if (!selectedLibraryId) return null;
    return libraries.find(lib => lib.metadata.id === selectedLibraryId) || null;
  }, [libraries, selectedLibraryId]);

  const selectedCategory = useMemo(() => {
    if (!selectedLibrary || !selectedCategoryId) return null;
    return selectedLibrary.categories.find(cat => cat.id === selectedCategoryId) || null;
  }, [selectedLibrary, selectedCategoryId]);

  const selectedComponent = useMemo(() => {
    if (!selectedLibrary || !selectedComponentId) return null;
    return selectedLibrary.components.find(comp => comp.internalId === selectedComponentId) || null;
  }, [selectedLibrary, selectedComponentId]);

  const getUncategorizedComponents = useCallback((library: ComponentLibrary) => {
    const categoryIds = new Set(library.categories.map(c => c.id));
    return library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  }, []);

  const filteredLibraries = useMemo(() => {
    const searchQuery = useComponentLibraryStore(s => s.searchQuery);
    if (!searchQuery) return libraries;
    
    return libraries.filter(lib => {
      const searchLower = searchQuery.toLowerCase();
      if (lib.metadata.name.toLowerCase().includes(searchLower)) return true;
      
      const categoryMatch = lib.categories.some(cat => 
        cat.name.toLowerCase().includes(searchLower)
      );
      if (categoryMatch) return true;
      
      return lib.components.some(comp => 
        comp.name.toLowerCase().includes(searchLower)
      );
    });
  }, [libraries]);

  const handleCreateLibrary = useCallback(async () => {
    if (!newLibraryData.name.trim()) {
      setFormErrors({ name: '组件库名称不能为空' });
      return;
    }

    try {
      await createLibrary({
        name: newLibraryData.name.trim(),
        id: newLibraryData.id.trim() || undefined,
        description: newLibraryData.description.trim(),
        version: newLibraryData.version.trim(),
        author: newLibraryData.author.trim(),
      });
      
      setShowNewLibraryForm(false);
      setNewLibraryData({ name: '', id: '', description: '', version: '1.0.0', author: '' });
      setFormErrors({});
      showToast('组件库创建成功', 'success');
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      }
    }
  }, [newLibraryData, createLibrary]);

  const handleImportLibrary = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await importLibrary(file);
          showToast('组件库导入成功', 'success');
        } catch (err) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          }
        }
      }
    };
    input.click();
  }, [importLibrary]);

  const handleRemoveLibrary = useCallback((libraryId: string) => {
    const library = libraries.find(l => l.metadata.id === libraryId);
    if (!library) return;
    
    setConfirmModal({
      isOpen: true,
      title: '删除组件库',
      message: `确定要删除组件库"${library.metadata.name}"吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          await removeLibrary(libraryId);
          setSelectedNode(null, null, null);
          showToast('组件库删除成功', 'success');
        } catch (err) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          }
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });
      },
      type: 'danger'
    });
  }, [libraries, removeLibrary, setSelectedNode]);

  const handleDeleteCategory = useCallback((libraryId: string, categoryId: string) => {
    const library = libraries.find(l => l.metadata.id === libraryId);
    const category = library?.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    setConfirmModal({
      isOpen: true,
      title: '删除分类',
      message: `确定要删除分类"${category.name}"吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          await deleteCategory(libraryId, categoryId);
          setSelectedNode(null, null, null);
          showToast('分类删除成功', 'success');
        } catch (err) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          }
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });
      },
      type: 'danger'
    });
  }, [libraries, deleteCategory, setSelectedNode]);

  const handleDeleteComponent = useCallback((libraryId: string, componentId: string) => {
    const library = libraries.find(l => l.metadata.id === libraryId);
    const component = library?.components.find(c => c.internalId === componentId);
    if (!component) return;
    
    setConfirmModal({
      isOpen: true,
      title: '删除组件',
      message: `确定要删除组件"${component.name}"吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          await deleteComponent(libraryId, componentId);
          setSelectedNode(null, null, null);
          showToast('组件删除成功', 'success');
        } catch (err) {
          if (err instanceof Error) {
            showToast(err.message, 'error');
          }
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });
      },
      type: 'danger'
    });
  }, [libraries, deleteComponent, setSelectedNode]);

  const handleCreateCategory = useCallback(async (libraryId: string) => {
    try {
      await createCategory(libraryId, { name: '新分类' });
      showToast('分类创建成功', 'success');
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      }
    }
  }, [createCategory]);

  const handleCreateComponent = useCallback(async (libraryId: string, categoryId: string | null) => {
    try {
      await createComponent(libraryId, categoryId, {
        name: '新组件',
        code: '// 组件代码',
        description: '组件描述',
      });
      showToast('组件创建成功', 'success');
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      }
    }
  }, [createComponent]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  return (
    <div className="component-library-manager-overlay">
      <div className="component-library-manager-modal">
        <div className="component-library-manager-header">
          <div className="component-library-manager-title">📦 组件库管理</div>
          <button className="component-library-manager-close" onClick={onClose}>✕</button>
        </div>
        <div className="component-library-manager-content">
          <div className="manager-tree-panel">
            <div className="manager-tree-search">
              <input
                type="text"
                placeholder="搜索组件库、分类或组件..."
                className="tree-search-input"
              />
            </div>
            <div className="manager-tree-actions">
              {showNewLibraryForm ? (
                <div className="new-library-form">
                  <input
                    type="text"
                    placeholder="组件库名称 *"
                    value={newLibraryData.name}
                    onChange={(e) => {
                      setNewLibraryData({ ...newLibraryData, name: e.target.value });
                      setFormErrors({ ...formErrors, name: undefined });
                    }}
                    className={formErrors.name ? 'input-error' : ''}
                    autoFocus
                  />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                  <input
                    type="text"
                    placeholder="ID（留空自动生成）"
                    value={newLibraryData.id}
                    onChange={(e) => {
                      setNewLibraryData({ ...newLibraryData, id: e.target.value });
                      setFormErrors({ ...formErrors, id: undefined });
                    }}
                    className={formErrors.id ? 'input-error' : ''}
                  />
                  {formErrors.id && <div className="form-error">{formErrors.id}</div>}
                  <input type="text" placeholder="描述" value={newLibraryData.description} onChange={(e) => setNewLibraryData({ ...newLibraryData, description: e.target.value })} />
                  <input type="text" placeholder="版本" value={newLibraryData.version} onChange={(e) => setNewLibraryData({ ...newLibraryData, version: e.target.value })} />
                  <input type="text" placeholder="作者" value={newLibraryData.author} onChange={(e) => setNewLibraryData({ ...newLibraryData, author: e.target.value })} />
                  <div className="new-library-form-actions">
                    <button className="btn-small btn-primary" onClick={handleCreateLibrary}>创建</button>
                    <button className="btn-small" onClick={() => { setShowNewLibraryForm(false); setNewLibraryData({ name: '', id: '', description: '', version: '1.0.0', author: '' }); setFormErrors({}); }}>取消</button>
                  </div>
                </div>
              ) : (
                <div className="tree-action-buttons">
                  <button className="btn-tree" onClick={() => setShowNewLibraryForm(true)}>📦 新建组件库</button>
                  <button className="btn-tree" onClick={handleImportLibrary}>📥 导入组件库</button>
                </div>
              )}
            </div>
            <div className="manager-tree-list">
              <TreeNodeContext.Provider value={{
                selectedLibraryId,
                selectedCategoryId,
                selectedComponentId,
                selectedNodeType,
                expandedNodes,
                toggleNode,
                setSelectedNode,
              }}>
                {filteredLibraries.map((library) => {
                  const uncategorizedComponents = getUncategorizedComponents(library);
                  return (
                    <LibraryTreeNode
                      key={library.metadata.id}
                      library={library}
                      onCreateCategory={() => handleCreateCategory(library.metadata.id)}
                      onDeleteCategory={handleDeleteCategory}
                      onCreateComponent={handleCreateComponent}
                      isPreset={isPresetLibrary(library.metadata.id)}
                      hasUncategorized={uncategorizedComponents.length > 0}
                      uncategorizedCount={uncategorizedComponents.length}
                    />
                  );
                })}
              </TreeNodeContext.Provider>
            </div>
          </div>
          <div className="manager-edit-panel">
            {selectedNodeType === 'library' && selectedLibrary && (
              <div className="edit-panel-placeholder">
                <div>📋 组件库编辑面板</div>
                <div>正在编辑: {selectedLibrary.metadata.name}</div>
              </div>
            )}
            {selectedNodeType === 'category' && selectedCategory && (
              <div className="edit-panel-placeholder">
                <div>📁 分类编辑面板</div>
                <div>正在编辑: {selectedCategory.name}</div>
              </div>
            )}
            {selectedNodeType === 'component' && selectedComponent && (
              <div className="edit-panel-placeholder">
                <div>🧩 组件编辑面板</div>
                <div>正在编辑: {selectedComponent.name}</div>
              </div>
            )}
            {!selectedNodeType && (
              <div className="edit-empty-state">
                <div>📋</div>
                <div>选择左侧的组件库、分类或组件进行编辑</div>
              </div>
            )}
          </div>
        </div>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' })}
          type={confirmModal.type}
        />
      </div>
    </div>
  );
};

// LibraryTreeNode Component
interface LibraryTreeNodeProps {
  library: ComponentLibrary;
  onCreateCategory: () => void;
  onDeleteCategory: (libraryId: string, categoryId: string) => void;
  onCreateComponent: (libraryId: string, categoryId: string | null) => void;
  isPreset: boolean;
  hasUncategorized: boolean;
  uncategorizedCount: number;
}

const LibraryTreeNode = React.memo<LibraryTreeNodeProps>(({
  library,
  onCreateCategory, onDeleteCategory, onCreateComponent,
  isPreset, hasUncategorized, uncategorizedCount,
}) => {
  const { selectedLibraryId, selectedCategoryId, selectedComponentId, selectedNodeType, expandedNodes, toggleNode, setSelectedNode } = useTreeNodeContext();
  
  const isSelected = selectedLibraryId === library.metadata.id && selectedNodeType === 'library';
  const isExpanded = expandedNodes.includes(library.metadata.id);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(library.metadata.id);
  }, [toggleNode, library.metadata.id]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(library.metadata.id, 'library', library.metadata.id);
  }, [setSelectedNode, library.metadata.id]);
  
  const handleAddCategory = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateCategory();
  }, [onCreateCategory]);
  
  return (
    <div className={`tree-node tree-node-library ${isSelected ? 'selected' : ''}`}>
      <div className="tree-node-content" onClick={handleToggle}>
        <span className="tree-node-toggle" onClick={handleToggle}>{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📦</span>
        <span className="tree-node-name">{library.metadata.name}<span className="tree-node-count">({library.components.length})</span></span>
        <span className="tree-node-spacer"></span>
        <button className="tree-node-edit-btn" title="编辑" onClick={handleEdit}>✏️</button>
        {!isPreset && <button className="tree-node-add-btn" title="新建分类" onClick={handleAddCategory}>+</button>}
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {library.categories.map((cat) => (
            <CategoryTreeNode
              key={cat.id}
              library={library}
              category={cat}
              onCreateComponent={onCreateComponent}
              onDelete={onDeleteCategory}
              isPreset={isPreset}
            />
          ))}
          {hasUncategorized && (
            <UncategorizedNode
              library={library}
              count={uncategorizedCount}
              onCreateComponent={() => onCreateComponent(library.metadata.id, null)}
              isPreset={isPreset}
            />
          )}
        </div>
      )}
    </div>
  );
});

// CategoryTreeNode Component
interface CategoryTreeNodeProps {
  library: ComponentLibrary;
  category: ComponentCategory;
  onCreateComponent: (libraryId: string, categoryId: string | null) => void;
  onDelete: (libraryId: string, categoryId: string) => void;
  isPreset: boolean;
}

const CategoryTreeNode = React.memo<CategoryTreeNodeProps>(({
  library, category,
  onCreateComponent, onDelete,
  isPreset,
}) => {
  const { selectedLibraryId, selectedCategoryId, selectedComponentId, selectedNodeType, expandedNodes, toggleNode, setSelectedNode } = useTreeNodeContext();
  
  const components = library.components.filter(c => c.categoryId === category.id);
  const isSelected = selectedCategoryId === category.id && selectedLibraryId === library.metadata.id && selectedNodeType === 'category';
  const isExpanded = expandedNodes.includes(category.id);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(category.id);
  }, [toggleNode, category.id]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(category.id, 'category', library.metadata.id);
  }, [setSelectedNode, category.id, library.metadata.id]);
  
  const handleAddComponent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateComponent(library.metadata.id, category.id);
  }, [onCreateComponent, library.metadata.id, category.id]);
  
  return (
    <div className={`tree-node tree-node-category ${isSelected ? 'selected' : ''}`}>
      <div className="tree-node-content" onClick={handleToggle}>
        <span className="tree-node-toggle" onClick={handleToggle}>{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📁</span>
        <span className="tree-node-name">{category.name}<span className="tree-node-count">({components.length})</span></span>
        <span className="tree-node-spacer"></span>
        <button className="tree-node-edit-btn" title="编辑" onClick={handleEdit}>✏️</button>
        {!isPreset && <button className="tree-node-add-btn" title="新建组件" onClick={handleAddComponent}>+</button>}
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {components.map((comp) => (
            <ComponentTreeNode key={comp.internalId} component={comp} libraryId={library.metadata.id} />
          ))}
        </div>
      )}
    </div>
  );
});

// UncategorizedNode Component
interface UncategorizedNodeProps {
  library: ComponentLibrary;
  count: number;
  onCreateComponent: () => void;
  isPreset: boolean;
}

const UncategorizedNode = React.memo<UncategorizedNodeProps>(({
  library, count,
  onCreateComponent,
  isPreset,
}) => {
  const { selectedLibraryId, selectedCategoryId, selectedComponentId, selectedNodeType, expandedNodes, toggleNode, setSelectedNode } = useTreeNodeContext();
  
  const categoryIds = new Set(library.categories.map(c => c.id));
  const uncategorizedComponents = library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  const uncategorizedKey = makeUncategorizedKey(library.metadata.id);
  const isSelected = selectedCategoryId === makeUncategorizedKey(library.metadata.id) && selectedLibraryId === library.metadata.id && selectedNodeType === 'category';
  const isExpanded = expandedNodes.includes(uncategorizedKey);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(uncategorizedKey);
  }, [toggleNode, uncategorizedKey]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(makeUncategorizedKey(library.metadata.id), 'category', library.metadata.id);
  }, [setSelectedNode, library.metadata.id]);
  
  const handleAddComponent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateComponent();
  }, [onCreateComponent]);
  
  return (
    <div className={`tree-node tree-node-category ${isSelected ? 'selected' : ''}`}>
      <div className="tree-node-content" onClick={handleToggle}>
        <span className="tree-node-toggle" onClick={handleToggle}>{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-icon">📁</span>
        <span className="tree-node-name">未分类<span className="tree-node-count">({count})</span></span>
        <span className="tree-node-spacer"></span>
        {!isPreset && <button className="tree-node-edit-btn" title="编辑" onClick={handleEdit}>✏️</button>}
        {!isPreset && <button className="tree-node-add-btn" title="新建组件" onClick={handleAddComponent}>+</button>}
      </div>
      {isExpanded && (
        <div className="tree-node-children">
          {uncategorizedComponents.map((comp) => (
            <ComponentTreeNode key={comp.internalId} component={comp} libraryId={library.metadata.id} />
          ))}
        </div>
      )}
    </div>
  );
});

// ComponentTreeNode Component
interface ComponentTreeNodeProps {
  component: Component;
  libraryId: string;
}

const ComponentTreeNode = React.memo<ComponentTreeNodeProps>(({
  component, libraryId,
}) => {
  const { selectedLibraryId, selectedComponentId, selectedNodeType, setSelectedNode } = useTreeNodeContext();
  
  const isSelected = selectedComponentId === component.internalId && selectedLibraryId === libraryId && selectedNodeType === 'component';
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(component.internalId, 'component', libraryId);
  }, [setSelectedNode, component.internalId, libraryId]);
  
  return (
    <div className={`tree-node tree-node-component ${isSelected ? 'selected' : ''}`}>
      <div className="tree-node-content" onClick={handleEdit}>
        <span className="tree-node-indent"></span>
        <span className="tree-node-icon">🧩</span>
        <span className="tree-node-name">{component.name}</span>
        <span className="tree-node-spacer"></span>
        <button className="tree-node-edit-btn" title="编辑" onClick={handleEdit}>✏️</button>
      </div>
    </div>
  );
});

export default ComponentLibraryManagerModal;
