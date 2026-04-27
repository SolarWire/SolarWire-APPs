import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ComponentLibrary, Component } from '../../../shared/types/component';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { parse } from '../../../lib/parser';
import { render } from '../../../lib/renderer';
import './ComponentEditor.css';

function sanitizeSvg(svg: string): string {
  if (!svg) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    doc.querySelectorAll('script').forEach(s => s.remove());
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
        if (attr.name === 'href' && attr.value.startsWith('javascript:')) el.removeAttribute(attr.name);
      });
    });
    const svgEl = doc.querySelector('svg');
    return svgEl ? svgEl.outerHTML : '';
  } catch {
    return '';
  }
}

interface ComponentEditorProps {
  library: ComponentLibrary;
}

const ComponentEditor: React.FC<ComponentEditorProps> = ({ library }) => {
  const selectedComponentId = useComponentLibraryStore(s => s.selectedComponentId);
  const setSelectedNode = useComponentLibraryStore(s => s.setSelectedNode);
  const updateComponent = useComponentLibraryStore(s => s.updateComponent);
  const deleteComponent = useComponentLibraryStore(s => s.deleteComponent);

  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [componentCode, setComponentCode] = useState('');
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');

  const selectedComponent = library.components.find((c: Component) => c.internalId === selectedComponentId) || null;
  const selectedComponentCode = selectedComponent?.code;
  const selectedComponentName = selectedComponent?.name;
  const selectedComponentDescription = selectedComponent?.description;

  useEffect(() => {
    if (selectedComponent) {
      setComponentCode(selectedComponentCode || '');
      setComponentName(selectedComponentName || '');
      setComponentDescription(selectedComponentDescription || '');
    }
  }, [selectedComponent, selectedComponentCode, selectedComponentName, selectedComponentDescription]);

  const handleSave = async () => {
    if (!selectedComponent) return;
    await updateComponent(library.metadata.id, selectedComponent.internalId, {
      code: componentCode,
      name: componentName,
      description: componentDescription,
    });
  };

  const handleDelete = async () => {
    if (!selectedComponent) return;
    if (confirm('确定要删除此组件吗？')) {
      await deleteComponent(library.metadata.id, selectedComponent.internalId);
      setSelectedNode(null, null, null);
    }
  };

  if (!selectedComponent) {
    return (
      <div className="component-editor-empty">
        <p>请选择一个组件进行编辑</p>
      </div>
    );
  }

  return (
    <div className="component-editor">
      <div className="component-editor-properties">
        <h4 className="component-editor-section-title">组件属性</h4>
        <div className="component-editor-field">
          <label className="component-editor-label">名称</label>
          <input type="text" className="component-editor-input" value={componentName} onChange={(e) => setComponentName(e.target.value)} />
        </div>
        <div className="component-editor-field">
          <label className="component-editor-label">描述</label>
          <textarea className="component-editor-textarea" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} rows={3} />
        </div>
        <div className="component-editor-actions">
          <button className="component-editor-btn-save" onClick={handleSave}>保存</button>
          <button className="component-editor-btn-delete" onClick={handleDelete}>删除</button>
        </div>
      </div>

      <div className="component-editor-content">
        <div className="component-editor-tabs">
          <button className={`component-editor-tab ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => setActiveTab('visual')}>
            🎨 可视化编辑
          </button>
          <button className={`component-editor-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
            💻 代码编辑
          </button>
        </div>

        <div className="component-editor-panel">
          {activeTab === 'visual' && (
            <ComponentVisualEditor code={componentCode} />
          )}
          {activeTab === 'code' && (
            <div className="component-code-editor">
              <textarea
                className="component-code-textarea"
                value={componentCode}
                onChange={(e) => setComponentCode(e.target.value)}
                spellCheck={false}
              />
              <div className="component-code-actions">
                <button className="component-editor-btn-save" onClick={handleSave}>应用代码</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ComponentVisualEditorProps {
  code: string;
}

const ComponentVisualEditor: React.FC<ComponentVisualEditorProps> = ({ code }) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const svgContent = useMemo(() => {
    if (!code.trim()) return '';
    try {
      const ast = parse(code);
      const result = render(ast, undefined, true);
      return result.svg;
    } catch {
      return '';
    }
  }, [code]);

  const sanitizedSvg = useMemo(() => sanitizeSvg(svgContent), [svgContent]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.1, Math.min(5, prev + (e.deltaY > 0 ? -0.05 : 0.05))));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPosition({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div className="component-visual-editor">
      <div
        ref={svgRef}
        className="component-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="component-canvas-content"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: '0 0' }}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      </div>
      <div className="component-canvas-controls">
        <span className="component-canvas-info">缩放: {Math.round(scale * 100)}%</span>
        <span className="component-canvas-info">提示: Alt+拖拽平移画布，滚轮缩放</span>
      </div>
    </div>
  );
};

export default ComponentEditor;
