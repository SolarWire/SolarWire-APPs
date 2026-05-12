import { describe, it, expect } from 'vitest';
import {
  parseTableFromSource,
  serializeTableToSource,
  createDefaultTableSource,
  ensureTableHasRows,
} from '../shared/utils/table-source-utils';
import type { TableData, TableRow, TableCell } from '../shared/utils/table-source-utils';
import type { TableElement, TableRowElement, BaseElement } from '../lib/parser/types';

function makeTableElement(overrides: Partial<TableElement> = {}): TableElement {
  return {
    type: 'table',
    location: { line: 1, column: 1 },
    attributes: {},
    children: [],
    ...overrides,
  } as TableElement;
}

function makeRowElement(cells: Partial<BaseElement>[] = [], attrs: Record<string, string> = {}): TableRowElement {
  return {
    type: 'table-row',
    location: { line: 1, column: 1 },
    attributes: attrs,
    children: cells.map(c => ({
      type: 'table-cell',
      location: { line: 1, column: 1 },
      attributes: {},
      ...c,
    })),
  } as TableRowElement;
}

function makeCellElement(text: string, attrs: Record<string, string> = {}): BaseElement & { text: string } {
  return {
    type: 'table-cell',
    location: { line: 1, column: 1 },
    attributes: attrs,
    text,
  } as BaseElement & { text: string };
}

function makeTableData(overrides: Partial<TableData> = {}): TableData {
  return {
    line: 1,
    attrs: { w: 600, border: 1, cellspacing: 0, b: '#333333' },
    rows: [
      {
        attrs: {},
        cells: [
          { text: 'A', colspan: 1, rowspan: 1, attrs: {} },
          { text: 'B', colspan: 1, rowspan: 1, attrs: {} },
        ],
      },
    ],
    ...overrides,
  };
}

