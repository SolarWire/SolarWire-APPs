import { CircleElement, TextElement, PlaceholderElement, ImageElement, TableElement, TableRowElement, Element } from '../../parser';
import { RenderContext, AbsolutePosition, ElementBounds, calculatePosition, getNumberAttribute, getColorAttribute, getBooleanAttribute, getAlignAttribute, updateLastElementBounds, createChildContext, escapeHtml, getOpacityAttribute, formatRenderError, getElementLocationInfo, getLetterSpacingAttribute, getShadowAttribute, generateShadowFilter, getVerticalAlignAttribute, getTextDecorationAttribute, getPaddingValues } from '../context';
import { RenderResult } from './rectangle';

function calculateTextWidth(text: string, fontSize: number): number {
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${fontSize}px Arial, sans-serif`;
        return ctx.measureText(text).width;
      }
    } catch (_) {}
  }
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
}

export type TableRowWithChildren = TableRowElement & {
  children?: Element[];
};

/**
 * 类型守卫：检查元素是否有 children 属性
 */
export function hasChildren(element: Element): element is Element & { children: Element[] } {
  return 'children' in element && Array.isArray((element as any).children);
}

export function renderCircle(element: CircleElement, context: RenderContext): RenderResult {
  let pos: AbsolutePosition;
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
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);
  const verticalAlign = getVerticalAlignAttribute(element.attributes, 'middle');
  const textDecoration = getTextDecorationAttribute(element.attributes);
  const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
  const letterSpacing = getLetterSpacingAttribute(element.attributes, context.globalDefaults, 0);
  const align = getAlignAttribute(element.attributes, 'middle');
  const padding = getPaddingValues(element.attributes, context.globalDefaults, 4);
  
  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  const shadowFilterAttr = shadow ? ` filter="url(#shadow-${element.location?.line || 'circle'})"` : '';
  
  let svgParts: string[] = [];
  svgParts.push(`<g>`);
  svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${bg}" stroke="${b}" stroke-width="${s}"${opacityAttr}${shadowFilterAttr}/>`);
  
  if (element.text) {
    const lines = element.text.split('\n');
    const totalTextHeight = lines.length * lineHeight;
    const textAreaW = w * 0.7;
    const textAreaH = h * 0.7;

    let fontStyle = '';
    if (bold) fontStyle += 'font-weight="bold" ';
    if (italic) fontStyle += 'font-style="italic" ';
    if (letterSpacing !== 0) fontStyle += `letter-spacing="${letterSpacing}" `;
    if (textDecoration !== 'none') fontStyle += `text-decoration="${textDecoration}" `;

    let textX: number;
    let textAnchor: string;
    if (align === 'start') {
      textX = cx - textAreaW / 2 + padding.left;
      textAnchor = 'start';
    } else if (align === 'end') {
      textX = cx + textAreaW / 2 - padding.right;
      textAnchor = 'end';
    } else {
      textX = cx;
      textAnchor = 'middle';
    }

    let textY: number;
    let dominantBaseline: string;
    if (verticalAlign === 'top') {
      textY = cy - textAreaH / 2 + padding.top + fontSize;
      dominantBaseline = 'auto';
    } else if (verticalAlign === 'bottom') {
      textY = cy + textAreaH / 2 - padding.bottom - totalTextHeight + fontSize;
      dominantBaseline = 'auto';
    } else {
      if (lines.length > 1) {
        textY = cy - (totalTextHeight + padding.top + padding.bottom) / 2 + padding.top + fontSize;
        dominantBaseline = 'auto';
      } else {
        textY = cy + (padding.top - padding.bottom) / 2;
        dominantBaseline = 'middle';
      }
    }

    if (lines.length === 1) {
      svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" fill="${c}" font-size="${fontSize}" ${fontStyle}>${escapeHtml(lines[0])}</text>`);
    } else {
      svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" fill="${c}" font-size="${fontSize}" ${fontStyle}>`);
      lines.forEach((line, i) => {
        if (i === 0) {
          svgParts.push(escapeHtml(line));
        } else {
          svgParts.push(`<tspan x="${textX}" dy="${lineHeight}">${escapeHtml(line)}</tspan>`);
        }
      });
      svgParts.push('</text>');
    }
  }
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  const shadowFilter = shadow ? generateShadowFilter(shadow, element.location?.line?.toString() || 'circle') : undefined;
  
  return {
    svg: svgParts.join(''),
    bounds,
    shadowFilter,
  };
}

