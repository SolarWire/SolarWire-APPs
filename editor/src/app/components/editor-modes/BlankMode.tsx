import React from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAppStore } from '../../stores/appStore';
import './BlankMode.css';

const BlankMode: React.FC = () => {
  const { openDirectoryAtPath, fileTree, currentPath } = useFileStore();
  const { setCurrentView } = useAppStore();

  const handleOpenFolder = async () => {
    try {
      const api = (window as any).api;
      if (!api || !api.openFileDialog) {
        return;
      }
      const paths: string[] = await api.openFileDialog({ properties: ['openDirectory'] });
      if (paths && paths.length > 0 && openDirectoryAtPath) {
        await openDirectoryAtPath(paths[0]);
      }
    } catch (err) {
      console.error('Open dialog failed', err);
    }
  };

  const handleGoToFileView = () => {
    setCurrentView('file');
  };

  const hasFiles = fileTree && fileTree.length > 0;

  const shortcuts = [
    { keys: 'Ctrl+S', desc: '保存文件' },
    { keys: 'Ctrl+C', desc: '复制元素' },
    { keys: 'Ctrl+V', desc: '粘贴元素' },
    { keys: 'Delete', desc: '删除选中' },
    { keys: 'Space+拖拽', desc: '平移画布' },
    { keys: 'Ctrl+滚轮', desc: '缩放画布' },
  ];

  return (
    <div className="blank-mode">
      <div className="blank-mode-content">
        <div className="blank-mode-icon">
          <img src="/logo.svg" alt="SolarWire" className="blank-mode-logo" />
        </div>
        <div className="blank-mode-title">Welcome to SolarWire Editor</div>
        <div className="blank-mode-text">
          创建图表、流程图和线框图的可视化编辑器
        </div>

        <div className="blank-mode-actions">
          {!currentPath && (
            <button className="blank-mode-btn primary" onClick={handleOpenFolder}>
              📂 打开文件夹
            </button>
          )}
          {hasFiles && (
            <button className="blank-mode-btn" onClick={handleGoToFileView}>
              📁 浏览文件
            </button>
          )}
        </div>

        <div className="blank-mode-shortcuts">
          <div className="blank-mode-shortcuts-title">快捷键</div>
          <div className="blank-mode-shortcuts-grid">
            {shortcuts.map((s) => (
              <div key={s.keys} className="blank-mode-shortcut-item">
                <kbd className="blank-mode-kbd">{s.keys}</kbd>
                <span className="blank-mode-shortcut-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlankMode;
