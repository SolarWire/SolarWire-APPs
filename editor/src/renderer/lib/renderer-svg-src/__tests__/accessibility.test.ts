import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('SVG Accessibility', () => {
  it('should add ARIA labels to elements', () => {
    const ast = parse('["Accessible Box"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('aria-label');
    expect(result).toContain('Accessible Box');
  });

  it('should add role attributes', () => {
    const ast = parse('["Button"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('role="button"');
  });

  it('should ensure proper color contrast', () => {
    const ast = parse('["High Contrast"] @(100,100) w=100 h=50 c=#FFFFFF bg=#000000');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    // 验证颜色值正确设置
    expect(result).toContain('fill="#FFFFFF"');
    expect(result).toContain('fill="#000000"');
  });

  it('should support keyboard navigation', () => {
    const ast = parse('["Keyboard Navigable"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('tabindex="0"');
  });
});
