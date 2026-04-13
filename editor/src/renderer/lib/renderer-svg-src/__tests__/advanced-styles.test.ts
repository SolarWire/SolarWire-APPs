import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('Advanced SVG Styles', () => {
  it('should apply gradient fill', () => {
    const ast = parse('["Gradient Box"] @(100,100) w=100 h=50 gradient=linear');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('linearGradient');
    expect(result).toContain('stop');
  });

  it('should apply border styles', () => {
    const ast = parse('["Bordered Box"] @(100,100) w=100 h=50 border=2 border-color=#FF0000');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('stroke-width');
    expect(result).toContain('#FF0000');
  });

  it('should apply shadow effects', () => {
    const ast = parse('["Shadow Box"] @(100,100) w=100 h=50 shadow');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('filter');
    expect(result).toContain('feDropShadow');
  });

  it('should apply font styles', () => {
    const ast = parse('["Styled Text"] @(100,100) font=Arial font-size=16 font-color=#333333');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('font-family');
    expect(result).toContain('font-size');
    expect(result).toContain('#333333');
  });
});
