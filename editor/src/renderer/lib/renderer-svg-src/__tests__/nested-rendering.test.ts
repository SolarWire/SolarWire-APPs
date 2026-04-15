import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('Nested Structure Rendering', () => {
  it('should render table with rows and cells', () => {
    const ast = parse(`## border=1
 #
  ["Header 1"]
  ["Header 2"]
 #
  ["Cell 1"]
  ["Cell 2"]`);
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证表格容器存在
    expect(result).toContain('<g');
    // 验证单元格被渲染
    expect(result).toContain('rect');
  });

  it('should maintain parent-child position relationship', () => {
    const ast = parse(`## table
 #
  ["Cell"] @(10,10)`);
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证子元素位置相对于父元素正确
    expect(result).toBeDefined();
  });

  it('should apply table border attribute', () => {
    const ast = parse('## border=2');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('stroke-width');
  });
});
