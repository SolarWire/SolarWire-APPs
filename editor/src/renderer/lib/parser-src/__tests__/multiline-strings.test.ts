import { describe, it, expect } from 'vitest';
import { parse } from '../index';

describe('Multiline String Handling', () => {
  it('should handle triple-quoted strings', () => {
    const input = `"""
Line 1
Line 2
Line 3
"""`;
    
    const result = parse(input);
    expect(result.elements[0].type).toBe('text');
    expect(result.elements[0].text).toContain('Line 1');
    expect(result.elements[0].text).toContain('Line 2');
  });

  it('should handle escaped newlines in double quotes', () => {
    const result = parse('"Line 1\\nLine 2"');
    expect(result.elements[0].text).toBe('Line 1\nLine 2');
  });

  it('should handle mixed quotes inside strings', () => {
    const result = parse('"Text with \'single\' and \\"double\\" quotes"');
    expect(result.elements[0].type).toBe('text');
  });

  it('should handle empty strings', () => {
    const result = parse('""');
    expect(result.elements[0].type).toBe('text');
    expect(result.elements[0].text).toBe('');
  });
});