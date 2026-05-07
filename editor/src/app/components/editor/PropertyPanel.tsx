import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useAppStore } from '../../stores/appStore';
import { parse } from '../../../lib/parser';
import { updateLineAttribute, deleteLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Element } from '../../../lib/parser/types';
import ColorPicker from '../ui/ColorPicker';
import PropertyRow, { PropertyPair, DraggableNumberInput } from './property/PropertyRow';
import PropertyGroupTitle from './property/PropertyGroupTitle';
import ShadowEditor from './property/ShadowEditor';
import PaddingEditor from './property/PaddingEditor';
import { fileDialogService, IFileDialogService } from '../../services/file-dialog-service';
import { feedback } from '../../stores/feedbackStore';
import { useElementProps } from './hooks/useElementProps';
import type { ElementProps } from './hooks/useElementProps';
import './PropertyPanel.css';

interface PropertyPanelProps {
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  fileDialogService?: IFileDialogService;
  onErrorLineClick?: (line: number) => void;
  onOpenTableEditor?: (tableLine: number) => void;
}

function PropertyPanel({ externalContent, onExternalContentChange, fileDialogService: dialogService = fileDialogService, onErrorLineClick, onOpenTableEditor }: PropertyPanelProps): React.JSX.Element {
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

  const latestContentRef = useRef(safeContent);
  useEffect(() => {
    latestContentRef.current = safeContent;
  }, [safeContent]);

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
    const currentContent = latestContentRef.current;
    if (value === undefined) {
      const newContent = deleteLineAttribute(currentContent, lineNum, property);
      latestContentRef.current = newContent;
      effectiveSetContent(newContent);
    } else {
      const newContent = updateLineAttribute(currentContent, lineNum, property, value);
      latestContentRef.current = newContent;
      effectiveSetContent(newContent);
    }
  }, [element, effectiveSetContent]);

  const [noteValue, setNoteValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [noteTextareaHeight, setNoteTextareaHeight] = useState(60);
  const [textTextareaHeight, setTextTextareaHeight] = useState(60);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const elementProps = useElementProps({ element });

  useEffect(() => {
    if (elementProps?.note !== undefined && elementProps.note !== noteValue) {
      setNoteValue(elementProps.note);
      setNoteTextareaHeight(60);
    }
  }, [elementProps?.note, noteValue]);

  useEffect(() => {
    if (elementProps?.textContent !== undefined && elementProps.textContent !== textValue) {
      setTextValue(elementProps.textContent);
      setTextTextareaHeight(60);
    }
  }, [elementProps?.textContent, textValue]);

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
        <div className="property-panel-header">
          <span className="property-panel-type">{selectedElements.length} Elements Selected</span>
        </div>
        <p className="multi-select-hint">Select a single element to edit its properties.</p>
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

  const {
    type, x, y, w, h, r, bg, borderColor, borderSize, textColor, fontSize,
    align, verticalAlign, paddingTop, paddingRight, paddingBottom, paddingLeft,
    textDecoration, opacity, bold, italic, note,
    showSizeControls, showRadiusControl, showTextControls, showBorderControls,
    showLineControls, showAlignControl, showShadow, showOpacity,
    isTable, isMultilineText, attrs, text, end, label, url,
    lineLabelColor, lineStyle,
    tableBorder, tableCellspacing, tableRows, tableCols,
  } = elementProps;

  const showPaddingControls = showSizeControls && showTextControls && type !== 'table';

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <span className="property-panel-type">{type}</span>
      </div>

      <PropertyGroupTitle title="Position">
        <PropertyPair
          label1="X" codeAttr1="x"
          value1={x}
          onChange1={(v) => handleChange('x', v)}
          label2="Y" codeAttr2="y"
          value2={y}
          onChange2={(v) => handleChange('y', v)}
        />
      </PropertyGroupTitle>

      {showSizeControls && (
        <PropertyGroupTitle title="Size">
          <PropertyPair
            label1="W" codeAttr1="w"
            value1={w}
            onChange1={(v) => handleChange('w', v)}
            label2="H" codeAttr2="h"
            value2={h}
            onChange2={(v) => handleChange('h', v)}
          />
          {showRadiusControl && (
            <PropertyRow label="R" codeAttr="r">
              <DraggableNumberInput
                label=""
                value={r}
                onChange={(v) => handleChange('r', v)}
              />
            </PropertyRow>
          )}
          {showPaddingControls && (
            <PaddingEditor
              paddingTop={paddingTop}
              paddingRight={paddingRight}
              paddingBottom={paddingBottom}
              paddingLeft={paddingLeft}
              onChange={handleChange}
            />
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
          <PropertyRow label="Style" codeAttr="style">
            <select
              value={lineStyle}
              onChange={(e) => handleChange('style', e.target.value)}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </PropertyRow>
          {label !== undefined && (
            <PropertyRow label="Label" codeAttr="label">
              <input
                type="text"
                value={label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
              />
            </PropertyRow>
          )}
        </PropertyGroupTitle>
      )}

      {showLineControls ? (
        <PropertyGroupTitle title="Appearance">
          <PropertyRow label="Color" codeAttr="c">
            <ColorPicker
              label=""
              value={textColor}
              onChange={(color) => handleChange('c', color)}
            />
          </PropertyRow>
          <PropertyRow label="Width" codeAttr="s">
            <DraggableNumberInput
              label=""
              value={borderSize}
              onChange={(v) => handleChange('s', v)}
            />
          </PropertyRow>
          {label !== undefined && (
            <PropertyRow label="Label Color" codeAttr="text-color">
              <ColorPicker
                label=""
                value={lineLabelColor}
                onChange={(color) => handleChange('text-color', color)}
              />
            </PropertyRow>
          )}
        </PropertyGroupTitle>
      ) : !isTable ? (
        <PropertyGroupTitle title="Appearance">
          <div className="property-row">
            <ColorPicker
              label={type === 'image' ? 'Placeholder BG' : 'Fill'}
              codeAttr="bg"
              value={bg}
              onChange={(color) => handleChange('bg', color)}
            />
            {showBorderControls && (
              <ColorPicker
                label="Border"
                codeAttr="b"
                value={borderColor}
                onChange={(color) => handleChange('b', color)}
              />
            )}
          </div>
          {showBorderControls && (
            <PropertyRow label="Width" codeAttr="s">
              <DraggableNumberInput
                label=""
                value={borderSize}
                onChange={(v) => handleChange('s', v)}
              />
            </PropertyRow>
          )}
          {showOpacity && (
            <PropertyRow label="Opacity" codeAttr="opacity">
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
      ) : null}

      {showShadow && (
        <PropertyGroupTitle title="Shadow" defaultCollapsed={true}>
          <ShadowEditor attrs={attrs} onChange={handleChange} />
        </PropertyGroupTitle>
      )}

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
              codeAttr="c"
              value={textColor}
              onChange={(color) => handleChange('c', color)}
            />
            <DraggableNumberInput
              label="Size"
              value={fontSize}
              onChange={(v) => handleChange('size', v)}
              codeAttr="size"
            />
          </div>
          {showAlignControl && (
            <PropertyRow label="Align" codeAttr="align">
              <div className="align-buttons">
                <button
                  className={`align-btn${align === 'l' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'l')}
                  title="Left"
                ><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg></button>
                <button
                  className={`align-btn${align === 'c' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'c')}
                  title="Center"
                ><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="3.5" y1="7" x2="10.5" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg></button>
                <button
                  className={`align-btn${align === 'r' ? ' active' : ''}`}
                  onClick={() => handleChange('align', 'r')}
                  title="Right"
                ><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg></button>
              </div>
            </PropertyRow>
          )}
          {showAlignControl && type !== 'text' && (
            <PropertyRow label="V-Align" codeAttr="vertical-align">
              <div className="align-buttons">
                <button
                  className={`align-btn${verticalAlign === 't' ? ' active' : ''}`}
                  onClick={() => handleChange('vertical-align', 't')}
                  title="Top"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="4" y="5" width="6" height="3" fill="currentColor" opacity="0.3"/>
                    <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
                <button
                  className={`align-btn${verticalAlign === 'm' ? ' active' : ''}`}
                  onClick={() => handleChange('vertical-align', 'm')}
                  title="Middle"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="4" y="5.5" width="6" height="3" fill="currentColor" opacity="0.3"/>
                    <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
                <button
                  className={`align-btn${verticalAlign === 'b' ? ' active' : ''}`}
                  onClick={() => handleChange('vertical-align', 'b')}
                  title="Bottom"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="4" y="8" width="6" height="3" fill="currentColor" opacity="0.3"/>
                    <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </PropertyRow>
          )}
          <div className="property-row toggle-row">
            <button
              className={`toggle-btn${bold ? ' active' : ''}`}
              onClick={() => handleChange('bold', bold ? undefined : true)}
              title="Bold"
            ><b>B</b></button>
            <button
              className={`toggle-btn${italic ? ' active' : ''}`}
              onClick={() => handleChange('italic', italic ? undefined : true)}
              title="Italic"
            ><i>I</i></button>
            <button
              className={`toggle-btn${textDecoration === 'underline' ? ' active' : ''}`}
              onClick={() => handleChange('text-decoration', textDecoration === 'underline' ? undefined : 'underline')}
              title="Underline"
            ><u>U</u></button>
            <button
              className={`toggle-btn${textDecoration === 'line-through' ? ' active' : ''}`}
              onClick={() => handleChange('text-decoration', textDecoration === 'line-through' ? undefined : 'line-through')}
              title="Strikethrough"
            ><s>S</s></button>
          </div>
          <PropertyRow label="Line Height" codeAttr="line-height">
            <DraggableNumberInput
              label=""
              value={attrs['line-height'] || '22'}
              onChange={(v) => handleChange('line-height', v)}
            />
          </PropertyRow>
          <PropertyRow label="Letter Spacing" codeAttr="letter-spacing">
            <DraggableNumberInput
              label=""
              value={attrs['letter-spacing'] || '0'}
              onChange={(v) => handleChange('letter-spacing', v)}
            />
          </PropertyRow>
        </PropertyGroupTitle>
      )}

      {isTable && (
        <>
          <PropertyGroupTitle title="Table">
            <PropertyRow label="Border" codeAttr="border">
              <DraggableNumberInput
                label=""
                value={tableBorder}
                onChange={(v) => handleChange('border', v)}
              />
            </PropertyRow>
            <PropertyRow label="Spacing" codeAttr="cellspacing">
              <DraggableNumberInput
                label=""
                value={tableCellspacing}
                onChange={(v) => handleChange('cellspacing', v)}
              />
            </PropertyRow>
          </PropertyGroupTitle>

          <PropertyGroupTitle title="Structure">
            <div className="table-structure-info">
              <span className="structure-text">
                {tableRows} rows × {tableCols} cols
              </span>
              <button
                className="edit-table-btn"
                onClick={() => {
                  if (element.location?.line) {
                    onOpenTableEditor?.(element.location.line);
                  }
                }}
              >
                编辑表格
              </button>
            </div>
          </PropertyGroupTitle>

          <PropertyGroupTitle title="Appearance">
            <div className="property-row">
              <ColorPicker
                label="Fill"
                codeAttr="bg"
                value={bg}
                onChange={(color) => handleChange('bg', color)}
              />
              <ColorPicker
                label="Border"
                codeAttr="b"
                value={borderColor}
                onChange={(color) => handleChange('b', color)}
              />
            </div>
          </PropertyGroupTitle>
        </>
      )}

      {type === 'image' && (
        <PropertyGroupTitle title="Image">
          <PropertyRow label="URL" codeAttr="url">
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

      <PropertyGroupTitle title="Note" defaultCollapsed={false}>
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
