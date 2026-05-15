import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableTextareaProps {
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur: (value: string) => void;
  minHeight?: number;
  maxHeight?: number;
}

function ResizableTextarea({
  value,
  placeholder,
  onChange,
  onBlur,
  minHeight = 180,
  maxHeight = 500,
}: ResizableTextareaProps) {
  const [localValue, setLocalValue] = useState(value);
  const [textareaHeight, setTextareaHeight] = useState(minHeight);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setLocalValue(value);
      prevValueRef.current = value;
    }
  }, [value]);

  const handleResize = useCallback(() => {
    if (textareaRef.current) {
      setTextareaHeight(textareaRef.current.offsetHeight);
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const startHeight = textarea.offsetHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + delta));
      textarea.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      handleResize();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [minHeight, maxHeight, handleResize]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onChange?.(e.target.value);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    onBlur(localValue);
  }, [onBlur, localValue]);

  return (
    <div className="note-textarea-wrapper">
      <textarea
        ref={textareaRef}
        value={localValue}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onMouseUp={handleResize}
        style={{
          whiteSpace: 'pre-wrap',
          height: textareaHeight,
          minHeight,
          maxHeight,
        }}
      />
      <div
        className="note-resize-handle"
        onMouseDown={handleResizeStart}
      ></div>
    </div>
  );
}

export default ResizableTextarea;
