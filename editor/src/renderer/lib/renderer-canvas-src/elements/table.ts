import { TableElement, TableRowElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';

export function renderTable(
  element: TableElement,
  context: CanvasRenderContext,
  elementId: string
): ElementBounds {
  const { ctx } = context;
  
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 200);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 100);
  const border = getColorAttribute(element.attributes, context.globalDefaults, 'border', '#333333');
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#ffffff');
  const headerBg = getColorAttribute(element.attributes, context.globalDefaults, 'header-bg', '#f0f0f0');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const opacity = getOpacityAttribute(element.attributes);
  
  const rows: TableRowElement[] = element.children || [];
  const cols = rows.length > 0 ? rows[0].children.length : 2;
  const cellWidth = w / Math.max(cols, 1);
  const rowHeight = h / Math.max(rows.length, 1);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.fillStyle = bg;
  ctx.fillRect(pos.x, pos.y, w, h);
  
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= rows.length; i++) {
    const y = pos.y + i * rowHeight;
    ctx.beginPath();
    ctx.moveTo(pos.x, y);
    ctx.lineTo(pos.x + w, y);
    ctx.stroke();
  }
  
  for (let i = 0; i <= cols; i++) {
    const x = pos.x + i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, pos.y);
    ctx.lineTo(x, pos.y + h);
    ctx.stroke();
  }
  
  if (rows.length > 0) {
    ctx.fillStyle = headerBg;
    ctx.fillRect(pos.x, pos.y, w, rowHeight);
  }
  
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  rows.forEach((row: TableRowElement, rowIndex: number) => {
    row.children.forEach((cell: any, colIndex: number) => {
      const cellX = pos.x + colIndex * cellWidth + cellWidth / 2;
      const cellY = pos.y + rowIndex * rowHeight + rowHeight / 2;
      const cellText = cell.text || '';
      ctx.fillText(cellText, cellX, cellY);
    });
  });
  
  ctx.strokeRect(pos.x, pos.y, w, h);
  
  ctx.restore();
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  context.elementBoundsMap.set(elementId, bounds);
  
  return bounds;
}
