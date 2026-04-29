import { Document, Element } from '../parser';
import { createRenderContext, RenderContext, ElementBounds, formatRenderError, getElementLocationInfo, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, getOpacityAttribute, getShadowAttribute, createChildContext, calculateLineEnd, getStyleAttribute } from './context';

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
  // Use the same attribute processing as SVG renderer
  const r = getNumberAttribute(element.attributes, context.globalDefaults, 'r', 0);
  const isRounded = r > 0;
  
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#ffffff');
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);
  
  const text = (element as any).text || '';

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Apply shadow if present
      if (shadow) {
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = shadow.blur || 10;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      
      ctx.beginPath();
      
      if (isRounded) {
        ctx.roundRect(pos.x, pos.y, w, h, r);
      } else {
        ctx.rect(pos.x, pos.y, w, h);
      }
      
      ctx.fillStyle = bg;
      ctx.fill();
      
      if (s > 0) {
        ctx.strokeStyle = b;
        ctx.lineWidth = s;
        ctx.stroke();
      }
      
      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Render text if present
      if (text) {
        const lines = text.split('\n');
        const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
        const padding = 8;
        
        let textX: number;
        let textAlign: CanvasTextAlign;
        
        switch (align) {
          case 'start':
            textX = pos.x + padding;
            textAlign = 'left';
            break;
          case 'end':
            textX = pos.x + w - padding;
            textAlign = 'right';
            break;
          case 'middle':
          default:
            textX = pos.x + w / 2;
            textAlign = 'center';
            break;
        }
        
        const textY = pos.y + padding + fontSize;
        
        let fontStyle = '';
        if (bold) fontStyle += 'bold ';
        if (italic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = c;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';
        
        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, textX, textY + index * lineHeight);
        });
      }
      
      ctx.restore();
    }
  };
}

function renderCircle(element: Element, context: RenderContext): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = Math.max(1, getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100));
  const h = Math.max(1, getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40));
  const radius = Math.max(0.5, Math.min(w, h) / 2);
  const cx = pos.x + w / 2;
  const cy = pos.y + h / 2;
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', 'transparent');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);
  const text = (element as any).text || '';

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Apply shadow if present
      if (shadow) {
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = shadow.blur || 10;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      
      ctx.fillStyle = bg;
      ctx.fill();
      
      if (s > 0) {
        ctx.strokeStyle = b;
        ctx.lineWidth = s;
        ctx.stroke();
      }
      
      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Render text if present
      if (text) {
        let fontStyle = '';
        if (bold) fontStyle += 'bold ';
        if (italic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = c;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);
      }
      
      ctx.restore();
    }
  };
}

function renderText(element: Element, context: RenderContext): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  // TextElement has text as a direct property, not in attributes
  const text = (element as any).text || '';
  const lines = text.split('\n');
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 0);
  const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);

  // Calculate text width
  const calculateTextWidth = (text: string, fontSize: number): number => {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          context.font = `${fontSize}px Arial, sans-serif`;
          return context.measureText(text).width;
        }
      } catch (e) {
        // Canvas creation failed, fallback to estimation
      }
    }

    // Fallback estimation
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/)) {
        width += fontSize * 1.0;
      } else {
        width += fontSize * 0.6;
      }
    }
    return width;
  };

  const estimatedWidth = w || (lines.length > 0 ? Math.max(...lines.map((l: string) => calculateTextWidth(l, fontSize))) : 100);
  const estimatedHeight = lines.length > 0 ? lines.length * lineHeight : fontSize;
  
  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: estimatedWidth, height: estimatedHeight };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Apply shadow if present
      if (shadow) {
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = shadow.blur || 10;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      
      let fontStyle = '';
      if (bold) fontStyle += 'bold ';
      if (italic) fontStyle += 'italic ';
      ctx.font = `${fontStyle}${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = c;
      ctx.textBaseline = 'top';
      
      // Handle text alignment
      let textX = pos.x;
      if (align === 'middle') {
        textX = pos.x + (w || estimatedWidth) / 2;
        ctx.textAlign = 'center';
      } else if (align === 'end') {
        textX = pos.x + (w || estimatedWidth);
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }
      
      const textY = pos.y + fontSize;
      
      lines.forEach((line: string, index: number) => {
        ctx.fillText(line, textX, textY + index * lineHeight);
      });
      
      ctx.restore();
    }
  };
}

function renderLine(element: Element, context: RenderContext): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  const start = calculatePosition(context, (element as any).start);
  const end = calculateLineEnd(context, start, (element as any).end);
  
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#333333');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const style = getStyleAttribute(element.attributes);
  const textSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const textColor = getColorAttribute(element.attributes, context.globalDefaults, 'text-color', '#333333');
  const label = (element as any).label || '';

  const bounds: ElementBounds = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      
      ctx.strokeStyle = c;
      ctx.lineWidth = s;
      
      if (style.strokeDasharray) {
        ctx.setLineDash(style.strokeDasharray.split(',').map(Number));
      }
      
      ctx.stroke();
      
      // Draw label if present
      if (label) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const labelPadding = 4;
        const labelWidth = label.length * textSize * 0.6 + labelPadding * 2;
        const labelHeight = textSize + labelPadding * 2;
        
        // Draw label background
        ctx.fillStyle = 'white';
        ctx.fillRect(midX - labelWidth / 2, midY - labelHeight / 2, labelWidth, labelHeight);
        
        // Draw label text
        ctx.fillStyle = textColor;
        ctx.font = `${textSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      }
      
      ctx.restore();
    }
  };
}

