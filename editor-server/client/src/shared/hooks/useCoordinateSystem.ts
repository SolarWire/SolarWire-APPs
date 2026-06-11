import { useCallback, useRef, useMemo } from 'react';
import { ViewportManager, screenToWorld, worldToScreen } from '../utils/coordinate-utils';

interface UseCoordinateSystemOptions {
  position: { x: number; y: number };
  scale: number;
  viewBoxOffset?: { x: number; y: number };
}

interface UseCoordinateSystemReturn {
  viewport: ViewportManager;
  getWorldCoords: (clientX: number, clientY: number) => { x: number; y: number };
  getScreenCoords: (worldX: number, worldY: number) => { x: number; y: number };
  getSvgCoords: (clientX: number, clientY: number) => { x: number; y: number };
  getTransform: () => string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useCoordinateSystem({
  position,
  scale,
  viewBoxOffset = { x: 0, y: 0 }
}: UseCoordinateSystemOptions): UseCoordinateSystemReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  const viewport = useMemo(
    () => new ViewportManager(position, scale, viewBoxOffset),
    [position.x, position.y, scale, viewBoxOffset.x, viewBoxOffset.y]
  );

  const getWorldCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = containerRef.current.getBoundingClientRect();
      return screenToWorld(clientX, clientY, rect, viewport);
    },
    [viewport]
  );

  const getScreenCoords = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = containerRef.current.getBoundingClientRect();
      return worldToScreen(worldX, worldY, rect, viewport);
    },
    [viewport]
  );

  const getSvgCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      return getWorldCoords(clientX, clientY);
    },
    [getWorldCoords]
  );

  const getTransform = useCallback((): string => {
    return viewport.getTransformString();
  }, [viewport]);

  return {
    viewport,
    getWorldCoords,
    getScreenCoords,
    getSvgCoords,
    getTransform,
    containerRef
  };
}
