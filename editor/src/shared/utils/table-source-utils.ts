import type { BaseElement, TableElement, TableRowElement } from '../../lib/parser/types';

export interface TableCell {
  text: string;
  colspan: number;
  rowspan: number;
  attrs: {
    bg?: string;
    c?: string;
    size?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'l' | 'c' | 'r';
    'vertical-align'?: 't' | 'm' | 'b';
  };
}

export interface TableRow {
  attrs: {
    bg?: string;
    c?: string;
    size?: string;
    bold?: boolean;
    italic?: boolean;
    'line-height'?: string;
    'letter-spacing'?: string;
  };
  cells: TableCell[];
}

export interface TableData {
  line: number;
  attrs: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    border?: number;
    cellspacing?: number;
    b?: string;
    bg?: string;
  };
  rows: TableRow[];
}

export function parseTableFromSource(
  tableElement: TableElement
): TableData | null {
  try {
    const table = tableElement;
    const rows: TableRow[] = [];

    table.children?.forEach((rowEl) => {
      const row = rowEl as TableRowElement;
      const cells: TableCell[] = [];
      const rowAttrs = row.attributes || {};

      row.children?.forEach((cellEl) => {
        const attrs = cellEl.attributes || {};
        cells.push({
          text: (cellEl as BaseElement & { text?: string }).text || '',
          colspan: parseInt(attrs.colspan) || 1,
          rowspan: parseInt(attrs.rowspan) || 1,
          attrs: {
            bg: attrs.bg,
            c: attrs.c,
            size: attrs.size,
            bold: !!attrs.bold,
            italic: !!attrs.italic,
            align: attrs.align as 'l' | 'c' | 'r' | undefined,
            'vertical-align': attrs['vertical-align'] as 't' | 'm' | 'b' | undefined,
          },
        });
      });

      rows.push({
        attrs: {
          bg: rowAttrs.bg,
          c: rowAttrs.c,
          size: rowAttrs.size,
          bold: !!rowAttrs.bold,
          italic: !!rowAttrs.italic,
          'line-height': rowAttrs['line-height'],
          'letter-spacing': rowAttrs['letter-spacing'],
        },
        cells,
      });
    });

    const tableAttrs = table.attributes || {};
    const coords = table.coordinates;
    const x = coords?.x?.type === 'absolute' ? coords.x.value : (parseInt(tableAttrs.x) || undefined);
    const y = coords?.y?.type === 'absolute' ? coords.y.value : (parseInt(tableAttrs.y) || undefined);
    return {
      line: table.location?.line || 0,
      attrs: {
        x,
        y,
        w: parseInt(tableAttrs.w) || 600,
        h: parseInt(tableAttrs.h) || undefined,
        border: parseInt(tableAttrs.border) || 1,
        cellspacing: parseInt(tableAttrs.cellspacing) || 0,
        b: tableAttrs.b || '#333333',
        bg: tableAttrs.bg,
      },
      rows,
    };
  } catch (e) {
    console.error('Failed to parse table:', e);
    return null;
  }
}

export function serializeTableToSource(
  tableData: TableData,
  originalContent: string
): string {
  const lines = originalContent.split('\n');
  const { line, attrs, rows } = tableData;

  const tableLineIdx = line - 1;
  if (tableLineIdx < 0 || tableLineIdx >= lines.length) {
    return originalContent;
  }

  const originalLine = lines[tableLineIdx];
  let coordStr = '';
  if (attrs.x !== undefined && attrs.y !== undefined) {
    coordStr = ` @(${attrs.x}, ${attrs.y})`;
  } else {
    const coordMatch = originalLine.match(/@\([^)]+\)/);
    coordStr = coordMatch ? ` ${coordMatch[0]}` : '';
  }

  const attrParts: string[] = [];
  if (attrs.w) attrParts.push(`w=${attrs.w}`);
  if (attrs.h) attrParts.push(`h=${attrs.h}`);
  if (attrs.border !== undefined && attrs.border !== 1) attrParts.push(`border=${attrs.border}`);
  if (attrs.cellspacing !== undefined && attrs.cellspacing !== 0) attrParts.push(`cellspacing=${attrs.cellspacing}`);
  if (attrs.b && attrs.b !== '#333333') attrParts.push(`b=${attrs.b}`);
  if (attrs.bg) attrParts.push(`bg=${attrs.bg}`);

  const attrsStr = attrParts.length > 0 ? ` ${attrParts.join(' ')}` : '';
  lines[tableLineIdx] = `##${coordStr}${attrsStr}`;

  const newTableLines: string[] = [];

  rows.forEach((row) => {
    const rowAttrParts: string[] = [];
    const rowAttrs = row.attrs;

    if (rowAttrs.bg) rowAttrParts.push(`bg=${rowAttrs.bg}`);
    if (rowAttrs.c) rowAttrParts.push(`c=${rowAttrs.c}`);
    if (rowAttrs.size) rowAttrParts.push(`size=${rowAttrs.size}`);
    if (rowAttrs.bold) rowAttrParts.push(`bold`);
    if (rowAttrs.italic) rowAttrParts.push(`italic`);
    if (rowAttrs['line-height']) rowAttrParts.push(`line-height=${rowAttrs['line-height']}`);
    if (rowAttrs['letter-spacing']) rowAttrParts.push(`letter-spacing=${rowAttrs['letter-spacing']}`);

    const rowAttrsStr = rowAttrParts.length > 0 ? ` ${rowAttrParts.join(' ')}` : '';
    newTableLines.push(`  #${rowAttrsStr}`);

    row.cells.forEach((cell) => {
      const cellAttrParts: string[] = [];

      if (cell.colspan > 1) cellAttrParts.push(`colspan=${cell.colspan}`);
      if (cell.rowspan > 1) cellAttrParts.push(`rowspan=${cell.rowspan}`);

      if (cell.attrs.bg && cell.attrs.bg !== rowAttrs.bg) cellAttrParts.push(`bg=${cell.attrs.bg}`);
      if (cell.attrs.c && cell.attrs.c !== rowAttrs.c) cellAttrParts.push(`c=${cell.attrs.c}`);
      if (cell.attrs.size && cell.attrs.size !== rowAttrs.size) cellAttrParts.push(`size=${cell.attrs.size}`);
      if (cell.attrs.bold && cell.attrs.bold !== rowAttrs.bold) cellAttrParts.push(`bold`);
      if (cell.attrs.italic && cell.attrs.italic !== rowAttrs.italic) cellAttrParts.push(`italic`);
      if (cell.attrs.align && cell.attrs.align !== 'l') cellAttrParts.push(`align=${cell.attrs.align}`);
      if (cell.attrs['vertical-align'] && cell.attrs['vertical-align'] !== 't') cellAttrParts.push(`vertical-align=${cell.attrs['vertical-align']}`);

      const text = cell.text || '';
      const quotedText = text.includes('\n') || text.includes('"""')
        ? `"""${text.replace(/"""/g, '\\"""')}"""`
        : `"${text.replace(/"/g, '\\"')}"`;

      const cellAttrsStr = cellAttrParts.length > 0 ? ` ${cellAttrParts.join(' ')}` : '';
      newTableLines.push(`    ${quotedText}${cellAttrsStr}`);
    });
  });

  let tableEndIdx = tableLineIdx + 1;
  while (tableEndIdx < lines.length) {
    const lineContent = lines[tableEndIdx];
    if (lineContent.trim() === '' || !lineContent.startsWith(' ')) break;
    tableEndIdx++;
  }

  lines.splice(tableLineIdx + 1, tableEndIdx - tableLineIdx - 1, ...newTableLines);

  return lines.join('\n');
}
