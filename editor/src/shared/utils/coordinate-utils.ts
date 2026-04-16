/**
 * 坐标工具函数
 * 提供屏幕坐标、世界坐标、SVG坐标之间的转换
 */

/**
 * 屏幕坐标转世界坐标
 * @param clientX 屏幕X坐标
 * @param clientY 屏幕Y坐标
 * @param containerRect 容器边界
 * @param position 视口位置
 * @param scale 缩放比例
 * @returns 世界坐标 {x, y}
 */
export function screenToWorld(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  position: { x: number; y: number },
  scale: number
): { x: number; y: number } {
  return {
    x: (clientX - containerRect.left - position.x) / scale,
    y: (clientY - containerRect.top - position.y) / scale
  };
}

/**
 * 世界坐标转屏幕坐标
 * @param worldX 世界X坐标
 * @param worldY 世界Y坐标
 * @param containerRect 容器边界
 * @param position 视口位置
 * @param scale 缩放比例
 * @returns 屏幕坐标 {x, y}
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  containerRect: DOMRect,
  position: { x: number; y: number },
  scale: number
): { x: number; y: number } {
  return {
    x: worldX * scale + position.x + containerRect.left,
    y: worldY * scale + position.y + containerRect.top
  };
}

/**
 * SVG坐标转世界坐标
 * @param svgX SVG X坐标
 * @param svgY SVG Y坐标
 * @returns 世界坐标 {x, y}
 */
export function svgToWorld(svgX: number, svgY: number): { x: number; y: number } {
  // SVG坐标与世界坐标在当前实现中是一致的
  return { x: svgX, y: svgY };
}

/**
 * 世界坐标转SVG坐标
 * @param worldX 世界X坐标
 * @param worldY 世界Y坐标
 * @returns SVG坐标 {x, y}
 */
export function worldToSvg(worldX: number, worldY: number): { x: number; y: number } {
  // SVG坐标与世界坐标在当前实现中是一致的
  return { x: worldX, y: worldY };
}

/**
 * 计算视口变换矩阵
 * @param position 视口位置
 * @param scale 缩放比例
 * @returns CSS transform 字符串
 */
export function getTransformString(position: { x: number; y: number }, scale: number): string {
  return `translate(${position.x}px, ${position.y}px) scale(${scale})`;
}