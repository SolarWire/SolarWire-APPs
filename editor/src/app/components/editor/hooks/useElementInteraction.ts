import React, { useCallback, useState } from 'react';
import { getLineCoordinates } from '../../../../shared/utils/line-coordinate-utils';
import { updateLineAttribute } from '../../../../shared/utils/attribute-updater';
import { detectElementBounds } from '../../../../shared/utils/element-bounds';
import { useSolarWireStore } from '../../../stores/solarWireStore';
import { usePreviewStore } from '../../../stores/previewStore';
import type { SelectionTool } from '../../../stores/solarWireStore';
import type {
  DragElementState,
  MultiDragState,
  ResizeHandleState,
} from '../../../stores/previewStore';
import type { Element as SolarWireElement, Document } from '../../../../lib/parser/types';
import {
  collectAllGuides,
  computeSnap,
  getActiveEdgesForMove,
  calculateDistances,
} from '../snap';
import type { SnapElement } from '../snap';
import { getElementIdFromSVGElement } from './useElementBounds';
import type { ElementBounds } from './useElementBounds';

const SNAP_THRESHOLD = 6;

const handleLineDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  elementX2: number | undefined,
  elementY2: number | undefined,
  dx: number,
  dy: number,
  setContentFn: (content: string) => void,
  isRelative: boolean = false
): string => {
  let newContent = content;

  const bounds = detectElementBounds(content, lineNum);
  const attributeLine = bounds.attributeLine;

  if (isRelative && elementX2 !== undefined && elementY2 !== undefined) {
    const originalDx = elementX2 - elementX;
    const originalDy = elementY2 - elementY;

    const newX = Math.round(elementX + dx);
    const newY = Math.round(elementY + dy);

    const newX2 = newX + originalDx;
    const newY2 = newY + originalDy;

    newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
    newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
    newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
    newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
  } else {
    const newX = Math.round(elementX + dx);
    const newY = Math.round(elementY + dy);
    const newX2 = elementX2 !== undefined ? Math.round(elementX2 + dx) : undefined;
    const newY2 = elementY2 !== undefined ? Math.round(elementY2 + dy) : undefined;

    newContent = updateLineAttribute(newContent, attributeLine, 'x', newX);
    newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);

    if (newX2 !== undefined && newY2 !== undefined) {
      newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
      newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
    }
  }

  setContentFn(newContent);
  return newContent;
};

const handleElementDrag = (
  content: string,
  lineNum: number,
  elementX: number,
  elementY: number,
  dx: number,
  dy: number,
  setContentFn: (content: string) => void,
  snapToGrid: boolean = false,
  gridSize: number = 20
): string => {
  let newX = Math.round(elementX + dx);
  let newY = Math.round(elementY + dy);

  if (snapToGrid && gridSize > 0) {
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
  }

  const bounds = detectElementBounds(content, lineNum);
  const attributeLine = bounds.attributeLine;

  let newContent = updateLineAttribute(content, attributeLine, 'x', newX);
  newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);

  setContentFn(newContent);
  return newContent;
};

interface UseElementInteractionOptions {
  ast: Document | null;
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  selectionTool: SelectionTool;
  isPanMode: boolean;
  isSpacePressed: boolean;
  snapToGuides: boolean;
  effectiveContent: string;
  effectiveSetContent: (c: string, snapshot?: string) => void;
  allowImageElements: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  getElementData: (elementId: string) => SolarWireElement | null;
  getElementBounds: (elementId: string) => ElementBounds;
  getAllElementsBoundsMap: (elements: SolarWireElement[]) => Map<string, ElementBounds>;
  getGroupBounds: (elementIds: string[]) => { x: number; y: number; w: number; h: number } | null;
  findElementAtPosition: (svgX: number, svgY: number, tolerance?: number) => string | null;
  testBoxSelection: (x1: number, y1: number, x2: number, y2: number) => void;
}

interface UseElementInteractionReturn {
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  lastMousePosition: { x: number; y: number };
  setLastMousePosition: (pos: { x: number; y: number }) => void;
}

