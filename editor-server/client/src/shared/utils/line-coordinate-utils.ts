import type { Element } from '../../lib/parser/types';

export interface AbsoluteCoordinate {
  type: 'absolute';
  value: number;
}

export type Coordinate = AbsoluteCoordinate;

export interface LineStart {
  x: Coordinate;
  y: Coordinate;
}

export interface LineEndAbsolute {
  type: 'absolute';
  x: AbsoluteCoordinate;
  y: AbsoluteCoordinate;
}

export type LineEnd = LineEndAbsolute;

export type LineElement = Element & {
  type: 'line';
  start?: LineStart;
  end?: LineEnd;
};

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

export function getLineEndCoords(
  lineElement: Element,
  _startCoords: { x: number; y: number }
): { x: number; y: number } {
  if (lineElement.type !== 'line') {
    return { x: 0, y: 0 };
  }

  const lineEl = lineElement as LineElement;

  if (!lineEl.end) {
    return { x: _startCoords.x + 100, y: _startCoords.y };
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
    if (lineEl.end.x.type === 'absolute') {
      x2 = lineEl.end.x.value;
    }
    if (lineEl.end.y.type === 'absolute') {
      y2 = lineEl.end.y.value;
    }
  }

  if (x2 === 0 && y2 === 0) {
    x2 = x1 + 100;
    y2 = y1;
  }

  return { x1, y1, x2, y2 };
}
