import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { parse } from "../../../lib/parser";
import { updateLineAttribute, updateLineCoords } from '../../../shared/utils/solarwire-utils';
import {
  getLineStartCoords,
  getLineEndCoords
} from '../../../shared/utils/coordinate-converter';
import type { Element, Document as SWDocument } from '../../../lib/parser/types';
import { ColorPicker } from '../ui/ColorPicker';
import { Scrollbar } from '../ui/Scrollbar';
import './PropertyPanel.css';

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ label, children }: PropertyRowProps): React.ReactElement {
  return (
    <div className="property-row">
      <div className="property-group">
        <label>{label}</label>
        {children}
      </div>
    </div>
  );
}

interface PropertyPairProps {
  label1: string;
  value1: string | number;
  onChange1: (value: any) => void;
  label2: string;
  value2: string | number;
  onChange2: (value: any) => void;
  type?: 'number' | 'text';
}

function PropertyPair({ label1, value1, onChange1, label2, value2, onChange2, type = 'number' }: PropertyPairProps): React.ReactElement {
  return (
    <div className="property-row">
      <div className="property-group">
        <label>{label1}</label>
        <input
          type={type}
          value={value1}
          onChange={(e) => onChange1(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        />
      </div>
      <div className="property-group">
        <label>{label2}</label>
        <input
          type={type}
          value={value2}
          onChange={(e) => onChange2(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        />
      </div>
    </div>
  );
}

interface PropertyGroupTitleProps {
  children: React.ReactNode;
}

function PropertyGroupTitle({ children }: PropertyGroupTitleProps): React.ReactElement {
  return <div className="property-group-title">{children}</div>;
}

interface BatchEditPanelProps {
  selectedElements: string[];
  content: string;
  setContent: (content: string) => void;
  ast: SWDocument | null;
}

function BatchEditPanel({ selectedElements, content, setContent, ast }: BatchEditPanelProps): React.ReactElement {
  const [batchValues, setBatchValues] = useState({
    dx: '', dy: '', dw: '', dh: '', color: '', bg: '', fontSize: '',
  });

  const applyBatchChange = useCallback((property: string, value: string | number) => {
    if (!ast) return;
    
    let newContent = content;
    
    selectedElements.forEach((elementId) => {
      const lineNum = parseInt(elementId);
      if (isNaN(lineNum)) return;
      
      if (property === 'dx' || property === 'dy') {
        const el = ast.elements.find(e => e.location?.line === lineNum);
        if (!el) return;
        
        const attrs = (el as any).attributes || {};
        const currentX = parseInt(attrs.x || '0');
        const currentY = parseInt(attrs.y || '0');
        const offset = parseInt(value as string) || 0;
        
        if (property === 'dx') {
          newContent = updateLineAttribute(newContent, lineNum, 'x', currentX + offset);
        } else {
          newContent = updateLineAttribute(newContent, lineNum, 'y', currentY + offset);
        }
      } else if (property === 'dw' || property === 'dh') {
        const el = ast.elements.find(e => e.location?.line === lineNum);
        if (!el) return;
        
        const attrs = (el as any).attributes || {};
        const currentW = parseInt(attrs.w || '0');
        const currentH = parseInt(attrs.h || '0');
        const offset = parseInt(value as string) || 0;
        
        if (property === 'dw' && currentW > 0) {
          newContent = updateLineAttribute(newContent, lineNum, 'w', Math.max(10, currentW + offset));
        } else if (property === 'dh' && currentH > 0) {
          newContent = updateLineAttribute(newContent, lineNum, 'h', Math.max(10, currentH + offset));
        }
      } else {
        newContent = updateLineAttribute(newContent, lineNum, property, value);
      }
    });
    
    setContent(newContent);
  }, [ast, content, setContent, selectedElements]);

  return (
    <div className="batch-edit-panel">
      <PropertyGroupTitle>位置偏移</PropertyGroupTitle>
      <div className="property-row">
        <div className="property-group">
          <label>ΔX</label>
          <input
            type="number"
            value={batchValues.dx}
            onChange={(e) => {
              setBatchValues(prev => ({ ...prev, dx: e.target.value }));
              if (e.target.value) applyBatchChange('dx', e.target.value);
            }}
            placeholder="0"
          />
        </div>
        <div className="property-group">
          <label>ΔY</label>
          <input
            type="number"
            value={batchValues.dy}
            onChange={(e) => {
              setBatchValues(prev => ({ ...prev, dy: e.target.value }));
              if (e.target.value) applyBatchChange('dy', e.target.value);
            }}
            placeholder="0"
          />
        </div>
      </div>

      <PropertyGroupTitle>尺寸调整</PropertyGroupTitle>
      <div className="property-row">
        <div className="property-group">
          <label>ΔW</label>
          <input
            type="number"
            value={batchValues.dw}
            onChange={(e) => {
              setBatchValues(prev => ({ ...prev, dw: e.target.value }));
              if (e.target.value) applyBatchChange('dw', e.target.value);
            }}
            placeholder="0"
          />
        </div>
        <div className="property-group">
          <label>ΔH</label>
          <input
            type="number"
            value={batchValues.dh}
            onChange={(e) => {
              setBatchValues(prev => ({ ...prev, dh: e.target.value }));
              if (e.target.value) applyBatchChange('dh', e.target.value);
            }}
            placeholder="0"
          />
        </div>
      </div>

      <PropertyGroupTitle>统一属性</PropertyGroupTitle>
      <ColorPicker
        label="颜色"
        value={batchValues.color || '#000000'}
        onChange={(color) => {
          setBatchValues(prev => ({ ...prev, color }));
          applyBatchChange('c', color);
        }}
      />
      
      <div className="property-row">
        <div className="property-group">
          <label>字号</label>
          <input
            type="number"
            value={batchValues.fontSize}
            onChange={(e) => {
              setBatchValues(prev => ({ ...prev, fontSize: e.target.value }));
              if (e.target.value) applyBatchChange('size', e.target.value);
            }}
            placeholder="12"
          />
        </div>
      </div>
    </div>
  );
}

function PropertyPanel(): React.ReactElement {
  const { selectedElements } = useSolarWireStore();
  const { content, setContent } = useEditorStore();
  const { currentPath } = useFileStore();
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const ast = useMemo(() => {
    try {
      setParseError(null);
      return parse(content || '');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [content]);

  const element = useMemo(() => {
    if (selectedElements.length !== 1) return null;
    const elementId = selectedElements[0];
    return ast?.elements.find((el) => {
      const id = (el as any).id || el.location?.line?.toString();
      return id === elementId;
    }) as Element | undefined;
  }, [ast, selectedElements]);

  const [localNoteValue, setLocalNoteValue] = useState('');
  const elementLineRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const currentElementLine = element?.location?.line;
    if (element && currentElementLine !== elementLineRef.current) {
      elementLineRef.current = currentElementLine;
      const el = element as any;
      const note = el.attributes?.note || '';
      setLocalNoteValue(typeof note === 'string' ? note : '');
    } else if (!element && elementLineRef.current !== undefined) {
      elementLineRef.current = undefined;
      setLocalNoteValue('');
    }
  }, [element]);

  const adjustTextareaHeight = useCallback((textareaEl: HTMLTextAreaElement | null) => {
    if (textareaEl) {
      textareaEl.style.height = 'auto';
      textareaEl.style.height = `${textareaEl.scrollHeight}px`;
    }
  }, []);

  const handleChange = useCallback((property: string, value: any) => {
    if (!element) return;
    const lineNum = element.location?.line;
    if (!lineNum) return;
    const newContent = updateLineAttribute(content, lineNum, property, value);
    setContent(newContent);
  }, [element, content, setContent]);
  
  // 处理线段坐标变化（统一使用绝对坐标）
  const handleLineCoordChange = useCallback((
    handle: 'start' | 'end',
    coord: 'x' | 'y',
    value: number
  ) => {
    if (!element || element.type !== 'line') return;
    const lineNum = element.location?.line;
    if (!lineNum) return;
    
    const lineElement = element as any;
    const startCoords = getLineStartCoords(lineElement);
    const endCoords = getLineEndCoords(lineElement, startCoords);
    
    let newContent: string;
    
    if (handle === 'start') {
      newContent = updateLineCoords(
        content,
        lineNum,
        coord === 'x' ? value : startCoords.x,
        coord === 'y' ? value : startCoords.y,
        endCoords.x,
        endCoords.y
      );
    } else {
      newContent = updateLineCoords(
        content,
        lineNum,
        startCoords.x,
        startCoords.y,
        coord === 'x' ? value : endCoords.x,
        coord === 'y' ? value : endCoords.y
      );
    }
    
    setContent(newContent);
  }, [element, content, setContent]);

  // 当 localNoteValue 变化时调整 textarea 高度
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [localNoteValue, adjustTextareaHeight]);

  // --- Early returns ---
  if (parseError) {
    const lineMatch = parseError.match(/line (\d+)/);
    const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;

    return (
      <div className="property-panel">
        <div className="error-section">
          <h3>Error</h3>
          <div className="error-message">
            <pre>{parseError}</pre>
          </div>
          {errorLine && (
            <button className="error-button">
              Go to Error Line
            </button>
          )}
        </div>
      </div>
    );
  }

  if (selectedElements.length === 0) {
    return (
      <div className="property-panel">
        <p className="empty-state">No element selected</p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="property-panel">
        <h3>Multiple Elements</h3>
        <p>{selectedElements.length} elements selected</p>
      </div>
    );
  }

  if (!element) {
    return (
      <div className="property-panel">
        <p className="empty-state">Element not found</p>
      </div>
    );
  }

  const el = element as any;
  const type = el.type;
  const attrs = el.attributes || {};
  
  let x = 0;
  let y = 0;
  
  if (type === 'line' && el.start) {
    x = el.start.x.type === 'absolute' ? el.start.x.value : (el.start.x.value || 0);
    y = el.start.y.type === 'absolute' ? el.start.y.value : (el.start.y.value || 0);
  } else {
    const coords = el.coordinates;
    if (coords) {
      x = coords.x.type === 'absolute' ? coords.x.value : (coords.x.value || 0);
      y = coords.y.type === 'absolute' ? coords.y.value : (coords.y.value || 0);
    }
  }

  const text = el.text || '';
  const w = attrs.w || '';
  const h = attrs.h || '';
  const r = attrs.r || '';
  const bg = attrs.bg || 'var(--white)';
  const borderColor = attrs.b || 'var(--text-dark)';
  const borderSize = attrs.s || '1';
  const textColor = attrs.c || 'var(--black)';
  const fontSize = attrs.size || attrs['text-size'] || '12';
  const align = attrs.align || 'c';
  const opacity = attrs.opacity || '1';

  // 处理线段元素的终点坐标（统一使用绝对坐标）
  let x2 = 0;
  let y2 = 0;
  if (type === 'line' && el.end) {
    x2 = el.end.x.type === 'absolute' ? el.end.x.value : (el.end.x.value || 0);
    y2 = el.end.y.type === 'absolute' ? el.end.y.value : (el.end.y.value || 0);
  }

  const showSizeControls = type !== 'text' && type !== 'line';
  const showRadiusControl = type === 'rounded-rectangle';
  const showTextControls = 'text' in element || type === 'text';
  const showBorderControls = type !== 'line' && type !== 'text' && type !== 'table';
  const showFillControl = type !== 'line' && type !== 'text' && type !== 'table';
  const showLineControls = type === 'line';
  const showAlignControl = type === 'text' || (type !== 'circle' && 'text' in element);

  return (
    <div className="property-panel">
      <Scrollbar className="property-panel-scrollbar">
        <div className="properties-section">
          <h3>Properties - {type}</h3>
          
          <PropertyGroupTitle>Position</PropertyGroupTitle>
          <PropertyPair
            label1="X"
            value1={x}
            onChange1={(v) => handleChange('x', v)}
            label2="Y"
            value2={y}
            onChange2={(v) => handleChange('y', v)}
          />

          {showSizeControls && (
            <>
              <PropertyGroupTitle>Size</PropertyGroupTitle>
              <PropertyPair
                label1="Width"
                value1={w}
                onChange1={(v) => handleChange('w', v)}
                label2="Height"
                value2={h}
                onChange2={(v) => handleChange('h', v)}
              />
            </>
          )}

          {showRadiusControl && (
            <PropertyRow label="Corner Radius">
              <input
                type="number"
                value={r}
                onChange={(e) => handleChange('r', parseInt(e.target.value) || 0)}
              />
            </PropertyRow>
          )}

          {showLineControls && (
            <>
              <PropertyGroupTitle>起点 Position</PropertyGroupTitle>
              <PropertyPair
                label1="X"
                value1={x}
                onChange1={(v) => handleLineCoordChange('start', 'x', v)}
                label2="Y"
                value2={y}
                onChange2={(v) => handleLineCoordChange('start', 'y', v)}
              />
              
              <PropertyGroupTitle>终点 Position</PropertyGroupTitle>
              <PropertyPair
                label1="X2"
                value1={x2}
                onChange1={(v) => handleLineCoordChange('end', 'x', v)}
                label2="Y2"
                value2={y2}
                onChange2={(v) => handleLineCoordChange('end', 'y', v)}
              />
              <PropertyRow label="Style">
                <select
                  value={attrs.style || 'solid'}
                  onChange={(e) => handleChange('style', e.target.value)}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </PropertyRow>
              {el.label !== undefined && (
                <PropertyRow label="Label">
                  <input
                    type="text"
                    value={el.label || ''}
                    onChange={(e) => handleChange('label', e.target.value)}
                  />
                </PropertyRow>
              )}
            </>
          )}

          <PropertyGroupTitle>Appearance</PropertyGroupTitle>
          <div className="property-row">
            {type === 'line' ? (
              <ColorPicker
                label="Color"
                value={textColor}
                onChange={(color) => handleChange('c', color)}
              />
            ) : showFillControl && (
              <ColorPicker
                label="Fill"
                value={bg}
                onChange={(color) => handleChange('bg', color)}
              />
            )}
            {showBorderControls && (
              <ColorPicker
                label="Border"
                value={borderColor}
                onChange={(color) => handleChange('b', color)}
              />
            )}
          </div>
          
          {showBorderControls && (
            <PropertyRow label="Border Width">
              <input
                type="number"
                value={borderSize}
                onChange={(e) => handleChange('s', parseInt(e.target.value) || 1)}
              />
            </PropertyRow>
          )}

          {!showLineControls && (
            <PropertyRow label="Opacity">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
              />
            </PropertyRow>
          )}

          {showTextControls && (
            <>
              <PropertyGroupTitle>Text</PropertyGroupTitle>
              {'text' in element && (
                <PropertyRow label="Content">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleChange('text', e.target.value)}
                  />
                </PropertyRow>
              )}
              <div className="property-row">
                <ColorPicker
                  label="Color"
                  value={textColor}
                  onChange={(color) => handleChange('c', color)}
                />
                <div className="property-group">
                  <label>Size</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => handleChange('size', parseInt(e.target.value) || 12)}
                  />
                </div>
              </div>
              {showAlignControl && (
                <PropertyRow label="Align">
                  <select
                    value={align}
                    onChange={(e) => handleChange('align', e.target.value)}
                  >
                    <option value="l">Left</option>
                    <option value="c">Center</option>
                    <option value="r">Right</option>
                  </select>
                </PropertyRow>
              )}
              <div className="property-row checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={attrs.bold === true || attrs.bold === 'true'}
                    onChange={(e) => handleChange('bold', e.target.checked)}
                  />
                  Bold
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={attrs.italic === true || attrs.italic === 'true'}
                    onChange={(e) => handleChange('italic', e.target.checked)}
                  />
                  Italic
                </label>
              </div>
            </>
          )}

          {type === 'text' && (
            <PropertyRow label="Line Height">
              <input
                type="number"
                value={attrs['line-height'] || '22'}
                onChange={(e) => handleChange('line-height', parseInt(e.target.value) || 22)}
              />
            </PropertyRow>
          )}

          {type === 'image' && (
            <PropertyRow label="Image Path">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={el.url || ''}
                  onChange={(e) => handleChange('url', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => {
                    if (!currentPath) {
                      alert('Please open a folder first');
                      return;
                    }
                    imageFileInputRef.current?.click();
                  }}
                  title="Select image from project"
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                >
                  📁
                </button>
              </div>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !currentPath) return;

                  try {
                    const api = (window as any).api;
                    if (!api || !api.ensureDir || !api.copyFile) {
                      alert('File API not available');
                      return;
                    }

                    const assetsDir = `${currentPath}/assets/images`;
                    await api.ensureDir(assetsDir);

                    const timestamp = Date.now();
                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const destPath = `${assetsDir}/${timestamp}_${sanitizedName}`;

                    const electronFile = file as File & { path?: string };
                    if (electronFile.path) {
                      await api.copyFile(electronFile.path, destPath);
                    } else {
                      await api.writeFile(destPath, await file.arrayBuffer());
                    }

                    const relativePath = `assets/images/${timestamp}_${sanitizedName}`;
                    handleChange('url', relativePath);
                  } catch (err) {
                    console.error('Failed to copy image:', err);
                    alert('Failed to copy image');
                  }

                  e.target.value = '';
                }}
              />
            </PropertyRow>
          )}

          <div className="note-section">
            <PropertyGroupTitle>Note</PropertyGroupTitle>
            <textarea
              ref={textareaRef}
              value={localNoteValue}
              placeholder="Add a note..."
              onChange={(e) => {
                setLocalNoteValue(e.target.value);
                handleChange('note', e.target.value);
                adjustTextareaHeight(textareaRef.current);
              }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </Scrollbar>
    </div>
  );
}

export default PropertyPanel;
