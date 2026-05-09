import { useCallback, useRef } from 'react';
import { getLineCoordinates } from '../../../../shared/utils/line-coordinate-utils';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import type { SelectionTool } from '../../../stores/solarWireStore';
import type { Document, Element as SolarWireElement } from '../../../../lib/parser/types';

export interface ElementBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const DEFAULT_BOUNDS: ElementBounds = { x: 0, y: 0, w: 0, h: 0, r: 0 };

export function getElementIdFromSVGElement(element: SVGElement | HTMLElement): string | null {
  let el: SVGElement | HTMLElement | null = element;
  while (el) {
    const id = el.getAttribute('data-element-id');
    if (id) return id;
    const noteElementId = el.getAttribute('data-note-element-id');
    if (noteElementId) return noteElementId;
    const line = el.getAttribute('data-line');
    if (line) return line;
    el = el.parentElement;
  }
  return null;
}

export function pointToLineDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

interface UseElementBoundsOptions {
  ast: Document | null;
  effectiveContent: string;
  selectionTool: SelectionTool;
}

interface UseElementBoundsReturn {
  getElementData: (elementId: string) => SolarWireElement | null;
  getElementBounds: (elementId: string) => ElementBounds;
  getElementBoundsFromData: (elementData: SolarWireElement | null) => ElementBounds;
  getAllElementsBoundsMap: (elements: SolarWireElement[]) => Map<string, ElementBounds>;
  getCanvasBounds: () => { width: number; height: number };
  getGroupBounds: (elementIds: string[]) => { x: number; y: number; w: number; h: number } | null;
  findElementAtPosition: (svgX: number, svgY: number, tolerance?: number) => string | null;
  testBoxSelection: (x1: number, y1: number, x2: number, y2: number) => void;
  isMouseNearLine: (mouseX: number, mouseY: number, lineElement: SolarWireElement, tolerance?: number) => boolean;
}

