import { describe, it, expect } from 'vitest';
import { parse } from '../lib/parser';
import { parseTableFromSource, serializeTableToSource } from '../shared/utils/table-source-utils';

const SOURCE_NOTE_IN_LAST_ROW = `## @(0, 0) w=400 h=160
  # bg=#fafafa bold
    ["姓名"] vertical-align=m padding-left=6
    ["职位"] vertical-align=m padding-left=6
  # bg=#ffffff
    ["张三"] align=c vertical-align=m
    ["查看/审核"] c=#2563EB note="""
1. 点击后跳转至发票详情页（P6）
2. 展示发票完整信息"""`;

const SOURCE_NOTE_IN_LAST_ROW_WITH_OTHER = `## @(0, 0) w=400 h=160
  # bg=#fafafa bold
    ["姓名"] vertical-align=m padding-left=6
    ["职位"] vertical-align=m padding-left=6
  # bg=#ffffff
    ["张三"] align=c vertical-align=m
    ["查看/审核"] c=#2563EB note="""
1. 点击后跳转至发票详情页（P6）
2. 展示发票完整信息"""
["按钮"] @(100, 200)`;

describe('cell note in last row', () => {
  it('correctly detects table end when note is in last cell of last row', () => {
    const ast = parse(SOURCE_NOTE_IN_LAST_ROW);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    const result = serializeTableToSource(tableData!, SOURCE_NOTE_IN_LAST_ROW);
    console.log('=== Result (note in last row) ===');
    console.log(result);

    const ast2 = parse(result);
    expect(ast2.elements.length).toBe(1);
    expect(ast2.elements[0].type).toBe('table');
  });

  it('preserves elements after table when note is in last cell', () => {
    const ast = parse(SOURCE_NOTE_IN_LAST_ROW_WITH_OTHER);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    const result = serializeTableToSource(tableData!, SOURCE_NOTE_IN_LAST_ROW_WITH_OTHER);
    console.log('=== Result (note in last row + other elements) ===');
    console.log(result);

    const ast2 = parse(result);
    console.log('Elements after re-parse:', ast2.elements.map(e => e.type));
    expect(ast2.elements.length).toBe(2);
    expect(ast2.elements[0].type).toBe('table');
    expect(ast2.elements[1].type).toBe('rectangle');
  });

  it('preserves note content after edit in last row', () => {
    const ast = parse(SOURCE_NOTE_IN_LAST_ROW_WITH_OTHER);
    const tableEl = ast.elements.find(el => el.type === 'table');
    const tableData = parseTableFromSource(tableEl! as any);

    tableData!.rows[1].cells[1].attrs.align = 'c';
    tableData!.rows[1].cells[1].attrs['vertical-align'] = 'm';

    const result = serializeTableToSource(tableData!, SOURCE_NOTE_IN_LAST_ROW_WITH_OTHER);
    console.log('=== Result after edit ===');
    console.log(result);

    expect(result).toContain('note="""');
    expect(result).toContain('点击后跳转至发票详情页');
    expect(result).toContain('["按钮"]');

    const ast2 = parse(result);
    expect(ast2.elements.length).toBe(2);
  });
});
