import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { FileNode } from '../../../shared/types/file';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './CreateFileModal.css';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirectory?: string;
}

const CreateFileModal: React.FC<CreateFileModalProps> = ({ isOpen, onClose, defaultDirectory = '' }) => {
  const { fileTree, currentPath, setFileTree } = useFileStore();
  const [fileName, setFileName] = useState('');
  const [directory, setDirectory] = useState(defaultDirectory);
  const [fileType, setFileType] = useState<'md' | 'solarwire'>('md');
  const [pageName, setPageName] = useState('');
  const [error, setError] = useState('');

  // 获取所有目录
  const directories = React.useMemo(() => {
    const dirs: FileNode[] = [];
    const collectDirectories = (node: FileNode) => {
      if (node.type === 'directory') {
        dirs.push(node);
        if (node.children) {
          node.children.forEach(collectDirectories);
        }
      }
    };
    fileTree.forEach(collectDirectories);
    return dirs;
  }, [fileTree]);

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setDirectory(defaultDirectory);
      setFileType('md');
      setPageName('');
      setError('');
    }
  }, [isOpen, defaultDirectory]);

  // ESC键关闭模态窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证文件名
    if (!fileName.trim()) {
      setError('请输入文件名');
      return;
    }

    // 验证目录
    if (!directory) {
      setError('请选择目录');
      return;
    }

    // 验证页面名称（solarwire文件需要）
    if (fileType === 'solarwire' && !pageName.trim()) {
      setError('请输入页面名称');
      return;
    }

    try {
      const api = (window as any).api;
      if (!api || !api.writeFile) {
        throw new Error('文件系统API不可用');
      }

      // 构建文件路径
      const extension = fileType === 'md' ? 'md' : 'solarwire';
      const filePath = `${directory}/${fileName}.${extension}`;

      // 构建文件内容
      let content = '';
      if (fileType === 'solarwire') {
        content = `!title=${pageName.trim()}\n`;
      }

      // 写入文件
      await api.writeFile(filePath, content);

      feedback.toast.success('文件创建成功');
      onClose();

      // 刷新文件树
      if (api && api.getFileTree && currentPath) {
        const newTree = await api.getFileTree(currentPath);
        setFileTree(newTree);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        feedback.toast.error(`创建文件失败: ${err.message}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal><div className="create-file-modal-overlay">
      <div className="create-file-modal glass-panel">
        <div className="create-file-modal-header">
          <h3>新建文件</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <form className="create-file-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>文件名</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="输入文件名"
              className={error && !fileName.trim() ? 'input-error' : ''}
            />
          </div>

          <div className="form-group">
            <label>目录</label>
            <select
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              className={error && !directory ? 'input-error' : ''}
            >
              <option value="">选择目录</option>
              {directories.map((dir) => (
                <option key={dir.path} value={dir.path}>
                  {dir.path}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>文件类型</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="md"
                  checked={fileType === 'md'}
                  onChange={(e) => setFileType(e.target.value as 'md' | 'solarwire')}
                />
                <span>.md</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="solarwire"
                  checked={fileType === 'solarwire'}
                  onChange={(e) => setFileType(e.target.value as 'md' | 'solarwire')}
                />
                <span>.solarwire</span>
              </label>
            </div>
          </div>

          {fileType === 'solarwire' && (
            <div className="form-group">
              <label>页面名称</label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="输入页面名称"
                className={error && fileType === 'solarwire' && !pageName.trim() ? 'input-error' : ''}
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">创建</button>
          </div>
        </form>
      </div>
    </div></ModalPortal>
  );
};

export default CreateFileModal;
