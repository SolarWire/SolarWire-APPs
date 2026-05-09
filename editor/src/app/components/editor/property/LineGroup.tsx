import React from 'react';
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

const LineGroup: React.FC<LineGroupProps> = ({ line, appearance, onChange }) => (
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
      {line.label !== undefined && (
        <PropertyRow label="标签" codeAttr="label">
          <input type="text" value={line.label || ''} onChange={(e) => onChange('label', e.target.value)} />
        </PropertyRow>
      )}
    </PropertyGroupTitle>
    <PropertyGroupTitle title="外观">
      <PropertyRow label="颜色" codeAttr="c">
        <ColorPicker label="" value={appearance.textColor} onChange={(color) => onChange('c', color)} />
      </PropertyRow>
      <PropertyRow label="线宽" codeAttr="s">
        <DraggableNumberInput label="" value={appearance.borderSize} onChange={(v) => onChange('s', v)} />
      </PropertyRow>
      {line.label !== undefined && (
        <PropertyRow label="标签色" codeAttr="text-color">
          <ColorPicker label="" value={line.labelColor} onChange={(color) => onChange('text-color', color)} />
        </PropertyRow>
      )}
    </PropertyGroupTitle>
  </>
);

export default LineGroup;
