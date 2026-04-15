import React, { useState, useRef, useEffect } from 'react';
import './ResizableDivider.css';

interface ResizableDividerProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (newSize: number) => void;
  currentSize: number;
  minSize?: number;
  maxSize?: number;
  reverse?: boolean;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  orientation,
  onResize,
  currentSize,
  minSize = 100,
  maxSize = 800,
  reverse = false,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const startMousePosition = useRef<number>(0);
  const startSize = useRef<number>(currentSize);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (orientation === 'vertical') {
        const delta = reverse 
          ? startMousePosition.current - e.clientX 
          : e.clientX - startMousePosition.current;
        const newSize = startSize.current + delta;
        if (newSize >= minSize && newSize <= maxSize) {
          onResize(newSize);
        }
      } else {
        const delta = reverse 
          ? startMousePosition.current - e.clientY 
          : e.clientY - startMousePosition.current;
        const newSize = startSize.current + delta;
        if (newSize >= minSize && newSize <= maxSize) {
          onResize(newSize);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      if (dividerRef.current) {
        dividerRef.current.style.backgroundColor = '#FCA506';
      }
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (dividerRef.current) {
        dividerRef.current.style.backgroundColor = '';
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, orientation, onResize, minSize, maxSize, reverse]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startMousePosition.current = orientation === 'vertical' ? e.clientX : e.clientY;
    startSize.current = currentSize;
  };

  return (
    <div
      ref={dividerRef}
      className={`resizable-divider ${orientation}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        zIndex: 10,
      }}
    />
  );
};

export default ResizableDivider;
