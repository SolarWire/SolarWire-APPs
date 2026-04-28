import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAppStore } from '../../stores/appStore';
import { parse } from '../../../lib/parser';
import { updateLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Element } from '../../../lib/parser/types';
import { ColorPicker } from './ColorPicker';
import { fileDialogService, IFileDialogService } from '../../services/file-dialog-service';
import { showToast } from '../../services/toast-service';
import './PropertyPanel.css';

/**
 * 属性行组件属性接口
 */
interface PropertyRowProps {
  /** 属性标签 */
  label: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 属性行组件
 * 用于显示单个属性的标签和输入控件
 */
function PropertyRow({ label, children }: PropertyRowProps): React.JSX.Element {
  return (
    <div className="property-row">
      <div className="property-group">
        <label>{label}</label>
        {children}
      </div>
    </div>
  );
}

/**
 * 属性对组件属性接口
 */
interface PropertyPairProps {
  /** 第一个属性标签 */
  label1: string;
  /** 第一个属性值 */
  value1: string | number;
  /** 第一个属性变化回调 */
  onChange1: (value: any) => void;
  /** 第二个属性标签 */
  label2: string;
  /** 第二个属性值 */
  value2: string | number;
  /** 第二个属性变化回调 */
  onChange2: (value: any) => void;
  /** 输入类型 */
  type?: 'number' | 'text';
}

/**
 * 属性对组件
 * 用于显示两个并排的属性输入框
 */
function PropertyPair({ label1, value1, onChange1, label2, value2, onChange2, type = 'number' }: PropertyPairProps): React.JSX.Element {
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

/**
 * 属性组标题组件属性接口
 */
interface PropertyGroupTitleProps {
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 属性组标题组件
 * 用于显示属性组的标题
 */
function PropertyGroupTitle({ children }: PropertyGroupTitleProps): React.JSX.Element {
  return <div className="property-group-title">{children}</div>;
}

/**
 * 属性面板组件属性接口
 */
interface PropertyPanelProps {
  /** 外部内容（用于组件编辑模式） */
  externalContent?: string;
  /** 外部内容变化回调 */
  onExternalContentChange?: (content: string) => void;
  /** 文件对话框服务 */
  fileDialogService?: IFileDialogService;
  /** 错误行点击回调 */
  onErrorLineClick?: (line: number) => void;
}

/**
 * 属性面板组件
 * 用于编辑选中元素的属性
 */
function PropertyPanel({ externalContent, onExternalContentChange, fileDialogService: dialogService = fileDialogService, onErrorLineClick }: PropertyPanelProps): React.JSX.Element {
  // 选中的元素 ID 列表
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  // 编辑器内容和设置内容的方法
  const { content, setContent } = useEditorStore();
  // 主题
  const { theme } = useAppStore();

  // 判断是否为外部模式（组件编辑模式）
  const isExternalMode = externalContent !== undefined;
  
  // 在外部模式下，确保有有效的默认内容
  const safeContent = useMemo(() => {
    if (isExternalMode && externalContent) return externalContent;
    return content || '';
  }, [isExternalMode, externalContent, content]);
  // 有效内容（外部模式使用外部内容，否则使用编辑器内容）
  const effectiveContent = isExternalMode ? externalContent : content;
  // 有效内容设置方法
  const effectiveSetContent = isExternalMode ? (c: string) => onExternalContentChange?.(c) : setContent;

  // 解析错误状态
  const [parseError, setParseError] = React.useState<string | null>(null);

  /**
   * 解析内容为 AST
   */
  const ast = useMemo(() => {
    try {
      setParseError(null);
      return parse(safeContent || '');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [safeContent]);

  /**
   * 获取当前选中的元素
   */
  const element = useMemo(() => {
    if (selectedElements.length !== 1) return null;
    const elementId = selectedElements[0];
    return ast?.elements.find((el, index) => {
      const id = (el as Element & { id?: string }).id || el.location?.line?.toString() || (index + 1).toString();
      return id === elementId;
    });
  }, [ast, selectedElements]);

  /**
   * 处理属性变化
   * @param property 属性名
   * @param value 属性值
   */
  const handleChange = useCallback((property: string, value: string | number | boolean) => {
    if (!element) return;
    const lineNum = element.location?.line;
    if (!lineNum) return;
    const newContent = updateLineAttribute(safeContent, lineNum, property, value);
    effectiveSetContent(newContent);
  }, [element, safeContent, effectiveSetContent]);

  // 提前声明所有需要的hooks，确保在条件返回之前调用
  const [noteValue, setNoteValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { noteTextareaHeight, setNoteTextareaHeight } = useSettingsStore();

  // 处理解析错误
  const handleGoToError = useCallback(() => {
    if (parseError) {
      const lineMatch = parseError.match(/line (\d+)/);
      const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;
      if (errorLine && onErrorLineClick) {
        onErrorLineClick(errorLine);
      }
    }
  }, [parseError, onErrorLineClick]);

  // 提前声明所有其他hooks，确保在条件返回之前调用
  // 这些hooks暂时不依赖条件变量，会在条件检查后重新计算

  const handleNoteResize = useCallback(() => {
    if (noteTextareaRef.current) {
      setNoteTextareaHeight(noteTextareaRef.current.offsetHeight);
    }
  }, []);

  const handleTextResize = useCallback(() => {
    if (textTextareaRef.current) {
      setNoteTextareaHeight(textTextareaRef.current.offsetHeight);
    }
  }, []);

  /**
   * 通用的 textarea resize 处理函数
   * 避免代码重复
   */
  const createResizeHandler = useCallback((textareaRef: React.RefObject<HTMLTextAreaElement | null>, onResize: () => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const textarea = textareaRef.current;
      if (!textarea) return;
      const startHeight = textarea.offsetHeight;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - startY;
        const newHeight = Math.max(60, Math.min(500, startHeight + delta));
        textarea.style.height = `${newHeight}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onResize();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleNoteResizeStart = createResizeHandler(noteTextareaRef, handleNoteResize);
  const handleTextResizeStart = createResizeHandler(textTextareaRef, handleTextResize);

  // 计算元素属性 - 只在element存在时计算
  const elementProps = useMemo(() => {
    if (!element) return null;

    const el = element as Element & { 
      type: string;
      attributes?: Record<string, unknown>;
      coordinates?: { x: { type: string; value: number }; y: { type: string; value: number } };
      start?: { x: { type: string; value: number }; y: { type: string; value: number } };
      end?: { type: string; x?: { type: string; value: number }; y?: { type: string; value: number }; dx?: number; dy?: number };
      label?: string;
      url?: string;
      text?: string;
    };
    const type = el.type;
    const attrs = (el.attributes || {}) as Record<string, string>;
    
    let x = 0;
    let y = 0;
    
    if (type === 'line') {
      if (el.start && el.start.x && el.start.y) {
        if (el.start.x.type === 'absolute') {
          x = el.start.x.value;
        } else {
          x = parseInt(attrs.x || '0');
        }
        if (el.start.y.type === 'absolute') {
          y = el.start.y.value;
        } else {
          y = parseInt(attrs.y || '0');
        }
      } else {
        x = parseInt(attrs.x || '0');
        y = parseInt(attrs.y || '0');
      }
    } else {
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
    let note = attrs.note || '';
    if (typeof note === 'string') {
      note = note.replace(/^"""|"""$/g, '');
    }

    const showSizeControls = type !== 'text' && type !== 'line';
    const showRadiusControl = type === 'rectangle';
    const showTextControls = 'text' in element || type === 'text';
    const showBorderControls = type !== 'line' && type !== 'text';
    const showLineControls = type === 'line';
    const showAlignControl = type === 'text' || 'text' in element;

    const isTable = type === 'table';
    const isMultilineText = text.startsWith('"""') && text.endsWith('"""');
    let textContent = text;
    if (isMultilineText) {
      textContent = text.replace(/^"""|"""$/g, '');
    }

    return {
      type, attrs, x, y, text, w, h, r, bg, borderColor, borderSize,
      textColor, fontSize, align, opacity, note, showSizeControls,
      showRadiusControl, showTextControls, showBorderControls,
      showLineControls, showAlignControl, isTable, isMultilineText, textContent,
      end: el.end, label: el.label, url: el.url
    };
  }, [element]);

  // 同步note和text值到state
  useEffect(() => {
    if (elementProps?.note !== undefined && elementProps.note !== noteValue) {
      setNoteValue(elementProps.note);
    }
  }, [elementProps?.note, noteValue]);

  useEffect(() => {
    if (elementProps?.textContent !== undefined && elementProps.textContent !== textValue) {
      setTextValue(elementProps.textContent);
    }
  }, [elementProps?.textContent, textValue]);

  // 使用条件渲染而不是提前返回，确保所有渲染路径都调用相同数量的hooks
  const lineMatch = parseError ? parseError.match(/line (\d+)/) : null;
  const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;

  if (parseError) {
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

  if (!element || !elementProps) {
    return (
      <div className="property-panel">
        <p className="empty-state">Element not found</p>
      </div>
    );
  }

  const { type, x, y, w, h, r, bg, borderColor, borderSize, textColor, fontSize, align, opacity,
    showSizeControls, showRadiusControl, showTextControls, showBorderControls,
    showLineControls, showAlignControl, isMultilineText, attrs, text, end, label, url } = elementProps;

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
              value1={end?.type === 'relative' ? (end?.dx ?? '') : (end?.x?.type === 'absolute' ? end.x.value : '')}
              onChange1={(v) => handleChange('x2', v)}
              label2="Y2"
              value2={end?.type === 'relative' ? (end?.dy ?? '') : (end?.y?.type === 'absolute' ? end.y.value : '')}
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
            {label !== undefined && (
              <PropertyRow label="Label">
                <input
                  type="text"
                  value={label || ''}
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

        <PropertyGroupTitle>Shadow</PropertyGroupTitle>
        <PropertyPair
          label1="X"
          value1={attrs['shadow-x'] || ''}
          onChange1={(v) => handleChange('shadow-x', v)}
          label2="Y"
          value2={attrs['shadow-y'] || ''}
          onChange2={(v) => handleChange('shadow-y', v)}
        />
        <PropertyRow label="Blur">
          <input
            type="number"
            value={attrs['shadow-blur'] || ''}
            onChange={(e) => handleChange('shadow-blur', parseInt(e.target.value) || 0)}
          />
        </PropertyRow>
        <PropertyRow label="Color">
          <ColorPicker
            label="Shadow Color"
            value={attrs['shadow-color'] || '#000000'}
            onChange={(color) => handleChange('shadow-color', color)}
          />
        </PropertyRow>

        {showTextControls && (
          <>
            <PropertyGroupTitle>Text</PropertyGroupTitle>
            {'text' in element && (
              <PropertyRow label="Content">
                {isMultilineText ? (
                  <div className="note-textarea-wrapper">
                    <textarea
                      ref={textTextareaRef}
                      value={textValue}
                      placeholder="Enter text content..."
                      onChange={(e) => setTextValue(e.target.value)}
                      onBlur={() => handleChange('text', `"""${textValue}"""`)}
                      onMouseUp={handleTextResize}
                      style={{
                        whiteSpace: 'pre-wrap',
                        height: noteTextareaHeight,
                        minHeight: 60,
                        maxHeight: 500
                      }}
                    />
                    <div
                      className="note-resize-handle"
                      onMouseDown={handleTextResizeStart}
                    ></div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => handleChange('text', e.target.value)}
                  />
                )}
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
                  checked={String(attrs.bold) === 'true'}
                  onChange={(e) => handleChange('bold', e.target.checked)}
                />
                Bold
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={String(attrs.italic) === 'true'}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={async () => {
                  try {
                    const filePaths = await dialogService.openFileDialog({
                      properties: ['openFile'],
                      filters: [
                        { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] },
                        { name: 'All Files', extensions: ['*'] }
                      ]
                    });
                    if (filePaths && filePaths.length > 0) {
                      handleChange('url', filePaths[0]);
                    }
                  } catch (error) {
                    console.error('Error opening file dialog:', error);
                    showToast('Failed to open file dialog', 'error');
                  }
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: theme === 'dark' ? '#fff' : '#333'
                }}
              >
                Browse
              </button>
            </div>
          </PropertyRow>
        )}
      </div>

      <div className="note-section">
        <PropertyGroupTitle>Note</PropertyGroupTitle>
        <div className="note-textarea-wrapper">
          <textarea
            ref={noteTextareaRef}
            value={noteValue}
            placeholder="Add a note..."
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={() => handleChange('note', noteValue)}
            onMouseUp={handleNoteResize}
            style={{
              whiteSpace: 'pre-wrap',
              height: noteTextareaHeight,
              minHeight: 60,
              maxHeight: 500
            }}
          />
          <div
            className="note-resize-handle"
            onMouseDown={handleNoteResizeStart}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default PropertyPanel;
