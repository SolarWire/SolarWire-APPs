import { Document, Element as SolarWireElement } from '../parser-src';
import { createCanvasRenderContext, CanvasRenderContext, ElementBounds } from './context';
import { formatRenderError, getElementLocationInfo } from '../renderer-svg-src/context';
import { 
  renderRectangle, 
  renderCircle, 
  renderText, 
  renderLine, 
  renderImage, 
  renderPlaceholder, 
  renderTable 
} from './elements';
import { renderSelectionHighlight, renderResizeHandles } from './interaction';

interface NoteInfo {
  number: number;
  note: string;
  bounds: ElementBounds;
  elementId: string; // 添加elementId字段
}

export interface CanvasRenderOptions {
  selectedElementIds?: string[];
  primaryColor?: string;
  scale?: number;
  sourceInput?: string;
  showNotes?: boolean;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NoteBadgeInfo {
  elementId: string;
  x: number;
  y: number;
  radius: number;
}

export interface CanvasRenderResult {
  viewBox: ViewBox;
  elementBoundsMap: Map<string, ElementBounds>;
  noteBadges: NoteBadgeInfo[];
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let currentLine = '';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [text];
  
  ctx.font = `${fontSize}px Arial, sans-serif`;
  
  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function renderElement(
  element: SolarWireElement,
  context: CanvasRenderContext,
  elementId: string
): ElementBounds {
  switch (element.type) {
    case 'rectangle':
    case 'rounded-rectangle':
      return renderRectangle(element, context, elementId);
    case 'circle':
      return renderCircle(element, context, elementId);
    case 'text':
      return renderText(element, context, elementId);
    case 'line':
      return renderLine(element, context, elementId);
    case 'image':
      return renderImage(element, context, elementId);
    case 'placeholder':
      return renderPlaceholder(element, context, elementId);
    case 'table':
      return renderTable(element, context, elementId);
    default:
      const elem = element as any;
      throw new Error(formatRenderError({
        title: `Unknown element type: "${elem.type}"`,
        location: getElementLocationInfo(elem),
        reason: 'The renderer does not recognize this element type.',
        solution: 'Check if the element type is correct and supported.'
      }, context.sourceInput, elem.location));
  }
}

function renderNoteBadge(
  ctx: CanvasRenderingContext2D,
  noteNumber: number,
  bounds: ElementBounds,
  primaryColor: string
): void {
  const badgeX = bounds.x + bounds.width - 8;
  const badgeY = bounds.y - 8;
  const badgeRadius = 10;
  
  ctx.save();
  
  // Draw shadow
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fill();
  
  // Draw badge shape (water drop shape)
  ctx.beginPath();
  ctx.moveTo(badgeX, badgeY - badgeRadius);
  ctx.bezierCurveTo(
    badgeX + badgeRadius, badgeY - badgeRadius,
    badgeX + badgeRadius, badgeY + badgeRadius * 0.5,
    badgeX, badgeY + badgeRadius * 1.5
  );
  ctx.bezierCurveTo(
    badgeX - badgeRadius, badgeY + badgeRadius * 0.5,
    badgeX - badgeRadius, badgeY - badgeRadius,
    badgeX, badgeY - badgeRadius
  );
  ctx.closePath();
  ctx.fillStyle = '#70B603';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(noteNumber.toString(), badgeX, badgeY + 2);
  
  ctx.restore();
}

function renderNoteCards(
  ctx: CanvasRenderingContext2D,
  notes: NoteInfo[],
  baseY: number,
  cardWidth: number,
  primaryColor: string
): void {
  const cardMargin = 10;
  const cardsPerRow = 2;
  const lineHeight = 22;
  const cardPadding = 12;
  const margin = 20;
  
  const cardHeights = notes.map(note => {
    const lines = wrapText(note.note, cardWidth - 28 - 12, 12);
    const contentHeight = lines.length * lineHeight;
    return Math.max(60, contentHeight + cardPadding * 2);
  });
  
  const rowMaxHeights: number[] = [];
  notes.forEach((_, index) => {
    const row = Math.floor(index / cardsPerRow);
    if (!rowMaxHeights[row]) rowMaxHeights[row] = 0;
    rowMaxHeights[row] = Math.max(rowMaxHeights[row], cardHeights[index]);
  });
  
  const rowStartYs: number[] = [0];
  for (let row = 1; row < rowMaxHeights.length; row++) {
    rowStartYs[row] = rowStartYs[row - 1] + rowMaxHeights[row - 1] + cardMargin;
  }
  
  notes.forEach((noteInfo, index) => {
    const col = index % cardsPerRow;
    const row = Math.floor(index / cardsPerRow);
    const cardX = margin + col * (cardWidth + cardMargin);
    const cardY = baseY + cardMargin + rowStartYs[row];
    const cardHeight = cardHeights[index];
    
    ctx.save();
    
    // Draw card
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
    ctx.fill();
    ctx.stroke();
    
    // Draw badge with shadow
    const badgeX = cardX + 12;
    const badgeY = cardY + 12;
    const badgeRadius = 8;
    
    // Shadow
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fill();
    
    // Badge
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#70B603';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Badge text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(noteInfo.number.toString(), badgeX, badgeY + 3);
    
    // Note text
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'hanging';
    
    const textX = cardX + 28;
    const textY = cardY + cardPadding;
    const lines = wrapText(noteInfo.note, cardWidth - 28 - 12, 12);
    
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, textY + lineIndex * lineHeight);
    });
    
