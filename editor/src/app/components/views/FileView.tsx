import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import FileTree from '../editor/FileTree';
import SnippetListPanel from '../editor/SnippetListPanel';
import { useSelectionStore } from '../../stores/selectionStore';
import { Scrollbar } from '../ui/Scrollbar';
import { feedback } from '../../stores/feedbackStore';
import CreateMarkdownModal from '../editor/CreateMarkdownModal';
import CreateSolarWireModal from '../editor/CreateSolarWireModal';
import CreateFolderModal from '../editor/CreateFolderModal';
import RenameModal from '../editor/RenameModal';
import ContextMenu, { ContextMenuItem, MenuItem, MenuSeparator } from '../ui/ContextMenu';
import { FileNode, SolarWireSnippet, SnippetInfo } from '../../../shared/types/file';
import './FileView.css';

function extractDeclarations(code: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const regex = /!(\w+)=(.+)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    declarations[match[1]] = value;
  }
  return declarations;
}

const FileView: React.FC = () => {
  const {
    fileTree,
    setFileTree,
    selectedFile,
    currentPath,
    expandedDirectories,
    toggleDirectory,
    openFileAtPath,
    openDirectoryAtPath,
    refreshCurrentDirectory,
    refreshKey,
    snippetsByFile,
    setSnippetsByFile,
    snippetInfosByFile,
    setSnippetInfosByFile,
  } = useFileStore();

  const handleRefresh = async () => {
    await refreshCurrentDirectory();
  };

  const { currentView } = useAppStore();
  const [showCreateMarkdownModal, setShowCreateMarkdownModal] = useState(false);
  const [showCreateSolarWireModal, setShowCreateSolarWireModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
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

  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const saved = localStorage.getItem('fileview-split-ratio');
      return saved ? parseFloat(saved) : 0.55;
    } catch { return 0.55; }
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const collectSnippets = async () => {
      if (!currentPath) {
        setSnippetsByFile({});
        setSnippetInfosByFile({});
        return;
      }
      try {
        const api = (window as any).api;
        if (api && typeof api.collectSolarWireSnippets === 'function') {
          const snippets: SolarWireSnippet[] = await api.collectSolarWireSnippets(currentPath);
          const byFile: Record<string, SolarWireSnippet[]> = {};
          const infosByFile: Record<string, SnippetInfo[]> = {};
          for (const snippet of snippets) {
            if (!byFile[snippet.sourceFile]) {
              byFile[snippet.sourceFile] = [];
              infosByFile[snippet.sourceFile] = [];
            }
            byFile[snippet.sourceFile].push(snippet);
            const declarations = extractDeclarations(snippet.code);
            infosByFile[snippet.sourceFile].push({
              id: snippet.id,
              snippetIndex: snippet.snippetIndex || 1,
              title: declarations['title'] || '',
            });
          }
          setSnippetsByFile(byFile);
          setSnippetInfosByFile(infosByFile);
        }
      } catch (err) {
        console.error('Failed to collect solarwire snippets:', err);
        setSnippetsByFile({});
        setSnippetInfosByFile({});
      }
    };
    collectSnippets();
  }, [currentPath, refreshKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      const clamped = Math.min(0.85, Math.max(0.2, ratio));
      setSplitRatio(clamped);
      try { localStorage.setItem('fileview-split-ratio', String(clamped)); } catch {}
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const selectedMdPath = selectedFile?.path || '';
  const hasSnippets = selectedMdPath && (snippetsByFile[selectedMdPath]?.length || 0) > 0;

  const handleOpen = async (): Promise<void> => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        console.warn('File dialog not available in current environment');
        feedback.toast.error('File dialog is only available in the Electron app');
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

  const handleDeleteNode = async (targetNode: FileNode) => {
    const typeText = targetNode.type === 'directory' ? '文件夹' : '文件';
    const confirmed = await feedback.confirm({
      title: '删除确认',
      message: `确定要删除${typeText} "${targetNode.name}" 吗？此操作不可撤销。`,
      type: 'danger',
      confirmText: '删除',
    });
    if (!confirmed) return;

    try {
      const api = (window as any).api;
      if (!api) {
        throw new Error('文件系统API不可用');
      }

      if (targetNode.type === 'directory') {
        if (!api.deleteDirectory) {
          throw new Error('删除目录API不可用');
        }
        await api.deleteDirectory(targetNode.path);
      } else {
        if (!api.deleteFile) {
          throw new Error('删除文件API不可用');
        }
        await api.deleteFile(targetNode.path);
      }

      feedback.toast.success('删除成功');

      if (api && api.getFileTree && currentPath) {
        const newTree = await api.getFileTree(currentPath);
        setFileTree(newTree);
      }
    } catch (err) {
      if (err instanceof Error) {
        feedback.toast.error(`删除失败: ${err.message}`);
      }
    }
  };

  const handleSelectFile = async (file: any) => {
    if (openFileAtPath) {
      setSelection('file', file.path);
      await openFileAtPath(file.path);
    }
  };

  const getTargetDirectory = (node: FileNode | null): string => {
    if (!node) return currentPath;
    if (node.type === 'directory') return node.path;
    const pathParts = node.path.split(/[/\\]/);
    pathParts.pop();
    return pathParts.join('/');
  };

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

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleShowInFolder = async () => {
    const { targetNode } = contextMenu;
    if (!targetNode) return;

    try {
      const api = (window as any).api;
      if (api && typeof api.showItemInFolder === 'function') {
        await api.showItemInFolder(targetNode.path);
      } else {
        console.warn('showItemInFolder not available in current environment');
        feedback.toast.error('此功能仅在Electron应用中可用');
      }
    } catch (err) {
      console.error('Failed to show item in folder:', err);
      feedback.toast.error('打开资源管理器失败');
    }
    closeContextMenu();
  };

  const getMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    const { targetNode, targetPath } = contextMenu;

    if (!targetNode) {
      items.push({ type: 'item', label: '新建.md', icon: '📄', onClick: () => setShowCreateMarkdownModal(true) });
      items.push({ type: 'item', label: '新建.solarwire', icon: '🎨', onClick: () => setShowCreateSolarWireModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '新建文件夹', icon: '📁', onClick: () => setShowCreateFolderModal(true) });
    } else if (targetNode.type === 'directory') {
      items.push({ type: 'item', label: '新建.md', icon: '📄', onClick: () => setShowCreateMarkdownModal(true) });
      items.push({ type: 'item', label: '新建.solarwire', icon: '🎨', onClick: () => setShowCreateSolarWireModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '新建文件夹', icon: '📁', onClick: () => setShowCreateFolderModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '重命名', icon: '✏️', onClick: () => setShowRenameModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '在资源管理器中查看', icon: '📂', onClick: handleShowInFolder });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => handleDeleteNode(targetNode) });
    } else {
      items.push({ type: 'item', label: '重命名', icon: '✏️', onClick: () => setShowRenameModal(true) });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '在资源管理器中查看', icon: '📂', onClick: handleShowInFolder });
      items.push({ type: 'separator' });
      items.push({ type: 'item', label: '删除', icon: '🗑️', onClick: () => handleDeleteNode(targetNode) });
    }

    return items;
  };

  const filteredFileTree = useMemo(() => {
    let result = fileTree;

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

    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return [...nodes].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;

        if (sortBy === 'name') {
          const comparison = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? comparison : -comparison;
        }

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
    <div className="file-view-container" onContextMenu={handleBlankContextMenu} ref={containerRef}>
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
      <div className="file-view-body" ref={bodyRef}>
        <div style={{ flex: hasSnippets ? splitRatio : 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Scrollbar className="file-view-scrollbar">
            <div className="file-view">
              {renderFileTree()}
            </div>
          </Scrollbar>
        </div>
        {hasSnippets && (
          <>
            <div
              className="file-view-splitter"
              onMouseDown={handleMouseDown}
            >
              <span className="file-view-splitter-handle">⋯</span>
            </div>
            <div className="file-view-snippet-panel" style={{ flex: 1 - splitRatio, minHeight: 80 }}>
              <SnippetListPanel
                sourceFilePath={selectedMdPath}
                fileName={selectedFile?.name || ''}
              />
            </div>
          </>
        )}
      </div>
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
