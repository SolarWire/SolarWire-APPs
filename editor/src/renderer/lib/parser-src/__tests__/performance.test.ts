import { describe, it, expect } from 'vitest';
import { parse } from '../index';

describe('Parser Performance', () => {
  it('should parse 100 elements within 100ms', () => {
    let code = '';
    for (let i = 0; i < 100; i++) {
      code += `["Box${i}"] @(${i * 10},0) w=50 h=30\n`;
    }
    
    const start = performance.now();
    const result = parse(code);
    const elapsed = performance.now() - start;
    
    expect(result.elements.length).toBe(100);
    expect(elapsed).toBeLessThan(100);
  });

  it('should parse 500 elements within 500ms', () => {
    let code = '';
    for (let i = 0; i < 500; i++) {
      code += `["Item${i}"] @(${i % 20 * 50},${Math.floor(i / 20) * 50})\n`;
    }
    
    const start = performance.now();
    const result = parse(code);
    const elapsed = performance.now() - start;
    
    expect(result.elements.length).toBe(500);
    expect(elapsed).toBeLessThan(500);
  });

  it('should handle 1000+ elements without crash', () => {
    let code = '';
    for (let i = 0; i < 1000; i++) {
      code += `["E${i}"] @(${i * 5},0)\n`;
    }
    
    expect(() => parse(code)).not.toThrow();
  });
});