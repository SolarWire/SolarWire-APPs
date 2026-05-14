import { ViewportManager } from './ViewportManager';

export { ViewportManager } from './ViewportManager';

export function screenToWorld(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  viewport: ViewportManager
): { x: number; y: number } {
  const viewportX = clientX - containerRect.left;
  const viewportY = clientY - containerRect.top;
  return viewport.toWorldPoint(viewportX, viewportY);
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  containerRect: DOMRect,
  viewport: ViewportManager
): { x: number; y: number } {
  const vp = viewport.toViewportPoint(worldX, worldY);
  return {
    x: vp.x + containerRect.left,
    y: vp.y + containerRect.top
  };
}

export function svgToWorld(svgX: number, svgY: number): { x: number; y: number } {
  return { x: svgX, y: svgY };
}

export function worldToSvg(worldX: number, worldY: number): { x: number; y: number } {
  return { x: worldX, y: worldY };
}

export function getTransformString(position: { x: number; y: number }, scale: number): string {
  return new ViewportManager(position, scale).getTransformString();
}
