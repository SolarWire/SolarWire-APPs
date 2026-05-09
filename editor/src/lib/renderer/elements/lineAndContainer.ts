import { LineElement, Element } from '../../parser';
import { RenderContext, ValidationContext, AbsolutePosition, ElementBounds, calculatePosition, calculateLineEnd, getNumberAttribute, getColorAttribute, getStyleAttribute, updateLastElementBounds, escapeHtml } from '../context';
import { RenderResult } from './rectangle';

export function renderLine(element: LineElement, context: RenderContext): RenderResult {
  const start = calculatePosition(context, element.start);
  const end = calculateLineEnd(context, start, element.end);
  const vc: ValidationContext = { sourceInput: context.sourceInput, element };
  
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#333333', vc);
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1, vc);
  const style = getStyleAttribute(element.attributes, vc);
  const textSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12, vc), vc);
  const textColor = getColorAttribute(element.attributes, context.globalDefaults, 'text-color', '#333333', vc);
  const note = element.attributes['note'];
  
  let svgParts: string[] = [];
  
  svgParts.push(`<g pointer-events="stroke">`);

  let strokeDasharray = '';
  if (style.strokeDasharray) {
    strokeDasharray = ` stroke-dasharray="${style.strokeDasharray}"`;
  }

  // 添加透明的宽线段作为点击检测区域（实际宽度 + 6px，上下各 3px）
  const hitAreaWidth = Math.max(6, s + 6);
  svgParts.push(`<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="transparent" stroke-width="${hitAreaWidth}" pointer-events="stroke"/>`);

  // 实际显示的线段
  svgParts.push(`<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${c}" stroke-width="${s}"${strokeDasharray}/>`);
  
  if (element.label) {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const labelPadding = 4;
    const labelWidth = element.label.length * textSize * 0.6 + labelPadding * 2;
    const labelHeight = textSize + labelPadding * 2;
    
    svgParts.push(`<rect x="${midX - labelWidth / 2}" y="${midY - labelHeight / 2}" width="${labelWidth}" height="${labelHeight}" fill="white" stroke="none"/>`);
    svgParts.push(`<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="${textSize}">${escapeHtml(element.label)}</text>`);
  }
  
  const bounds: ElementBounds = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  return {
    svg: svgParts.join(''),
    bounds,
  };
}
