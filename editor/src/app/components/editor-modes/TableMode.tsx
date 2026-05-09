import React, { useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import './TableMode.css';

const TableMode: React.FC = () => {
  const { selectedFile } = useFileStore();

  // Handle opening file with system default program
  const handleOpenWithSystem = useCallback(async () => {
    if (!selectedFile?.path) return;
    
    try {
      const api = (window as any).api;
      if (api && typeof api.system?.openWithSystem === 'function') {
        const result = await api.system.openWithSystem(selectedFile.path);
        if (!result.success) {
          console.error('Failed to open file:', result.error);
        }
      } else if (api && typeof api.system?.openPath === 'function') {
        const result = await api.system.openPath(selectedFile.path);
        if (!result.success) {
          console.error('Failed to open file:', result.error);
        }
      } else {
        console.error('System API not available');
      }
    } catch (error) {
      console.error('Failed to open file with system:', error);
    }
  }, [selectedFile]);

  // Get file extension for display
  const getFileExtension = (filePath: string) => {
    return filePath.split('.').pop()?.toLowerCase() || '';
  };

  // Get file icon based on extension
  const getFileIcon = (extension: string) => {
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'csv':
        return '📋';
      default:
        return '📄';
    }
  };

  // Get file type name
  const getFileTypeName = (extension: string) => {
    switch (extension) {
      case 'xlsx':
        return 'Excel 工作簿';
      case 'xls':
        return 'Excel 97-2003 工作簿';
      case 'csv':
        return 'CSV 文件';
      default:
        return '表格文件';
    }
  };

  if (!selectedFile) {
    return (
      <div className="table-mode-empty">
        <div className="table-mode-empty-icon">📊</div>
        <div className="table-mode-empty-text">请选择一个表格文件</div>
      </div>
    );
  }

  const fileExtension = getFileExtension(selectedFile.path);
  const fileIcon = getFileIcon(fileExtension);
  const fileTypeName = getFileTypeName(fileExtension);

  return (
    <div className="table-mode-external">
      <div className="table-file-info">
        <div className="table-file-icon">{fileIcon}</div>
        <div className="table-file-details">
          <h2 className="table-file-name">{selectedFile.name}</h2>
          <p className="table-file-type">{fileTypeName}</p>
          <p className="table-file-path">{selectedFile.path}</p>
        </div>
      </div>
      
      <div className="table-message">
        <p>此文件类型需要在系统默认程序中打开编辑。</p>
        <p>点击下方按钮用系统默认程序打开此文件。</p>
      </div>
      
      <div className="table-actions">
        <button 
          className="table-open-button"
          onClick={handleOpenWithSystem}
        >
          🚀 用系统默认程序打开
        </button>
      </div>
    </div>
  );
};

export default TableMode;
