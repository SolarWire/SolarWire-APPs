import { useCallback, useEffect } from 'react';
import { usePreviewStore } from '../../../stores/previewStore';

interface UseCanvasViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isInitialized: boolean;
  setIsInitialized: (v: boolean) => void;
  svg: string;
  onContainerResize: (size: { width: number; height: number }) => void;
}

interface UseCanvasViewportReturn {
  fitToScreen: () => void;
  handleWheel: (e: React.WheelEvent) => void;
}

export function useCanvasViewport({
  containerRef,
  isInitialized,
  setIsInitialized,
  svg,
  onContainerResize,
}: UseCanvasViewportOptions): UseCanvasViewportReturn {
  const setScale = usePreviewStore(s => s.setScale);
  const setPosition = usePreviewStore(s => s.setPosition);

  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      setScale(0.5);
      setPosition({ x: 100, y: 100 });
      setIsInitialized(true);
    }
  }, [setScale, setPosition, setIsInitialized]);

  useEffect(() => {
    if (svg && containerRef.current && !isInitialized) {
      setTimeout(fitToScreen, 50);
    }
  }, [svg, fitToScreen, isInitialized]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onContainerResize({ width: Math.round(width), height: Math.round(height) });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onContainerResize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentScale = usePreviewStore.getState().scale;
      const currentPosition = usePreviewStore.getState().position;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, currentScale * delta));

      const scaleRatio = newScale / currentScale;
      const newX = mouseX - (mouseX - currentPosition.x) * scaleRatio;
      const newY = mouseY - (mouseY - currentPosition.y) * scaleRatio;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
      setIsInitialized(true);
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [setScale, setPosition, setIsInitialized]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const currentScale = usePreviewStore.getState().scale;
    const currentPosition = usePreviewStore.getState().position;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, currentScale * delta));

    const scaleRatio = newScale / currentScale;
    const newX = mouseX - (mouseX - currentPosition.x) * scaleRatio;
    const newY = mouseY - (mouseY - currentPosition.y) * scaleRatio;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
    setIsInitialized(true);
  }, [setScale, setPosition, setIsInitialized]);

  return { fitToScreen, handleWheel };
}
