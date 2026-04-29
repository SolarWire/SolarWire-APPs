import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFileStore } from '../../stores/fileStore';
import { useEditorStore } from '../../stores/editorStore';
import { parse } from '../../../lib/parser';
import { renderToCanvas } from '../../../lib/renderer/canvas-renderer';
import { render } from '../../../lib/renderer';
import { updateLineAttribute, detectElementBounds, getElementDataFromContent } from '../../../shared/utils/solarwire-utils';
import { snapToGridValue } from '../../../shared/utils/preview-utils';
import './CanvasPreview.css';

interface CanvasPreviewProps {
  onElementClick?: (elementId: string) => void;
  zoomLevel?: number;
  selectionTool?: any;
  showNotes?: boolean;
  onZoomChange?: (zoom: number) => void;
  isPanMode?: boolean;
  isSpacePressed?: boolean;
  snapToGridProp?: boolean;
  gridSizeProp?: number;
  externalContent?: string;
  onExternalContentChange?: (content: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  allowImageElements?: boolean;
  onRequestExportSvg?: (getSvgContent: () => string | null) => void;
  hasSyntaxErrors?: boolean;
}

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface BoxSelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  elementId: string;
}

interface ResizeHandleState {
  isResizing: boolean;
  elementId: string | null;
  elementLine: number | null;
  handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW: number;
  elementH: number;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  elementLine: number | null;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementX2?: number;
  elementY2?: number;
  isLine: boolean;
  isRelative: boolean;
}

