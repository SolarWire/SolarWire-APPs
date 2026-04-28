/**
 * 增强状态栏组件 - 集成所有状态反馈和通知
 */

import React, { useState, useRef } from 'react';
import { useStatusStore } from '../../stores/statusStore';
import './StatusBar.css';

// 获取操作图标
function getOperationIcon(type: string): string {
  const icons: Record<string, string> = {
    'save': '💾',
    'open': '📁',
    'load': '📂',
    'version': '📋',
    'parse': '🔍',
    'render': '🎨',
    'compile': '⚙️',
    'export': '📤',
    'import': '📥',
    'sync': '🔄'
  };
  return icons[type] || '⚡';
}

// 获取通知图标
function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  };
  return icons[type] || 'ℹ️';
}

// 旋转加载器组件
function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 50 50">
      <circle
        className="spinner-circle"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth="5"
      />
    </svg>
  );
}

// 进度条组件
function ProgressBar({ progress }: { progress?: number }) {
  if (progress !== undefined) {
    // 真实进度条
    return (
      <div className="progress-bar-container">
        <div 
          className="progress-bar-real" 
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  } else {
    // 虚拟进度条（动画效果）
    return (
      <div className="progress-bar-container">
        <div className="progress-bar-virtual" />
      </div>
    );
  }
}

// 操作状态显示组件
function OperationStatusDisplay() {
  const { currentOperation } = useStatusStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  if (!currentOperation) return null;

  const { type, status, message, errorDetail, progress, startTime } = currentOperation;
  const icon = getOperationIcon(type);
  
  // 计算操作耗时
  const getOperationDuration = () => {
    if (!startTime) return '';
    const duration = Date.now() - startTime;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}min`;
  };
  
  // 生成操作状态详细信息
  const generateOperationTooltip = () => {
    const lines = [
      `操作类型: ${type}`,
      `当前状态: ${status === 'running' ? '进行中' : status === 'success' ? '成功' : '失败'}`,
      `操作消息: ${message}`,
    ];
    
    if (startTime) {
      lines.push(`开始时间: ${new Date(startTime).toLocaleTimeString()}`);
      lines.push(`运行时长: ${getOperationDuration()}`);
    }
    
    if (progress !== undefined) {
      lines.push(`进度: ${progress}%`);
    }
    
    if (status === 'error' && errorDetail) {
      lines.push('', '错误详情:', errorDetail);
    }
    
    // 添加操作说明
    const operationDescriptions: Record<string, string> = {
      'save': '保存当前文件到磁盘',
      'open': '打开文件或目录',
      'load': '加载数据或配置',
      'version': '版本历史操作',
      'parse': '解析文件内容',
      'render': '渲染可视化内容',
      'compile': '编译代码',
      'export': '导出文件',
      'import': '导入文件',
      'sync': '同步数据'
    };
    
    if (operationDescriptions[type]) {
      lines.push('', `说明: ${operationDescriptions[type]}`);
    }
    
    return lines.join('\n');
  };
  
  // 处理鼠标移动，更新tooltip位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      const tooltipWidth = 350;
      const tooltipHeight = 250;
      
      let x = e.clientX;
      let y = rect.top - tooltipHeight - 10;
      
      if (x + tooltipWidth > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = rect.bottom + 10;
      }
      
      setTooltipPosition({ x, y });
    }
  };

  if (status === 'running') {
    return (
      <div 
        ref={componentRef}
        className="status-bar-item operation-status running"
        onMouseEnter={(e) => {
          setShowTooltip(true);
          handleMouseMove(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Spinner />
        <ProgressBar progress={progress} />
        <span className="operation-message">{message}</span>
        {progress !== undefined && (
          <span className="progress-text">{progress}%</span>
        )}
        
        {showTooltip && (
          <div 
            className="custom-tooltip operation-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'none'
            }}
          >
            <div className="tooltip-content">
              {generateOperationTooltip().split('\n').map((line, index) => (
                <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('错误详情') ? 'error' : ''} ${line.includes('说明:') ? 'description' : ''}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div 
        ref={componentRef}
        className="status-bar-item operation-status success"
        onMouseEnter={(e) => {
          setShowTooltip(true);
          handleMouseMove(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="status-icon">✅</span>
        <span className="operation-message">{message}</span>
        
        {showTooltip && (
          <div 
            className="custom-tooltip operation-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'none'
            }}
          >
            <div className="tooltip-content">
              {generateOperationTooltip().split('\n').map((line, index) => (
                <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('说明:') ? 'description' : ''}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div 
        ref={componentRef}
        className="status-bar-item operation-status error"
        onMouseEnter={(e) => {
          setShowTooltip(true);
          handleMouseMove(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="status-icon">❌</span>
        <span className="operation-message error-message">
          {message}
        </span>
        
        {showTooltip && (
          <div 
            className="custom-tooltip operation-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'none'
            }}
          >
            <div className="tooltip-content">
              {generateOperationTooltip().split('\n').map((line, index) => (
                <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('错误详情') ? 'error' : ''} ${line.includes('说明:') ? 'description' : ''}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// 文件信息显示组件
function FileStatusDisplay() {
  const { filePath, fileStatus } = useStatusStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  if (!filePath) {
    return (
      <div className="status-bar-item file-status">
        <span className="no-file-text">未打开文件</span>
      </div>
    );
  }

  const fileName = filePath.split(/[\\/]/).pop() || filePath;
  const modifiedIndicator = fileStatus.isModified ? '●' : '';
  
  // 生成详细的文件信息tooltip
  const generateFileTooltip = () => {
    const lines = [
      `完整路径: ${filePath}`,
      `文件名: ${fileName}`,
      `编码: ${fileStatus.encoding}`,
      `行数: ${fileStatus.lineCount}`,
      `状态: ${fileStatus.isModified ? '已修改' : '未修改'}`,
      `光标: 行 ${fileStatus.cursorPosition.line}, 列 ${fileStatus.cursorPosition.column}`,
    ];
    
    if (fileStatus.selectionCount > 0) {
      lines.push(`已选择: ${fileStatus.selectionCount} 字符`);
    }
    
    // 添加文件大小估算（基于行数）
    const estimatedSize = Math.round(fileStatus.lineCount * 50); // 假设每行平均50字符
    lines.push(`估算大小: ${estimatedSize > 1024 ? `${Math.round(estimatedSize/1024)}KB` : `${estimatedSize}B`}`);
    
    return lines.join('\n');
  };
  
  // 处理鼠标移动，更新tooltip位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      const tooltipWidth = 300; // 预估tooltip宽度
      const tooltipHeight = 200; // 预估tooltip高度
      
      let x = e.clientX;
      let y = rect.top - tooltipHeight - 10; // 显示在组件上方
      
      // 确保不超出窗口边界
      if (x + tooltipWidth > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = rect.bottom + 10; // 如果上方空间不够，显示在下方
      }
      
      setTooltipPosition({ x, y });
    }
  };

  return (
    <div 
      ref={componentRef}
      className="status-bar-item file-status"
      onMouseEnter={(e) => {
        setShowTooltip(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="file-icon">📄</span>
      <span className="file-name">{fileName}{modifiedIndicator}</span>
      <span className="file-info">
        {fileStatus.lineCount}行 · {fileStatus.encoding}
      </span>
      {fileStatus.selectionCount > 0 && (
        <span className="selection-info">
          已选择 {fileStatus.selectionCount} 字符
        </span>
      )}
      
      {showTooltip && (
        <div 
          className="custom-tooltip file-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'none'
          }}
        >
          <div className="tooltip-content">
            {generateFileTooltip().split('\n').map((line, index) => (
              <div key={index} className="tooltip-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 编辑器状态显示组件
function EditorStatusDisplay() {
  const { editorStatus } = useStatusStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);
  
  // 生成编辑器状态详细信息
  const generateEditorTooltip = () => {
    const lines = [
      `当前模式: ${editorStatus.mode === 'markdown' ? 'Markdown' : 'SolarWire'}`,
      `模式说明: ${editorStatus.mode === 'markdown' ? '文档编辑模式' : '可视化编辑模式'}`,
    ];
    
    if (editorStatus.mode === 'solarwire') {
      lines.push(
        `缩放比例: ${editorStatus.zoom}%`,
        `元素数量: ${editorStatus.elementCount}`,
        `选中元素: ${editorStatus.selectedElementCount}`,
        '',
        '快捷键:',
        'V - 选择工具',
        'S - 框选工具',
        'H - 平移工具',
        '+/- - 缩放'
      );
    } else {
      lines.push(
        '',
        '快捷键:',
        'Ctrl+S - 保存文件',
        'Ctrl+F - 查找',
        'Ctrl+Z - 撤销',
        'Ctrl+Y - 重做'
      );
    }
    
    return lines.join('\n');
  };
  
  // 处理鼠标移动，更新tooltip位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      const tooltipWidth = 250;
      const tooltipHeight = 180;
      
      let x = e.clientX;
      let y = rect.top - tooltipHeight - 10;
      
      if (x + tooltipWidth > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = rect.bottom + 10;
      }
      
      setTooltipPosition({ x, y });
    }
  };

  return (
    <div 
      ref={componentRef}
      className="status-bar-item editor-status"
      onMouseEnter={(e) => {
        setShowTooltip(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="mode-indicator">
        {editorStatus.mode === 'markdown' ? '📝' : '🎨'} 
        {editorStatus.mode === 'markdown' ? 'Markdown' : 'SolarWire'}
      </span>
      {editorStatus.mode === 'solarwire' && (
        <>
          <span className="separator">|</span>
          <span className="zoom-info">{editorStatus.zoom}%</span>
          <span className="separator">|</span>
          <span className="element-count">
            {editorStatus.elementCount} 元素
            {editorStatus.selectedElementCount > 0 && 
              ` (${editorStatus.selectedElementCount} 已选择)`
            }
          </span>
        </>
      )}
      
      {showTooltip && (
        <div 
          className="custom-tooltip editor-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'none'
          }}
        >
          <div className="tooltip-content">
            {generateEditorTooltip().split('\n').map((line, index) => (
              <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('快捷键') ? 'header' : ''} ${line.includes(':') && !line.includes('快捷键') ? 'info' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 通知显示组件
function NotificationDisplay() {
  const { notifications, removeNotification } = useStatusStore();
  const [expanded, setExpanded] = useState(false);

  const recentNotifications = notifications.slice(-3); // 只显示最近3条
  const hasNotifications = notifications.length > 0;
  const errorCount = notifications.filter(n => n.type === 'error').length;

  if (!hasNotifications) return null;

  return (
    <div className="notification-display">
      <div 
        className="notification-summary"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="notification-icon">
          {errorCount > 0 ? '❌' : 'ℹ️'}
        </span>
        <span className="notification-count">
          {notifications.length} 通知
          {errorCount > 0 && ` (${errorCount} 错误)`}
        </span>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="notification-dropdown">
          {recentNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item notification-${notification.type}`}
            >
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <span className="notification-message">
                {notification.message}
              </span>
              <button 
                className="notification-close"
                onClick={() => removeNotification(notification.id)}
              >
                ×
              </button>
            </div>
          ))}
          {notifications.length > 3 && (
            <div className="notification-more">
              还有 {notifications.length - 3} 条更早的通知...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 系统状态显示组件
function SystemStatusDisplay() {
  const { isOnline, memoryUsage } = useStatusStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);
  
  // 获取系统详细信息
  const getSystemInfo = () => {
    const info: string[] = [];
    
    // 网络状态
    info.push(`网络状态: ${isOnline ? '已连接' : '离线'}`);
    if (isOnline && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      info.push(`连接类型: ${connection?.effectiveType || '未知'}`);
    }
    
    // 内存信息
    if (memoryUsage !== undefined) {
      info.push(`内存使用: ${memoryUsage}%`);
      if (memoryUsage > 80) {
        info.push('⚠️ 内存使用率较高，建议重启应用');
      }
    }
    
    // 浏览器信息
    info.push('', '浏览器信息:');
    info.push(`用户代理: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
    info.push(`平台: ${navigator.platform}`);
    info.push(`语言: ${navigator.language}`);
    
    // 屏幕信息
    info.push('', '屏幕信息:');
    info.push(`分辨率: ${screen.width}x${screen.height}`);
    info.push(`色深: ${screen.colorDepth}位`);
    
    // 性能信息（如果支持）
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      info.push('', '内存详情:');
      info.push(`已使用: ${usedMB}MB`);
      info.push(`总计: ${totalMB}MB`);
      info.push(`限制: ${limitMB}MB`);
    }
    
    return info.join('\n');
  };
  
  // 处理鼠标移动，更新tooltip位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      const tooltipWidth = 400;
      const tooltipHeight = 300;
      
      let x = e.clientX;
      let y = rect.top - tooltipHeight - 10;
      
      if (x + tooltipWidth > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = rect.bottom + 10;
      }
      
      setTooltipPosition({ x, y });
    }
  };

  return (
    <div 
      ref={componentRef}
      className="status-bar-item system-status"
      onMouseEnter={(e) => {
        setShowTooltip(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {!isOnline && (
        <span className="offline-indicator" title="离线模式">
          📵 离线
        </span>
      )}
      {memoryUsage && memoryUsage > 80 && (
        <span className="memory-warning" title={`内存使用: ${memoryUsage}%`}>
          ⚠️ 内存 {memoryUsage}%
        </span>
      )}
      
      {showTooltip && (
        <div 
          className="custom-tooltip system-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'none'
          }}
        >
          <div className="tooltip-content">
            {getSystemInfo().split('\n').map((line, index) => (
              <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('信息:') ? 'header' : ''} ${line.includes('⚠️') ? 'warning' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 光标位置显示组件
function CursorPositionDisplay() {
  const { fileStatus } = useStatusStore();
  const { line, column } = fileStatus.cursorPosition;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);
  
  // 生成光标位置详细信息
  const generateCursorTooltip = () => {
    const lines = [
      `当前行: ${line}`,
      `当前列: ${column}`,
      `字符偏移: 计算中...`, // 这里可以添加实际的字符偏移计算
    ];
    
    if (fileStatus.selectionCount > 0) {
      lines.push(
        '',
        '选择信息:',
        `选中字符: ${fileStatus.selectionCount}`,
        '选择范围: 多行选择' // 这里可以添加更精确的选择范围信息
      );
    }
    
    lines.push(
      '',
      '导航快捷键:',
      'Ctrl+G - 跳转到行',
      'Ctrl+L - 选择行',
      'Home/End - 行首/行尾'
    );
    
    return lines.join('\n');
  };
  
  // 处理鼠标移动，更新tooltip位置
  const handleMouseMove = (e: React.MouseEvent) => {
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      const tooltipWidth = 250;
      const tooltipHeight = 180;
      
      let x = e.clientX;
      let y = rect.top - tooltipHeight - 10;
      
      if (x + tooltipWidth > window.innerWidth) {
        x = window.innerWidth - tooltipWidth - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (y < 10) {
        y = rect.bottom + 10;
      }
      
      setTooltipPosition({ x, y });
    }
  };

  return (
    <div 
      ref={componentRef}
      className="status-bar-item cursor-position"
      onMouseEnter={(e) => {
        setShowTooltip(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="cursor-info">行 {line}, 列 {column}</span>
      
      {showTooltip && (
        <div 
          className="custom-tooltip cursor-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'none'
          }}
        >
          <div className="tooltip-content">
            {generateCursorTooltip().split('\n').map((line, index) => (
              <div key={index} className={`tooltip-line ${line === '' ? 'empty' : ''} ${line.includes('信息:') || line.includes('快捷键:') ? 'header' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 主状态栏组件
export function StatusBar(): React.ReactElement {
  const { notifications, editorStatus } = useStatusStore();
  const [showFullInfo, setShowFullInfo] = useState(false);

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {/* Markdown相关信息 */}
        {editorStatus.mode === 'markdown' && (
          <>
            <FileStatusDisplay />
            <div className="separator">|</div>
            <EditorStatusDisplay />
            <div className="separator">|</div>
            <CursorPositionDisplay />
          </>
        )}
        
        {/* SolarWire相关信息 */}
        {editorStatus.mode === 'solarwire' && (
          <>
            <FileStatusDisplay />
            <div className="separator">|</div>
            <EditorStatusDisplay />
            <div className="separator">|</div>
            <CursorPositionDisplay />
          </>
        )}
        
        {/* 通用操作状态 */}
        <OperationStatusDisplay />
      </div>
      
      <div className="status-bar-right">
        {/* 编辑器通用信息 */}
        <SystemStatusDisplay />
        <div className="separator">|</div>
        <NotificationDisplay />
      </div>
    </div>
  );
}
