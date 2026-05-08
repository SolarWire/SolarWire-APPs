import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import PropertyRow, { DraggableNumberInput } from './PropertyRow';
import ColorPicker from '../../ui/ColorPicker';
import type { ElementProps } from '../hooks/useElementProps';

interface AppearanceGroupProps {
  type: string;
  appearance: ElementProps['appearance'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const AppearanceGroup: React.FC<AppearanceGroupProps> = ({ type, appearance, onChange }) => (
  <PropertyGroupTitle title="Appearance">
    {appearance.showFill && (
      <div className="property-row">
        <ColorPicker
          label={type === 'image' ? 'Placeholder BG' : 'Fill'}
          codeAttr="bg"
          value={appearance.bg}
          onChange={(color) => onChange('bg', color)}
        />
        {appearance.showBorder && (
          <ColorPicker
            label="Border"
            codeAttr="b"
            value={appearance.borderColor}
            onChange={(color) => onChange('b', color)}
          />
        )}
      </div>
    )}
    {appearance.showBorder && (
      <PropertyRow label="Width" codeAttr="s">
        <DraggableNumberInput label="" value={appearance.borderSize} onChange={(v) => onChange('s', v)} />
      </PropertyRow>
    )}
    {appearance.showOpacity && (
      <PropertyRow label="Opacity" codeAttr="opacity">
        <div className="opacity-control">
          <input type="range" min="0" max="1" step="0.1" value={appearance.opacity} onChange={(e) => onChange('opacity', parseFloat(e.target.value))} />
          <input type="number" className="opacity-number" min="0" max="1" step="0.1" value={appearance.opacity} onChange={(e) => onChange('opacity', parseFloat(e.target.value) || 0)} />
        </div>
      </PropertyRow>
    )}
  </PropertyGroupTitle>
);

export default AppearanceGroup;
