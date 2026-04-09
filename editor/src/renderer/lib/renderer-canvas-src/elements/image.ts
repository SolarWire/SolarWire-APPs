import { ImageElement } from '../../parser-src';
import { CanvasRenderContext, ElementBounds, AbsolutePosition, calculatePosition, getNumberAttribute, getColorAttribute, updateLastElementBounds, getOpacityAttribute } from '../context';

const imageCache = new Map<string, HTMLImageElement>();

export function renderImage(
  element: ImageElement,
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
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 80);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#f0f0f0');
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#999999');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const opacity = getOpacityAttribute(element.attributes);
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  ctx.fillStyle = bg;
  ctx.fillRect(pos.x, pos.y, w, h);
  
  const iconSize = Math.min(w, h) * 0.3;
  const iconX = pos.x + w / 2;
  const iconY = pos.y + h / 2 - fontSize;
  
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  
  ctx.strokeRect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
  
  ctx.beginPath();
  ctx.moveTo(iconX - iconSize * 0.3, iconY - iconSize * 0.1);
  ctx.lineTo(iconX, iconY + iconSize * 0.2);
  ctx.lineTo(iconX + iconSize * 0.3, iconY - iconSize * 0.1);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(iconX - iconSize * 0.15, iconY - iconSize * 0.15, iconSize * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = c;
  ctx.fill();
  
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = c;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Image', pos.x + w / 2, pos.y + h / 2 + fontSize);
  
  const cachedImage = imageCache.get(element.url);
  if (cachedImage && cachedImage.complete) {
    ctx.drawImage(cachedImage, pos.x, pos.y, w, h);
  } else if (!cachedImage) {
    const img = new Image();
    img.onload = () => {
      imageCache.set(element.url, img);
    };
    img.src = element.url;
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
