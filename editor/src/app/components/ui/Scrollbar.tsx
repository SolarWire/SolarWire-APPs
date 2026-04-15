import React, { ReactNode } from 'react';
import './Scrollbar.css';

interface ScrollbarProps {
  children: ReactNode;
  className?: string;
}

export const Scrollbar: React.FC<ScrollbarProps> = ({ children, className = '' }) => {
  return (
    <div className={`scrollbar ${className}`}>
      {children}
    </div>
  );
};