export function renderText(element: TextElement, context: RenderContext): RenderResult {
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }

  const lines = element.text.split('\n');
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 0);
  const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#000000');
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const align = getAlignAttribute(element.attributes, 'start');
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);

  // 字间距属性
  const letterSpacing = getLetterSpacingAttribute(element.attributes, context.globalDefaults);
  const textDecoration = getTextDecorationAttribute(element.attributes);

  let fontStyle = '';
  if (bold) fontStyle += 'font-weight="bold" ';
  if (italic) fontStyle += 'font-style="italic" ';
  if (letterSpacing !== 0) fontStyle += `letter-spacing="${letterSpacing}" `;
  if (textDecoration !== 'none') fontStyle += `text-decoration="${textDecoration}" `;

  const textAnchor = align;
  let textX = pos.x;
  if (textAnchor === 'middle') {
    textX = pos.x + (w || 100) / 2;
  } else if (textAnchor === 'end') {
    textX = pos.x + (w || 100);
  }

  const textY = pos.y + fontSize;

  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  const shadowFilterAttr = shadow ? ` filter="url(#shadow-${element.location?.line || 'text'})"` : '';

  let svgParts: string[] = [];
  svgParts.push(`<g>`);
  svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" fill="${c}" font-size="${fontSize}" ${fontStyle}${opacityAttr}${shadowFilterAttr}>`);

  lines.forEach((line, i) => {
    if (i === 0) {
      svgParts.push(escapeHtml(line));
    } else {
      svgParts.push(`<tspan x="${textX}" dy="${lineHeight}">${escapeHtml(line)}</tspan>`);
    }
  });

  svgParts.push('</text>');

  const estimatedWidth = w || (lines.length > 0 ? Math.max(...lines.map(l => calculateTextWidth(l, fontSize))) : 100);
  const estimatedHeight = lines.length > 0 ? lines.length * lineHeight : fontSize;
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: estimatedWidth,
    height: estimatedHeight,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  const shadowFilter = shadow ? generateShadowFilter(shadow, element.location?.line?.toString() || 'text') : undefined;
  
  return {
    svg: svgParts.join(''),
    bounds,
    shadowFilter,
  };
}

