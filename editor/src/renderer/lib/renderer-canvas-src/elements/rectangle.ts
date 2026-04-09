import { RectangleElement, RoundedRectangleElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';

export function renderRectangle(
  element: RectangleElement | RoundedRectangleElement,
  context: CanvasRenderContext,
  elementId: string
): ElementBounds {
  const { ctx } = context;
  const isRounded = element.type === 'rounded-rectangle';
  
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#ffffff');
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const r = isRounded ? getNumberAttribute(element.attributes, context.globalDefaults, 'r', 6) : 0;
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'middle');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.beginPath();
  if (r > 0) {
    roundRect(ctx, pos.x, pos.y, w, h, r);
  } else {
    ctx.rect(pos.x, pos.y, w, h);
  }
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = b;
  ctx.lineWidth = s;
  ctx.stroke();
  
  if (element.text) {
    renderTextContent(ctx, element.text, pos, w, h, {
      color: c,
      fontSize,
      align,
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

interface TextRenderOptions {
  color: string;
  fontSize: number;
  align: 'start' | 'middle' | 'end';
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
}

function renderTextContent(
  ctx: CanvasRenderingContext2D,
  text: string,
  pos: AbsolutePosition,
  w: number,
  h: number,
  options: TextRenderOptions
): void {
  const { color, fontSize, align, bold, italic, lineHeight = 22 } = options;
  const padding = 8;
  
  let textX: number;
  const canvasAlign: CanvasTextAlign = align === 'middle' ? 'center' : align;
  ctx.textAlign = canvasAlign;
  
  switch (align) {
    case 'start':
      textX = pos.x + padding;
      break;
    case 'end':
      textX = pos.x + w - padding;
      break;
    case 'middle':
    default:
      textX = pos.x + w / 2;
      break;
  }
  
  const lines = text.split('\n');
  const totalHeight = lines.length * lineHeight;
  const startY = pos.y + (h - totalHeight) / 2 + lineHeight / 2 + fontSize / 3;
  
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, startY + i * lineHeight);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export { renderTextContent };
