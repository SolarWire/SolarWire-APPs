import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useCoordinateSystem } from '../../../shared/hooks/useCoordinateSystem';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { parse } from '../../lib/parser-src';
import { 
  renderToCanvas, 
  ElementBounds 
} from '../../lib/renderer-canvas-src';
import { updateLineAttribute } from '../../utils/solarwire-utils';
import type { Document, Element as SolarWireElement } from '../../lib/parser-src/types';
import './SolarWireCanvas.css';

interface DragElementState {
  elements: Array<{
    id: string;
    originalX: number;
    originalY: number;
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
  const interactionLayerRef = useRef<SVGSVGElement>(null);
  
  const { content, setContent } = useEditorStore();
  const { selectedElements, selectElements, selectionTool } = useSolarWireStore();
  const { primaryColor } = useSettingsStore();
  
  // 计算当前是否处于视角移动模式
  const currentPanMode = isPanMode || isSpacePressed;
  
  const [scale, setScale] = useState(zoomLevel / 100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // 使用坐标系统Hook
  const { getWorldCoords, getTransform, containerRef } = useCoordinateSystem({
    position,
    scale
  });
  
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElementState, setDragElementState] = useState<DragElementState | null>(null);
  const [resizeHandleState, setResizeHandleState] = useState<ResizeHandleState | null>(null);
  const [boxSelection, setBoxSelection] = useState<BoxSelectionState | null>(null);
  const [elementBoundsMap, setElementBoundsMap] = useState<Map<string, ElementBounds>>(new Map());
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
    const coords = elementData.coordinates;
    const type = elementData.type;
    
    let x = 0, y = 0, w = 0, h = 0, r = 0, x2 = 0, y2 = 0;
    
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
      case 'line':
        x2 = parseInt(attrs.x2 || String(x + 100));
        y2 = parseInt(attrs.y2 || String(y));
        w = Math.abs(x2 - x);
        h = Math.abs(y2 - y) || 2;
        break;
      default:
        w = parseInt(attrs.w || '100');
        h = parseInt(attrs.h || '50');
        r = parseInt(attrs.r || '0');
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
    
    for (let i = ast.elements.length - 1; i >= 0; i--) {
      const element = ast.elements[i];
      const id = (element as any).id || element.location?.line?.toString();
      if (!id) continue;
      
      const bounds = elementBoundsMap.get(id);
      if (!bounds) continue;
      
      // First check if mouse is within element bounds
      const elementWidth = bounds.width || (bounds as any).w || 0;
      const elementHeight = bounds.height || (bounds as any).h || 0;
      
      if (x >= bounds.x && x <= bounds.x + elementWidth && y >= bounds.y && y <= bounds.y + elementHeight) {
        if (element.type === 'line') {
          // For lines, calculate distance to line
          const lineBounds = getElementBounds(id);
          const dist = pointToLineDistance(x, y, lineBounds.x, lineBounds.y, lineBounds.x2 || lineBounds.x + 100, lineBounds.y2 || lineBounds.y);
          if (dist < 10) {
            return id;
          }
        } else {
          // For other elements, just return the id
          return id;
        }
      }
    }
    return null;
  }, [ast, elementBoundsMap, getElementBounds, pointToLineDistance]);
  
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
    
    const corners = [
      { x: bounds.x, y: bounds.y, handle: 'nw' },
      { x: bounds.x + bounds.width, y: bounds.y, handle: 'ne' },
      { x: bounds.x, y: bounds.y + bounds.height, handle: 'sw' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: 'se' }
    ];
    
    for (const corner of corners) {
      if (
        Math.abs(x - corner.x) < handleSize &&
        Math.abs(y - corner.y) < handleSize
      ) {
        return corner.handle;
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
    
    const coords = getWorldCoords(e.clientX, e.clientY);
    
    // 如果处于视角移动模式，直接进入画布拖动状态
    if (currentPanMode) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      return;
    }
    
    // 尝试获取鼠标点击位置的元素
    const elementId = getElementAtPosition(coords.x, coords.y);
    
    if (elementId) {
      // 如果点击到了元素，选中该元素
      selectElements([elementId]);
    } else {
      // 如果没有点击到元素，开始框选（始终使用包含框选）
      setBoxSelection({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y
      });
    }
  }, [currentPanMode, getWorldCoords, position, getElementAtPosition, selectElements]);
  
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
    
    const coords = getWorldCoords(e.clientX, e.clientY);
    
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
    }
  }, [currentPanMode, isDraggingCanvas, dragStart, position, boxSelection, getWorldCoords, getElementAtPosition]);
  
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
  }, [isDraggingCanvas, boxSelection, testBoxSelection]);
  
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
      const coords = getWorldCoords(e.clientX, e.clientY);
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
  }, [content, setContent, getWorldCoords]);
  
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
            {['nw', 'ne', 'sw', 'se'].map(handle => {
              const hx = handle === 'nw' || handle === 'sw' ? bounds.x : bounds.x + bounds.w;
              const hy = handle === 'nw' || handle === 'ne' ? bounds.y : bounds.y + bounds.h;
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
                  style={{ cursor: `${handle}-resize`, pointerEvents: 'auto' }}
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
            transform: getTransform(),
            transformOrigin: '0 0'
          }}
      />
      
      <svg
        ref={interactionLayerRef}
        className="solarwire-canvas-interaction-layer"
        style={{
          transform: getTransform(),
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
