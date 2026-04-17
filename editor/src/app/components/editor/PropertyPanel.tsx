import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { parse } from "../../../lib/parser";
import { updateLineAttribute, updateLineCoords } from '../../../shared/utils/solarwire-utils';
import {
  getLineStartCoords,
  getLineEndCoords
} from '../../../shared/utils/coordinate-converter';
import type { Element } from '../../../lib/parser/types';
import { ColorPicker } from '../ui/ColorPicker';
import { Scrollbar } from '../ui/Scrollbar';
import './PropertyPanel.css';

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ label, children }: PropertyRowProps): JSX.Element {
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

function PropertyPair({ label1, value1, onChange1, label2, value2, onChange2, type = 'number' }: PropertyPairProps): JSX.Element {
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

function PropertyGroupTitle({ children }: PropertyGroupTitleProps): JSX.Element {
  return <div className="property-group-title">{children}</div>;
}

function PropertyPanel(): JSX.Element {
  const { selectedElements } = useSolarWireStore();
  const { content, setContent } = useEditorStore();
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 textarea 高度的函数
  const adjustTextareaHeight = useCallback((textareaRef: HTMLTextAreaElement | null) => {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = `${textareaRef.scrollHeight}px`;
    }
  }, []);

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

  // Early returns after all hooks - but we need useEffect before them
  // Extract note value for the effect hook (must come before early returns)
  const noteValue = useMemo(() => {
    if (!element) return '';
    const el = element as any;
    const attrs = el.attributes || {};
    let note = attrs.note || '';
    if (typeof note === 'string') {
      note = note.replace(/^"""|"""$/g, '');
    }
    return note;
  }, [element]);

  // 当 note 内容变化时调整 textarea 高度
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [noteValue, adjustTextareaHeight]);

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
  const showBorderControls = type !== 'line' && type !== 'text';
  const showLineControls = type === 'line';
  const showAlignControl = type === 'text' || 'text' in element;

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
            <ColorPicker
              label="Fill"
              value={bg}
              onChange={(color) => handleChange('bg', color)}
            />
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
            <PropertyRow label="URL">
              <input
                type="text"
                value={el.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
              />
            </PropertyRow>
          )}

          <div className="note-section">
            <PropertyGroupTitle>Note</PropertyGroupTitle>
            <textarea
              ref={textareaRef}
              value={noteValue}
              placeholder="Add a note..."
              onChange={(e) => {
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
