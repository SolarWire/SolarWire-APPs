import { describe, it, expect } from 'vitest';
import {
  detectElementBounds,
  detectTableBounds,
  detectNoteBounds,
  detectMultilineTextBounds,
  getElementStartLine,
  ElementType,
} from '../shared/utils/element-bounds';

describe('detectElementBounds', () => {
  it('检测简单矩形元素', () => {
    const content = '["按钮"] @(10, 20) w=100';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
    expect(bounds.elementLine).toBe(1);
    expect(bounds.attributeLine).toBe(1);
  });

  it('检测圆形元素', () => {
    const content = '("OK") @(10, 20) w=50';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('检测文本元素', () => {
    const content = '"Hello" @(10, 20)';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('检测线段元素', () => {
    const content = '-- @(0, 0)->(100, 50)';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('检测占位符元素', () => {
    const content = '[?"Image"] @(10, 20)';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('检测图片元素', () => {
    const content = '<./img.png> @(10, 20)';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('检测表格元素', () => {
    const content = '## @(0, 0) w=600\n  #\n    "A"\n    "B"';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.Table);
    expect(bounds.tableBounds).toBeDefined();
    expect(bounds.tableBounds!.headerLine).toBe(1);
    expect(bounds.tableBounds!.tableEndLine).toBe(4);
  });

  it('检测多行文本元素', () => {
    const content = '"""line1\nline2\nline3"""';
    const bounds = detectElementBounds(content, 1);
    expect(bounds.type).toBe(ElementType.MultilineText);
  });

  it('行号超出范围', () => {
    const content = '["按钮"] @(10, 20)';
    const bounds = detectElementBounds(content, 5);
    expect(bounds.type).toBe(ElementType.Simple);
  });

  it('行号为0', () => {
    const content = '["按钮"] @(10, 20)';
    const bounds = detectElementBounds(content, 0);
    expect(bounds.type).toBe(ElementType.Simple);
  });
});

describe('detectTableBounds', () => {
  it('简单表格', () => {
    const content = '## @(0, 0) w=600\n  #\n    "A"\n    "B"';
    const { startLine, endLine } = detectTableBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(4);
  });

  it('表格后跟其他元素', () => {
    const content = '## @(0, 0) w=600\n  #\n    "A"\n["按钮"] @(10, 20)';
    const { startLine, endLine } = detectTableBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(3);
  });

  it('表格是最后一个元素', () => {
    const content = '## @(0, 0) w=600\n  #\n    "A"';
    const { startLine, endLine } = detectTableBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(3);
  });

  it('非表格行返回自身', () => {
    const content = '["按钮"] @(10, 20)';
    const { startLine, endLine } = detectTableBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(1);
  });
});

describe('detectNoteBounds', () => {
  it('单行 note', () => {
    const content = '[] @(10, 20) note="""test"""';
    const { startLine, endLine } = detectNoteBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(1);
  });

  it('多行 note', () => {
    const content = '[] @(10, 20) note="""line1\nline2"""';
    const { startLine, endLine } = detectNoteBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(2);
  });
});

describe('detectMultilineTextBounds', () => {
  it('单行三引号文本', () => {
    const content = '"""single line""" @(10, 20)';
    const { startLine, endLine } = detectMultilineTextBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(1);
  });

  it('多行三引号文本', () => {
    const content = '"""line1\nline2\nline3"""';
    const { startLine, endLine } = detectMultilineTextBounds(content, 1);
    expect(startLine).toBe(1);
    expect(endLine).toBe(3);
  });
});

describe('getElementStartLine', () => {
  it('简单元素返回自身行号', () => {
    const content = '["按钮"] @(10, 20)';
    expect(getElementStartLine(content, 1)).toBe(1);
  });

  it('表格元素返回声明行', () => {
    const content = '## @(0, 0) w=600\n  #\n    "A"';
    expect(getElementStartLine(content, 1)).toBe(1);
  });

  it('多行文本返回起始行', () => {
    const content = '"""line1\nline2"""';
    expect(getElementStartLine(content, 1)).toBe(1);
  });

  it('行号超出范围返回自身', () => {
    const content = '["按钮"] @(10, 20)';
    expect(getElementStartLine(content, 5)).toBe(5);
  });
});
