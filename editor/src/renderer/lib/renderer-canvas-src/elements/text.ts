import { TextElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';

export function renderText(
  element: TextElement,
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
  
  const lines = element.text.split('\n');
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 0);
  const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  const canvasAlign: CanvasTextAlign = align === 'middle' ? 'center' : align;
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = c;
  ctx.textBaseline = 'top';
  ctx.textAlign = canvasAlign;
  
  let textX = pos.x;
  if (align === 'middle') {
    textX = pos.x + (w || 100) / 2;
  } else if (align === 'end') {
    textX = pos.x + (w || 100);
  }
  
  const textY = pos.y;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textY + i * lineHeight);
  });
  
  ctx.restore();
  
  const estimatedWidth = w || (lines.length > 0 ? Math.max(...lines.map(l => ctx.measureText(l).width)) : 100);
  const estimatedHeight = lines.length > 0 ? lines.length * lineHeight : fontSize;
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: estimatedWidth,
    height: estimatedHeight,
  };
  
  updateLastElementBounds(context, bounds);
  context.elementBoundsMap.set(elementId, bounds);
  
  return bounds;
}
