import React from 'react';
import { DraggableNumberInput } from './PropertyRow';
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';
import './PaddingEditor.css';

interface PaddingEditorProps {
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  onChange: (attr: string, value: number | undefined) => void;
}

const parseVal = (v: string | undefined): number => {
  if (v === undefined || v === '') return 0;
  return parseInt(v) || 0;
};

const PaddingEditor: React.FC<PaddingEditorProps> = ({
  paddingTop, paddingRight, paddingBottom, paddingLeft, onChange
}) => {
  return (
    <div className="padding-editor">
      {([
        { label: 'Top', attr: 'padding-top', value: paddingTop },
        { label: 'Right', attr: 'padding-right', value: paddingRight },
        { label: 'Bottom', attr: 'padding-bottom', value: paddingBottom },
        { label: 'Left', attr: 'padding-left', value: paddingLeft },
      ] as const).map(({ label, attr, value }) => {
        const meta = PROPERTY_META[attr];
        return (
          <div key={attr} className="padding-row">
            <PropertyTooltip meta={meta}>
              <span className="padding-label">
                <span className="padding-label-text">{label}</span>
              </span>
            </PropertyTooltip>
            <DraggableNumberInput
              label=""
              value={parseVal(value)}
              codeAttr={attr}
              onChange={(v: number) => onChange(attr, v)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default PaddingEditor;
