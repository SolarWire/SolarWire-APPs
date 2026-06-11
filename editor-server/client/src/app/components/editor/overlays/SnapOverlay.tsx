import React, { useMemo } from 'react';
import type { AlignmentGuide, DistanceLine, RenderContext } from '../snap';
import { renderAlignmentGuides, renderDistanceLines } from '../snap';
import type { Element as SolarWireElement } from '../../../../lib/parser/types';
import { getLineCoordinates } from '../../../../shared/utils/line-coordinate-utils';

interface SnapOverlayProps {
  alignmentGuides: AlignmentGuide[];
  distanceLines: DistanceLine[];
  selectedElements: string[];
  effectiveContent: string;
  viewBox: { x: number; y: number; width: number; height: number } | null;
  scale: number;
  primaryColor: string;
  getElementData: (elementId: string) => SolarWireElement | null;
  getElementBounds: (elementId: string) => { x: number; y: number; w: number; h: number; r: number };
  getLineCoordinates: (element: SolarWireElement) => { x1: number; y1: number; x2: number; y2: number };
}

const SnapOverlay: React.FC<SnapOverlayProps> = ({
  alignmentGuides,
  distanceLines,
  selectedElements,
  effectiveContent,
  viewBox,
  scale,
  primaryColor,
  getElementData,
  getElementBounds,
  getLineCoordinates: getLineCoords,
}) => {
  const snapRenderContext: RenderContext = useMemo(() => ({
    viewBox: viewBox || null,
    scale,
    primaryColor,
  }), [viewBox, scale, primaryColor]);

  const renderSnapOverlays = () => {
    const guidesEl = renderAlignmentGuides(alignmentGuides, snapRenderContext);
    const distancesEl = renderDistanceLines(distanceLines, snapRenderContext);

    if (!guidesEl && !distancesEl) return null;

    return (
      <g className="snap-overlays">
        {guidesEl}
        {distancesEl}
      </g>
    );
  };

  const renderReferenceLines = () => {
    if (selectedElements.length === 0) return null;

    const lines: React.ReactElement[] = [];

    selectedElements.forEach((elementId) => {
      const elementData = getElementData(elementId);
      if (!elementData) return;

      const lineNum = parseInt(elementId);

      if (!isNaN(lineNum)) {
        const contentLines = effectiveContent.split(/\r?\n/);
        if (lineNum > 0 && lineNum <= contentLines.length) {
          const line = contentLines[lineNum - 1];

          const isRelative = line.includes('->(') && !line.includes('x2=') && !line.includes('y2=');

          if (isRelative && elementData.type === 'line') {
            const { x1, y1, x2, y2 } = getLineCoords(elementData);
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

  return (
    <>
      {renderSnapOverlays()}
      {renderReferenceLines()}
    </>
  );
};

export default SnapOverlay;
