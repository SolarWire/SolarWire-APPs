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
  onResetRowAttrs: (rowIndex: number) => void;
  onResetCellAttrs: (row: number, col: number) => void;
}

const CellProperties: React.FC<CellPropertiesProps> = ({
  tableData,
  selectedCells,
  onUpdateCell,
  onUpdateRow,
  onResetRowAttrs,
  onResetCellAttrs,
}) => {
  const cellKeys = Array.from(selectedCells);

  if (cellKeys.length === 0) {
    return (
      <div className="cell-properties empty">
        <p className="empty-hint">选择一个单元格以编辑属性</p>
      </div>
    );
  }

  const getCellInfo = (key: string) => {
    const [r, c] = key.split('-').map(Number);
    return {
      r,
      c,
      cell: tableData.rows[r]?.cells[c],
      rowData: tableData.rows[r],
    };
  };

  const getEffectiveAttr = (key: string, attrName: string): string => {
    const { cell, rowData } = getCellInfo(key);
    if (!cell || !rowData) return '';
    const cellVal = cell.attrs[attrName as keyof typeof cell.attrs];
    const rowVal = rowData.attrs[attrName as keyof typeof rowData.attrs];
    if (attrName === 'bold' || attrName === 'italic') {
      return String(!!cellVal || !!rowVal);
    }
    return String(cellVal || rowVal || '');
  };

  const getCommonAttr = (attrName: string): string | undefined => {
    if (cellKeys.length === 0) return undefined;
    const values = new Set<string>();
    for (const key of cellKeys) {
      values.add(getEffectiveAttr(key, attrName));
    }
    return values.size === 1 ? [...values][0] : undefined;
  };

  const isMixed = (attrName: string): boolean => {
    if (cellKeys.length <= 1) return false;
    const values = new Set<string>();
    for (const key of cellKeys) {
      values.add(getEffectiveAttr(key, attrName));
    }
    return values.size > 1;
  };

  const getFullySelectedRows = (): Set<number> => {
    const result = new Set<number>();
    const rowCellMap = new Map<number, number>();
    for (const key of cellKeys) {
      const [r] = key.split('-').map(Number);
      rowCellMap.set(r, (rowCellMap.get(r) || 0) + 1);
    }
    for (const [rowIdx, count] of rowCellMap) {
      if (count === (tableData.rows[rowIdx]?.cells.length || 0)) {
        result.add(rowIdx);
      }
    }
    return result;
  };

  const fullySelectedRows = getFullySelectedRows();

  const handleBatchChange = (attr: string, value: any) => {
    if (attr === 'line-height' || attr === 'letter-spacing') {
      const rowIndices = [...new Set(cellKeys.map(key => Number(key.split('-')[0])))];
      for (const r of rowIndices) {
        onUpdateRow(r, { [attr]: value });
      }
    } else {
      for (const key of cellKeys) {
        const { r, c } = getCellInfo(key);
        onUpdateCell(r, c, { attrs: { [attr]: value } });
      }
      for (const r of fullySelectedRows) {
        onUpdateRow(r, { [attr]: value });
      }
    }
  };

  const handleBatchReset = () => {
    for (const r of fullySelectedRows) {
      onResetRowAttrs(r);
    }
    for (const key of cellKeys) {
      const { r, c } = getCellInfo(key);
      if (!fullySelectedRows.has(r)) {
        onResetCellAttrs(r, c);
      }
    }
  };

  const commonBg = getCommonAttr('bg');
  const commonColor = getCommonAttr('c');
  const commonSize = getCommonAttr('size');
  const commonAlign = getCommonAttr('align');
  const commonVAlign = getCommonAttr('vertical-align');
  const commonBold = getCommonAttr('bold');
  const commonItalic = getCommonAttr('italic');
  const commonLineHeight = getCommonAttr('line-height');
  const commonLetterSpacing = getCommonAttr('letter-spacing');
  const commonTextDecoration = getCommonAttr('text-decoration');
  const commonPt = getCommonAttr('pt');
  const commonPr = getCommonAttr('pr');
  const commonPb = getCommonAttr('pb');
  const commonPl = getCommonAttr('pl');

  const effectiveBg = commonBg || '#ffffff';
  const effectiveColor = commonColor || '#000000';
  const effectiveAlign = commonAlign || 'l';
  const effectiveVAlign = commonVAlign || 't';
  const effectiveBold = commonBold === 'true';
  const effectiveItalic = commonItalic === 'true';

  const mixedBg = isMixed('bg');
  const mixedColor = isMixed('c');
  const mixedSize = isMixed('size');
  const mixedAlign = isMixed('align');
  const mixedVAlign = isMixed('vertical-align');
  const mixedBold = isMixed('bold');
  const mixedItalic = isMixed('italic');
  const mixedLineHeight = isMixed('line-height');
  const mixedLetterSpacing = isMixed('letter-spacing');
  const mixedTextDecoration = isMixed('text-decoration');
  const mixedPt = isMixed('pt');
  const mixedPr = isMixed('pr');
  const mixedPb = isMixed('pb');
  const mixedPl = isMixed('pl');

  const effectiveTextDecoration = commonTextDecoration || '';
  const effectivePt = commonPt || '';
  const effectivePr = commonPr || '';
  const effectivePb = commonPb || '';
  const effectivePl = commonPl || '';

  const textDecorationValues = cellKeys.map(key => getEffectiveAttr(key, 'text-decoration'));
  const hasUnderline = textDecorationValues.some(v => v === 'underline');
  const hasLineThrough = textDecorationValues.some(v => v === 'line-through');
  const allUnderline = cellKeys.length > 0 && textDecorationValues.every(v => v === 'underline');
  const allLineThrough = cellKeys.length > 0 && textDecorationValues.every(v => v === 'line-through');

  const firstKey = cellKeys[0];
  const [firstRow, firstCol] = firstKey.split('-').map(Number);
  const isSingleRow = cellKeys.every(k => k.startsWith(`${firstRow}-`));
  const numColsInRow = tableData.rows[firstRow]?.cells.length || 0;
  const isWholeRow = isSingleRow && cellKeys.length === numColsInRow;

  let title: string;
  if (cellKeys.length === 1) {
    title = `单元格 (${firstRow + 1}, ${String.fromCharCode(65 + firstCol)})`;
  } else if (isWholeRow) {
    title = `行 ${firstRow + 1} 属性`;
  } else {
    title = `${cellKeys.length} 个单元格`;
  }

  const showRowAttrs = fullySelectedRows.size > 0;

  return (
    <div className="cell-properties">
      <h4 className="properties-title">{title}</h4>

      <div className="property-section">
        <ColorPicker
          label="Fill"
          codeAttr="bg"
          value={effectiveBg}
          onChange={(color) => handleBatchChange('bg', color)}
        />
      </div>

      <div className="property-section">
        <ColorPicker
          label="Color"
          codeAttr="c"
          value={effectiveColor}
          onChange={(color) => handleBatchChange('c', color)}
        />
      </div>

      <div className="property-section">
        <div className="property-row-inline">
          <span className="prop-label">Size</span>
          <DraggableNumberInput
            label=""
            value={mixedSize ? '' : (parseInt(commonSize || '12') || 12)}
            onChange={(v) => handleBatchChange('size', v.toString())}
            placeholder={mixedSize ? '—' : undefined}
          />
        </div>
      </div>

      <div className="property-section">
        <span className="prop-label">Align</span>
        <div className="align-btns">
          {(['l', 'c', 'r'] as const).map((a) => (
            <button
              key={a}
              className={`align-btn ${!mixedAlign && effectiveAlign === a ? 'active' : ''}`}
              onClick={() => handleBatchChange('align', a)}
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
              className={`align-btn ${!mixedVAlign && effectiveVAlign === va ? 'active' : ''}`}
              onClick={() => handleBatchChange('vertical-align', va)}
            >
              {va === 't' ? '↑' : va === 'm' ? '↕' : '↓'}
            </button>
          ))}
        </div>
      </div>

      <div className="property-section toggle-section">
        <button
          className={`toggle-btn ${mixedBold ? 'mixed' : ''} ${!mixedBold && effectiveBold ? 'active' : ''}`}
          onClick={() => handleBatchChange('bold', !effectiveBold)}
        ><b>B</b></button>
        <button
          className={`toggle-btn ${mixedItalic ? 'mixed' : ''} ${!mixedItalic && effectiveItalic ? 'active' : ''}`}
          onClick={() => handleBatchChange('italic', !effectiveItalic)}
        ><i>I</i></button>
        <button
          className={`toggle-btn ${mixedTextDecoration ? 'mixed' : ''} ${!mixedTextDecoration && allUnderline ? 'active' : ''}`}
          onClick={() => {
            if (allUnderline) {
              for (const key of cellKeys) {
                const { r, c } = getCellInfo(key);
                const cell = tableData.rows[r]?.cells[c];
                const { 'text-decoration': _, ...rest } = cell.attrs;
                onUpdateCell(r, c, { attrs: rest });
              }
            } else {
              for (const key of cellKeys) {
                const { r, c } = getCellInfo(key);
                onUpdateCell(r, c, { attrs: { 'text-decoration': 'underline' } });
              }
            }
          }}
        ><u>U</u></button>
        <button
          className={`toggle-btn ${mixedTextDecoration ? 'mixed' : ''} ${!mixedTextDecoration && allLineThrough ? 'active' : ''}`}
          onClick={() => {
            if (allLineThrough) {
              for (const key of cellKeys) {
                const { r, c } = getCellInfo(key);
                const cell = tableData.rows[r]?.cells[c];
                const { 'text-decoration': _, ...rest } = cell.attrs;
                onUpdateCell(r, c, { attrs: rest });
              }
            } else {
              for (const key of cellKeys) {
                const { r, c } = getCellInfo(key);
                onUpdateCell(r, c, { attrs: { 'text-decoration': 'line-through' } });
              }
            }
          }}
        ><s>S</s></button>
      </div>

      <div className="property-section">
        <span className="prop-label">Padding</span>
        <div className="padding-grid">
          <div className="padding-field">
            <span className="padding-label">T</span>
            <DraggableNumberInput
              label=""
              value={mixedPt ? '' : (parseInt(effectivePt) || 0)}
              onChange={(v) => handleBatchChange('pt', v.toString())}
              placeholder={mixedPt ? '—' : undefined}
            />
          </div>
          <div className="padding-field">
            <span className="padding-label">R</span>
            <DraggableNumberInput
              label=""
              value={mixedPr ? '' : (parseInt(effectivePr) || 0)}
              onChange={(v) => handleBatchChange('pr', v.toString())}
              placeholder={mixedPr ? '—' : undefined}
            />
          </div>
          <div className="padding-field">
            <span className="padding-label">B</span>
            <DraggableNumberInput
              label=""
              value={mixedPb ? '' : (parseInt(effectivePb) || 0)}
              onChange={(v) => handleBatchChange('pb', v.toString())}
              placeholder={mixedPb ? '—' : undefined}
            />
          </div>
          <div className="padding-field">
            <span className="padding-label">L</span>
            <DraggableNumberInput
              label=""
              value={mixedPl ? '' : (parseInt(effectivePl) || 0)}
              onChange={(v) => handleBatchChange('pl', v.toString())}
              placeholder={mixedPl ? '—' : undefined}
            />
          </div>
        </div>
      </div>

      {showRowAttrs && (
        <>
          <div className="property-section">
            <div className="property-row-inline">
              <span className="prop-label">LH</span>
              <DraggableNumberInput
                label=""
                value={mixedLineHeight ? '' : (parseInt(commonLineHeight || '22') || 22)}
                onChange={(v) => handleBatchChange('line-height', v.toString())}
                placeholder={mixedLineHeight ? '—' : undefined}
              />
            </div>
          </div>
          <div className="property-section">
            <div className="property-row-inline">
              <span className="prop-label">LS</span>
              <DraggableNumberInput
                label=""
                value={mixedLetterSpacing ? '' : (parseInt(commonLetterSpacing || '0') || 0)}
                onChange={(v) => handleBatchChange('letter-spacing', v.toString())}
                placeholder={mixedLetterSpacing ? '—' : undefined}
              />
            </div>
          </div>
        </>
      )}

      <button
        className="reset-cell-btn"
        onClick={handleBatchReset}
      >
        重置属性
      </button>
    </div>
  );
};

export default CellProperties;