function renderPlaceholder(element: Element, context: RenderContext): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 40);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#f0f0f0');
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#999999');
  const s = getNumberAttribute(element.attributes, context.globalDefaults, 's', 1);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#999999');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const text = (element as any).text || 'Placeholder';

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      
      // Draw background
      ctx.fillStyle = bg;
      ctx.fillRect(pos.x, pos.y, w, h);
      
      // Draw border
      ctx.strokeStyle = b;
      ctx.lineWidth = s;
      ctx.strokeRect(pos.x, pos.y, w, h);
      
      // Draw diagonal lines
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + w, pos.y + h);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(pos.x + w, pos.y);
      ctx.lineTo(pos.x, pos.y + h);
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = c;
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, pos.x + w / 2, pos.y + h / 2);
      
      ctx.restore();
    }
  };
}

function renderImage(element: Element, context: RenderContext, imageUrlResolver?: (relativePath: string) => string): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 80);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#f0f0f0');
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#999999');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);
  
  const url = (element as any).url || '';
  const resolvedUrl = imageUrlResolver ? imageUrlResolver(url) : url;
  const hasValidUrl = !!resolvedUrl && resolvedUrl.length > 0;

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: w, height: h };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Apply shadow if present
      if (shadow) {
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = shadow.blur || 10;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      
      if (!hasValidUrl) {
        // Draw background rect
        ctx.fillStyle = bg;
        ctx.fillRect(pos.x, pos.y, w, h);
        
        // Reset shadow for icon
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw icon
        const iconSize = Math.min(w, h) * 0.3;
        const iconX = pos.x + w / 2;
        const iconY = pos.y + h / 2 - fontSize;
        
        ctx.save();
        ctx.translate(iconX - iconSize / 2, iconY - iconSize / 2);
        
        // Draw icon rect
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, iconSize, iconSize, 4);
        ctx.stroke();
        
        // Draw icon path (mountain)
        ctx.beginPath();
        ctx.moveTo(iconSize * 0.2, iconSize * 0.3);
        ctx.lineTo(iconSize * 0.5, iconSize * 0.6);
        ctx.lineTo(iconSize * 0.8, iconSize * 0.3);
        ctx.stroke();
        
        // Draw icon circle (sun)
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(iconSize * 0.35, iconSize * 0.4, iconSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw text
        ctx.fillStyle = c;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Image', pos.x + w / 2, pos.y + h / 2 + fontSize);
      } else {
        // Draw image
        const img = new Image();
        img.src = resolvedUrl;
        
        // For now, draw a placeholder since image loading is async
        ctx.fillStyle = bg;
        ctx.fillRect(pos.x, pos.y, w, h);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y, w, h);
        
        ctx.fillStyle = c;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Image', pos.x + w / 2, pos.y + h / 2);
      }
      
      ctx.restore();
    }
  };
}

function renderTable(element: Element, context: RenderContext, renderChild: (child: Element, ctx: RenderContext) => CanvasRenderResult): CanvasRenderResult {
  // Use the same attribute processing as SVG renderer
  let pos: { x: number; y: number };
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  if (element.type === 'table') {
    return renderTableElement(element as any, context, pos, renderChild);
  } else {
    return renderTableRow(element as any, context, pos, renderChild);
  }
}

interface CellData {
  row: number;
  col: number;
  colspan: number;
  rowspan: number;
  cell: any;
}

