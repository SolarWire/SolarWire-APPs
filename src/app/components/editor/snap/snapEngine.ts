import type {
  Bounds,
  SnapElement,
  AlignmentGuide,
  ElementAlignGuide,
  CanvasGuide,
  SpacingGuide,
  DistributeGuide,
  ActiveEdges,
  SnapResult,
  DistanceLine,
  GuideTypeStrategy,
  CollectContext,
} from './types';

const DEFAULT_THRESHOLD = 6;

const GUIDE_TYPE_STRATEGIES = new Map<string, GuideTypeStrategy>([
  ['left', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.left,
    getCurrentEdge: (b) => b.x,
    computeSnappedPosition: (pos) => pos,
  }],
  ['right', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.right,
    getCurrentEdge: (b) => b.x + b.w,
    computeSnappedPosition: (pos, b) => pos - b.w,
  }],
  ['centerX', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.left || e.right,
    getCurrentEdge: (b) => b.x + b.w / 2,
    computeSnappedPosition: (pos, b) => pos - b.w / 2,
  }],
  ['spacingX', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.right,
    getCurrentEdge: (b) => b.x + b.w,
    computeSnappedPosition: (pos, b) => pos - b.w,
  }],
  ['distributeX', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.right,
    getCurrentEdge: (b) => b.x + b.w,
    computeSnappedPosition: (pos, b) => pos - b.w,
  }],
  ['canvasLeft', {
    axis: 'x', isHorizontal: false,
    isActive: (e) => e.left,
    getCurrentEdge: (b) => b.x,
    computeSnappedPosition: (pos) => pos,
  }],
  ['top', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.top,
    getCurrentEdge: (b) => b.y,
    computeSnappedPosition: (pos) => pos,
  }],
  ['bottom', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.bottom,
    getCurrentEdge: (b) => b.y + b.h,
    computeSnappedPosition: (pos, b) => pos - b.h,
  }],
  ['centerY', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.top || e.bottom,
    getCurrentEdge: (b) => b.y + b.h / 2,
    computeSnappedPosition: (pos, b) => pos - b.h / 2,
  }],
  ['spacingY', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.bottom,
    getCurrentEdge: (b) => b.y + b.h,
    computeSnappedPosition: (pos, b) => pos - b.h,
  }],
  ['distributeY', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.bottom,
    getCurrentEdge: (b) => b.y + b.h,
    computeSnappedPosition: (pos, b) => pos - b.h,
  }],
  ['canvasTop', {
    axis: 'y', isHorizontal: true,
    isActive: (e) => e.top,
    getCurrentEdge: (b) => b.y,
    computeSnappedPosition: (pos) => pos,
  }],
]);

export function getStrategy(type: string): GuideTypeStrategy | undefined {
  return GUIDE_TYPE_STRATEGIES.get(type);
}

export function isHorizontalGuide(type: string): boolean {
  const strategy = GUIDE_TYPE_STRATEGIES.get(type);
  return strategy?.isHorizontal ?? false;
}

export function collectElementGuides(
  excludeIds: string[],
  elements: SnapElement[]
): ElementAlignGuide[] {
  const guides: ElementAlignGuide[] = [];

  for (const el of elements) {
    if (excludeIds.includes(el.id)) continue;
    const { x, y, w, h } = el.bounds;
    if (w === 0 && h === 0) continue;

    guides.push(
      { type: 'left',     position: x,         sourceElementId: el.id, sourceBounds: el.bounds, priority: 1, isSnapped: false },
      { type: 'right',    position: x + w,     sourceElementId: el.id, sourceBounds: el.bounds, priority: 1, isSnapped: false },
      { type: 'top',      position: y,         sourceElementId: el.id, sourceBounds: el.bounds, priority: 1, isSnapped: false },
      { type: 'bottom',   position: y + h,     sourceElementId: el.id, sourceBounds: el.bounds, priority: 1, isSnapped: false },
      { type: 'centerX',  position: x + w / 2, sourceElementId: el.id, sourceBounds: el.bounds, priority: 2, isSnapped: false },
      { type: 'centerY',  position: y + h / 2, sourceElementId: el.id, sourceBounds: el.bounds, priority: 2, isSnapped: false },
    );
  }

  return guides;
}

