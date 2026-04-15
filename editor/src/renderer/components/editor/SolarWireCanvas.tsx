import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { parse } from '../../lib/parser-src';
import { 
  renderToCanvas, 
  ElementBounds,
  NoteBadgeInfo
} from '../../lib/renderer-canvas-src';
import { updateLineAttribute, updateLineCoords } from '../../utils/solarwire-utils';
import type { Document, Element as SolarWireElement } from '../../lib/parser-src/types';
import './SolarWireCanvas.css';

interface DragElementState {
  elements: Array<{
    id: string;
    originalX: number;
    originalY: number;
    originalX2?: number;
    originalY2?: number;
    isLine?: boolean;
  }>;
  startX: number;
  startY: number;
}

interface BoxSelectionState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface ResizeHandleState {
  elementId: string;
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'start' | 'end';
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW: number;
  elementH: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}

interface SolarWireCanvasProps {
  zoomLevel: number;
  showNotes?: boolean;
  onZoomChange?: (zoom: number) => void;
  isPanMode?: boolean;
  isSpacePressed?: boolean;
}

const ANGLE_SNAP_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];
// 无限制尺寸画布实现：
// 核心原理：容器作为摄像头，拍摄画布的某个区域
// 世界坐标系：元素的真实坐标，不受视口影响
// 屏幕坐标系：用户看到的像素坐标
// 坐标变换：通过视口的位置和缩放来转换两种坐标

function snapToAngle(dx: number, dy: number): { dx: number; dy: number } {
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return { dx, dy };
  
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  
  let closestAngle = ANGLE_SNAP_DEGREES[0];
  let minDiff = Math.abs(angle - closestAngle);
  
  for (const snapAngle of ANGLE_SNAP_DEGREES) {
    const diff = Math.min(Math.abs(angle - snapAngle), 360 - Math.abs(angle - snapAngle));
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = snapAngle;
    }
  }
  
  const rad = closestAngle * (Math.PI / 180);
  return {
    dx: Math.round(length * Math.cos(rad)),
    dy: Math.round(length * Math.sin(rad))
  };
}

