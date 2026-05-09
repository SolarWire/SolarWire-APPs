import React, { useState, useEffect } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { feedback } from '../../stores/feedbackStore';
import ModalPortal from '../ui/ModalPortal';
import './CreateLibraryModal.css';

interface CreateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateLibraryModal: React.FC<CreateLibraryModalProps> = ({ isOpen, onClose }) => {
  const { createLibrary } = useComponentLibraryStore();
  
  const [libraryData, setLibraryData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    author: ''
  });
  
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const validateForm = () => {
    const errors: { name?: string } = {};
    
    if (!libraryData.name.trim()) {
      errors.name = '组件库名称不能为空';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createLibrary({
        name: libraryData.name.trim(),
        description: libraryData.description.trim(),
        version: libraryData.version.trim(),
        author: libraryData.author.trim(),
      });
      
      feedback.toast.success('组件库创建成功');
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        feedback.toast.error(err.message);
      }
    }
  };

  const handleClose = () => {
    setLibraryData({ name: '', description: '', version: '1.0.0', author: '' });
    setFormErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof typeof libraryData, value: string) => {
    setLibraryData(prev => ({ ...prev, [field]: value }));
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
    <ModalPortal><div className="create-library-modal-overlay">
      <div className="create-library-modal glass-panel">
        <div className="create-library-header">
          <h2>📦 新建组件库</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>
        
        <div className="create-library-content">
          <div className="form-group">
            <label htmlFor="library-name">组件库名称 *</label>
            <input
              id="library-name"
              type="text"
              placeholder="请输入组件库名称"
              value={libraryData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={formErrors.name ? 'input-error' : ''}
              autoFocus
            />
            {formErrors.name && <div className="error-message">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="library-description">描述</label>
            <textarea
              id="library-description"
              placeholder="请输入组件库描述"
              value={libraryData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="library-version">版本</label>
              <input
                id="library-version"
                type="text"
                placeholder="1.0.0"
                value={libraryData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="library-author">作者</label>
              <input
                id="library-author"
                type="text"
                placeholder="请输入作者名称"
                value={libraryData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="create-library-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            创建组件库
          </button>
        </div>
      </div>
    </div></ModalPortal>
  );
};

export default CreateLibraryModal;
