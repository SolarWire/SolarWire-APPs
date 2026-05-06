import React from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary, Component, ComponentCategory, parseNodeId, isPresetLibrary, makeUncategorizedKey, isUncategorizedComponent, isComponentUncategorized } from '../../../shared/types/component';
import { showToast } from '../../services/toast-service';
import CreateLibraryModal from '../editor/CreateLibraryModal';
import CreateCategoryModal from '../editor/CreateCategoryModal';
import CreateComponentModal from '../editor/CreateComponentModal';
import ConfirmModal from '../ui/ConfirmModal';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import ComponentLibraryLibraryEditMode from './ComponentLibraryLibraryEditMode';
import ComponentLibraryCategoryEditMode from './ComponentLibraryCategoryEditMode';
import ComponentLibraryComponentEditMode from './ComponentLibraryComponentEditMode';
import './ComponentLibraryManagerMode.css';

const ComponentLibraryManagerMode: React.FC = () => {
  const clStore = useComponentLibraryStore();

  const selectedNodeId = clStore.selectedNodeId;
  const selectedNodeType = clStore.selectedNodeType;
  const expandedNodes = clStore.expandedNodes;
  const searchQuery = clStore.searchQuery;
  const setSelectedNode = clStore.setSelectedNode;
  const toggleNode = clStore.toggleNode;
  const setSearchQuery = clStore.setSearchQuery;
  const updateLibrary = clStore.updateLibrary;
  const updateCategory = clStore.updateCategory;
  const updateComponent = clStore.updateComponent;
  const deleteLibrary = clStore.removeLibrary;
  const deleteCategory = clStore.deleteCategory;
  const deleteComponent = clStore.deleteComponent;
  const reorderLibrary = clStore.reorderLibrary;
  const reorderCategory = clStore.reorderCategory;
  const reorderComponent = clStore.reorderComponent;
  const importLibrary = clStore.importLibrary;
  const moveComponent = clStore.moveComponent;
  const moveCategory = clStore.moveCategory;

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

  const closeCtxMenu = React.useCallback(() => {
    setCtxMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const showCtxMenu = React.useCallback((x: number, y: number, targetNode: any) => {
    setCtxMenu({ visible: true, x, y, targetNode });
  }, []);

  const parsedNode = React.useMemo(() => {
    if (!clStore.selectedNodeId) return null;
    return parseNodeId(clStore.selectedNodeId);
  }, [clStore.selectedNodeId]);

  const selectedLibrary = React.useMemo(() => {
    if (clStore.selectedLibraryId) {
      return clStore.libraries.find(lib => lib.metadata.id === clStore.selectedLibraryId) || null;
    }
    return null;
  }, [clStore.libraries, clStore.selectedLibraryId]);

  const selectedCategory = React.useMemo(() => {
    if (!selectedLibrary || !clStore.selectedCategoryId) return null;
    return selectedLibrary.categories.find(cat => cat.id === clStore.selectedCategoryId) || null;
  }, [selectedLibrary, clStore.selectedCategoryId]);

  const selectedComponent = React.useMemo(() => {
    if (!selectedLibrary || !clStore.selectedComponentId) return null;
    return selectedLibrary.components.find(comp => comp.internalId === clStore.selectedComponentId) || null;
  }, [selectedLibrary, clStore.selectedComponentId]);

  const filteredLibraries = React.useMemo(() => {
    if (!clStore.searchQuery.trim()) return clStore.libraries;
    const query = clStore.searchQuery.toLowerCase();
    return clStore.libraries.filter(lib => {
      const matchesName = lib.metadata.name.toLowerCase().includes(query);
      const matchesCategories = lib.categories.some(cat => cat.name.toLowerCase().includes(query));
      const matchesComponents = lib.components.some(comp => comp.name.toLowerCase().includes(query));
      return matchesName || matchesCategories || matchesComponents;
    });
  }, [clStore.libraries, clStore.searchQuery]);

  const getMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const { targetNode } = ctxMenu;

    if (!targetNode) {
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
      items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => setSelectedNode(targetNode.libraryId!, 'library', targetNode.libraryId!) });
      items.push({ type: 'item', label: '新建分类', icon: '📁', onClick: () => {
        setCreateCtx({ libraryId: targetNode.libraryId, categoryId: undefined });
        setShowCreateCatModal(true);
      }});
      items.push({ type: 'item', label: '新建组件', icon: '🧩', onClick: () => {
        setCreateCtx({ libraryId: targetNode.libraryId, categoryId: undefined });
        setShowCreateCompModal(true);
      }});
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => clStore.reorderLibrary(targetNode.libraryId!, 'top') });
      items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => clStore.reorderLibrary(targetNode.libraryId!, 'up') });
      items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => clStore.reorderLibrary(targetNode.libraryId!, 'down') });
      items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => clStore.reorderLibrary(targetNode.libraryId!, 'bottom') });
      items.push({ type: 'separator' });
      const isPreset = isPresetLibrary(targetNode.libraryId!);
      if (!isPreset) {
        items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
          const libName = clStore.libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId)?.metadata.name || '';
          setConfirmDlg({
            isOpen: true,
            title: '删除组件库',
            message: `确定要删除组件库 "${libName}" 吗？此操作不可撤销。`,
            onConfirm: () => {
              clStore.removeLibrary(targetNode.libraryId!);
              setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
            },
            onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
            type: 'danger'
          });
        }});
      }
    } else if (targetNode.type === 'category') {
      items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => setSelectedNode(targetNode.categoryId!, 'category', targetNode.libraryId!) });
      items.push({ type: 'item', label: '新建组件', icon: '🧩', onClick: () => {
        setCreateCtx({ libraryId: targetNode.libraryId, categoryId: targetNode.categoryId });
        setShowCreateCompModal(true);
      }});
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => clStore.reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'top') });
      items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => clStore.reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'up') });
      items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => clStore.reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'down') });
      items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => clStore.reorderCategory(targetNode.libraryId!, targetNode.categoryId!, 'bottom') });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
        const library = clStore.libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId);
        const catName = library?.categories.find((c: ComponentCategory) => c.id === targetNode.categoryId)?.name || '';
        setConfirmDlg({
          isOpen: true,
          title: '删除分类',
          message: `确定要删除分类 "${catName}" 吗？此操作不可撤销。`,
          onConfirm: () => {
            clStore.deleteCategory(targetNode.libraryId!, targetNode.categoryId!);
            setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
          },
          onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
          type: 'danger'
        });
      }});
    } else if (targetNode.type === 'component') {
      items.push({ type: 'item', label: '编辑', icon: '✏️', onClick: () => setSelectedNode(targetNode.componentId!, 'component', targetNode.libraryId!) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '置顶', icon: '⬆️', onClick: () => clStore.reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'top') });
      items.push({ type: 'item', label: '上移', icon: '🔼', onClick: () => clStore.reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'up') });
      items.push({ type: 'item', label: '下移', icon: '🔽', onClick: () => clStore.reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'down') });
      items.push({ type: 'item', label: '置底', icon: '⬇️', onClick: () => clStore.reorderComponent(targetNode.libraryId!, targetNode.componentId!, 'bottom') });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => {
        const library = clStore.libraries.find((l: ComponentLibrary) => l.metadata.id === targetNode.libraryId);
        const compName = library?.components.find((c: Component) => c.internalId === targetNode.componentId)?.name || '';
        setConfirmDlg({
          isOpen: true,
          title: '删除组件',
          message: `确定要删除组件 "${compName}" 吗？此操作不可撤销。`,
          onConfirm: () => {
            clStore.deleteComponent(targetNode.libraryId!, targetNode.componentId!);
            setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
          },
          onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' }),
          type: 'danger'
        });
      }});
    }

    return items;
  };

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

  const handleNodeClick = (nodeId: string, nodeType: 'library' | 'category' | 'component', libraryId: string) => {
    setSelectedNode(nodeId, nodeType, libraryId);
  };

  const handleToggle = (nodeId: string) => {
    toggleNode(nodeId);
  };

  const renderUncategorizedCategoryNode = (library: ComponentLibrary, components: Component[]) => {
    const uncategorizedId = makeUncategorizedKey(library.metadata.id);
    const isExpanded = expandedNodes.includes(uncategorizedId);

    return (
      <div key={uncategorizedId} className="clm-tree-node clm-category-node clm-uncategorized-node">
        <div 
          className="clm-node-content" 
          onClick={() => handleToggle(uncategorizedId)}
        >
          <span className="clm-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(uncategorizedId); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="clm-icon">📁</span>
          <span className="clm-name">未分类</span>
          <span className="clm-count">({components.length})</span>
        </div>
        {isExpanded && (
          <div className="clm-children">
            {components.map(comp => renderComponentNode(library, comp))}
          </div>
        )}
      </div>
    );
  };

  const renderLibraryNode = (library: ComponentLibrary) => {
    const isSelected = selectedLibrary?.metadata.id === library.metadata.id && selectedNodeType === 'library';
    const isExpanded = expandedNodes.includes(library.metadata.id);
    const uncategorizedComponents = library.components.filter(c => isComponentUncategorized(c.categoryId, library.categories));
    const hasUncategorized = uncategorizedComponents.length > 0;

    return (
      <div key={library.metadata.id} className={`clm-tree-node clm-library-node ${isSelected ? 'selected' : ''}`}>
        <div 
          className="clm-node-content" 
          onClick={() => handleNodeClick(library.metadata.id, 'library', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            showCtxMenu(e.clientX, e.clientY, { type: 'library', libraryId: library.metadata.id });
          }}
        >
          <span className="clm-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(library.metadata.id); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="clm-icon">📦</span>
          <span className="clm-name">{library.metadata.name}</span>
          <span className="clm-count">({library.components.length})</span>
        </div>
        {isExpanded && (
          <div className="clm-children">
            {library.categories.map(cat => renderCategoryNode(library, cat))}
            {hasUncategorized && renderUncategorizedCategoryNode(library, uncategorizedComponents)}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryNode = (library: ComponentLibrary, category: ComponentCategory) => {
    const components = library.components.filter(c => c.categoryId === category.id);
    const isSelected = selectedCategory?.id === category.id && selectedNodeType === 'category';
    const isExpanded = expandedNodes.includes(category.id);

    return (
      <div key={category.id} className={`clm-tree-node clm-category-node ${isSelected ? 'selected' : ''}`}>
        <div 
          className="clm-node-content" 
          onClick={() => handleNodeClick(category.id, 'category', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            showCtxMenu(e.clientX, e.clientY, { type: 'category', libraryId: library.metadata.id, categoryId: category.id });
          }}
        >
          <span className="clm-toggle" onClick={(e) => { e.stopPropagation(); handleToggle(category.id); }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="clm-icon">📁</span>
          <span className="clm-name">{category.name}</span>
          <span className="clm-count">({components.length})</span>
        </div>
        {isExpanded && (
          <div className="clm-children">
            {components.map(comp => renderComponentNode(library, comp))}
          </div>
        )}
      </div>
    );
  };

  const renderComponentNode = (library: ComponentLibrary, component: Component) => {
    const isSelected = selectedComponent?.internalId === component.internalId && selectedNodeType === 'component';

    return (
      <div key={component.internalId} className={`clm-tree-node clm-component-node ${isSelected ? 'selected' : ''}`}>
        <div 
          className="clm-node-content" 
          onClick={() => handleNodeClick(component.internalId, 'component', library.metadata.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            showCtxMenu(e.clientX, e.clientY, { type: 'component', libraryId: library.metadata.id, componentId: component.internalId });
          }}
        >
          <span className="clm-indent"></span>
          <span className="clm-icon">🧩</span>
          <span className="clm-name">{component.name}</span>
        </div>
      </div>
    );
  };

  const renderEditPanel = () => {
    if (!selectedLibrary) {
      return (
        <div className="clm-edit-panel-empty">
          <div className="clm-empty-state">
            <div className="clm-empty-icon">📦</div>
            <div className="clm-empty-text">选择一个组件库、分类或组件进行编辑</div>
          </div>
        </div>
      );
    }

    if (selectedComponent) {
      return (
        <ComponentLibraryComponentEditMode
          library={selectedLibrary}
          component={selectedComponent}
          allLibraries={clStore.libraries}
          onUpdate={(updates) => updateComponent(selectedLibrary.metadata.id, selectedComponent.internalId, updates)}
          onReorder={(direction) => {
            reorderComponent(selectedLibrary.metadata.id, selectedComponent.internalId, direction);
          }}
          onChangeParent={() => {
            // Change parent not implemented yet
            console.log('Change component parent');
          }}
          onChangeLibrary={async (newLibraryId, newCategoryId) => {
            // Move component to different library
            try {
              await moveComponent(
                selectedLibrary.metadata.id,
                selectedComponent.internalId,
                newLibraryId,
                newCategoryId || null,
                '',
                'after'
              );
              // Update selected node to point to the new library
              setSelectedNode(selectedComponent.internalId, 'component', newLibraryId);
              showToast('组件已移动到新组件库', 'success');
            } catch (error) {
              showToast('移动组件失败: ' + (error as Error).message, 'error');
            }
          }}
          onDelete={() => {
            setConfirmDlg({
              isOpen: true,
              title: '删除组件',
              message: '确定要删除此组件吗？',
              type: 'danger',
              onConfirm: async () => {
                await deleteComponent(selectedLibrary.metadata.id, selectedComponent.internalId);
                setSelectedNode(null, null, null);
                setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
              },
              onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' })
            });
          }}
        />
      );
    }

    if (selectedCategory) {
      return (
        <ComponentLibraryCategoryEditMode
          library={selectedLibrary}
          category={selectedCategory}
          allLibraries={clStore.libraries}
          onUpdate={(updates) => updateCategory(selectedLibrary.metadata.id, selectedCategory.id, updates)}
          onCreateComponent={() => {
            setCreateCtx({ libraryId: selectedLibrary.metadata.id, categoryId: selectedCategory.id });
            setShowCreateCompModal(true);
          }}
          onReorder={(direction) => {
            reorderCategory(selectedLibrary.metadata.id, selectedCategory.id, direction);
          }}
          onChangeParent={() => {
            // Change parent not implemented yet
            console.log('Change category parent');
          }}
          onChangeLibrary={async (newLibraryId) => {
            // Move category to different library
            try {
              await moveCategory(
                selectedLibrary.metadata.id,
                selectedCategory.id,
                newLibraryId,
                null,
                'after'
              );
              // Update selected node to point to the new library
              setSelectedNode(selectedCategory.id, 'category', newLibraryId);
              showToast('分类已移动到新组件库', 'success');
            } catch (error) {
              showToast('移动分类失败: ' + (error as Error).message, 'error');
            }
          }}
          onDelete={() => {
            setConfirmDlg({
              isOpen: true,
              title: '删除分类',
              message: '确定要删除此分类吗？',
              type: 'danger',
              onConfirm: async () => {
                await deleteCategory(selectedLibrary.metadata.id, selectedCategory.id);
                setSelectedNode(null, null, null);
                setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
              },
              onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' })
            });
          }}
        />
      );
    }

    return (
      <ComponentLibraryLibraryEditMode
        library={selectedLibrary}
        onUpdate={(updates) => updateLibrary(selectedLibrary.metadata.id, updates)}
        onCreateCategory={() => {
          setCreateCtx({ libraryId: selectedLibrary.metadata.id });
          setShowCreateCatModal(true);
        }}
        onCreateComponent={() => {
          setCreateCtx({ libraryId: selectedLibrary.metadata.id });
          setShowCreateCompModal(true);
        }}
        onReorder={(direction) => {
          reorderLibrary(selectedLibrary.metadata.id, direction);
        }}
        onDelete={() => {
          setConfirmDlg({
            isOpen: true,
            title: '删除组件库',
            message: `确定要删除组件库 "${selectedLibrary.metadata.name}" 吗？此操作不可撤销。`,
            type: 'danger',
            onConfirm: async () => {
              await deleteLibrary(selectedLibrary.metadata.id);
              setSelectedNode(null, null, null);
              setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' });
            },
            onCancel: () => setConfirmDlg({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {}, type: 'info' })
          });
        }}
      />
    );
  };

  return (
    <div className="clm-container">
      <div className="clm-edit-panel-wrapper">
        {renderEditPanel()}
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

export default ComponentLibraryManagerMode;
