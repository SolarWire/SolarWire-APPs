import React, { useState, useEffect, useCallback } from 'react';
import { ComponentLibrary, Component, normalizeCategoryId } from '../../../shared/types/component';
import MonacoEditor from '../editor/MonacoEditor';
import SolarWireVisualEditor from '../editor/SolarWireVisualEditor';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import { feedback } from '../../stores/feedbackStore';
import './ComponentLibraryComponentEditMode.css';

interface ComponentLibraryComponentEditModeProps {
  library: ComponentLibrary;
  component: Component;
  allLibraries: ComponentLibrary[];
  onUpdate: (updates: Partial<Component>) => void;
  onReorder: (direction: 'top' | 'up' | 'down' | 'bottom') => void;
  onChangeParent: () => void;
  onDelete: () => void;
  onChangeLibrary: (newLibraryId: string, newCategoryId?: string | null) => void;
}

const ComponentLibraryComponentEditMode: React.FC<ComponentLibraryComponentEditModeProps> = ({ 
  library, 
  component, 
  allLibraries,
  onUpdate,
  onReorder,
  onChangeParent,
  onDelete,
  onChangeLibrary
}) => {
  const [activeTab, setActiveTab] = React.useState<'properties' | 'visual' | 'code'>('properties');
  const [componentCode, setComponentCode] = useState(component.code ?? '');
  const [localShowLayerPanel, setLocalShowLayerPanel] = useState(false);
  const [localShowCompLibPanel, setLocalShowCompLibPanel] = useState(false);

  // 本地状态，只在保存时更新
  const [localData, setLocalData] = React.useState({
    name: component.name,
    description: component.description || '',
    categoryId: component.categoryId,
    libraryId: library.metadata.id
  });

  // 当component变化时重置本地状态
  React.useEffect(() => {
    setLocalData({
      name: component.name,
      description: component.description || '',
      categoryId: component.categoryId,
      libraryId: library.metadata.id
    });
  }, [component.internalId, component.name, component.description, component.categoryId, library.metadata.id]);

  const handleSave = () => {
    // 如果组件库改变了，需要调用onChangeLibrary
    if (localData.libraryId !== library.metadata.id) {
      onChangeLibrary(localData.libraryId, localData.categoryId || undefined);
    }
    onUpdate({ 
      name: localData.name,
      description: localData.description,
      categoryId: normalizeCategoryId(localData.categoryId)
    });
    feedback.toast.success('保存成功');
  };

  const handleContentChange = useCallback((code: string) => {
    onUpdate({ code });
  }, [onUpdate]);

  useEffect(() => {
    setComponentCode(component.code ?? '');
  }, [component.internalId, component.code]);

  useEffect(() => {
    if (activeTab !== 'visual') return;
    return () => {
      // Clean up visual editor state if needed
    };
  }, [activeTab]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localData]);

  return (
    <TabProvider activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as 'properties' | 'visual' | 'code')}>
      <div className="edit-panel">
        <TabList className="solarwire-tabs">
          <Tab id="properties" title="属性">
            🔧
          </Tab>
          <Tab id="visual" title="可视化">
            🎨
          </Tab>
          <Tab id="code" title="代码">
            💻
          </Tab>
        </TabList>
        <div className="edit-content">
          <TabPanel id="properties">
            <div className="properties-form">
              <div className="form-group">
                <label>组件名称</label>
                <input 
                  type="text" 
                  value={localData.name} 
                  onChange={(e) => setLocalData({ ...localData, name: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>组件库</label>
                <select 
                  value={localData.libraryId}
                  onChange={(e) => {
                    const newLibraryId = e.target.value;
                    setLocalData({ ...localData, libraryId: newLibraryId, categoryId: null });
                  }}
                >
                  {allLibraries.map((lib) => (
                    <option key={lib.metadata.id} value={lib.metadata.id}>{lib.metadata.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>分类</label>
                <select 
                  value={localData.categoryId || ''} 
                  onChange={(e) => setLocalData({ ...localData, categoryId: e.target.value || null })}
                >
                  <option value="">未分类</option>
                  {allLibraries.find(lib => lib.metadata.id === localData.libraryId)?.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea 
                  value={localData.description} 
                  onChange={(e) => setLocalData({ ...localData, description: e.target.value })} 
                  rows={2} 
                />
              </div>
              <div className="form-group actions">
                <div className="action-group">
                  <button className="btn-compact btn-primary" onClick={handleSave}>
                    <span className="btn-icon">💾</span>
                    <span className="btn-text">保存</span>
                  </button>
                </div>
                <div className="action-group">
                  <button className="btn-compact" onClick={() => {
                    onReorder('top');
                    feedback.toast.success('已置顶');
                  }}>
                    <span className="btn-icon">⬆️</span>
                    <span className="btn-text">置顶</span>
                  </button>
                  <button className="btn-compact" onClick={() => {
                    onReorder('up');
                    feedback.toast.success('已上移');
                  }}>
                    <span className="btn-icon">🔼</span>
                    <span className="btn-text">上移</span>
                  </button>
                  <button className="btn-compact" onClick={() => {
                    onReorder('down');
                    feedback.toast.success('已下移');
                  }}>
                    <span className="btn-icon">🔽</span>
                    <span className="btn-text">下移</span>
                  </button>
                  <button className="btn-compact" onClick={() => {
                    onReorder('bottom');
                    feedback.toast.success('已置底');
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
            </div>
          </TabPanel>
          <TabPanel id="visual">
            <SolarWireVisualEditor
              content={component.code || ''}
              onContentChange={handleContentChange}
              externalContent={component.code}
              onExternalContentChange={handleContentChange}
              showLayerPanel={localShowLayerPanel}
              onShowLayerPanelChange={setLocalShowLayerPanel}
              showComponentLibrary={localShowCompLibPanel}
              onShowComponentLibraryChange={setLocalShowCompLibPanel}
              allowImageElements={false}
              onSwitchToCodeTab={(_line: number, _column: number) => {
                setActiveTab('code');
              }}
            />
          </TabPanel>
          <TabPanel id="code">
            <MonacoEditor
              language="solarwire"
              value={componentCode}
              onChange={(value) => {
                setComponentCode(value);
                onUpdate({ code: value });
              }}
              height="100%"
            />
          </TabPanel>
        </div>
      </div>
    </TabProvider>
  );
};

export default ComponentLibraryComponentEditMode;
