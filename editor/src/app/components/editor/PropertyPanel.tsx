import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { parse } from "../../../lib/parser";
import { updateLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Element } from '../../../lib/parser/types';
import { ColorPicker } from '../ui/ColorPicker';
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

  const [parseError, setParseError] = React.useState<string | null>(null);

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

  if (parseError) {
    // Extract line number from error message
    const lineMatch = parseError.match(/line (\d+)/);
    const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;

    const handleGoToError = () => {
      // This would need to be implemented with Monaco editor instance
      console.log('Go to error line:', errorLine);
      // In a real implementation, we would use the editor instance to set cursor position
    };

    return (
      <div className="property-panel">
        <div className="error-section">
          <h3>Error</h3>
          <div className="error-message">
            <pre>{parseError}</pre>
          </div>
          {errorLine && (
            <button 
              className="error-button"
              onClick={handleGoToError}
            >
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
    // 线段元素使用start作为起点坐标
    if (el.start.x.type === 'absolute' && el.start.y.type === 'absolute') {
      x = el.start.x.value;
      y = el.start.y.value;
    } else {
      x = parseInt(attrs.x || '0');
      y = parseInt(attrs.y || '0');
    }
  } else {
    // 其他元素使用coordinates
    const coords = el.coordinates;
    if (coords && coords.x.type === 'absolute' && coords.y.type === 'absolute') {
      x = coords.x.value;
      y = coords.y.value;
    } else {
      x = parseInt(attrs.x || '0');
      y = parseInt(attrs.y || '0');
    }
  }

  const text = el.text || '';
  const w = attrs.w || '';
  const h = attrs.h || '';
  const r = attrs.r || '';
  const bg = attrs.bg || '#ffffff';
  const borderColor = attrs.b || '#333333';
  const borderSize = attrs.s || '1';
  const textColor = attrs.c || '#000000';
  const fontSize = attrs.size || attrs['text-size'] || '12';
  const align = attrs.align || 'c';
  const opacity = attrs.opacity || '1';
  // 处理三引号包裹的 note 内容
  let note = attrs.note || '';
  if (typeof note === 'string') {
    // 移除可能的三引号包裹
    note = note.replace(/^"""|"""$/g, '');
  }

  const showSizeControls = type !== 'text' && type !== 'line';
  const showRadiusControl = type === 'rounded-rectangle';
  const showTextControls = 'text' in element || type === 'text';
  const showBorderControls = type !== 'line' && type !== 'text';
  const showLineControls = type === 'line';
  const showAlignControl = type === 'text' || 'text' in element;
  const isTable = type === 'table';

  // 处理线段元素的终点坐标
  let x2 = 0;
  let y2 = 0;
  if (type === 'line' && el.end) {
    if ('x' in el.end && 'y' in el.end) {
      // 绝对坐标格式
      if (el.end.x.type === 'absolute') {
        x2 = el.end.x.value;
      }
      if (el.end.y.type === 'absolute') {
        y2 = el.end.y.value;
      }
    } else if ('dx' in el.end && 'dy' in el.end) {
      // 相对坐标格式
      x2 = x + el.end.dx;
      y2 = y + el.end.dy;
    }
  } else {
    // 回退到属性中的x2和y2
    x2 = parseInt(attrs.x2 || '0');
    y2 = parseInt(attrs.y2 || '0');
  }

  return (
    <div className="property-panel">
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
            <PropertyGroupTitle>Line End</PropertyGroupTitle>
            <PropertyPair
              label1="X2"
              value1={x2}
              onChange1={(v) => handleChange('x2', v)}
              label2="Y2"
              value2={y2}
              onChange2={(v) => handleChange('y2', v)}
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
      </div>

      <div className="note-section">
        <PropertyGroupTitle>Note</PropertyGroupTitle>
        <textarea
          value={note}
          placeholder="Add a note..."
          onChange={(e) => handleChange('note', e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}

export default PropertyPanel;
