import React, { ReactNode, forwardRef } from 'react';
import './Scrollbar.css';

interface ScrollbarProps {
  children: ReactNode;
  className?: string;
}

export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`scrollbar ${className}`}>
      {children}
    </div>
  );
});

Scrollbar.displayName = 'Scrollbar';
