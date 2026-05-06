import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAppStore } from '../../stores/appStore';
import { parse } from '../../../lib/parser';
import { updateLineAttribute, deleteLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Element } from '../../../lib/parser/types';
import ColorPicker from '../ui/ColorPicker';
import PropertyRow, { PropertyPair, DraggableNumberInput } from './property/PropertyRow';
import PropertyGroupTitle from './property/PropertyGroupTitle';
import ShadowEditor from './property/ShadowEditor';
import { fileDialogService, IFileDialogService } from '../../services/file-dialog-service';
import { feedback } from '../../stores/feedbackStore';
import './PropertyPanel.css';

interface PropertyPanelProps {
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  fileDialogService?: IFileDialogService;
  onErrorLineClick?: (line: number) => void;
}

function PropertyPanel({ externalContent, onExternalContentChange, fileDialogService: dialogService = fileDialogService, onErrorLineClick }: PropertyPanelProps): React.JSX.Element {
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const { content, setContent } = useEditorStore();
  const { theme } = useAppStore();

  const isExternalMode = externalContent !== undefined;

  const safeContent = useMemo(() => {
    if (isExternalMode && externalContent) return externalContent;
    return content || '';
  }, [isExternalMode, externalContent, content]);
  const effectiveContent = isExternalMode ? externalContent : content;
  const effectiveSetContent = isExternalMode ? (c: string) => onExternalContentChange?.(c) : setContent;

  const [parseError, setParseError] = React.useState<string | null>(null);

  const ast = useMemo(() => {
    try {
      setParseError(null);
      return parse(safeContent || '');
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [safeContent]);

  const element = useMemo(() => {
    if (selectedElements.length !== 1) return null;
    const elementId = selectedElements[0];
    return ast?.elements.find((el, index) => {
      const id = (el as Element & { id?: string }).id || el.location?.line?.toString() || (index + 1).toString();
      return id === elementId;
    });
  }, [ast, selectedElements]);

  const handleChange = useCallback((property: string, value: string | number | boolean | undefined) => {
    if (!element) return;
    const lineNum = element.location?.line;
    if (!lineNum) return;
    if (value === undefined) {
      const newContent = deleteLineAttribute(safeContent, lineNum, property);
      effectiveSetContent(newContent);
    } else {
      const newContent = updateLineAttribute(safeContent, lineNum, property, value);
      effectiveSetContent(newContent);
    }
  }, [element, safeContent, effectiveSetContent]);

  const [noteValue, setNoteValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { noteTextareaHeight, setNoteTextareaHeight, textTextareaHeight, setTextTextareaHeight } = useSettingsStore();

  const handleGoToError = useCallback(() => {
    if (parseError) {
      const lineMatch = parseError.match(/line (\d+)/);
      const errorLine = lineMatch ? parseInt(lineMatch[1]) : null;
      if (errorLine && onErrorLineClick) {
        onErrorLineClick(errorLine);
      }
    }
  }, [parseError, onErrorLineClick]);

  const handleNoteResize = useCallback(() => {
    if (noteTextareaRef.current) {
      setNoteTextareaHeight(noteTextareaRef.current.offsetHeight);
    }
  }, []);

  const handleTextResize = useCallback(() => {
    if (textTextareaRef.current) {
      setTextTextareaHeight(textTextareaRef.current.offsetHeight);
    }
  }, []);

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

  useEffect(() => {
    if (elementProps?.note !== undefined && elementProps.note !== noteValue) {
      setNoteValue(elementProps.note);
      setNoteTextareaHeight(60);
    }
  }, [elementProps?.note]);

  useEffect(() => {
    if (elementProps?.textContent !== undefined && elementProps.textContent !== textValue) {
      setTextValue(elementProps.textContent);
      setTextTextareaHeight(60);
    }
  }, [elementProps?.textContent]);

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
      <div className="property-panel-header">
        <span className="property-panel-type">{type}</span>
      </div>

      <PropertyGroupTitle title="Position">
        <PropertyPair
          label1="X"
          value1={x}
          onChange1={(v) => handleChange('x', v)}
          label2="Y"
          value2={y}
          onChange2={(v) => handleChange('y', v)}
        />
      </PropertyGroupTitle>

      {showSizeControls && (
        <PropertyGroupTitle title="Size">
          <PropertyPair
            label1="W"
            value1={w}
            onChange1={(v) => handleChange('w', v)}
            label2="H"
            value2={h}
            onChange2={(v) => handleChange('h', v)}
          />
          {showRadiusControl && (
            <PropertyRow label="R">
              <DraggableNumberInput
                label=""
                value={r}
                onChange={(v) => handleChange('r', v)}
              />
            </PropertyRow>
          )}
        </PropertyGroupTitle>
      )}

      {showLineControls && (
        <PropertyGroupTitle title="Line End">
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
        </PropertyGroupTitle>
      )}

      <PropertyGroupTitle title="Appearance">
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
          <PropertyRow label="Width">
            <DraggableNumberInput
              label=""
              value={borderSize}
              onChange={(v) => handleChange('s', v)}
            />
          </PropertyRow>
        )}
        {!showLineControls && (
          <PropertyRow label="Opacity">
            <div className="opacity-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
              />
              <input
                type="number"
                className="opacity-number"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleChange('opacity', parseFloat(e.target.value) || 0)}
              />
            </div>
          </PropertyRow>
        )}
      </PropertyGroupTitle>

      <PropertyGroupTitle title="Shadow" defaultCollapsed={true}>
        <ShadowEditor attrs={attrs} onChange={handleChange} />
      </PropertyGroupTitle>

      {showTextControls && (
        <PropertyGroupTitle title="Text">
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
                      height: textTextareaHeight,
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
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onBlur={() => handleChange('text', textValue)}
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
            <div className="property-drag-input">
              <span className="property-drag-label" onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startVal = parseInt(fontSize) || 12;
                const onMove = (me: MouseEvent) => {
                  const delta = me.clientX - startX;
                  const sens = me.shiftKey ? 10 : 1;
                  handleChange('size', Math.max(1, Math.round(startVal + delta * sens)));
                };
                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                  document.body.style.cursor = '';
                  document.body.style.userSelect = '';
                };
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}>Size</span>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => handleChange('size', parseInt(e.target.value) || 12)}
              />
            </div>
          </div>
          {showAlignControl && (
            <PropertyRow label="Align">
              <div className="align-buttons">
                <button
                  className={`align-btn${align === 'l' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'l')}
                  title="Left"
                >≡</button>
                <button
                  className={`align-btn${align === 'c' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'c')}
                  title="Center"
                >≡</button>
                <button
                  className={`align-btn${align === 'r' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'r')}
                  title="Right"
                >≡</button>
              </div>
            </PropertyRow>
          )}
          <div className="property-row toggle-row">
            <button
              className={`toggle-btn${String(attrs.bold) === 'true' ? ' active' : ''}`}
              onClick={() => handleChange('bold', String(attrs.bold) === 'true' ? false : true)}
              title="Bold"
            ><b>B</b></button>
            <button
              className={`toggle-btn${String(attrs.italic) === 'true' ? ' active' : ''}`}
              onClick={() => handleChange('italic', String(attrs.italic) === 'true' ? false : true)}
              title="Italic"
            ><i>I</i></button>
          </div>
        </PropertyGroupTitle>
      )}

      {type === 'text' && (
        <PropertyRow label="Line Height">
          <DraggableNumberInput
            label=""
            value={attrs['line-height'] || '22'}
            onChange={(v) => handleChange('line-height', v)}
          />
        </PropertyRow>
      )}

      {type === 'image' && (
        <PropertyGroupTitle title="Image">
          <PropertyRow label="URL">
            <div className="image-url-row">
              <input
                type="text"
                className="image-url-input"
                value={url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
              />
              <button
                className="image-browse-btn"
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
                    feedback.toast.error('Failed to open file dialog');
                  }
                }}
              >
                ...
              </button>
            </div>
          </PropertyRow>
        </PropertyGroupTitle>
      )}

      <PropertyGroupTitle title="Note" defaultCollapsed={true}>
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
      </PropertyGroupTitle>
    </div>
  );
}

export default PropertyPanel;
