import { describe, it, expect } from 'vitest';
import { parse } from '../lib/parser';
import { parseTableFromSource, serializeTableToSource } from '../shared/utils/table-source-utils';

const SOURCE_WITH_CELL_NOTE = `## @(0, 0) w=400 h=160
  # bg=#fafafa bold
    ["查看/审核"] c=#2563EB note="""
1. 点击后跳转至发票详情页（P6）
2. 展示发票完整信息"""
    ["姓名"] vertical-align=m padding-left=6
  # bg=#ffffff
    ["技术部"] rowspan=2 align=c vertical-align=m
    ["张三"] align=c vertical-align=m`;

const SOURCE_WITH_NOTE_AND_OTHER_ELEMENTS = `## @(0, 0) w=400 h=160
  # bg=#fafafa bold
    ["查看/审核"] c=#2563EB note="""
1. 点击后跳转至发票详情页（P6）
2. 展示发票完整信息"""
    ["姓名"] vertical-align=m padding-left=6
  # bg=#ffffff
    ["技术部"] rowspan=2 align=c vertical-align=m
    ["张三"] align=c vertical-align=m
["按钮"] @(100, 200)
["另一个元素"] @(300, 400)`;

describe('cell note row end detection', () => {
  it('correctly detects table end with cell note - no extra content', () => {
    const ast = parse(SOURCE_WITH_CELL_NOTE);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    const result = serializeTableToSource(tableData!, SOURCE_WITH_CELL_NOTE);
    console.log('=== Result (no extra) ===');
    console.log(result);

    const ast2 = parse(result);
    expect(ast2.elements.length).toBe(1);
    expect(ast2.elements[0].type).toBe('table');
  });

  it('correctly detects table end with cell note - with other elements after table', () => {
    const ast = parse(SOURCE_WITH_NOTE_AND_OTHER_ELEMENTS);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    const result = serializeTableToSource(tableData!, SOURCE_WITH_NOTE_AND_OTHER_ELEMENTS);
    console.log('=== Result (with extra) ===');
    console.log(result);

    const ast2 = parse(result);
    const tables = ast2.elements.filter(el => el.type === 'table');
    const buttons = ast2.elements.filter(el => el.type === 'rectangle');
    console.log('Elements after re-parse:', ast2.elements.map(e => e.type));
    expect(tables.length).toBe(1);
    expect(buttons.length).toBe(2);
  });

  it('preserves all rows when cell has note', () => {
    const ast = parse(SOURCE_WITH_CELL_NOTE);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    expect(tableData!.rows).toHaveLength(2);
    expect(tableData!.rows[0].cells).toHaveLength(2);
    expect(tableData!.rows[1].cells).toHaveLength(2);
  });
});
