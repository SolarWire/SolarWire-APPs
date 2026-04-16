import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useCoordinateSystem } from '../../../shared/hooks/useCoordinateSystem';
import { useDragCoordinate } from '../../../shared/hooks/useDragCoordinate';
import {
  getLineStartCoords,
  getLineEndCoords,
  getLineStartMode,
  getLineEndMode,
  updateLineEndRelative,
  updateLineEndAbsolute,
  getLineCoordinates
} from '../../../shared/utils/coordinate-converter';

// 节流函数
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { parse } from '../../../lib/parser';
import { render, RenderResultWithMeta } from '../../../lib/renderer';
import { updateLineAttribute } from '../../../shared/utils/solarwire-utils';
import type { Document, Element as SolarWireElement } from '../../../lib/parser/types';
import './SolarWirePreview.css';

type SelectionTool = 'select' | 'box-inclusive';

// 获取元素数据，包括线段元素的终点坐标
const getElementDataFromContent = (content: string, lineNum: number) => {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) return null;
  const line = lines[lineNum - 1];
  let x = 0;
  let y = 0;
  let x2 = 0;
  let y2 = 0;

  const coordPattern = /@\((\d+),\s*(\d+)\)/;
  const match = line.match(coordPattern);
  if (match) {
    x = parseInt(match[1]);
    y = parseInt(match[2]);
  } else {
    const xMatch = line.match(/x=([\d]+)/);
    const yMatch = line.match(/y=([\d]+)/);
    if (xMatch) x = parseInt(xMatch[1]);
    if (yMatch) y = parseInt(yMatch[1]);
  }

  // 检查是否是线段元素，获取终点坐标
  const lineEndPattern = /->\((\d+),\s*(\d+)\)/;
  const lineEndMatch = line.match(lineEndPattern);
  if (lineEndMatch) {
    x2 = parseInt(lineEndMatch[1]);
    y2 = parseInt(lineEndMatch[2]);
  } else {
    const x2Match = line.match(/x2=([\d]+)/);
    const y2Match = line.match(/y2=([\d]+)/);
    if (x2Match) x2 = parseInt(x2Match[1]);
    if (y2Match) y2 = parseInt(y2Match[1]);
  }

  return { x, y, x2, y2 };
};

/**
 * 处理线段拖动
 * @param content 当前文档内容
 * @param lineNum 线段编号
 * @param elementX 原始起点 X 坐标
 * @param elementY 原始起点 Y 坐标
 * @param elementX2 原始终点 X 坐标
 * @param elementY2 原始终点 Y 坐标
 * @param dx X 轴偏移量
 * @param dy Y 轴偏移量
 * @param throttledSetContent 节流版本的 setContent 函数
 * @param isRelative 是否使用相对坐标模式
 * @returns 更新后的文档内容
 */
const handleLineDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  elementX2: number | undefined,
  elementY2: number | undefined,
  dx: number,
  dy: number,
  throttledSetContent: (content: string) => void,
  isRelative: boolean = false
): string => {
  let newContent = content;
  
  if (isRelative && elementX2 !== undefined && elementY2 !== undefined) {
    // 相对模式：保持相对偏移不变
    const originalDx = elementX2 - elementX;
    const originalDy = elementY2 - elementY;
    
    const newX = Math.max(0, Math.round(elementX + dx));
    const newY = Math.max(0, Math.round(elementY + dy));
    const newX2 = newX + originalDx;
    const newY2 = newY + originalDy;
    
    newContent = updateLineAttribute(newContent, lineNum, 'x', newX);
    newContent = updateLineAttribute(newContent, lineNum, 'y', newY);
    newContent = updateLineAttribute(newContent, lineNum, 'x2', newX2);
    newContent = updateLineAttribute(newContent, lineNum, 'y2', newY2);
  } else {
    // 绝对模式：直接更新所有坐标
    const newX = Math.max(0, Math.round(elementX + dx));
    const newY = Math.max(0, Math.round(elementY + dy));
    
    newContent = updateLineAttribute(newContent, lineNum, 'x', newX);
    newContent = updateLineAttribute(newContent, lineNum, 'y', newY);
    
    // 如果有终点坐标，同时更新终点
    if (elementX2 !== undefined && elementY2 !== undefined) {
      const newX2 = Math.max(0, Math.round(elementX2 + dx));
      const newY2 = Math.max(0, Math.round(elementY2 + dy));
      newContent = updateLineAttribute(newContent, lineNum, 'x2', newX2);
      newContent = updateLineAttribute(newContent, lineNum, 'y2', newY2);
    }
  }
  
  throttledSetContent(newContent);
  return newContent;
};

