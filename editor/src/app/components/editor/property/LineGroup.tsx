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
  mixedFields?: Set<string>;
}

const LineGroup: React.FC<LineGroupProps> = ({ line, appearance, onChange, mixedFields }) => {
  const isMixedX2 = mixedFields?.has('x2');
  const isMixedY2 = mixedFields?.has('y2');
  const isMixedStyle = mixedFields?.has('style');
  const isMixedB = mixedFields?.has('b');
  const isMixedS = mixedFields?.has('s');
  const isMixedLabel = mixedFields?.has('label');
  const isMixedC = mixedFields?.has('c');
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
        value1={isMixedX2 ? '' : (line.end?.type === 'relative' ? (line.end?.dx ?? '') : (line.end?.x?.type === 'absolute' ? line.end.x.value : ''))}
        onChange1={(v) => onChange('x2', v)}
        label2="终点Y"
        value2={isMixedY2 ? '' : (line.end?.type === 'relative' ? (line.end?.dy ?? '') : (line.end?.y?.type === 'absolute' ? line.end.y.value : ''))}
        onChange2={(v) => onChange('y2', v)}
        codeAttr1="x2"
        codeAttr2="y2"
        placeholder1={isMixedX2 ? '—' : undefined}
        placeholder2={isMixedY2 ? '—' : undefined}
      />
      <PropertyRow label="线条样式" codeAttr="style">
        <select value={isMixedStyle ? '' : line.style} onChange={(e) => onChange('style', e.target.value)}>
          {isMixedStyle && <option value="" disabled>—</option>}
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
          <option value="dotted">点线</option>
        </select>
      </PropertyRow>
    </PropertyGroupTitle>
    <PropertyGroupTitle title="外观">
      <PropertyRow label="线段色" codeAttr="b">
        <ColorPicker label="" value={isMixedB ? '' : appearance.borderColor} onChange={(color) => onChange('b', color)} mixed={isMixedB} />
      </PropertyRow>
      <PropertyRow label="线宽" codeAttr="s">
        <DraggableNumberInput label="" value={isMixedS ? '' : appearance.borderSize} onChange={(v) => onChange('s', v)} placeholder={isMixedS ? '—' : undefined} />
      </PropertyRow>
    </PropertyGroupTitle>
    <PropertyGroupTitle title="文字">
      <PropertyRow label="内容" codeAttr="label">
        <input
          type="text"
          value={isMixedLabel ? '' : (isComposing ? localLabel : (line.label || ''))}
          onChange={handleLabelChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={isMixedLabel ? '—' : "输入线段文字内容"}
        />
      </PropertyRow>
      <PropertyRow label="文字色" codeAttr="c">
        <ColorPicker label="" value={isMixedC ? '' : line.labelColor} onChange={(color) => onChange('c', color)} mixed={isMixedC} />
      </PropertyRow>
    </PropertyGroupTitle>
  </>
  );
};

export default LineGroup;
