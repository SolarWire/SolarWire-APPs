/**
 * 精简状态栏组件 - 左侧显示当前模式，右侧显示当前文件信息
 */

import React from 'react';
import { useStatusStore } from '../../stores/statusStore';
import './StatusBar.css';

// 主状态栏组件
export function StatusBar(): React.ReactElement {
  const { editorStatus, filePath, fileStatus } = useStatusStore();

  // 获取文件名
  const fileName = filePath ? filePath.split(/[\\/]/).pop() || filePath : '未打开文件';
  const modifiedIndicator = fileStatus.isModified ? ' ●' : '';

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {/* 左侧：当前模式 */}
        <span className="status-bar-item">
          {editorStatus.mode === 'markdown' ? '📝 Markdown' : '🎨 SolarWire'}
        </span>
      </div>
      
      <div className="status-bar-right">
        {/* 右侧：当前文件信息 */}
        <span className="status-bar-item">
          📄 {fileName}{modifiedIndicator}
        </span>
      </div>
    </div>
  );
}
