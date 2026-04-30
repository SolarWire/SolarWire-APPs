import React from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary, Component, ComponentCategory, parseNodeId, isPresetLibrary, makeUncategorizedKey, isUncategorizedComponent, isComponentUncategorized } from '../../../shared/types/component';
import { showToast } from '../../services/toast-service';
import CreateLibraryModal from '../editor/CreateLibraryModal';
import CreateCategoryModal from '../editor/CreateCategoryModal';
import CreateComponentModal from '../editor/CreateComponentModal';
import ConfirmModal from '../ui/ConfirmModal';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import './ComponentLibraryManagerView.css';

const ComponentLibraryManagerView: React.FC = () => {
  const editorStore = useEditorStore();
  const clStore = useComponentLibraryStore();

  const setMode = editorStore.setMode;
  const libraries = clStore.libraries;
  const selectedNodeId = clStore.selectedNodeId;
  const selectedNodeType = clStore.selectedNodeType;
  const expandedNodes = clStore.expandedNodes;
  const searchQuery = clStore.searchQuery;
  const setSelectedNode = clStore.setSelectedNode;
  const toggleNode = clStore.toggleNode;
  const setSearchQuery = clStore.setSearchQuery;
  const removeLibrary = clStore.removeLibrary;
  const deleteCategory = clStore.deleteCategory;
  const deleteComponent = clStore.deleteComponent;
  const reorderLibrary = clStore.reorderLibrary;
  const reorderCategory = clStore.reorderCategory;
  const reorderComponent = clStore.reorderComponent;
  const importLibrary = clStore.importLibrary;
  const isInitialized = clStore.isInitialized;
  const initialize = clStore.initialize;

  // 初始化组件库
  React.useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const [showCreateLibModal, setShowCreateLibModal] = React.useState(false);
  const [showCreateCatModal, setShowCreateCatModal] = React.useState(false);
  const [showCreateCompModal, setShowCreateCompModal] = React.useState(false);
  const [createCtx, setCreateCtx] = React.useState<{
    libraryId?: string;
    categoryId?: string | null;
  }>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [ctxMenu, setCtxMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    targetNode: {
      type: 'library' | 'category' | 'component' | 'blank';
      libraryId?: string;
      categoryId?: string | null;
      componentId?: string;
    } | null;
  }>({ visible: false, x: 0, y: 0, targetNode: null });

  const [confirmDlg, setConfirmDlg] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type: 'info' | 'warning' | 'danger';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });

  const parsedNode = React.useMemo(() => {
    if (!selectedNodeId) return null;
    return parseNodeId(selectedNodeId);
  }, [selectedNodeId]);

  const selectedLibrary = React.useMemo(() => {
    if (!parsedNode || selectedNodeType !== 'library') return null;
    return libraries.find(lib => lib.metadata.id === parsedNode.id) || null;
  }, [libraries, parsedNode, selectedNodeType]);

  const selectedCategory = React.useMemo(() => {
    if (!parsedNode || selectedNodeType !== 'category') return null;
    // Find the library first
    const library = libraries.find(lib => lib.metadata.id === parsedNode.libraryId);
    if (!library) return null;
    return library.categories.find(cat => cat.id === parsedNode.id) || null;
  }, [libraries, parsedNode, selectedNodeType]);

  const selectedComponent = React.useMemo(() => {
    if (!parsedNode || selectedNodeType !== 'component') return null;
    // Find the library first
    const library = libraries.find(lib => lib.metadata.id === parsedNode.libraryId);
    if (!library) return null;
    return library.components.find(comp => comp.internalId === parsedNode.id) || null;
  }, [libraries, parsedNode, selectedNodeType]);

  const filteredLibraries = React.useMemo(() => {
    if (!searchQuery.trim()) return libraries;
    const query = searchQuery.toLowerCase();
    return libraries.filter(lib => {
      const matchesName = lib.metadata.name.toLowerCase().includes(query);
      const matchesCategories = lib.categories.some(cat => cat.name.toLowerCase().includes(query));
      const matchesComponents = lib.components.some(comp => comp.name.toLowerCase().includes(query));
      return matchesName || matchesCategories || matchesComponents;
    });
  }, [libraries, searchQuery]);

  const closeCtxMenu = React.useCallback(() => {
    setCtxMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const showCtxMenu = React.useCallback((x: number, y: number, targetNode: any) => {
    setCtxMenu({ visible: true, x, y, targetNode });
  }, []);

  const handleImportLib = React.useCallback(() => {
    // Use standard file input to allow selecting files from anywhere
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const fileObj = new File([content], file.name, { type: 'application/json' });
      await importLibrary(fileObj);
      showToast('导入成功', 'success');
    } catch (err) {
      console.error('导入失败:', err);
      showToast('导入失败: ' + (err as Error).message, 'error');
    }

    // Reset the file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [importLibrary]);

  const getMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const { targetNode } = ctxMenu;

    if (!targetNode || targetNode.type === 'blank') {
      items.push({ type: 'item', label: '新建组件库', icon: '📦', onClick: () => setShowCreateLibModal(true) });
      items.push({ type: 'item', label: '新建分类', icon: '📁', onClick: () => {
        setCreateCtx({ libraryId: undefined, categoryId: undefined });
        setShowCreateCatModal(true);
      }});
      items.push({ type: 'item', label: '新建组件', icon: '🧩', onClick: () => {
        setCreateCtx({ libraryId: undefined, categoryId: undefined });
        setShowCreateCompModal(true);
      }});
    } else if (targetNode.type === 'library') {
      items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => {
        setSelectedNode(targetNode.libraryId!, 'library', targetNode.libraryId!);
        setMode('componentLibraryManager');
      }});
      items.push({ type: 'separator' });
      if (!isPresetLibrary(targetNode.libraryId!)) {
        items.push({ type: 'item', label: '新建分类', icon: '📁', onClick: () => {
          setCreateCtx({ libraryId: targetNode.libraryId });
          setShowCreateCatModal(true);
        }});
        items.push({ type: 'item', label: '新建组件', icon: '🧩', onClick: () => {
          setCreateCtx({ libraryId: targetNode.libraryId });
          setShowCreateCompModal(true);
        }});
        items.push({ type: 'separator' });
        items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => reorderLibrary(targetNode.libraryId!, 'top') });
        items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => reorderLibrary(targetNode.libraryId!, 'up') });
        items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => reorderLibrary(targetNode.libraryId!, 'down') });
        items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => reorderLibrary(targetNode.libraryId!, 'bottom') });
        items.push({ type: 'separator' });
        items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
          const library = libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId);
          setConfirmDlg({
            isOpen: true,
            title: '删除组件库',
            message: `确定要删除组件库 "${library?.metadata.name}" 吗？此操作不可撤销。`,
            onConfirm: () => {
              removeLibrary(targetNode.libraryId!);
              setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
            },
            onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
            type: 'danger'
          });
        }});
      }
    } else if (targetNode.type === 'category') {
      const isUncategorized = targetNode.categoryId === makeUncategorizedKey(targetNode.libraryId!);
      if (!isUncategorized) {
        items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => {
          setSelectedNode(targetNode.categoryId!, 'category', targetNode.libraryId!);
          setMode('componentLibraryManager');
        }});
        items.push({ type: 'separator' });
      }
      items.push({ type: 'item', label: '新建组件', icon: '🧩', onClick: () => {
        setCreateCtx({ libraryId: targetNode.libraryId, categoryId: targetNode.categoryId });
        setShowCreateCompModal(true);
      }});
      if (!isUncategorized) {
        items.push({ type: 'separator' });
        items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'top') });
        items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'up') });
        items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'down') });
        items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'bottom') });
        items.push({ type: 'separator' });
        items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
          const library = libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId);
          const catName = library?.categories.find((c: ComponentCategory) => c.id === targetNode.categoryId)?.name || '';
          setConfirmDlg({
            isOpen: true,
            title: '删除分类',
            message: `确定要删除分类 "${catName}" 吗？此操作不可撤销。`,
            onConfirm: () => {
              deleteCategory(targetNode.libraryId!, targetNode.categoryId!);
              setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
            },
            onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
            type: 'danger'
          });
        }});
      }
    } else if (targetNode.type === 'component') {
      items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => {
        setSelectedNode(targetNode.componentId!, 'component', targetNode.libraryId!);
        setMode('componentLibraryManager');
      }});
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'top') });
      items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'up') });
      items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'down') });
      items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'bottom') });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
        const library = libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId);
        const compName = library?.components.find((c: Component) => c.internalId === targetNode.componentId)?.name || '';
        setConfirmDlg({
          isOpen: true,
          title: '删除组件',
          message: `确定要删除组件 "${compName}" 吗？此操作不可撤销。`,
          onConfirm: () => {
            deleteComponent(targetNode.libraryId!, targetNode.componentId!);
            setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
          },
          onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
          type: 'danger'
        });
      }});
    }

    return items;
  };

  const handleNodeClick = (nodeId: string, nodeType: 'library' | 'category' | 'component', libraryId: string) => {
    if (nodeType === 'component') {
      setSelectedNode(nodeId, nodeType, libraryId);
      setMode('componentLibraryManager');
    } else {
      // 对于库和分类，点击只展开/收起，不进入编辑模式
      handleToggle(nodeId);
    }
  };

  const handleToggle = (nodeId: string) => {
    toggleNode(nodeId);
  };

  const renderUncategorizedCategoryNode = (library: ComponentLibrary, components: Component[]) => {
    const uncategorizedId = makeUncategorizedKey(library.metadata.id);
    const isExpanded = expandedNodes.includes(uncategorizedId);

    return (
      <div key={uncategorizedId} className="tree-node tree-node-category tree-node-uncategorized">
        <div 
          className="tree-node-content" 
          onClick={() => handleToggle(uncategorizedId)}
        >
          <span className="tree-node-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(uncategorizedId); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="tree-node-icon">📁</span>
          <span className="tree-node-name">未分类</span>
          <span className="tree-node-count">({components.length})</span>
        </div>
        {isExpanded && (
          <div className="tree-node-children">
            {components.map(comp => renderComponentNode(library, comp))}
          </div>
        )}
      </div>
    );
  };

  const renderLibraryNode = (library: ComponentLibrary) => {
    const isSelected = parsedNode?.id === library.metadata.id && selectedNodeType === 'library';
    const isExpanded = expandedNodes.includes(library.metadata.id);
    const uncategorizedComponents = library.components.filter(c => isComponentUncategorized(c.categoryId, library.categories));
    const hasUncategorized = uncategorizedComponents.length > 0;

    return (
      <div key={library.metadata.id} className={`tree-node tree-node-library ${isSelected ? 'selected' : ''}`}>
        <div 
          className="tree-node-content" 
          onClick={() => handleNodeClick(library.metadata.id, 'library', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showCtxMenu(e.clientX, e.clientY, { type: 'library', libraryId: library.metadata.id });
          }}
        >
          <span className="tree-node-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(library.metadata.id); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="tree-node-icon">📦</span>
          <span className="tree-node-name">{library.metadata.name}</span>
          <span className="tree-node-count">({library.components.length})</span>
        </div>
        {isExpanded && (
          <div className="tree-node-children">
            {library.categories.map(cat => renderCategoryNode(library, cat))}
            {hasUncategorized && renderUncategorizedCategoryNode(library, uncategorizedComponents)}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryNode = (library: ComponentLibrary, category: ComponentCategory) => {
    const components = library.components.filter(c => c.categoryId === category.id);
    const isSelected = parsedNode?.id === category.id && selectedNodeType === 'category';
    const isExpanded = expandedNodes.includes(category.id);

    return (
      <div key={category.id} className={`tree-node tree-node-category ${isSelected ? 'selected' : ''}`}>
        <div 
          className="tree-node-content" 
          onClick={() => handleNodeClick(category.id, 'category', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showCtxMenu(e.clientX, e.clientY, { type: 'category', libraryId: library.metadata.id, categoryId: category.id });
          }}
        >
          <span className="tree-node-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(category.id); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="tree-node-icon">📁</span>
          <span className="tree-node-name">{category.name}</span>
          <span className="tree-node-count">({components.length})</span>
        </div>
        {isExpanded && (
          <div className="tree-node-children">
            {components.map(comp => renderComponentNode(library, comp))}
          </div>
        )}
      </div>
    );
  };

  const renderComponentNode = (library: ComponentLibrary, component: Component) => {
    const isSelected = parsedNode?.id === component.internalId && selectedNodeType === 'component';

    return (
      <div key={component.internalId} className={`tree-node tree-node-component ${isSelected ? 'selected' : ''}`}>
        <div 
          className="tree-node-content" 
          onClick={() => handleNodeClick(component.internalId, 'component', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showCtxMenu(e.clientX, e.clientY, { type: 'component', libraryId: library.metadata.id, componentId: component.internalId });
          }}
        >
          <span className="tree-node-indent"></span>
          <span className="tree-node-icon">🧩</span>
          <span className="tree-node-name">{component.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="component-library-manager-view">
      <div className="component-library-manager-content">
        <div className="manager-tree-panel">
          <div className="manager-tree-header">
            <div className="manager-tree-actions">
              <div className="tree-action-buttons-compact">
                <button className="btn-compact" onClick={() => setShowCreateLibModal(true)}>
                  <span className="btn-icon">➕</span>
                  <span className="btn-text">新建库</span>
                </button>
                <button className="btn-compact" onClick={handleImportLib}>
                  <span className="btn-icon">📥</span>
                  <span className="btn-text">导入</span>
                </button>
              </div>
            </div>
            <div className="manager-tree-search">
              <input
                type="text"
                placeholder="搜索组件库..."
                className="tree-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div 
            className="manager-tree-list"
            onContextMenu={(e) => {
              e.preventDefault();
              showCtxMenu(e.clientX, e.clientY, { type: 'blank' });
            }}
          >
            {filteredLibraries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <div className="empty-text">暂无组件库</div>
              </div>
            ) : (
              filteredLibraries.map(library => renderLibraryNode(library))
            )}
          </div>
        </div>
      </div>
      
      {showCreateLibModal && (
        <CreateLibraryModal
          isOpen={showCreateLibModal}
          onClose={() => setShowCreateLibModal(false)}
        />
      )}
      
      {showCreateCatModal && (
        <CreateCategoryModal
          isOpen={showCreateCatModal}
          defaultLibraryId={createCtx.libraryId}
          onClose={() => setShowCreateCatModal(false)}
        />
      )}
      
      {showCreateCompModal && (
        <CreateComponentModal
          isOpen={showCreateCompModal}
          defaultLibraryId={createCtx.libraryId}
          defaultCategoryId={createCtx.categoryId}
          onClose={() => setShowCreateCompModal(false)}
        />
      )}
      
      {confirmDlg.isOpen && (
        <ConfirmModal
          isOpen={confirmDlg.isOpen}
          title={confirmDlg.title}
          message={confirmDlg.message}
          onConfirm={confirmDlg.onConfirm}
          onCancel={confirmDlg.onCancel}
          type={confirmDlg.type}
        />
      )}
      
      {ctxMenu.visible && (
        <ContextMenu
          visible={ctxMenu.visible}
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={getMenuItems()}
          onClose={closeCtxMenu}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".swc"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default ComponentLibraryManagerView;
