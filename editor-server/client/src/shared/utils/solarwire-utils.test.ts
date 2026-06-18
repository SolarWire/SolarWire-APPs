import {
  detectNoteBounds,
  detectTableBounds
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
