import React, { ReactNode, forwardRef } from 'react';
import './Scrollbar.css';

interface ScrollbarProps {
  children: ReactNode;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const Scrollbar = forwardRef<HTMLDivElement, ScrollbarProps>(({ children, className = '', onScroll }, ref) => {
  return (
    <div ref={ref} className={`scrollbar ${className}`} onScroll={onScroll}>
      {children}
    </div>
  );
});

Scrollbar.displayName = 'Scrollbar';
