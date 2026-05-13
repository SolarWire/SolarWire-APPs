import { useState, useCallback, useRef } from 'react';

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface HandleDragResult {
  start: Point;
  end: Point;
}

function computeStartDragResult(
  newX: number,
  newY: number,
  _initialStart: Point,
  initialEnd: Point
): HandleDragResult {
  const newStart = { x: newX, y: newY };
  return { start: newStart, end: { ...initialEnd } };
}

function computeEndDragResult(
  newX: number,
  newY: number,
  startCoords: Point
): HandleDragResult {
  return { start: { ...startCoords }, end: { x: newX, y: newY } };
}

interface UseLineDragOptions {
  startCoords: Point;
}

interface LineDragResult {
  start: Point;
  end: Point;
}

interface UseLineDragReturn {
  startDrag: (
    handle: 'start' | 'end',
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => void;
  updateDrag: (
    handle: 'start' | 'end',
    newX: number,
    newY: number
  ) => LineDragResult;
  endDrag: () => void;
}

export function useLineDrag(
  options: UseLineDragOptions
): UseLineDragReturn {
  const initialStartRef = useRef(options.startCoords);
  const initialEndRef = useRef<Point>({ x: 0, y: 0 });
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  const startDrag = useCallback((
    handle: 'start' | 'end',
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    setDraggingHandle(handle);
    initialStartRef.current = { x: startX, y: startY };
    initialEndRef.current = { x: endX, y: endY };
  }, []);

  const updateDrag = useCallback((
    handle: 'start' | 'end',
    newX: number,
    newY: number
  ): LineDragResult => {
    const result = handle === 'start'
      ? computeStartDragResult(newX, newY, initialStartRef.current, initialEndRef.current)
      : computeEndDragResult(newX, newY, initialStartRef.current);

    return { ...result };
  }, []);

  const endDrag = useCallback(() => {
    setDraggingHandle(null);
  }, []);

  return {
    startDrag,
    updateDrag,
    endDrag
  };
}
