import { RectangleElement } from '../../parser';
import { RenderContext, AbsolutePosition, ElementBounds, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, escapeHtml, getOpacityAttribute, getShadowAttribute, generateShadowFilter } from '../context';

export interface RenderResult {
  svg: string;
  bounds: ElementBounds;
  shadowFilter?: string;
}

export function renderRectangle(
  element: RectangleElement,
  context: RenderContext
): RenderResult {
  // 圆角通过 r 属性控制，r > 0 表示圆角矩形
  const r = getNumberAttribute(element.attributes, context.globalDefaults, 'r', 0);
  const isRounded = r > 0;
  
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
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);
  
  let svgParts: string[] = [];
  
  svgParts.push(`<g>`);
  
  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  const shadowFilterAttr = shadow ? ` filter="url(#shadow-${element.location?.line || 'rect'})"` : '';
  
  if (isRounded) {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${bg}" stroke="${b}" stroke-width="${s}"${opacityAttr}${shadowFilterAttr}/>`);
  } else {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" fill="${bg}" stroke="${b}" stroke-width="${s}"${opacityAttr}${shadowFilterAttr}/>`);
  }
  
  if (element.text) {
    const lines = element.text.split('\n');
    const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
    const padding = 8;
    
    let textX: number;
    let textAnchor: string;
    
    switch (align) {
      case 'start':
        textX = pos.x + padding;
        textAnchor = 'start';
        break;
      case 'end':
        textX = pos.x + w - padding;
        textAnchor = 'end';
        break;
      case 'middle':
      default:
        textX = pos.x + w / 2;
        textAnchor = 'middle';
        break;
    }
    
    const textY = pos.y + padding + fontSize;
    
    let fontStyle = '';
    if (bold) fontStyle += 'font-weight="bold" ';
    if (italic) fontStyle += 'font-style="italic" ';
    
    svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" fill="${c}" font-size="${fontSize}" ${fontStyle}>`);
    
    lines.forEach((line, i) => {
      if (i === 0) {
        svgParts.push(escapeHtml(line));
      } else {
        svgParts.push(`<tspan x="${textX}" dy="${lineHeight}">${escapeHtml(line)}</tspan>`);
      }
    });
    
    svgParts.push('</text>');
  }
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  const shadowFilter = shadow ? generateShadowFilter(shadow, element.location?.line?.toString() || 'rect') : undefined;
  
  return {
    svg: svgParts.join(''),
    bounds,
    shadowFilter,
  };
}
