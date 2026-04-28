/**
 * 拖动坐标处理 Hook
 * 处理拖动时的相对坐标保持逻辑
 */

import { useState, useCallback, useRef } from 'react';
import { absoluteToRelative, relativeToAbsolute } from '../utils/coordinate-converter';

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDragCoordinateOptions {
  initialMode: 'absolute' | 'relative';
  referenceBounds?: ElementBounds;
}

interface DragCoordinateState {
  mode: 'absolute' | 'relative';
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
  setMode: (mode: 'absolute' | 'relative') => void;
  mode: 'absolute' | 'relative';
}

/**
 * 拖动坐标处理 Hook
 * @param options 初始配置
 * @returns 拖动坐标处理接口
 */
export function useDragCoordinate(
  options: UseDragCoordinateOptions
): UseDragCoordinateReturn {
  const [state, setState] = useState<DragCoordinateState | null>(null);
  const modeRef = useRef<'absolute' | 'relative'>(options.initialMode);

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
    if (!state) {
      return { x: newX, y: newY, isRelative: false };
    }

    if (state.mode === 'absolute') {
      // 绝对模式：直接返回新坐标
      return { x: newX, y: newY, isRelative: false };
    } else {
      // 相对模式：计算相对于参考点的偏移
      if (state.referenceBounds) {
        const newRelative = absoluteToRelative({ x: newX, y: newY }, state.referenceBounds);
        return {
          x: newRelative.dx,
          y: newRelative.dy,
          isRelative: true
        };
      }
      // 没有参考点时，回退到绝对模式
      return { x: newX, y: newY, isRelative: false };
    }
  }, [state]);

  const endDrag = useCallback(() => {
    setState(null);
  }, []);

  const setMode = useCallback((mode: 'absolute' | 'relative') => {
    modeRef.current = mode;
    if (state) {
      setState({
        ...state,
        mode
      });
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

/**
 * 线段拖动处理 Hook
 * 处理线段起点和终点的独立拖动逻辑
 */
interface UseLineDragOptions {
  startMode: 'absolute' | 'relative';
  endMode: 'absolute' | 'relative';
  startCoords: { x: number; y: number };
}

interface LineDragResult {
  start: { x: number; y: number };
  end: { x: number; y: number };
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
  setStartMode: (mode: 'absolute' | 'relative') => void;
  setEndMode: (mode: 'absolute' | 'relative') => void;
}

/**
 * 线段拖动处理 Hook
 * @param options 初始配置
 * @returns 线段拖动处理接口
 */
export function useLineDrag(
  options: UseLineDragOptions
): UseLineDragReturn {
  const startModeRef = useRef<'absolute' | 'relative'>(options.startMode);
  const endModeRef = useRef<'absolute' | 'relative'>(options.endMode);
  const initialStartRef = useRef(options.startCoords);
  const initialEndRef = useRef({ x: 0, y: 0 });
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
    let newStart = { ...initialStartRef.current };
    let newEnd = { ...initialEndRef.current };

    if (handle === 'start') {
      // 拖动起点
      newStart = { x: newX, y: newY };
      
      // 如果终点是相对坐标，保持相对偏移不变
      if (endModeRef.current === 'relative') {
        const dx = initialEndRef.current.x - initialStartRef.current.x;
        const dy = initialEndRef.current.y - initialStartRef.current.y;
        newEnd = {
          x: newX + dx,
          y: newY + dy
        };
      }
    } else if (handle === 'end') {
      // 拖动终点
      if (endModeRef.current === 'relative') {
        // 相对模式：计算相对于起点的偏移
        newEnd = {
          x: newX - newStart.x,
          y: newY - newStart.y
        };
      } else {
        // 绝对模式：直接设置终点坐标
        newEnd = { x: newX, y: newY };
      }
    }

    return {
      start: newStart,
      end: newEnd,
      startIsRelative: startModeRef.current === 'relative',
      endIsRelative: endModeRef.current === 'relative'
    };
  }, []);

  const endDrag = useCallback(() => {
    setDraggingHandle(null);
  }, []);

  const setStartMode = useCallback((mode: 'absolute' | 'relative') => {
    startModeRef.current = mode;
  }, []);

  const setEndMode = useCallback((mode: 'absolute' | 'relative') => {
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
