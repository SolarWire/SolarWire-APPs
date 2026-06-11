import React from 'react';
import { ComponentLibrary, ComponentCategory, isPresetLibrary } from '../../../shared/types/component';
import { TabProvider, TabList, Tab, TabPanel } from '../ui/Tab';
import { feedback } from '../../stores/feedbackStore';
import MonacoEditor from '../editor/MonacoEditor';
import './ComponentLibraryCategoryEditMode.css';

interface ComponentLibraryCategoryEditModeProps {
  library: ComponentLibrary;
  category: ComponentCategory;
  allLibraries: ComponentLibrary[];
  onUpdate: (updates: Partial<ComponentCategory>) => void;
  onCreateComponent: () => void;
  onReorder: (direction: 'top' | 'up' | 'down' | 'bottom') => void;
  onChangeParent: () => void;
  onDelete: () => void;
  onChangeLibrary: (newLibraryId: string) => void;
}

const ComponentLibraryCategoryEditMode: React.FC<ComponentLibraryCategoryEditModeProps> = ({ 
  library, 
  category, 
  allLibraries,
  onUpdate, 
  onCreateComponent,
  onReorder,
  onChangeParent,
  onDelete,
  onChangeLibrary
}) => {
  const [activeTab, setActiveTab] = React.useState<'properties' | 'code'>('properties');
  const componentCount = library.components.filter(c => c.categoryId === category.id).length;
  const isPreset = isPresetLibrary(library.metadata.id);

  // 本地状态，只在保存时更新
  const [localName, setLocalName] = React.useState(category.name);
  const [localLibraryId, setLocalLibraryId] = React.useState(library.metadata.id);

  // 当category变化时重置本地状态
  React.useEffect(() => {
    setLocalName(category.name);
    setLocalLibraryId(library.metadata.id);
  }, [category.id, category.name, library.metadata.id]);

  const handleSave = () => {
    // 如果组件库改变了，需要调用onChangeLibrary
    if (localLibraryId !== library.metadata.id) {
      onChangeLibrary(localLibraryId);
    }
    onUpdate({ name: localName });
    feedback.toast.success('保存成功');
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
  }, [localName]);

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
                <label>分类名称</label>
                <input 
                  type="text" 
                  value={localName} 
                  onChange={(e) => setLocalName(e.target.value)} 
                  disabled={isPreset} 
                />
              </div>
              <div className="form-group">
                <label>组件库</label>
                <select 
                  value={localLibraryId}
                  onChange={(e) => setLocalLibraryId(e.target.value)}
                  disabled={isPreset}
                >
                  {allLibraries.map((lib) => (
                    <option key={lib.metadata.id} value={lib.metadata.id}>{lib.metadata.name}</option>
                  ))}
                </select>
              </div>
              {!isPreset && (
                <div className="form-group actions">
                  <div className="action-group">
                    <button className="btn-compact btn-primary" onClick={handleSave}>
                      <span className="btn-icon">💾</span>
                      <span className="btn-text">保存</span>
                    </button>
                  </div>
                  <div className="action-group">
                    <button className="btn-compact" onClick={() => {
                      onCreateComponent();
                      feedback.toast.info('打开新建组件对话框');
                    }}>
                      <span className="btn-icon">🧩</span>
                      <span className="btn-text">新建组件</span>
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
              )}
            </div>
          </TabPanel>
          <TabPanel id="code">
            <div className="code-editor-area">
              <MonacoEditor
                language="text"
                value={`id: ${category.id}
name: ${category.name}
parentId: ${category.parentId || 'null'}`}
                height="100%"
                onChange={(value) => {
                  if (!isPreset) {
                    try {
                      const lines = value.split('\n');
                      const parsed: any = { ...category };
                      lines.forEach(line => {
                        if (line.includes('name:')) {
                          parsed.name = line.split(':')[1].trim();
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

export default ComponentLibraryCategoryEditMode;
