import { describe, it, expect } from 'vitest';
import { parse } from '../index';
import { render } from '../../renderer';
import type { ImageElement } from '../types';

describe('Image Element Rendering', () => {
  describe('Parser - Project Path Support', () => {
    it('should parse image with project-relative path', () => {
      const result = parse('<assets/images/logo.png> @(100, 100) w=200');
      expect(result.elements.length).toBe(1);
      const elem = result.elements[0] as ImageElement;
      expect(elem.type).toBe('image');
      expect(elem.url).toBe('assets/images/logo.png');
      expect(elem.coordinates?.x.value).toBe(100);
      expect(elem.coordinates?.y.value).toBe(100);
      expect(elem.attributes?.w).toBe('200');
    });

    it('should parse image with nested path', () => {
      const result = parse('<assets/icons/nav/home.svg> w=32');
      const elem = result.elements[0] as ImageElement;
      expect(elem.url).toBe('assets/icons/nav/home.svg');
    });

    it('should parse image with timestamp prefix', () => {
      const result = parse('<assets/images/1776760000000_photo.jpg> @(50, 50) w=400');
      const elem = result.elements[0] as ImageElement;
      expect(elem.url).toContain('assets/images/');
      expect(elem.url).toContain('_photo.jpg');
    });
  });

  describe('Renderer - SVG Output', () => {
    const mockImageUrlResolver = (url: string): string => {
      if (url.startsWith('assets/')) {
        return `/mock-project-root/${url}`;
      }
      return url;
    };

    it('should render image element with resolved URL', () => {
      const content = '<assets/images/test.png> @(100, 100) w=200';
      const ast = parse(content);
      
      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: content,
        imageUrlResolver: mockImageUrlResolver,
      }, true);

      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('/mock-project-root/assets/images/test.png');
      expect(result.svg).toContain('<image');
    });

    it('should render multiple images', () => {
      const content = `<assets/images/img1.png> @(100, 100) w=200
<assets/images/img2.jpg> @(400, 100) w=300`;
      
      const ast = parse(content);
      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: content,
        imageUrlResolver: mockImageUrlResolver,
      }, true);

      const imageMatches = result.svg.match(/<image/g) || [];
      expect(imageMatches.length).toBe(2);
    });

    it('should render image with notes', () => {
      const contentWithNote = `<assets/images/diagram.png> @(150, 150) w=350`;
      const ast = parse(contentWithNote);
      
      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: contentWithNote,
        imageUrlResolver: mockImageUrlResolver,
      }, true);

      expect(result.svg).toContain('/mock-project-root/assets/images/diagram.png');
    });

    it('should render image without notes when disabled', () => {
      const content = '<assets/images/photo.jpg> @(200, 200) w=300';
      const ast = parse(content);
      
      const result = render(ast, {
        disableNotes: true,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: content,
        imageUrlResolver: mockImageUrlResolver,
      }, true);

      expect(result.svg).toContain('/mock-project-root/assets/images/photo.jpg');
    });
  });

  describe('Integration - Full Pipeline', () => {
    it('should handle parse and render pipeline', () => {
      const content = `<assets/images/hero.png> @(200, 300) w=500

<assets/images/feature1.jpg> @(100, 500) w=200`;

      const ast = parse(content);
      expect(ast.elements.filter(el => el.type === 'image').length).toBe(2);

      const result = render(ast, {
        disableNotes: false,
        selectedElementIds: [],
        primaryColor: '#0066ff',
        sourceInput: content,
        imageUrlResolver: (url) => url.startsWith('assets/') ? `/root/${url}` : url,
      }, true);

      expect(result.svg).toContain('/root/assets/images/hero.png');
      expect(result.svg).toContain('/root/assets/images/feature1.jpg');
    });
  });
});
