/**
 * 坐标转换工具函数
 * 提供绝对坐标和相对坐标之间的转换，以及坐标标准化功能
 */

import type { Coordinate, Element } from '../../lib/parser/types';

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 将绝对坐标转换为相对坐标（相对于参考点）
 * @param absolute 绝对坐标 { x, y }
 * @param reference 参考点坐标 { x, y }
 * @returns 相对偏移 { dx, dy }
 */
export function absoluteToRelative(
  absolute: { x: number; y: number },
  reference: { x: number; y: number }
): { dx: number; dy: number } {
  return {
    dx: absolute.x - reference.x,
    dy: absolute.y - reference.y
  };
}

/**
 * 将相对坐标转换为绝对坐标
 * @param relative 相对偏移 { dx, dy }
 * @param reference 参考点坐标 { x, y }
 * @returns 绝对坐标 { x, y }
 */
export function relativeToAbsolute(
  relative: { dx: number; dy: number },
  reference: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: reference.x + relative.dx,
    y: reference.y + relative.dy
  };
}

/**
 * 标准化坐标：将任意坐标类型转换为绝对值
 * @param coord 坐标对象（absolute/relative/edge）
 * @param referenceBounds 参考元素边界（用于 edge 坐标）
 * @param defaultValue 默认值
 * @returns 绝对值
 */
export function normalizeCoordinate(
  coord: Coordinate,
  referenceBounds: ElementBounds | null,
  defaultValue: number = 0
): number {
  switch (coord.type) {
    case 'absolute':
      return coord.value;
    
    case 'relative':
      // 相对坐标需要参考点，这里返回相对值本身
      // 实际使用时需要加上参考点的坐标
      return coord.value;
    
    case 'edge':
      if (!referenceBounds) {
        return defaultValue;
      }
      switch (coord.direction) {
        case 'L': return referenceBounds.x + coord.value;
        case 'R': return referenceBounds.x + referenceBounds.width + coord.value;
        case 'T': return referenceBounds.y + coord.value;
        case 'B': return referenceBounds.y + referenceBounds.height + coord.value;
        case 'C': return referenceBounds.x + referenceBounds.width / 2 + coord.value;
        default: return defaultValue;
      }
    
    default:
      const exhaustiveCheck: never = coord;
      throw new Error(`Unknown coordinate type: ${(exhaustiveCheck as any).type}`);
  }
}

/**
 * 获取元素的边界信息
 * @param element 元素对象
 * @param lastElementBounds 上一个元素的边界（用于相对坐标计算）
 * @returns 元素边界
 */
export function getElementBounds(
  element: Element,
  lastElementBounds: ElementBounds | null = null
): ElementBounds {
  const attrs = element.attributes;
  
  // 处理坐标
  let x = 0, y = 0;
  if (element.coordinates) {
    x = normalizeCoordinate(element.coordinates.x, lastElementBounds, 0);
    y = normalizeCoordinate(element.coordinates.y, lastElementBounds, 0);
  }
  
  // 处理尺寸
  const w = parseInt(attrs.w) || 100;
  const h = parseInt(attrs.h) || 100;
  
  return { x, y, width: w, height: h };
}

/**
 * 获取线段元素的起点坐标
 * @param lineElement 线段元素
 * @returns 起点坐标 { x, y }
 */
export function getLineStartCoords(lineElement: Element): { x: number; y: number } {
  if (lineElement.type !== 'line') {
    return { x: 0, y: 0 };
  }
  
  const lineEl = lineElement as any;
  let x = 0, y = 0;
  
  if (lineEl.start) {
    if (lineEl.start.x.type === 'absolute') {
      x = lineEl.start.x.value;
    }
    if (lineEl.start.y.type === 'absolute') {
      y = lineEl.start.y.value;
    }
  }
  
  return { x, y };
}

/**
 * 获取线段元素的终点坐标
 * @param lineElement 线段元素
 * @param startCoords 起点坐标（用于计算相对终点）
 * @returns 终点坐标 { x, y }
 */
export function getLineEndCoords(
  lineElement: Element,
  startCoords: { x: number; y: number }
): { x: number; y: number } {
  if (lineElement.type !== 'line') {
    return { x: 0, y: 0 };
  }
  
  const lineEl = lineElement as any;
  
  if (!lineEl.end) {
    // 默认终点
    return { x: startCoords.x + 100, y: startCoords.y };
  }
  
  // 检查是否是相对坐标
  if ('dx' in lineEl.end && 'dy' in lineEl.end) {
    return {
      x: startCoords.x + lineEl.end.dx,
      y: startCoords.y + lineEl.end.dy
    };
  }
  
  // 绝对坐标
  let x = 0, y = 0;
  if (lineEl.end.x.type === 'absolute') {
    x = lineEl.end.x.value;
  }
  if (lineEl.end.y.type === 'absolute') {
    y = lineEl.end.y.value;
  }
  
  return { x, y };
}

