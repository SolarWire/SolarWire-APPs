import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import { PropertyPair, DraggableNumberInput } from './PropertyRow';
import type { ElementProps } from '../hooks/useElementProps';

interface SizeGroupProps {
  size: ElementProps['size'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const SizeGroup: React.FC<SizeGroupProps> = ({ size, onChange }) => {
  if (!size.show) return null;
  return (
    <PropertyGroupTitle title="尺寸">
      <PropertyPair
        label1="W" codeAttr1="w"
        value1={size.w}
        onChange1={(v) => onChange('w', v)}
        label2="H" codeAttr2="h"
        value2={size.h}
        onChange2={(v) => onChange('h', v)}
      />
      {size.showRadius && (
        <DraggableNumberInput label="圆角" codeAttr="r" value={size.r} onChange={(v) => onChange('r', v)} />
      )}
    </PropertyGroupTitle>
  );
};

export default SizeGroup;
