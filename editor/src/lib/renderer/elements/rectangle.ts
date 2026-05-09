import { RectangleElement } from '../../parser';
import { RenderContext, ValidationContext, AbsolutePosition, ElementBounds, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, escapeHtml, getOpacityAttribute, getShadowAttribute, generateShadowFilter, getVerticalAlignAttribute, getTextDecorationAttribute, getPaddingValues, getLetterSpacingAttribute } from '../context';

export interface RenderResult {
  svg: string;
  bounds: ElementBounds;
  shadowFilter?: string;
}

export function renderRectangle(
  element: RectangleElement,
  context: RenderContext
): RenderResult {
  const vc: ValidationContext = { sourceInput: context.sourceInput, element };
  const r = getNumberAttribute(element.attributes, context.globalDefaults, 'r', 0, vc);
  const isRounded = r > 0;
  
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100, vc);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40, vc);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#ffffff', vc);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000', vc);
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333', vc);
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1, vc);
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12, vc), vc);
  const align = getAlignAttribute(element.attributes, 'start', vc);
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes, 'opacity', 1, vc);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults, vc);
  const verticalAlign = getVerticalAlignAttribute(element.attributes, 'top', vc);
  const textDecoration = getTextDecorationAttribute(element.attributes, vc);
  const padding = getPaddingValues(element.attributes, context.globalDefaults, 0, vc);
  const letterSpacing = getLetterSpacingAttribute(element.attributes, context.globalDefaults, 0, vc);
  
  let svgParts: string[] = [];
  
  svgParts.push(`<g>`);
  
  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  const shadowFilterAttr = shadow ? ` filter="url(#shadow-${element.location?.line || 'rect'})"` : '';

  const strokeOffset = s / 2;
  const rectX = pos.x + strokeOffset;
  const rectY = pos.y + strokeOffset;
  const rectW = Math.max(0, w - s);
  const rectH = Math.max(0, h - s);

  if (isRounded) {
    svgParts.push(`<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="${r}" ry="${r}" fill="${bg}" stroke="${b}" stroke-width="${s}"${opacityAttr}${shadowFilterAttr}/>`);
  } else {
    svgParts.push(`<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${bg}" stroke="${b}" stroke-width="${s}"${opacityAttr}${shadowFilterAttr}/>`);
  }
  
  if (element.text) {
    const lines = element.text.split('\n');
    const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22, vc);
    
    let textX: number;
    let textAnchor: string;
    
    switch (align) {
      case 'start':
        textX = pos.x + padding.left;
        textAnchor = 'start';
        break;
      case 'end':
        textX = pos.x + w - padding.right;
        textAnchor = 'end';
        break;
      case 'middle':
      default:
        textX = pos.x + w / 2;
        textAnchor = 'middle';
        break;
    }
    
    const totalTextHeight = (lines.length - 1) * lineHeight + fontSize;
    const baselineOffset = fontSize * 0.82;
    let textY: number;
    switch (verticalAlign) {
      case 'middle':
        textY = pos.y + padding.top + (h - padding.top - padding.bottom - totalTextHeight) / 2 + baselineOffset;
        break;
      case 'bottom':
        textY = pos.y + h - padding.bottom - totalTextHeight + baselineOffset;
        break;
      case 'top':
      default:
        textY = pos.y + padding.top + baselineOffset;
        break;
    }
    
    let fontStyle = '';
    if (bold) fontStyle += 'font-weight="bold" ';
    if (italic) fontStyle += 'font-style="italic" ';
    if (letterSpacing !== 0) fontStyle += `letter-spacing="${letterSpacing}" `;
    if (textDecoration !== 'none') fontStyle += `text-decoration="${textDecoration}" `;
    
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
