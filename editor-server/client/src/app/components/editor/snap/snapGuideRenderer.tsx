import React from 'react';
import type { AlignmentGuide, DistanceLine, RenderContext } from './types';
import { isHorizontalGuide } from './snapEngine';

function getVisibleBounds(viewBox: RenderContext['viewBox']) {
  return viewBox
    ? { width: viewBox.x + viewBox.width, height: viewBox.y + viewBox.height }
    : { width: 100000, height: 100000 };
}

const SNAP_GUIDE_STYLE = {
  strokeOpacity: 0.85,
  strokeWidth: 1.5,
};

const CANVAS_GUIDE_STYLE = {
  strokeOpacity: 0.35,
  strokeWidth: 1,
  dashArray: [4, 4],
};

function renderSnappedGuide(
  guide: AlignmentGuide,
  index: number,
  ctx: RenderContext
): React.ReactElement | null {
  if (!guide.isSnapped) return null;

  const pos = guide.position;
  const isH = isHorizontalGuide(guide.type);
  const { viewBox, scale, primaryColor } = ctx;
  const visibleBounds = getVisibleBounds(viewBox);

  return (
    <g key={`align-${index}`} pointerEvents="none">
      <line
        x1={isH ? viewBox?.x || 0 : pos}
        y1={isH ? pos : viewBox?.y || 0}
        x2={isH ? visibleBounds.width : pos}
        y2={isH ? pos : visibleBounds.height}
        stroke={primaryColor}
        strokeWidth={SNAP_GUIDE_STYLE.strokeWidth / scale}
        strokeDasharray="none"
        opacity={SNAP_GUIDE_STYLE.strokeOpacity}
      />
      {guide.distance != null && guide.distance > 0 && (
        <>
          <rect
            x={isH ? (viewBox?.x || 0) + (viewBox?.width || 0) / 2 - 18 / scale : pos + 4 / scale}
            y={isH ? pos + 4 / scale : (viewBox?.y || 0) + (viewBox?.height || 0) / 2 - 7 / scale}
            width={36 / scale}
            height={14 / scale}
            fill="var(--bg-primary)"
            fillOpacity={0.9}
            rx={3 / scale}
            stroke={primaryColor}
            strokeWidth={0.5 / scale}
          />
          <text
            x={isH ? (viewBox?.x || 0) + (viewBox?.width || 0) / 2 : pos + 4 / scale}
            y={isH ? pos + 14 / scale : (viewBox?.y || 0) + (viewBox?.height || 0) / 2 + 4 / scale}
            fontSize={`${9 / scale}px`}
            fill={primaryColor}
            textAnchor="middle"
            fontFamily="Menlo, Consolas, monospace"
          >
            {guide.distance}px
          </text>
        </>
      )}
    </g>
  );
}

function renderCanvasGuide(
  guide: AlignmentGuide,
  index: number,
  ctx: RenderContext
): React.ReactElement {
  const pos = guide.position;
  const isH = isHorizontalGuide(guide.type);
  const { viewBox, scale, primaryColor } = ctx;
  const visibleBounds = getVisibleBounds(viewBox);

  return (
    <line
      key={`canvas-${index}`}
      x1={isH ? viewBox?.x || 0 : pos}
      y1={isH ? pos : viewBox?.y || 0}
      x2={isH ? visibleBounds.width : pos}
      y2={isH ? pos : visibleBounds.height}
      stroke={primaryColor}
      strokeWidth={CANVAS_GUIDE_STYLE.strokeWidth / scale}
      strokeDasharray={`${CANVAS_GUIDE_STYLE.dashArray[0] / scale},${CANVAS_GUIDE_STYLE.dashArray[1] / scale}`}
      opacity={CANVAS_GUIDE_STYLE.strokeOpacity}
      pointerEvents="none"
    />
  );
}

export function renderAlignmentGuides(
  guides: AlignmentGuide[],
  ctx: RenderContext
): React.ReactElement | null {
  if (guides.length === 0) return null;

  const elements: React.ReactElement[] = [];

  guides.forEach((guide, index) => {
    if (guide.type.startsWith('canvas')) {
      elements.push(renderCanvasGuide(guide, index, ctx));
    } else if (guide.isSnapped) {
      const el = renderSnappedGuide(guide, index, ctx);
      if (el) elements.push(el);
    }
  });

  if (elements.length === 0) return null;

  return (
    <g className="alignment-guides">
      {elements}
    </g>
  );
}

export function renderDistanceLines(
  distances: DistanceLine[],
  ctx: RenderContext
): React.ReactElement | null {
  if (distances.length === 0) return null;

  const { viewBox, scale, primaryColor } = ctx;
  const lineOffset = 12 / scale;

  const sortedDistances = [...distances]
    .filter(d => d.distance > 0)
    .sort((a, b) => a.distance - b.distance);

  const topDistances = sortedDistances.slice(0, 3);

  return (
    <g className="distance-lines">
      {topDistances.map((dist, index) => {
        const isH = dist.axis === 'y';

        let lineX1: number, lineY1: number, lineX2: number, lineY2: number;
        let labelX: number, labelY: number;

        if (isH) {
          const midX = (dist.overlapStart + dist.overlapEnd) / 2;
          lineX1 = midX;
          lineY1 = dist.currentEdge;
          lineX2 = midX;
          lineY2 = dist.targetEdge;
          labelX = midX + lineOffset;
          labelY = (dist.currentEdge + dist.targetEdge) / 2 + 4 / scale;
        } else {
          const midY = (dist.overlapStart + dist.overlapEnd) / 2;
          lineX1 = dist.currentEdge;
          lineY1 = midY;
          lineX2 = dist.targetEdge;
          lineY2 = midY;
          labelX = (dist.currentEdge + dist.targetEdge) / 2;
          labelY = midY - lineOffset;
        }

        return (
          <g key={`dist-${index}`} pointerEvents="none">
            <line
              x1={lineX1}
              y1={lineY1}
              x2={lineX2}
              y2={lineY2}
              stroke={primaryColor}
              strokeWidth={1 / scale}
              strokeDasharray={`${3 / scale},${3 / scale}`}
              opacity={0.5}
            />
            <rect
              x={labelX - 16 / scale}
              y={labelY - 8 / scale}
              width={32 / scale}
              height={14 / scale}
              fill="var(--bg-primary)"
              fillOpacity={0.9}
              rx={2 / scale}
              stroke={primaryColor}
              strokeWidth={0.5 / scale}
            />
            <text
              x={labelX}
              y={labelY + 3 / scale}
              fontSize={`${8 / scale}px`}
              fill={primaryColor}
              textAnchor="middle"
              fontFamily="Menlo, Consolas, monospace"
            >
              {dist.distance}px
            </text>
          </g>
        );
      })}
    </g>
  );
}
