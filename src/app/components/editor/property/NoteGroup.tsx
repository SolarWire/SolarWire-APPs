import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import ResizableTextarea from './ResizableTextarea';

interface NoteGroupProps {
  value: string;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const NoteGroup: React.FC<NoteGroupProps> = ({ value, onChange }) => (
  <PropertyGroupTitle title="备注" defaultCollapsed={false}>
    <ResizableTextarea
      value={value}
      placeholder="添加备注..."
      onBlur={(v) => onChange('note', v)}
    />
  </PropertyGroupTitle>
);

export default NoteGroup;
