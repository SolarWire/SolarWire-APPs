import React, { useState, useEffect } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary, ComponentCategory } from '../../../shared/types/component';
import { normalizeCategoryId } from '../../../shared/utils/component-utils';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './ChangeComponentParentModal.css';

interface ChangeComponentParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  currentLibraryId: string;
  currentCategoryId?: string | null;
}

const ChangeComponentParentModal: React.FC<ChangeComponentParentModalProps> = ({ 
  isOpen, 
  onClose, 
  componentId, 
  currentLibraryId, 
  currentCategoryId 
}) => {
  const { libraries, moveComponent } = useComponentLibraryStore();
  
  const [selectedLibraryId, setSelectedLibraryId] = useState(currentLibraryId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(currentCategoryId || null);
  const [availableCategories, setAvailableCategories] = useState<ComponentCategory[]>([]);
  
  // 当props变化时更新内部状态
  useEffect(() => {
    setSelectedLibraryId(currentLibraryId);
    setSelectedCategoryId(normalizeCategoryId(currentCategoryId));
  }, [currentLibraryId, currentCategoryId]);

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
  
  useEffect(() => {
    if (selectedLibraryId) {
      const library = libraries.find(lib => lib.metadata.id === selectedLibraryId);
      if (library) {
        setAvailableCategories(library.categories);
      } else {
        setAvailableCategories([]);
      }
    } else {
      setAvailableCategories([]);
    }
  }, [selectedLibraryId, libraries]);

  const handleLibraryChange = (libraryId: string) => {
    setSelectedLibraryId(libraryId);
    setSelectedCategoryId(''); // 重置分类选择
  };

  const handleMove = async () => {
    try {
      await moveComponent(
        currentLibraryId,
        componentId,
        selectedLibraryId,
        selectedCategoryId || null,
        '', // targetComponentInternalId - 移动到分类末尾
        'after'
      );
      
      feedback.toast.success('组件归属已更改');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        feedback.toast.error(err.message);
      }
    }
  };

  const handleClose = () => {
    setSelectedLibraryId(currentLibraryId);
    setSelectedCategoryId(currentCategoryId || '');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal><div className="change-component-parent-modal-overlay">
      <div className="change-component-parent-modal glass-panel">
        <div className="change-component-parent-header">
          <h2>🔄 改变组件归属</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="change-component-parent-content">
          <div className="form-group">
            <label htmlFor="target-library">目标组件库 *</label>
            <select
              id="target-library"
              value={selectedLibraryId}
              onChange={(e) => handleLibraryChange(e.target.value)}
            >
              {libraries.map((library) => (
                <option key={library.metadata.id} value={library.metadata.id}>
                  {library.metadata.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="target-category">目标分类（可选）</label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              disabled={!selectedLibraryId}
            >
              <option value="">未分类</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>当前归属</label>
            <div className="current-parent-info">
              <div>组件库: {libraries.find(lib => lib.metadata.id === currentLibraryId)?.metadata.name}</div>
              {currentCategoryId && (
                <div>分类: {libraries.find(lib => lib.metadata.id === currentLibraryId)?.categories.find(cat => cat.id === currentCategoryId)?.name}</div>
              )}
              {!currentCategoryId && <div>分类: 未分类</div>}
            </div>
          </div>
        </div>
        
        <div className="change-component-parent-footer">
          <button className="btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button 
            className="btn-primary" 
            onClick={handleMove}
            disabled={selectedLibraryId === currentLibraryId && selectedCategoryId === (currentCategoryId || null)}
          >
            移动组件
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default ChangeComponentParentModal;
