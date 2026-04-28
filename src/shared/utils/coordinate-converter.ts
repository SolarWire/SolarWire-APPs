/**
 * 坐标转换工具函数
 * 提供绝对坐标和相对坐标之间的转换，以及线段坐标处理
 */

import type { Element } from '../../lib/parser/types';

/**
 * 坐标类型
 */
export type CoordinateType = 'absolute' | 'relative';

/**
 * 绝对坐标
 */
export interface AbsoluteCoordinate {
  type: 'absolute';
  value: number;
}

/**
 * 相对坐标
 */
export interface RelativeCoordinate {
  type: 'relative';
  value: number;
}

/**
 * 坐标（绝对或相对）
 */
export type Coordinate = AbsoluteCoordinate | RelativeCoordinate;

/**
 * 线段起点
 */
export interface LineStart {
  x: Coordinate;
  y: Coordinate;
}

/**
 * 线段终点（绝对坐标）
 */
export interface LineEndAbsolute {
  type: 'absolute';
  x: AbsoluteCoordinate;
  y: AbsoluteCoordinate;
}

/**
 * 线段终点（相对偏移）
 */
export interface LineEndRelative {
  type: 'relative';
  dx: number;
  dy: number;
}

/**
 * 线段终点
 */
export type LineEnd = LineEndAbsolute | LineEndRelative;

/**
 * 线段元素类型
 */
export type LineElement = Element & {
  type: 'line';
  start?: LineStart;
  end?: LineEnd;
};

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
 * 获取线段元素的起点坐标
 * @param lineElement 线段元素
 * @returns 起点坐标 { x, y }
 */
export function getLineStartCoords(lineElement: Element): { x: number; y: number } {
  if (lineElement.type !== 'line') {
    return { x: 0, y: 0 };
  }

  const lineEl = lineElement as LineElement;
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

  const lineEl = lineElement as LineElement;

  if (!lineEl.end) {
    return { x: startCoords.x + 100, y: startCoords.y };
  }

  if (lineEl.end.type === 'relative') {
    return {
      x: startCoords.x + lineEl.end.dx,
      y: startCoords.y + lineEl.end.dy
    };
  }

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

  const lineEl = lineElement as LineElement;
  return {
    ...lineEl,
    end: { type: 'relative', dx, dy }
  };
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

  const lineEl = lineElement as LineElement;
  return {
    ...lineEl,
    end: {
      type: 'absolute',
      x: { type: 'absolute', value: x },
      y: { type: 'absolute', value: y }
    }
  } as Element;
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

  const lineEl = lineElement as LineElement;
  if (lineEl.end && lineEl.end.type === 'relative') {
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

  const lineEl = lineElement as LineElement;
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

  const lineEl = lineElement as LineElement;
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

  if (lineEl.start) {
    if (lineEl.start.x.type === 'absolute') {
      x1 = lineEl.start.x.value;
    }
    if (lineEl.start.y.type === 'absolute') {
      y1 = lineEl.start.y.value;
    }
  }

  if (lineEl.end) {
    if (lineEl.end.type === 'relative') {
      x2 = x1 + lineEl.end.dx;
      y2 = y1 + lineEl.end.dy;
    } else {
      if (lineEl.end.x.type === 'absolute') {
        x2 = lineEl.end.x.value;
      }
      if (lineEl.end.y.type === 'absolute') {
        y2 = lineEl.end.y.value;
      }
    }
  }

  if (x2 === 0 && y2 === 0) {
    x2 = x1 + 100;
    y2 = y1;
  }

  return { x1, y1, x2, y2 };
}