export function renderPlaceholder(element: PlaceholderElement, context: RenderContext): RenderResult {
  let pos: AbsolutePosition;
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
  const note = element.attributes['note'];
  const verticalAlign = getVerticalAlignAttribute(element.attributes, 'middle');
  const align = getAlignAttribute(element.attributes, 'middle');
  const lineHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'line-height', 22);
  const letterSpacing = getLetterSpacingAttribute(element.attributes, context.globalDefaults, 0);
  const textDecoration = getTextDecorationAttribute(element.attributes);
  const padding = getPaddingValues(element.attributes, context.globalDefaults, 8);
  const bold = getBooleanAttribute(element.attributes, context.globalDefaults, 'bold');
  const italic = getBooleanAttribute(element.attributes, context.globalDefaults, 'italic');
  
  const svgParts: string[] = [];
  svgParts.push(`<g>`);

  // 边框往内渲染：调整rect的位置和尺寸
  const strokeOffset = s / 2;
  const rectX = pos.x + strokeOffset;
  const rectY = pos.y + strokeOffset;
  const rectW = Math.max(0, w - s);
  const rectH = Math.max(0, h - s);
  svgParts.push(`<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${bg}" stroke="${b}" stroke-width="${s}"/>`);

  // 对角线从中心点开始，向四个角延伸
  const centerX = pos.x + w / 2;
  const centerY = pos.y + h / 2;
  svgParts.push(`<line x1="${centerX}" y1="${centerY}" x2="${pos.x}" y2="${pos.y}" stroke="${b}" stroke-width="${s}"/>`);
  svgParts.push(`<line x1="${centerX}" y1="${centerY}" x2="${pos.x + w}" y2="${pos.y}" stroke="${b}" stroke-width="${s}"/>`);
  svgParts.push(`<line x1="${centerX}" y1="${centerY}" x2="${pos.x}" y2="${pos.y + h}" stroke="${b}" stroke-width="${s}"/>`);
  svgParts.push(`<line x1="${centerX}" y1="${centerY}" x2="${pos.x + w}" y2="${pos.y + h}" stroke="${b}" stroke-width="${s}"/>`);
  
  const text = element.text || 'Placeholder';
  const lines = text.split('\n');
  const totalTextHeight = lines.length * lineHeight;

  let fontStyle = '';
  if (bold) fontStyle += 'font-weight="bold" ';
  if (italic) fontStyle += 'font-style="italic" ';
  if (letterSpacing !== 0) fontStyle += `letter-spacing="${letterSpacing}" `;
  if (textDecoration !== 'none') fontStyle += `text-decoration="${textDecoration}" `;

  let textX: number;
  let textAnchor: string;
  if (align === 'start') {
    textX = pos.x + padding.left;
    textAnchor = 'start';
  } else if (align === 'end') {
    textX = pos.x + w - padding.right;
    textAnchor = 'end';
  } else {
    textX = pos.x + w / 2;
    textAnchor = 'middle';
  }

  let textY: number;
  let dominantBaseline: string;
  if (verticalAlign === 'top') {
    textY = pos.y + padding.top + fontSize;
    dominantBaseline = 'auto';
  } else if (verticalAlign === 'bottom') {
    textY = pos.y + h - padding.bottom - totalTextHeight + fontSize;
    dominantBaseline = 'auto';
  } else {
    if (lines.length > 1) {
      textY = pos.y + padding.top + (h - padding.top - padding.bottom - totalTextHeight) / 2 + fontSize;
      dominantBaseline = 'auto';
    } else {
      textY = pos.y + h / 2;
      dominantBaseline = 'middle';
    }
  }

  if (lines.length === 1) {
    svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" fill="${c}" font-size="${fontSize}" ${fontStyle}>${escapeHtml(lines[0])}</text>`);
  } else {
    svgParts.push(`<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" fill="${c}" font-size="${fontSize}" ${fontStyle}>`);
    lines.forEach((line, i) => {
      if (i === 0) {
        svgParts.push(escapeHtml(line));
      } else {
        svgParts.push(`<tspan x="${textX}" dy="${lineHeight}">${escapeHtml(line)}</tspan>`);
      }
    });
    svgParts.push('</text>');
  }
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  return {
    svg: svgParts.join(''),
    bounds,
  };
}

export function renderImage(
  element: ImageElement, 
  context: RenderContext, 
  imageUrlResolver?: (relativePath: string) => string
): RenderResult {
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  const w = getNumberAttribute(element.attributes, context.globalDefaults, 'w', 100);
  const h = getNumberAttribute(element.attributes, context.globalDefaults, 'h', 80);
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', '#f0f0f0');
  const c = getColorAttribute(element.attributes, context.globalDefaults, 'c', '#999999');
  const borderColor = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#cccccc');
  const borderSize = getNumberAttribute(element.attributes, context.globalDefaults, 's', 0);
  const fontSize = getNumberAttribute(element.attributes, context.globalDefaults, 'text-size', getNumberAttribute(element.attributes, context.globalDefaults, 'size', 12));
  const note = element.attributes['note'];
  const opacity = getOpacityAttribute(element.attributes);
  const shadow = getShadowAttribute(element.attributes, context.globalDefaults);

  const opacityAttr = opacity !== 1 ? ` opacity="${opacity}"` : '';
  const shadowFilterAttr = shadow ? ` filter="url(#shadow-${element.location?.line || 'image'})"` : '';
  const borderAttr = borderSize > 0 ? ` stroke="${borderColor}" stroke-width="${borderSize}"` : '';

  const resolvedUrl = imageUrlResolver ? imageUrlResolver(element.url) : element.url;
  const hasValidUrl = !!resolvedUrl && resolvedUrl.length > 0;

  const svgParts: string[] = [];

  svgParts.push(`<g>`);

  if (!hasValidUrl) {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" fill="${bg}"${opacityAttr}${shadowFilterAttr}${borderAttr}/>`);

    const iconSize = Math.min(w, h) * 0.3;
    const iconX = pos.x + w / 2;
    const iconY = pos.y + h / 2 - fontSize;

    svgParts.push(`<g transform="translate(${iconX - iconSize / 2}, ${iconY - iconSize / 2})">`);
    svgParts.push(`<rect x="0" y="0" width="${iconSize}" height="${iconSize}" fill="none" stroke="${c}" stroke-width="2" rx="4"/>`);
    svgParts.push(`<path d="M${iconSize * 0.2} ${iconSize * 0.3} L${iconSize * 0.5} ${iconSize * 0.6} L${iconSize * 0.8} ${iconSize * 0.3}" fill="none" stroke="${c}" stroke-width="2"/>`);
    svgParts.push(`<circle cx="${iconSize * 0.35}" cy="${iconSize * 0.4}" r="${iconSize * 0.08}" fill="${c}"/>`);
    svgParts.push(`</g>`);

    svgParts.push(`<text x="${pos.x + w / 2}" y="${pos.y + h / 2 + fontSize}" text-anchor="middle" fill="${c}" font-size="${fontSize}"${opacityAttr}>Image</text>`);
  } else {
    svgParts.push(`<image x="${pos.x}" y="${pos.y}" width="${w}" height="${h}" href="${escapeHtml(resolvedUrl)}"${opacityAttr}${shadowFilterAttr}${borderAttr}/>`);
  }
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: w,
    height: h,
  };
  
  updateLastElementBounds(context, bounds);
  
  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }
  
  svgParts.push(`</g>`);
  
  const shadowFilter = shadow ? generateShadowFilter(shadow, element.location?.line?.toString() || 'image') : undefined;
  
  return {
    svg: svgParts.join(''),
    bounds,
    shadowFilter,
  };
}

