import { useState, useCallback, useRef } from 'react';
import { parse } from '../../lib/parser';
import {
  parseTableFromSource,
  serializeTableToSource,
} from '../utils/table-source-utils';
import type { TableData, TableCell, TableRow } from '../utils/table-source-utils';
import type { TableElement } from '../../lib/parser/types';

export function useTableEditor(
  content: string,
  tableLine: number,
  onSave: (newContent: string) => void
) {
  const [tableData, setTableData] = useState<TableData | null>(() => {
    try {
      const ast = parse(content);
      const tableEl = ast.elements.find(
        el => el.type === 'table' && el.location?.line === tableLine
      ) as TableElement | undefined;
      if (!tableEl) return null;
      return parseTableFromSource(tableEl);
    } catch {
      return null;
    }
  });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const tableDataRef = useRef(tableData);
  tableDataRef.current = tableData;

  const updateCell = useCallback((row: number, col: number, updates: Partial<TableCell>) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map((r, i) => {
        if (i !== row) return r;
        const newCells = r.cells.map((c, j) => {
          if (j !== col) return c;
          if (updates.attrs) {
            const merged: Record<string, any> = { ...c.attrs };
            for (const [key, value] of Object.entries(updates.attrs)) {
              if (value === undefined) {
                delete merged[key];
              } else {
                merged[key] = value;
              }
            }
            return { ...c, attrs: merged };
          }
          return { ...c, ...updates };
        });
        return { ...r, cells: newCells };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const updateRow = useCallback((rowIndex: number, updates: Partial<TableRow['attrs']>) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map((r, i) => {
        if (i !== rowIndex) return r;
        const merged: Record<string, any> = { ...r.attrs };
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) {
            delete merged[key];
          } else {
            merged[key] = value;
          }
        }
        return { ...r, attrs: merged };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const resetRowAttrs = useCallback((rowIndex: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map((r, i) => {
        if (i !== rowIndex) return r;
        return { ...r, attrs: {} };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const resetCellAttrs = useCallback((row: number, col: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newRows = prev.rows.map((r, i) => {
        if (i !== row) return r;
        const newCells = r.cells.map((c, j) => {
          if (j !== col) return c;
          return { ...c, attrs: {} };
        });
        return { ...r, cells: newCells };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const updateTableAttrs = useCallback((updates: Partial<TableData['attrs']>) => {
    setTableData(prev => {
      if (!prev) return prev;
      return { ...prev, attrs: { ...prev.attrs, ...updates } };
    });
    setIsDirty(true);
  }, []);

  const addRow = useCallback((index?: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const insertAt = index ?? prev.rows.length;
      const numCols = prev.rows[0]?.cells.length || 1;
      const newCells: TableCell[] = Array.from({ length: numCols }, () => ({
        type: 'rectangle',
        text: '',
        colspan: 1,
        rowspan: 1,
        attrs: {},
      }));
      const newRow: TableRow = { attrs: {}, cells: newCells };
      const newRows = [...prev.rows];
      newRows.splice(insertAt, 0, newRow);
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setTableData(prev => {
      if (!prev || prev.rows.length <= 1) return prev;
      return { ...prev, rows: prev.rows.filter((_, i) => i !== index) };
    });
    setIsDirty(true);
  }, []);

  const addColumn = useCallback((colIndex?: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const insertAt = colIndex ?? (prev.rows[0]?.cells.length || 0);
      const newRows = prev.rows.map(row => {
        const newCells = [...row.cells];
        newCells.splice(insertAt, 0, {
          type: 'rectangle',
          text: '',
          colspan: 1,
          rowspan: 1,
          attrs: {},
        });
        return { ...row, cells: newCells };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const deleteColumn = useCallback((colIndex: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const numCols = prev.rows[0]?.cells.length || 0;
      if (numCols <= 1) return prev;
      return {
        ...prev,
        rows: prev.rows.map(row => ({
          ...row,
          cells: row.cells.filter((_, i) => i !== colIndex),
        })),
      };
    });
    setIsDirty(true);
  }, []);

  const selectCell = useCallback((cellKey: string, multi: boolean = false) => {
    setSelectedCells(prev => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(cellKey)) next.delete(cellKey);
        else next.add(cellKey);
        return next;
      }
      return new Set([cellKey]);
    });
    setEditingCell(null);
  }, []);

  const startEditing = useCallback((cellKey: string) => {
    setEditingCell(cellKey);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const save = useCallback(() => {
    const currentData = tableDataRef.current;
    if (!currentData) return;
    const newContent = serializeTableToSource(currentData, content);
    onSave(newContent);
    setIsDirty(false);
  }, [content, onSave]);

  const reset = useCallback(() => {
    try {
      const ast = parse(content);
      const tableEl = ast.elements.find(
        el => el.type === 'table' && el.location?.line === tableLine
      ) as TableElement | undefined;
      if (tableEl) {
        const newData = parseTableFromSource(tableEl);
        if (newData) setTableData(newData);
      }
    } catch {}
    setSelectedCells(new Set());
    setEditingCell(null);
    setIsDirty(false);
  }, [content, tableLine]);

  return {
    tableData,
    selectedCells,
    editingCell,
    isDirty,
    updateCell,
    updateRow,
    resetRowAttrs,
    resetCellAttrs,
    updateTableAttrs,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    selectCell,
    startEditing,
    stopEditing,
    save,
    reset,
  };
}
