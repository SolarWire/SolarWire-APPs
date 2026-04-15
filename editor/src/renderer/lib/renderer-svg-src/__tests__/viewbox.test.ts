import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('ViewBox Calculation', () => {
  it('should calculate viewBox to fit all elements', () => {
    const ast = parse(`
["Box1"] @(10,10) w=100 h=50
["Box2"] @(200,200) w=100 h=50
`);
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    }, true);
    
    expect(result.viewBox).toBeDefined();
    expect(result.viewBox.x).toBeLessThanOrEqual(10);
    expect(result.viewBox.y).toBeLessThanOrEqual(10);
    expect(result.viewBox.width).toBeGreaterThanOrEqual(290); // 200 + 100 - 10 + padding
    expect(result.viewBox.height).toBeGreaterThanOrEqual(240); // 200 + 50 - 10 + padding
  });

  it('should handle elements at origin', () => {
    const ast = parse('["Test"] @(0,0) w=100 h=50');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    }, true);
    
    expect(result.viewBox.x).toBeLessThanOrEqual(0);
    expect(result.viewBox.y).toBeLessThanOrEqual(0);
  });

  it('should handle negative coordinates', () => {
    const ast = parse('["Test"] @(-50,-50) w=100 h=50');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    }, true);
    
    expect(result.viewBox.x).toBeLessThanOrEqual(-50);
    expect(result.viewBox.y).toBeLessThanOrEqual(-50);
  });

  it('should include padding around elements', () => {
    const ast = parse('["Test"] @(100,100) w=100 h=50');
    
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    }, true);
    
    // 验证有内边距
    expect(result.viewBox.x).toBeLessThan(100);
    expect(result.viewBox.y).toBeLessThan(100);
  });
});
