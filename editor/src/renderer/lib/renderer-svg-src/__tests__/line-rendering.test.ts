import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('Line Element Rendering', () => {
  it('should render line with absolute coordinates', () => {
    const ast = parse('-- @(10,10)->(100,100)');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('line');
    expect(result).toContain('x1');
    expect(result).toContain('y1');
  });

  it('should render line with label', () => {
    const ast = parse('--"label"-- @(10,10)->(100,100)');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('label');
    expect(result).toContain('text');
  });

  it('should render line with relative end', () => {
    const ast = parse('-- @(10,10)->(+50,+20)');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('line');
  });

  it('should render arrow head on line end', () => {
    const ast = parse('-- @(10,10)->(100,100)');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证箭头标记存在
    expect(result).toMatch(/marker-end|arrowhead|polygon/);
  });
});
