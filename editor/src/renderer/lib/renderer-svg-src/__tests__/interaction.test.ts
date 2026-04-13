import { describe, it, expect } from 'vitest';
import { parse } from '../../parser-src';
import { render } from '../index';

describe('SVG Interaction', () => {
  it('should add data attributes for interaction', () => {
    const ast = parse('["Interactive Box"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('data-element-id');
    expect(result).toContain('class="svg-element"');
  });

  it('should highlight selected elements', () => {
    const ast = parse('["Selected Box"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: ['1'], // 假设元素ID为1
      primaryColor: '#FF0000',
      sourceInput: ''
    });
    
    expect(result).toContain('class="svg-element selected"');
    expect(result).toContain('#FF0000');
  });

  it('should add resize handles for selected elements', () => {
    const ast = parse('["Resizable Box"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: ['1'],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('data-handle');
    expect(result).toContain('resize-handle');
  });

  it('should add draggable attribute', () => {
    const ast = parse('["Draggable Box"] @(100,100) w=100 h=50');
    const result = render(ast, {
      disableNotes: false,
      selectedElementIds: [],
      primaryColor: '#000000',
      sourceInput: ''
    });
    
    expect(result).toContain('draggable="true"');
  });
});