function CanvasPreview({ 
  onElementClick, 
  zoomLevel: propZoomLevel,
  selectionTool: propSelectionTool,
  showNotes: propShowNotes,
  onZoomChange,
  isPanMode: propIsPanMode,
  isSpacePressed: propIsSpacePressed,
  snapToGridProp: propSnapToGrid,
  gridSizeProp: propGridSize,
  externalContent,
  onExternalContentChange,
  onContextMenu,
  allowImageElements = true,
  onRequestExportSvg,
  hasSyntaxErrors = false
}: CanvasPreviewProps): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, setContent } = useEditorStore();
  const { selectedElements, setSelectedElements, zoomLevel: storeZoomLevel, isPanMode: storeIsPanMode, selectionTool: storeSelectionTool, showNotes: storeShowNotes } = useSolarWireStore();
  const { primaryColor, snapToGrid: storeSnapToGrid, gridSize: storeGridSize } = useSettingsStore();
  const { selectedFile } = useFileStore();
  
  // Use props if provided, otherwise fall back to store values
  const effectiveZoomLevel = propZoomLevel !== undefined ? propZoomLevel : storeZoomLevel;
  const effectiveIsPanMode = propIsPanMode !== undefined ? propIsPanMode : storeIsPanMode;
  const effectiveSelectionTool = propSelectionTool !== undefined ? propSelectionTool : storeSelectionTool;
  const effectiveShowNotes = propShowNotes !== undefined ? propShowNotes : storeShowNotes;
  const effectiveSnapToGrid = propSnapToGrid !== undefined ? propSnapToGrid : storeSnapToGrid;
  const effectiveGridSize = propGridSize !== undefined ? propGridSize : storeGridSize;
  const effectiveContent = externalContent !== undefined ? externalContent : content;
  const effectiveSetContent = onExternalContentChange || setContent;
  const effectiveIsSpacePressed = propIsSpacePressed !== undefined ? propIsSpacePressed : false;
  
  const [pan, setPan] = useState<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  
  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    elementId: null,
    elementLine: null,
    startX: 0,
    startY: 0,
    elementX: 0,
    elementY: 0,
    elementX2: undefined,
    elementY2: undefined,
    isLine: false,
    isRelative: false
  });

  const [resize, setResize] = useState<ResizeHandleState>({
    isResizing: false,
    elementId: null,
    elementLine: null,
    handle: null,
    startX: 0,
    startY: 0,
    elementX: 0,
    elementY: 0,
    elementW: 0,
    elementH: 0
  });

  const [boxSelection, setBoxSelection] = useState<BoxSelectionState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  });

  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);

  const [elementsInfo, setElementsInfo] = useState<any[]>([]);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 400, height: 300 });
  const [hoveredElement, setHoveredElement] = useState<{ id: string; line?: number } | null>(null);

  const imageUrlResolver = useMemo(() => {
    return (relativePath: string): string => {
      if (!selectedFile) return relativePath;
      const fileDir = selectedFile.path.substring(0, selectedFile.path.lastIndexOf('\\'));
      if (fileDir) {
        return `${fileDir}\\${relativePath}`;
      }
      return relativePath;
    };
  }, [selectedFile]);

  const scale = effectiveZoomLevel / 100;

  const screenToCanvas = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Calculate the same transformations as in the render effect
    const scale = effectiveZoomLevel / 100;
    const viewBoxOffsetX = viewBox.x;
    const viewBoxOffsetY = viewBox.y;
    
    // Convert screen coordinates to canvas coordinates
    // First, get coordinates relative to canvas
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    // Reverse the transformations in the same order as render
    // Render: translate(containerWidth/2, containerHeight/2) -> scale(scale) -> translate(-viewBoxOffsetX - viewBox.width/2, -viewBoxOffsetY - viewBox.height/2) -> translate(pan.offsetX/scale, pan.offsetY/scale)
    // Reverse: subtract pan.offsetX/scale -> add viewBoxOffsetX + viewBox.width/2 -> divide by scale -> subtract containerWidth/2
    
    const x = (canvasX - containerWidth / 2) / scale + viewBoxOffsetX + viewBox.width / 2 - pan.offsetX / scale;
    const y = (canvasY - containerHeight / 2) / scale + viewBoxOffsetY + viewBox.height / 2 - pan.offsetY / scale;
    
    return { x, y };
  }, [pan.offsetX, pan.offsetY, effectiveZoomLevel, viewBox]);

  const findElementAtPosition = useCallback((x: number, y: number): { id: string; line?: number } | null => {
    // Search in reverse order (top elements first)
    for (let i = elementsInfo.length - 1; i >= 0; i--) {
      const elem = elementsInfo[i];
      const bounds = elem.bounds;
      
      // Check if point is within element bounds
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        return { id: elem.id, line: elem.line };
      }
    }
    return null;
  }, [elementsInfo]);

  const calculateAlignmentGuides = useCallback((draggedElementBounds: any, allElements: any[]): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    const threshold = 5;
    
    allElements.forEach(elem => {
      if (elem.id === drag.elementId) return;
      
      const bounds = elem.bounds;
      
      // Horizontal guides (top, center, bottom)
      if (Math.abs(bounds.y - draggedElementBounds.y) < threshold) {
        guides.push({ type: 'horizontal', position: bounds.y, elementId: elem.id });
      }
      if (Math.abs(bounds.y + bounds.height / 2 - (draggedElementBounds.y + draggedElementBounds.height / 2)) < threshold) {
        guides.push({ type: 'horizontal', position: bounds.y + bounds.height / 2, elementId: elem.id });
      }
      if (Math.abs(bounds.y + bounds.height - (draggedElementBounds.y + draggedElementBounds.height)) < threshold) {
        guides.push({ type: 'horizontal', position: bounds.y + bounds.height, elementId: elem.id });
      }
      
      // Vertical guides (left, center, right)
      if (Math.abs(bounds.x - draggedElementBounds.x) < threshold) {
        guides.push({ type: 'vertical', position: bounds.x, elementId: elem.id });
      }
      if (Math.abs(bounds.x + bounds.width / 2 - (draggedElementBounds.x + draggedElementBounds.width / 2)) < threshold) {
        guides.push({ type: 'vertical', position: bounds.x + bounds.width / 2, elementId: elem.id });
      }
      if (Math.abs(bounds.x + bounds.width - (draggedElementBounds.x + draggedElementBounds.width)) < threshold) {
        guides.push({ type: 'vertical', position: bounds.x + bounds.width, elementId: elem.id });
      }
    });
    
    return guides;
  }, [drag.elementId]);

  const findResizeHandleAtPosition = useCallback((x: number, y: number, elementBounds: any): string | null => {
    if (!elementBounds) return null;
    
    const handleSize = 8;
    const handles = [
      { name: 'nw', x: elementBounds.x, y: elementBounds.y },
      { name: 'n', x: elementBounds.x + elementBounds.width / 2, y: elementBounds.y },
      { name: 'ne', x: elementBounds.x + elementBounds.width, y: elementBounds.y },
      { name: 'e', x: elementBounds.x + elementBounds.width, y: elementBounds.y + elementBounds.height / 2 },
      { name: 'se', x: elementBounds.x + elementBounds.width, y: elementBounds.y + elementBounds.height },
      { name: 's', x: elementBounds.x + elementBounds.width / 2, y: elementBounds.y + elementBounds.height },
      { name: 'sw', x: elementBounds.x, y: elementBounds.y + elementBounds.height },
      { name: 'w', x: elementBounds.x, y: elementBounds.y + elementBounds.height / 2 }
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= handleSize && Math.abs(y - handle.y) <= handleSize) {
        return handle.name;
      }
    }
    
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    // Pan mode or space key pressed - prioritize this over other interactions
    if (effectiveIsPanMode || effectiveIsSpacePressed) {
      setPan({
        isPanning: true,
        startX: e.clientX - pan.offsetX,
        startY: e.clientY - pan.offsetY,
        offsetX: pan.offsetX,
        offsetY: pan.offsetY
      });
      return;
    }

    // Left click - handle element selection and drag
    if (e.button === 0) {
      // Check if clicking on an element
      const clickedElement = findElementAtPosition(canvasPos.x, canvasPos.y);
      
      if (clickedElement) {
        // Handle element selection
        const isAlreadySelected = selectedElements.includes(clickedElement.id);
        
        if (!isAlreadySelected) {
          if (!e.shiftKey && !e.ctrlKey) {
            setSelectedElements([clickedElement.id]);
          } else {
            setSelectedElements([...selectedElements, clickedElement.id]);
          }
        }
        
        // Start drag
        if (clickedElement.line) {
          const elemData = getElementDataFromContent(content, clickedElement.line);
          if (elemData) {
            // Determine if it's a line by checking if it has x2/y2 or checking the line content
            const line = content.split('\n')[clickedElement.line - 1] || '';
            const isLine = line.includes('->') || line.includes('x2') || line.includes('y2');
            
            setDrag({
              isDragging: true,
              elementId: clickedElement.id,
              elementLine: clickedElement.line,
              startX: x,
              startY: y,
              elementX: elemData.x || 0,
              elementY: elemData.y || 0,
              elementX2: elemData.x2,
              elementY2: elemData.y2,
              isLine: isLine,
              isRelative: elemData.x2 !== undefined && elemData.y2 !== undefined
            });
          }
        }
      } else {
        // Clicked on empty space - start box selection
        if (!e.shiftKey && !e.ctrlKey) {
          setSelectedElements([]);
        }
        setBoxSelection({
          isSelecting: true,
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y
        });
      }
    }
  }, [effectiveIsPanMode, pan.offsetX, pan.offsetY, screenToCanvas, findElementAtPosition, selectedElements, setSelectedElements, effectiveContent]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle panning
    if (pan.isPanning) {
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      
      setPan(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy
      }));
      return;
    }

    // Handle box selection
    if (boxSelection.isSelecting) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setBoxSelection(prev => ({
        ...prev,
        endX: canvasPos.x,
        endY: canvasPos.y
      }));
      return;
    }

    // Handle dragging
    if (drag.isDragging && drag.elementLine !== null) {
      // 简化的坐标转换，直接计算鼠标移动距离
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      
      let newX = drag.elementX + dx;
      let newY = drag.elementY + dy;
      
      // 确保坐标为整数
      newX = Math.round(newX);
      newY = Math.round(newY);
      
      // Apply grid snap if enabled
      if (effectiveSnapToGrid) {
        newX = snapToGridValue(newX, effectiveGridSize);
        newY = snapToGridValue(newY, effectiveGridSize);
      }
      
      // Ensure non-negative
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      let newContent = content;
      
      if (drag.isLine) {
        // Handle line element
        const bounds = detectElementBounds(content, drag.elementLine);
        const attributeLine = bounds.attributeLine;
        
        if (drag.isRelative && drag.elementX2 !== undefined && drag.elementY2 !== undefined) {
          // Relative mode: maintain relative offset
          const originalDx = drag.elementX2 - drag.elementX;
          const originalDy = drag.elementY2 - drag.elementY;
          const newX2 = newX + originalDx;
          const newY2 = newY + originalDy;
          
          newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
          newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
          newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
        } else {
          // Absolute mode: update all coordinates
          let newX2 = drag.elementX2 !== undefined ? drag.elementX2 + dx : undefined;
          let newY2 = drag.elementY2 !== undefined ? drag.elementY2 + dy : undefined;
          
          // 确保坐标为整数
          if (newX2 !== undefined) newX2 = Math.round(newX2);
          if (newY2 !== undefined) newY2 = Math.round(newY2);
          
          if (effectiveSnapToGrid) {
            if (newX2 !== undefined) newX2 = snapToGridValue(newX2, effectiveGridSize);
            if (newY2 !== undefined) newY2 = snapToGridValue(newY2, effectiveGridSize);
          }
          
          if (newX2 !== undefined) newX2 = Math.max(0, newX2);
          if (newY2 !== undefined) newY2 = Math.max(0, newY2);
          
          newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
          
          if (newX2 !== undefined && newY2 !== undefined) {
            newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
            newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
          }
        }
      } else {
        // Handle regular element
        const bounds = detectElementBounds(content, drag.elementLine);
        const attributeLine = bounds.attributeLine;
        
        newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
        newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
      }
      
      setContent(newContent);
      
      // Update alignment guides
      const draggedElement = elementsInfo.find(e => e.id === drag.elementId);
      if (draggedElement) {
        const currentBounds = {
          x: newX,
          y: newY,
          width: draggedElement.bounds.width,
          height: draggedElement.bounds.height
        };
        const guides = calculateAlignmentGuides(currentBounds, elementsInfo);
        setAlignmentGuides(guides);
      }
    }

    // Handle resizing
    if (resize.isResizing && resize.elementLine !== null) {
      const dx = (x - resize.startX) / scale;
      const dy = (y - resize.startY) / scale;
      
      let newX = resize.elementX;
      let newY = resize.elementY;
      let newW = resize.elementW;
      let newH = resize.elementH;
      
      // Calculate new dimensions based on handle
      switch (resize.handle) {
        case 'se':
          newW = Math.max(10, resize.elementW + dx);
          newH = Math.max(10, resize.elementH + dy);
          break;
        case 'e':
          newW = Math.max(10, resize.elementW + dx);
          break;
        case 's':
          newH = Math.max(10, resize.elementH + dy);
          break;
        case 'nw':
          newX = resize.elementX + dx;
          newY = resize.elementY + dy;
          newW = Math.max(10, resize.elementW - dx);
          newH = Math.max(10, resize.elementH - dy);
          break;
        case 'n':
          newY = resize.elementY + dy;
          newH = Math.max(10, resize.elementH - dy);
          break;
        case 'ne':
          newY = resize.elementY + dy;
          newW = Math.max(10, resize.elementW + dx);
          newH = Math.max(10, resize.elementH - dy);
          break;
        case 'w':
          newX = resize.elementX + dx;
          newW = Math.max(10, resize.elementW - dx);
          break;
        case 'sw':
          newX = resize.elementX + dx;
          newW = Math.max(10, resize.elementW - dx);
          newH = Math.max(10, resize.elementH + dy);
          break;
      }
      
      // Apply grid snap if enabled
      if (effectiveSnapToGrid) {
        newX = snapToGridValue(newX, effectiveGridSize);
        newY = snapToGridValue(newY, effectiveGridSize);
        newW = snapToGridValue(newW, effectiveGridSize);
        newH = snapToGridValue(newH, effectiveGridSize);
      }
      
      // Ensure non-negative
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      let newContent = content;
      const bounds = detectElementBounds(content, resize.elementLine);
      const attributeLine = bounds.attributeLine;
      
      newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
      newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
      newContent = updateLineAttribute(newContent, attributeLine, 'w', newW);
      newContent = updateLineAttribute(newContent, attributeLine, 'h', newH);
      
      setContent(newContent);
    }
    
    // Handle hover detection (only when not dragging/panning/box-selecting)
    if (!pan.isPanning && !drag.isDragging && !resize.isResizing && !boxSelection.isSelecting) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const hoveredElem = findElementAtPosition(canvasPos.x, canvasPos.y);
      setHoveredElement(hoveredElem);
    }
  }, [pan, drag, resize, boxSelection, effectiveContent, scale, effectiveSnapToGrid, effectiveGridSize, effectiveSetContent, screenToCanvas, findElementAtPosition]);

  const handleMouseUp = useCallback(() => {
    if (pan.isPanning) {
      setPan(prev => ({ ...prev, isPanning: false }));
    }
    if (drag.isDragging) {
      setDrag({
        isDragging: false,
        elementId: null,
        elementLine: null,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
        elementX2: undefined,
        elementY2: undefined,
        isLine: false,
        isRelative: false
      });
      setAlignmentGuides([]);
    }
    if (resize.isResizing) {
      setResize({
        isResizing: false,
        elementId: null,
        elementLine: null,
        handle: null,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
        elementW: 0,
        elementH: 0
      });
    }
    if (boxSelection.isSelecting) {
      // Select elements within the box
      const minX = Math.min(boxSelection.startX, boxSelection.endX);
      const maxX = Math.max(boxSelection.startX, boxSelection.endX);
      const minY = Math.min(boxSelection.startY, boxSelection.endY);
      const maxY = Math.max(boxSelection.startY, boxSelection.endY);
      
      const isIntersectMode = effectiveSelectionTool === 'box-intersect';
      
      const selectedIds = elementsInfo
        .filter(elem => {
          const bounds = elem.bounds;
          if (isIntersectMode) {
            // Intersect mode: select elements that intersect with the box
            return bounds.x < maxX && bounds.x + bounds.width > minX &&
                   bounds.y < maxY && bounds.y + bounds.height > minY;
          } else {
            // Include mode: select elements completely inside the box
            return bounds.x >= minX && bounds.x + bounds.width <= maxX &&
                   bounds.y >= minY && bounds.y + bounds.height <= maxY;
          }
        })
        .map(elem => elem.id);
      
      setSelectedElements(selectedIds);
      
      setBoxSelection({
        isSelecting: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      });
    }
  }, [pan, drag, resize, boxSelection, elementsInfo, setSelectedElements, effectiveSelectionTool]);

  const handleMouseLeave = useCallback(() => {
    setHoveredElement(null);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (!canvasRef.current || !containerRef.current || !onZoomChange) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoomLevel = Math.max(10, Math.min(1000, effectiveZoomLevel * delta));
    
    // Calculate new pan offset to zoom at mouse position
    const scaleRatio = newZoomLevel / effectiveZoomLevel;
    const newOffsetX = mouseX - (mouseX - pan.offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - pan.offsetY) * scaleRatio;
    
    setPan(prev => ({ ...prev, offsetX: newOffsetX, offsetY: newOffsetY }));
    onZoomChange(Math.round(newZoomLevel));
  }, [effectiveZoomLevel, pan.offsetX, pan.offsetY, onZoomChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasPos = screenToCanvas(x, y);
    
    const clickedElement = findElementAtPosition(canvasPos.x, canvasPos.y);
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elementId: clickedElement?.id || null
    });
  }, [screenToCanvas, findElementAtPosition]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleMenuAction = useCallback((action: string) => {
    if (!contextMenu) return;
    
    switch (action) {
      case 'delete':
        if (contextMenu.elementId) {
          const element = elementsInfo.find(e => e.id === contextMenu.elementId);
          if (element && element.line) {
            const lines = effectiveContent.split('\n');
            lines.splice(element.line - 1, 1);
            effectiveSetContent(lines.join('\n'));
            setSelectedElements(selectedElements.filter(id => id !== contextMenu.elementId));
          }
        }
        break;
      case 'duplicate':
        if (contextMenu.elementId) {
          const element = elementsInfo.find(e => e.id === contextMenu.elementId);
          if (element && element.line) {
            const lines = effectiveContent.split('\n');
            const originalLine = lines[element.line - 1];
            const offset = 20;
            
            // Create duplicate with offset
            const duplicatedLine = originalLine.replace(
              /@?\(([^,]+),([^)]+)\)/,
              (match, x, y) => {
                const numX = parseFloat(x) || 0;
                const numY = parseFloat(y) || 0;
                return `@(${numX + offset},${numY + offset})`;
              }
            );
            
            lines.splice(element.line, 0, duplicatedLine);
            effectiveSetContent(lines.join('\n'));
          }
        }
        break;
      case 'bringToFront':
        if (contextMenu.elementId) {
          const element = elementsInfo.find(e => e.id === contextMenu.elementId);
          if (element && element.line) {
            const lines = effectiveContent.split('\n');
            const lineToMove = lines.splice(element.line - 1, 1)[0];
            lines.push(lineToMove);
            effectiveSetContent(lines.join('\n'));
          }
        }
        break;
      case 'sendToBack':
        if (contextMenu.elementId) {
          const element = elementsInfo.find(e => e.id === contextMenu.elementId);
          if (element && element.line) {
            const lines = effectiveContent.split('\n');
            const lineToMove = lines.splice(element.line - 1, 1)[0];
            lines.unshift(lineToMove);
            effectiveSetContent(lines.join('\n'));
          }
        }
        break;
    }
    
    closeContextMenu();
  }, [contextMenu, elementsInfo, effectiveContent, effectiveSetContent, selectedElements, setSelectedElements, closeContextMenu]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    
    const { selectedFile, currentSnippet } = useFileStore.getState();
    if (!selectedFile) return;
    
    const api = (window as any).api;
    if (!api || !api.ensureDir || !api.writeFile) {
      console.error('File system API not available');
      return;
    }
    
    // 获取项目目录
    const projectDir = selectedFile.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
    
    // 生成相对路径
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = `assets/images/${timestamp}_${sanitizedName}`;
    const targetPath = `${projectDir}/${relativePath}`;
    
    // 获取拖放位置
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasPos = screenToCanvas(x, y);
    
    try {
      // 确保目录存在
      await api.ensureDir(`${projectDir}/assets/images`);
      
      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 写入文件
      await api.writeFile(targetPath, uint8Array);
      
      // 获取图片尺寸
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const maxDim = 400;
        let w = Math.min(maxDim, img.width);
        let h = w / aspect;
        if (h > maxDim) { h = maxDim; w = h * aspect; }
        
        // 添加图片元素到代码
        const { content: editorContent } = useEditorStore.getState();
        const line = `<${relativePath}> @(${canvasPos.x},${canvasPos.y}) w=${Math.round(w)} h=${Math.round(h)}`;
        const newContent = editorContent.trimEnd() + '\n' + line;
        
        const { setContent: editorSetContent } = useEditorStore.getState();
        editorSetContent(newContent);
      };
      img.onerror = () => {
        // 如果无法获取尺寸，使用默认尺寸
        const line = `<${relativePath}> @(${canvasPos.x},${canvasPos.y})`;
        const { content: editorContent } = useEditorStore.getState();
        const newContent = editorContent.trimEnd() + '\n' + line;
        
        const { setContent: editorSetContent } = useEditorStore.getState();
        editorSetContent(newContent);
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error handling image drop:', error);
    }
  }, [screenToCanvas]);

  const handleExport = useCallback((format: 'png' | 'svg') => {
    if (!canvasRef.current) return;
    
    if (format === 'png') {
      // Export as PNG
      const link = document.createElement('a');
      link.download = 'solarwire-diagram.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else if (format === 'svg') {
      // Export as SVG - use the existing SVG renderer
      const ast = parse(content);
      const svgContent = render(ast, {
        selectedElementIds: [],
        primaryColor,
        imageUrlResolver
      });
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = 'solarwire-diagram.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [content, primaryColor, imageUrlResolver]);

  useEffect(() => {
    if (!canvasRef.current || !content) return;

    try {
      const ast = parse(content);
      const canvasResult = renderToCanvas(ast, {
        selectedElementIds: selectedElements,
        primaryColor,
        imageUrlResolver,
        sourceInput: content,
        skipCanvasSize: true // Let CanvasPreview control canvas size for zoom
      });

      // Save elements info for hit testing
      setElementsInfo(canvasResult.elements);
      
      // Update viewBox state for coordinate calculations
      setViewBox(canvasResult.viewBox);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get container dimensions
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set canvas size to match container
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Get viewBox from canvas result
      const viewBox = canvasResult.viewBox;

      // Use the same coordinate system as SVG
      // Scale is zoomLevel / 100
      const scale = effectiveZoomLevel / 100;
      
      // Calculate viewBox offset
      const viewBoxOffsetX = viewBox.x;
      const viewBoxOffsetY = viewBox.y;

      // Apply transformations: translate to center, then scale
      // This matches the SVG coordinate system
      ctx.translate(containerWidth / 2, containerHeight / 2);
      ctx.scale(scale, scale);
      ctx.translate(-viewBoxOffsetX - viewBox.width / 2, -viewBoxOffsetY - viewBox.height / 2);
      
      // Apply pan offset (scaled)
      ctx.translate(pan.offsetX / scale, pan.offsetY / scale);

      // Render the diagram
      canvasResult.render(canvas);

      // Draw hover highlight
      if (hoveredElement && !selectedElements.includes(hoveredElement.id)) {
        ctx.restore();
        ctx.save();
        
        // Apply same transformations as main render
        ctx.translate(containerWidth / 2, containerHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-viewBoxOffsetX - viewBox.width / 2, -viewBoxOffsetY - viewBox.height / 2);
        ctx.translate(pan.offsetX / scale, pan.offsetY / scale);
        
        const hoveredElemInfo = elementsInfo.find(e => e.id === hoveredElement.id);
        if (hoveredElemInfo) {
          const bounds = hoveredElemInfo.bounds;
          ctx.strokeStyle = primaryColor + '40';
          ctx.lineWidth = 2 / scale;
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
      }

      // Draw resize handles for selected element
      if (selectedElements.length === 1) {
        const selectedElement = elementsInfo.find(e => e.id === selectedElements[0]);
        if (selectedElement && selectedElement.type !== 'line' && selectedElement.type !== 'circle') {
          ctx.restore();
          ctx.save();
          
          // Apply same transformations as main render
          ctx.translate(containerWidth / 2, containerHeight / 2);
          ctx.scale(scale, scale);
          ctx.translate(-viewBoxOffsetX - viewBox.width / 2, -viewBoxOffsetY - viewBox.height / 2);
          ctx.translate(pan.offsetX / scale, pan.offsetY / scale);
          
          const bounds = selectedElement.bounds;
          const handleSize = 8 / scale;
          
          ctx.fillStyle = primaryColor;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2 / scale;
          
          const handles = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width / 2, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height / 2 }
          ];
          
          handles.forEach(handle => {
            ctx.beginPath();
            ctx.rect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
          });
        }
      }

      // Draw box selection rectangle
      if (boxSelection.isSelecting) {
        ctx.restore();
        ctx.save();
        
        // Apply same transformations as main render
        ctx.translate(containerWidth / 2, containerHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-viewBoxOffsetX - viewBox.width / 2, -viewBoxOffsetY - viewBox.height / 2);
        ctx.translate(pan.offsetX / scale, pan.offsetY / scale);
        
        const minX = Math.min(boxSelection.startX, boxSelection.endX);
        const maxX = Math.max(boxSelection.startX, boxSelection.endX);
        const minY = Math.min(boxSelection.startY, boxSelection.endY);
        const maxY = Math.max(boxSelection.startY, boxSelection.endY);
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
        
        ctx.fillStyle = primaryColor + '20';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      }

      // Draw alignment guides
      if (alignmentGuides.length > 0) {
        ctx.restore();
        ctx.save();
        
        // Apply same transformations as main render
        ctx.translate(containerWidth / 2, containerHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-viewBoxOffsetX - viewBox.width / 2, -viewBoxOffsetY - viewBox.height / 2);
        ctx.translate(pan.offsetX / scale, pan.offsetY / scale);
        
        const bounds = canvasResult.viewBox;
        
        ctx.strokeStyle = '#70B603';
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([3 / scale, 3 / scale]);
        
        alignmentGuides.forEach(guide => {
          if (guide.type === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(bounds.x, guide.position);
            ctx.lineTo(bounds.x + bounds.width, guide.position);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(guide.position, bounds.y);
            ctx.lineTo(guide.position, bounds.y + bounds.height);
            ctx.stroke();
          }
        });
        
        ctx.setLineDash([]);
      }

      ctx.restore();
    } catch (error) {
      console.error('Canvas render error:', error);
    }
  }, [effectiveContent, selectedElements, primaryColor, imageUrlResolver, scale, pan, boxSelection, alignmentGuides]);

  return (
    <div 
      ref={containerRef}
      className="canvas-preview-container"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="canvas-preview-canvas"
        style={{ cursor: effectiveIsPanMode ? 'grab' : 'default' }}
      />
      
      </div>
  );
}

export default CanvasPreview;
