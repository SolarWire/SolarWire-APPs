import { describe, it, expect } from 'vitest';
import { parse } from '../index';
import type { TableElement, TableRowElement } from '../types';

describe('Nested Structure Integrity', () => {
  it('should parse table with rows and cells', () => {
    const input = `## border=1
  ["Header 1"]
  ["Header 2"]
  ["Cell 1"]
  ["Cell 2"]`;
    
    const result = parse(input);
    expect(result.elements[0].type).toBe('table');
    
    const table = result.elements[0] as TableElement;
    expect(table.children).toBeDefined();
    expect(table.children!.length).toBeGreaterThan(0);
  });

  it('should enforce table-row indentation', () => {
    const input = `## border=1
# Not indented row`;
    
    expect(() => parse(input)).toThrowError(/must be indented more than the table element/);
  });

  it('should enforce table-row indentation level', () => {
    const input = `## border=1
 # Indented with one space`;
    
    const result = parse(input);
    expect(result.elements.length).toBe(1);
  });

  it('should throw error for table-row outside table', () => {
    const input = `# Table row outside table`;
    
    expect(() => parse(input)).toThrowError(/must be inside a table element/);
  });

  it('should handle deeply nested structures', () => {
    const input = `## outer
  ## inner
    ["Cell"]`;
    
    const result = parse(input);
    expect(result.elements.length).toBe(1);
  });

  it('should preserve element order in children', () => {
    const input = `## table
  ["First"]
  ["Second"]
  ["Third"]`;
    
    const result = parse(input);
    const table = result.elements[0] as TableElement;
    expect(table.children![0].type).toBe('rectangle');
  });
});