import React from 'react';
import './BlankMode.css';

const BlankMode: React.FC = () => {
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
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="SolarWire" className="blank-mode-logo" />
        </div>
        <div className="blank-mode-title">Welcome to SolarWire Editor</div>
        <div className="blank-mode-text">
          创建图表、流程图和线框图的可视化编辑器
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