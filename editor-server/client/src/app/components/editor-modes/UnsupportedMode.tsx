import React, { useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import './UnsupportedMode.css';

const getFileIcon = (extension: string): string => {
  const iconMap: Record<string, string> = {
    // 文档类型
    'pdf': '📕',
    'doc': '📘',
    'docx': '📘',
    'xls': '📗',
    'xlsx': '📗',
    'ppt': '📙',
    'pptx': '📙',
    'txt': '📄',
    'rtf': '📄',
    
    // 代码类型
    'js': '📜',
    'jsx': '📜',
    'ts': '📘',
    'tsx': '📘',
    'html': '🌐',
    'htm': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'sass': '🎨',
    'less': '🎨',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'h': '⚙️',
    'cs': '🔷',
    'php': '🐘',
    'rb': '💎',
    'go': '🐹',
    'rs': '🦀',
    'swift': '🦉',
    'kt': '🎯',
    'dart': '🎯',
    'lua': '🌙',
    'r': '📊',
    'sql': '🗃️',
    'sh': '💻',
    'bat': '💻',
    'ps1': '💻',
    'vim': '💻',
    
    // 配置类型
    'json': '📋',
    'xml': '📋',
    'yaml': '📋',
    'yml': '📋',
    'toml': '📋',
    'ini': '📋',
    'cfg': '⚙️',
    'conf': '⚙️',
    'env': '🔐',
    
    // 压缩类型
    'zip': '📦',
    'rar': '📦',
    '7z': '📦',
    'tar': '📦',
    'gz': '📦',
    'bz2': '📦',
    
    // 媒体类型
    'mp3': '🎵',
    'wav': '🎵',
    'flac': '🎵',
    'mp4': '🎬',
    'avi': '🎬',
    'mkv': '🎬',
    'mov': '🎬',
    'wmv': '🎬',
    
    // 图片类型（除了已支持的）
    'bmp': '🖼️',
    'tiff': '🖼️',
    'webp': '🖼️',
    'ico': '🖼️',
    'gif': '🖼️',
    
    // 其他类型
    'exe': '⚡',
    'msi': '⚡',
    'dmg': '💿',
    'pkg': '💿',
    'deb': '📦',
    'rpm': '📦',
    'apk': '📱',
    'ipa': '📱',
    
    // 数据类型
    'csv': '📊',
    'dat': '📊',
    'db': '🗄️',
    'sqlite': '🗄️',
    
    // 字体类型
    'ttf': '🔤',
    'otf': '🔤',
    'woff': '🔤',
    'woff2': '🔤',
    'eot': '🔤',
  };
  
  return iconMap[extension] || '📄';
};

const UnsupportedMode: React.FC = () => {
  const { selectedFile } = useFileStore();

  const handleDownload = useCallback(() => {
    if (!selectedFile?.path) return;
    const a = document.createElement('a');
    a.href = `/api/files/download?path=${encodeURIComponent(selectedFile.path)}`;
    a.download = selectedFile.name;
    a.click();
  }, [selectedFile]);

  
  if (!selectedFile) {
    return (
      <div className="unsupported-mode-empty">
        <div className="unsupported-mode-empty-icon">📄</div>
        <div className="unsupported-mode-empty-text">请选择一个文件</div>
      </div>
    );
  }

  const fileExtension = selectedFile.path.split('.').pop()?.toLowerCase() || '';
  const fileTypeName = `${fileExtension.toUpperCase()} 文件`;
  const fileIcon = getFileIcon(fileExtension);

  return (
    <div className="unsupported-mode-container">
      <div className="unsupported-mode-file-info">
        <div className="unsupported-mode-file-icon">{fileIcon}</div>
        <div className="unsupported-mode-file-details">
          <h2 className="unsupported-mode-file-name">{selectedFile.name}</h2>
          <p className="unsupported-mode-file-type">{fileTypeName}</p>
          <p className="unsupported-mode-file-path">{selectedFile.path}</p>
        </div>
      </div>
      
      <div className="unsupported-mode-message">
        <p>SolarWire 暂不支持直接编辑此格式文件。</p>
        <p>您可以下载此文件到本地查看。</p>
      </div>
      
      <div className="unsupported-mode-actions">
        <button 
          className="unsupported-mode-button primary"
          onClick={handleDownload}
        >
          ⬇️ 下载文件
        </button>
      </div>
    </div>
  );
};

export default UnsupportedMode;
