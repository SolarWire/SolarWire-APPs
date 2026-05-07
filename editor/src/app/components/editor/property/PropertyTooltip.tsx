import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { PropertyMeta } from './propertyMeta';
import './PropertyTooltip.css';

interface PropertyTooltipProps {
  meta: PropertyMeta;
  children: React.ReactNode;
}

const PropertyTooltip: React.FC<PropertyTooltipProps> = ({ meta, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const panelWidth = 280;
        let x = rect.right + 8;
        if (x + panelWidth > window.innerWidth) {
          x = rect.left - panelWidth - 8;
        }
        if (x < 8) x = 8;
        setPosition({ x, y: rect.top });
        setVisible(true);
      }
    }, 300);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const tooltipContent = visible && createPortal(
    <div className="property-tooltip" style={{ left: position.x, top: position.y }}>
      <div className="tooltip-code-attr">{meta.codeAttr}</div>
      <div className="tooltip-section">
        <div className="tooltip-label">SolarWire 语法:</div>
        <div className="tooltip-code">{meta.syntax}</div>
      </div>
      <div className="tooltip-desc">{meta.description}</div>
      <div className="tooltip-supported">
        支持: {meta.supportedTypes.join(', ')}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        className="property-tooltip-trigger"
      >
        {children}
      </span>
      {tooltipContent}
    </>
  );
};

export default PropertyTooltip;