describe('parseTableFromSource', () => {
  it('解析简单表格', () => {
    const table = makeTableElement({
      attributes: { w: '600', border: '1' },
      coordinates: { x: { type: 'absolute', value: 0 }, y: { type: 'absolute', value: 0 } },
      children: [
        makeRowElement([
          makeCellElement('A'),
          makeCellElement('B'),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(1);
    expect(result!.rows[0].cells).toHaveLength(2);
    expect(result!.rows[0].cells[0].text).toBe('A');
    expect(result!.rows[0].cells[1].text).toBe('B');
  });

  it('解析带属性的单元格', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: { x: { type: 'absolute', value: 10 }, y: { type: 'absolute', value: 20 } },
      children: [
        makeRowElement([
          makeCellElement('Bold', { bold: 'true', bg: '#FF0000' }),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].cells[0].attrs.bold).toBe(true);
    expect(result!.rows[0].cells[0].attrs.bg).toBe('#FF0000');
  });

  it('解析带行属性的行', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: undefined,
      children: [
        makeRowElement([makeCellElement('A')], { bg: '#EEE', c: '#333' }),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].attrs.bg).toBe('#EEE');
    expect(result!.rows[0].attrs.c).toBe('#333');
  });

  it('解析 colspan/rowspan', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: undefined,
      children: [
        makeRowElement([
          makeCellElement('Wide', { colspan: '2', rowspan: '3' }),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].cells[0].colspan).toBe(2);
    expect(result!.rows[0].cells[0].rowspan).toBe(3);
  });

  it('解析坐标属性', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: { x: { type: 'absolute', value: 100 }, y: { type: 'absolute', value: 200 } },
      children: [],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.attrs.x).toBe(100);
    expect(result!.attrs.y).toBe(200);
  });

  it('解析空表格', () => {
    const table = makeTableElement({
      attributes: {},
      coordinates: undefined,
      children: [],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(0);
  });

  it('解析单元格 align 和 vertical-align', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: undefined,
      children: [
        makeRowElement([
          makeCellElement('Center', { align: 'c', 'vertical-align': 'm' }),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].cells[0].attrs.align).toBe('c');
    expect(result!.rows[0].cells[0].attrs['vertical-align']).toBe('m');
  });

  it('解析单元格 text-decoration', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: undefined,
      children: [
        makeRowElement([
          makeCellElement('Under', { 'text-decoration': 'underline' }),
          makeCellElement('Strike', { 'text-decoration': 'line-through' }),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].cells[0].attrs['text-decoration']).toBe('underline');
    expect(result!.rows[0].cells[1].attrs['text-decoration']).toBe('line-through');
  });

  it('解析单元格 padding', () => {
    const table = makeTableElement({
      attributes: { w: '600' },
      coordinates: undefined,
      children: [
        makeRowElement([
          makeCellElement('Padded', { 'padding-top': '10', 'padding-right': '5', 'padding-bottom': '10', 'padding-left': '5' }),
        ]),
      ],
    });

    const result = parseTableFromSource(table);
    expect(result).not.toBeNull();
    expect(result!.rows[0].cells[0].attrs['padding-top']).toBe('10');
    expect(result!.rows[0].cells[0].attrs['padding-right']).toBe('5');
    expect(result!.rows[0].cells[0].attrs['padding-bottom']).toBe('10');
    expect(result!.rows[0].cells[0].attrs['padding-left']).toBe('5');
  });
});

describe('serializeTableToSource', () => {
  it('序列化简单表格', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
    });
    const original = '## @(0, 0) w=600\n  #\n    "A"\n    "B"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('## @(0, 0) w=600');
    expect(result).toContain('"A"');
    expect(result).toContain('"B"');
  });

  it('序列化带属性的单元格', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Bold', colspan: 1, rowspan: 1, attrs: { bold: true, bg: '#FF0000' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Bold"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('bold');
    expect(result).toContain('bg=#FF0000');
  });

  it('序列化带行属性的行', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: { bg: '#EEE' },
        cells: [
          { text: 'A', colspan: 1, rowspan: 1, attrs: {} },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "A"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('bg=#EEE');
  });

  it('序列化 colspan/rowspan', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Wide', colspan: 2, rowspan: 3, attrs: {} },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Wide"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('colspan=2');
    expect(result).toContain('rowspan=3');
  });

  it('序列化保留坐标', () => {
    const data = makeTableData({
      line: 1,
      attrs: { x: 100, y: 200, w: 600, border: 1, cellspacing: 0, b: '#333333' },
    });
    const original = '## @(100, 200) w=600\n  #\n    "A"\n    "B"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('@(100, 200)');
  });

  it('序列化单元格 align', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Center', colspan: 1, rowspan: 1, attrs: { align: 'c' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Center"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('align=c');
  });

  it('序列化单元格 vertical-align', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Mid', colspan: 1, rowspan: 1, attrs: { 'vertical-align': 'm' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Mid"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('vertical-align=m');
  });

  it('序列化单元格 text-decoration', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Under', colspan: 1, rowspan: 1, attrs: { 'text-decoration': 'underline' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Under"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('text-decoration=underline');
  });

  it('序列化单元格 padding', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: {},
        cells: [
          { text: 'Pad', colspan: 1, rowspan: 1, attrs: { 'padding-top': '10', 'padding-right': '5', 'padding-bottom': '10', 'padding-left': '5' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "Pad"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('padding-top=10');
    expect(result).toContain('padding-right=5');
    expect(result).toContain('padding-bottom=10');
    expect(result).toContain('padding-left=5');
  });

  it('序列化后不重复行属性到单元格', () => {
    const data = makeTableData({
      attrs: { x: 0, y: 0, w: 600, border: 1, cellspacing: 0, b: '#333333' },
      rows: [{
        attrs: { bg: '#EEE' },
        cells: [
          { text: 'A', colspan: 1, rowspan: 1, attrs: { bg: '#EEE' } },
        ],
      }],
    });
    const original = '## @(0, 0) w=600\n  #\n    "A"';

    const result = serializeTableToSource(data, original);
    expect(result).toContain('bg=#EEE');
    const bgCount = (result.match(/bg=#EEE/g) || []).length;
    expect(bgCount).toBe(1);
  });

  it('行号超出范围返回原内容', () => {
    const data = makeTableData({ line: 99 });
    const original = '## @(0, 0) w=600';
    expect(serializeTableToSource(data, original)).toBe(original);
  });
});

describe('createDefaultTableSource', () => {
  it('生成 3x3 默认表格', () => {
    const result = createDefaultTableSource();
    const lines = result.split('\n');

    expect(lines[0]).toContain('##');
    expect(lines[0]).toContain('w=600');
    expect(lines).toHaveLength(13);
  });

  it('默认表格有坐标', () => {
    const result = createDefaultTableSource();
    expect(result).toContain('@(0, 0)');
  });

  it('默认表格有 3 行', () => {
    const result = createDefaultTableSource();
    const lines = result.split('\n');
    const rowLines = lines.filter(l => l.trim().startsWith('#') && !l.trim().startsWith('##'));
    expect(rowLines).toHaveLength(3);
  });
});

describe('ensureTableHasRows', () => {
  it('空表格声明补充 3x3 行', () => {
    const code = '## @(912, 534) w=200 h=100';
    const result = ensureTableHasRows(code);
    expect(result).toContain('## @(912, 534) w=200 h=100');
    const lines = result.split('\n');
    const rowLines = lines.filter(l => l.trim().startsWith('#') && !l.trim().startsWith('##'));
    expect(rowLines).toHaveLength(3);
  });

  it('已有行的表格不补充', () => {
    const code = '## @(0, 0) w=600\n  #\n    "A"\n    "B"';
    const result = ensureTableHasRows(code);
    expect(result).toBe(code);
  });

  it('多元素文档中空表格补充行', () => {
    const code = '["按钮"] @(10, 20)\n## @(100, 200) w=300';
    const result = ensureTableHasRows(code);
    const lines = result.split('\n');
    const rowLines = lines.filter(l => l.trim().startsWith('#') && !l.trim().startsWith('##'));
    expect(rowLines).toHaveLength(3);
  });

  it('无坐标的空表格也补充行', () => {
    const code = '## w=600';
    const result = ensureTableHasRows(code);
    const lines = result.split('\n');
    const rowLines = lines.filter(l => l.trim().startsWith('#') && !l.trim().startsWith('##'));
    expect(rowLines).toHaveLength(3);
  });

  it('非表格代码不变', () => {
    const code = '["按钮"] @(10, 20) w=100';
    const result = ensureTableHasRows(code);
    expect(result).toBe(code);
  });
});
