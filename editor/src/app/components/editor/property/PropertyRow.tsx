import React, { useCallback, useRef } from 'react';
import PropertyLabel from './PropertyLabel';
import { PROPERTY_META } from './propertyMeta';

interface PropertyRowProps {
  label: string;
  codeAttr?: string;
  children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, codeAttr, children }) => (
  <div className="property-row">
    <PropertyLabel codeAttr={codeAttr || ''} fallbackLabel={label} className="property-label-text" />
    <div className="property-input">
      {children}
    </div>
  </div>
);

interface PropertyPairProps {
  label1: string;
  value1: string | number;
  onChange1: (value: any) => void;
  label2: string;
  value2: string | number;
  onChange2: (value: any) => void;
  codeAttr1?: string;
  codeAttr2?: string;
  step?: number;
}

export const PropertyPair: React.FC<PropertyPairProps> = ({
  label1, value1, onChange1,
  label2, value2, onChange2,
  codeAttr1, codeAttr2,
  step = 1
}) => (
  <div className="property-row">
    <DraggableNumberInput label={label1} value={value1} onChange={onChange1} step={step} codeAttr={codeAttr1} />
    <DraggableNumberInput label={label2} value={value2} onChange={onChange2} step={step} codeAttr={codeAttr2} />
  </div>
);

interface DraggableNumberInputProps {
  label?: string;
  value: string | number;
  onChange: (value: any) => void;
  step?: number;
  codeAttr?: string;
  placeholder?: string;
}

export const DraggableNumberInput: React.FC<DraggableNumberInputProps> = ({
  label, value, onChange, step = 1, codeAttr, placeholder
}) => {
  const dragState = useRef<{ startX: number; startValue: number } | null>(null);

  const hasLabel = (label && label.trim() !== '') || (codeAttr && PROPERTY_META[codeAttr]);
  const displayText = (label && label.trim() !== '')
    ? label
    : (codeAttr && PROPERTY_META[codeAttr] ? PROPERTY_META[codeAttr].zhName : '');

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

  return (
    <div className="property-drag-input">
      {hasLabel ? (
        <PropertyLabel
          codeAttr={codeAttr || ''}
          fallbackLabel={displayText}
          className="property-drag-label"
          onMouseDown={handleMouseDown}
          title="拖拽调整数值，Shift+拖拽 ×10"
        />
      ) : null}
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (placeholder && val === '') return;
          onChange(parseInt(val) || 0);
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

export default PropertyRow;