export function renderTable(
  element: TableElement | TableRowElement, 
  context: RenderContext,
  renderChild: (child: Element, childContext: RenderContext) => RenderResult
): RenderResult {
  let pos: AbsolutePosition;
  if (element.coordinates) {
    pos = calculatePosition(context, element.coordinates);
  } else {
    pos = { x: context.offsetX, y: context.offsetY };
  }
  
  if (element.type === 'table') {
    return renderTableElement(element as TableElement, context, pos, renderChild);
  } else {
    return renderTableRow(element as TableRowElement, context, pos, renderChild);
  }
}

interface CellData {
  row: number;
  col: number;
  colspan: number;
  rowspan: number;
  cell: any;
}

function validateTableStructure(
  element: TableElement,
  rows: TableRowElement[],
  context: RenderContext
): void {
  rows.forEach((row, rowIndex) => {
    if (row.type !== 'table-row') {
      throw new Error(formatRenderError({
        title: 'Invalid table structure',
        expected: 'table-row element (#)',
        found: `"${row.type}"${row.type === 'text' ? ` ("${(row as any).text || ''}")` : ''}`,
        location: `${getElementLocationInfo(element)}, Row ${rowIndex + 1}`,
        reason: 'Table elements can only contain table-row (#) elements as direct children.',
        solution: 'Ensure all elements inside the table (##) are properly indented under table-row (#) elements.'
      }, context.sourceInput, element.location));
    }
  });

  rows.forEach((row, rowIndex) => {
    const rowWithChildren = row as TableRowWithChildren;
    const rowNote = rowWithChildren.attributes?.['note'];
    if (rowNote) {
      throw new Error(formatRenderError({
        title: 'Table row does not support "note" attribute',
        expected: 'No note attribute',
        found: `note="${rowNote}"`,
        location: `${getElementLocationInfo(element)}, Row ${rowIndex + 1}`,
        reason: 'Table row elements (#) do not support the note attribute.',
        solution: 'Remove the note attribute from the table row or move it to the table element (##).'
      }, context.sourceInput, element.location));
    }
  });

  rows.forEach((row, rowIndex) => {
    const rowWithChildren = row as TableRowWithChildren;
    const cells = rowWithChildren.children || [];
    cells.forEach((cell, cellIndex) => {
      if ('w' in cell.attributes || 'h' in cell.attributes) {
        const attrName = 'w' in cell.attributes ? 'w' : 'h';
        const attrValue = cell.attributes[attrName];
        throw new Error(formatRenderError({
          title: `Table cell cannot specify "${attrName}" attribute`,
          expected: `No "${attrName}" attribute on cell element`,
          found: `${attrName}=${attrValue}`,
          location: `${getElementLocationInfo(element)}, Row ${rowIndex + 1}, Cell ${cellIndex + 1}`,
          reason: 'Table cell dimensions are automatically calculated based on table width and row height.',
          solution: `Remove the "${attrName}" attribute from this cell.`
        }, context.sourceInput, cell.location));
      }
      if (cell.type === 'line') {
        throw new Error(formatRenderError({
          title: 'Table cell cannot be a line element',
          expected: 'text, rectangle, or other supported element',
          found: 'line element',
          location: `${getElementLocationInfo(element)}, Row ${rowIndex + 1}, Cell ${cellIndex + 1}`,
          reason: 'Lines are not supported inside table cells.',
          solution: 'Use text ("..."), rectangle ([...]), rounded rectangle ((...)), circle (((...))), or placeholder ([?...]) elements instead.'
        }, context.sourceInput, cell.location));
      }
    });
  });
}

