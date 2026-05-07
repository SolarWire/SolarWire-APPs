import { useEffect, useCallback } from 'react';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { updateLineAttribute } from '../../../../shared/utils/attribute-updater';

interface UseEditorKeyboardOptions {
  content: string;
  handleContentChange: ((content: string) => void) | undefined;
  handleDeleteSelected: () => void;
}

const getElementDataFromContent = (content: string, lineNum: number) => {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) return null;
  const line = lines[lineNum - 1];
  let x = 0, y = 0, x2 = 0, y2 = 0;
  const coordPattern = /@\((-?\d+),\s*(-?\d+)\)/;
  const match = line.match(coordPattern);
  if (match) {
    x = parseInt(match[1]);
    y = parseInt(match[2]);
  } else {
    const xMatch = line.match(/x=(-?\d+)/);
    const yMatch = line.match(/y=(-?\d+)/);
    if (xMatch) x = parseInt(xMatch[1]);
    if (yMatch) y = parseInt(yMatch[1]);
  }
  const lineEndPattern = /->\((-?\d+),\s*(-?\d+)\)/;
  const lineEndMatch = line.match(lineEndPattern);
  if (lineEndMatch) {
    x2 = parseInt(lineEndMatch[1]);
    y2 = parseInt(lineEndMatch[2]);
  } else {
    const x2Match = line.match(/x2=(-?\d+)/);
    const y2Match = line.match(/y2=(-?\d+)/);
    if (x2Match) x2 = parseInt(x2Match[1]);
    if (y2Match) y2 = parseInt(y2Match[1]);
  }
  return { x, y, x2, y2 };
};

const isEditableElement = (): boolean => {
  const activeElement = document.activeElement;
  return !!(
    activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).isContentEditable ||
      (activeElement as HTMLElement).classList?.contains('monaco-editor')
    )
  );
};

export function useEditorKeyboard({
  content,
  handleContentChange,
  handleDeleteSelected,
}: UseEditorKeyboardOptions) {
  const handleArrowKeyDown = useCallback((e: KeyboardEvent) => {
    if (isEditableElement()) return;

    const { selectedElements } = useSolarWireStore.getState();
    if (selectedElements.length === 0) return;

    let dx = 0, dy = 0;
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
      default: return;
    }
    e.preventDefault();

    let newContent = content;
    selectedElements.forEach((elementId) => {
      const elementLine = parseInt(elementId);
      if (!isNaN(elementLine)) {
        const elementData = getElementDataFromContent(newContent, elementLine);
        if (elementData) {
          if (dx !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'x', elementData.x + dx);
            if (elementData.x2) newContent = updateLineAttribute(newContent, elementLine, 'x2', elementData.x2 + dx);
          }
          if (dy !== 0) {
            newContent = updateLineAttribute(newContent, elementLine, 'y', elementData.y + dy);
            if (elementData.y2) newContent = updateLineAttribute(newContent, elementLine, 'y2', elementData.y2 + dy);
          }
        }
      }
    });
    handleContentChange?.(newContent);
  }, [content, handleContentChange]);

  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      const { selectedElements, setIsSpacePressed } = useSolarWireStore.getState();

      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
        if (!isEditableElement()) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }

      handleArrowKeyDown(e);
    };

    const handleKeyUpEvent = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        useSolarWireStore.getState().setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [handleArrowKeyDown, handleDeleteSelected]);
}
