import React, { useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { feedback } from '../../stores/feedbackStore';
import './CreateFileModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    type: 'file' | 'directory';
    name: string;
    path: string;
  };
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, target }) => {
  const { currentPath, setFileTree } = useFileStore();

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

  const handleDelete = async () => {
    try {
      const api = (window as any).api;
      if (!api) {
        throw new Error('文件系统API不可用');
      }

      if (target.type === 'directory') {
        if (!api.deleteDirectory) {
          throw new Error('删除目录API不可用');
        }
        await api.deleteDirectory(target.path);
      } else {
        if (!api.deleteFile) {
          throw new Error('删除文件API不可用');
        }
        await api.deleteFile(target.path);
      }

      feedback.toast.success('删除成功');
      onClose();

      // 刷新文件树
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

  if (!isOpen) return null;

  const isDirectory = target.type === 'directory';
  const icon = isDirectory ? '📁' : '📄';
  const typeText = isDirectory ? '文件夹' : '文件';

  return (
    <div className="create-file-modal-overlay">
      <div className="create-file-modal">
        <div className="create-file-modal-header">
          <h3>确认删除</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="delete-confirm-content">
          <div className="delete-confirm-icon">{icon}</div>
          <div className="delete-confirm-info">
            <div className="delete-confirm-name">{target.name}</div>
            <div className="delete-confirm-type">{typeText}</div>
          </div>
        </div>
        {isDirectory && (
          <div className="delete-confirm-warning">
            ⚠️ 删除文件夹将同时删除其中的所有文件和子文件夹，此操作不可撤销。
          </div>
        )}
        <div className="delete-confirm-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
          <button type="button" className="btn-danger" onClick={handleDelete}>确认删除</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
