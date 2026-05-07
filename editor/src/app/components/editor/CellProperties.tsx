import React from 'react';
import { DraggableNumberInput } from './property/PropertyRow';
import ColorPicker from '../ui/ColorPicker';
import type { TableData, TableRow } from '../../../shared/utils/table-source-utils';
import './CellProperties.css';

interface CellPropertiesProps {
  tableData: TableData;
  selectedCells: Set<string>;
  onUpdateCell: (row: number, col: number, updates: any) => void;
  onUpdateRow: (rowIndex: number, updates: Partial<TableRow['attrs']>) => void;
}

const CellProperties: React.FC<CellPropertiesProps> = ({
  tableData,
  selectedCells,
  onUpdateCell,
  onUpdateRow,
}) => {
  const cellKeys = Array.from(selectedCells);
  if (cellKeys.length === 0) {
    return (
      <div className="cell-properties empty">
        <p className="empty-hint">选择一个单元格以编辑属性</p>
      </div>
    );
  }

  const firstKey = cellKeys[0];
  const [firstRow, firstCol] = firstKey.split('-').map(Number);
  const firstCell = tableData.rows[firstRow]?.cells[firstCol];
  const firstRowData = tableData.rows[firstRow];

  if (!firstCell || !firstRowData) return null;

  const numColsInRow = tableData.rows[firstRow]?.cells.length || 0;
  const isWholeRow = cellKeys.length === numColsInRow && cellKeys.every(k => k.startsWith(`${firstRow}-`));

  const effectiveBg = firstCell.attrs.bg || firstRowData.attrs.bg || '#ffffff';
  const effectiveColor = firstCell.attrs.c || firstRowData.attrs.c || '#000000';
  const effectiveSize = firstCell.attrs.size || firstRowData.attrs.size || '12';
  const effectiveAlign = firstCell.attrs.align || 'l';
  const effectiveVAlign = firstCell.attrs['vertical-align'] || 't';
  const effectiveBold = firstCell.attrs.bold || firstRowData.attrs.bold;
  const effectiveItalic = firstCell.attrs.italic || firstRowData.attrs.italic;
  const effectiveLineHeight = firstRowData.attrs['line-height'] || '22';
  const effectiveLetterSpacing = firstRowData.attrs['letter-spacing'] || '0';

  const handleCellChange = (attr: string, value: any) => {
    if (isWholeRow) {
      onUpdateRow(firstRow, { [attr]: value });
    } else {
      if (attr === 'line-height' || attr === 'letter-spacing') {
        onUpdateRow(firstRow, { [attr]: value });
      } else {
        onUpdateCell(firstRow, firstCol, {
          attrs: { ...firstCell.attrs, [attr]: value },
        });
      }
    }
  };

  return (
    <div className="cell-properties">
      <h4 className="properties-title">
        {isWholeRow ? `行 ${firstRow + 1} 属性` : `单元格 (${firstRow + 1}, ${String.fromCharCode(65 + firstCol)})`}
      </h4>

      <div className="property-section">
        <ColorPicker
          label="Fill"
          codeAttr="bg"
          value={effectiveBg}
          onChange={(color) => handleCellChange('bg', color)}
        />
      </div>

      <div className="property-section">
        <ColorPicker
          label="Color"
          codeAttr="c"
          value={effectiveColor}
          onChange={(color) => handleCellChange('c', color)}
        />
      </div>

      <div className="property-section">
        <div className="property-row-inline">
          <span className="prop-label">Size</span>
          <DraggableNumberInput
            label=""
            value={parseInt(effectiveSize) || 12}
            onChange={(v) => handleCellChange('size', v.toString())}
          />
        </div>
      </div>

      <div className="property-section">
        <span className="prop-label">Align</span>
        <div className="align-btns">
          {(['l', 'c', 'r'] as const).map((a) => (
            <button
              key={a}
              className={`align-btn ${effectiveAlign === a ? 'active' : ''}`}
              onClick={() => handleCellChange('align', a)}
            >
              {a === 'l' ? 'L' : a === 'c' ? 'C' : 'R'}
            </button>
          ))}
        </div>
      </div>

      <div className="property-section">
        <span className="prop-label">V-Align</span>
        <div className="align-btns">
          {(['t', 'm', 'b'] as const).map((va) => (
            <button
              key={va}
              className={`align-btn ${effectiveVAlign === va ? 'active' : ''}`}
              onClick={() => handleCellChange('vertical-align', va)}
            >
              {va === 't' ? '↑' : va === 'm' ? '↕' : '↓'}
            </button>
          ))}
        </div>
      </div>

      <div className="property-section toggle-section">
        <button
          className={`toggle-btn ${effectiveBold ? 'active' : ''}`}
          onClick={() => handleCellChange('bold', !effectiveBold)}
        ><b>B</b></button>
        <button
          className={`toggle-btn ${effectiveItalic ? 'active' : ''}`}
          onClick={() => handleCellChange('italic', !effectiveItalic)}
        ><i>I</i></button>
      </div>

      {isWholeRow && (
        <>
          <div className="property-section">
            <div className="property-row-inline">
              <span className="prop-label">LH</span>
              <DraggableNumberInput
                label=""
                value={parseInt(effectiveLineHeight) || 22}
                onChange={(v) => handleCellChange('line-height', v.toString())}
              />
            </div>
          </div>
          <div className="property-section">
            <div className="property-row-inline">
              <span className="prop-label">LS</span>
              <DraggableNumberInput
                label=""
                value={parseInt(effectiveLetterSpacing) || 0}
                onChange={(v) => handleCellChange('letter-spacing', v.toString())}
              />
            </div>
          </div>
        </>
      )}

      <button
        className="reset-cell-btn"
        onClick={() => {
          if (isWholeRow) {
            onUpdateRow(firstRow, {});
          } else {
            onUpdateCell(firstRow, firstCol, { attrs: {} });
          }
        }}
      >
        重置属性
      </button>
    </div>
  );
};

export default CellProperties;
