import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { ViewportManager } from '../../../shared/utils/ViewportManager';

interface CanvasRulerProps {
  position: { x: number; y: number };
  scale: number;
  viewBoxOffset?: { x: number; y: number };
  width: number;
  height: number;
  rulerSize?: number;
  theme?: string;
}

const RULER_SIZE = 24;
const TICK_SIZES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

function getRulerColors(): {
  bgColor: string;
  textColor: string;
  tickColor: string;
  borderColor: string;
} {
  const style = getComputedStyle(document.body);
  const bg = style.getPropertyValue('--ruler-bg').trim() || '#1e1e1e';
  const text = style.getPropertyValue('--ruler-text').trim() || '#999';
  const tick = style.getPropertyValue('--ruler-tick').trim() || '#555';
  const border = style.getPropertyValue('--ruler-border').trim() || '#333';
  return { bgColor: bg, textColor: text, tickColor: tick, borderColor: border };
}

function getNiceStep(pixelsPerUnit: number): { step: number; minorStep: number } {
  const minPixelsBetweenTicks = 50;
  const minPixelsBetweenMinorTicks = 10;

  for (let i = 0; i < TICK_SIZES.length; i++) {
    const step = TICK_SIZES[i];
    if (step * pixelsPerUnit >= minPixelsBetweenTicks) {
      const minorStep = i > 0 ? TICK_SIZES[i - 1] : step / 5;
      return { step, minorStep };
    }
  }

  return { step: 10000, minorStep: 5000 };
}

const HorizontalRuler: React.FC<{
  viewport: ViewportManager;
  width: number;
  rulerSize: number;
  themeKey: string;
}> = React.memo(({ viewport, width, rulerSize, themeKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = rulerSize * dpr;
    ctx.scale(dpr, dpr);

    const { bgColor, textColor, tickColor, borderColor } = getRulerColors();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, rulerSize);

    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(0, rulerSize - 0.5);
    ctx.lineTo(width, rulerSize - 0.5);
    ctx.stroke();

    const pixelsPerUnit = viewport.scale;
    const { step, minorStep } = getNiceStep(pixelsPerUnit);

    const worldStart = viewport.toWorldPointWithOffset(0, 0, rulerSize, 0).x;
    const worldEnd = viewport.toWorldPointWithOffset(width, 0, rulerSize, 0).x;

    const firstTick = Math.floor(worldStart / minorStep) * minorStep;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '9px Menlo, Consolas, monospace';

    for (let worldPos = firstTick; worldPos <= worldEnd; worldPos += minorStep) {
      const screenX = viewport.toViewportPointWithOffset(worldPos, 0, rulerSize, 0).x;

      if (screenX < -1 || screenX > width + 1) continue;

      const isMajor = Math.abs(worldPos % step) < 0.001;
      const isMid = !isMajor && Math.abs(worldPos % (step / 2)) < 0.001;

      if (isMajor) {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, rulerSize - 4);
        ctx.stroke();

        if (worldPos !== 0) {
          ctx.fillStyle = textColor;
          ctx.fillText(String(Math.round(worldPos)), screenX, 2);
        }
      } else if (isMid) {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(screenX, rulerSize * 0.4);
        ctx.lineTo(screenX, rulerSize - 4);
        ctx.stroke();
      } else {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(screenX, rulerSize * 0.65);
        ctx.lineTo(screenX, rulerSize - 4);
        ctx.stroke();
      }
    }
  }, [viewport, width, rulerSize, themeKey]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: width,
        height: rulerSize,
        display: 'block',
        position: 'absolute',
        top: 0,
        left: rulerSize,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
});

HorizontalRuler.displayName = 'HorizontalRuler';

