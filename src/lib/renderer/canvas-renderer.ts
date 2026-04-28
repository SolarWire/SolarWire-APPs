import { Document, Element } from '../parser';
import { createRenderContext, RenderContext, ElementBounds, formatRenderError, getElementLocationInfo } from './context';

interface CanvasRenderResult {
  bounds: ElementBounds;
  render: (ctx: CanvasRenderingContext2D) => void;
}

interface NoteInfo {
  number: number;
  note: string;
  bounds: ElementBounds;
  elementIndex: number;
}

interface InternalCanvasRenderOptions {
  disableNotes?: boolean;
  sourceInput?: string;
  notes?: NoteInfo[];
  noteNumberRef?: { current: number };
  elementIndex?: number;
  imageUrlResolver?: (relativePath: string) => string;
}

function wrapText(text: string, maxWidth: number, fontSize: number = 12): string[] {
  const lines: string[] = [];
  const avgCharWidth = fontSize * 0.65;
  const cjkCharWidth = fontSize * 1.0;
  const isCJK = (char: string) => /[\u4e00-\u9fa5\u3400-\u4dbf\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af]/.test(char);
  
  const getCharWidth = (char: string): number => {
    return isCJK(char) ? cjkCharWidth : avgCharWidth;
  };
  
  text.split('\n').forEach(paragraph => {
    if (paragraph.trim() === '') {
      lines.push('');
      return;
    }
    
    let currentLine = '';
    let currentWidth = 0;
    let i = 0;
    
    while (i < paragraph.length) {
      const char = paragraph[i];
      
      if (char === ' ' || char === '\t') {
        currentLine += char;
        currentWidth += avgCharWidth;
        i++;
        continue;
      }
      
      let token = '';
      let tokenWidth = 0;
      
      if (isCJK(char)) {
        token = char;
        tokenWidth = cjkCharWidth;
        i++;
      } else {
        let j = i;
        while (j < paragraph.length && !isCJK(paragraph[j]) && paragraph[j] !== ' ' && paragraph[j] !== '\t') {
          token += paragraph[j];
          tokenWidth += avgCharWidth;
          j++;
        }
        i = j;
      }
      
      if (currentWidth + tokenWidth <= maxWidth || currentLine === '') {
        currentLine += token;
        currentWidth += tokenWidth;
      } else {
        if (tokenWidth > maxWidth) {
          if (currentLine.trim() !== '') {
            lines.push(currentLine.trim());
          }
          
          let remainingToken = token;
          while (remainingToken.length > 0) {
            let part = '';
            let partWidth = 0;
            let k = 0;
            
            while (k < remainingToken.length) {
              const charWidth = getCharWidth(remainingToken[k]);
              if (partWidth + charWidth > maxWidth && part.length > 0) {
                break;
              }
              part += remainingToken[k];
              partWidth += charWidth;
              k++;
            }
            
            if (k >= remainingToken.length) {
              currentLine = part;
              currentWidth = partWidth;
              remainingToken = '';
            } else {
              lines.push(part);
              remainingToken = remainingToken.substring(k);
            }
          }
        } else {
          lines.push(currentLine.trim());
          currentLine = token;
          currentWidth = tokenWidth;
        }
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
  });
  
  return lines;
}

function renderRectangle(element: Element, context: RenderContext): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 0;
  const y = Number(attrs.y) || 0;
  const w = Number(attrs.w) || 100;
  const h = Number(attrs.h) || 100;
  const fill = attrs.fill || 'none';
  const stroke = attrs.stroke || 'none';
  const strokeWidth = Number(attrs['stroke-width']) || 0;
  const radius = Number(attrs.radius) || 0;

  const bounds: ElementBounds = { x, y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.beginPath();
      
      if (radius > 0) {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
      
      if (fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      
      if (stroke !== 'none' && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
      
      ctx.restore();
    }
  };
}

function renderCircle(element: Element, context: RenderContext): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 50;
  const y = Number(attrs.y) || 50;
  const r = Number(attrs.r) || 25;
  const fill = attrs.fill || 'none';
  const stroke = attrs.stroke || 'none';
  const strokeWidth = Number(attrs['stroke-width']) || 0;

  const bounds: ElementBounds = { x: x - r, y: y - r, width: r * 2, height: r * 2 };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      
      if (fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      
      if (stroke !== 'none' && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
      
      ctx.restore();
    }
  };
}

function renderText(element: Element, context: RenderContext): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 0;
  const y = Number(attrs.y) || 0;
  const text = attrs.text || '';
  const fontSize = Number(attrs['font-size']) || 12;
  const fill = attrs.fill || '#000';
  const maxWidth = Number(attrs['max-width']) || Infinity;

  const lines = wrapText(text, maxWidth, fontSize);
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  
  const bounds: ElementBounds = { x, y, width: maxWidth === Infinity ? text.length * fontSize * 0.65 : maxWidth, height: totalHeight };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = fill;
      ctx.textBaseline = 'top';
      
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
      });
      
      ctx.restore();
    }
  };
}

