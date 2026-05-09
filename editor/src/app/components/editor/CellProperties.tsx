import React from 'react';
import { DraggableNumberInput } from './property/PropertyRow';
import PropertyLabel from './property/PropertyLabel';
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

const parseVal = (v: string | undefined): number => {
  if (v === undefined || v === '') return 0;
  return parseInt(v) || 0;
};

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
  const commonPl = getCommonAttr('pl');
  const commonPt = getCommonAttr('pt');
  const commonPr = getCommonAttr('pr');
  const commonPb = getCommonAttr('pb');

  const effectiveBg = commonBg || '#ffffff';
  const effectiveColor = commonColor || '#000000';
  const effectiveAlign = commonAlign || '';
  const effectiveVAlign = commonVAlign || '';
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
  const mixedPl = isMixed('pl');
  const mixedPt = isMixed('pt');
  const mixedPr = isMixed('pr');
  const mixedPb = isMixed('pb');

  const effectiveTextDecoration = commonTextDecoration || '';
  const effectivePl = commonPl || '';
  const effectivePt = commonPt || '';
  const effectivePr = commonPr || '';
  const effectivePb = commonPb || '';

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

  const toggleTextDecoration = (decoration: 'underline' | 'line-through') => {
    const isAllActive = decoration === 'underline' ? allUnderline : allLineThrough;
    if (isAllActive) {
      for (const key of cellKeys) {
        const { r, c } = getCellInfo(key);
        const cell = tableData.rows[r]?.cells[c];
        if (cell) {
          const { 'text-decoration': _, ...rest } = cell.attrs;
          onUpdateCell(r, c, { attrs: { ...rest, 'text-decoration': undefined as any } });
        }
      }
      for (const r of fullySelectedRows) {
        const row = tableData.rows[r];
        if (row) {
          const { 'text-decoration': _, ...rest } = row.attrs;
          onUpdateRow(r, { ...rest, 'text-decoration': undefined as any });
        }
      }
    } else {
      handleBatchChange('text-decoration', decoration);
    }
  };

  return (
    <div className="cell-properties">
      <h4 className="properties-title">{title}</h4>

      <ColorPicker
        label="填充色"
        codeAttr="bg"
        value={effectiveBg}
        onChange={(color) => handleBatchChange('bg', color)}
      />

      <ColorPicker
        label="文字色"
        codeAttr="c"
        value={effectiveColor}
        onChange={(color) => handleBatchChange('c', color)}
      />

      <DraggableNumberInput
        label="字号"
        codeAttr="size"
        value={mixedSize ? '' : (parseInt(commonSize || '12') || 12)}
        onChange={(v) => handleBatchChange('size', v.toString())}
        placeholder={mixedSize ? '—' : undefined}
      />

      <div className="property-row">
        <PropertyLabel codeAttr="align" className="property-label-text" />
        <div className="align-buttons">
          <button className={`align-btn ${!mixedAlign && effectiveAlign === 'l' ? ' active' : ''}`} onClick={() => handleBatchChange('align', 'l')} title="Left">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button className={`align-btn ${!mixedAlign && effectiveAlign === 'c' ? ' active' : ''}`} onClick={() => handleBatchChange('align', 'c')} title="Center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="3.5" y1="7" x2="10.5" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button className={`align-btn ${!mixedAlign && effectiveAlign === 'r' ? ' active' : ''}`} onClick={() => handleBatchChange('align', 'r')} title="Right">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </div>

      <div className="property-row">
        <PropertyLabel codeAttr="vertical-align" className="property-label-text" />
        <div className="align-buttons">
          <button className={`align-btn ${!mixedVAlign && effectiveVAlign === 't' ? ' active' : ''}`} onClick={() => handleBatchChange('vertical-align', 't')} title="Top">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="5" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button className={`align-btn ${!mixedVAlign && effectiveVAlign === 'm' ? ' active' : ''}`} onClick={() => handleBatchChange('vertical-align', 'm')} title="Middle">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="5.5" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button className={`align-btn ${!mixedVAlign && effectiveVAlign === 'b' ? ' active' : ''}`} onClick={() => handleBatchChange('vertical-align', 'b')} title="Bottom">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="8" width="6" height="3" fill="currentColor" opacity="0.3"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </div>

      <div className="property-row toggle-row">
        <PropertyLabel codeAttr="" fallbackLabel="样式" className="property-label-text toggle-row-label" />
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
          onClick={() => toggleTextDecoration('underline')}
        ><u>U</u></button>
        <button
          className={`toggle-btn ${mixedTextDecoration ? 'mixed' : ''} ${!mixedTextDecoration && allLineThrough ? 'active' : ''}`}
          onClick={() => toggleTextDecoration('line-through')}
        ><s>S</s></button>
      </div>

      <div className="padding-section">
        <div className="padding-grid">
          <DraggableNumberInput label="左边距" codeAttr="pl" value={mixedPl ? '' : parseVal(effectivePl)} onChange={(v) => handleBatchChange('pl', v.toString())} placeholder={mixedPl ? '—' : undefined} />
          <DraggableNumberInput label="上边距" codeAttr="pt" value={mixedPt ? '' : parseVal(effectivePt)} onChange={(v) => handleBatchChange('pt', v.toString())} placeholder={mixedPt ? '—' : undefined} />
          <DraggableNumberInput label="右边距" codeAttr="pr" value={mixedPr ? '' : parseVal(effectivePr)} onChange={(v) => handleBatchChange('pr', v.toString())} placeholder={mixedPr ? '—' : undefined} />
          <DraggableNumberInput label="下边距" codeAttr="pb" value={mixedPb ? '' : parseVal(effectivePb)} onChange={(v) => handleBatchChange('pb', v.toString())} placeholder={mixedPb ? '—' : undefined} />
        </div>
      </div>

      {showRowAttrs && (
        <>
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
