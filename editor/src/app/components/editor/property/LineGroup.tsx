import React, { useState, useRef, useCallback } from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import PropertyRow, { PropertyPair } from './PropertyRow';
import ColorPicker from '../../ui/ColorPicker';
import { DraggableNumberInput } from './PropertyRow';
import type { ElementProps } from '../hooks/useElementProps';

interface LineGroupProps {
  line: NonNullable<ElementProps['line']>;
  appearance: ElementProps['appearance'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const LineGroup: React.FC<LineGroupProps> = ({ line, appearance, onChange }) => {
  const [localLabel, setLocalLabel] = useState(line.label || '');
  const [isComposing, setIsComposing] = useState(false);
  const prevLabelRef = useRef(line.label || '');

  if ((line.label || '') !== prevLabelRef.current && !isComposing) {
    setLocalLabel(line.label || '');
    prevLabelRef.current = line.label || '';
  }

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLabel(e.target.value);
    if (!isComposing) {
      onChange('label', e.target.value);
    }
  }, [onChange, isComposing]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const value = (e.target as HTMLInputElement).value;
    setLocalLabel(value);
    onChange('label', value);
  }, [onChange]);

  return (
  <>
    <PropertyGroupTitle title="线段终点">
      <PropertyPair
        label1="终点X"
        value1={line.end?.type === 'relative' ? (line.end?.dx ?? '') : (line.end?.x?.type === 'absolute' ? line.end.x.value : '')}
        onChange1={(v) => onChange('x2', v)}
        label2="终点Y"
        value2={line.end?.type === 'relative' ? (line.end?.dy ?? '') : (line.end?.y?.type === 'absolute' ? line.end.y.value : '')}
        onChange2={(v) => onChange('y2', v)}
        codeAttr1="x2"
        codeAttr2="y2"
      />
      <PropertyRow label="线条样式" codeAttr="style">
        <select value={line.style} onChange={(e) => onChange('style', e.target.value)}>
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
        </select>
      </PropertyRow>
    </PropertyGroupTitle>
    <PropertyGroupTitle title="外观">
      <PropertyRow label="线段色" codeAttr="b">
        <ColorPicker label="" value={appearance.borderColor} onChange={(color) => onChange('b', color)} />
      </PropertyRow>
      <PropertyRow label="线宽" codeAttr="s">
        <DraggableNumberInput label="" value={appearance.borderSize} onChange={(v) => onChange('s', v)} />
      </PropertyRow>
    </PropertyGroupTitle>
    <PropertyGroupTitle title="文字">
      <PropertyRow label="内容" codeAttr="label">
        <input
          type="text"
          value={isComposing ? localLabel : (line.label || '')}
          onChange={handleLabelChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="输入线段文字内容"
        />
      </PropertyRow>
      <PropertyRow label="文字色" codeAttr="c">
        <ColorPicker label="" value={line.labelColor} onChange={(color) => onChange('c', color)} />
      </PropertyRow>
    </PropertyGroupTitle>
  </>
  );
};

export default LineGroup;
