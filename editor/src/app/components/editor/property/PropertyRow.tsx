import React, { useCallback, useRef } from 'react';
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';

interface PropertyRowProps {
  label: string;
  codeAttr?: string;
  children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, codeAttr, children }) => {
  const meta = codeAttr ? PROPERTY_META[codeAttr] : undefined;

  const labelContent = (
    <span className="property-label-text">{label}</span>
  );

  return (
    <div className="property-row">
      {meta ? (
        <PropertyTooltip meta={meta}>
          {labelContent}
        </PropertyTooltip>
      ) : (
        <span className="property-label">
          {labelContent}
        </span>
      )}
      <div className="property-input">
        {children}
      </div>
    </div>
  );
};

interface PropertyPairProps {
  label1: string;
  value1: string | number;
  onChange1: (value: any) => void;
  label2: string;
  value2: string | number;
  onChange2: (value: any) => void;
  codeAttr1?: string;
  codeAttr2?: string;
  type?: 'number' | 'text';
  step?: number;
}

export const PropertyPair: React.FC<PropertyPairProps> = ({
  label1, value1, onChange1,
  label2, value2, onChange2,
  codeAttr1, codeAttr2,
  type = 'number',
  step = 1
}) => (
  <div className="property-row">
    <DraggableNumberInput label={label1} value={value1} onChange={onChange1} step={step} codeAttr={codeAttr1} />
    <DraggableNumberInput label={label2} value={value2} onChange={onChange2} step={step} codeAttr={codeAttr2} />
  </div>
);

interface DraggableNumberInputProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  step?: number;
  codeAttr?: string;
}

export const DraggableNumberInput: React.FC<DraggableNumberInputProps> = ({
  label, value, onChange, step = 1, codeAttr
}) => {
  const dragState = useRef<{ startX: number; startValue: number } | null>(null);
  const meta = codeAttr ? PROPERTY_META[codeAttr] : undefined;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
    dragState.current = { startX, startValue };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return;
      const delta = moveEvent.clientX - dragState.current.startX;
      const sensitivity = moveEvent.shiftKey ? 10 : 1;
      const newValue = Math.round(dragState.current.startValue + delta * sensitivity * step);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, step]);

  const labelContent = (
    <span>{label}</span>
  );

  return (
    <div className="property-drag-input">
      {meta ? (
        <PropertyTooltip meta={meta}>
          <span
            className="property-drag-label"
            onMouseDown={handleMouseDown}
            title={`Drag to adjust. Shift+drag for ×10`}
          >
            {label}
          </span>
        </PropertyTooltip>
      ) : (
        <span
          className="property-drag-label"
          onMouseDown={handleMouseDown}
          title={`Drag to adjust. Shift+drag for ×10`}
        >
          {label}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </div>
  );
};

export default PropertyRow;
