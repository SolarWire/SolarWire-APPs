/**
 * 坐标系统Hook
 * 提供统一的坐标转换功能
 */
import { useCallback, useRef } from 'react';
import { screenToWorld, worldToScreen, svgToWorld, worldToSvg, getTransformString } from '../utils/coordinate-utils';

interface UseCoordinateSystemOptions {
  position: { x: number; y: number };
  scale: number;
}

interface UseCoordinateSystemReturn {
  getWorldCoords: (clientX: number, clientY: number) => { x: number; y: number };
  getScreenCoords: (worldX: number, worldY: number) => { x: number; y: number };
  getSvgCoords: (clientX: number, clientY: number) => { x: number; y: number };
  getTransform: () => string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useCoordinateSystem({
  position,
  scale
}: UseCoordinateSystemOptions): UseCoordinateSystemReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  const getWorldCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = containerRef.current.getBoundingClientRect();
      return screenToWorld(clientX, clientY, rect, position, scale);
    },
    [position, scale]
  );

  const getScreenCoords = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }
      const rect = containerRef.current.getBoundingClientRect();
      return worldToScreen(worldX, worldY, rect, position, scale);
    },
    [position, scale]
  );

  const getSvgCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const worldCoords = getWorldCoords(clientX, clientY);
      return worldToSvg(worldCoords.x, worldCoords.y);
    },
    [getWorldCoords]
  );

  const getTransform = useCallback((): string => {
    return getTransformString(position, scale);
  }, [position, scale]);

  return {
    getWorldCoords,
    getScreenCoords,
    getSvgCoords,
    getTransform,
    containerRef
  };
}