function renderTableElement(
  element: any,
  context: RenderContext,
  pos: { x: number; y: number },
  renderChild: (child: Element, ctx: RenderContext) => CanvasRenderResult
): CanvasRenderResult {
  const border = getNumberAttribute(element.attributes, context.globalDefaults, 'border', 1);
  const cellspacing = getNumberAttribute(element.attributes, context.globalDefaults, 'cellspacing', 0);
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);

  const rows = element.children || [];
  
  const tableWidth = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 600);
  const declaredTableHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 0);
  const defaultRowHeight = 40;

  const { maxColCount: estimatedMaxColCount, maxRowSpan: estimatedMaxRowSpan } = estimateTableDimensions(rows);

  const tempGrid: boolean[][] = [];
  for (let r = 0; r < estimatedMaxRowSpan + 10; r++) {
    tempGrid[r] = [];
    for (let c = 0; c < estimatedMaxColCount + 10; c++) {
      tempGrid[r][c] = false;
    }
  }

  let actualMaxColCount = 0;
  let actualMaxRowCount = 0;

  rows.forEach((row: any, rowIndex: number) => {
    const cells = (row as any).children || [];
    let colIndex = 0;

    while (colIndex < tempGrid[rowIndex].length && tempGrid[rowIndex][colIndex]) {
      colIndex++;
    }

    (cells as any[]).forEach((cell: any) => {
      const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
      const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;

      const actualColspan = Math.min(colspan, tempGrid[rowIndex].length - colIndex);
      const actualRowspan = Math.min(rowspan, tempGrid.length - rowIndex);

      for (let r = rowIndex; r < rowIndex + actualRowspan; r++) {
        for (let c = colIndex; c < colIndex + actualColspan; c++) {
          if (r < tempGrid.length && c < tempGrid[r].length) {
            tempGrid[r][c] = true;
          }
        }
      }

      actualMaxColCount = Math.max(actualMaxColCount, colIndex + actualColspan);
      actualMaxRowCount = Math.max(actualMaxRowCount, rowIndex + actualRowspan);

      colIndex += actualColspan;
      while (colIndex < tempGrid[rowIndex].length && tempGrid[rowIndex][colIndex]) {
        colIndex++;
      }
    });
  });

  const finalNumCols = Math.max(actualMaxColCount, estimatedMaxColCount);
  const finalNumRows = Math.max(actualMaxRowCount, rows.length + estimatedMaxRowSpan - 1);

  const colWidth = (tableWidth - (finalNumCols - 1) * cellspacing) / finalNumCols;
  const tableHeight = declaredTableHeight > 0 ? declaredTableHeight : finalNumRows * defaultRowHeight + (finalNumRows - 1) * cellspacing;
  const rowHeight = (tableHeight - (finalNumRows - 1) * cellspacing) / finalNumRows;

  const { cellData } = buildCellGrid(rows, finalNumRows, finalNumCols);

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: tableWidth, height: tableHeight };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Apply shadow if present
      if (shadow) {
        ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = shadow.blur || 10;
        ctx.shadowOffsetX = shadow.x || 0;
        ctx.shadowOffsetY = shadow.y || 0;
      }
      
      // Draw table background
      ctx.fillStyle = 'transparent';
      ctx.fillRect(pos.x, pos.y, tableWidth, tableHeight);
      
      // Reset shadow for cells
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw table border
      if (border > 0) {
        ctx.strokeStyle = b;
        ctx.lineWidth = border;
        ctx.strokeRect(pos.x, pos.y, tableWidth, tableHeight);
      }
      
      // Render cells
      cellData.forEach(data => {
        const cellX = pos.x + data.col * (colWidth + cellspacing);
        const cellY = pos.y + data.row * (rowHeight + cellspacing);
        const cellWidth = data.colspan * colWidth + (data.colspan - 1) * cellspacing;
        const cellHeight = data.rowspan * rowHeight + (data.rowspan - 1) * cellspacing;

        const rowAttributes = (rows[data.row] as any).attributes || {};

        const cellBg = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'bg', '#ffffff');
        const cellBorder = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'b', '#333333');
        const cellStrokeWidth = getNumberAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 's', 1);

        // Draw cell background
        ctx.fillStyle = cellBg;
        ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
        
        // Draw cell border
        if (cellStrokeWidth > 0) {
          ctx.strokeStyle = cellBorder;
          ctx.lineWidth = cellStrokeWidth;
          ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
        }

        // Render cell content
        const cellContext = createChildContext(context, cellX, cellY);
        const modifiedCell = { ...data.cell };
        modifiedCell.attributes = { ...modifiedCell.attributes };
        modifiedCell.attributes['w'] = cellWidth.toString();
        modifiedCell.attributes['h'] = cellHeight.toString();
        modifiedCell.attributes['bg'] = cellBg;
        modifiedCell.attributes['b'] = 'transparent';
        modifiedCell.attributes['s'] = '0';
        
        // Set alignment for text elements
        const cellColor = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'c', '#000000');
        const cellFontSize = getNumberAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'size', 12);
        const cellBold = getBooleanAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'bold');
        const cellItalic = getBooleanAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'italic');
        const cellAlign = getAlignAttribute({ ...rowAttributes, ...data.cell.attributes }, 'start');
        
        modifiedCell.attributes['c'] = cellColor;
        modifiedCell.attributes['size'] = cellFontSize.toString();
        if (cellBold) modifiedCell.attributes['bold'] = 'true';
        if (cellItalic) modifiedCell.attributes['italic'] = 'true';
        modifiedCell.attributes['align'] = cellAlign === 'start' ? 'l' : cellAlign === 'middle' ? 'c' : 'r';

        const result = renderChild(modifiedCell as any, cellContext);
        result.render(ctx);
      });
      
      ctx.restore();
    }
  };
}

