import React from 'react';
import PropertyRow, { DraggableNumberInput } from './PropertyRow';
import ColorPicker from '../../ui/ColorPicker';
import './ShadowEditor.css';

interface ShadowEditorProps {
  attrs: Record<string, string>;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const ShadowEditor: React.FC<ShadowEditorProps> = ({ attrs, onChange }) => {
  return (
    <>
      <PropertyRow label="Shadow">
        <div className="shadow-toggle">
          <input
            type="checkbox"
            checked={!!attrs['shadow-enabled']}
            onChange={(e) => {
              if (e.target.checked) {
                onChange('shadow-enabled', true);
              } else {
                onChange('shadow-enabled', false);
                onChange('shadow-x', undefined);
                onChange('shadow-y', undefined);
                onChange('shadow-blur', undefined);
                onChange('shadow-color', undefined);
              }
            }}
          />
        </div>
      </PropertyRow>
      {attrs['shadow-enabled'] && (
        <>
          <div className="property-row">
            <DraggableNumberInput
              label="X"
              value={attrs['shadow-x'] || ''}
              onChange={(v) => onChange('shadow-x', v)}
            />
            <DraggableNumberInput
              label="Y"
              value={attrs['shadow-y'] || ''}
              onChange={(v) => onChange('shadow-y', v)}
            />
          </div>
          <PropertyRow label="Blur">
            <DraggableNumberInput
              label=""
              value={attrs['shadow-blur'] || ''}
              onChange={(v) => onChange('shadow-blur', v)}
            />
          </PropertyRow>
          <ColorPicker
            label="Color"
            value={attrs['shadow-color'] || '#000000'}
            onChange={(color) => onChange('shadow-color', color)}
          />
        </>
      )}
    </>
  );
};

export default ShadowEditor;
