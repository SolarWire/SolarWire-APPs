import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('SVG Renderer Performance Optimization', () => {
  it('should render 200 elements within 100ms', () => {
    // 生成 200 个元素的代码
    let code = '';
    for (let i = 0; i < 200; i++) {
      code += `["Box${i}"] @(${i % 20 * 60},${Math.floor(i / 20) * 40}) w=50 h=30\n`;
    }
    
    const ast = parse(code);
    
    const start = performance.now();
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    const elapsed = performance.now() - start;
    
    expect(result).toContain('<rect');
    expect(elapsed).toBeLessThan(100);
  });

  it('should use <defs> for reusable elements', () => {
    // 多个元素使用相同的样式
    const ast = parse(`["Box1"] @(100,100) w=50 h=30\n["Box2"] @(200,100) w=50 h=30`);
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证是否使用了 <defs> 来定义可重用元素
    expect(result).toContain('<defs>');
  });

  it('should handle large documents without memory issues', () => {
    // 生成 1000 个元素
    let code = '';
    for (let i = 0; i < 1000; i++) {
      code += `["E${i}"] @(${i % 30 * 40},${Math.floor(i / 30) * 30})\n`;
    }
    
    const ast = parse(code);
    
    expect(() => {
      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#000000',
        sourceInput: ''
      });
      expect(result.length).toBeGreaterThan(10000);
    }).not.toThrow();
  });
});
