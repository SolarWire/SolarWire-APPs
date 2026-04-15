import { LineElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, calculateLineEnd, getNumberAttribute, getColorAttribute, getStyleAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';

export function renderLine(
  element: LineElement,
  context: CanvasRenderContext,
  elementId: string
): ElementBounds {
  const { ctx } = context;
  
  const start = calculatePosition(context, element.start);
  const end = calculateLineEnd(context, start, element.end);
  
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const style = getStyleAttribute(element.attributes);
  const textSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const textColor = getColorAttribute(element.attributes, context.globalDefaults, 'text-color', '#333333');
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = c;
  ctx.lineWidth = s;
  
  if (style.strokeDasharray) {
    ctx.setLineDash(style.strokeDasharray);
  }
  
  ctx.stroke();
  
  if (element.label) {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const labelPadding = 4;
    const labelWidth = element.label.length * textSize * 0.6 + labelPadding * 2;
    const labelHeight = textSize + labelPadding * 2;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
    
    ctx.font = `${textSize}px Arial, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.label, midX, midY);
  }
  
  ctx.restore();
  
  const bounds: ElementBounds = {
    x: start.x,
    y: start.y,
    x2: end.x,
    y2: end.y,
    width: Math.abs(end.x - start.x) || 2,
    height: Math.abs(end.y - start.y) || 2,
  };
  
  updateLastElementBounds(context, {
    x: end.x,
    y: end.y,
    width: 0,
    height: 0,
  });
  
  context.elementBoundsMap.set(elementId, bounds);
  
  return bounds;
}
