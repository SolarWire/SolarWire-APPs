import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { showToast } from '../../services/toast-service';
import './CreateFileModal.css';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    type: 'file' | 'directory';
    name: string;
    path: string;
  };
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, target }) => {
  const { currentPath, setFileTree } = useFileStore();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setNewName(target.name);
      setError('');
    }
  }, [isOpen, target.name]);

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

    // 验证新名称
    if (!newName.trim()) {
      setError('请输入新名称');
      return;
    }

    if (newName === target.name) {
      setError('新名称与原名称相同');
      return;
    }

    try {
      const api = (window as any).api;
      if (!api || !api.rename) {
        throw new Error('文件系统API不可用');
      }

      // 构建新路径
      const pathParts = target.path.split(/[/\\]/);
      pathParts.pop(); // 移除原名称
      const parentPath = pathParts.join('/');
      const newPath = `${parentPath}/${newName}`;

      // 重命名
      await api.rename(target.path, newPath);

      showToast('重命名成功', 'success');
      onClose();

      // 刷新文件树
      if (api && api.getFileTree && currentPath) {
        const newTree = await api.getFileTree(currentPath);
        setFileTree(newTree);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        showToast(`重命名失败: ${err.message}`, 'error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-file-modal-overlay">
      <div className="create-file-modal">
        <div className="create-file-modal-header">
          <h3>重命名</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <form className="create-file-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>当前名称</label>
            <input
              type="text"
              value={target.name}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label>新名称</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入新名称"
              className={error && !newName.trim() ? 'input-error' : ''}
              autoFocus
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">确认</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
