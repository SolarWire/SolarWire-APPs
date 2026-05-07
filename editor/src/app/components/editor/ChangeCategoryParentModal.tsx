import React, { useState, useEffect } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './ChangeCategoryParentModal.css';

interface ChangeCategoryParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  currentLibraryId: string;
}

const ChangeCategoryParentModal: React.FC<ChangeCategoryParentModalProps> = ({ 
  isOpen, 
  onClose, 
  categoryId, 
  currentLibraryId 
}) => {
  const { libraries, moveCategory } = useComponentLibraryStore();
  
  const [selectedLibraryId, setSelectedLibraryId] = useState(currentLibraryId);
  
  // 当props变化时更新内部状态
  useEffect(() => {
    setSelectedLibraryId(currentLibraryId);
  }, [currentLibraryId]);

  // ESC键关闭模态窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const handleMove = async () => {
    try {
      await moveCategory(
        currentLibraryId,
        categoryId,
        selectedLibraryId,
        null, // targetCategoryId - 移动到组件库末尾
        'after'
      );
      
      feedback.toast.success('分类归属已更改');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        feedback.toast.error(err.message);
      }
    }
  };

  const handleClose = () => {
    setSelectedLibraryId(currentLibraryId);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal><div className="change-category-parent-modal-overlay">
      <div className="change-category-parent-modal">
        <div className="change-category-parent-header">
          <h2>🔄 改变分类归属</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="change-category-parent-content">
          <div className="form-group">
            <label htmlFor="target-library">目标组件库 *</label>
            <select
              id="target-library"
              value={selectedLibraryId}
              onChange={(e) => setSelectedLibraryId(e.target.value)}
            >
              {libraries.map((library) => (
                <option key={library.metadata.id} value={library.metadata.id}>
                  {library.metadata.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>当前归属</label>
            <div className="current-parent-info">
              <div>组件库: {libraries.find(lib => lib.metadata.id === currentLibraryId)?.metadata.name}</div>
            </div>
          </div>
        </div>
        
        <div className="change-category-parent-footer">
          <button className="btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button 
            className="btn-primary" 
            onClick={handleMove}
            disabled={selectedLibraryId === currentLibraryId}
          >
            移动分类
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default ChangeCategoryParentModal;
