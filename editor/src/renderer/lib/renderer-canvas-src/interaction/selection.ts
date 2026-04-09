import { CanvasRenderContext, ElementBounds } from '../context';

export interface BoxSelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  bounds: ElementBounds,
  primaryColor: string
): void {
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
  ctx.restore();
}

export function renderResizeHandles(
  ctx: CanvasRenderingContext2D,
  bounds: ElementBounds,
  primaryColor: string,
  handleSize: number = 8
): void {
  const handles = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ];
  
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  
  handles.forEach(handle => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
  
  ctx.restore();
}

export function renderBoxSelection(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  primaryColor: string
): void {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const w = Math.abs(currentX - startX);
  const h = Math.abs(currentY - startY);
  
  ctx.save();
  ctx.fillStyle = `${primaryColor}20`;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function getHandleAtPosition(
  x: number,
  y: number,
  bounds: ElementBounds,
  handleSize: number = 8
): string | null {
  const handles = [
    { name: 'nw', x: bounds.x, y: bounds.y },
    { name: 'ne', x: bounds.x + bounds.width, y: bounds.y },
    { name: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ];
  
  for (const handle of handles) {
    const halfSize = handleSize / 2;
    if (
      x >= handle.x - halfSize &&
      x <= handle.x + halfSize &&
      y >= handle.y - halfSize &&
      y <= handle.y + halfSize
    ) {
      return handle.name;
    }
  }
  
  return null;
}
