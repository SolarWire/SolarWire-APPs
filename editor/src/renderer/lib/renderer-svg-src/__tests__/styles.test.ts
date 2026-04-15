import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('SVG Style Application', () => {
  it('should apply custom color attribute', () => {
    const ast = parse('["Test"] c=#FF5733');
    const result = render(ast, { 
      disableNotes: false, 
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('#FF5733');
  });

  it('should apply width and height attributes', () => {
    const ast = parse('["Box"] w=200 h=100');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证 SVG 中包含尺寸信息
    expect(result).toMatch(/width=["']?200/);
    expect(result).toMatch(/height=["']?100/);
  });

  it('should apply bold attribute as font-weight', () => {
    const ast = parse('"Bold Text" bold');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('font-weight');
    expect(result).toContain('bold');
  });

  it('should use primaryColor for selected elements', () => {
    const ast = parse('["Selected"]\n["Normal"]');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: ['1'], // 选中第一个元素
      primaryColor: '#FF0000',
      sourceInput: ''
    });
    
    // 验证选中元素使用主色
    expect(result).toContain('#FF0000');
  });
});
