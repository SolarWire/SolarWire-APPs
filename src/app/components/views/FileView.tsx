import React, { useState, useMemo } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import FileTree from '../editor/FileTree';
import { useSelectionStore } from '../../stores/selectionStore';
import { Scrollbar } from '../ui/Scrollbar';
import { showToast } from '../../services/toast-service';
import CreateMarkdownModal from '../editor/CreateMarkdownModal';
import CreateSolarWireModal from '../editor/CreateSolarWireModal';
import CreateFolderModal from '../editor/CreateFolderModal';
import RenameModal from '../editor/RenameModal';
import DeleteConfirmModal from '../editor/DeleteConfirmModal';
import ContextMenu, { ContextMenuItem, MenuItem, MenuSeparator } from '../ui/ContextMenu';
import { FileNode } from '../../../shared/types/file';
import './FileView.css';

const FileView: React.FC = () => {
  const {
    fileTree,
    selectedFile,
    currentPath,
    expandedDirectories,
    toggleDirectory,
    openFileAtPath,
    openDirectoryAtPath,
    refreshCurrentDirectory
  } = useFileStore();
  
  const handleRefresh = async () => {
    await refreshCurrentDirectory();
  };
  
  const { currentView } = useAppStore();
  const [showCreateMarkdownModal, setShowCreateMarkdownModal] = useState(false);
  const [showCreateSolarWireModal, setShowCreateSolarWireModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetNode: FileNode | null;
    targetPath: string;
  }>({ visible: false, x: 0, y: 0, targetNode: null, targetPath: '' });

  const handleOpen = async (): Promise<void> => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        showToast('File dialog is only available in the Electron app', 'error');
        return;
      }

      const paths: string[] = await api.openFileDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      });

      if (paths && paths.length > 0) {
        const path = paths[0];

        try {
          if (openDirectoryAtPath) {
            await openDirectoryAtPath(path);
          }
        } catch (err) {
          if (openFileAtPath) {
            try {
              await openFileAtPath(path);
            } catch (fileErr) {
              console.error('Failed to open as file or directory', fileErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  const { setSelection, getSelectionForView } = useSelectionStore();

  const handleSelectFile = async (file: any) => {
    if (openFileAtPath) {
      // 更新选中记录
      setSelection('file', file.path);
      await openFileAtPath(file.path);
    }
  };

  // 获取目标目录
  const getTargetDirectory = (node: FileNode | null): string => {
    if (!node) return currentPath;
    if (node.type === 'directory') return node.path;
    // 文件：返回父目录
    const pathParts = node.path.split(/[/\\]/);
    pathParts.pop();
    return pathParts.join('/');
  };

  // 处理文件/文件夹右键
  const handleNodeContextMenu = (node: FileNode, x: number, y: number) => {
    const targetPath = getTargetDirectory(node);
    setContextMenu({
      visible: true,
      x,
      y,
      targetNode: node,
      targetPath
    });
  };

  // 处理空白处右键
  const handleBlankContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetNode: null,
      targetPath: currentPath
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // 生成菜单项
  const getMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const { targetNode, targetPath } = contextMenu;

    if (!targetNode) {
      // 空白处
      items.push({ type: 'item', label: '新建.md', icon: '📄', onClick: () => setShowCreateMarkdownModal(true) });
      items.push({ type: 'item', label: '新建.solarwire', icon: '🎨', onClick: () => setShowCreateSolarWireModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '新建文件夹', icon: '📁', onClick: () => setShowCreateFolderModal(true) });
    } else if (targetNode.type === 'directory') {
      // 文件夹
      items.push({ type: 'item', label: '新建.md', icon: '📄', onClick: () => setShowCreateMarkdownModal(true) });
      items.push({ type: 'item', label: '新建.solarwire', icon: '🎨', onClick: () => setShowCreateSolarWireModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '新建文件夹', icon: '📁', onClick: () => setShowCreateFolderModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '重命名', icon: '✏️', onClick: () => setShowRenameModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => setShowDeleteModal(true) });
    } else {
      // 文件
      items.push({ type: 'item', label: '重命名', icon: '✏️', onClick: () => setShowRenameModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => setShowDeleteModal(true) });
    }

    return items;
  };

  // 搜索文件和文件夹
  const filteredFileTree = useMemo(() => {
    let result = fileTree;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filterNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.reduce((acc: FileNode[], node) => {
          const matchesName = node.name.toLowerCase().includes(query);

          if (node.type === 'directory') {
            const filteredChildren = node.children ? filterNodes(node.children) : [];
            if (matchesName || filteredChildren.length > 0) {
              acc.push({
                ...node,
                children: filteredChildren
              });
            }
          } else if (matchesName) {
            acc.push(node);
          }

          return acc;
        }, []);
      };

      result = filterNodes(result);
    }

    // 排序
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return [...nodes].sort((a, b) => {
        // 目录始终排在文件前面
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;

        // 按名称排序
        if (sortBy === 'name') {
          const comparison = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        // 按修改时间排序
        if (sortBy === 'modified') {
          const timeA = a.modifiedTime || 0;
          const timeB = b.modifiedTime || 0;
          const comparison = timeA - timeB;
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        return 0;
      });
    };

    result = sortNodes(result);

    // 递归排序子节点
    const sortChildren = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.type === 'directory' && node.children) {
          return {
            ...node,
            children: sortChildren(sortNodes(node.children))
          };
        }
        return node;
      });
    };

    return sortChildren(result);
  }, [fileTree, searchQuery, sortBy, sortOrder]);

  const renderFileTree = () => {
    const treeToRender = filteredFileTree;
    
    if (treeToRender.length === 0 && !selectedFile) {
      return (
        <div className="file-view-empty">
          <div className="empty-icon">📁</div>
          <div className="empty-text">Open a file or folder to get started</div>
        </div>
      );
    }

    return (
      <FileTree
        nodes={treeToRender}
        expandedDirectories={expandedDirectories}
        selectedFile={currentView === 'file' ? (selectedFile || (() => {
          const selectedItem = getSelectionForView('file');
          if (selectedItem) {
            return { name: selectedItem.path.split(/[\/\\]/).pop() || selectedItem.path, path: selectedItem.path, type: 'file' };
          }
          return null;
        })()) : null}
        onToggleDirectory={toggleDirectory!}
        onSelectFile={handleSelectFile}
        onContextMenu={handleNodeContextMenu}
      />
    );
  };

  return (
    <div className="file-view-container" onContextMenu={handleBlankContextMenu}>
      <div className="file-view-header">
        <div className="file-view-actions">
          <div className="tree-action-buttons-compact">
            <button className="btn-compact" onClick={() => setShowCreateMarkdownModal(true)}>
              <span className="btn-icon">➕</span>
              <span className="btn-text">.md</span>
            </button>
            <button className="btn-compact" onClick={() => setShowCreateSolarWireModal(true)}>
              <span className="btn-icon">➕</span>
              <span className="btn-text">.solarwire</span>
            </button>
            <button className="btn-compact" onClick={() => setShowCreateFolderModal(true)}>
              <span className="btn-icon">➕</span>
              <span className="btn-text">文件夹</span>
            </button>
          </div>
          <div className="tree-action-buttons-compact" style={{ marginLeft: 'auto' }}>
            <button className="btn-compact" onClick={handleRefresh}>
              <span className="btn-icon">🔄</span>
            </button>
          </div>
        </div>
        <div className="file-view-search">
          <input
            type="text"
            placeholder="搜索文件或文件夹..."
            className="tree-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="file-view-sort">
          <select
            className="sort-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as ['name' | 'modified', 'asc' | 'desc'];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="name-asc">按名称排序 (A-Z)</option>
            <option value="name-desc">按名称排序 (Z-A)</option>
            <option value="modified-desc">按修改时间排序 (最新)</option>
            <option value="modified-asc">按修改时间排序 (最早)</option>
          </select>
        </div>
      </div>
      <Scrollbar className="file-view-scrollbar">
        <div className="file-view">
          {renderFileTree()}
        </div>
      </Scrollbar>
      <CreateMarkdownModal
        isOpen={showCreateMarkdownModal}
        onClose={() => setShowCreateMarkdownModal(false)}
        defaultDirectory={contextMenu.targetPath}
      />
      <CreateSolarWireModal
        isOpen={showCreateSolarWireModal}
        onClose={() => setShowCreateSolarWireModal(false)}
        defaultDirectory={contextMenu.targetPath}
      />
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        defaultDirectory={contextMenu.targetPath}
      />
      {contextMenu.targetNode && (
        <RenameModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          target={{
            type: contextMenu.targetNode.type,
            name: contextMenu.targetNode.name,
            path: contextMenu.targetNode.path
          }}
        />
      )}
      {contextMenu.targetNode && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          target={{
            type: contextMenu.targetNode.type,
            name: contextMenu.targetNode.name,
            path: contextMenu.targetNode.path
          }}
        />
      )}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={getMenuItems()}
        onClose={closeContextMenu}
      />
    </div>
  );
};

export default FileView;
