import React, { useCallback, useRef } from 'react';

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children }) => (
  <div className="property-row">
    <span className="property-label">{label}</span>
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
  type?: 'number' | 'text';
  step?: number;
}

export const PropertyPair: React.FC<PropertyPairProps> = ({
  label1, value1, onChange1,
  label2, value2, onChange2,
  type = 'number',
  step = 1
}) => (
  <div className="property-row">
    <DraggableNumberInput label={label1} value={value1} onChange={onChange1} step={step} />
    <DraggableNumberInput label={label2} value={value2} onChange={onChange2} step={step} />
  </div>
);

interface DraggableNumberInputProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  step?: number;
}

export const DraggableNumberInput: React.FC<DraggableNumberInputProps> = ({
  label, value, onChange, step = 1
}) => {
  const dragState = useRef<{ startX: number; startValue: number } | null>(null);

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
      <span
        className="property-drag-label"
        onMouseDown={handleMouseDown}
        title={`Drag to adjust. Shift+drag for ×10`}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </div>
  );
};

export default PropertyRow;
