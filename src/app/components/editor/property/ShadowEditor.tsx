import React from 'react';
import PropertyRow, { DraggableNumberInput } from './PropertyRow';
import ColorPicker from '../../ui/ColorPicker';
import './ShadowEditor.css';

interface ShadowEditorProps {
  attrs: Record<string, string>;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const ShadowEditor: React.FC<ShadowEditorProps> = ({ attrs, onChange }) => {
  const isEnabled = !!attrs['shadow-enabled'];

  return (
    <>
      <PropertyRow label="阴影" codeAttr="shadow-enabled">
        <div className="shadow-toggle">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              if (e.target.checked) {
                onChange('shadow-enabled', true);
                if (!attrs['shadow-x']) onChange('shadow-x', 0);
                if (!attrs['shadow-y']) onChange('shadow-y', 0);
                if (!attrs['shadow-blur']) onChange('shadow-blur', 3);
                if (!attrs['shadow-color']) onChange('shadow-color', '#000000');
              } else {
                onChange('shadow-enabled', undefined);
                onChange('shadow-x', undefined);
                onChange('shadow-y', undefined);
                onChange('shadow-blur', undefined);
                onChange('shadow-color', undefined);
              }
            }}
          />
        </div>
      </PropertyRow>
      {isEnabled && (
        <>
          <div className="property-row">
            <DraggableNumberInput
              label="阴影X"
              value={attrs['shadow-x'] || 0}
              codeAttr="shadow-x"
              onChange={(v) => onChange('shadow-x', v)}
            />
            <DraggableNumberInput
              label="阴影Y"
              value={attrs['shadow-y'] || 0}
              codeAttr="shadow-y"
              onChange={(v) => onChange('shadow-y', v)}
            />
          </div>
          <DraggableNumberInput
            label="阴影模糊"
            codeAttr="shadow-blur"
            value={attrs['shadow-blur'] || 3}
            onChange={(v) => onChange('shadow-blur', v)}
          />
          <ColorPicker
            label="阴影色"
            codeAttr="shadow-color"
            value={attrs['shadow-color'] || '#000000'}
            onChange={(color) => onChange('shadow-color', color)}
          />
        </>
      )}
    </>
  );
};

export default ShadowEditor;
