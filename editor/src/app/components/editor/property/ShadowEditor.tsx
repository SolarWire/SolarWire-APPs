import React from 'react';
import PropertyRow, { DraggableNumberInput } from './PropertyRow';
import ColorPicker from '../../ui/ColorPicker';
import './ShadowEditor.css';

interface ShadowEditorProps {
  attrs: Record<string, string>;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
  mixedFields?: Set<string>;
}

const ShadowEditor: React.FC<ShadowEditorProps> = ({ attrs, onChange, mixedFields }) => {
  const isEnabled = !!attrs['shadow-enabled'];
  const isMixedEnabled = mixedFields?.has('shadow-enabled');
  const isMixedX = mixedFields?.has('shadow-x');
  const isMixedY = mixedFields?.has('shadow-y');
  const isMixedBlur = mixedFields?.has('shadow-blur');
  const isMixedColor = mixedFields?.has('shadow-color');

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
              value={isMixedX ? '' : (attrs['shadow-x'] || 0)}
              codeAttr="shadow-x"
              onChange={(v) => onChange('shadow-x', v)}
              placeholder={isMixedX ? '—' : undefined}
            />
            <DraggableNumberInput
              label="阴影Y"
              value={isMixedY ? '' : (attrs['shadow-y'] || 0)}
              codeAttr="shadow-y"
              onChange={(v) => onChange('shadow-y', v)}
              placeholder={isMixedY ? '—' : undefined}
            />
          </div>
          <DraggableNumberInput
            label="阴影模糊"
            codeAttr="shadow-blur"
            value={isMixedBlur ? '' : (attrs['shadow-blur'] || 3)}
            onChange={(v) => onChange('shadow-blur', v)}
            placeholder={isMixedBlur ? '—' : undefined}
          />
          <ColorPicker
            label="阴影色"
            codeAttr="shadow-color"
            value={isMixedColor ? '' : (attrs['shadow-color'] || '#000000')}
            onChange={(color) => onChange('shadow-color', color)}
            mixed={isMixedColor}
          />
        </>
      )}
    </>
  );
};

export default ShadowEditor;