export function collectCanvasGuides(): CanvasGuide[] {
  return [
    { type: 'canvasLeft', position: 0, priority: 4, isSnapped: false },
    { type: 'canvasTop',  position: 0, priority: 4, isSnapped: false },
  ];
}

export function collectSpacingGuides(
  currentBounds: Bounds,
  allElementsBounds: SnapElement[],
  threshold: number
): SpacingGuide[] {
  const guides: SpacingGuide[] = [];

  const allWithCurrent: SnapElement[] = [
    ...allElementsBounds,
    { id: 'current', bounds: currentBounds },
  ];

  const sortedByX = allWithCurrent
    .filter(e => Math.abs(e.bounds.y - currentBounds.y) < threshold * 2)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  for (let i = 1; i < sortedByX.length - 1; i++) {
    const prev = sortedByX[i - 1];
    const curr = sortedByX[i];
    const next = sortedByX[i + 1];
    const gap1 = curr.bounds.x - (prev.bounds.x + prev.bounds.w);
    const gap2 = next.bounds.x - (curr.bounds.x + curr.bounds.w);

    if (Math.abs(gap1 - gap2) < 2 && gap1 > 0 && gap2 > 0) {
      guides.push({
        type: 'spacingX',
        position: curr.bounds.x + curr.bounds.w + gap1 / 2,
        distance: Math.round(gap1),
        relatedElementIds: [prev.id, curr.id, next.id],
        priority: 3,
        isSnapped: false,
      });
    }
  }

  const sortedByY = allWithCurrent
    .filter(e => Math.abs(e.bounds.x - currentBounds.x) < threshold * 2)
    .sort((a, b) => a.bounds.y - b.bounds.y);

  for (let i = 1; i < sortedByY.length - 1; i++) {
    const prev = sortedByY[i - 1];
    const curr = sortedByY[i];
    const next = sortedByY[i + 1];
    const gap1 = curr.bounds.y - (prev.bounds.y + prev.bounds.h);
    const gap2 = next.bounds.y - (curr.bounds.y + curr.bounds.h);

    if (Math.abs(gap1 - gap2) < 2 && gap1 > 0 && gap2 > 0) {
      guides.push({
        type: 'spacingY',
        position: curr.bounds.y + curr.bounds.h + gap1 / 2,
        distance: Math.round(gap1),
        relatedElementIds: [prev.id, curr.id, next.id],
        priority: 3,
        isSnapped: false,
      });
    }
  }

  return guides;
}

export function collectDistributeGuides(
  currentBounds: Bounds,
  allElementsBounds: SnapElement[],
  threshold: number
): DistributeGuide[] {
  const guides: DistributeGuide[] = [];

  const allWithCurrent: SnapElement[] = [
    ...allElementsBounds,
    { id: 'current', bounds: currentBounds },
  ];

  const yAligned = allWithCurrent
    .filter(e => Math.abs(e.bounds.y - currentBounds.y) < threshold * 2)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  if (yAligned.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < yAligned.length - 1; i++) {
      gaps.push(yAligned[i + 1].bounds.x - (yAligned[i].bounds.x + yAligned[i].bounds.w));
    }
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const isUniform = gaps.every(g => Math.abs(g - avgGap) < 2 && g > 0);

    if (isUniform && gaps.length >= 2) {
      for (let i = 0; i < yAligned.length - 1; i++) {
        guides.push({
          type: 'distributeX',
          position: yAligned[i].bounds.x + yAligned[i].bounds.w + avgGap / 2,
          distance: Math.round(avgGap),
          relatedElementIds: [yAligned[i].id, yAligned[i + 1].id],
          priority: 6,
          isSnapped: false,
        });
      }
    }
  }

  const xAligned = allWithCurrent
    .filter(e => Math.abs(e.bounds.x - currentBounds.x) < threshold * 2)
    .sort((a, b) => a.bounds.y - b.bounds.y);

  if (xAligned.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < xAligned.length - 1; i++) {
      gaps.push(xAligned[i + 1].bounds.y - (xAligned[i].bounds.y + xAligned[i].bounds.h));
    }
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const isUniform = gaps.every(g => Math.abs(g - avgGap) < 2 && g > 0);

    if (isUniform && gaps.length >= 2) {
      for (let i = 0; i < xAligned.length - 1; i++) {
        guides.push({
          type: 'distributeY',
          position: xAligned[i].bounds.y + xAligned[i].bounds.h + avgGap / 2,
          distance: Math.round(avgGap),
          relatedElementIds: [xAligned[i].id, xAligned[i + 1].id],
          priority: 6,
          isSnapped: false,
        });
      }
    }
  }

  return guides;
}