function renderLine(element: Element, context: RenderContext): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x1 = Number(attrs.x1) || 0;
  const y1 = Number(attrs.y1) || 0;
  const x2 = Number(attrs.x2) || 100;
  const y2 = Number(attrs.y2) || 100;
  const stroke = attrs.stroke || '#000';
  const strokeWidth = Number(attrs['stroke-width']) || 1;
  const dashArray = attrs['stroke-dasharray'];

  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);
  const bounds: ElementBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      
      if (dashArray) {
        ctx.setLineDash(dashArray.split(',').map(Number));
      }
      
      ctx.stroke();
      ctx.restore();
    }
  };
}

function renderPlaceholder(element: Element, context: RenderContext): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 0;
  const y = Number(attrs.y) || 0;
  const w = Number(attrs.w) || 100;
  const h = Number(attrs.h) || 100;

  const bounds: ElementBounds = { x, y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  };
}

function renderImage(element: Element, context: RenderContext, imageUrlResolver?: (relativePath: string) => string): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 0;
  const y = Number(attrs.y) || 0;
  const w = Number(attrs.w) || 100;
  const h = Number(attrs.h) || 100;
  const src = attrs.src || '';
  const resolvedSrc = imageUrlResolver ? imageUrlResolver(src) : src;

  const bounds: ElementBounds = { x, y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      const img = new Image();
      img.src = resolvedSrc;
      // Note: In a real implementation, you'd need to handle async loading
      // For now, we'll draw a placeholder
      ctx.save();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Image', x + w / 2, y + h / 2);
      ctx.restore();
    }
  };
}

function renderTable(element: Element, context: RenderContext, renderChild: (child: Element, ctx: RenderContext) => CanvasRenderResult): CanvasRenderResult {
  const attrs = element.attributes || {};
  const x = Number(attrs.x) || 0;
  const y = Number(attrs.y) || 0;
  const rows = Number(attrs.rows) || 1;
  const cols = Number(attrs.cols) || 1;
  const cellWidth = Number(attrs['cell-width']) || 80;
  const cellHeight = Number(attrs['cell-height']) || 40;

  const totalWidth = cols * cellWidth;
  const totalHeight = rows * cellHeight;
  const bounds: ElementBounds = { x, y, width: totalWidth, height: totalHeight };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      
      // Draw table cells
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellX = x + col * cellWidth;
          const cellY = y + row * cellHeight;
          ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
        }
      }
      
      ctx.restore();
    }
  };
}

function renderCanvasElement(element: Element, context: RenderContext, options?: InternalCanvasRenderOptions): CanvasRenderResult {
  switch (element.type) {
    case 'rectangle':
      return renderRectangle(element, context);
    case 'circle':
      return renderCircle(element, context);
    case 'text':
      return renderText(element, context);
    case 'placeholder':
      return renderPlaceholder(element, context);
    case 'image':
      return renderImage(element, context, options?.imageUrlResolver);
    case 'line':
      return renderLine(element, context);
    case 'table':
    case 'table-row':
      return renderTable(element, context, (child, ctx) => renderCanvasElement(child, ctx, options));
    default: {
      const elem = element as any;
      throw new Error(formatRenderError({
        title: `Unknown element type: "${elem.type}"`,
        location: getElementLocationInfo(elem),
        reason: 'The canvas renderer does not recognize this element type.',
        solution: 'Check if the element type is correct and supported.'
      }, context.sourceInput, elem.location));
    }
  }
}

export interface CanvasRenderOptions {
  disableNotes?: boolean;
  sourceInput?: string;
  selectedElementIds?: string[];
  primaryColor?: string;
  imageUrlResolver?: (relativePath: string) => string;
}

export interface ElementInfo {
  id: string;
  bounds: ElementBounds;
  type: string;
  line?: number;
}

export interface CanvasRenderResultWithMeta {
  render: (canvas: HTMLCanvasElement) => void;
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elements: ElementInfo[];
}

