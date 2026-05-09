import React from 'react';
import { DraggableNumberInput } from './PropertyRow';
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

const PADDING_FIELDS = [
  { attr: 'padding-left', valueKey: 'paddingLeft' as const },
  { attr: 'padding-top', valueKey: 'paddingTop' as const },
  { attr: 'padding-right', valueKey: 'paddingRight' as const },
  { attr: 'padding-bottom', valueKey: 'paddingBottom' as const },
] as const;

const PaddingEditor: React.FC<PaddingEditorProps> = ({
  paddingTop, paddingRight, paddingBottom, paddingLeft, onChange
}) => {
  const values = { paddingTop, paddingRight, paddingBottom, paddingLeft };

  return (
    <div className="padding-grid">
      {PADDING_FIELDS.map(({ attr, valueKey }) => (
        <DraggableNumberInput
          key={attr}
          codeAttr={attr}
          value={parseVal(values[valueKey])}
          onChange={(v: number) => onChange(attr, v)}
        />
      ))}
    </div>
  );
};

export default PaddingEditor;
