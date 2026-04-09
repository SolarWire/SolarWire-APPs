import { PlaceholderElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';
import { renderTextContent } from './rectangle';

export function renderPlaceholder(
  element: PlaceholderElement,
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
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#f0f0f0');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#999999');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#999999');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.fillStyle = bg;
  ctx.strokeStyle = b;
  ctx.lineWidth = s;
  ctx.fillRect(pos.x, pos.y, w, h);
  ctx.strokeRect(pos.x, pos.y, w, h);
  
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x + w, pos.y + h);
  ctx.moveTo(pos.x + w, pos.y);
  ctx.lineTo(pos.x, pos.y + h);
  ctx.stroke();
  
  const text = element.text || 'Placeholder';
  renderTextContent(ctx, text, pos, w, h, {
    color: c,
    fontSize,
    align: 'middle'
  });
  
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
