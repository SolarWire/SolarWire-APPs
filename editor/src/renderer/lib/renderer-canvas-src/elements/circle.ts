import { CircleElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';
import { renderTextContent } from './rectangle';

export function renderCircle(
  element: CircleElement,
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
  
  const w = Math.max(1, getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100));
  const h = Math.max(1, getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40));
  const radius = Math.max(0.5, Math.min(w, h) / 2);
  const cx = pos.x + w / 2;
  const cy = pos.y + h / 2;
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', 'transparent');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = b;
  ctx.lineWidth = s;
  ctx.stroke();
  
  if (element.text) {
    renderTextContent(ctx, element.text, pos, w, h, {
      color: c,
      fontSize,
      align: 'middle',
      bold,
      italic
    });
  }
  
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
