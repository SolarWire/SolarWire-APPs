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
  <PropertyGroupTitle title="外观">
    {appearance.showFill && (
      <div className="property-row">
        <ColorPicker
          label={type === 'image' ? '占位背景' : '填充色'}
          codeAttr="bg"
          value={appearance.bg}
          onChange={(color) => onChange('bg', color)}
        />
        {appearance.showBorder && (
          <ColorPicker
            label="边框色"
            codeAttr="b"
            value={appearance.borderColor}
            onChange={(color) => onChange('b', color)}
          />
        )}
      </div>
    )}
    {appearance.showBorder && (
      <DraggableNumberInput label="边框宽度" codeAttr="s" value={appearance.borderSize} onChange={(v) => onChange('s', v)} />
    )}
    {appearance.showOpacity && (
      <PropertyRow label="透明度" codeAttr="opacity">
        <div className="opacity-control">
          <input type="range" min="0" max="1" step="0.1" value={appearance.opacity} onChange={(e) => onChange('opacity', parseFloat(e.target.value))} />
          <input type="number" className="opacity-number" min="0" max="1" step="0.1" value={appearance.opacity} onChange={(e) => onChange('opacity', parseFloat(e.target.value) || 0)} />
        </div>
      </PropertyRow>
    )}
  </PropertyGroupTitle>
);

export default AppearanceGroup;