    ctx.restore();
  });
}

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  ast: Document,
  options: CanvasRenderOptions = {}
): CanvasRenderResult {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { viewBox: { x: 0, y: 0, width: 400, height: 300 }, elementBoundsMap: new Map(), noteBadges: [] };
  }
  
  const dpr = window.devicePixelRatio || 1;
  // 为了实现无限画布，我们设置一个固定的画布大小
  // 这个大小足够大，能够容纳大多数场景
  const canvasSize = 100000;
  
  if (canvas.width !== canvasSize * dpr || canvas.height !== canvasSize * dpr) {
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);
  }
  
  // 清空整个画布
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  
  const context = createCanvasRenderContext(ctx, ast.declarations, {
    selectedElementIds: options.selectedElementIds || [],
    primaryColor: options.primaryColor || '#FCA506',
    scale: options.scale || 1,
    sourceInput: options.sourceInput
  });
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  const elementResults: Array<{ bounds: ElementBounds; id: string; note?: string }> = [];
  const notes: NoteInfo[] = [];
  const noteBadges: NoteBadgeInfo[] = [];
  let noteNumber = 1;
  
  ast.elements.forEach((element, index) => {
    const id = (element as any).id || element.location?.line?.toString() || (index + 1).toString();
    try {
      const bounds = renderElement(element, context, id);
      const note = (element as any).attributes?.note;
      
      elementResults.push({ bounds, id, note });
      
      if (options.showNotes && note) {
        notes.push({
          number: noteNumber++,
          note,
          bounds,
          elementId: id // 保存elementId
        });
      }
      
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    } catch (error) {
      throw error;
    }
  });
  
  // 计算元素的边界，用于定位 note cards
  elementResults.forEach(({ bounds }) => {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  // 如果没有元素，设置默认边界
  if (isFinite(minX)) {
    minX -= 20;
    minY -= 20;
    maxX += 20;
    maxY += 20;
  } else {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }
  
  const margin = 20;
  const minViewBoxWidth = 400;
  const viewBoxWidth = Math.max(minViewBoxWidth, maxX - minX + margin * 2);
  
  ctx.save();
  
  const selectedIds = options.selectedElementIds || [];
  
  elementResults.forEach(({ bounds, id }) => {
    if (selectedIds.includes(id)) {
      renderSelectionHighlight(ctx, bounds, context.primaryColor);
      renderResizeHandles(ctx, bounds, context.primaryColor);
    }
  });
  
  if (options.showNotes && notes.length > 0) {
    notes.forEach(noteInfo => {
      renderNoteBadge(ctx, noteInfo.number, noteInfo.bounds, context.primaryColor);
      const badgeX = noteInfo.bounds.x + noteInfo.bounds.width - 8;
      const badgeY = noteInfo.bounds.y - 8;
      const badgeRadius = 10;
      noteBadges.push({
        elementId: noteInfo.elementId, // 直接使用保存的elementId
        x: badgeX,
        y: badgeY,
        radius: badgeRadius
      });
    });
    
    const extraNoteSpacing = 20;
    const notesY = maxY + extraNoteSpacing;
    
    // 计算 note cards 的位置和大小
    const cardMargin = 10;
    const cardsPerRow = 2;
    const lineHeight = 22;
    const cardPadding = 12;
    const cardWidth = (viewBoxWidth - margin * 2 - 10) / 2;
    
    renderNoteCards(ctx, notes, notesY, cardWidth, context.primaryColor);
  }
  
  ctx.restore();
  
  // 返回空的 viewBox，因为我们不再使用它
  return { 
    viewBox: { x: 0, y: 0, width: 0, height: 0 }, 
    elementBoundsMap: context.elementBoundsMap,
    noteBadges
  };
}

export function getElementAtPosition(
  x: number,
  y: number,
  elementBoundsMap: Map<string, ElementBounds>
): string | null {
  for (const [id, bounds] of elementBoundsMap) {
    if (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    ) {
      return id;
    }
  }
  return null;
}

export function getElementsInRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  elementBoundsMap: Map<string, ElementBounds>
): string[] {
  const x1 = Math.min(startX, endX);
  const y1 = Math.min(startY, endY);
  const x2 = Math.max(startX, endX);
  const y2 = Math.max(startY, endY);
  
  const result: string[] = [];
  
  for (const [id, bounds] of elementBoundsMap) {
    if (
      bounds.x < x2 &&
      bounds.x + bounds.width > x1 &&
      bounds.y < y2 &&
      bounds.y + bounds.height > y1
    ) {
      result.push(id);
    }
  }
  
  return result;
}