function estimateTableDimensions(rows: TableRowElement[]): { maxColCount: number; maxRowSpan: number } {
  let maxColCount = 0;
  let maxRowSpan = 0;

  rows.forEach((row, rowIndex) => {
    const cells = (row as any).children || [];
    cells.forEach((cell: any) => {
      const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
      const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;
      maxColCount = Math.max(maxColCount, colspan);
      maxRowSpan = Math.max(maxRowSpan, rowIndex + rowspan);
    });
  });

  return {
    maxColCount: Math.max(maxColCount, 10),
    maxRowSpan
  };
}

function buildCellGrid(
  rows: TableRowElement[],
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
    const cells = (row as any).children || [];
    let colIndex = 0;

    while (colIndex < finalNumCols && grid[rowIndex][colIndex]) {
      colIndex++;
    }

    (cells as any[]).forEach((cell: any) => {
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

function renderTableCells(
  cellData: CellData[],
  rows: TableRowElement[],
  pos: AbsolutePosition,
  colWidth: number,
  rowHeight: number,
  context: RenderContext,
  renderChild: (child: Element, childContext: RenderContext) => RenderResult,
  svgParts: string[]
): void {
  cellData.forEach(data => {
    const cellX = pos.x + data.col * colWidth;
    const cellY = pos.y + data.row * rowHeight;
    const cellWidth = colWidth * data.colspan;
    const cellHeight = data.rowspan * rowHeight;

    const rowAttributes = (rows[data.row] as any).attributes || {};

    const cellBg = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'bg', '#ffffff');
    const cellBorder = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'b', '#333333');
    const cellStrokeWidth = getNumberAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 's', 1);
    const cellColor = getColorAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'c', '#000000');
    const cellFontSize = getNumberAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'size', 12);
    const cellBold = getBooleanAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'bold');
    const cellItalic = getBooleanAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'italic');
    const cellAlign = getAlignAttribute({ ...rowAttributes, ...data.cell.attributes }, 'start');
    const cellLineHeight = getNumberAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 'line-height', 22);
    const cellLetterSpacing = getLetterSpacingAttribute({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 0);
    const cellVerticalAlign = getVerticalAlignAttribute({ ...rowAttributes, ...data.cell.attributes }, 'top');
    const cellTextDecoration = getTextDecorationAttribute({ ...rowAttributes, ...data.cell.attributes });
    const cellPadding = getPaddingValues({ ...rowAttributes, ...data.cell.attributes }, context.globalDefaults, 8);

    svgParts.push(`<rect x="${cellX}" y="${cellY}" width="${cellWidth}" height="${cellHeight}" fill="${cellBg}" stroke="${cellBorder}" stroke-width="${cellStrokeWidth}"/>`);

    const cellContext = createChildContext(context, cellX, cellY);
    const modifiedCell = { ...data.cell };
    modifiedCell.attributes = { ...modifiedCell.attributes };
    modifiedCell.attributes['w'] = cellWidth.toString();
    modifiedCell.attributes['h'] = cellHeight.toString();
    modifiedCell.attributes['bg'] = cellBg;
    modifiedCell.attributes['b'] = 'transparent';
    modifiedCell.attributes['s'] = '0';
    modifiedCell.attributes['c'] = cellColor;
    modifiedCell.attributes['size'] = cellFontSize.toString();
    if (cellBold) modifiedCell.attributes['bold'] = 'true';
    if (cellItalic) modifiedCell.attributes['italic'] = 'true';
    modifiedCell.attributes['align'] = cellAlign === 'start' ? 'l' : cellAlign === 'middle' ? 'c' : 'r';
    modifiedCell.attributes['line-height'] = cellLineHeight.toString();
    modifiedCell.attributes['letter-spacing'] = cellLetterSpacing.toString();
    modifiedCell.attributes['vertical-align'] = cellVerticalAlign === 'top' ? 't' : cellVerticalAlign === 'middle' ? 'm' : 'b';
    modifiedCell.attributes['text-decoration'] = cellTextDecoration;
    modifiedCell.attributes['padding-top'] = cellPadding.top.toString();
    modifiedCell.attributes['padding-right'] = cellPadding.right.toString();
    modifiedCell.attributes['padding-bottom'] = cellPadding.bottom.toString();
    modifiedCell.attributes['padding-left'] = cellPadding.left.toString();

    const result = renderChild(modifiedCell as any, cellContext);
    svgParts.push(result.svg);
  });
}

