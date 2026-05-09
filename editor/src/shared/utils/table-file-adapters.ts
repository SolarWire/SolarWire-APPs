import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Sheet, Cell, CellWithRowAndCol } from '@fortune-sheet/core';

const TABLE_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);

export function isTableFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return TABLE_EXTENSIONS.has(ext);
}

export function getTableFileExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

function csvToSheetData(csvText: string, sheetName: string = 'Sheet1'): Sheet {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: false,
  });

  const rows = result.data;
  const maxRow = rows.length;
  const maxCol = Math.max(...rows.map((r) => r.length), 1);

  const celldata: CellWithRowAndCol[] = [];

  for (let r = 0; r < maxRow; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const rawValue = rows[r][c];
      if (rawValue === '' || rawValue == null) continue;

      const cell: Cell = {};
      const numValue = Number(rawValue);
      if (!isNaN(numValue) && rawValue.trim() !== '') {
        cell.v = numValue;
        cell.m = rawValue;
        cell.ct = { fa: 'General', t: 'n' };
      } else {
        cell.v = rawValue;
        cell.m = rawValue;
        cell.ct = { fa: 'General', t: 'g' };
      }

      celldata.push({ r, c, v: cell });
    }
  }

  return {
    name: sheetName,
    celldata,
    row: Math.max(maxRow, 84),
    column: Math.max(maxCol, 60),
    defaultRowHeight: 25,
    defaultColWidth: 100,
  };
}

function sheetDataToCsv(sheet: Sheet): string {
  const data = sheet.data;
  if (!data) return '';

  const rows: string[][] = [];
  for (let r = 0; r < data.length; r++) {
    const row: string[] = [];
    if (data[r]) {
      for (let c = 0; c < data[r].length; c++) {
        const cell = data[r][c];
        row.push(cell?.v != null ? String(cell.v) : '');
      }
    }
    rows.push(row);
  }

  return Papa.unparse(rows);
}

function workbookToSheets(buffer: ArrayBuffer): Sheet[] {
  const wb = XLSX.read(buffer, { type: 'array', cellStyles: true });
  const sheets: Sheet[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) {
      sheets.push({
        name: sheetName,
        celldata: [],
        row: 84,
        column: 60,
        defaultRowHeight: 25,
        defaultColWidth: 100,
      });
      continue;
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    const celldata: CellWithRowAndCol[] = [];

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const wsCell = ws[cellRef];
        if (!wsCell) continue;

        const cell: Cell = {};

        if (wsCell.v !== undefined && wsCell.v !== null) {
          if (typeof wsCell.v === 'number') {
            cell.v = wsCell.v;
            cell.m = wsCell.w || String(wsCell.v);
            cell.ct = { fa: wsCell.z || 'General', t: 'n' };
          } else if (typeof wsCell.v === 'boolean') {
            cell.v = wsCell.v;
            cell.m = wsCell.v ? 'TRUE' : 'FALSE';
            cell.ct = { fa: 'General', t: 'b' };
          } else {
            cell.v = String(wsCell.v);
            cell.m = wsCell.w || String(wsCell.v);
            cell.ct = { fa: 'General', t: 'g' };
          }
        }

        if (wsCell.f) {
          cell.f = wsCell.f;
        }

        const style = wsCell.s;
        if (style) {
          if (style.font) {
            if (style.font.bold) cell.bl = 1;
            if (style.font.italic) cell.it = 1;
            if (style.font.sz) cell.fs = style.font.sz;
            if (style.font.color?.rgb) {
              const rgb = style.font.color.rgb;
              cell.fc = rgb.startsWith('#') ? rgb : `#${rgb}`;
            }
            if (style.font.name) cell.ff = style.font.name;
          }
          if (style.fill?.fgColor?.rgb) {
            const rgb = style.fill.fgColor.rgb;
            cell.bg = rgb.startsWith('#') ? rgb : `#${rgb}`;
          }
          if (style.alignment) {
            if (style.alignment.horizontal === 'center') cell.ht = 0;
            else if (style.alignment.horizontal === 'right') cell.ht = 2;
            else if (style.alignment.horizontal === 'left') cell.ht = 1;

            if (style.alignment.vertical === 'center') cell.vt = 0;
            else if (style.alignment.vertical === 'top') cell.vt = 1;
            else if (style.alignment.vertical === 'bottom') cell.vt = 2;
          }
        }

        celldata.push({ r, c, v: cell });
      }
    }

    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    const colWidths: Record<string, number> = {};
    if (ws['!cols']) {
      ws['!cols'].forEach((col, idx) => {
        if (col?.wpx) {
          colWidths[String(idx)] = col.wpx;
        }
      });
    }

    const rowHeights: Record<string, number> = {};
    if (ws['!rows']) {
      ws['!rows'].forEach((row, idx) => {
        if (row?.hpx) {
          rowHeights[String(idx)] = row.hpx;
        }
      });
    }

    sheets.push({
      name: sheetName,
      celldata,
      row: Math.max(rowCount + 50, 84),
      column: Math.max(colCount + 20, 60),
      defaultRowHeight: 25,
      defaultColWidth: 100,
      config: {
        columnlen: Object.keys(colWidths).length > 0 ? colWidths : undefined,
        rowlen: Object.keys(rowHeights).length > 0 ? rowHeights : undefined,
      },
    });
  }

  return sheets;
}

function sheetsToWorkbook(sheets: Sheet[]): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = sheet.data;
    if (!data) continue;

    const aoa: (string | number | boolean | null)[][] = [];
    for (let r = 0; r < data.length; r++) {
      const row: (string | number | boolean | null)[] = [];
      if (data[r]) {
        for (let c = 0; c < data[r].length; c++) {
          const cell = data[r][c];
          if (cell?.v != null) {
            row.push(cell.v as string | number | boolean);
          } else {
            row.push(null);
          }
        }
      }
      aoa.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function parseTableFile(
  content: string | ArrayBuffer,
  fileName: string
): Sheet[] {
  const ext = getTableFileExtension(fileName);

  if (ext === 'csv') {
    return [csvToSheetData(content as string, 'Sheet1')];
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = typeof content === 'string'
      ? new TextEncoder().encode(content).buffer
      : content;
    return workbookToSheets(buffer);
  }

  return [];
}

export function serializeTableFile(
  sheets: Sheet[],
  fileName: string
): string | ArrayBuffer {
  const ext = getTableFileExtension(fileName);

  if (ext === 'csv') {
    const firstSheet = sheets[0];
    return firstSheet ? sheetDataToCsv(firstSheet) : '';
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return sheetsToWorkbook(sheets);
  }

  return '';
}
