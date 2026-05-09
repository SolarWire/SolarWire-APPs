import React from 'react';
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';

interface PropertyLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  codeAttr: string;
  fallbackLabel?: string;
}

const PropertyLabel: React.FC<PropertyLabelProps> = ({
  codeAttr,
  fallbackLabel,
  className,
  ...rest
}) => {
  const meta = PROPERTY_META[codeAttr];
  const displayText = meta?.zhName || fallbackLabel || codeAttr;

  if (!meta) {
    return (
      <span className={className} {...rest}>
        {displayText}
      </span>
    );
  }

  return (
    <PropertyTooltip meta={meta}>
      <span className={className} {...rest}>
        {displayText}
      </span>
    </PropertyTooltip>
  );
};

export default PropertyLabel;