export function renderToCanvas(ast: Document, options?: CanvasRenderOptions): CanvasRenderResultWithMeta {
  const context = createRenderContext(ast.declarations, options?.sourceInput);
  const renderResults: Array<{ result: CanvasRenderResult; id: string; element: Element }> = [];
  const elementsInfo: ElementInfo[] = [];
  const notes: NoteInfo[] = [];
  const noteNumberRef = { current: 1 };
  const disableNotes = options?.disableNotes ?? false;
  const selectedElementIds = options?.selectedElementIds || [];
  const primaryColor = options?.primaryColor || '#FCA506';
  const imageUrlResolver = options?.imageUrlResolver;
  
  const renderOptions: InternalCanvasRenderOptions = {
    disableNotes,
    sourceInput: options?.sourceInput,
    notes,
    noteNumberRef,
    imageUrlResolver
  };
  
  ast.elements.forEach((element, index) => {
    const result = renderCanvasElement(element, context, { ...renderOptions, elementIndex: index });
    const id = (element as any).id || element.location?.line?.toString() || (index + 1).toString();
    
    // Store element info for hit testing
    elementsInfo.push({
      id,
      bounds: result.bounds,
      type: element.type,
      line: element.location?.line
    });
    
    // Handle notes
    if (notes && noteNumberRef && !disableNotes && element.attributes && element.attributes.note) {
      notes.push({
        number: noteNumberRef.current,
        note: element.attributes.note,
        bounds: result.bounds,
        elementIndex: index
      });
      noteNumberRef.current++;
    }
    
    renderResults.push({ result, id, element });
  });

  // Calculate viewBox
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  
  renderResults.forEach(({ result }) => {
    minX = Math.min(minX, result.bounds.x);
    minY = Math.min(minY, result.bounds.y);
    maxX = Math.max(maxX, result.bounds.x + result.bounds.width);
    maxY = Math.max(maxY, result.bounds.y + result.bounds.height);
  });

  const margin = 20;
  const minViewBoxWidth = 400;
  const viewBoxX = minX - margin;
  const viewBoxY = minY - margin;
  const viewBoxWidth = Math.max(minViewBoxWidth, maxX - minX + margin * 2);
  
  let notesAreaHeight = 0;
  const extraNoteSpacing = 20;
  if (!disableNotes && notes.length > 0) {
    const cardMargin = 10;
    const cardsPerRow = 2;
    const lineHeight = 22;
    const cardPadding = 12;
    const cardWidth = (viewBoxWidth - margin * 2 - 10) / 2;
    
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
    
    const totalRowHeight = rowMaxHeights.reduce((sum, height) => sum + height, 0);
    const rows = rowMaxHeights.length;
    notesAreaHeight = totalRowHeight + (rows + 1) * cardMargin + extraNoteSpacing;
  }
  
  const viewBoxHeight = maxY - minY + margin * 2 + notesAreaHeight;

  return {
    render: (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewBoxWidth;
      canvas.height = viewBoxHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-viewBoxX, -viewBoxY);

      // Render all elements
      renderResults.forEach(({ result, id, element }) => {
        const lineNum = element.location?.line?.toString();
        const isSelected = selectedElementIds.includes(id) || (lineNum && selectedElementIds.includes(lineNum));
        
        ctx.save();
        
        if (isSelected) {
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = 10;
        }
        
        result.render(ctx);
        
        ctx.restore();
      });

      // Render notes
      if (!disableNotes && notes.length > 0) {
        const notesY = maxY + margin + extraNoteSpacing;
        const cardWidth = (viewBoxWidth - margin * 2 - 10) / 2;
        const cardMargin = 10;
        const cardsPerRow = 2;
        const lineHeight = 22;
        const cardPadding = 12;
        
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
        
        notes.forEach((note, index) => {
          const col = index % cardsPerRow;
          const row = Math.floor(index / cardsPerRow);
          const cardX = viewBoxX + margin + col * (cardWidth + cardMargin);
          const cardY = notesY + cardMargin + rowStartYs[row];
          const cardHeight = cardHeights[index];
          
          // Find element ID
          const elementIndex = note.elementIndex;
          let elementId = '';
          if (elementIndex !== undefined) {
            const element = ast.elements[elementIndex];
            elementId = (element as any).id || element.location?.line?.toString() || (elementIndex + 1).toString();
          }
          
          const isSelected = elementId && selectedElementIds.includes(elementId);
          
          // Draw note card
          ctx.save();
          ctx.fillStyle = '#f8f9fa';
          ctx.strokeStyle = isSelected ? primaryColor : '#dee2e6';
          ctx.lineWidth = isSelected ? 2 : 1;
          if (isSelected) {
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = 8;
          }
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
          ctx.fill();
          ctx.stroke();
          
          // Draw note number badge
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#70B603';
          ctx.beginPath();
          ctx.arc(cardX + 12, cardY + 12, 8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.number.toString(), cardX + 12, cardY + 12);
          
          // Draw note text
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          const textX = cardX + 28;
          const textY = cardY + cardPadding;
          const lines = wrapText(note.note, cardWidth - 28 - 12, 12);
          
          lines.forEach((line, lineIndex) => {
            ctx.fillText(line, textX, textY + lineIndex * lineHeight);
          });
          
          // Draw note badge on element
          const badgeX = note.bounds.x + note.bounds.width - 8;
          const badgeY = note.bounds.y - 8;
          ctx.fillStyle = '#70B603';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.number.toString(), badgeX, badgeY + 2);
          
          ctx.restore();
        });
      }

      ctx.restore();
    },
    viewBox: {
      x: viewBoxX,
      y: viewBoxY,
      width: viewBoxWidth,
      height: viewBoxHeight
    },
    elements: elementsInfo
  };
}