export function collectAllGuides(context: CollectContext): AlignmentGuide[] {
  const { currentBounds, excludeIds, elements, threshold } = context;

  const otherElements = elements.filter(e => !excludeIds.includes(e.id));
  const elementGuides = collectElementGuides(excludeIds, elements);
  const canvasGuides = collectCanvasGuides();
  const spacingGuides = collectSpacingGuides(currentBounds, otherElements, threshold);
  const distributeGuides = collectDistributeGuides(currentBounds, otherElements, threshold);

  return [...elementGuides, ...canvasGuides, ...spacingGuides, ...distributeGuides];
}

function computeSnapForAxis(
  guides: AlignmentGuide[],
  bounds: Bounds,
  activeEdges: ActiveEdges,
  threshold: number,
  axis: 'x' | 'y'
): {
  snappedPos: number;
  snappedGuide: AlignmentGuide | null;
  nearbyGuides: AlignmentGuide[];
} {
  const nearbyThreshold = threshold * 2;
  const defaultPos = axis === 'x' ? bounds.x : bounds.y;

  let bestDistance = threshold;
  let bestGuide: AlignmentGuide | null = null;
  let bestSnappedPos = defaultPos;

  const guideResults: Array<{ guide: AlignmentGuide; distance: number; snappedPos: number | null }> = [];

  const sortedGuides = [...guides].sort((a, b) => b.priority - a.priority);

  for (const guide of sortedGuides) {
    const strategy = GUIDE_TYPE_STRATEGIES.get(guide.type);
    if (!strategy || strategy.axis !== axis) continue;
    if (!strategy.isActive(activeEdges)) continue;

    const currentEdge = strategy.getCurrentEdge(bounds);
    const distance = Math.abs(currentEdge - guide.position);
    const snappedPos = strategy.computeSnappedPosition(guide.position, bounds);

    guideResults.push({ guide, distance, snappedPos });

    if (snappedPos !== null && distance < bestDistance) {
      bestDistance = distance;
      bestSnappedPos = snappedPos;
      bestGuide = guide;
    }
  }

  const nearbyGuides: AlignmentGuide[] = [];
  for (const result of guideResults) {
    if (
      result.snappedPos !== null &&
      result.distance <= nearbyThreshold &&
      result.guide !== bestGuide
    ) {
      nearbyGuides.push({
        ...result.guide,
        distance: Math.round(result.distance),
        isSnapped: false,
        isNearby: true,
      });
    }
  }

  if (bestGuide) {
    bestGuide = { ...bestGuide, isSnapped: true };
  }

  return {
    snappedPos: bestGuide ? bestSnappedPos : defaultPos,
    snappedGuide: bestGuide,
    nearbyGuides,
  };
}

export function computeSnap(
  guides: AlignmentGuide[],
  currentX: number,
  currentY: number,
  currentW: number,
  currentH: number,
  activeEdges: ActiveEdges,
  threshold: number = DEFAULT_THRESHOLD
): SnapResult {
  const bounds: Bounds = { x: currentX, y: currentY, w: currentW, h: currentH };

  const xResult = computeSnapForAxis(guides, bounds, activeEdges, threshold, 'x');
  const yResult = computeSnapForAxis(guides, bounds, activeEdges, threshold, 'y');

  const snappedGuides: AlignmentGuide[] = [];
  if (xResult.snappedGuide) snappedGuides.push(xResult.snappedGuide);
  if (yResult.snappedGuide) snappedGuides.push(yResult.snappedGuide);

  return {
    x: xResult.snappedPos,
    y: yResult.snappedPos,
    w: currentW,
    h: currentH,
    snapped: snappedGuides.length > 0,
    snappedGuides,
    nearbyGuides: [...xResult.nearbyGuides, ...yResult.nearbyGuides],
  };
}

export function getActiveEdgesForMove(): ActiveEdges {
  return { left: true, right: true, top: true, bottom: true };
}

export function getActiveEdgesForResize(
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w'
): ActiveEdges {
  return {
    left: handle.includes('w'),
    right: handle.includes('e'),
    top: handle.includes('n'),
    bottom: handle.includes('s'),
  };
}

