import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import PropertyRow, { PropertyPair, DraggableNumberInput } from './PropertyRow';
import PaddingEditor from './PaddingEditor';
import type { ElementProps } from '../hooks/useElementProps';

interface SizeGroupProps {
  size: ElementProps['size'];
  text: ElementProps['text'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const SizeGroup: React.FC<SizeGroupProps> = ({ size, text, onChange }) => {
  if (!size.show) return null;
  return (
    <PropertyGroupTitle title="Size">
      <PropertyPair
        label1="W" codeAttr1="w"
        value1={size.w}
        onChange1={(v) => onChange('w', v)}
        label2="H" codeAttr2="h"
        value2={size.h}
        onChange2={(v) => onChange('h', v)}
      />
      {size.showRadius && (
        <PropertyRow label="R" codeAttr="r">
          <DraggableNumberInput label="" value={size.r} onChange={(v) => onChange('r', v)} />
        </PropertyRow>
      )}
      {size.showPadding && (
        <PaddingEditor
          paddingTop={text.paddingTop}
          paddingRight={text.paddingRight}
          paddingBottom={text.paddingBottom}
          paddingLeft={text.paddingLeft}
          onChange={onChange}
        />
      )}
    </PropertyGroupTitle>
  );
};

export default SizeGroup;
