import React from 'react';
import type { BoxSelectionState } from '../../../stores/previewStore';
import type { Element as SolarWireElement } from '../../../../lib/parser/types';
import { hexToRgba } from '../../../../shared/utils/preview-utils';
import { getLineCoordinates } from '../../../../shared/utils/line-coordinate-utils';

interface SelectionOverlayProps {
  boxSelection: BoxSelectionState | null;
  hoveredElement: string | null;
  selectedElements: string[];
  scale: number;
  primaryColor: string;
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  getElementData: (elementId: string) => SolarWireElement | null;
  getElementBounds: (elementId: string) => { x: number; y: number; w: number; h: number; r: number };
  getLineCoordinates: (element: SolarWireElement) => { x1: number; y1: number; x2: number; y2: number };
  hexToRgba: (color: string, alpha: number) => string;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  boxSelection,
  hoveredElement,
  selectedElements,
  scale,
  primaryColor,
  getSvgCoords,
  getElementData,
  getElementBounds,
  getLineCoordinates: getLineCoords,
  hexToRgba: toRgba,
}) => {
  const renderBoxSelection = () => {
    if (!boxSelection) return null;

    const startCoords = getSvgCoords(boxSelection.startX, boxSelection.startY);
    const currentCoords = getSvgCoords(boxSelection.currentX, boxSelection.currentY);

    const x = Math.min(startCoords.x, currentCoords.x);
    const y = Math.min(startCoords.y, currentCoords.y);
    const width = Math.abs(currentCoords.x - startCoords.x);
    const height = Math.abs(currentCoords.y - startCoords.y);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={toRgba(primaryColor, 0.1)}
        stroke={primaryColor}
        strokeWidth={2 / scale}
        strokeDasharray={`${4 / scale},${4 / scale}`}
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

    const handles: React.ReactElement[] = [];
    const handleSize = 8 / scale;

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      const bounds = getElementBounds(elementId);

      if (elementData && elementData.type === 'line') {
        const { x1, y1, x2, y2 } = getLineCoords(elementData);

        const endPoints = [
          { x: x1, y: y1, handle: 'start' as const },
          { x: x2, y: y2, handle: 'end' as const },
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
      } else if (elementData) {
        if (elementData.type === 'text') {
          handles.push(
            <rect
              key={`${elementId}-selection-border`}
              data-element-id={elementId}
              x={bounds.x}
              y={bounds.y}
              width={bounds.w}
              height={bounds.h}
              fill="none"
              stroke={primaryColor}
              strokeWidth={2 / scale}
              style={{ pointerEvents: 'none' }}
            />
          );
        } else {
          const isCircle = elementData.type === 'circle';
          const corners = isCircle
            ? [
                { x: bounds.x, y: bounds.y, handle: 'nw' as const },
                { x: bounds.x + bounds.w, y: bounds.y, handle: 'ne' as const },
                { x: bounds.x, y: bounds.y + bounds.h, handle: 'sw' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h, handle: 'se' as const },
              ]
            : [
                { x: bounds.x, y: bounds.y, handle: 'nw' as const },
                { x: bounds.x + bounds.w / 2, y: bounds.y, handle: 'n' as const },
                { x: bounds.x + bounds.w, y: bounds.y, handle: 'ne' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h / 2, handle: 'e' as const },
                { x: bounds.x + bounds.w, y: bounds.y + bounds.h, handle: 'se' as const },
                { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h, handle: 's' as const },
                { x: bounds.x, y: bounds.y + bounds.h, handle: 'sw' as const },
                { x: bounds.x, y: bounds.y + bounds.h / 2, handle: 'w' as const },
              ];

          const cursorMap: Record<string, string> = isCircle
            ? { nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize' }
            : {
                nw: 'nw-resize',
                n: 'n-resize',
                ne: 'ne-resize',
                e: 'e-resize',
                se: 'se-resize',
                s: 's-resize',
                sw: 'sw-resize',
                w: 'w-resize',
              };

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
                style={{ cursor: cursorMap[corner.handle], pointerEvents: 'auto' }}
              />
            );
          });
        }
      }
    });

    return handles;
  };

  return (
    <>
      {renderBoxSelection()}
      {renderHoverHighlight()}
      {renderSelectionHandles()}
    </>
  );
};

export default SelectionOverlay;