export function calculateDistances(
  currentBounds: Bounds,
  elements: SnapElement[],
  excludeIds: string[],
  maxDistance: number = 100
): DistanceLine[] {
  const lines: DistanceLine[] = [];
  const myLeft = currentBounds.x;
  const myRight = currentBounds.x + currentBounds.w;
  const myTop = currentBounds.y;
  const myBottom = currentBounds.y + currentBounds.h;

  for (const el of elements) {
    if (excludeIds.includes(el.id)) continue;
    const { x, y, w, h } = el.bounds;
    if (w === 0 && h === 0) continue;

    const bLeft = x;
    const bRight = x + w;
    const bTop = y;
    const bBottom = y + h;

    const xOverlapStart = Math.max(myLeft, bLeft);
    const xOverlapEnd = Math.min(myRight, bRight);
    const xHasOverlap = xOverlapEnd > xOverlapStart;

    const yOverlapStart = Math.max(myTop, bTop);
    const yOverlapEnd = Math.min(myBottom, bBottom);
    const yHasOverlap = yOverlapEnd > yOverlapStart;

    if (yHasOverlap) {
      const leftToLeft = Math.abs(myLeft - bLeft);
      if (leftToLeft < maxDistance) {
        lines.push({
          axis: 'x', currentEdge: myLeft, targetEdge: bLeft,
          distance: Math.round(leftToLeft), hasOverlap: true,
          overlapStart: yOverlapStart, overlapEnd: yOverlapEnd,
          targetBounds: el.bounds,
        });
      }
      const rightToRight = Math.abs(myRight - bRight);
      if (rightToRight < maxDistance) {
        lines.push({
          axis: 'x', currentEdge: myRight, targetEdge: bRight,
          distance: Math.round(rightToRight), hasOverlap: true,
          overlapStart: yOverlapStart, overlapEnd: yOverlapEnd,
          targetBounds: el.bounds,
        });
      }
    } else {
      if (myLeft > bRight) {
        const dist = Math.round(myLeft - bRight);
        if (dist < maxDistance) {
          lines.push({
            axis: 'x', currentEdge: myLeft, targetEdge: bRight,
            distance: dist, hasOverlap: false,
            overlapStart: yOverlapStart, overlapEnd: yOverlapEnd,
            targetBounds: el.bounds,
          });
        }
      }
      if (bLeft > myRight) {
        const dist = Math.round(bLeft - myRight);
        if (dist < maxDistance) {
          lines.push({
            axis: 'x', currentEdge: myRight, targetEdge: bLeft,
            distance: dist, hasOverlap: false,
            overlapStart: yOverlapStart, overlapEnd: yOverlapEnd,
            targetBounds: el.bounds,
          });
        }
      }
    }

    if (xHasOverlap) {
      const topToTop = Math.abs(myTop - bTop);
      if (topToTop < maxDistance) {
        lines.push({
          axis: 'y', currentEdge: myTop, targetEdge: bTop,
          distance: Math.round(topToTop), hasOverlap: true,
          overlapStart: xOverlapStart, overlapEnd: xOverlapEnd,
          targetBounds: el.bounds,
        });
      }
      const bottomToBottom = Math.abs(myBottom - bBottom);
      if (bottomToBottom < maxDistance) {
        lines.push({
          axis: 'y', currentEdge: myBottom, targetEdge: bBottom,
          distance: Math.round(bottomToBottom), hasOverlap: true,
          overlapStart: xOverlapStart, overlapEnd: xOverlapEnd,
          targetBounds: el.bounds,
        });
      }
    } else {
      if (myTop > bBottom) {
        const dist = Math.round(myTop - bBottom);
        if (dist < maxDistance) {
          lines.push({
            axis: 'y', currentEdge: myTop, targetEdge: bBottom,
            distance: dist, hasOverlap: false,
            overlapStart: xOverlapStart, overlapEnd: xOverlapEnd,
            targetBounds: el.bounds,
          });
        }
      }
      if (bTop > myBottom) {
        const dist = Math.round(bTop - myBottom);
        if (dist < maxDistance) {
          lines.push({
            axis: 'y', currentEdge: myBottom, targetEdge: bTop,
            distance: dist, hasOverlap: false,
            overlapStart: xOverlapStart, overlapEnd: xOverlapEnd,
            targetBounds: el.bounds,
          });
        }
      }
    }
  }

  return lines;
}