export function useElementInteraction({
  ast,
  getSvgCoords,
  selectionTool,
  isPanMode,
  isSpacePressed,
  snapToGuides,
  effectiveContent,
  effectiveSetContent,
  allowImageElements,
  containerRef,
  getElementData,
  getElementBounds,
  getAllElementsBoundsMap,
  getGroupBounds,
  findElementAtPosition,
  testBoxSelection,
}: UseElementInteractionOptions): UseElementInteractionReturn {
  const selectedElements = useSolarWireStore(s => s.selectedElements);
  const selectElements = useSolarWireStore(s => s.selectElements);
  const setIsPreviewFocused = useSolarWireStore(s => s.setIsPreviewFocused);

  const setPosition = usePreviewStore(s => s.setPosition);
  const isDraggingCanvas = usePreviewStore(s => s.isDraggingCanvas);
  const startCanvasDrag = usePreviewStore(s => s.startCanvasDrag);
  const endCanvasDrag = usePreviewStore(s => s.endCanvasDrag);
  const dragStart = usePreviewStore(s => s.dragStart);
  const boxSelection = usePreviewStore(s => s.boxSelection);
  const setBoxSelection = usePreviewStore(s => s.setBoxSelection);
  const dragElementState = usePreviewStore(s => s.dragElementState);
  const setDragElementState = usePreviewStore(s => s.setDragElementState);
  const multiDragElements = usePreviewStore(s => s.multiDragElements);
  const setMultiDragElements = usePreviewStore(s => s.setMultiDragElements);
  const resizeHandleState = usePreviewStore(s => s.resizeHandleState);
  const setResizeHandleState = usePreviewStore(s => s.setResizeHandleState);
  const hoveredElement = usePreviewStore(s => s.hoveredElement);
  const setHoveredElement = usePreviewStore(s => s.setHoveredElement);
  const dragPreviewElement = usePreviewStore(s => s.dragPreviewElement);
  const setAlignmentGuides = usePreviewStore(s => s.setAlignmentGuides);
  const setDistanceLines = usePreviewStore(s => s.setDistanceLines);
  const altKeyPressed = usePreviewStore(s => s.altKeyPressed);

  const [lastMousePosition, setLastMousePosition] = useState({ x: 200, y: 200 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    containerRef.current?.focus();
    setIsPreviewFocused(true);

    const target = e.target as SVGElement | HTMLElement;

    const handleAttr = target.getAttribute('data-handle');
    if (handleAttr) {
      const elementId = target.getAttribute('data-element-id');
      if (elementId) {
        if (handleAttr === 'start' || handleAttr === 'end') {
          const elementData = getElementData(elementId);
          if (elementData && elementData.type === 'line') {
            const lineElement = elementData as any;

            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

            if (lineElement.start && lineElement.start.x && lineElement.start.x.type === 'absolute') {
              x1 = lineElement.start.x.value;
            }
            if (lineElement.start && lineElement.start.y && lineElement.start.y.type === 'absolute') {
              y1 = lineElement.start.y.value;
            }

            if (lineElement.end) {
              if ((lineElement.end as any).x && (lineElement.end as any).y) {
                if ((lineElement.end as any).x.type === 'absolute') {
                  x2 = (lineElement.end as any).x.value;
                }
                if ((lineElement.end as any).y.type === 'absolute') {
                  y2 = (lineElement.end as any).y.value;
                }
              } else if ((lineElement.end as any).dx !== undefined && (lineElement.end as any).dy !== undefined) {
                x2 = x1 + (lineElement.end as any).dx;
                y2 = y1 + (lineElement.end as any).dy;
              }
            }

            if (x2 === 0 && y2 === 0) {
              x2 = x1 + 100;
              y2 = y1;
            }

            usePreviewStore.getState().mark(effectiveContent);
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
          usePreviewStore.getState().mark(effectiveContent);
          const bounds = getElementBounds(elementId);
          setResizeHandleState({
            elementId,
            handle: handleAttr as ResizeHandleState['handle'],
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

    if (!elementId && (currentTool === 'select' || currentTool === 'box-include' || currentTool === 'box-intersect')) {
      const svgCoords = getSvgCoords(e.clientX, e.clientY);
      elementId = findElementAtPosition(svgCoords.x, svgCoords.y, 10);
    }

    const currentPosition = usePreviewStore.getState().position;

    switch (currentTool) {
      case 'pan':
        startCanvasDrag(e.clientX - currentPosition.x, e.clientY - currentPosition.y);
        break;

      case 'select':
      case 'box-include':
      case 'box-intersect':
        if (elementId) {
          const elementData = getElementData(elementId);
          const isLine = elementData?.type === 'line';

          let dragState: DragElementState;

          if (isLine && elementData) {
            const lineCoords = getLineCoordinates(elementData);
            dragState = {
              elementId,
              startX: e.clientX,
              startY: e.clientY,
              elementX: lineCoords.x1,
              elementY: lineCoords.y1,
              elementX2: lineCoords.x2,
              elementY2: lineCoords.y2,
              isLine: true
            };
          } else {
            const bounds = getElementBounds(elementId);
            dragState = {
              elementId,
              startX: e.clientX,
              startY: e.clientY,
              elementX: bounds.x,
              elementY: bounds.y,
              elementW: bounds.w,
              elementH: bounds.h
            } as any;
          }

          usePreviewStore.getState().mark(effectiveContent);
          setDragElementState(dragState);

          const currentSelectedElements = useSolarWireStore.getState().selectedElements;

          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            if (currentSelectedElements.includes(elementId)) {
              selectElements(currentSelectedElements.filter(id => id !== elementId));
            } else {
              selectElements([...currentSelectedElements, elementId]);
            }
          } else {
            if (!currentSelectedElements.includes(elementId)) {
              selectElements([elementId]);
            } else if (currentSelectedElements.length > 1) {
              const initialPositions: MultiDragState[] = [];
              currentSelectedElements.forEach((id) => {
                const elData = getElementData(id);
                const elIsLine = elData?.type === 'line';
                if (elIsLine && elData) {
                  const lineCoords = getLineCoordinates(elData);
                  initialPositions.push({
                    elementId: id,
                    startX: e.clientX,
                    startY: e.clientY,
                    elementX: lineCoords.x1,
                    elementY: lineCoords.y1,
                    elementX2: lineCoords.x2,
                    elementY2: lineCoords.y2,
                    isLine: true
                  });
                } else {
                  const bounds = getElementBounds(id);
                  initialPositions.push({
                    elementId: id,
                    startX: e.clientX,
                    startY: e.clientY,
                    elementX: bounds.x,
                    elementY: bounds.y,
                    elementW: bounds.w,
                    elementH: bounds.h
                  } as any);
                }
              });
              usePreviewStore.getState().mark(effectiveContent);
              setMultiDragElements(initialPositions);
              setDragElementState(null);
            }
          }
        } else if (currentTool === 'box-include' || currentTool === 'box-intersect') {
          setBoxSelection({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
          });
        } else {
          startCanvasDrag(e.clientX - currentPosition.x, e.clientY - currentPosition.y);
          selectElements([]);
        }
        break;
    }
  }, [
    selectionTool, isPanMode, isSpacePressed,
    getSvgCoords, getElementData, getElementBounds, findElementAtPosition,
    containerRef, setIsPreviewFocused, startCanvasDrag, setResizeHandleState,
    setDragElementState, selectElements, setMultiDragElements, setBoxSelection,
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svgCoords = getSvgCoords(e.clientX, e.clientY);
    setLastMousePosition({
      x: svgCoords.x,
      y: svgCoords.y
    });

    const currentState = usePreviewStore.getState();
    const currentIsDraggingCanvas = currentState.isDraggingCanvas;
    const currentDragStart = currentState.dragStart;
    const currentResizeHandleState = currentState.resizeHandleState;
    const currentDragElementState = currentState.dragElementState;
    const currentMultiDragElements = currentState.multiDragElements;
    const currentBoxSelection = currentState.boxSelection;
    const currentDragPreviewElement = currentState.dragPreviewElement;
    const currentAltKeyPressed = currentState.altKeyPressed;
    const currentHoveredElement = currentState.hoveredElement;
    const currentSelectedElements = useSolarWireStore.getState().selectedElements;

    if (currentIsDraggingCanvas || ((isPanMode || isSpacePressed) && currentIsDraggingCanvas)) {
      if (currentIsDraggingCanvas) {
        setPosition({
          x: e.clientX - currentDragStart.x,
          y: e.clientY - currentDragStart.y
        });
      }
      return;
    }

    if (currentResizeHandleState) {
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      const startCoords = getSvgCoords(currentResizeHandleState.startX, currentResizeHandleState.startY);

      const dx = currentCoords.x - startCoords.x;
      const dy = currentCoords.y - startCoords.y;

      if (currentResizeHandleState.handle === 'start' || currentResizeHandleState.handle === 'end') {
        const lineNum = parseInt(currentResizeHandleState.elementId);
        if (!isNaN(lineNum)) {
          const lines = effectiveContent.split(/\r?\n/);
          if (lineNum > 0 && lineNum <= lines.length) {
            let line = lines[lineNum - 1];

            let x1 = currentResizeHandleState.elementX;
            let y1 = currentResizeHandleState.elementY;
            let x2 = currentResizeHandleState.elementX2 || x1 + 100;
            let y2 = currentResizeHandleState.elementY2 || y1;

            const origX1 = x1, origY1 = y1, origX2 = x2, origY2 = y2;

            if (currentResizeHandleState.handle === 'start') {
              x1 = Math.round(origX1 + dx);
              y1 = Math.round(origY1 + dy);
            } else {
              x2 = Math.round(origX2 + dx);
              y2 = Math.round(origY2 + dy);
            }

            if (e.shiftKey) {
              let currentDx: number, currentDy: number;
              if (currentResizeHandleState.handle === 'start') {
                currentDx = currentCoords.x - origX2;
                currentDy = currentCoords.y - origY2;
              } else {
                currentDx = currentCoords.x - origX1;
                currentDy = currentCoords.y - origY1;
              }

              const absDx = Math.abs(currentDx);
              const absDy = Math.abs(currentDy);

              if (absDx >= absDy) {
                if (currentResizeHandleState.handle === 'start') {
                  y1 = origY2;
                } else {
                  y2 = origY1;
                }
              } else {
                if (currentResizeHandleState.handle === 'start') {
                  x1 = origX2;
                } else {
                  x2 = origX1;
                }
              }
            }

            if (line.includes('->')) {
              line = line.replace(/\s+x2=[\d]+/g, '');
              line = line.replace(/\s+y2=[\d]+/g, '');
              line = line.replace(/--\s*@\(-?[\d]+,\s*-?[\d]+\)->\(-?[\d]+,\s*-?[\d]+\)/, `-- @(${x1}, ${y1})->(${x2}, ${y2})`);
            } else {
              line = line.replace(/\s+x=[\d]+/g, '');
              line = line.replace(/\s+y=[\d]+/g, '');
              line = line.replace(/\s+x2=[\d]+/g, '');
              line = line.replace(/\s+y2=[\d]+/g, '');
              if (line.startsWith('--')) {
                line = `-- @(${x1}, ${y1})->(${x2}, ${y2})` + line.substring(2);
              } else {
                line = `-- @(${x1}, ${y1})->(${x2}, ${y2}) ` + line;
              }
            }

            lines[lineNum - 1] = line;
            usePreviewStore.getState().setDraftContent(lines.join('\n'));
          }
        }
        return;
      }

      let newX = currentResizeHandleState.elementX;
      let newY = currentResizeHandleState.elementY;
      let newW = currentResizeHandleState.elementW ?? 0;
      let newH = currentResizeHandleState.elementH ?? 0;

      const startW = currentResizeHandleState.elementW ?? 0;
      const startH = currentResizeHandleState.elementH ?? 0;
      const aspectRatio = startH !== 0 ? startW / startH : 1;

      const isShiftPressed = e.shiftKey;

      if (isShiftPressed) {
        switch (currentResizeHandleState.handle) {
          case 'nw':
          case 'ne':
          case 'se':
          case 'sw':
            {
              const isRight = currentResizeHandleState.handle === 'se' || currentResizeHandleState.handle === 'ne';
              const scaleFactor = isRight
                ? (startW + dx) / startW
                : (startW - dx) / startW;

              newW = Math.max(10, Math.round(startW * scaleFactor));
              newH = Math.max(10, Math.round(newW / aspectRatio));

              const adjustX = currentResizeHandleState.handle.includes('w');
              const adjustY = currentResizeHandleState.handle.includes('n');
              newX = currentResizeHandleState.elementX + (adjustX ? startW - newW : 0);
              newY = currentResizeHandleState.elementY + (adjustY ? startH - newH : 0);
            }
            break;
          case 'n':
          case 's':
            {
              const rawH = currentResizeHandleState.handle === 's' ? startH + dy : startH - dy;
              newH = Math.max(10, Math.round(rawH));
              newW = Math.max(10, Math.round(newH * aspectRatio));
              if (currentResizeHandleState.handle === 'n') {
                newY = currentResizeHandleState.elementY + (startH - newH);
              }
            }
            break;
          case 'e':
          case 'w':
            {
              const rawW = currentResizeHandleState.handle === 'e' ? startW + dx : startW - dx;
              newW = Math.max(10, Math.round(rawW));
              newH = Math.max(10, Math.round(newW / aspectRatio));
              if (currentResizeHandleState.handle === 'w') {
                newX = currentResizeHandleState.elementX + (startW - newW);
              }
            }
            break;
        }
      } else {
        switch (currentResizeHandleState.handle) {
          case 'nw':
            newX = Math.round(currentResizeHandleState.elementX + dx);
            newY = Math.round(currentResizeHandleState.elementY + dy);
            newW = Math.round(startW - dx);
            newH = Math.round(startH - dy);
            break;
          case 'n':
            newY = Math.round(currentResizeHandleState.elementY + dy);
            newH = Math.round(startH - dy);
            break;
          case 'ne':
            newY = Math.round(currentResizeHandleState.elementY + dy);
            newW = Math.round(startW + dx);
            newH = Math.round(startH - dy);
            break;
          case 'e':
            newW = Math.round(startW + dx);
            break;
          case 's':
            newH = Math.round(startH + dy);
            break;
          case 'se':
            newW = Math.round(startW + dx);
            newH = Math.round(startH + dy);
            break;
          case 'w':
            newX = Math.round(currentResizeHandleState.elementX + dx);
            newW = Math.round(startW - dx);
            break;
          case 'sw':
            newX = Math.round(currentResizeHandleState.elementX + dx);
            newW = Math.round(startW - dx);
            newH = Math.round(startH + dy);
            break;
        }
      }

      if (newW >= 10 && newH >= 10) {
        const lineNum = parseInt(currentResizeHandleState.elementId);
        if (!isNaN(lineNum)) {
          setAlignmentGuides([]);
          setDistanceLines([]);

          const bounds = detectElementBounds(effectiveContent, lineNum);
          const attributeLine = bounds.attributeLine;

          let newContent = updateLineAttribute(effectiveContent, attributeLine, 'x', newX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', newY);
          newContent = updateLineAttribute(newContent, attributeLine, 'w', newW);
          newContent = updateLineAttribute(newContent, attributeLine, 'h', newH);
          usePreviewStore.getState().setDraftContent(newContent);
        }
      }
      return;
    }

    if (currentDragElementState) {
      const currentCoords = getSvgCoords(e.clientX, e.clientY);
      const startCoords = getSvgCoords(currentDragElementState.startX, currentDragElementState.startY);

      let dx = currentCoords.x - startCoords.x;
      let dy = currentCoords.y - startCoords.y;

      const elements = ast?.elements || [];
      const elementW = (currentDragElementState as any).elementW || 100;
      const elementH = (currentDragElementState as any).elementH || 50;

      if (currentDragElementState.isLine) {
        setAlignmentGuides([]);
        setDistanceLines([]);
      } else if (snapToGuides) {
        const newX = currentDragElementState.elementX + dx;
        const newY = currentDragElementState.elementY + dy;
        const currentBounds = { x: newX, y: newY, w: elementW, h: elementH };
        const excludeIds = [currentDragElementState.elementId];

        const allElementsBoundsMap = getAllElementsBoundsMap(elements);
        const snapElements: SnapElement[] = elements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = allElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0));

        const allGuides = collectAllGuides({
          currentBounds,
          excludeIds,
          elements: snapElements,
          threshold: SNAP_THRESHOLD,
        });

        const activeEdges = getActiveEdgesForMove();
        const snapped = computeSnap(allGuides, newX, newY, elementW, elementH, activeEdges, SNAP_THRESHOLD);

        if (snapped.snapped) {
          dx = snapped.x - currentDragElementState.elementX;
          dy = snapped.y - currentDragElementState.elementY;
        }

        setAlignmentGuides([...snapped.snappedGuides]);

        if (snapped.snapped) {
          const distances = calculateDistances(
            { x: snapped.x, y: snapped.y, w: elementW, h: elementH },
            snapElements,
            excludeIds,
            50
          );
          setDistanceLines(distances);
        } else {
          setDistanceLines([]);
        }
      } else {
        setAlignmentGuides([]);
        setDistanceLines([]);
      }

      const lineNum = parseInt(currentDragElementState.elementId);
      if (!isNaN(lineNum)) {
        if (currentDragElementState.isLine) {
          const lines = effectiveContent.split(/\r?\n/);
          const line = lines[lineNum - 1];
          const isEndRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');
          handleLineDrag(
            effectiveContent,
            lineNum,
            currentDragElementState.elementX,
            currentDragElementState.elementY,
            currentDragElementState.elementX2,
            currentDragElementState.elementY2,
            dx,
            dy,
            (c: string) => usePreviewStore.getState().setDraftContent(c),
            isEndRelative
          );
        } else {
          handleElementDrag(
            effectiveContent,
            lineNum,
            currentDragElementState.elementX,
            currentDragElementState.elementY,
            dx,
            dy,
            (c: string) => usePreviewStore.getState().setDraftContent(c)
          );
        }
      }
      return;
    }

    if (currentMultiDragElements.length > 0) {
      const currentCoords = getSvgCoords(e.clientX, e.clientY);

      const avgStartX = currentMultiDragElements.reduce((sum, el) => sum + el.startX, 0) / currentMultiDragElements.length;
      const avgStartY = currentMultiDragElements.reduce((sum, el) => sum + el.startY, 0) / currentMultiDragElements.length;
      const startCoords = getSvgCoords(avgStartX, avgStartY);

      let dx = currentCoords.x - startCoords.x;
      let dy = currentCoords.y - startCoords.y;

      const groupBounds = getGroupBounds(currentMultiDragElements.map(e => e.elementId));
      if (!groupBounds) {
        usePreviewStore.getState().setDraftContent(effectiveContent);
        return;
      }

      if (snapToGuides) {
        const newX = groupBounds.x + dx;
        const newY = groupBounds.y + dy;

        const excludeIds = currentMultiDragElements.map(e => e.elementId);
        const otherElements = (ast?.elements || []).filter((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          return !excludeIds.includes(id);
        });

        const otherElementsBoundsMap = getAllElementsBoundsMap(otherElements);
        const snapElements: SnapElement[] = otherElements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = otherElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0));

        const allGuides = collectAllGuides({
          currentBounds: groupBounds,
          excludeIds,
          elements: snapElements,
          threshold: SNAP_THRESHOLD,
        });

        const activeEdges = getActiveEdgesForMove();
        const snapped = computeSnap(allGuides, newX, newY, groupBounds.w, groupBounds.h, activeEdges, SNAP_THRESHOLD);

        dx += snapped.snapped ? snapped.x - newX : 0;
        dy += snapped.snapped ? snapped.y - newY : 0;

        setAlignmentGuides([...snapped.snappedGuides]);

        if (snapped.snapped) {
          const distances = calculateDistances(
            { x: snapped.x, y: snapped.y, w: groupBounds.w, h: groupBounds.h },
            snapElements,
            excludeIds,
            50
          );
          setDistanceLines(distances);
        } else {
          setDistanceLines([]);
        }

        const gridSnapSize = 10;
        const snappedDx = Math.round(dx / gridSnapSize) * gridSnapSize;
        const snappedDy = Math.round(dy / gridSnapSize) * gridSnapSize;
        dx = snappedDx;
        dy = snappedDy;
      } else {
        setAlignmentGuides([]);
        setDistanceLines([]);
      }

      let newContent = effectiveContent;

      currentMultiDragElements.forEach((el) => {
        const lineNum = parseInt(el.elementId);
        if (isNaN(lineNum)) return;

        const bounds = detectElementBounds(effectiveContent, lineNum);
        const attributeLine = bounds.attributeLine;

        let finalX = Math.round(el.elementX + dx);
        let finalY = Math.round(el.elementY + dy);

        if (el.isLine) {
          if (el.elementX2 !== undefined && el.elementY2 !== undefined) {
            const originalDx = el.elementX2 - el.elementX;
            const originalDy = el.elementY2 - el.elementY;
            let newX2 = finalX + originalDx;
            let newY2 = finalY + originalDy;

            newContent = updateLineAttribute(newContent, attributeLine, 'x', finalX);
            newContent = updateLineAttribute(newContent, attributeLine, 'y', finalY);
            newContent = updateLineAttribute(newContent, attributeLine, 'x2', newX2);
            newContent = updateLineAttribute(newContent, attributeLine, 'y2', newY2);
          }
        } else {
          newContent = updateLineAttribute(newContent, attributeLine, 'x', finalX);
          newContent = updateLineAttribute(newContent, attributeLine, 'y', finalY);
        }
      });

      usePreviewStore.getState().setDraftContent(newContent);
      return;
    }

    if (currentBoxSelection) {
      setBoxSelection({
        ...currentBoxSelection,
        currentX: e.clientX,
        currentY: e.clientY
      });
    } else {
      const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
      const elementId = hoveredEl ? getElementIdFromSVGElement(hoveredEl as SVGElement) : null;
      setHoveredElement(elementId);
    }

    if (!currentDragElementState && currentMultiDragElements.length === 0 && !currentResizeHandleState && !currentDragPreviewElement) {
      if (currentAltKeyPressed && currentSelectedElements.length > 0 && currentHoveredElement) {
        const selectedId = currentSelectedElements[0];
        if (selectedId !== currentHoveredElement) {
          const selectedBounds = getElementBounds(selectedId);
          const hoveredBounds = getElementBounds(currentHoveredElement);
          if (selectedBounds && hoveredBounds &&
              !(selectedBounds.w === 0 && selectedBounds.h === 0) &&
              !(hoveredBounds.w === 0 && hoveredBounds.h === 0)) {
            const snapElements: SnapElement[] = [{ id: currentHoveredElement, bounds: hoveredBounds }];
            const distances = calculateDistances(selectedBounds, snapElements, [], 50);
            setDistanceLines(distances);
          }
        }
      } else if (currentAltKeyPressed && currentSelectedElements.length > 0 && !currentHoveredElement) {
        setDistanceLines([]);
      }
    }

    if (!currentAltKeyPressed && currentSelectedElements.length > 0 && !currentDragElementState && currentMultiDragElements.length === 0 && !currentResizeHandleState) {
      const selectedId = currentSelectedElements[0];
      const selectedBounds = getElementBounds(selectedId);
      if (selectedBounds && !(selectedBounds.w === 0 && selectedBounds.h === 0)) {
        const elements = ast?.elements || [];
        const allElementsBoundsMap = getAllElementsBoundsMap(elements);
        const snapElements: SnapElement[] = elements.map((el: SolarWireElement, idx: number) => {
          const id = el.location?.line?.toString() || (idx + 1).toString();
          const b = allElementsBoundsMap.get(id);
          return { id, bounds: { x: b?.x ?? 0, y: b?.y ?? 0, w: b?.w ?? 0, h: b?.h ?? 0 } };
        }).filter(e => !(e.bounds.w === 0 && e.bounds.h === 0) && e.id !== selectedId);

        let nearestElement: SnapElement | null = null;
        let nearestDist = Infinity;
        for (const el of snapElements) {
          const cx1 = selectedBounds.x + selectedBounds.w / 2;
          const cy1 = selectedBounds.y + selectedBounds.h / 2;
          const cx2 = el.bounds.x + el.bounds.w / 2;
          const cy2 = el.bounds.y + el.bounds.h / 2;
          const dist = Math.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestElement = el;
          }
        }

        if (nearestElement) {
          const distances = calculateDistances(selectedBounds, [nearestElement], [], 50);
          setDistanceLines(distances);
        } else {
          setDistanceLines([]);
        }
      }
    }
  }, [
    getSvgCoords, isPanMode, isSpacePressed, snapToGuides, effectiveContent, ast,
    setPosition, setBoxSelection, setHoveredElement, setAlignmentGuides,
    setDistanceLines, getElementBounds, getAllElementsBoundsMap, getGroupBounds,
  ]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const currentState = usePreviewStore.getState();
    const currentIsDraggingCanvas = currentState.isDraggingCanvas;
    const currentResizeHandleState = currentState.resizeHandleState;
    const currentDragElementState = currentState.dragElementState;
    const currentMultiDragElements = currentState.multiDragElements;
    const currentBoxSelection = currentState.boxSelection;

    if (currentIsDraggingCanvas) {
      endCanvasDrag();
      return;
    }

    if (currentResizeHandleState) {
      const result = usePreviewStore.getState().commit();
      if (result && result.content !== result.snapshot) {
        effectiveSetContent(result.content, result.snapshot);
      } else {
        usePreviewStore.getState().clearDraftContent();
      }
      setResizeHandleState(null);
      setAlignmentGuides([]);
      return;
    }

    if (currentDragElementState) {
      const result = usePreviewStore.getState().commit();
      if (result && result.content !== result.snapshot) {
        effectiveSetContent(result.content, result.snapshot);
      } else {
        usePreviewStore.getState().clearDraftContent();
      }
      setDragElementState(null);
      setAlignmentGuides([]);
      return;
    }

    if (currentMultiDragElements.length > 0) {
      const result = usePreviewStore.getState().commit();
      if (result && result.content !== result.snapshot) {
        effectiveSetContent(result.content, result.snapshot);
      } else {
        usePreviewStore.getState().clearDraftContent();
      }
      setMultiDragElements([]);
      setAlignmentGuides([]);
      return;
    }

    if (currentBoxSelection) {
      const startCoords = getSvgCoords(currentBoxSelection.startX, currentBoxSelection.startY);
      const currentCoords = getSvgCoords(currentBoxSelection.currentX, currentBoxSelection.currentY);
      testBoxSelection(
        startCoords.x,
        startCoords.y,
        currentCoords.x,
        currentCoords.y
      );
      setBoxSelection(null);
    }
  }, [
    getSvgCoords, testBoxSelection,
    endCanvasDrag, setResizeHandleState, setDragElementState,
    setMultiDragElements, setAlignmentGuides, setBoxSelection,
  ]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    lastMousePosition,
    setLastMousePosition,
  };
}
