import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from '../ui/ModalPortal';
import { useFileStore } from '../../stores/fileStore';
import { feedback } from '../../stores/feedbackStore';
import { apiClient } from '../../../shared/utils/api-client';
import type { FileNodeDTO } from '../../../shared/utils/api-client';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { refreshCurrentDirectory } = useFileStore();
  const [dirTree, setDirTree] = useState<FileNodeDTO[]>([]);
  const [selectedDir, setSelectedDir] = useState('.');
  const [selectedPath, setSelectedPath] = useState('./');
  const [uploading, setUploading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['.']));

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDir('.');
    setSelectedPath('./');
    setUploading(false);
    setExpandedDirs(new Set(['.']));
    loadDirTree();
  }, [isOpen]);

  const loadDirTree = async () => {
    try {
      const tree = await apiClient.getFileTree();
      setDirTree(tree);
    } catch (err) {
      console.error('Failed to load directory tree:', err);
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const selectDir = (path: string) => {
    setSelectedDir(path);
  };

  const collectAllDirectories = useCallback((nodes: FileNodeDTO[]): Array<{ name: string; path: string }> => {
    const result: Array<{ name: string; path: string }> = [{ name: '/ (根目录)', path: '.' }];

    const walk = (children: FileNodeDTO[], prefix: string) => {
      for (const node of children) {
        if (node.type === 'directory') {
          result.push({ name: node.name, path: node.path });
          if (node.children) {
            walk(node.children, node.path);
          }
        }
      }
    };

    walk(nodes, '');
    return result;
  }, []);

  const handleSelectFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.addEventListener('change', async () => {
      if (!input.files || input.files.length === 0) return;

      const files = Array.from(input.files);
      setUploading(true);

      let uploaded = 0;
      let failed = 0;

      for (const file of files) {
        try {
          await apiClient.uploadFile(file, selectedDir);
          uploaded++;
        } catch (err) {
          failed++;
          console.error('Upload failed:', file.name, err);
        }
      }

      setUploading(false);

      if (uploaded > 0) {
        feedback.toast.success(`已上传 ${uploaded} 个文件${failed > 0 ? `，${failed} 个失败` : ''} 到 ${selectedDir}`);
        refreshCurrentDirectory();
      } else if (failed > 0) {
        feedback.toast.error('上传失败，请检查文件大小限制（10MB）');
      }

      onClose();
    });

    input.click();
  };

  const renderTree = (nodes: FileNodeDTO[], level: number = 0) => {
    return nodes
      .filter(n => n.type === 'directory')
      .map(node => {
        const isExpanded = expandedDirs.has(node.path);
        const isSelected = selectedDir === node.path;
        const hasChildren = node.children && node.children.some(c => c.type === 'directory');

        return (
          <React.Fragment key={node.path}>
            <div
              className={`upload-modal-tree-item ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: 12 + level * 16 }}
              onClick={() => selectDir(node.path)}
            >
              <span
                className="upload-modal-tree-arrow"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
              >
                {hasChildren ? (isExpanded ? '▼' : '▶') : '  '}
              </span>
              <span className="upload-modal-tree-icon">📁</span>
              <span className="upload-modal-tree-name">{node.name}</span>
            </div>
            {isExpanded && node.children && renderTree(node.children, level + 1)}
          </React.Fragment>
        );
      });
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="upload-modal-overlay" onClick={onClose}>
        <div className="upload-modal" onClick={e => e.stopPropagation()}>
          <div className="upload-modal-header">
            <h3>上传文件</h3>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>

          <div className="upload-modal-body">
            <div className="upload-modal-section-label">选择目标目录</div>
            <div className="upload-modal-tree">
              {dirTree.length > 0 ? renderTree(dirTree) : (
                <div className="upload-modal-empty">加载中...</div>
              )}
            </div>

            <div className="upload-modal-selected">
              已选择：<strong>{selectedDir === '.' ? 'workspace/' : `workspace/${selectedDir}`}</strong>
            </div>

            <div className="upload-modal-hint">
              支持多选文件，单文件最大 10MB
            </div>
          </div>

          <div className="upload-modal-actions">
            <button className="btn-cancel" onClick={onClose}>取消</button>
            <button
              className="btn-primary"
              onClick={handleSelectFiles}
              disabled={uploading}
            >
              {uploading ? '上传中...' : '选择文件'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default UploadModal;