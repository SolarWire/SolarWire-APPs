import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileNode } from '../../../shared/types/file';
import { useFileStore } from '../../stores/fileStore';
import { SnippetInfo } from '../../../shared/types/file';
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

const SUPPORTED_EXTENSIONS = ['md', 'markdown', 'solarwire', 'sw', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'csv', 'xlsx', 'xls'];

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

  const snippetInfosByFile = useFileStore(state => state.snippetInfosByFile);
  const isMarkdown = node.type === 'file' && /\.(md|markdown)$/i.test(node.name);
  const snippetInfos = isMarkdown ? snippetInfosByFile[node.path] : undefined;
  const snippetCount = snippetInfos ? snippetInfos.length : 0;
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

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

  const handleItemMouseEnter = () => {
    if (!isMarkdown || !itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    setTooltipPos({ x: rect.right + 8, y: rect.top });
  };

  const handleItemMouseLeave = () => {
    setTooltipPos(null);
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
      case 'csv':
        return '📊';
      case 'xlsx':
      case 'xls':
        return '📗';
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
        onMouseEnter={handleItemMouseEnter}
        onMouseLeave={handleItemMouseLeave}
      >
        {node.type === 'directory' && (
          <span className="tree-item-arrow">{isExpanded ? '▼' : '▶'}</span>
        )}
        {node.type === 'file' && <span className="tree-item-arrow"></span>}
        <span className="tree-item-icon">{getIcon()}</span>
        <span className="tree-item-name">{node.name}</span>
        {snippetCount > 0 && (
          <span className="tree-item-badge">
            ⚡{snippetCount}
          </span>
        )}
      </div>
      {tooltipPos && isMarkdown && createPortal(
        <div
          className="tree-badge-global-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            zIndex: 10000,
          }}
        >
          {snippetCount > 0 ? (
            <>
              <div className="tree-tooltip-title">{snippetCount} 个 SolarWire 页面</div>
              {snippetInfos!.map((s, i) => (
                <div key={i} className="tree-tooltip-item">#{s.snippetIndex} {s.title || '未命名'}</div>
              ))}
            </>
          ) : (
            <div className="tree-tooltip-empty">未检测到 SolarWire 页面</div>
          )}
        </div>,
        document.body
      )}
      {node.type === 'directory' && isExpanded && node.children && node.children.length > 0 && (
        <div className="tree-children">
          {node.children
            .filter((child) => {
              if (child.name.startsWith('.')) return false;
              return true;
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
