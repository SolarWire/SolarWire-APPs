import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { FileNode } from '../../../shared/types/file';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './CreateFileModal.css';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirectory?: string;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, defaultDirectory = '' }) => {
  const { fileTree, currentPath, setFileTree } = useFileStore();
  const [folderName, setFolderName] = useState('');
  const [directory, setDirectory] = useState(defaultDirectory);
  const [error, setError] = useState('');

  // 获取所有目录
  const directories = React.useMemo(() => {
    const dirs: FileNode[] = [];
    
    // 添加工作区根目录
    if (currentPath) {
      dirs.push({
        name: currentPath.split(/[/\\]/).pop() || currentPath,
        path: currentPath,
        type: 'directory',
        children: fileTree
      });
    }
    
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
  }, [fileTree, currentPath]);

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setDirectory(defaultDirectory);
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

    // 验证文件夹名称
    if (!folderName.trim()) {
      setError('请输入文件夹名称');
      return;
    }

    // 验证目录
    if (!directory) {
      setError('请选择目录');
      return;
    }

    // 检查重名
    const targetPath = `${directory}/${folderName}`;
    const api = (window as any).api;
    if (api && api.exists) {
      const exists = await api.exists(targetPath);
      if (exists) {
        setError('文件夹名已存在，请使用其他名称');
        return;
      }
    }

    try {
      const api = (window as any).api;
      if (!api || !api.mkdir) {
        throw new Error('文件系统API不可用');
      }

      // 构建文件夹路径
      const folderPath = `${directory}/${folderName}`;

      // 创建文件夹
      await api.mkdir(folderPath);

      feedback.toast.success('文件夹创建成功');
      onClose();

      // 刷新文件树
      if (api && api.getFileTree && currentPath) {
        const newTree = await api.getFileTree(currentPath);
        setFileTree(newTree);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        feedback.toast.error(`创建文件夹失败: ${err.message}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal><div className="create-file-modal-overlay">
      <div className="create-file-modal">
        <div className="create-file-modal-header">
          <h3>新建文件夹</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <form className="create-file-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>文件夹名称</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="输入文件夹名称"
              className={error && !folderName.trim() ? 'input-error' : ''}
            />
          </div>

          <div className="form-group">
            <label>父目录</label>
            <select
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              className={error && !directory ? 'input-error' : ''}
            >
              <option value="">选择目录</option>
              {directories.map((dir) => (
                <option key={dir.path} value={dir.path}>
                  {dir.path === '.' ? 'workspace/' : `workspace/${dir.path}`}
                </option>
              ))}
            </select>
          </div>

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

export default CreateFolderModal;
