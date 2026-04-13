import { RenderContext } from './context';

/**
 * 生成唯一的元素 ID
 */
export function generateElementId(context: RenderContext): string {
  return `element-${context.elementIdCounter++}`;
}

/**
 * 添加渐变定义到 context.defs
 */
export function addGradientDef(context: RenderContext, id: string): string {
  const gradientId = `gradient-${id}`;
  context.defs.push(`<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4CAF50"/><stop offset="100%" stop-color="#2196F3"/></linearGradient>`);
  return `url(#${gradientId})`;
}

/**
 * 添加阴影定义到 context.defs
 */
export function addShadowDef(context: RenderContext, id: string): string {
  const filterId = `shadow-${id}`;
  context.defs.push(`<filter id="${filterId}"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/></filter>`);
  return `url(#${filterId})`;
}

/**
 * 检查元素是否被选中
 */
export function isElementSelected(element: any, context: RenderContext, elementId: string): boolean {
  return context.selectedElementIds.some(id => 
    id === elementId || 
    id === element.location?.line?.toString() || 
    id === element.id
  );
}

/**
 * 生成调整手柄的 SVG
 */
export function generateResizeHandles(x: number, y: number, width: number, height: number, primaryColor: string): string[] {
  const handles = [
    { x: x - 4, y: y - 4, handle: 'nw' },
    { x: x + width / 2 - 4, y: y - 4, handle: 'n' },
    { x: x + width - 4, y: y - 4, handle: 'ne' },
    { x: x + width - 4, y: y + height / 2 - 4, handle: 'e' },
    { x: x + width - 4, y: y + height - 4, handle: 'se' },
    { x: x + width / 2 - 4, y: y + height - 4, handle: 's' },
    { x: x - 4, y: y + height - 4, handle: 'sw' },
    { x: x - 4, y: y + height / 2 - 4, handle: 'w' },
  ];
  
  return handles.map(handle => 
    `<rect x="${handle.x}" y="${handle.y}" width="8" height="8" fill="${primaryColor}" stroke="white" stroke-width="1" data-handle="${handle.handle}" class="resize-handle"/>`
  );
}

/**
 * 获取元素的 ARIA 角色
 */
export function getElementRole(element: any): string {
  return (element.attributes?.['role']) || (element.text === 'Button' ? 'button' : 'region');
}

/**
 * 获取元素的 ARIA 标签
 */
export function getElementAriaLabel(element: any): string {
  return element.text || 'Rectangle';
}
