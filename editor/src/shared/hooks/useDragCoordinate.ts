import { useState, useCallback, useRef } from 'react';
import { absoluteToRelative } from '../utils/line-coordinate-utils';
import type { CoordinateType } from '../utils/line-coordinate-utils';

const COORDINATE_MODE = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
} as const;

const HANDLE_TYPE = {
  START: 'start',
  END: 'end',
} as const;

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDragCoordinateOptions {
  initialMode: CoordinateType;
  referenceBounds?: ElementBounds;
}

interface DragCoordinateState {
  mode: CoordinateType;
  initialAbsolute: { x: number; y: number };
  initialRelative?: { dx: number; dy: number };
  referenceBounds?: ElementBounds;
}

interface DragCoordinateResult {
  x: number;
  y: number;
  isRelative: boolean;
}

interface UseDragCoordinateReturn {
  state: DragCoordinateState | null;
  startDrag: (
    x: number,
    y: number,
    referenceBounds?: ElementBounds
  ) => void;
  updateDrag: (newX: number, newY: number) => DragCoordinateResult;
  endDrag: () => void;
  setMode: (mode: CoordinateType) => void;
  mode: CoordinateType;
}

function absoluteFallback(x: number, y: number): DragCoordinateResult {
  return { x, y, isRelative: false };
}

export function useDragCoordinate(
  options: UseDragCoordinateOptions
): UseDragCoordinateReturn {
  const [state, setState] = useState<DragCoordinateState | null>(null);
  const modeRef = useRef<CoordinateType>(options.initialMode);

  const startDrag = useCallback((
    x: number,
    y: number,
    referenceBounds?: ElementBounds
  ) => {
    const initialRelative = referenceBounds
      ? absoluteToRelative({ x, y }, referenceBounds)
      : undefined;

    setState({
      mode: modeRef.current,
      initialAbsolute: { x, y },
      initialRelative,
      referenceBounds
    });
  }, []);

  const updateDrag = useCallback((newX: number, newY: number): DragCoordinateResult => {
    if (!state) return absoluteFallback(newX, newY);
    if (state.mode === COORDINATE_MODE.ABSOLUTE) return absoluteFallback(newX, newY);
    if (!state.referenceBounds) return absoluteFallback(newX, newY);

    const newRelative = absoluteToRelative({ x: newX, y: newY }, state.referenceBounds);
    return { x: newRelative.dx, y: newRelative.dy, isRelative: true };
  }, [state]);

  const endDrag = useCallback(() => {
    setState(null);
  }, []);

  const setMode = useCallback((mode: CoordinateType) => {
    modeRef.current = mode;
    if (state) {
      setState({ ...state, mode });
    }
  }, [state]);

  return {
    state,
    startDrag,
    updateDrag,
    endDrag,
    setMode,
    mode: modeRef.current
  };
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
  initialStart: Point,
  initialEnd: Point,
  endMode: CoordinateType
): HandleDragResult {
  const newStart = { x: newX, y: newY };
  if (endMode !== COORDINATE_MODE.RELATIVE) {
    return { start: newStart, end: { ...initialEnd } };
  }
  const dx = initialEnd.x - initialStart.x;
  const dy = initialEnd.y - initialStart.y;
  return { start: newStart, end: { x: newX + dx, y: newY + dy } };
}

function computeEndDragResult(
  newX: number,
  newY: number,
  startCoords: Point,
  endMode: CoordinateType
): HandleDragResult {
  if (endMode === COORDINATE_MODE.RELATIVE) {
    return {
      start: { ...startCoords },
      end: { x: newX - startCoords.x, y: newY - startCoords.y }
    };
  }
  return { start: { ...startCoords }, end: { x: newX, y: newY } };
}

interface UseLineDragOptions {
  startMode: CoordinateType;
  endMode: CoordinateType;
  startCoords: Point;
}

interface LineDragResult {
  start: Point;
  end: Point;
  startIsRelative: boolean;
  endIsRelative: boolean;
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
  setStartMode: (mode: CoordinateType) => void;
  setEndMode: (mode: CoordinateType) => void;
}

export function useLineDrag(
  options: UseLineDragOptions
): UseLineDragReturn {
  const startModeRef = useRef<CoordinateType>(options.startMode);
  const endModeRef = useRef<CoordinateType>(options.endMode);
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
    const endMode = endModeRef.current;
    const result = handle === HANDLE_TYPE.START
      ? computeStartDragResult(newX, newY, initialStartRef.current, initialEndRef.current, endMode)
      : computeEndDragResult(newX, newY, initialStartRef.current, endMode);

    return {
      ...result,
      startIsRelative: startModeRef.current === COORDINATE_MODE.RELATIVE,
      endIsRelative: endMode === COORDINATE_MODE.RELATIVE
    };
  }, []);

  const endDrag = useCallback(() => {
    setDraggingHandle(null);
  }, []);

  const setStartMode = useCallback((mode: CoordinateType) => {
    startModeRef.current = mode;
  }, []);

  const setEndMode = useCallback((mode: CoordinateType) => {
    endModeRef.current = mode;
  }, []);

  return {
    startDrag,
    updateDrag,
    endDrag,
    setStartMode,
    setEndMode
  };
}
