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

function CanvasPreview({ onElementClick }: CanvasPreviewProps): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { content, setContent } = useEditorStore();
  const { selectedElements, setSelectedElements, zoomLevel, isPanMode } = useSolarWireStore();
  const { primaryColor, showGrid, snapToGrid, gridSize } = useSettingsStore();
  const { selectedFile } = useFileStore();
  
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

  const scale = zoomLevel / 100;

  const screenToCanvas = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (screenX - rect.left - pan.offsetX) / scale;
    const canvasY = (screenY - rect.top - pan.offsetY) / scale;
    return { x: canvasX, y: canvasY };
  }, [pan.offsetX, pan.offsetY, scale]);

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
    const canvasPos = screenToCanvas(x, y);

    // Pan mode or middle mouse button
    if (isPanMode || e.button === 1) {
      setPan({
        isPanning: true,
        startX: x,
        startY: y,
        offsetX: pan.offsetX,
        offsetY: pan.offsetY
      });
      return;
    }

    // Left click - handle element selection and drag
    if (e.button === 0) {
      // First check if clicking on a resize handle of selected element
      if (selectedElements.length === 1) {
        const selectedElement = elementsInfo.find(e => e.id === selectedElements[0]);
        if (selectedElement) {
          const handle = findResizeHandleAtPosition(canvasPos.x, canvasPos.y, selectedElement.bounds);
          if (handle) {
            const elemData = getElementDataFromContent(content, selectedElement.line!);
            if (elemData) {
              setResize({
                isResizing: true,
                elementId: selectedElement.id,
                elementLine: selectedElement.line!,
                handle: handle as any,
                startX: x,
                startY: y,
                elementX: elemData.x || 0,
                elementY: elemData.y || 0,
                elementW: selectedElement.bounds.width,
                elementH: selectedElement.bounds.height
              });
              return;
            }
          }
        }
      }
      
      const clickedElement = findElementAtPosition(canvasPos.x, canvasPos.y);
      
      if (clickedElement) {
        if (!e.shiftKey && !e.ctrlKey && !selectedElements.includes(clickedElement.id)) {
          setSelectedElements([clickedElement.id]);
        } else if (e.shiftKey || e.ctrlKey) {
          if (selectedElements.includes(clickedElement.id)) {
            setSelectedElements(selectedElements.filter(id => id !== clickedElement.id));
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
  }, [isPanMode, pan.offsetX, pan.offsetY, screenToCanvas, findElementAtPosition, selectedElements, setSelectedElements, content]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle panning
    if (pan.isPanning) {
      const dx = x - pan.startX;
      const dy = y - pan.startY;
      setPan(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
        startX: x,
        startY: y
      }));
      return;
    }

    // Handle box selection
    if (boxSelection.isSelecting) {
      const canvasPos = screenToCanvas(x, y);
      setBoxSelection(prev => ({
        ...prev,
        endX: canvasPos.x,
        endY: canvasPos.y
      }));
      return;
    }

    // Handle dragging
    if (drag.isDragging && drag.elementLine !== null) {
      const dx = (x - drag.startX) / scale;
      const dy = (y - drag.startY) / scale;
      
      let newX = drag.elementX + dx;
      let newY = drag.elementY + dy;
      
      // Apply grid snap if enabled
      if (snapToGrid) {
        newX = snapToGridValue(newX, gridSize);
        newY = snapToGridValue(newY, gridSize);
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
          
          if (snapToGrid) {
            if (newX2 !== undefined) newX2 = snapToGridValue(newX2, gridSize);
            if (newY2 !== undefined) newY2 = snapToGridValue(newY2, gridSize);
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
      if (snapToGrid) {
        newX = snapToGridValue(newX, gridSize);
        newY = snapToGridValue(newY, gridSize);
        newW = snapToGridValue(newW, gridSize);
        newH = snapToGridValue(newH, gridSize);
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
  }, [pan, drag, resize, boxSelection, content, scale, snapToGrid, gridSize, setContent, screenToCanvas]);

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
      
      const selectedIds = elementsInfo
        .filter(elem => {
          const bounds = elem.bounds;
          return bounds.x < maxX && bounds.x + bounds.width > minX &&
                 bounds.y < maxY && bounds.y + bounds.height > minY;
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
  }, [pan, drag, resize, boxSelection, elementsInfo, setSelectedElements]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    // TODO: Implement zoom with wheel
  }, []);

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
            const lines = content.split('\n');
            lines.splice(element.line - 1, 1);
            setContent(lines.join('\n'));
            setSelectedElements(selectedElements.filter(id => id !== contextMenu.elementId));
          }
        }
        break;
      case 'duplicate':
        // TODO: Implement duplicate
        break;
      case 'bringToFront':
        // TODO: Implement bring to front
        break;
      case 'sendToBack':
        // TODO: Implement send to back
        break;
    }
    
    closeContextMenu();
  }, [contextMenu, elementsInfo, content, setContent, selectedElements, setSelectedElements, closeContextMenu]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
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
        const { content } = useEditorStore.getState();
        const line = `<${relativePath}> @(${canvasPos.x},${canvasPos.y}) w=${Math.round(w)} h=${Math.round(h)}`;
        const newContent = content.trimEnd() + '\n' + line;
        
        const { setContent } = useEditorStore.getState();
        setContent(newContent);
      };
      img.onerror = () => {
        // 如果无法获取尺寸，使用默认尺寸
        const line = `<${relativePath}> @(${canvasPos.x},${canvasPos.y})`;
        const { content } = useEditorStore.getState();
        const newContent = content.trimEnd() + '\n' + line;
        
        const { setContent } = useEditorStore.getState();
        setContent(newContent);
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
        sourceInput: content
      });

      // Save elements info for hit testing
      setElementsInfo(canvasResult.elements);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Apply scale and pan
      ctx.scale(scale, scale);
      ctx.translate(pan.offsetX / scale, pan.offsetY / scale);

      // Render the diagram
      canvasResult.render(canvas);

      // Draw grid if enabled
      if (showGrid) {
        ctx.restore();
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(pan.offsetX / scale, pan.offsetY / scale);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        const bounds = canvasResult.viewBox;
        const startX = Math.floor(bounds.x / gridSize) * gridSize;
        const startY = Math.floor(bounds.y / gridSize) * gridSize;
        
        for (let x = startX; x < bounds.x + bounds.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, bounds.y);
          ctx.lineTo(x, bounds.y + bounds.height);
          ctx.stroke();
        }
        
        for (let y = startY; y < bounds.y + bounds.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(bounds.x, y);
          ctx.lineTo(bounds.x + bounds.width, y);
          ctx.stroke();
        }
      }

      // Draw resize handles for selected element
      if (selectedElements.length === 1) {
        const selectedElement = elementsInfo.find(e => e.id === selectedElements[0]);
        if (selectedElement && selectedElement.type !== 'line' && selectedElement.type !== 'circle') {
          ctx.restore();
          ctx.save();
          ctx.scale(scale, scale);
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
        ctx.scale(scale, scale);
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
        ctx.scale(scale, scale);
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
  }, [content, selectedElements, primaryColor, imageUrlResolver, scale, pan, showGrid, gridSize, boxSelection, alignmentGuides]);

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
        onContextMenu={handleContextMenu}
        className="canvas-preview-canvas"
        style={{ cursor: isPanMode ? 'grab' : 'default' }}
      />
      
      {contextMenu && (
        <div
          className="canvas-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={() => handleMenuAction('delete')}>
            删除
          </div>
          {contextMenu.elementId && (
            <>
              <div className="context-menu-item" onClick={() => handleMenuAction('duplicate')}>
                复制
              </div>
              <div className="context-menu-item" onClick={() => handleMenuAction('bringToFront')}>
                置于顶层
              </div>
              <div className="context-menu-item" onClick={() => handleMenuAction('sendToBack')}>
                置于底层
              </div>
            </>
          )}
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => handleExport('png')}>
            导出为 PNG
          </div>
          <div className="context-menu-item" onClick={() => handleExport('svg')}>
            导出为 SVG
          </div>
        </div>
      )}
    </div>
  );
}

export default CanvasPreview;
