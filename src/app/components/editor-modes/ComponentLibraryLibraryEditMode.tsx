import React from 'react';
import { ComponentLibrary, isPresetLibrary } from '../../../shared/types/component';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import { showToast } from '../../services/toast-service';
import MonacoEditor from '../editor/MonacoEditor';
import { componentLibraryManager } from '../../services/ComponentLibraryManager';
import './ComponentLibraryLibraryEditMode.css';

interface ComponentLibraryLibraryEditModeProps {
  library: ComponentLibrary;
  onUpdate: (updates: Partial<ComponentLibrary>) => void;
  onCreateCategory: () => void;
  onCreateComponent: () => void;
  onReorder: (direction: 'top' | 'up' | 'down' | 'bottom') => void;
  onDelete: () => void;
}

const ComponentLibraryLibraryEditMode: React.FC<ComponentLibraryLibraryEditModeProps> = ({ 
  library, 
  onUpdate,
  onCreateCategory,
  onCreateComponent,
  onReorder,
  onDelete
}) => {
  const [activeTab, setActiveTab] = React.useState<'properties' | 'code'>('properties');
  const isPreset = isPresetLibrary(library.metadata.id);

  // 本地状态，只在保存时更新
  const [localMetadata, setLocalMetadata] = React.useState({
    name: library.metadata.name,
    description: library.metadata.description || '',
    version: library.metadata.version,
    author: library.metadata.author || ''
  });

  // 当library变化时重置本地状态
  React.useEffect(() => {
    setLocalMetadata({
      name: library.metadata.name,
      description: library.metadata.description || '',
      version: library.metadata.version,
      author: library.metadata.author || ''
    });
  }, [library.metadata.id, library.metadata.name, library.metadata.description, library.metadata.version, library.metadata.author]);

  const handleSave = () => {
    onUpdate({ metadata: { ...library.metadata, ...localMetadata } });
    showToast('保存成功', 'success');
  };

  const handleExport = () => {
    try {
      componentLibraryManager.exportLibrary(library.metadata.id);
      showToast('组件库导出成功', 'success');
    } catch (error) {
      showToast('导出失败: ' + (error as Error).message, 'error');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localMetadata]);

  return (
    <TabProvider activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as 'properties' | 'code')}>
      <div className="edit-panel">
        <TabList className="solarwire-tabs">
          <Tab id="properties" title="属性">
            📋
          </Tab>
          <Tab id="code" title="代码">
            📝
          </Tab>
        </TabList>
        <div className="edit-content">
          <TabPanel id="properties">
            <div className="properties-form">
              <div className="form-group">
                <label>组件库名称</label>
                <input 
                  type="text" 
                  value={localMetadata.name} 
                  onChange={(e) => setLocalMetadata({ ...localMetadata, name: e.target.value })} 
                  disabled={isPreset} 
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea 
                  value={localMetadata.description} 
                  onChange={(e) => setLocalMetadata({ ...localMetadata, description: e.target.value })} 
                  rows={3} 
                  disabled={isPreset} 
                />
              </div>
              <div className="form-group">
                <label>版本</label>
                <input 
                  type="text" 
                  value={localMetadata.version} 
                  onChange={(e) => setLocalMetadata({ ...localMetadata, version: e.target.value })} 
                  disabled={isPreset} 
                />
              </div>
              <div className="form-group">
                <label>作者</label>
                <input 
                  type="text" 
                  value={localMetadata.author} 
                  onChange={(e) => setLocalMetadata({ ...localMetadata, author: e.target.value })} 
                  disabled={isPreset} 
                />
              </div>
              <div className="form-group">
                <label>$schema</label>
                <span className="readonly-value">{library.$schema}</span>
              </div>
              {isPreset && (
                <div className="form-group">
                  <label>类型</label>
                  <span className="readonly-value" style={{color:'#e67e22'}}>预设组件库（只读）</span>
                </div>
              )}
              {!isPreset && (
                <div className="form-group actions">
                  <div className="action-group">
                    <button className="btn-compact btn-primary" onClick={handleSave}>
                      <span className="btn-icon">💾</span>
                      <span className="btn-text">保存</span>
                    </button>
                    <button className="btn-compact" onClick={handleExport}>
                      <span className="btn-icon">📤</span>
                      <span className="btn-text">导出</span>
                    </button>
                  </div>
                  <div className="action-group">
                    <button className="btn-compact" onClick={() => {
                      onCreateCategory();
                      showToast('打开新建分类对话框', 'info');
                    }}>
                      <span className="btn-icon">📁</span>
                      <span className="btn-text">新建分类</span>
                    </button>
                    <button className="btn-compact" onClick={() => {
                      onCreateComponent();
                      showToast('打开新建组件对话框', 'info');
                    }}>
                      <span className="btn-icon">🧩</span>
                      <span className="btn-text">新建组件</span>
                    </button>
                  </div>
                  <div className="action-group">
                    <button className="btn-compact" onClick={() => {
                      onReorder('top');
                      showToast('已置顶', 'success');
                    }}>
                      <span className="btn-icon">⬆️</span>
                      <span className="btn-text">置顶</span>
                    </button>
                    <button className="btn-compact" onClick={() => {
                      onReorder('up');
                      showToast('已上移', 'success');
                    }}>
                      <span className="btn-icon">🔼</span>
                      <span className="btn-text">上移</span>
                    </button>
                    <button className="btn-compact" onClick={() => {
                      onReorder('down');
                      showToast('已下移', 'success');
                    }}>
                      <span className="btn-icon">🔽</span>
                      <span className="btn-text">下移</span>
                    </button>
                    <button className="btn-compact" onClick={() => {
                      onReorder('bottom');
                      showToast('已置底', 'success');
                    }}>
                      <span className="btn-icon">⬇️</span>
                      <span className="btn-text">置底</span>
                    </button>
                  </div>
                  <div className="action-group">
                    <button className="btn-compact btn-danger" onClick={onDelete}>
                      <span className="btn-icon">🗑️</span>
                      <span className="btn-text">删除</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
          <TabPanel id="code">
            <div className="code-editor-area">
              <MonacoEditor
                language="text"
                value={`id: ${library.metadata.id}
$schema: ${library.$schema}
name: ${library.metadata.name}
description: ${library.metadata.description || ''}
version: ${library.metadata.version}
author: ${library.metadata.author || ''}
createdAt: ${library.metadata.createdAt}
updatedAt: ${library.metadata.updatedAt}`}
                height="100%"
                onChange={(value) => {
                  if (!isPreset) {
                    // Parse text format back to library object
                    try {
                      const lines = value.split('\n');
                      const parsed: any = { ...library };
                      lines.forEach(line => {
                        if (line.includes('id:')) {
                          parsed.metadata = { ...parsed.metadata, id: line.split(':')[1].trim() };
                        }
                      });
                      onUpdate(parsed);
                    } catch (e) {
                      // Ignore parse errors during typing
                    }
                  }
                }}
              />
            </div>
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
};

export default ComponentLibraryLibraryEditMode;
