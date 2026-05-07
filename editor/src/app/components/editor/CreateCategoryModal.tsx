import React, { useState, useEffect } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary } from '../../../shared/types/component';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './CreateCategoryModal.css';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLibraryId?: string;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose, defaultLibraryId }) => {
  const { createCategory, libraries } = useComponentLibraryStore();
  
  const [categoryData, setCategoryData] = useState({
    name: '',
    libraryId: defaultLibraryId || ''
  });
  
  const [formErrors, setFormErrors] = useState<{ name?: string; libraryId?: string }>({});

  // 当defaultLibraryId改变时更新内部状态
  useEffect(() => {
    if (defaultLibraryId) {
      setCategoryData(prev => ({ ...prev, libraryId: defaultLibraryId }));
    }
  }, [defaultLibraryId]);

  const validateForm = () => {
    const errors: { name?: string; libraryId?: string } = {};
    
    if (!categoryData.name.trim()) {
      errors.name = '分类名称不能为空';
    }
    
    if (!categoryData.libraryId.trim()) {
      errors.libraryId = '请选择组件库';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createCategory(categoryData.libraryId, {
        name: categoryData.name.trim(),
      });
      
      feedback.toast.success('分类创建成功');
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        feedback.toast.error(err.message);
      }
    }
  };

  const handleClose = () => {
    setCategoryData({ name: '', libraryId: defaultLibraryId || '' });
    setFormErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof typeof categoryData, value: string) => {
    setCategoryData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal><div className="create-category-modal-overlay">
      <div className="create-category-modal">
        <div className="create-category-header">
          <h2>📁 新建分类</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="create-category-content">
          <div className="form-group">
            <label htmlFor="category-name">分类名称 *</label>
            <input
              id="category-name"
              type="text"
              placeholder="请输入分类名称"
              value={categoryData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={formErrors.name ? 'input-error' : ''}
              autoFocus
            />
            {formErrors.name && <div className="error-message">{formErrors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="category-library">组件库 *</label>
            <select
              id="category-library"
              value={categoryData.libraryId}
              onChange={(e) => handleInputChange('libraryId', e.target.value)}
              className={formErrors.libraryId ? 'input-error' : ''}
            >
              <option value="">请选择组件库</option>
              {libraries.map((library) => (
                <option key={library.metadata.id} value={library.metadata.id}>
                  {library.metadata.name}
                </option>
              ))}
            </select>
            {formErrors.libraryId && <div className="error-message">{formErrors.libraryId}</div>}
          </div>
        </div>
        
        <div className="create-category-footer">
          <button className="btn-cancel" onClick={handleClose}>取消</button>
          <button className="btn-primary" onClick={handleCreate}>创建</button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default CreateCategoryModal;