export function useElementBounds({
  ast,
  effectiveContent,
  selectionTool,
}: UseElementBoundsOptions): UseElementBoundsReturn {
  const selectElements = useSolarWireStore(s => s.selectElements);

  const elementsBoundsCacheRef = useRef<Map<string, ElementBounds>>(new Map());
  const elementsBoundsCacheVersionRef = useRef<string>('');

  const getElementData = useCallback((elementId: string): SolarWireElement | null => {
    if (!ast) return null;
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum)) {
      return ast.elements.find(e => (e as any).id === elementId) || null;
    }
    return ast.elements.find(e => e.location?.line === lineNum) || null;
  }, [ast]);

  const getElementBoundsFromData = useCallback((
    elementData: SolarWireElement | null
  ): ElementBounds => {
    if (!elementData) return DEFAULT_BOUNDS;

    if (elementData.type === 'line') {
      try {
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          r: 0
        };
      } catch (e) {
        // Fall back to attribute-based calculation
      }
    }

    const attrs = elementData.attributes || {};
    const coords = elementData.coordinates;
    const type = elementData.type;

    let x = 0, y = 0, w = 0, h = 0, r = 0;

    if (coords && coords.x.type === 'absolute' && coords.y.type === 'absolute') {
      x = coords.x.value;
      y = coords.y.value;
    } else {
      x = parseInt(attrs.x || '0');
      y = parseInt(attrs.y || '0');
    }

    switch (type) {
      case 'circle':
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '40');
        if (attrs.r) {
          const radius = parseInt(attrs.r);
          w = h = radius * 2;
        }
        break;
      case 'text': {
        const lines = (elementData as any).text ? (elementData as any).text.split('\n') : [''];
        const fontSize = parseInt(attrs['text-size'] || attrs['size'] || '12');
        const lineHeight = parseInt(attrs['line-height'] || '22');
        const declaredWidth = parseInt(attrs.w || '0');
        const rawAlign = attrs.align || 'start';
        const align = rawAlign === 'l' ? 'start' : rawAlign === 'c' ? 'middle' : rawAlign === 'r' ? 'end' : 'start';
        
        const fontFamily = attrs['font-family'] || 'sans-serif';
        const isBold = attrs.bold !== undefined;
        const isItalic = attrs.italic !== undefined;
        const fontStyle = `${isBold ? 'bold' : ''} ${isItalic ? 'italic' : ''} ${fontSize}px ${fontFamily}`.trim();
        const measureCanvas = document.createElement('canvas');
        const ctx = measureCanvas.getContext('2d');
        let textWidth = 100;
        if (ctx) {
          ctx.font = fontStyle;
          textWidth = Math.max(...lines.map((l: string) => ctx.measureText(l).width));
        } else {
          textWidth = Math.max(...lines.map((l: string) => l.length * fontSize * 0.6));
        }
        h = lines.length > 0 ? lines.length * lineHeight : fontSize;
        
        if (declaredWidth > 0) {
          if (declaredWidth > textWidth) {
            if (align === 'end') {
              x = x + declaredWidth - textWidth;
              w = textWidth;
            } else if (align === 'middle') {
              x = x + (declaredWidth - textWidth) / 2;
              w = textWidth;
            } else {
              w = declaredWidth;
            }
          } else {
            w = declaredWidth;
          }
        } else {
          w = textWidth;
        }
        break;
      }
      case 'line': {
        const x2 = parseInt(attrs.x2 || String(x + 100));
        const y2 = parseInt(attrs.y2 || String(y));
        w = Math.abs(x2 - x);
        h = Math.abs(y2 - y) || 2;
        if (y2 < y) y = y2;
        if (x2 < x) x = x2;
        break;
      }
      default:
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '50');
        r = parseInt(attrs.r || '0');
    }

    return { x, y, w, h, r };
  }, []);

  const getElementBounds = useCallback((elementId: string): ElementBounds => {
    const elementData = getElementData(elementId);
    if (!elementData) return DEFAULT_BOUNDS;

    if (elementData.type === 'line') {
      try {
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);
        return {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          r: 0
        };
      } catch (e) {
        console.warn('Failed to get line bounds, using fallback', e);
      }
    }

    return getElementBoundsFromData(elementData);
  }, [getElementData, getElementBoundsFromData]);

  const getAllElementsBoundsMap = useCallback((
    elements: SolarWireElement[]
  ): Map<string, ElementBounds> => {
    const contentVersion = `${effectiveContent.length}-${effectiveContent.slice(0, 100)}`;

    if (elementsBoundsCacheVersionRef.current === contentVersion && elementsBoundsCacheRef.current.size > 0) {
      return elementsBoundsCacheRef.current;
    }

    const boundsMap = new Map<string, ElementBounds>();
    elements.forEach((el, idx) => {
      const id = el.location?.line?.toString() || (idx + 1).toString();
      const bounds = getElementBoundsFromData(el);
      boundsMap.set(id, bounds);
    });

    elementsBoundsCacheRef.current = boundsMap;
    elementsBoundsCacheVersionRef.current = contentVersion;

    return boundsMap;
  }, [effectiveContent, getElementBoundsFromData]);

  const getCanvasBounds = useCallback(() => {
    return { width: Infinity, height: Infinity };
  }, []);

  const getGroupBounds = useCallback((
    elementIds: string[]
  ): { x: number; y: number; w: number; h: number } | null => {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    elementIds.forEach(id => {
      const bounds = getElementBounds(id);
      if (!bounds) return;

      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.w);
      maxY = Math.max(maxY, bounds.y + bounds.h);
    });

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY
    };
  }, [getElementBounds]);

  const findElementAtPosition = useCallback((
    svgX: number,
    svgY: number,
    tolerance: number = 10
  ): string | null => {
    if (!ast) return null;

    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const lineNum = element.location?.line;
      if (!lineNum) continue;

      if (element.type === 'line') {
        try {
          const { x1, y1, x2, y2 } = getLineCoordinates(element);
          const actualDistance = pointToLineDistance(svgX, svgY, x1, y1, x2, y2);

          if (actualDistance <= tolerance) {
            return lineNum.toString();
          }
        } catch (e) {
          console.error(`线段 ${lineNum} 处理失败:`, e);
        }
      }
    }

    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const lineNum = element.location?.line;
      if (!lineNum) continue;
      if (element.type === 'line') continue;

      try {
        const bounds = getElementBounds(lineNum.toString());
        const elementLeft = bounds.x;
        const elementRight = bounds.x + bounds.w;
        const elementTop = bounds.y;
        const elementBottom = bounds.y + bounds.h;

        const closestX = Math.max(elementLeft, Math.min(svgX, elementRight));
        const closestY = Math.max(elementTop, Math.min(svgY, elementBottom));
        const distance = Math.sqrt(
          Math.pow(svgX - closestX, 2) + Math.pow(svgY - closestY, 2)
        );

        if (distance <= tolerance) {
          return lineNum.toString();
        }
      } catch (e) {
        console.warn('获取元素边界失败', lineNum, e);
      }
    }

    return null;
  }, [ast, getElementBounds]);

  const testBoxSelection = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!ast) return;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const selected: string[] = [];

    const isIntersectMode = selectionTool === 'box-intersect';

    ast.elements.forEach((element) => {
      const line = element.location?.line;
      if (!line) return;

      if (element.type === 'line') {
        try {
          const { x1: lineX1, y1: lineY1, x2: lineX2, y2: lineY2 } = getLineCoordinates(element);

          const startInBox = lineX1 >= minX && lineX1 <= maxX && lineY1 >= minY && lineY1 <= maxY;
          const endInBox = lineX2 >= minX && lineX2 <= maxX && lineY2 >= minY && lineY2 <= maxY;

          let lineSelected = false;
          if (isIntersectMode) {
            const intersects = !(lineX1 > maxX || lineX2 < minX || lineY1 > maxY || lineY2 < minY);
            lineSelected = startInBox || endInBox || intersects;
          } else {
            lineSelected = startInBox && endInBox;
          }

          if (lineSelected) {
            selected.push(line.toString());
          }
        } catch (e) {
          console.warn('Failed to get line coordinates for box selection', line, e);
        }
        return;
      }

      const bounds = getElementBounds(line.toString());
      if (bounds.w === 0 && bounds.h === 0) return;

      const elementLeft = bounds.x;
      const elementRight = bounds.x + bounds.w;
      const elementTop = bounds.y;
      const elementBottom = bounds.y + bounds.h;

      let isSelected: boolean;
      if (isIntersectMode) {
        isSelected = !(elementLeft > maxX || elementRight < minX || elementTop > maxY || elementBottom < minY);
      } else {
        isSelected = elementLeft >= minX && elementRight <= maxX &&
          elementTop >= minY && elementBottom <= maxY;
      }

      if (isSelected) {
        selected.push(line.toString());
      }
    });

    selectElements(selected);
  }, [ast, selectElements, getElementBounds, selectionTool]);

  const isMouseNearLine = useCallback((
    mouseX: number,
    mouseY: number,
    lineElement: SolarWireElement,
    tolerance: number = 2
  ): boolean => {
    if (lineElement.type !== 'line') return false;

    const { x1, y1, x2, y2 } = getLineCoordinates(lineElement);

    const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);
    return distance <= tolerance;
  }, []);

  return {
    getElementData,
    getElementBounds,
    getElementBoundsFromData,
    getAllElementsBoundsMap,
    getCanvasBounds,
    getGroupBounds,
    findElementAtPosition,
    testBoxSelection,
    isMouseNearLine,
  };
}
