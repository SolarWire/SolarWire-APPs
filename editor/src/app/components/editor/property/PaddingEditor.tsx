import React, { useMemo } from 'react';
import { DraggableNumberInput } from './PropertyRow';
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';
import './PaddingEditor.css';

interface PaddingEditorProps {
  padding: string;
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
  padding, paddingTop, paddingRight, paddingBottom, paddingLeft, onChange
}) => {
  const isCollapsed = useMemo(() => {
    const t = parseVal(paddingTop);
    const r = parseVal(paddingRight);
    const b = parseVal(paddingBottom);
    const l = parseVal(paddingLeft);
    return t === r && r === b && b === l;
  }, [paddingTop, paddingRight, paddingBottom, paddingLeft]);

  const effectiveValue = parseVal(padding) || parseVal(paddingTop);

  const handleExpand = (value: number) => {
    onChange('padding-top', value);
    onChange('padding-right', value);
    onChange('padding-bottom', value);
    onChange('padding-left', value);
  };

  const handleCollapse = () => {
    const v = parseVal(paddingTop);
    onChange('padding', v);
    onChange('padding-top', undefined);
    onChange('padding-right', undefined);
    onChange('padding-bottom', undefined);
    onChange('padding-left', undefined);
  };

  if (isCollapsed) {
    const meta = PROPERTY_META['padding'];
    return (
      <div className="padding-editor collapsed">
        <div className="padding-row">
          <PropertyTooltip meta={meta}>
            <span className="padding-label">
              <span className="padding-label-text">Padding</span>
              <span className="padding-code-attr">(padding)</span>
            </span>
          </PropertyTooltip>
          <DraggableNumberInput
            label=""
            value={effectiveValue}
            onChange={(v: number) => handleExpand(v)}
          />
          <button
            className="padding-toggle-btn"
            onClick={() => handleExpand(effectiveValue)}
            title="展开各方向独立编辑"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2H9v5a1 1 0 1 1-2 0V9H2a1 1 0 1 1 0-2h5V2a1 1 0 0 1 1-1z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="padding-editor expanded">
      {([
        { label: 'P-T', attr: 'padding-top', value: paddingTop },
        { label: 'P-R', attr: 'padding-right', value: paddingRight },
        { label: 'P-B', attr: 'padding-bottom', value: paddingBottom },
        { label: 'P-L', attr: 'padding-left', value: paddingLeft },
      ] as const).map(({ label, attr, value }) => {
        const meta = PROPERTY_META[attr];
        return (
          <div key={attr} className="padding-row">
            <PropertyTooltip meta={meta}>
              <span className="padding-label">
                <span className="padding-label-text">{label}</span>
                <span className="padding-code-attr">({attr})</span>
              </span>
            </PropertyTooltip>
            <DraggableNumberInput
              label=""
              value={parseVal(value)}
              onChange={(v: number) => onChange(attr, v)}
            />
          </div>
        );
      })}
      <button
        className="padding-collapse-btn"
        onClick={handleCollapse}
        title="折叠到统一 Padding"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 8l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>
    </div>
  );
};

export default PaddingEditor;
