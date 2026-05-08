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
    <PropertyGroupTitle title="Line End">
      <PropertyPair
        label1="X2"
        value1={line.end?.type === 'relative' ? (line.end?.dx ?? '') : (line.end?.x?.type === 'absolute' ? line.end.x.value : '')}
        onChange1={(v) => onChange('x2', v)}
        label2="Y2"
        value2={line.end?.type === 'relative' ? (line.end?.dy ?? '') : (line.end?.y?.type === 'absolute' ? line.end.y.value : '')}
        onChange2={(v) => onChange('y2', v)}
      />
      <PropertyRow label="Style" codeAttr="style">
        <select value={line.style} onChange={(e) => onChange('style', e.target.value)}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </PropertyRow>
      {line.label !== undefined && (
        <PropertyRow label="Label" codeAttr="label">
          <input type="text" value={line.label || ''} onChange={(e) => onChange('label', e.target.value)} />
        </PropertyRow>
      )}
    </PropertyGroupTitle>
    <PropertyGroupTitle title="Appearance">
      <PropertyRow label="Color" codeAttr="c">
        <ColorPicker label="" value={appearance.textColor} onChange={(color) => onChange('c', color)} />
      </PropertyRow>
      <PropertyRow label="Width" codeAttr="s">
        <DraggableNumberInput label="" value={appearance.borderSize} onChange={(v) => onChange('s', v)} />
      </PropertyRow>
      {line.label !== undefined && (
        <PropertyRow label="Label Color" codeAttr="text-color">
          <ColorPicker label="" value={line.labelColor} onChange={(color) => onChange('text-color', color)} />
        </PropertyRow>
      )}
    </PropertyGroupTitle>
  </>
);

export default LineGroup;
