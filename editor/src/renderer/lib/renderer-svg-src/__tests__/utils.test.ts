import { describe, it, expect, beforeEach } from 'vitest';
import { createRenderContext } from '../context';
import { generateElementId, addGradientDef, addShadowDef, isElementSelected, generateResizeHandles, getElementRole, getElementAriaLabel } from '../utils';

describe('SVG Utils', () => {
  let context: any;
  
  beforeEach(() => {
    context = createRenderContext();
  });

  it('should generate unique element IDs', () => {
    const id1 = generateElementId(context);
    const id2 = generateElementId(context);
    
    expect(id1).toBe('element-1');
    expect(id2).toBe('element-2');
    expect(id1).not.toBe(id2);
  });

  it('should add gradient definition to context.defs', () => {
    const gradientUrl = addGradientDef(context, 'test-1');
    
    expect(gradientUrl).toBe('url(#gradient-test-1)');
    expect(context.defs.length).toBe(1);
    expect(context.defs[0]).toContain('linearGradient');
    expect(context.defs[0]).toContain('gradient-test-1');
  });

  it('should add shadow definition to context.defs', () => {
    const shadowUrl = addShadowDef(context, 'test-1');
    
    expect(shadowUrl).toBe('url(#shadow-test-1)');
    expect(context.defs.length).toBe(1);
    expect(context.defs[0]).toContain('filter');
    expect(context.defs[0]).toContain('shadow-test-1');
  });

  it('should check if element is selected by ID', () => {
    const element = { id: 'test-id' };
    context.selectedElementIds = ['test-id'];
    
    expect(isElementSelected(element, context, 'element-1')).toBe(true);
  });

  it('should check if element is selected by line number', () => {
    const element = { location: { line: 5 } };
    context.selectedElementIds = ['5'];
    
    expect(isElementSelected(element, context, 'element-1')).toBe(true);
  });

  it('should check if element is selected by element ID', () => {
    const element = {};
    context.selectedElementIds = ['element-1'];
    
    expect(isElementSelected(element, context, 'element-1')).toBe(true);
  });

  it('should generate resize handles', () => {
    const handles = generateResizeHandles(100, 100, 200, 100, '#FF0000');
    
    expect(handles.length).toBe(8);
    expect(handles[0]).toContain('data-handle="nw"');
    expect(handles[1]).toContain('data-handle="n"');
    expect(handles[2]).toContain('data-handle="ne"');
    expect(handles[3]).toContain('data-handle="e"');
    expect(handles[4]).toContain('data-handle="se"');
    expect(handles[5]).toContain('data-handle="s"');
    expect(handles[6]).toContain('data-handle="sw"');
    expect(handles[7]).toContain('data-handle="w"');
  });

  it('should get element role', () => {
    const element1 = { attributes: { role: 'button' } };
    const element2 = { text: 'Button' };
    const element3 = { text: 'Other' };
    
    expect(getElementRole(element1)).toBe('button');
    expect(getElementRole(element2)).toBe('button');
    expect(getElementRole(element3)).toBe('region');
  });

  it('should get element aria label', () => {
    const element1 = { text: 'Test Element' };
    const element2 = {};
    
    expect(getElementAriaLabel(element1)).toBe('Test Element');
    expect(getElementAriaLabel(element2)).toBe('Rectangle');
  });
});
