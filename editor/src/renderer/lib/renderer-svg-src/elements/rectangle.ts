import { RectangleElement, RoundedRectangleElement } from '../../parser-src';
import { RenderContext, AbsolutePosition, ElementBounds, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, escapeHtml, getOpacityAttribute } from '../context';

export interface RenderResult {
  svg: string;
  bounds: ElementBounds;
}

export function renderRectangle(
  element: RectangleElement | RoundedRectangleElement,
  context: RenderContext
): RenderResult {
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
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes);
  
  // Advanced styles
  const gradient = element.attributes['gradient'];
  const shadow = element.attributes['shadow'];
  const borderColor = getColorAttribute(element.attributes, context.globalDefaults, 'border-color', b);
  const borderWidth = getNumberAttribute(element.attributes, context.globalDefaults, 'border-width', s);
  
  let svgParts: string[] = [];
  
  const elementId = `element-${context.elementIdCounter++}`;
  // 检查元素是否被选中（支持不同格式的 ID）
  const isSelected = context.selectedElementIds.some(id => 
    id === elementId || 
    id === element.location?.line?.toString() || 
    id === (element as any).id
  );
  
  // Add accessibility attributes
  const ariaLabel = element.text || 'Rectangle';
  const role = element.attributes['role'] || (element.text === 'Button' ? 'button' : 'region');
  
  let groupClass = 'svg-element';
  if (isSelected) {
    groupClass += ' selected';
  }
  
  svgParts.push(`<g data-element-id="${elementId}" data-line="${element.line || 1}" class="${groupClass}" role="${role}" aria-label="${escapeHtml(ariaLabel)}" tabindex="0" draggable="true">`);
  
  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  
  // Handle gradient fill
  let fill = bg;
  if (gradient) {
    const gradientId = `gradient-${elementId}`;
    context.defs.push(`<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#2196F3"/></linearGradient>`);
    fill = `url(#${gradientId})`;
  }
  
  // Handle shadow effect
  let filterAttr = '';
  if (shadow) {
    const filterId = `shadow-${elementId}`;
    context.defs.push(`<filter id="${filterId}"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/></filter>`);
    filterAttr = ` filter="url(#${filterId})"`;
  }
  
  if (isRounded) {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${borderColor}" stroke-width="${borderWidth}"${opacityAttr}${filterAttr}/>`);
  } else {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" fill="${fill}" stroke="${borderColor}" stroke-width="${borderWidth}"${opacityAttr}${filterAttr}/>`);
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
  
  // Add resize handles for selected elements
  if (isSelected) {
    const handles = [
      { x: pos.x - 4, y: pos.y - 4, handle: 'nw' },
      { x: pos.x + w / 2 - 4, y: pos.y - 4, handle: 'n' },
      { x: pos.x + w - 4, y: pos.y - 4, handle: 'ne' },
      { x: pos.x + w - 4, y: pos.y + h / 2 - 4, handle: 'e' },
      { x: pos.x + w - 4, y: pos.y + h - 4, handle: 'se' },
      { x: pos.x + w / 2 - 4, y: pos.y + h - 4, handle: 's' },
      { x: pos.x - 4, y: pos.y + h - 4, handle: 'sw' },
      { x: pos.x - 4, y: pos.y + h / 2 - 4, handle: 'w' },
    ];
    
    handles.forEach(handle => {
      svgParts.push(`<rect x="${handle.x}" y="${handle.y}" width="8" height="8" fill="${context.primaryColor}" stroke="white" stroke-width="1" data-handle="${handle.handle}" class="resize-handle"/>`);
    });
  }
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts.push(`<title>${escapeHtml(note)}</title>`);
  }
  
  svgParts.push(`</g>`);
  
  return {
    svg: svgParts.join(''),
    bounds,
  };
}
