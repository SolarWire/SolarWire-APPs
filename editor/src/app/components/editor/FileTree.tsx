import React, { useEffect, useRef } from 'react';
import { FileNode } from '../../../shared/types/file';
import './FileTree.css';

interface FileTreeProps {
  nodes: FileNode[];
  expandedDirectories: Set<string>;
  selectedFile: FileNode | null;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (file: FileNode) => void;
  onContextMenu?: (node: FileNode, x: number, y: number) => void;
}

interface TreeItemProps {
  node: FileNode;
  expandedDirectories: Set<string>;
  selectedFile: FileNode | null;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (file: FileNode) => void;
  onContextMenu?: (node: FileNode, x: number, y: number) => void;
}

const SUPPORTED_EXTENSIONS = ['md', 'markdown', 'solarwire', 'sw', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];

const isSupportedFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_EXTENSIONS.includes(ext);
};

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  expandedDirectories,
  selectedFile,
  onToggleDirectory,
  onSelectFile,
  onContextMenu,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const isExpanded = expandedDirectories.has(node.path);
  const isSelected = selectedFile && selectedFile.path === node.path;

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  const handleClick = () => {
    if (node.type === 'directory') {
      onToggleDirectory(node.path);
    } else {
      onSelectFile(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(node, e.clientX, e.clientY);
    }
  };

  const getIcon = () => {
    if (node.type === 'directory') {
      return isExpanded ? '📂' : '📁';
    }
    const ext = node.name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'md':
      case 'markdown':
        return '📝';
      case 'sw':
      case 'solarwire':
        return '⚡';
      case 'svg':
        return '🎨';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'ico':
        return '🖼️';
      default:
        return '📄';
    }
  };

  return (
    <>
      <div
        ref={itemRef}
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'directory' && (
          <span className="tree-item-arrow">{isExpanded ? '▼' : '▶'}</span>
        )}
        {node.type === 'file' && <span className="tree-item-arrow"></span>}
        <span className="tree-item-icon">{getIcon()}</span>
        <span className="tree-item-name">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && node.children && node.children.length > 0 && (
        <div className="tree-children">
          {node.children
            .filter((child) => {
              if (child.type === 'directory') return true;
              if (child.name.startsWith('.')) return false;
              return isSupportedFile(child.name);
            })
            .map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                expandedDirectories={expandedDirectories}
                selectedFile={selectedFile}
                onToggleDirectory={onToggleDirectory}
                onSelectFile={onSelectFile}
                onContextMenu={onContextMenu}
              />
            ))}
        </div>
      )}
    </>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  expandedDirectories,
  selectedFile,
  onToggleDirectory,
  onSelectFile,
  onContextMenu,
}) => {
  return (
    <div className="file-tree">
      {nodes.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          expandedDirectories={expandedDirectories}
          selectedFile={selectedFile}
          onToggleDirectory={onToggleDirectory}
          onSelectFile={onSelectFile}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};

export default FileTree;