function renderTableRow(
  element: any,
  context: RenderContext,
  pos: { x: number; y: number },
  renderChild: (child: Element, ctx: RenderContext) => CanvasRenderResult
): CanvasRenderResult {
  // Table row is just a container, render its children
  const children = element.children || [];
  let totalWidth = 0;
  let maxHeight = 0;

  const childResults = children.map((child: any) => {
    const result = renderChild(child, context);
    totalWidth += result.bounds.width;
    maxHeight = Math.max(maxHeight, result.bounds.height);
    return result;
  });

  const bounds: ElementBounds = { x: pos.x, y: pos.y, width: totalWidth, height: maxHeight };

  return {
    bounds,
    render: (ctx: CanvasRenderingContext2D) => {
      childResults.forEach((result: CanvasRenderResult) => {
        result.render(ctx);
      });
    }
  };
}

function estimateTableDimensions(rows: any[]): { maxColCount: number; maxRowSpan: number } {
  let maxColCount = 0;
  let maxRowSpan = 0;

  rows.forEach((row, rowIndex) => {
    const cells = row.children || [];
    cells.forEach((cell: any) => {
      const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
      const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;
      maxColCount = Math.max(maxColCount, colspan);
      maxRowSpan = Math.max(maxRowSpan, rowspan);
    });
  });

  return { maxColCount, maxRowSpan };
}

function buildCellGrid(
  rows: any[],
  finalNumRows: number,
  finalNumCols: number
): { cellData: CellData[]; grid: boolean[][] } {
  const grid: boolean[][] = [];
  for (let r = 0; r < finalNumRows; r++) {
    grid[r] = [];
    for (let c = 0; c < finalNumCols; c++) {
      grid[r][c] = false;
    }
  }

  const cellData: CellData[] = [];

  rows.forEach((row, rowIndex) => {
    const cells = row.children || [];
    let colIndex = 0;

    while (colIndex < finalNumCols && grid[rowIndex][colIndex]) {
      colIndex++;
    }

    cells.forEach((cell: any) => {
      const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
      const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;

      const actualColspan = Math.min(colspan, finalNumCols - colIndex);
      const actualRowspan = Math.min(rowspan, finalNumRows - rowIndex);

      cellData.push({
        row: rowIndex,
        col: colIndex,
        colspan: actualColspan,
        rowspan: actualRowspan,
        cell
      });

      for (let r = rowIndex; r < rowIndex + actualRowspan; r++) {
        for (let c = colIndex; c < colIndex + actualColspan; c++) {
          grid[r][c] = true;
        }
      }

      colIndex += actualColspan;
      while (colIndex < finalNumCols && grid[rowIndex][colIndex]) {
        colIndex++;
      }
    });
  });

  return { cellData, grid };
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
  skipCanvasSize?: boolean; // Skip setting canvas width/height, let caller handle it
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

      // Only set canvas size if not skipping (let caller handle it for zoom)
      if (!options?.skipCanvasSize) {
        canvas.width = viewBoxWidth;
        canvas.height = viewBoxHeight;
      }

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
          
          // Draw note number badge on card
          ctx.shadowBlur = 0;
          const cardBadgeX = cardX + 12;
          const cardBadgeY = cardY + 12;
          const cardBadgeRadius = 8;
          
          // Add shadow to badge like SVG
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = '#70B603';
          ctx.beginPath();
          ctx.arc(cardBadgeX, cardBadgeY, cardBadgeRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Reset shadow for text
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.number.toString(), cardBadgeX, cardBadgeY + 3);
          
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
          
          // Draw note badge on element (water drop shape like SVG)
          const badgeX = note.bounds.x + note.bounds.width - 8;
          const badgeY = note.bounds.y - 8;
          const badgeRadius = 10;
          
          // Add shadow to badge like SVG
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
          
          ctx.fillStyle = '#70B603';
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Water drop shape
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
          ctx.fill();
          ctx.stroke();
          
          // Reset shadow for text
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
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
