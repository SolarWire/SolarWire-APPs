import { describe, it, expect } from 'vitest';
import { parse } from '../index';

describe('Parser Edge Cases', () => {
  describe('Special Characters in Text', () => {
    it('should handle escaped quotes in text', () => {
      const result = parse('"Text with \\"quotes\\""');
      expect(result.elements[0].type).toBe('text');
    });

    it('should handle HTML entities', () => {
      const result = parse('"Text with <>&"');
      expect(result.elements[0].type).toBe('text');
    });

    it('should handle Unicode characters', () => {
      const result = parse('"中文文本"');
      expect(result.elements[0].type).toBe('text');
    });

    it('should handle emoji in text', () => {
      const result = parse('"Hello 🌍"');
      expect(result.elements[0].type).toBe('text');
    });
  });

  describe('Coordinate Edge Cases', () => {
    it('should handle zero coordinates', () => {
      const result = parse('["Test"] @(0,0)');
      expect(result.elements[0].coordinates).toBeDefined();
    });

    it('should handle negative coordinates', () => {
      const result = parse('["Test"] @(-10,-20)');
      expect(result.elements[0].coordinates).toBeDefined();
    });

    it('should handle large coordinate values', () => {
      const result = parse('["Test"] @(999999,999999)');
      expect(result.elements[0].coordinates).toBeDefined();
    });

    it('should handle edge-relative coordinates (L, R, T, B, C)', () => {
      const result = parse('["Test"] @(L+10,R-20)');
      expect(result.elements[0].coordinates).toBeDefined();
    });
  });

  describe('Attribute Edge Cases', () => {
    it('should handle attributes with special characters', () => {
      const result = parse('["Test"] c=#FF5733 bg="dark blue"');
      expect(result.elements[0].attributes.c).toBe('#FF5733');
    });

    it('should handle boolean attributes', () => {
      const result = parse('["Test"] bold italic underline');
      expect(result.elements[0].attributes.bold).toBe('true');
      expect(result.elements[0].attributes.italic).toBe('true');
    });

    it('should handle empty attribute value', () => {
      const result = parse('["Test"] w=');
      expect(result.elements[0].attributes.w).toBeDefined();
    });
  });

  describe('Comment Handling', () => {
    it('should ignore inline comments', () => {
      const result = parse('["Test"] // This is a comment');
      expect(result.elements.length).toBe(1);
    });

    it('should ignore comment-only lines', () => {
      const result = parse('// Comment 1\n// Comment 2\n["Test"]');
      expect(result.elements.length).toBe(1);
    });

    it('should handle comments with special characters', () => {
      const result = parse('["Test"] // Comment with @#$%^&*()');
      expect(result.elements.length).toBe(1);
    });
  });
});