function renderTableElement(
  element: TableElement,
  context: RenderContext,
  pos: AbsolutePosition,
  renderChild: (child: Element, childContext: RenderContext) => RenderResult
): RenderResult {
  const border = getNumberAttribute(element.attributes, context.globalDefaults, 'border', 1);
  const cellspacing = getNumberAttribute(element.attributes, context.globalDefaults, 'cellspacing', 0);
  const b = getColorAttribute(element.attributes, context.globalDefaults, 'b', '#333333');
  const note = element.attributes['note'];

  const svgParts: string[] = [];

  svgParts.push(`<g>`);
  svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="0" height="0" fill="transparent" stroke="none" pointer-events="fill"/>`);

  const rows = element.children || [];
  validateTableStructure(element, rows, context);

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

  rows.forEach((row, rowIndex) => {
    const cells = (row as any).children || [];
    let colIndex = 0;

    while (colIndex < tempGrid[rowIndex].length && tempGrid[rowIndex][colIndex]) {
      colIndex++;
    }

    (cells as any[]).forEach((cell: any) => {
      const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
      const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;

      actualMaxColCount = Math.max(actualMaxColCount, colIndex + colspan);
      actualMaxRowCount = Math.max(actualMaxRowCount, rowIndex + rowspan);

      for (let r = rowIndex; r < rowIndex + rowspan; r++) {
        for (let c = colIndex; c < colIndex + colspan; c++) {
          tempGrid[r][c] = true;
        }
      }

      colIndex += colspan;
      while (colIndex < tempGrid[rowIndex].length && tempGrid[rowIndex][colIndex]) {
        colIndex++;
      }
    });
  });

  const finalNumRows = Math.max(rows.length, actualMaxRowCount);
  const finalNumCols = actualMaxColCount;

  let tableHeight: number;
  let rowHeight: number;

  if (declaredTableHeight > 0) {
    tableHeight = declaredTableHeight;
    rowHeight = tableHeight / finalNumRows;
  } else {
    tableHeight = finalNumRows * defaultRowHeight + (finalNumRows - 1) * cellspacing;
    rowHeight = defaultRowHeight;
  }

  const { cellData } = buildCellGrid(rows, finalNumRows, finalNumCols);
  const colWidth = finalNumCols > 0 ? tableWidth / finalNumCols : 100;

  renderTableCells(cellData, rows, pos, colWidth, rowHeight, context, renderChild, svgParts);

  if (border > 0) {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${tableWidth}" height="${tableHeight}" fill="none" stroke="${b}" stroke-width="${border}"/>`);
  }

  const transparentRectIndex = svgParts.findIndex(part => part.includes('fill="transparent"'));
  if (transparentRectIndex !== -1) {
    svgParts[transparentRectIndex] = `<rect x="${pos.x}" y="${pos.y}" width="${tableWidth}" height="${tableHeight}" fill="transparent" stroke="none" pointer-events="all"/>`;
  }

  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: tableWidth,
    height: tableHeight,
  };

  updateLastElementBounds(context, bounds);

  if (note) {
    svgParts[0] = svgParts[0].replace(/<g(\s[^>]*)?>/, `<g$1 data-note="${escapeHtml(note)}">`);
  }

  return {
    svg: svgParts.join(''),
    bounds,
  };
}

