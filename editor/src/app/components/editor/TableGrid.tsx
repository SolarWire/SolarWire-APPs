import React from 'react';
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

  return (
    <div className="table-grid-container">
      <div className="table-grid-scroll" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div className="table-grid-header">
          <div className="grid-corner">
            <button className="grid-add-btn" onClick={() => onAddColumn(0)} title="在最左侧添加列">+</button>
          </div>
          {Array.from({ length: numCols }).map((_, colIdx) => (
            <div key={colIdx} className="grid-col-header">
              <span className="col-label">{String.fromCharCode(65 + colIdx)}</span>
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
              <span className="row-label">{rowIdx + 1}</span>
              <div className="row-actions">
                <button className="row-action-btn" onClick={() => onAddRow(rowIdx + 1)} title="在下方添加行">+</button>
                <button className="row-action-btn delete" onClick={() => onDeleteRow(rowIdx)} disabled={tableData.rows.length <= 1} title="删除此行">×</button>
              </div>
            </div>

            {row.cells.map((cell, colIdx) => {
              const cellKey = `${rowIdx}-${colIdx}`;
              const isSelected = selectedCells.has(cellKey);
              const isEditing = editingCell === cellKey;
              const cellBg = cell.attrs.bg || row.attrs.bg || '#ffffff';
              const cellColor = cell.attrs.c || row.attrs.c || '#000000';
              const cellBold = cell.attrs.bold || row.attrs.bold;
              const cellItalic = cell.attrs.italic || row.attrs.italic;
              const cellSize = cell.attrs.size || row.attrs.size;

              const textStyle: React.CSSProperties = {
                color: cellColor,
                fontWeight: cellBold ? 'bold' : undefined,
                fontStyle: cellItalic ? 'italic' : undefined,
                fontSize: cellSize ? `${cellSize}px` : undefined,
              };

              return (
                <div
                  key={colIdx}
                  className={`grid-cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
                  style={{ backgroundColor: cellBg }}
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
