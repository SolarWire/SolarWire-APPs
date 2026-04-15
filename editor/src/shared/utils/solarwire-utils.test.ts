import {
  detectNoteBounds,
  detectTableBounds,
  hasDoubleQuoteNotes,
  convertDoubleQuoteNotesToTriple
} from './solarwire-utils';

// 测试 detectNoteBounds 函数
describe('detectNoteBounds', () => {
  it('应该正确检测单行双引号note的边界', () => {
    const content = '"test" note="This is a note"';
    const result = detectNoteBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 1 });
  });

  it('应该正确检测单行单引号note的边界', () => {
    const content = '"test" note=\'This is a note\'';
    const result = detectNoteBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 1 });
  });

  it('应该正确检测多行三引号note的边界', () => {
    const content = '"test" note="""This is a\nmultiline note"""';
    const result = detectNoteBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 2 });
  });

  it('应该正确检测跨行三引号note的边界', () => {
    const content = '"test" note="""This is a\nmultiline note\nwith multiple lines"""';
    const result = detectNoteBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 3 });
  });

  it('应该正确检测独立行note的边界', () => {
    const content = '"test"\nnote="This is a note"';
    const result = detectNoteBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 2 });
  });
});

// 测试 detectTableBounds 函数
describe('detectTableBounds', () => {
  it('应该正确检测表格的边界', () => {
    const content = '## Table\n  - Row 1\n  - Row 2\n"test"';
    const result = detectTableBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 3 });
  });

  it('应该正确检测文件末尾的表格边界', () => {
    const content = '## Table\n  - Row 1\n  - Row 2';
    const result = detectTableBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 3 });
  });

  it('应该正确检测包含注释和空行的表格边界', () => {
    const content = '## Table\n  - Row 1\n  # Comment\n  - Row 2\n\n"test"';
    const result = detectTableBounds(content, 1);
    expect(result).toEqual({ startLine: 1, endLine: 5 });
  });
});

// 测试 hasDoubleQuoteNotes 函数
describe('hasDoubleQuoteNotes', () => {
  it('应该检测到双引号note', () => {
    const content = '"test" note="This is a note"';
    const result = hasDoubleQuoteNotes(content);
    expect(result).toBe(true);
  });

  it('应该检测到单引号note', () => {
    const content = '"test" note=\'This is a note\'';
    const result = hasDoubleQuoteNotes(content);
    expect(result).toBe(true);
  });

  it('应该忽略三引号note', () => {
    const content = '"test" note="""This is a note"""';
    const result = hasDoubleQuoteNotes(content);
    expect(result).toBe(false);
  });

  it('应该返回false当没有note时', () => {
    const content = '"test"';
    const result = hasDoubleQuoteNotes(content);
    expect(result).toBe(false);
  });
});

// 测试 convertDoubleQuoteNotesToTriple 函数
describe('convertDoubleQuoteNotesToTriple', () => {
  it('应该将双引号note转换为三引号', () => {
    const content = '"test" note="This is a note"';
    const result = convertDoubleQuoteNotesToTriple(content);
    expect(result).toBe('"test" note="""This is a note"""');
  });

  it('应该将单引号note转换为三引号', () => {
    const content = '"test" note=\'This is a note\'';
    const result = convertDoubleQuoteNotesToTriple(content);
    expect(result).toBe('"test" note="""This is a note"""');
  });

  it('应该保持三引号note不变', () => {
    const content = '"test" note="""This is a note"""';
    const result = convertDoubleQuoteNotesToTriple(content);
    expect(result).toBe('"test" note="""This is a note"""');
  });

  it('应该处理多个note', () => {
    const content = '"test1" note="Note 1"\n"test2" note=\'Note 2\'';
    const result = convertDoubleQuoteNotesToTriple(content);
    expect(result).toBe('"test1" note="""Note 1"""\n"test2" note="""Note 2"""');
  });
});
