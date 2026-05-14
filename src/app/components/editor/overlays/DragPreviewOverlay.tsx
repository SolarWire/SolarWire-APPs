import React from 'react';
import type { DragPreviewElement } from '../../../stores/previewStore';
import { hexToRgba } from '../../../../shared/utils/preview-utils';

interface DragPreviewOverlayProps {
  dragPreviewElement: DragPreviewElement | null;
  scale: number;
  primaryColor: string;
  hexToRgba: (color: string, alpha: number) => string;
}

const getComponentPreviewBounds = (code: string, mouseX: number, mouseY: number) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const lines = code.split(/\r?\n/);
  for (const line of lines) {
    const coordMatches = line.matchAll(/@((\d+),\s*(\d+))/g);
    for (const match of coordMatches) {
      const ex = parseInt(match[2], 10);
      const ey = parseInt(match[3], 10);
      minX = Math.min(minX, ex);
      minY = Math.min(minY, ey);
      maxX = Math.max(maxX, ex);
      maxY = Math.max(maxY, ey);
    }

    const lineEndMatches = line.matchAll(/->\((\d+),\s*(\d+)\)/g);
    for (const match of lineEndMatches) {
      const ex = parseInt(match[2], 10);
      const ey = parseInt(match[3], 10);
      maxX = Math.max(maxX, ex);
      maxY = Math.max(maxY, ey);
    }

    const widthMatch = line.match(/w=(\d+)/);
    const heightMatch = line.match(/h=(\d+)/);
    if (widthMatch && heightMatch) {
      const lastCoordMatch = [...line.matchAll(/@((\d+),\s*(\d+))/g)].pop();
      if (lastCoordMatch) {
        const ex = parseInt(lastCoordMatch[2], 10) + parseInt(widthMatch[1], 10);
        const ey = parseInt(lastCoordMatch[3], 10) + parseInt(heightMatch[1], 10);
        maxX = Math.max(maxX, ex);
        maxY = Math.max(maxY, ey);
      }
    }
  }

  if (minX === Infinity) {
    return { x: mouseX, y: mouseY, width: 100, height: 50 };
  }

  const width = maxX - minX + 20;
  const height = maxY - minY + 20;

  return {
    x: mouseX,
    y: mouseY,
    width,
    height,
  };
};

const DragPreviewOverlay: React.FC<DragPreviewOverlayProps> = ({
  dragPreviewElement,
  scale,
  primaryColor,
  hexToRgba: toRgba,
}) => {
  if (!dragPreviewElement) return null;

  const { type, x, y } = dragPreviewElement;

  switch (type) {
    case 'rectangle':
      return (
        <rect
          x={x}
          y={y}
          width={100}
          height={50}
          fill={toRgba(primaryColor, 0.3)}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
      );
    case 'rounded-rectangle':
      return (
        <rect
          x={x}
          y={y}
          width={100}
          height={50}
          rx={6}
          ry={6}
          fill={toRgba(primaryColor, 0.3)}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
      );
    case 'circle':
      return (
        <ellipse
          cx={x + 50}
          cy={y + 20}
          rx={50}
          ry={20}
          fill={toRgba(primaryColor, 0.3)}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
      );
    case 'text':
      return (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={x}
            y={y}
            width={80}
            height={20}
            fill={toRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
          />
          <text
            x={x + 5}
            y={y + 15}
            fontSize={12 / scale}
            fill={primaryColor}
            style={{ userSelect: 'none' }}
          >
            Text
          </text>
        </g>
      );
    case 'line':
      return (
        <line
          x1={x}
          y1={y}
          x2={x + 100}
          y2={y}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
      );
    case 'image':
      return (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={x}
            y={y}
            width={100}
            height={80}
            fill={toRgba(primaryColor, 0.15)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
          />
          <g transform={`translate(${x + 35}, ${y + 20}) scale(${1 / scale})`}>
            <rect x="0" y="0" width="30" height="30" fill="none" stroke={primaryColor} strokeWidth="2" rx="4" />
            <path d="M6 10 L15 22 L24 10" fill="none" stroke={primaryColor} strokeWidth="2" />
            <circle cx="10" cy="13" r="2.5" fill={primaryColor} />
          </g>
        </g>
      );
    case 'placeholder':
      return (
        <rect
          x={x}
          y={y}
          width={100}
          height={50}
          fill={toRgba(primaryColor, 0.3)}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="4,4"
          style={{ pointerEvents: 'none' }}
        />
      );
    case 'table':
      return (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={x}
            y={y}
            width={200}
            height={100}
            fill={toRgba(primaryColor, 0.3)}
            stroke={primaryColor}
            strokeWidth={2 / scale}
            strokeDasharray="4,4"
          />
          <line
            x1={x}
            y1={y + 25}
            x2={x + 200}
            y2={y + 25}
            stroke={primaryColor}
            strokeWidth={1 / scale}
            strokeDasharray="2,2"
          />
          <line
            x1={x + 100}
            y1={y}
            x2={x + 100}
            y2={y + 100}
            stroke={primaryColor}
            strokeWidth={1 / scale}
            strokeDasharray="2,2"
          />
        </g>
      );
    case 'component':
      if (!dragPreviewElement?.code) return null;
      const componentBounds = getComponentPreviewBounds(dragPreviewElement.code, x, y);
      return (
        <rect
          x={componentBounds.x}
          y={componentBounds.y}
          width={componentBounds.width}
          height={componentBounds.height}
          fill={toRgba(primaryColor, 0.15)}
          stroke={primaryColor}
          strokeWidth={2 / scale}
          strokeDasharray="6,4"
          rx={4}
          ry={4}
          style={{ pointerEvents: 'none' }}
        />
      );
    default:
      return null;
  }
};

export default DragPreviewOverlay;