/**
 * 处理普通元素拖动
 * @param content 当前文档内容
 * @param lineNum 元素编号
 * @param elementX 原始 X 坐标
 * @param elementY 原始 Y 坐标
 * @param dx X 轴偏移量
 * @param dy Y 轴偏移量
 * @param throttledSetContent 节流版本的 setContent 函数
 * @returns 更新后的文档内容
 */
const handleElementDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  dx: number,
  dy: number,
  throttledSetContent: (content: string) => void
): string => {
  const newX = Math.max(0, Math.round(elementX + dx));
  const newY = Math.max(0, Math.round(elementY + dy));
  
  let newContent = updateLineAttribute(content, lineNum, 'x', newX);
  newContent = updateLineAttribute(newContent, lineNum, 'y', newY);
  
  throttledSetContent(newContent);
  return newContent;
};

interface BoxSelectionState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DragElementState {
  elementId: string;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

interface ResizeHandleState {
  elementId: string;
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'start' | 'end';
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW?: number;
  elementH?: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

interface SolarWirePreviewProps {
  zoomLevel: number;
  selectionTool: SelectionTool;
  showNotes?: boolean;
  onZoomChange?: (zoom: number) => void;
  isPanMode?: boolean;
  isSpacePressed?: boolean;
}

function SolarWirePreview({ zoomLevel, selectionTool, showNotes = true, onZoomChange, isPanMode = false, isSpacePressed = false }: SolarWirePreviewProps): JSX.Element {
  const { selectedElements, selectElements } = useSolarWireStore();
  const { content, setContent } = useEditorStore();
  const { primaryColor } = useSettingsStore();
  
  // 创建节流版本的setContent函数，限制调用频率为100ms
  const throttledSetContent = useMemo(() => throttle(setContent, 100), [setContent]);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // 使用坐标系统Hook
  const { getSvgCoords, getTransform, containerRef } = useCoordinateSystem({
    position,
    scale
  });

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boxSelection, setBoxSelection] = useState<BoxSelectionState | null>(null);
  const [dragElementState, setDragElementState] = useState<DragElementState | null>(null);
  const [resizeHandleState, setResizeHandleState] = useState<ResizeHandleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const { svg, ast, viewBox } = useMemo(() => {
    try {
      setError(null);
      const safeContent = content || '';
      if (!safeContent.trim()) {
        return { svg: '', ast: null, viewBox: null };
      }
      const parsedAST = parse(safeContent);
      const renderedResult = render(parsedAST, {
        disableNotes: !showNotes,
        selectedElementIds: selectedElements,
        primaryColor,
        sourceInput: safeContent
      }, true) as RenderResultWithMeta;
      return { svg: renderedResult.svg, ast: parsedAST, viewBox: renderedResult.viewBox };
    } catch (e: any) {
      console.error('Parse/Render error:', e);
      setError(e.message || String(e));
      return { svg: '', ast: null, viewBox: null };
    }
  }, [content, selectedElements, primaryColor, showNotes]);

