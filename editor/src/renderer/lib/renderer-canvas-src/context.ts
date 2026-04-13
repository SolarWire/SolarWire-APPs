import { Coordinate, CoordinateExpression, RelativeEndCoordinate, Element, DocumentDeclaration } from '../parser-src';

export interface GlobalDefaults {
  c?: string;
  size?: number;
  'line-height'?: number;
  gap?: number;
  bg?: string;
  r?: number;
  bold?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  x2?: number;
  y2?: number;
}

export interface CanvasRenderContext {
  ctx: CanvasRenderingContext2D;
  offsetX: number;
  offsetY: number;
  scale: number;
  globalDefaults: GlobalDefaults;
  selectedElementIds: string[];
  primaryColor: string;
  lastElementBounds: ElementBounds | null;
  sourceInput?: string;
  elementBoundsMap: Map<string, ElementBounds>;
}

export function createCanvasRenderContext(
  ctx: CanvasRenderingContext2D,
  declarations: DocumentDeclaration[] = [],
  options: {
    selectedElementIds?: string[];
    primaryColor?: string;
    scale?: number;
    sourceInput?: string;
  } = {}
): CanvasRenderContext {
  const globalDefaults: GlobalDefaults = {};
  
  declarations.forEach(decl => {
    const { key, value } = decl;
    if (['size', 'line-height', 'gap', 'r'].includes(key)) {
      globalDefaults[key] = parseFloat(value);
    } else if (key === 'bold') {
      globalDefaults[key] = true;
    } else {
      globalDefaults[key] = value;
    }
  });
  
  return {
    ctx,
    offsetX: 0,
    offsetY: 0,
    scale: options.scale || 1,
    globalDefaults,
    selectedElementIds: options.selectedElementIds || [],
    primaryColor: options.primaryColor || '#FCA506',
    lastElementBounds: null,
    sourceInput: options.sourceInput,
    elementBoundsMap: new Map(),
  };
}

export function updateLastElementBounds(context: CanvasRenderContext, bounds: ElementBounds): void {
  context.lastElementBounds = bounds;
}

export interface AbsolutePosition {
  x: number;
  y: number;
}

export function calculateCoordinate(
  context: CanvasRenderContext,
  coord: Coordinate,
  isX: boolean,
  lastBounds: ElementBounds | null
): number {
  let baseValue: number;

  switch (coord.type) {
    case 'absolute':
      baseValue = coord.value;
      break;
    case 'relative':
      baseValue = coord.value;
      break;
    case 'edge':
      if (!lastBounds) {
        baseValue = 0;
      } else {
        switch (coord.direction) {
          case 'L':
            baseValue = lastBounds.x;
            break;
          case 'R':
            baseValue = lastBounds.x + lastBounds.width;
            break;
          case 'T':
            baseValue = lastBounds.y;
            break;
          case 'B':
            baseValue = lastBounds.y + lastBounds.height;
            break;
          case 'C':
            baseValue = isX 
              ? lastBounds.x + lastBounds.width / 2 
              : lastBounds.y + lastBounds.height / 2;
            break;
          default:
            baseValue = 0;
        }
      }
      baseValue += coord.value;
      break;
    default: {
      const exhaustiveCheck: never = coord;
      throw new Error(`Unknown coordinate type: ${(exhaustiveCheck as any).type}`);
    }
  }

  return baseValue;
}

export function calculatePosition(
  context: CanvasRenderContext,
  coords: CoordinateExpression
): AbsolutePosition {
  const x = calculateCoordinate(context, coords.x, true, context.lastElementBounds);
  const y = calculateCoordinate(context, coords.y, false, context.lastElementBounds);
  return { x, y };
}

export function calculateLineEnd(
  context: CanvasRenderContext,
  start: AbsolutePosition,
  end: CoordinateExpression | RelativeEndCoordinate
): AbsolutePosition {
  if ('dx' in end) {
    return {
      x: start.x + end.dx,
      y: start.y + end.dy,
    };
  } else {
    return calculatePosition(context, end);
  }
}

export function getNumberAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string,
  defaultValue: number
): number {
  const localValue = attributes[key];
  if (localValue !== undefined) {
    const parsed = parseFloat(localValue);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (globalDefaults[key] !== undefined && typeof globalDefaults[key] === 'number') {
    return globalDefaults[key] as number;
  }
  return defaultValue;
}

export function getColorAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string,
  defaultValue: string
): string {
  return attributes[key] ?? (globalDefaults[key] as string) ?? defaultValue;
}

export function getBooleanAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string
): boolean {
  if (key in attributes) return true;
  if (globalDefaults[key] !== undefined) return !!globalDefaults[key];
  return false;
}

export function getAlignAttribute(
  attributes: Record<string, string>,
  defaultValue: 'start' | 'middle' | 'end'
): 'start' | 'middle' | 'end' {
  const align = attributes['align'];
  switch (align) {
    case 'l':
      return 'start';
    case 'c':
      return 'middle';
    case 'r':
      return 'end';
    default:
      return defaultValue;
  }
}

export function getStyleAttribute(
  attributes: Record<string, string>
): { strokeDasharray: number[] | null } {
  const style = attributes['style'];
  switch (style) {
    case 'dashed':
      return { strokeDasharray: [5, 5] };
    case 'dotted':
      return { strokeDasharray: [2, 2] };
    default:
      return { strokeDasharray: null };
  }
}

export function getOpacityAttribute(
  attributes: Record<string, string>,
  key: string = 'opacity',
  defaultValue: number = 1
): number {
  const value = attributes[key];
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(0, Math.min(1, parsed));
}