/**
 * 将元素坐标更新为新的绝对坐标
 * @param element 元素对象
 * @param newX 新的 X 坐标
 * @param newY 新的 Y 坐标
 * @returns 更新后的元素对象（浅拷贝）
 */
export function updateElementCoordinates(
  element: Element,
  newX: number,
  newY: number
): Element {
  return {
    ...element,
    coordinates: {
      x: { type: 'absolute', value: newX },
      y: { type: 'absolute', value: newY }
    }
  };
}

/**
 * 将线段终点更新为相对偏移
 * @param lineElement 线段元素
 * @param dx X 方向偏移
 * @param dy Y 方向偏移
 * @returns 更新后的线段元素
 */
export function updateLineEndRelative(
  lineElement: Element,
  dx: number,
  dy: number
): Element {
  if (lineElement.type !== 'line') {
    return lineElement;
  }
  
  const lineEl = lineElement as any;
  return {
    ...lineEl,
    end: { type: 'relative', dx, dy }
  } as Element;
}

/**
 * 将线段终点更新为绝对坐标
 * @param lineElement 线段元素
 * @param x 终点 X 坐标
 * @param y 终点 Y 坐标
 * @returns 更新后的线段元素
 */
export function updateLineEndAbsolute(
  lineElement: Element,
  x: number,
  y: number
): Element {
  if (lineElement.type !== 'line') {
    return lineElement;
  }
  
  const lineEl = lineElement as any;
  return {
    ...lineEl,
    end: {
      x: { type: 'absolute', value: x },
      y: { type: 'absolute', value: y }
    }
  } as Element;
}

/**
 * 检测坐标类型
 * @param coord 坐标对象
 * @returns 'absolute' | 'relative' | 'edge'
 */
export function getCoordinateType(coord: Coordinate): 'absolute' | 'relative' | 'edge' {
  return coord.type;
}

/**
 * 检测线段终点的坐标模式
 * @param lineElement 线段元素
 * @returns 'absolute' | 'relative'
 */
export function getLineEndMode(lineElement: Element): 'absolute' | 'relative' {
  if (lineElement.type !== 'line') {
    return 'absolute';
  }
  
  const lineEl = lineElement as any;
  if (lineEl.end && 'dx' in lineEl.end && 'dy' in lineEl.end) {
    return 'relative';
  }
  return 'absolute';
}

/**
 * 检测线段起点的坐标模式
 * @param lineElement 线段元素
 * @returns 'absolute' | 'relative'
 */
export function getLineStartMode(lineElement: Element): 'absolute' | 'relative' {
  if (lineElement.type !== 'line') {
    return 'absolute';
  }
  
  const lineEl = lineElement as any;
  if (lineEl.start) {
    if (lineEl.start.x.type === 'relative' || lineEl.start.y.type === 'relative') {
      return 'relative';
    }
  }
  return 'absolute';
}

/**
 * 获取线段的起点和终点坐标（统一处理绝对/相对坐标）
 * @param lineElement 线段元素
 * @returns { x1, y1, x2, y2 } 起点和终点坐标
 */
export function getLineCoordinates(lineElement: Element): { 
  x1: number; 
  y1: number; 
  x2: number; 
  y2: number 
} {
  if (lineElement.type !== 'line') {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  }
  
  const lineEl = lineElement as any;
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  
  // 获取起点坐标
  if (lineEl.start) {
    if (lineEl.start.x.type === 'absolute') {
      x1 = lineEl.start.x.value;
    }
    if (lineEl.start.y.type === 'absolute') {
      y1 = lineEl.start.y.value;
    }
  }
  
  // 获取终点坐标
  if (lineEl.end) {
    if (lineEl.end.x && lineEl.end.y) {
      // 绝对坐标格式
      if (lineEl.end.x.type === 'absolute') {
        x2 = lineEl.end.x.value;
      }
      if (lineEl.end.y.type === 'absolute') {
        y2 = lineEl.end.y.value;
      }
    } else if (lineEl.end.dx !== undefined && lineEl.end.dy !== undefined) {
      // 相对坐标格式
      x2 = x1 + lineEl.end.dx;
      y2 = y1 + lineEl.end.dy;
    }
  }
  
  // 默认值
  if (x2 === 0 && y2 === 0) {
    x2 = x1 + 100;
    y2 = y1;
  }
  
  return { x1, y1, x2, y2 };
}