function renderTableRow(
  element: TableRowElement,
  context: RenderContext,
  pos: AbsolutePosition,
  renderChild: (child: Element, childContext: RenderContext) => RenderResult
): RenderResult {
  const bg = getColorAttribute(element.attributes, context.globalDefaults, 'bg', 'transparent');
  const note = element.attributes['note'];
  
  if (note) {
    throw new Error(formatRenderError({
      title: 'Table row does not support "note" attribute',
      expected: 'No "note" attribute on row element',
      found: `note="${note}"`,
      location: getElementLocationInfo(element),
      reason: 'Notes are only supported on individual cell elements.',
      solution: 'Remove the "note" attribute from the row element. Add notes to individual cells if needed.'
    }, context.sourceInput, element.location));
  }
  
  const rowAttributes = element.attributes;
  const rowDefaults: Record<string, string> = {};
  
  const inheritableAttrs = ['c', 'bg', 'b', 's', 'size', 'bold', 'italic', 'align', 'line-height', 'letter-spacing', 'vertical-align', 'text-decoration', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
  inheritableAttrs.forEach(attr => {
    if (rowAttributes[attr] !== undefined) {
      rowDefaults[attr] = rowAttributes[attr];
    }
  });
  
  const svgParts: string[] = [];
  let currentX = pos.x;
  let maxHeight = 0;
  const cellResults: RenderResult[] = [];
  
  const cells = element.children || [];
  cells.forEach(cell => {
    const mergedAttributes = { ...rowDefaults, ...cell.attributes };
    const modifiedCell = { ...cell, attributes: mergedAttributes };
    
    const cellContext = createChildContext(context, currentX, pos.y);
    const result = renderChild(modifiedCell as any, cellContext);
    cellResults.push(result);
    maxHeight = Math.max(maxHeight, result.bounds.height);
    
    let cellWidth = result.bounds.width;
    
    const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
    if (colspan > 1) {
      cellWidth *= colspan;
    }
    
    currentX += cellWidth;
  });
  
  const rowWidth = currentX - pos.x;
  const rowHeight = getNumberAttribute(element.attributes, context.globalDefaults, 'h', maxHeight || 40);
  
  if (bg !== 'transparent') {
    svgParts.push(`<rect x="${pos.x}" y="${pos.y}" width="${rowWidth}" height="${rowHeight}" fill="${bg}"/>`);
  }
  
  let renderX = pos.x;
  cellResults.forEach((result, index) => {
    const cell = cells[index];
    let cellWidth = result.bounds.width;
    let cellHeight = result.bounds.height;
    
    const colspan = cell.attributes['colspan'] ? parseInt(cell.attributes['colspan']) : 1;
    const rowspan = cell.attributes['rowspan'] ? parseInt(cell.attributes['rowspan']) : 1;
    
    if (colspan > 1) {
      cellWidth *= colspan;
    }
    
    if (rowspan > 1) {
      cellHeight *= rowspan;
    }
    
    if (colspan > 1 || rowspan > 1) {
      const mergedAttrs = { ...rowDefaults, ...cell.attributes };
      const cellBg = getColorAttribute(mergedAttrs, context.globalDefaults, 'bg', '#ffffff');
      const cellBorder = getColorAttribute(mergedAttrs, context.globalDefaults, 'b', '#333333');
      const cellStrokeWidth = getNumberAttribute(mergedAttrs, context.globalDefaults, 's', 1);
      
      svgParts.push(`<rect x="${renderX}" y="${pos.y}" width="${cellWidth}" height="${cellHeight}" fill="${cellBg}" stroke="${cellBorder}" stroke-width="${cellStrokeWidth}"/>`);
    }
    
    svgParts.push(result.svg);
    
    renderX += cellWidth;
  });
  
  const bounds: ElementBounds = {
    x: pos.x,
    y: pos.y,
    width: rowWidth,
    height: rowHeight,
  };
  
  updateLastElementBounds(context, bounds);
  
  return {
    svg: svgParts.join(''),
    bounds,
  };
}
