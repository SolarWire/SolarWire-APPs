import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import PropertyRow, { DraggableNumberInput } from './PropertyRow';
import PropertyLabel from './PropertyLabel';
import ColorPicker from '../../ui/ColorPicker';
import ResizableTextarea from './ResizableTextarea';
import type { ElementProps } from '../hooks/useElementProps';

interface TextGroupProps {
  element: any;
  text: ElementProps['text'];
  appearance: ElementProps['appearance'];
  type: string;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const TextGroup: React.FC<TextGroupProps> = ({ element, text, appearance, type, onChange }) => {
  if (!text.show) return null;
  return (
    <PropertyGroupTitle title="文字">
      {'text' in element && (
        <PropertyRow label="内容">
          {text.isMultiline ? (
            <ResizableTextarea
              value={text.content}
              placeholder="输入文本内容..."
              onBlur={(v) => onChange('text', `"""${v}"""`)}
            />
          ) : (
            <input type="text" value={text.content || ''} onChange={(e) => onChange('text', e.target.value)} />
          )}
        </PropertyRow>
      )}
      <div className="property-row">
        <ColorPicker label="文字色" codeAttr="c" value={appearance.textColor} onChange={(color) => onChange('c', color)} />
        <DraggableNumberInput label="字号" codeAttr="size" value={text.fontSize} onChange={(v) => onChange('size', v)} />
      </div>
      {text.showAlign && (
        <PropertyRow label="水平对齐" codeAttr="align">
          <div className="align-buttons">
            <button className={`align-btn${text.align === 'l' ? ' active' : ''}`} onClick={() => onChange('align', 'l')} title="Left">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className={`align-btn${text.align === 'c' ? ' active' : ''}`} onClick={() => onChange('align', 'c')} title="Center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="3.5" y1="7" x2="10.5" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className={`align-btn${text.align === 'r' ? ' active' : ''}`} onClick={() => onChange('align', 'r')} title="Right">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
          </div>
        </PropertyRow>
      )}
      {text.showAlign && type !== 'text' && (
        <PropertyRow label="垂直对齐" codeAttr="vertical-align">
          <div className="align-buttons">
            <button className={`align-btn${text.verticalAlign === 't' ? ' active' : ''}`} onClick={() => onChange('vertical-align', 't')} title="Top">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="5" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className={`align-btn${text.verticalAlign === 'm' ? ' active' : ''}`} onClick={() => onChange('vertical-align', 'm')} title="Middle">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="5.5" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className={`align-btn${text.verticalAlign === 'b' ? ' active' : ''}`} onClick={() => onChange('vertical-align', 'b')} title="Bottom">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="8" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
          </div>
        </PropertyRow>
      )}
      <div className="property-row toggle-row">
        <PropertyLabel codeAttr="" fallbackLabel="样式" className="property-label-text toggle-row-label" />
        <button className={`toggle-btn${text.bold ? ' active' : ''}`} onClick={() => onChange('bold', text.bold ? undefined : true)} title="Bold"><b>B</b></button>
        <button className={`toggle-btn${text.italic ? ' active' : ''}`} onClick={() => onChange('italic', text.italic ? undefined : true)} title="Italic"><i>I</i></button>
        <button className={`toggle-btn${text.textDecoration === 'underline' ? ' active' : ''}`} onClick={() => onChange('text-decoration', text.textDecoration === 'underline' ? undefined : 'underline')} title="Underline"><u>U</u></button>
        <button className={`toggle-btn${text.textDecoration === 'line-through' ? ' active' : ''}`} onClick={() => onChange('text-decoration', text.textDecoration === 'line-through' ? undefined : 'line-through')} title="Strikethrough"><s>S</s></button>
      </div>
      <DraggableNumberInput label="行高" codeAttr="line-height" value={text.lineHeight} onChange={(v) => onChange('line-height', v)} />
      <DraggableNumberInput label="字间距" codeAttr="letter-spacing" value={text.letterSpacing} onChange={(v) => onChange('letter-spacing', v)} />
    </PropertyGroupTitle>
  );
};

export default TextGroup;
