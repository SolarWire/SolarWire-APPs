import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import { PropertyPair, DraggableNumberInput } from './PropertyRow';
import type { ElementProps } from '../hooks/useElementProps';

interface SizeGroupProps {
  size: ElementProps['size'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
  mixedFields?: Set<string>;
}

const SizeGroup: React.FC<SizeGroupProps> = ({ size, onChange, mixedFields }) => {
  if (!size.show) return null;
  const isMixedW = mixedFields?.has('w');
  const isMixedH = mixedFields?.has('h');
  const isMixedR = mixedFields?.has('r');
  return (
    <PropertyGroupTitle title="尺寸">
      <PropertyPair
        label1="W" codeAttr1="w"
        value1={isMixedW ? '' : size.w}
        onChange1={(v) => onChange('w', v)}
        label2="H" codeAttr2="h"
        value2={isMixedH ? '' : size.h}
        onChange2={(v) => onChange('h', v)}
        placeholder1={isMixedW ? '—' : undefined}
        placeholder2={isMixedH ? '—' : undefined}
      />
      {size.showRadius && (
        <DraggableNumberInput
          label="圆角"
          codeAttr="r"
          value={isMixedR ? '' : size.r}
          onChange={(v) => onChange('r', v)}
          placeholder={isMixedR ? '—' : undefined}
        />
      )}
    </PropertyGroupTitle>
  );
};

export default SizeGroup;
