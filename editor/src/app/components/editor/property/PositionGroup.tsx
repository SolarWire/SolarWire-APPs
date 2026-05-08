import React from 'react';
import PropertyGroupTitle from './PropertyGroupTitle';
import { PropertyPair } from './PropertyRow';
import type { ElementProps } from '../hooks/useElementProps';

interface PositionGroupProps {
  position: ElementProps['position'];
  onChange: (property: string, value: string | number | boolean | undefined) => void;
}

const PositionGroup: React.FC<PositionGroupProps> = ({ position, onChange }) => (
  <PropertyGroupTitle title="Position">
    <PropertyPair
      label1="X" codeAttr1="x"
      value1={position.x}
      onChange1={(v) => onChange('x', v)}
      label2="Y" codeAttr2="y"
      value2={position.y}
      onChange2={(v) => onChange('y', v)}
    />
  </PropertyGroupTitle>
);

export default PositionGroup;