const VerticalRuler: React.FC<{
  viewport: ViewportManager;
  height: number;
  rulerSize: number;
  themeKey: string;
}> = React.memo(({ viewport, height, rulerSize, themeKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rulerSize * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const { bgColor, textColor, tickColor, borderColor } = getRulerColors();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rulerSize, height);

    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(rulerSize - 0.5, 0);
    ctx.lineTo(rulerSize - 0.5, height);
    ctx.stroke();

    const pixelsPerUnit = viewport.scale;
    const { step, minorStep } = getNiceStep(pixelsPerUnit);

    const worldStart = viewport.toWorldPointWithOffset(0, 0, 0, rulerSize).y;
    const worldEnd = viewport.toWorldPointWithOffset(0, height, 0, rulerSize).y;

    const firstTick = Math.floor(worldStart / minorStep) * minorStep;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '9px Menlo, Consolas, monospace';

    for (let worldPos = firstTick; worldPos <= worldEnd; worldPos += minorStep) {
      const screenY = viewport.toViewportPointWithOffset(0, worldPos, 0, rulerSize).y;

      if (screenY < -1 || screenY > height + 1) continue;

      const isMajor = Math.abs(worldPos % step) < 0.001;
      const isMid = !isMajor && Math.abs(worldPos % (step / 2)) < 0.001;

      if (isMajor) {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(rulerSize - 4, screenY);
        ctx.stroke();

        if (worldPos !== 0) {
          ctx.save();
          ctx.translate(7, screenY);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = textColor;
          ctx.fillText(String(Math.round(worldPos)), 0, 0);
          ctx.restore();
        }
      } else if (isMid) {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(rulerSize * 0.4, screenY);
        ctx.lineTo(rulerSize - 4, screenY);
        ctx.stroke();
      } else {
        ctx.strokeStyle = tickColor;
        ctx.beginPath();
        ctx.moveTo(rulerSize * 0.65, screenY);
        ctx.lineTo(rulerSize - 4, screenY);
        ctx.stroke();
      }
    }
  }, [viewport, height, rulerSize, themeKey]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: rulerSize,
        height: height,
        display: 'block',
        position: 'absolute',
        top: rulerSize,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
});

VerticalRuler.displayName = 'VerticalRuler';

const RulerCorner: React.FC<{
  rulerSize: number;
  onClick?: () => void;
  themeKey: string;
}> = React.memo(({ rulerSize, onClick, themeKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rulerSize * dpr;
    canvas.height = rulerSize * dpr;
    ctx.scale(dpr, dpr);

    const { bgColor, borderColor } = getRulerColors();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rulerSize, rulerSize);

    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(rulerSize - 0.5, 0);
    ctx.lineTo(rulerSize - 0.5, rulerSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, rulerSize - 0.5);
    ctx.lineTo(rulerSize, rulerSize - 0.5);
    ctx.stroke();
  }, [rulerSize, themeKey]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      style={{
        width: rulerSize,
        height: rulerSize,
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    />
  );
});

RulerCorner.displayName = 'RulerCorner';

const CanvasRuler: React.FC<CanvasRulerProps> = React.memo(({
  position,
  scale,
  viewBoxOffset = { x: 0, y: 0 },
  width,
  height,
  rulerSize = RULER_SIZE,
  theme,
}) => {
  const themeKey = theme || '';

  const viewport = useMemo(
    () => new ViewportManager(position, scale, viewBoxOffset),
    [position.x, position.y, scale, viewBoxOffset.x, viewBoxOffset.y]
  );

  return (
    <>
      <RulerCorner rulerSize={rulerSize} themeKey={themeKey} />
      <HorizontalRuler
        viewport={viewport}
        width={Math.max(0, width - rulerSize)}
        rulerSize={rulerSize}
        themeKey={themeKey}
      />
      <VerticalRuler
        viewport={viewport}
        height={Math.max(0, height - rulerSize)}
        rulerSize={rulerSize}
        themeKey={themeKey}
      />
    </>
  );
});

CanvasRuler.displayName = 'CanvasRuler';

export default CanvasRuler;