function SolarWireCanvas({ zoomLevel, showNotes = true, onZoomChange, isPanMode = false, isSpacePressed = false }: SolarWireCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionLayerRef = useRef<SVGSVGElement>(null);
  
  const { content, setContent } = useEditorStore();
  const { selectedElements, selectElements, selectionTool } = useSolarWireStore();
  const { primaryColor } = useSettingsStore();
  
  // 计算当前是否处于视角移动模式
  const currentPanMode = isPanMode || isSpacePressed;
  
  const [scale, setScale] = useState(zoomLevel / 100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElementState, setDragElementState] = useState<DragElementState | null>(null);
  const [resizeHandleState, setResizeHandleState] = useState<ResizeHandleState | null>(null);
  const [boxSelection, setBoxSelection] = useState<BoxSelectionState | null>(null);
  const [elementBoundsMap, setElementBoundsMap] = useState<Map<string, ElementBounds>>(new Map());
  const [noteBadges, setNoteBadges] = useState<NoteBadgeInfo[]>([]);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 400, height: 300 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const ast: Document | null = useMemo(() => {
    try {
      const safeContent = content || '';
      if (!safeContent.trim()) return null;
      return parse(safeContent);
    } catch (e) {
      console.error('Parse error:', e);
      return null;
    }
  }, [content]);
  
  useEffect(() => {
    if (!isInitialized) {
      setScale(zoomLevel / 100);
    }
  }, [zoomLevel, isInitialized]);
  
  const [renderError, setRenderError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!canvasRef.current || !ast) {
      setRenderError(null);
      return;
    }
    
    try {
      const canvas = canvasRef.current;
      const result = renderToCanvas(canvas, ast, {
        selectedElementIds: [],
        primaryColor,
        showNotes,
        sourceInput: content || ''
      });
      
      setElementBoundsMap(result.elementBoundsMap);
      setNoteBadges(result.noteBadges);
      // 不再使用 viewBox 限制，而是让视口自由移动
      // setViewBox(result.viewBox);
      setRenderError(null);
    } catch (error) {
      console.error('Render error:', error);
      setRenderError(error instanceof Error ? error.message : String(error));
    }
  }, [ast, primaryColor, showNotes, content, containerSize]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
      
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const container = containerRef.current;
    if (container) {
      const observer = new ResizeObserver(entries => {
        handleResize();
      });
      observer.observe(container);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    // 将屏幕坐标转换为世界坐标
    // 公式：世界坐标 = (屏幕坐标 - 视口偏移) / 缩放比例
    const x = (clientX - rect.left - position.x) / scale;
    const y = (clientY - rect.top - position.y) / scale;
    
    return { x, y };
  }, [position, scale]);
  
  const getElementData = useCallback((elementId: string): SolarWireElement | null => {
    if (!ast) return null;
    
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum)) {
      return ast.elements.find(e => (e as any).id === elementId) || null;
    }
    return ast.elements.find(e => e.location?.line === lineNum) || null;
  }, [ast]);
  
  const getElementBounds = useCallback((elementId: string) => {
    const elementData = getElementData(elementId);
    if (!elementData) return { x: 0, y: 0, w: 0, h: 0, r: 0, x2: 0, y2: 0, type: '' };
    const attrs = elementData.attributes || {};
    const type = elementData.type;
    
    let x = 0, y = 0, w = 0, h = 0, r = 0, x2 = 0, y2 = 0;
    
    if (type === 'line') {
      // 线段特殊处理：从 start 和 end 中读取坐标
      const el = elementData as any;
      
      // 读取起点坐标（绝对坐标优先）
      if (el.start && el.start.x && el.start.x.type === 'absolute') {
        x = el.start.x.value;
      } else {
        x = parseInt(attrs.x || '0');
      }
      
      if (el.start && el.start.y && el.start.y.type === 'absolute') {
        y = el.start.y.value;
      } else {
        y = parseInt(attrs.y || '0');
      }
      
      // 读取终点坐标（绝对坐标优先）
      if (el.end) {
        if (el.end.type === 'relative') {
          // 相对坐标
          x2 = x + (el.end.dx || 100);
          y2 = y + (el.end.dy || 0);
        } else {
          // 绝对坐标
          if (el.end.x && el.end.x.type === 'absolute') {
            x2 = el.end.x.value;
          } else {
            x2 = parseInt(attrs.x2 || String(x + 100));
          }
          
          if (el.end.y && el.end.y.type === 'absolute') {
            y2 = el.end.y.value;
          } else {
            y2 = parseInt(attrs.y2 || String(y));
          }
        }
      } else {
        // 没有 end 属性，从 attributes 读取
        x2 = parseInt(attrs.x2 || String(x + 100));
        y2 = parseInt(attrs.y2 || String(y));
      }
      
      w = Math.abs(x2 - x);
      h = Math.abs(y2 - y) || 2;
    } else {
      // 其他元素正常处理
      const coords = elementData.coordinates;
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
          w = parseInt(attrs.w || '100');
          h = 20;
          break;
        default:
          w = parseInt(attrs.w || '100');
          h = parseInt(attrs.h || '50');
          r = parseInt(attrs.r || '0');
      }
    }
    
    return { x, y, w, h, r, x2, y2, type, width: w, height: h };
  }, [getElementData]);
  
  const pointToLineDistance = useCallback((px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
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
  }, []);
  
  const getElementAtPosition = useCallback((x: number, y: number): string | null => {
    if (!ast) return null;
    
    // 优先检查 note badge 的点击
    for (const badge of noteBadges) {
      const dist = Math.sqrt((x - badge.x) ** 2 + (y - badge.y) ** 2);
      if (dist <= badge.radius + 4) {
        return badge.elementId;
      }
    }
    
    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const id = (element as any).id || element.location?.line?.toString();
      if (!id) continue;
      
      const bounds = elementBoundsMap.get(id);
      if (!bounds) continue;
      
      const elementWidth = bounds.width || (bounds as any).w || 0;
      const elementHeight = bounds.height || (bounds as any).h || 0;
      
      if (x >= bounds.x && x <= bounds.x + elementWidth && y >= bounds.y && y <= bounds.y + elementHeight) {
        if (element.type === 'line') {
          const lineBounds = getElementBounds(id);
          const dist = pointToLineDistance(x, y, lineBounds.x, lineBounds.y, lineBounds.x2 || lineBounds.x + 100, lineBounds.y2 || lineBounds.y);
          if (dist < 10) {
            return id;
          }
        } else {
          return id;
        }
      }
    }
    return null;
  }, [ast, elementBoundsMap, getElementBounds, pointToLineDistance, noteBadges]);
  
  const getLineHandleAtPosition = useCallback((x: number, y: number, bounds: { x: number; y: number; x2: number; y2: number }): 'start' | 'end' | null => {
    const handleSize = 12 / scale;
    
    if (Math.abs(x - bounds.x) < handleSize && Math.abs(y - bounds.y) < handleSize) {
      return 'start';
    }
    if (Math.abs(x - bounds.x2) < handleSize && Math.abs(y - bounds.y2) < handleSize) {
      return 'end';
    }
    
    return null;
  }, [scale]);
  
  const getHandleAtPosition = useCallback((x: number, y: number, bounds: ElementBounds, elementType: string): string | null => {
    const handleSize = 12 / scale;
    
    if (elementType === 'line') {
      const lineBounds = bounds as any;
      return getLineHandleAtPosition(x, y, { x: lineBounds.x, y: lineBounds.y, x2: lineBounds.x2, y2: lineBounds.y2 });
    }
    
    const handles = [
      { x: bounds.x, y: bounds.y, handle: 'nw' },
      { x: bounds.x + bounds.width, y: bounds.y, handle: 'ne' },
      { x: bounds.x, y: bounds.y + bounds.height, handle: 'sw' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: 'se' },
      { x: bounds.x + bounds.width / 2, y: bounds.y, handle: 'n' },
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, handle: 's' },
      { x: bounds.x, y: bounds.y + bounds.height / 2, handle: 'w' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, handle: 'e' }
    ];
    
    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) < handleSize &&
        Math.abs(y - handle.y) < handleSize
      ) {
        return handle.handle;
      }
    }
    
    return null;
  }, [scale, getLineHandleAtPosition]);
  
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
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
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
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    
    // 如果处于视角移动模式，直接进入画布拖动状态
    if (currentPanMode) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      return;
    }
    
    // 尝试获取鼠标点击位置的元素
    const elementId = getElementAtPosition(coords.x, coords.y);
    
    if (elementId) {
      // 检查是否点击到了调整大小的句柄
      const elementData = getElementData(elementId);
      const elementBounds = getElementBounds(elementId);
      
      let handle;
      if (elementData?.type === 'line') {
        // 对于线段，使用专门的句柄检测
        handle = getLineHandleAtPosition(coords.x, coords.y, { 
          x: elementBounds.x, 
          y: elementBounds.y, 
          x2: elementBounds.x2 || elementBounds.x + 100, 
          y2: elementBounds.y2 || elementBounds.y 
        });
      } else {
        // 其他元素使用通用句柄检测
        const bounds: ElementBounds = {
          x: elementBounds.x,
          y: elementBounds.y,
          width: elementBounds.w,
          height: elementBounds.h
        };
        handle = getHandleAtPosition(coords.x, coords.y, bounds, elementData?.type || '');
      }
      
      if (handle) {
        // 开始调整大小，使用 elementBoundsMap 确保准确性
        const accurateBounds = elementBoundsMap.get(elementId) || { x: 0, y: 0, width: 0, height: 0 };
        
        setResizeHandleState({
          elementId,
          handle: handle as any,
          startX: coords.x,
          startY: coords.y,
          elementX: accurateBounds.x,
          elementY: accurateBounds.y,
          elementW: accurateBounds.width,
          elementH: accurateBounds.height,
          elementX2: (accurateBounds as any).x2,
          elementY2: (accurateBounds as any).y2,
          isLine: elementData?.type === 'line'
        });
      } else {
        // 如果点击到了元素但不是句柄，开始拖动
        const elementsToDrag: any[] = [];
        
        // 检查是否有多个元素被选中，并且当前点击的元素在选中列表中
        if (selectedElements.length > 1 && selectedElements.includes(elementId)) {
          // 拖动所有选中的元素
          selectedElements.forEach((id: string) => {
            // 直接使用 elementBoundsMap（从 renderToCanvas 来的，最准确！）
            const elBounds = elementBoundsMap.get(id);
            const elData = getElementData(id);
            
            const dragElement: any = {
              id,
              originalX: elBounds?.x || 0,
              originalY: elBounds?.y || 0,
              isLine: elData?.type === 'line'
            };
            
            if (elData?.type === 'line' && elBounds?.x2 !== undefined && elBounds?.y2 !== undefined) {
              dragElement.originalX2 = elBounds.x2;
              dragElement.originalY2 = elBounds.y2;
            }
            
            elementsToDrag.push(dragElement);
          });
        } else {
          // 只拖动当前点击的单个元素
          // 直接使用 elementBoundsMap（从 renderToCanvas 来的，最准确！）
          const accurateBounds = elementBoundsMap.get(elementId);
          
          if (elementData?.type === 'line') {
            console.log('[线段拖动] elementId:', elementId, 'accurateBounds:', JSON.stringify(accurateBounds));
          }
          
          const dragElement: any = {
            id: elementId,
            originalX: accurateBounds?.x || 0,
            originalY: accurateBounds?.y || 0,
            isLine: elementData?.type === 'line'
          };
          
          // 如果是线段，同时保存终点坐标（从 elementBoundsMap 获取）
          if (elementData?.type === 'line' && accurateBounds?.x2 !== undefined && accurateBounds?.y2 !== undefined) {
            dragElement.originalX2 = accurateBounds.x2;
            dragElement.originalY2 = accurateBounds.y2;
            console.log('[线段拖动] 保存终点坐标:', accurateBounds.x2, accurateBounds.y2);
          } else if (elementData?.type === 'line') {
            console.log('[线段拖动] 警告：没有找到终点坐标！accurateBounds:', JSON.stringify(accurateBounds));
          }
          
          elementsToDrag.push(dragElement);
        }
        
        setDragElementState({
          elements: elementsToDrag,
          startX: coords.x,
          startY: coords.y
        });
      }
    } else {
      // 如果没有点击到元素，开始框选（始终使用包含框选）
      setBoxSelection({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y
      });
    }
  }, [currentPanMode, getCanvasCoords, position, getElementAtPosition, selectElements, getElementData, getElementBounds, getHandleAtPosition, getLineHandleAtPosition, elementBoundsMap, selectedElements]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 如果处于视角移动模式，只处理画布拖动，不更新悬停状态
    if (currentPanMode) {
      if (isDraggingCanvas) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      return;
    }
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    
    // 更新悬停元素
    const elementId = getElementAtPosition(coords.x, coords.y);
    setHoveredElement(elementId);
    
    if (isDraggingCanvas) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }
    
    if (boxSelection) {
      setBoxSelection({
        ...boxSelection,
        currentX: coords.x,
        currentY: coords.y
      });
      return;
    }
    
    if (dragElementState) {
      const { elements, startX, startY } = dragElementState;
      let deltaX = coords.x - startX;
      let deltaY = coords.y - startY;
      
      // Shift 键约束：只允许水平或垂直方向拖动
      if (isShiftPressed) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          deltaY = 0; // 只水平移动
        } else {
          deltaX = 0; // 只垂直移动
        }
      }
      
      // 处理元素拖动 - 使用临时变量累积所有更新，只调用一次 setContent
      let tempContent = content;
      elements.forEach(({ id, originalX, originalY, originalX2, originalY2, isLine }) => {
        const lineNum = parseInt(id);
        if (!isNaN(lineNum)) {
          
          if (isLine) {
            // 线段拖动：直接使用保存的原始坐标，不调用任何 get 函数
            const newX = Math.round(originalX + deltaX);
            const newY = Math.round(originalY + deltaY);
            const finalX2 = originalX2 !== undefined ? originalX2 : originalX + 100;
            const finalY2 = originalY2 !== undefined ? originalY2 : originalY;
            const newX2 = Math.round(finalX2 + deltaX);
            const newY2 = Math.round(finalY2 + deltaY);
            
            console.log('[线段拖动] 移动:', { 
              originalX, originalY, originalX2, originalY2, 
              deltaX, deltaY, 
              newX, newY, newX2, newY2 
            });
            
            // 累积更新到 tempContent
            tempContent = updateLineCoords(tempContent, lineNum, newX, newY, newX2, newY2);
          } else {
            // 其他元素拖动
            const newX = Math.round(originalX + deltaX);
            const newY = Math.round(originalY + deltaY);
            tempContent = updateLineAttribute(tempContent, lineNum, 'x', newX);
            tempContent = updateLineAttribute(tempContent, lineNum, 'y', newY);
          }
        }
      });
      
      // 只调用一次 setContent，将所有累积的更新一次性应用
      setContent(tempContent);
      return;
    }
    
    if (resizeHandleState) {
      const { elementId, handle, startX, startY, elementX, elementY, elementW, elementH, elementX2, elementY2, isLine } = resizeHandleState;
      const deltaX = coords.x - startX;
      const deltaY = coords.y - startY;
      
      let newX = elementX;
      let newY = elementY;
      let newW = elementW;
      let newH = elementH;
      let newX2 = elementX2 || elementX + elementW;
      let newY2 = elementY2 || elementY;
      
      if (isLine) {
        // 线段调整逻辑
        let finalX = elementX;
        let finalY = elementY;
        let finalX2 = elementX2 as number;
        let finalY2 = elementY2 as number;
        
        if (handle === 'start') {
          finalX = elementX + deltaX;
          finalY = elementY + deltaY;
        } else if (handle === 'end') {
          finalX2 = (elementX2 as number) + deltaX;
          finalY2 = (elementY2 as number) + deltaY;
        }
        
        // Shift 键约束：直线角度
        if (isShiftPressed) {
          const { dx, dy } = snapToAngle(finalX2 - finalX, finalY2 - finalY);
          finalX2 = finalX + dx;
          finalY2 = finalY + dy;
        }
        
        // 更新线段 - 使用新的 updateLineCoords 函数
        const lineNum = parseInt(elementId);
        if (!isNaN(lineNum)) {
          const newContent = updateLineCoords(
            content, 
            lineNum, 
            Math.round(finalX), 
            Math.round(finalY), 
            Math.round(finalX2), 
            Math.round(finalY2)
          );
          setContent(newContent);
        }
      } else {
        // 其他元素调整逻辑
        const nonLineHandle = handle as 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
        switch (nonLineHandle) {
          case 'nw':
            newX = elementX + deltaX;
            newY = elementY + deltaY;
            newW = elementW - deltaX;
            newH = elementH - deltaY;
            break;
          case 'ne':
            newY = elementY + deltaY;
            newW = elementW + deltaX;
            newH = elementH - deltaY;
            break;
          case 'sw':
            newX = elementX + deltaX;
            newW = elementW - deltaX;
            newH = elementH + deltaY;
            break;
          case 'se':
            newW = elementW + deltaX;
            newH = elementH + deltaY;
            break;
          case 'n':
            newY = elementY + deltaY;
            newH = elementH - deltaY;
            break;
          case 's':
            newH = elementH + deltaY;
            break;
          case 'w':
            newX = elementX + deltaX;
            newW = elementW - deltaX;
            break;
          case 'e':
            newW = elementW + deltaX;
            break;
        }
        
        // 确保尺寸为正数
        if (newW < 10) newW = 10;
        if (newH < 10) newH = 10;
        
        // Shift 键约束
        if (isShiftPressed) {
          const elementData = getElementData(elementId);
          if (elementData?.type === 'circle') {
            // 正圆约束
            const minSize = Math.min(newW, newH);
            newW = newH = minSize;
          } else if (nonLineHandle === 'nw' || nonLineHandle === 'ne' || nonLineHandle === 'sw' || nonLineHandle === 'se') {
            // 保持比例约束
            const aspectRatio = elementW / elementH;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              newH = newW / aspectRatio;
            } else {
              newW = newH * aspectRatio;
            }
          } else if (nonLineHandle === 'n' || nonLineHandle === 's') {
            // 垂直约束：只允许改变高度，不改变宽度
            newW = elementW;
            // 保持 x 坐标不变
            newX = elementX;
          } else if (nonLineHandle === 'w' || nonLineHandle === 'e') {
            // 水平约束：只允许改变宽度，不改变高度
            newH = elementH;
            // 保持 y 坐标不变
            newY = elementY;
          }
        }
        
        // 更新元素
        const lineNum = parseInt(elementId);
        if (!isNaN(lineNum)) {
          let newContent = content;
          newContent = updateLineAttribute(newContent, lineNum, 'x', Math.round(newX));
          newContent = updateLineAttribute(newContent, lineNum, 'y', Math.round(newY));
          newContent = updateLineAttribute(newContent, lineNum, 'w', Math.round(newW));
          newContent = updateLineAttribute(newContent, lineNum, 'h', Math.round(newH));
          setContent(newContent);
        }
      }
    }
  }, [currentPanMode, isDraggingCanvas, dragStart, position, boxSelection, getCanvasCoords, getElementAtPosition, resizeHandleState, content, setContent, isShiftPressed, getElementData]);
  
  const handleMouseUp = useCallback(() => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      return;
    }

    if (boxSelection) {
      testBoxSelection(
        boxSelection.startX,
        boxSelection.startY,
        boxSelection.currentX,
        boxSelection.currentY
      );
      setBoxSelection(null);
    }
    
    if (resizeHandleState) {
      setResizeHandleState(null);
    }
    
    if (dragElementState) {
      setDragElementState(null);
    }
  }, [isDraggingCanvas, boxSelection, testBoxSelection, resizeHandleState, dragElementState]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredElement(null);
    handleMouseUp();
  }, [handleMouseUp]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const elementData = JSON.parse(jsonData);
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const x = Math.round(coords.x);
      const y = Math.round(coords.y);

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
  }, [content, setContent, getCanvasCoords]);
  
  // 计算当前光标样式
  const cursor = currentPanMode ? (isDraggingCanvas ? 'grabbing' : 'grab') : 'default';
  
  const renderInteractionLayer = () => {
    const elements: React.ReactNode[] = [];
    
    if (hoveredElement && !selectedElements.includes(hoveredElement)) {
      const bounds = getElementBounds(hoveredElement);
      const elementData = getElementData(hoveredElement);
      
      if (elementData?.type === 'line') {
        elements.push(
          <line
            key="hover"
            x1={bounds.x}
            y1={bounds.y}
            x2={bounds.x2 || bounds.x + 100}
            y2={bounds.y2 || bounds.y}
            stroke={primaryColor}
            strokeWidth={3 / scale}
            opacity={0.5}
          />
        );
      } else {
        elements.push(
          <rect
            key="hover"
            x={bounds.x}
            y={bounds.y}
            width={bounds.w}
            height={bounds.h}
            fill="none"
            stroke={primaryColor}
            strokeWidth={2 / scale}
            opacity={0.5}
          />
        );
      }
    }
    
    selectedElements.forEach(elementId => {
      const elementData = getElementData(elementId);
      const bounds = getElementBounds(elementId);
      const handleSize = 10 / scale;
      
      if (elementData?.type === 'line') {
        elements.push(
          <g key={`selected-${elementId}`}>
            <line
              x1={bounds.x}
              y1={bounds.y}
              x2={bounds.x2 || bounds.x + 100}
              y2={bounds.y2 || bounds.y}
              stroke={primaryColor}
              strokeWidth={3 / scale}
              style={{
                filter: `drop-shadow(0 0 4px ${primaryColor}) drop-shadow(0 0 8px ${primaryColor})`
              }}
            />
            <circle
              cx={bounds.x}
              cy={bounds.y}
              r={handleSize}
              fill="white"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ cursor: 'move', pointerEvents: 'auto' }}
            />
            <circle
              cx={bounds.x2 || bounds.x + 100}
              cy={bounds.y2 || bounds.y}
              r={handleSize}
              fill="white"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ cursor: 'move', pointerEvents: 'auto' }}
            />
          </g>
        );
      } else {
        elements.push(
          <g key={`selected-${elementId}`}>
            <rect
              x={bounds.x}
              y={bounds.y}
              width={bounds.w}
              height={bounds.h}
              fill="none"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{
                filter: `drop-shadow(0 0 4px ${primaryColor}) drop-shadow(0 0 8px ${primaryColor})`
              }}
            />
            {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(handle => {
              let hx, hy, cursor;
              switch (handle) {
                case 'nw':
                  hx = bounds.x;
                  hy = bounds.y;
                  cursor = 'nwse-resize';
                  break;
                case 'ne':
                  hx = bounds.x + bounds.w;
                  hy = bounds.y;
                  cursor = 'nesw-resize';
                  break;
                case 'sw':
                  hx = bounds.x;
                  hy = bounds.y + bounds.h;
                  cursor = 'nesw-resize';
                  break;
                case 'se':
                  hx = bounds.x + bounds.w;
                  hy = bounds.y + bounds.h;
                  cursor = 'nwse-resize';
                  break;
                case 'n':
                  hx = bounds.x + bounds.w / 2;
                  hy = bounds.y;
                  cursor = 'ns-resize';
                  break;
                case 's':
                  hx = bounds.x + bounds.w / 2;
                  hy = bounds.y + bounds.h;
                  cursor = 'ns-resize';
                  break;
                case 'w':
                  hx = bounds.x;
                  hy = bounds.y + bounds.h / 2;
                  cursor = 'ew-resize';
                  break;
                case 'e':
                  hx = bounds.x + bounds.w;
                  hy = bounds.y + bounds.h / 2;
                  cursor = 'ew-resize';
                  break;
                default:
                  hx = 0;
                  hy = 0;
                  cursor = 'default';
              }
              return (
                <rect
                  key={handle}
                  x={hx - handleSize / 2}
                  y={hy - handleSize / 2}
                  width={handleSize}
                  height={handleSize}
                  fill="white"
                  stroke={primaryColor}
                  strokeWidth={2 / scale}
                  style={{ cursor, pointerEvents: 'auto' }}
                />
              );
            })}
          </g>
        );
      }
    });
    
    if (boxSelection) {
      elements.push(
        <rect
          key="box-selection"
          x={Math.min(boxSelection.startX, boxSelection.currentX)}
          y={Math.min(boxSelection.startY, boxSelection.currentY)}
          width={Math.abs(boxSelection.currentX - boxSelection.startX)}
          height={Math.abs(boxSelection.currentY - boxSelection.startY)}
          fill={`${primaryColor}15`}
          stroke={primaryColor}
          strokeWidth={2 / scale}
        />
      );
    }
    
    return elements;
  };
  
  return (
    <div 
      ref={containerRef} 
      className={`solarwire-canvas-container ${isSpacePressed ? 'pan-mode' : ''}`}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        className="solarwire-canvas-render-layer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      />
      
      <svg
        ref={interactionLayerRef}
        className="solarwire-canvas-interaction-layer"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {renderInteractionLayer()}
        </g>
      </svg>
      
      {renderError && (
        <div className="solarwire-render-error" style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          backgroundColor: '#fff3f3',
          border: '1px solid #ff9999',
          borderRadius: '8px',
          padding: '16px',
          color: '#d32f2f',
          fontFamily: 'Monaco, monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {renderError}
        </div>
      )}
    </div>
  );
}

export default SolarWireCanvas;
