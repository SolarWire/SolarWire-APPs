import React, { useState, useEffect } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary, ComponentCategory } from '../../../shared/types/component';
import { showToast } from '../../services/toast-service';
import './CreateComponentModal.css';

interface CreateComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLibraryId?: string;
  defaultCategoryId?: string | null;
}

const CreateComponentModal: React.FC<CreateComponentModalProps> = ({ isOpen, onClose, defaultLibraryId, defaultCategoryId }) => {
  const { createComponent, libraries } = useComponentLibraryStore();
  
  const [componentData, setComponentData] = useState({
    name: '',
    description: '',
    code: '',
    libraryId: defaultLibraryId || '',
    categoryId: defaultCategoryId || ''
  });
  
  const [formErrors, setFormErrors] = useState<{ name?: string; libraryId?: string }>({});
  
  // 获取当前选中组件库的分类列表
  const [availableCategories, setAvailableCategories] = useState<ComponentCategory[]>([]);
  
  // 当defaultLibraryId或defaultCategoryId改变时更新内部状态
  useEffect(() => {
    if (defaultLibraryId) {
      setComponentData(prev => ({ 
        ...prev, 
        libraryId: defaultLibraryId,
        categoryId: defaultCategoryId || ''
      }));
    }
  }, [defaultLibraryId, defaultCategoryId]);
  
  useEffect(() => {
    if (componentData.libraryId) {
      const library = libraries.find(lib => lib.metadata.id === componentData.libraryId);
      if (library) {
        setAvailableCategories(library.categories);
      } else {
        setAvailableCategories([]);
      }
    } else {
      setAvailableCategories([]);
    }
  }, [componentData.libraryId, libraries]);

  const validateForm = () => {
    const errors: { name?: string; libraryId?: string } = {};
    
    if (!componentData.name.trim()) {
      errors.name = '组件名称不能为空';
    }
    
    if (!componentData.libraryId.trim()) {
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
      await createComponent(componentData.libraryId, componentData.categoryId || null, {
        name: componentData.name.trim(),
        description: componentData.description.trim(),
        code: componentData.code.trim() || '[]'
      });
      
      showToast('组件创建成功', 'success');
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleClose = () => {
    setComponentData({ 
      name: '', 
      description: '', 
      code: '', 
      libraryId: defaultLibraryId || '',
      categoryId: defaultCategoryId || ''
    });
    setFormErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof typeof componentData, value: string) => {
    setComponentData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 如果改变了组件库，清空分类选择
    if (field === 'libraryId') {
      setComponentData(prev => ({ ...prev, categoryId: '' }));
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
    <div className="create-component-modal-overlay">
      <div className="create-component-modal">
        <div className="create-component-header">
          <h2>🧩 新建组件</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="create-component-content">
          <div className="form-group">
            <label htmlFor="component-name">组件名称 *</label>
            <input
              id="component-name"
              type="text"
              placeholder="请输入组件名称"
              value={componentData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={formErrors.name ? 'input-error' : ''}
              autoFocus
            />
            {formErrors.name && <div className="error-message">{formErrors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="component-library">组件库 *</label>
            <select
              id="component-library"
              value={componentData.libraryId}
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
          
          <div className="form-group">
            <label htmlFor="component-category">分类（可选）</label>
            <select
              id="component-category"
              value={componentData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              disabled={!componentData.libraryId}
            >
              <option value="">请选择分类</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="component-description">描述（可选）</label>
            <textarea
              id="component-description"
              placeholder="请输入组件描述"
              value={componentData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="component-code">初始代码（可选）</label>
            <textarea
              id="component-code"
              placeholder="留空使用默认空组件: []"
              value={componentData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              rows={4}
              className="code-input"
            />
          </div>
        </div>
        
        <div className="create-component-footer">
          <button className="btn-cancel" onClick={handleClose}>取消</button>
          <button className="btn-primary" onClick={handleCreate}>创建</button>
        </div>
      </div>
    </div>
  );
};

export default CreateComponentModal;