  useEffect(() => {
    if (!isInitialized) {
      setScale(zoomLevel / 100);
    }
  }, [zoomLevel, isInitialized]);



  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      // 对于无限画布，我们只需要设置一个默认的缩放比例
      setScale(0.5);
      setPosition({ x: 100, y: 100 });
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (svg && containerRef.current && !isInitialized) {
      setTimeout(fitToScreen, 50);
    }
  }, [svg, fitToScreen, isInitialized]);

  // 监听容器大小变化，确保坐标系统保持一致
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // 当容器大小变化时，重新计算位置和缩放
      // 这里我们不需要改变缩放比例，只需要确保渲染层和交互层的位置正确
      // 由于我们使用了 transform 来定位和缩放，容器大小变化应该不会影响坐标系统
      // 但是为了确保一致性，我们可以在这里添加必要的调整逻辑
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));

    const scaleRatio = newScale / scale;
    const newX = mouseX - (mouseX - position.x) * scaleRatio;
    const newY = mouseY - (mouseY - position.y) * scaleRatio;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
    setIsInitialized(true);
    
    if (onZoomChange) {
      onZoomChange(Math.round(newScale * 100));
    }
  }, [scale, position, onZoomChange]);

  const getElementIdFromSVGElement = (element: SVGElement | HTMLElement): string | null => {
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
  };

  const getElementData = useCallback((elementId: string): SolarWireElement | null => {
    if (!ast) return null;
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum)) {
      return ast.elements.find(e => (e as any).id === elementId) || null;
    }
    return ast.elements.find(e => e.location?.line === lineNum) || null;
  }, [ast]);

  /**
   * 检测鼠标位置是否在线段附近（2px 范围内）
   * @param mouseX 鼠标 X 坐标（SVG 坐标）
   * @param mouseY 鼠标 Y 坐标（SVG 坐标）
   * @param lineElement 线段元素
   * @param tolerance 容差范围（像素）
   * @returns 是否在线段附近
   */
  const isMouseNearLine = useCallback((
    mouseX: number,
    mouseY: number,
    lineElement: SolarWireElement,
    tolerance: number = 2
  ): boolean => {
    if (lineElement.type !== 'line') return false;
    
    const { x1, y1, x2, y2 } = getLineCoordinates(lineElement);
    
    // 计算点到线段的最短距离
    const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);
    return distance <= tolerance;
  }, [pointToLineDistance]);

  /**
   * 计算点到线段的最短距离
   */
  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
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

    let xx, yy;

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
  };

  const getElementBounds = useCallback((elementId: string) => {
    const elementData = getElementData(elementId);
    if (!elementData) return { x: 0, y: 0, w: 0, h: 0, r: 0 };
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
      case 'text':
        const lines = (elementData as any).text ? (elementData as any).text.split('\n') : [''];
        const fontSize = parseInt(attrs['text-size'] || attrs['size'] || '12');
        const lineHeight = parseInt(attrs['line-height'] || '22');
        const declaredWidth = parseInt(attrs.w || '0');
        w = declaredWidth || (lines.length > 0 ? Math.max(...lines.map((l: string) => l.length * fontSize * 0.6)) : 100);
        h = lines.length > 0 ? lines.length * lineHeight : fontSize;
        break;
      case 'line':
        const x2 = parseInt(attrs.x2 || String(x + 100));
        const y2 = parseInt(attrs.y2 || String(y));
        w = Math.abs(x2 - x);
        h = Math.abs(y2 - y) || 2;
        if (y2 < y) y = y2;
        if (x2 < x) x = x2;
        break;
      default:
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '50');
        r = parseInt(attrs.r || '0');
    }
    
    return { x, y, w, h, r };
  }, [getElementData]);

  /**
   * 检测鼠标位置附近的所有元素（包括线段）
   * @param svgX 鼠标 X 坐标（SVG 坐标）
   * @param svgY 鼠标 Y 坐标（SVG 坐标）
   * @param tolerance 容差范围（像素）
   * @returns 最近的元素 ID
   */
  const findElementAtPosition = useCallback((
    svgX: number,
    svgY: number,
    tolerance: number = 2
  ): string | null => {
    if (!ast) return null;
    
    let nearestElement: string | null = null;
    let minDistance = Infinity;
    
    ast.elements.forEach((element) => {
      const lineNum = element.location?.line;
      if (!lineNum) return;
      
      if (element.type === 'line') {
        // 线段元素：使用点到线段距离
        const { x1, y1, x2, y2 } = getLineCoordinates(element);
        const actualDistance = pointToLineDistance(svgX, svgY, x1, y1, x2, y2);
        
        if (actualDistance <= tolerance && actualDistance < minDistance) {
          minDistance = actualDistance;
          nearestElement = lineNum.toString();
        }
      } else {
        // 普通元素：使用边界框检测
        const bounds = getElementBounds(lineNum.toString());
        const elementLeft = bounds.x;
        const elementRight = bounds.x + bounds.w;
        const elementTop = bounds.y;
        const elementBottom = bounds.y + bounds.h;
        
        // 计算点到矩形边界的最近距离
        const closestX = Math.max(elementLeft, Math.min(svgX, elementRight));
        const closestY = Math.max(elementTop, Math.min(svgY, elementBottom));
        const distance = Math.sqrt(
          Math.pow(svgX - closestX, 2) + Math.pow(svgY - closestY, 2)
        );
        
        if (distance <= tolerance && distance < minDistance) {
          minDistance = distance;
          nearestElement = lineNum.toString();
        }
      }
    });
    
    return nearestElement;
  }, [ast, getElementBounds]);

  const testBoxSelection = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!ast) return;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const selected: string[] = [];

    ast.elements.forEach((element) => {
      const line = element.location?.line;
      if (!line) return;
      
      const bounds = getElementBounds(line.toString());
      if (bounds.w === 0 && bounds.h === 0) return;

      const elementLeft = bounds.x;
      const elementRight = bounds.x + bounds.w;
      const elementTop = bounds.y;
      const elementBottom = bounds.y + bounds.h;

      // 包含框选：元素必须完全在框选区域内
      const isSelected = elementLeft >= minX && elementRight <= maxX &&
        elementTop >= minY && elementBottom <= maxY;

      if (isSelected) {
        selected.push(line.toString());
      }
    });

    selectElements(selected);
  }, [ast, selectElements, getElementBounds]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const target = e.target as SVGElement | HTMLElement;
    
    const handleAttr = target.getAttribute('data-handle');
    if (handleAttr) {
      const elementId = target.getAttribute('data-element-id');
      if (elementId) {
        if (handleAttr === 'start' || handleAttr === 'end') {
          // 线段端点句柄
          const elementData = getElementData(elementId);
          if (elementData && elementData.type === 'line') {
            const lineElement = elementData as any;
            
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            
            // 获取起点坐标
            if (lineElement.start && lineElement.start.x && lineElement.start.x.type === 'absolute') {
              x1 = lineElement.start.x.value;
            }
            if (lineElement.start && lineElement.start.y && lineElement.start.y.type === 'absolute') {
              y1 = lineElement.start.y.value;
            }
            
            // 获取终点坐标
            if (lineElement.end) {
              if ((lineElement.end as any).x && (lineElement.end as any).y) {
                // 绝对坐标格式
                if ((lineElement.end as any).x.type === 'absolute') {
                  x2 = (lineElement.end as any).x.value;
                }
                if ((lineElement.end as any).y.type === 'absolute') {
                  y2 = (lineElement.end as any).y.value;
                }
              } else if ((lineElement.end as any).dx !== undefined && (lineElement.end as any).dy !== undefined) {
                // 相对坐标格式
                x2 = x1 + (lineElement.end as any).dx;
                y2 = y1 + (lineElement.end as any).dy;
              }
            }
            
            // 如果没有找到终点，使用默认值
            if (x2 === 0 && y2 === 0) {
              x2 = x1 + 100;
              y2 = y1;
            }
            
            setResizeHandleState({
              elementId,
              handle: handleAttr as 'start' | 'end',
              startX: e.clientX,
              startY: e.clientY,
              elementX: x1,
              elementY: y1,
              elementX2: x2,
              elementY2: y2
            });
            return;
          }
        } else {
          // 普通角句柄
          const bounds = getElementBounds(elementId);
          setResizeHandleState({
            elementId,
            handle: handleAttr as 'nw' | 'ne' | 'sw' | 'se',
            startX: e.clientX,
            startY: e.clientY,
            elementX: bounds.x,
            elementY: bounds.y,
            elementW: bounds.w,
            elementH: bounds.h
          });
          return;
        }
      }
    }

    let elementId = getElementIdFromSVGElement(target);
    const currentTool = (isPanMode || isSpacePressed) ? 'pan' : selectionTool;

    // 如果没有直接获取到元素 ID，尝试检测附近的线段（2px 容差）
    if (!elementId && (currentTool === 'select' || currentTool === 'box-inclusive')) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      elementId = findElementAtPosition(svgCoords.x, svgCoords.y, 2);
    }

    switch (currentTool) {
      case 'pan':
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        break;

      case 'select':
      case 'box-inclusive':
        if (elementId) {
          // 点击到元素时，点选
          const bounds = getElementBounds(elementId);
          const elementData = getElementData(elementId);
          const isLine = elementData?.type === 'line';
          
          const dragState: DragElementState = {
            elementId,
            startX: e.clientX,
            startY: e.clientY,
            elementX: bounds.x,
            elementY: bounds.y
          };
          
          // 如果是线段，保存终点坐标
          if (isLine && elementData) {
            const lineElement = elementData as any;
            let x2 = 0, y2 = 0;
            
            if (lineElement.end) {
              if ((lineElement.end as any).x && (lineElement.end as any).y) {
                if ((lineElement.end as any).x.type === 'absolute') {
                  x2 = (lineElement.end as any).x.value;
                }
                if ((lineElement.end as any).y.type === 'absolute') {
                  y2 = (lineElement.end as any).y.value;
                }
              } else if ((lineElement.end as any).dx !== undefined && (lineElement.end as any).dy !== undefined) {
                x2 = bounds.x + (lineElement.end as any).dx;
                y2 = bounds.y + (lineElement.end as any).dy;
              }
            }
            
            if (x2 !== 0 || y2 !== 0) {
              dragState.elementX2 = x2;
              dragState.elementY2 = y2;
              dragState.isLine = true;
            }
          }
          
          setDragElementState(dragState);
          if (e.shiftKey) {
            // Shift+Click：切换选中状态
            if (selectedElements.includes(elementId)) {
              selectElements(selectedElements.filter(id => id !== elementId));
            } else {
              selectElements([...selectedElements, elementId]);
            }
          } else {
            // 普通点击：只选中这个元素
            selectElements([elementId]);
          }
        } else if (currentTool === 'box-inclusive') {
          // box-inclusive 模式下，点击空白处开始框选（使用SVG坐标）
          const svgCoords = getSvgCoords(e.clientX, e.clientY);
          setBoxSelection({
            startX: svgCoords.x,
            startY: svgCoords.y,
            currentX: svgCoords.x,
            currentY: svgCoords.y
          });
        } else {
          // select 模式下，点击空白处拖动画布
          setIsDraggingCanvas(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
          selectElements([]);
        }
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas || ((isPanMode || isSpacePressed) && isDraggingCanvas)) {
      if (isDraggingCanvas) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      return;
    }

    if (resizeHandleState) {
      // 获取当前鼠标在SVG坐标系中的位置
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      // 获取起始鼠标在SVG坐标系中的位置
      const startCoords = getSvgCoords(resizeHandleState.startX, resizeHandleState.startY);
      
      const dx = currentCoords.x - startCoords.x;
      const dy = currentCoords.y - startCoords.y;
      
      if (resizeHandleState.handle === 'start' || resizeHandleState.handle === 'end') {
          // 线段端点拖拽
          const lineNum = parseInt(resizeHandleState.elementId);
          if (!isNaN(lineNum)) {
            const lines = content.split(/\r?\n/);
            if (lineNum > 0 && lineNum <= lines.length) {
              let line = lines[lineNum - 1];
              
              // 获取当前的起点和终点坐标
              let x1 = resizeHandleState.elementX;
              let y1 = resizeHandleState.elementY;
              let x2 = resizeHandleState.elementX2 || x1 + 100;
              let y2 = resizeHandleState.elementY2 || y1;
              
              if (resizeHandleState.handle === 'start') {
                x1 = Math.max(0, Math.round(resizeHandleState.elementX + dx));
                y1 = Math.max(0, Math.round(resizeHandleState.elementY + dy));
              } else {
                x2 = Math.max(0, Math.round((resizeHandleState.elementX2 || x1 + 100) + dx));
                y2 = Math.max(0, Math.round((resizeHandleState.elementY2 || y1) + dy));
              }
              
              // 检查线段的格式
              if (line.includes('->')) {
                // 已经是 -- @(x,y)->(x2,y2) 格式，直接更新
                // 先移除任何现有的 x2, y2 属性
                line = line.replace(/\s+x2=[\d]+/g, '');
                line = line.replace(/\s+y2=[\d]+/g, '');
                // 然后更新起点和终点
                line = line.replace(/--\s*@\([\d]+,\s*[\d]+\)->\([\d]+,\s*[\d]+\)/, `-- @(${x1}, ${y1})->(${x2}, ${y2})`);
              } else {
                // 不是标准格式，转换为 -- @(x,y)->(x2,y2) 格式
                // 先移除任何现有的 x, y, x2, y2 属性
                line = line.replace(/\s+x=[\d]+/g, '');
                line = line.replace(/\s+y=[\d]+/g, '');
                line = line.replace(/\s+x2=[\d]+/g, '');
                line = line.replace(/\s+y2=[\d]+/g, '');
                // 然后添加新的格式
                if (line.startsWith('--')) {
                  line = `-- @(${x1}, ${y1})->(${x2}, ${y2})` + line.substring(2);
                } else {
                  line = `-- @(${x1}, ${y1})->(${x2}, ${y2}) ` + line;
                }
              }
              
              lines[lineNum - 1] = line;
              throttledSetContent(lines.join('\n'));
            }
          }
          return;
        }
      
      let newX = resizeHandleState.elementX;
      let newY = resizeHandleState.elementY;
      let newW = resizeHandleState.elementW;
      let newH = resizeHandleState.elementH;

      switch (resizeHandleState.handle) {
        case 'nw':
          newX = Math.max(0, Math.round(resizeHandleState.elementX + dx));
          newY = Math.max(0, Math.round(resizeHandleState.elementY + dy));
          newW = Math.round(resizeHandleState.elementW - dx);
          newH = Math.round(resizeHandleState.elementH - dy);
          break;
        case 'ne':
          newY = Math.max(0, Math.round(resizeHandleState.elementY + dy));
          newW = Math.round(resizeHandleState.elementW + dx);
          newH = Math.round(resizeHandleState.elementH - dy);
          break;
        case 'sw':
          newX = Math.max(0, Math.round(resizeHandleState.elementX + dx));
          newW = Math.round(resizeHandleState.elementW - dx);
          newH = Math.round(resizeHandleState.elementH + dy);
          break;
        case 'se':
          newW = Math.round(resizeHandleState.elementW + dx);
          newH = Math.round(resizeHandleState.elementH + dy);
          break;
      }

      // 确保新的坐标不会导致元素超出边界
      if (newX < 0) {
        newW += newX;
        newX = 0;
      }
      if (newY < 0) {
        newH += newY;
        newY = 0;
      }

      if (newW >= 10 && newH >= 10) {
        const lineNum = parseInt(resizeHandleState.elementId);
        if (!isNaN(lineNum)) {
          let newContent = updateLineAttribute(content, lineNum, 'x', newX);
          newContent = updateLineAttribute(newContent, lineNum, 'y', newY);
          newContent = updateLineAttribute(newContent, lineNum, 'w', newW);
          newContent = updateLineAttribute(newContent, lineNum, 'h', newH);
          throttledSetContent(newContent);
        }
      }
      return;
    }

    if (dragElementState) {
      // 获取当前鼠标在 SVG 坐标系中的位置
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      // 获取起始鼠标在 SVG 坐标系中的位置
      const startCoords = getSvgCoords(dragElementState.startX, dragElementState.startY);
      
      const dx = currentCoords.x - startCoords.x;
      const dy = currentCoords.y - startCoords.y;
      
      const lineNum = parseInt(dragElementState.elementId);
      if (!isNaN(lineNum)) {
        // 根据元素类型调用对应的拖动处理函数
        if (dragElementState.isLine) {
          // 检测线段的坐标模式
          const lines = content.split(/\r?\n/);
          const line = lines[lineNum - 1];
          const isEndRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');
          
          handleLineDrag(
            content,
            lineNum,
            dragElementState.elementX,
            dragElementState.elementY,
            dragElementState.elementX2,
            dragElementState.elementY2,
            dx,
            dy,
            throttledSetContent,
            isEndRelative
          );
        } else {
          handleElementDrag(
            content,
            lineNum,
            dragElementState.elementX,
            dragElementState.elementY,
            dx,
            dy,
            throttledSetContent
          );
        }
      }
      return;
    }

    if (boxSelection) {
      // 使用SVG坐标更新框选框
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      setBoxSelection({
        ...boxSelection,
        currentX: svgCoords.x,
        currentY: svgCoords.y
      });
    } else {
      // 更新悬停元素
      const target = e.target as SVGElement | HTMLElement;
      const elementId = getElementIdFromSVGElement(target);
      setHoveredElement(elementId);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      return;
    }

    if (resizeHandleState) {
      setResizeHandleState(null);
      return;
    }

    if (dragElementState) {
      setDragElementState(null);
      return;
    }

    if (boxSelection) {
      const startCoords = getSvgCoords(boxSelection.startX, boxSelection.startY);
      const currentCoords = getSvgCoords(boxSelection.currentX, boxSelection.currentY);
      testBoxSelection(
        startCoords.x,
        startCoords.y,
        currentCoords.x,
        currentCoords.y
      );
      setBoxSelection(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const elementData = JSON.parse(jsonData);
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      const x = Math.round(svgCoords.x);
      const y = Math.round(svgCoords.y);

      let newLine = '';
      switch (elementData.type) {
        case 'rectangle':
          newLine = `["Rectangle"] @(${x},${y}) w=100 h=50`;
          break;
        case 'rounded-rectangle':
          newLine = `("Rounded") @(${x},${y}) w=100 h=50 r=6`;
          break;
        case 'circle':
          newLine = `(("Circle")) @(${x},${y})`;
          break;
        case 'text':
          newLine = `"Text" @(${x},${y})`;
          break;
        case 'line':
          newLine = `-- @(${x},${y})->(${x + 100},${y})`;
          break;
        case 'image':
          newLine = `<image.png> @(${x},${y}) w=100 h=100`;
          break;
        case 'placeholder':
          newLine = `[?"Placeholder"] @(${x},${y}) w=100 h=50`;
          break;
        case 'table':
          newLine = `## @(${x},${y}) w=200 h=100`;
          break;
        default:
          return;
      }

      const currentContent = content || '';
      const newContent = currentContent.trimEnd() + '\n' + newLine;
      setContent(newContent);

    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const renderBoxSelection = () => {
    if (!boxSelection) return null;

    const x = Math.min(boxSelection.startX, boxSelection.currentX);
    const y = Math.min(boxSelection.startY, boxSelection.currentY);
    const width = Math.abs(boxSelection.currentX - boxSelection.startX);
    const height = Math.abs(boxSelection.currentY - boxSelection.startY);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(252, 165, 6, 0.1)"
        stroke={primaryColor}
        strokeWidth={2 / scale}
        strokeDasharray="4,4"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderHoverHighlight = () => {
    if (!hoveredElement) return null;

    const bounds = getElementBounds(hoveredElement);
    if (bounds.w === 0 && bounds.h === 0) return null;

    return (
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.w}
        height={bounds.h}
        fill="none"
        stroke={primaryColor}
        strokeWidth={1 / scale}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderSelectionHandles = () => {
    if (selectedElements.length === 0) return null;

    const handles: JSX.Element[] = [];
    const handleSize = 8 / scale;

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      const bounds = getElementBounds(elementId);
      
      if (elementData && elementData.type === 'line') {
        // 线段元素 - 渲染两个端点句柄
        const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
        
        const endPoints = [
          { x: x1, y: y1, handle: 'start' as const },
          { x: x2, y: y2, handle: 'end' as const }
        ];

        endPoints.forEach((point) => {
          handles.push(
            <circle
              key={`${elementId}-handle-${point.handle}`}
              data-element-id={elementId}
              data-handle={point.handle}
              cx={point.x}
              cy={point.y}
              r={handleSize / 2}
              fill="white"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ cursor: 'move', pointerEvents: 'auto' }}
            />
          );
        });
      } else if (elementData && elementData.type !== 'text') {
        // 其他元素（除了文本元素） - 渲染四个角的调整手柄
        const corners = [
          { x: bounds.x, y: bounds.y, handle: 'nw' as const },
          { x: bounds.x + bounds.w, y: bounds.y, handle: 'ne' as const },
          { x: bounds.x, y: bounds.y + bounds.h, handle: 'sw' as const },
          { x: bounds.x + bounds.w, y: bounds.y + bounds.h, handle: 'se' as const }
        ];

        corners.forEach((corner) => {
          handles.push(
            <rect
              key={`${elementId}-handle-${corner.handle}`}
              data-element-id={elementId}
              data-handle={corner.handle}
              x={corner.x - handleSize / 2}
              y={corner.y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              fill="white"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ cursor: `${corner.handle}-resize`, pointerEvents: 'auto' }}
            />
          );
        });
      }
    });

    return handles;
  };

  /**
   * 渲染参考线 - 显示相对坐标的参考关系
   */
  const renderReferenceLines = () => {
    if (selectedElements.length === 0) return null;

    const lines: JSX.Element[] = [];

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      if (!elementData) return;

      const bounds = getElementBounds(elementId);
      const lineNum = parseInt(elementId);
      
      if (!isNaN(lineNum)) {
        const contentLines = content.split(/\r?\n/);
        if (lineNum > 0 && lineNum <= contentLines.length) {
          const line = contentLines[lineNum - 1];
          
          // 检测是否是相对坐标格式
          const isRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');
          
          if (isRelative && elementData.type === 'line') {
            // 绘制从起点到终点的参考线
            const { x1, y1, x2, y2 } = getLineCoordinates(elementData);
            const lineElement = elementData as any;
            
            lines.push(
              <line
                key={`ref-line-${elementId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--text-muted)"
                strokeWidth={2 / scale}
                strokeDasharray="4,4"
                opacity="0.5"
                pointerEvents="none"
              />
            );
            
            // 添加偏移量标签
            const dx = lineElement.end?.dx || x2 - x1;
            const dy = lineElement.end?.dy || y2 - y1;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            lines.push(
              <text
                key={`ref-label-${elementId}`}
                x={midX}
                y={midY - (5 / scale)}
                fontSize={`${10 / scale}px`}
                fill="var(--text-muted)"
                textAnchor="middle"
                pointerEvents="none"
              >
                dx:{dx}, dy:{dy}
              </text>
            );
          }
        }
      }
    });

    return <g className="reference-lines">{lines}</g>;
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-overlay">
        <div className="error-content">
          <div className="error-title">⚠️ Parse Error</div>
          <pre className="error-message">{error}</pre>
        </div>
      </div>
    );
  };

  const renderEmpty = () => {
    if (error || svg) return null;
    
    return (
      <div className="empty-overlay">
        <div className="empty-content">
          <div className="empty-icon">📝</div>
          <div className="empty-text">Drag elements here or write SolarWire code</div>
        </div>
      </div>
    );
  };

  const cursor = isSpacePressed ? 'grab' : undefined;

  return (
    <div
      ref={containerRef}
      className={`solarwire-preview ${isSpacePressed ? 'pan-mode' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onSelect={(e) => e.preventDefault()}
      style={{ 
        cursor,
        userSelect: 'none'
      }}
    >
      {svg && (
        <div
          ref={svgContainerRef}
          className="svg-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: getTransform(),
            transformOrigin: '0 0',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
          onSelect={(e) => e.preventDefault()}
        />
      )}

      {svg && (
        <div
          className="interaction-layer-wrapper"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: getTransform(),
            transformOrigin: '0 0'
          }}
        >
          <svg
            className="interaction-layer"
            viewBox={viewBox ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}` : "0 0 100000 100000"}
            width={viewBox?.width || 100000}
            height={viewBox?.height || 100000}
            style={{
              overflow: 'visible'
            }}
          >
            <g style={{ pointerEvents: 'auto' }}>
              {renderHoverHighlight()}
              {renderReferenceLines()}
              {renderSelectionHandles()}
            </g>
          </svg>
        </div>
      )}

      {/* 框选框 - 使用屏幕坐标 */}
      {boxSelection && (
        <div
          className="box-selection-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            {renderBoxSelection()}
          </svg>
        </div>
      )}

      {renderError()}
      {renderEmpty()}
    </div>
  );
}

export default SolarWirePreview;
