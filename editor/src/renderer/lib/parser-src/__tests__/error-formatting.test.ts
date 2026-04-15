import { describe, it, expect } from 'vitest';
import { parse } from '../index';

describe('Parser Error Formatting', () => {
  it('should provide helpful error message for invalid syntax', () => {
    const invalidInput = '[[[INVALID]]]';
    
    expect(() => parse(invalidInput)).toThrowError();
    
    try {
      parse(invalidInput);
    } catch (error: any) {
      expect(error.message).toContain('PARSE ERROR');
      expect(error.message).toContain('Location:');
      expect(error.message).toContain('Context:');
      expect(error.message).toContain('>>>');
    }
  });

  it('should show expected vs found tokens', () => {
    const input = '["Test" @(100,100';
    
    try {
      parse(input);
    } catch (error: any) {
      expect(error.message).toMatch(/Expected:/i);
      expect(error.message).toMatch(/Found:/i);
    }
  });

  it('should handle empty input gracefully', () => {
    const result = parse('');
    expect(result.declarations).toEqual([]);
    expect(result.elements).toEqual([]);
  });

  it('should handle whitespace-only input', () => {
    const result = parse('   \n\n  \t  ');
    expect(result.elements.length).toBe(0);
  });

  it('should reject multiple elements on same line', () => {
    const input = '["Box1"] ["Box2"]';
    
    expect(() => parse(input)).toThrowError(/Multiple elements on the same line/);
  });
});