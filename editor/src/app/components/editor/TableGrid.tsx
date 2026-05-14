import React, { useMemo } from 'react';
import type { TableData, TableCell } from '../../../shared/utils/table-source-utils';
import './TableGrid.css';

interface TableGridProps {
  tableData: TableData;
  selectedCells: Set<string>;
  editingCell: string | null;
  onSelectCell: (key: string, multi: boolean) => void;
  onStartEditing: (key: string) => void;
  onStopEditing: () => void;
  onUpdateCell: (row: number, col: number, updates: Partial<TableCell>) => void;
  onAddRow: (index?: number) => void;
  onDeleteRow: (index: number) => void;
  onAddColumn: (index?: number) => void;
  onDeleteColumn: (index: number) => void;
  scale?: number;
}

interface CellInfo {
  cell: TableCell;
  rowIdx: number;
  colIdx: number;
  colspan: number;
  rowspan: number;
  visible: boolean;
}

function buildCellGrid(rows: TableData['rows']): (CellInfo | null)[][] {
  const numRows = rows.length;
  const numCols = rows[0]?.cells.length || 0;
  const grid: (CellInfo | null)[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => null)
  );

  for (let r = 0; r < numRows; r++) {
    let colIndex = 0;
    for (let c = 0; c < rows[r].cells.length; c++) {
      while (colIndex < numCols && grid[r][colIndex]) {
        colIndex++;
      }
      if (colIndex >= numCols) break;

      const cell = rows[r].cells[c];
      if (!cell) continue;

      const colspan = Math.max(1, cell.colspan || 1);
      const rowspan = Math.max(1, cell.rowspan || 1);

      const actualColspan = Math.min(colspan, numCols - colIndex);
      const actualRowspan = Math.min(rowspan, numRows - r);

      const info: CellInfo = {
        cell,
        rowIdx: r,
        colIdx: colIndex,
        colspan: actualColspan,
        rowspan: actualRowspan,
        visible: true,
      };

      for (let dr = 0; dr < actualRowspan; dr++) {
        for (let dc = 0; dc < actualColspan; dc++) {
          const nr = r + dr;
          const nc = colIndex + dc;
          if (nr < numRows && nc < numCols) {
            grid[nr][nc] = info;
          }
        }
      }

      colIndex += actualColspan;
    }
  }

  return grid;
}

