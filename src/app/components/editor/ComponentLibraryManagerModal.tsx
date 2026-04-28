import React, { useState, useCallback, useMemo, createContext, useContext, useRef, useEffect } from 'react';
import { useComponentLibraryStore, TreeNodeType } from '../../stores/componentLibraryStore';
import { ComponentLibrary, Component, ComponentCategory, makeUncategorizedKey, isPresetLibrary } from '../../../shared/types/component';
import { showToast } from '../../services/toast-service';
import ConfirmModal from '../ui/ConfirmModal';
import SolarWireVisualEditor from './SolarWireVisualEditor';
import MonacoEditor from './MonacoEditor';
import ResizableDivider from '../ui/ResizableDivider';
import CreateLibraryModal from './CreateLibraryModal';
import CreateCategoryModal from './CreateCategoryModal';
import CreateComponentModal from './CreateComponentModal';
import ChangeComponentParentModal from './ChangeComponentParentModal';
import ChangeCategoryParentModal from './ChangeCategoryParentModal';
import ErrorCard from './ErrorCard';
import { syntaxErrorService, SyntaxError } from '../../services/syntax-error-service';
import { serializeSWC } from '../../../lib/components/swc-parser';
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
    setSearchQuery, searchQuery,
  } = useComponentLibraryStore();

  // 当模态窗打开时，隐藏主界面的resizable-divider
  useEffect(() => {
    document.body.classList.add('component-library-manager-open');
    return () => {
      document.body.classList.remove('component-library-manager-open');
    };
  }, []);

  const [libraryEditTab, setLibraryEditTab] = useState<'properties' | 'code'>('properties');
  const [categoryEditTab, setCategoryEditTab] = useState<'properties' | 'code'>('properties');
  const [componentEditTab, setComponentEditTab] = useState<'properties' | 'code' | 'visual'>('code');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [showCreateLibraryModal, setShowCreateLibraryModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateComponentModal, setShowCreateComponentModal] = useState(false);
  const [showChangeComponentParentModal, setShowChangeComponentParentModal] = useState(false);
  const [showChangeCategoryParentModal, setShowChangeCategoryParentModal] = useState(false);
  const [newLibraryData, setNewLibraryData] = useState({ name: '', id: '', description: '', version: '1.0.0', author: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; id?: string }>({});
  
  // 保存创建时的上下文
  const [createContext, setCreateContext] = useState<{
    libraryId?: string;
    categoryId?: string | null;
  }>({});
  
  // Monaco编辑器状态
  const [monacoScrollTrigger, setMonacoScrollTrigger] = useState(0);
  const [monacoHighlightTrigger, setMonacoHighlightTrigger] = useState(0);
  const [errorLines, setErrorLines] = useState<number[]>([]);
  const [highlightLines, setHighlightLines] = useState<number[]>([]);
  
  // 可视化编辑器语法错误状态
  const [visualSyntaxErrors, setVisualSyntaxErrors] = useState<SyntaxError[]>([]);

  const selectedLibraryId = useComponentLibraryStore(s => s.selectedLibraryId);
  const selectedComponentId = useComponentLibraryStore(s => s.selectedComponentId);
  const selectedCategoryId = useComponentLibraryStore(s => s.selectedCategoryId);

  // 本地state用于处理输入时的光标位置问题
  const [localLibraryMetadata, setLocalLibraryMetadata] = useState({
    name: '',
    description: '',
    version: '',
    author: ''
  });
  const [localCategoryName, setLocalCategoryName] = useState('');
  const [localComponentData, setLocalComponentData] = useState({
    name: '',
    description: '',
    code: ''
  });

  const selectedLibrary = useMemo(() => {
    if (!selectedLibraryId) return null;
    return libraries.find(lib => lib.metadata.id === selectedLibraryId) || null;
  }, [libraries, selectedLibraryId]);

  const selectedCategory = useMemo(() => {
    if (!selectedLibraryId || !selectedCategoryId) return null;
    const library = libraries.find(lib => lib.metadata.id === selectedLibraryId);
    if (!library) return null;
    return library.categories.find(cat => cat.id === selectedCategoryId) || null;
  }, [libraries, selectedLibraryId, selectedCategoryId]);

  const selectedComponent = useMemo(() => {
    if (!selectedLibraryId || !selectedComponentId) return null;
    const library = libraries.find(lib => lib.metadata.id === selectedLibraryId);
    if (!library) return null;
    
    // 搜索所有组件
    return library.components.find(comp => comp.internalId === selectedComponentId) || null;
  }, [libraries, selectedLibraryId, selectedComponentId]);

  // 添加Ctrl+S快捷键保存功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查Ctrl+S组合键
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认保存行为
        
        // 只有在编辑组件时才保存
        if (selectedNodeType === 'component' && selectedComponent) {
          updateComponent(selectedLibraryId!, selectedComponent.internalId, {
            name: localComponentData.name,
            description: localComponentData.description,
            code: localComponentData.code
          });
          showToast('组件已保存', 'success');
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeType, selectedComponent, selectedLibraryId, localComponentData, updateComponent]);

  // 同步外部状态到本地state
  useEffect(() => {
    if (selectedLibrary) {
      setLocalLibraryMetadata({
        name: selectedLibrary.metadata.name,
        description: selectedLibrary.metadata.description || '',
        version: selectedLibrary.metadata.version,
        author: selectedLibrary.metadata.author || ''
      });
    }
  }, [selectedLibrary]);

  useEffect(() => {
    if (selectedCategory) {
      setLocalCategoryName(selectedCategory.name);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedComponent) {
      setLocalComponentData({
        name: selectedComponent.name,
        description: selectedComponent.description || '',
        code: selectedComponent.code
      });
    }
  }, [selectedComponent]);

  // 处理从可视化编辑器跳转到代码编辑器的事件
  useEffect(() => {
    const handleJumpToError = (event: CustomEvent) => {
      const { line, column } = event.detail;
      
      // 设置高亮行
      setHighlightLines([line]);
      setMonacoHighlightTrigger(Date.now());
      
      // 设置滚动触发器
      setMonacoScrollTrigger(line);
      
      // 切换到代码标签页
      setComponentEditTab('code');
    };

    window.addEventListener('jumpToError', handleJumpToError as EventListener);
    return () => {
      window.removeEventListener('jumpToError', handleJumpToError as EventListener);
    };
  }, []);

  // 可视化编辑器语法错误检测
  useEffect(() => {
    if (componentEditTab === 'visual' && selectedComponent) {
      syntaxErrorService.runRendererCheck(localComponentData.code);
      
      // 监听错误变化
      const listener = {
        onErrorsChanged: (errors: SyntaxError[]) => {
          setVisualSyntaxErrors(errors);
        }
      };
      
      syntaxErrorService.addListener(listener);
      return () => {
        syntaxErrorService.removeListener(listener);
      };
    }
  }, [componentEditTab, selectedComponent, localComponentData.code]);

  // 处理可视化编辑器中的错误跳转
  const handleVisualJumpToError = useCallback((line: number, column: number) => {
    
    // 设置高亮行
    setHighlightLines([line]);
    setMonacoHighlightTrigger(Date.now());
    
    // 设置滚动触发器
    setMonacoScrollTrigger(line);
    
    // 切换到代码标签页
    setComponentEditTab('code');
    
    // 触发自定义事件
    const event = new CustomEvent('jumpToError', { detail: { line, column } });
    window.dispatchEvent(event);
  }, []);

  const getUncategorizedComponents = useCallback((library: ComponentLibrary) => {
    const categoryIds = new Set(library.categories.map(c => c.id));
    return library.components.filter(c => !c.categoryId || !categoryIds.has(c.categoryId));
  }, []);

  const filteredLibraries = useMemo(() => {
    if (!searchQuery) return libraries;
    
    const searchLower = searchQuery.toLowerCase();
    
    return libraries.map(lib => {
      // 过滤匹配的分类
      const filteredCategories = lib.categories.filter(cat => 
        cat.name.toLowerCase().includes(searchLower)
      );
      
      // 过滤匹配的组件
      const filteredComponents = lib.components.filter(comp => 
        comp.name.toLowerCase().includes(searchLower) ||
        (comp.description && comp.description.toLowerCase().includes(searchLower))
      );
      
      // 检查组件库本身是否匹配
      const libraryMatches = lib.metadata.name.toLowerCase().includes(searchLower);
      
      // 如果没有任何匹配项，返回null（不显示）
      if (!libraryMatches && filteredCategories.length === 0 && filteredComponents.length === 0) {
        return null;
      }
      
      // 如果有匹配项，返回过滤后的组件库
      return {
        ...lib,
        categories: libraryMatches ? lib.categories : filteredCategories,
        components: libraryMatches ? lib.components : filteredComponents
      };
    }).filter(Boolean) as ComponentLibrary[]; // 过滤掉null值
  }, [libraries, searchQuery]);

  
  const handleImportLibrary = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.swc';
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

  const handleDeleteLibrary = useCallback((libraryId: string) => {
    const library = libraries.find(lib => lib.metadata.id === libraryId);
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

  const handleCreateComponent = useCallback((libraryId: string, categoryId: string | null = null) => {
    // 保存创建上下文并打开创建组件模态窗
    setCreateContext({ libraryId, categoryId });
    setShowCreateComponentModal(true);
  }, []);

  const handleExportLibrary = useCallback((libraryId: string) => {
    exportLibrary(libraryId);
    showToast('组件库导出成功', 'success');
  }, [exportLibrary]);

  const handleMoveComponent = useCallback((direction: 'top' | 'up' | 'down' | 'bottom') => {
    if (!selectedLibraryId || !selectedComponent) return;
    
    const library = libraries.find(lib => lib.metadata.id === selectedLibraryId);
    if (!library) return;
    
    // 获取当前分类中的所有组件
    const currentCategoryId = selectedComponent.categoryId;
    let components: Component[];
    
    if (currentCategoryId) {
      // 在指定分类中
      const category = library.categories.find(cat => cat.id === currentCategoryId);
      if (!category) return;
      components = library.components.filter(comp => comp.categoryId === currentCategoryId);
    } else {
      // 未分类组件
      components = library.components.filter(comp => !comp.categoryId);
    }
    
    const currentIndex = components.findIndex(comp => comp.internalId === selectedComponent.internalId);
    if (currentIndex === -1) return;
    
    let targetIndex = currentIndex;
    switch (direction) {
      case 'top':
        targetIndex = 0;
        break;
      case 'up':
        if (currentIndex > 0) targetIndex = currentIndex - 1;
        break;
      case 'down':
        if (currentIndex < components.length - 1) targetIndex = currentIndex + 1;
        break;
      case 'bottom':
        targetIndex = components.length - 1;
        break;
    }
    
    if (targetIndex !== currentIndex) {
      // 重新排序组件数组
      const newComponents = [...components];
      const [movedComponent] = newComponents.splice(currentIndex, 1);
      newComponents.splice(targetIndex, 0, movedComponent);
      
      // 重新构建整个组件库的components数组
      let updatedComponents: Component[];
      
      if (currentCategoryId) {
        // 在指定分类中的组件排序
        const otherComponents = library.components.filter(comp => comp.categoryId !== currentCategoryId);
        updatedComponents = [...otherComponents, ...newComponents];
      } else {
        // 未分类组件排序
        const categorizedComponents = library.components.filter(comp => comp.categoryId);
        updatedComponents = [...categorizedComponents, ...newComponents];
      }
      
      // 更新组件库
      const updatedLibrary = {
        ...library,
        components: updatedComponents.map((comp, index) => ({ ...comp, order: index }))
      };
      
      updateLibrary(selectedLibraryId, updatedLibrary);
      showToast('组件位置已更新', 'success');
    }
  }, [selectedLibraryId, selectedComponent, libraries, updateLibrary]);

  const handleMoveCategory = useCallback((direction: 'top' | 'up' | 'down' | 'bottom') => {
    if (!selectedLibraryId || !selectedCategory) return;
    
    const library = libraries.find(lib => lib.metadata.id === selectedLibraryId);
    if (!library) return;
    
    const categories = library.categories;
    const currentIndex = categories.findIndex(cat => cat.id === selectedCategory.id);
    if (currentIndex === -1) return;
    
    let targetIndex = currentIndex;
    switch (direction) {
      case 'top':
        targetIndex = 0;
        break;
      case 'up':
        if (currentIndex > 0) targetIndex = currentIndex - 1;
        break;
      case 'down':
        if (currentIndex < categories.length - 1) targetIndex = currentIndex + 1;
        break;
      case 'bottom':
        targetIndex = categories.length - 1;
        break;
    }
    
    if (targetIndex !== currentIndex) {
      // 重新排序分类数组
      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(currentIndex, 1);
      newCategories.splice(targetIndex, 0, movedCategory);
      
      // 更新组件库
      const updatedLibrary = {
        ...library,
        categories: newCategories.map((cat, index) => ({ ...cat, order: index }))
      };
      
      updateLibrary(selectedLibraryId, updatedLibrary);
      showToast('分类位置已更新', 'success');
    }
  }, [selectedLibraryId, selectedCategory, libraries, updateLibrary]);

  const handleMoveLibrary = useCallback((direction: 'top' | 'up' | 'down' | 'bottom') => {
    if (!selectedLibrary) return;
    
    const currentIndex = libraries.findIndex(lib => lib.metadata.id === selectedLibrary.metadata.id);
    if (currentIndex === -1) return;
    
    let targetIndex = currentIndex;
    switch (direction) {
      case 'top':
        targetIndex = 0;
        break;
      case 'up':
        if (currentIndex > 0) targetIndex = currentIndex - 1;
        break;
      case 'down':
        if (currentIndex < libraries.length - 1) targetIndex = currentIndex + 1;
        break;
      case 'bottom':
        targetIndex = libraries.length - 1;
        break;
    }
    
    if (targetIndex !== currentIndex) {
      // 重新排序组件库数组
      const newLibraries = [...libraries];
      const [movedLibrary] = newLibraries.splice(currentIndex, 1);
      newLibraries.splice(targetIndex, 0, movedLibrary);
      
      // 更新所有组件库的order属性
      const updatedLibraries = newLibraries.map((lib, index) => ({
        ...lib,
        metadata: { ...lib.metadata, order: index }
      }));
      
      // 更新所有组件库
      updatedLibraries.forEach(lib => {
        updateLibrary(lib.metadata.id, lib);
      });
      
      showToast('组件库位置已更新', 'success');
    }
  }, [selectedLibrary, libraries, updateLibrary]);

  const handleCreateCategory = useCallback((libraryId: string) => {
    // 保存创建上下文并打开创建分类模态窗
    setCreateContext({ libraryId });
    setShowCreateCategoryModal(true);
  }, []);

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

  // 拖动处理函数
  const handleResize = (newWidth: number) => {
    setLeftPanelWidth(newWidth);
  };

  return (
    <div className="component-library-manager-overlay">
      <div className="component-library-manager-modal">
        <div className="component-library-manager-header">
          <div className="component-library-manager-title">📦 组件库管理</div>
          <button className="component-library-manager-close" onClick={onClose}>✕</button>
        </div>
        <div className="component-library-manager-content">
          <div className="manager-tree-panel" style={{ width: `${leftPanelWidth}px` }}>
            <div className="manager-tree-header">
              <div className="manager-tree-actions">
                <div className="tree-action-buttons-compact">
                  <button className="btn-compact" onClick={() => setShowCreateLibraryModal(true)}>
                    <span className="btn-icon">➕</span>
                    <span className="btn-text">新建</span>
                  </button>
                  <button className="btn-compact" onClick={handleImportLibrary}>
                    <span className="btn-icon">📥</span>
                    <span className="btn-text">导入</span>
                  </button>
                </div>
              </div>
              <div className="manager-tree-search">
                <input
                  type="text"
                  placeholder="搜索组件库、分类或组件..."
                  className="tree-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
          
          <ResizableDivider
            orientation="vertical"
            onResize={handleResize}
            currentSize={leftPanelWidth}
            minSize={260}
            maxSize={600}
          />
          
          <div className="manager-edit-panel">
            {!selectedNodeType && (
              <div className="edit-panel-empty">
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3>选择一个项目进行编辑</h3>
                  <p>从左侧选择组件库、分类或组件进行编辑</p>
                </div>
              </div>
            )}
            
            {selectedNodeType === 'library' && selectedLibrary && (
              <div className="edit-panel-content">
                <div className="edit-panel-header">
                  <h3>📦 {localLibraryMetadata.name}</h3>
                  <div className="edit-panel-actions">
                    <div className="btn-separator"></div>
                    <button className="btn-compact" onClick={() => handleMoveLibrary('top')}>
                      <span className="btn-icon">⏫</span>
                      <span className="btn-text">置顶</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveLibrary('up')}>
                      <span className="btn-icon">⬆️</span>
                      <span className="btn-text">上移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveLibrary('down')}>
                      <span className="btn-icon">⬇️</span>
                      <span className="btn-text">下移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveLibrary('bottom')}>
                      <span className="btn-icon">⏬</span>
                      <span className="btn-text">置底</span>
                    </button>
                    {!isPresetLibrary(selectedLibrary.metadata.id) && (
                      <button className="btn-compact btn-danger" onClick={() => handleDeleteLibrary(selectedLibrary.metadata.id)}>
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">删除</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="edit-panel-tabs">
                  <button 
                    className={libraryEditTab === 'properties' ? 'tab-active' : ''}
                    onClick={() => setLibraryEditTab('properties')}
                  >
                    属性
                  </button>
                  <button 
                    className={libraryEditTab === 'code' ? 'tab-active' : ''}
                    onClick={() => setLibraryEditTab('code')}
                  >
                    代码
                  </button>
                </div>
                <div className="edit-panel-body">
                  {libraryEditTab === 'properties' && (
                    <>
                      <div className="edit-form-group">
                        <label>名称</label>
                        <input
                          type="text"
                          value={localLibraryMetadata.name}
                          onChange={(e) => setLocalLibraryMetadata({...localLibraryMetadata, name: e.target.value})}
                          onBlur={() => updateLibrary(selectedLibrary.metadata.id, { metadata: { ...selectedLibrary.metadata, name: localLibraryMetadata.name } })}
                        />
                      </div>
                      <div className="edit-form-group">
                        <label>描述</label>
                        <textarea
                          value={localLibraryMetadata.description}
                          onChange={(e) => setLocalLibraryMetadata({...localLibraryMetadata, description: e.target.value})}
                          onBlur={() => updateLibrary(selectedLibrary.metadata.id, { metadata: { ...selectedLibrary.metadata, description: localLibraryMetadata.description } })}
                        />
                      </div>
                      <div className="edit-form-group">
                        <label>版本</label>
                        <input
                          type="text"
                          value={localLibraryMetadata.version}
                          onChange={(e) => setLocalLibraryMetadata({...localLibraryMetadata, version: e.target.value})}
                          onBlur={() => updateLibrary(selectedLibrary.metadata.id, { metadata: { ...selectedLibrary.metadata, version: localLibraryMetadata.version } })}
                        />
                      </div>
                      <div className="edit-form-group">
                        <label>作者</label>
                        <input
                          type="text"
                          value={localLibraryMetadata.author}
                          onChange={(e) => setLocalLibraryMetadata({...localLibraryMetadata, author: e.target.value})}
                          onBlur={() => updateLibrary(selectedLibrary.metadata.id, { metadata: { ...selectedLibrary.metadata, author: localLibraryMetadata.author } })}
                        />
                      </div>
                      <div className="edit-form-actions">
                        <button className="btn-compact" onClick={() => handleExportLibrary(selectedLibrary.metadata.id)}>
                          <span className="btn-icon">📤</span>
                          <span className="btn-text">导出</span>
                        </button>
                        {!isPresetLibrary(selectedLibrary.metadata.id) && (
                          <button className="btn-compact btn-danger" onClick={() => handleRemoveLibrary(selectedLibrary.metadata.id)}>
                            <span className="btn-icon">🗑️</span>
                            <span className="btn-text">删除</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {libraryEditTab === 'code' && (
                    <div className="code-editor-full">
                      <textarea
                        className="code-editor"
                        value={JSON.stringify(selectedLibrary, null, 2)}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedNodeType === 'category' && selectedCategory && (
              <div className="edit-panel-content">
                <div className="edit-panel-header">
                  <h3>📁 {localCategoryName}</h3>
                  <div className="edit-panel-actions">
                    <div className="btn-separator"></div>
                    <button className="btn-compact" onClick={() => handleMoveCategory('top')}>
                      <span className="btn-icon">⏫</span>
                      <span className="btn-text">置顶</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveCategory('up')}>
                      <span className="btn-icon">⬆️</span>
                      <span className="btn-text">上移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveCategory('down')}>
                      <span className="btn-icon">⬇️</span>
                      <span className="btn-text">下移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveCategory('bottom')}>
                      <span className="btn-icon">⏬</span>
                      <span className="btn-text">置底</span>
                    </button>
                    <button className="btn-compact" onClick={() => setShowChangeCategoryParentModal(true)}>
                      <span className="btn-icon">🔄</span>
                      <span className="btn-text">改变归属</span>
                    </button>
                    {!isPresetLibrary(selectedLibraryId!) && (
                      <button className="btn-compact btn-danger" onClick={() => handleDeleteCategory(selectedLibraryId!, selectedCategory.id)}>
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">删除</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="edit-panel-tabs">
                  <button 
                    className={categoryEditTab === 'properties' ? 'tab-active' : ''}
                    onClick={() => setCategoryEditTab('properties')}
                  >
                    属性
                  </button>
                  <button 
                    className={categoryEditTab === 'code' ? 'tab-active' : ''}
                    onClick={() => setCategoryEditTab('code')}
                  >
                    代码
                  </button>
                </div>
                <div className="edit-panel-body">
                  {categoryEditTab === 'properties' && (
                    <>
                      <div className="edit-form-group">
                        <label>名称</label>
                        <input
                          type="text"
                          value={localCategoryName}
                          onChange={(e) => setLocalCategoryName(e.target.value)}
                          onBlur={() => updateCategory(selectedLibraryId!, selectedCategory.id, { name: localCategoryName })}
                        />
                      </div>
                                          </>
                  )}
                  {categoryEditTab === 'code' && (
                    <div className="code-editor-full">
                      <textarea
                        className="code-editor"
                        value={JSON.stringify(selectedCategory, null, 2)}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedNodeType === 'component' && selectedComponent && (
              <div className="edit-panel-content">
                <div className="edit-panel-header">
                  <h3>🧩 {localComponentData.name}</h3>
                  <div className="edit-panel-actions">
                    <button className="btn-compact btn-primary" onClick={() => {
                      // 手动保存组件
                      updateComponent(selectedLibraryId!, selectedComponent.internalId, {
                        name: localComponentData.name,
                        description: localComponentData.description,
                        code: localComponentData.code
                      });
                      showToast('组件已保存', 'success');
                    }}>
                      <span className="btn-icon">💾</span>
                      <span className="btn-text">保存</span>
                    </button>
                    <div className="btn-separator"></div>
                    <button className="btn-compact" onClick={() => handleMoveComponent('top')}>
                      <span className="btn-icon">⏫</span>
                      <span className="btn-text">置顶</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveComponent('up')}>
                      <span className="btn-icon">⬆️</span>
                      <span className="btn-text">上移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveComponent('down')}>
                      <span className="btn-icon">⬇️</span>
                      <span className="btn-text">下移</span>
                    </button>
                    <button className="btn-compact" onClick={() => handleMoveComponent('bottom')}>
                      <span className="btn-icon">⏬</span>
                      <span className="btn-text">置底</span>
                    </button>
                    <button className="btn-compact" onClick={() => setShowChangeComponentParentModal(true)}>
                      <span className="btn-icon">🔄</span>
                      <span className="btn-text">改变归属</span>
                    </button>
                    {!isPresetLibrary(selectedLibraryId!) && (
                      <button className="btn-compact btn-danger" onClick={() => handleDeleteComponent(selectedLibraryId!, selectedComponent.internalId)}>
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">删除</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="edit-panel-tabs">
                  <button 
                    className={componentEditTab === 'properties' ? 'tab-active' : ''}
                    onClick={() => setComponentEditTab('properties')}
                  >
                    属性
                  </button>
                  <button 
                    className={componentEditTab === 'code' ? 'tab-active' : ''}
                    onClick={() => setComponentEditTab('code')}
                  >
                    代码
                  </button>
                  <button 
                    className={componentEditTab === 'visual' ? 'tab-active' : ''}
                    onClick={() => setComponentEditTab('visual')}
                  >
                    可视化
                  </button>
                </div>
                <div className="edit-panel-body">
                  {componentEditTab === 'properties' && (
                    <>
                      <div className="edit-form-group">
                        <label>名称</label>
                        <input
                          type="text"
                          value={localComponentData.name}
                          onChange={(e) => setLocalComponentData({...localComponentData, name: e.target.value})}
                          onBlur={() => updateComponent(selectedLibraryId!, selectedComponent.internalId, { name: localComponentData.name })}
                        />
                      </div>
                      <div className="edit-form-group">
                        <label>描述</label>
                        <textarea
                          value={localComponentData.description}
                          onChange={(e) => setLocalComponentData({...localComponentData, description: e.target.value})}
                          onBlur={() => updateComponent(selectedLibraryId!, selectedComponent.internalId, { description: localComponentData.description })}
                        />
                      </div>
                                          </>
                  )}
                  {componentEditTab === 'code' && (
                    <div className="code-editor-full">
                      <MonacoEditor
                        language="markdown"
                        value={localComponentData.code}
                        onChange={(value) => setLocalComponentData({...localComponentData, code: value})}
                        height="100%"
                        errorLines={errorLines}
                        highlightLines={highlightLines}
                        scrollTrigger={monacoScrollTrigger}
                        highlightTrigger={monacoHighlightTrigger}
                      />
                    </div>
                  )}
                  {componentEditTab === 'visual' && (
                    <div className="visual-editor-container">
                      <SolarWireVisualEditor
                        content={localComponentData.code}
                        onContentChange={(value: string) => setLocalComponentData({...localComponentData, code: value})}
                        externalContent={localComponentData.code}
                        onExternalContentChange={(value: string) => setLocalComponentData({...localComponentData, code: value})}
                        syntaxErrors={visualSyntaxErrors}
                        onSwitchToCodeTab={handleVisualJumpToError}
                        allowImageElements={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CreateLibraryModal
        isOpen={showCreateLibraryModal}
        onClose={() => setShowCreateLibraryModal(false)}
      />
      
      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        defaultLibraryId={createContext.libraryId || ''}
      />
      
      <CreateComponentModal
        isOpen={showCreateComponentModal}
        onClose={() => setShowCreateComponentModal(false)}
        defaultLibraryId={createContext.libraryId || ''}
        defaultCategoryId={createContext.categoryId}
      />
      
      <ChangeComponentParentModal
        isOpen={showChangeComponentParentModal}
        onClose={() => setShowChangeComponentParentModal(false)}
        componentId={selectedComponent?.internalId || ''}
        currentLibraryId={selectedLibraryId || ''}
        currentCategoryId={selectedComponent?.categoryId}
      />
      
      <ChangeCategoryParentModal
        isOpen={showChangeCategoryParentModal}
        onClose={() => setShowChangeCategoryParentModal(false)}
        categoryId={selectedCategory?.id || ''}
        currentLibraryId={selectedLibraryId || ''}
      />
      
      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' })}
          type={confirmModal.type}
        />
      )}
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

const LibraryTreeNode: React.FC<LibraryTreeNodeProps> = ({
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
};

// CategoryTreeNode Component
interface CategoryTreeNodeProps {
  library: ComponentLibrary;
  category: ComponentCategory;
  onCreateComponent: (libraryId: string, categoryId: string | null) => void;
  onDelete: (libraryId: string, categoryId: string) => void;
  isPreset: boolean;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
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
};

// UncategorizedNode Component
interface UncategorizedNodeProps {
  library: ComponentLibrary;
  count: number;
  onCreateComponent: () => void;
  isPreset: boolean;
}

const UncategorizedNode: React.FC<UncategorizedNodeProps> = ({
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
};

// ComponentTreeNode Component
interface ComponentTreeNodeProps {
  component: Component;
  libraryId: string;
}

const ComponentTreeNode: React.FC<ComponentTreeNodeProps> = ({
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
};

export default ComponentLibraryManagerModal;