const TableGrid: React.FC<TableGridProps> = ({
  tableData,
  selectedCells,
  editingCell,
  onSelectCell,
  onStartEditing,
  onStopEditing,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  scale = 1,
}) => {
  const numCols = tableData.rows[0]?.cells.length || 0;
  const numRows = tableData.rows.length;

  const cellGrid = useMemo<(CellInfo | null)[][]>(() => buildCellGrid(tableData.rows), [tableData.rows]);

  const isRowFullySelected = (rowIdx: number) => {
    return Array.from({ length: numCols }).every((_, colIdx) =>
      selectedCells.has(`${rowIdx}-${colIdx}`)
    );
  };

  const isColumnFullySelected = (colIdx: number) => {
    return tableData.rows.every((_, rowIdx) =>
      selectedCells.has(`${rowIdx}-${colIdx}`)
    );
  };

  const handleRowLabelClick = (rowIdx: number) => {
    const isCurrentlySelected = isRowFullySelected(rowIdx);
    if (isCurrentlySelected) {
      onSelectCell(`${rowIdx}-0`, false);
    } else {
      onSelectCell(`${rowIdx}-0`, false);
      for (let col = 1; col < numCols; col++) {
        onSelectCell(`${rowIdx}-${col}`, true);
      }
    }
  };

  const handleColLabelClick = (colIdx: number) => {
    const isCurrentlySelected = isColumnFullySelected(colIdx);
    if (isCurrentlySelected) {
      onSelectCell(`0-${colIdx}`, false);
    } else {
      onSelectCell(`0-${colIdx}`, false);
      for (let row = 1; row < numRows; row++) {
        onSelectCell(`${row}-${colIdx}`, true);
      }
    }
  };

  return (
    <div className="table-grid-container">
      <div className="table-grid-scroll" style={{ zoom: scale }}>
        <div className="table-grid-header">
          <div className="grid-corner">
            <button className="grid-add-btn add-row" onClick={() => onAddRow(0)} title="在最上方添加行">↕+</button>
            <button className="grid-add-btn add-col" onClick={() => onAddColumn(0)} title="在最左侧添加列">↔+</button>
          </div>
          {Array.from({ length: numCols }).map((_, colIdx) => (
            <div key={colIdx} className="grid-col-header">
              <span
                className={`col-label ${isColumnFullySelected(colIdx) ? 'col-selected' : ''}`}
                onClick={() => handleColLabelClick(colIdx)}
                style={{ cursor: 'pointer' }}
              >
                {String.fromCharCode(65 + colIdx)}
              </span>
              <div className="col-actions">
                <button className="col-action-btn" onClick={() => onAddColumn(colIdx + 1)} title="在右侧添加列">+</button>
                <button className="col-action-btn delete" onClick={() => onDeleteColumn(colIdx)} disabled={numCols <= 1} title="删除此列">×</button>
              </div>
            </div>
          ))}
        </div>

        {tableData.rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row">
            <div className="grid-row-header">
              <span
                className={`row-label ${isRowFullySelected(rowIdx) ? 'row-selected' : ''}`}
                onClick={() => handleRowLabelClick(rowIdx)}
                style={{ cursor: 'pointer' }}
              >
                {rowIdx + 1}
              </span>
              <div className="row-actions">
                <button className="row-action-btn" onClick={() => onAddRow(rowIdx + 1)} title="在下方添加行">+</button>
                <button className="row-action-btn delete" onClick={() => onDeleteRow(rowIdx)} disabled={tableData.rows.length <= 1} title="删除此行">×</button>
              </div>
            </div>

            {cellGrid[rowIdx]?.map((info, colIdx) => {
              if (!info || !info.visible) {
                // 占位符，保持布局
                return <div key={colIdx} className="grid-cell hidden-cell" style={{ display: 'none' }} />;
              }
              if (info.rowIdx !== rowIdx || info.colIdx !== colIdx) {
                // 这个位置是被其他单元格的rowspan/colspan占用的
                return <div key={colIdx} className="grid-cell hidden-cell" style={{ display: 'none' }} />;
              }

              const cell = info.cell;
              const cellKey = `${rowIdx}-${colIdx}`;
              const isSelected = selectedCells.has(cellKey);
              const isEditing = editingCell === cellKey;
              const cellBg = cell.attrs.bg || row.attrs.bg || 'none';
              const cellColor = cell.attrs.c || row.attrs.c || '#000000';
              const cellBold = cell.attrs.bold || row.attrs.bold;
              const cellItalic = cell.attrs.italic || row.attrs.italic;
              const cellSize = cell.attrs.size || row.attrs.size;
              const cellAlign = cell.attrs.align || row.attrs.align;
              const cellVAlign = cell.attrs['vertical-align'] || row.attrs['vertical-align'];
              const cellTextDecoration = cell.attrs['text-decoration'] || row.attrs['text-decoration'];
              const cellPt = cell.attrs['padding-top'] || row.attrs['padding-top'];
              const cellPr = cell.attrs['padding-right'] || row.attrs['padding-right'];
              const cellPb = cell.attrs['padding-bottom'] || row.attrs['padding-bottom'];
              const cellPl = cell.attrs['padding-left'] || row.attrs['padding-left'];

              const textStyle: React.CSSProperties = {
                color: cellColor,
                fontWeight: cellBold ? 'bold' : undefined,
                fontStyle: cellItalic ? 'italic' : undefined,
                fontSize: cellSize ? `${cellSize}px` : undefined,
                textAlign: cellAlign === 'l' ? 'left' : cellAlign === 'c' ? 'center' : cellAlign === 'r' ? 'right' : undefined,
                textDecoration: cellTextDecoration === 'underline' ? 'underline' : cellTextDecoration === 'line-through' ? 'line-through' : undefined,
                paddingTop: cellPt ? `${cellPt}px` : undefined,
                paddingRight: cellPr ? `${cellPr}px` : undefined,
                paddingBottom: cellPb ? `${cellPb}px` : undefined,
                paddingLeft: cellPl ? `${cellPl}px` : undefined,
              };

              const cellContainerStyle: React.CSSProperties = {
                backgroundColor: cellBg && cellBg !== 'none' ? cellBg : undefined,
                alignItems: cellVAlign === 't' ? 'flex-start' : cellVAlign === 'm' ? 'center' : cellVAlign === 'b' ? 'flex-end' : undefined,
              };

              const showSpan = info.colspan > 1 || info.rowspan > 1;

              return (
                <div
                  key={colIdx}
                  className={`grid-cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${showSpan ? 'span-cell' : ''}`}
                  style={{
                    ...cellContainerStyle,
                    flex: info.colspan,
                    minWidth: 0,
                  }}
                  onClick={(e) => {
                    if (!isEditing) {
                      onSelectCell(cellKey, e.shiftKey || e.ctrlKey || e.metaKey);
                    }
                  }}
                  onDoubleClick={() => onStartEditing(cellKey)}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      className="cell-input"
                      value={cell.text}
                      autoFocus
                      onChange={(e) => onUpdateCell(rowIdx, colIdx, { text: e.target.value })}
                      onBlur={onStopEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onStopEditing();
                        } else if (e.key === 'Escape') {
                          onStopEditing();
                        } else if (e.key === 'Tab') {
                          e.preventDefault();
                          onStopEditing();
                          if (e.shiftKey) {
                            if (colIdx > 0) {
                              onSelectCell(`${rowIdx}-${colIdx - 1}`, false);
                            } else if (rowIdx > 0) {
                              const prevRowLen = tableData.rows[rowIdx - 1]?.cells.length || 0;
                              onSelectCell(`${rowIdx - 1}-${prevRowLen - 1}`, false);
                            }
                          } else {
                            if (colIdx < numCols - 1) {
                              onSelectCell(`${rowIdx}-${colIdx + 1}`, false);
                            } else if (rowIdx < tableData.rows.length - 1) {
                              onSelectCell(`${rowIdx + 1}-0`, false);
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="cell-text" style={textStyle}>
                      {cell.text || <span className="cell-placeholder">双击编辑</span>}
                    </div>
                  )}
                  {showSpan && (
                    <span className="span-badge" title={`colspan=${info.colspan}, rowspan=${info.rowspan}`}>
                      {info.colspan > 1 && <span className="span-badge-item">{info.colspan}×</span>}
                      {info.rowspan > 1 && <span className="span-badge-item">↕{info.rowspan}</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableGrid;