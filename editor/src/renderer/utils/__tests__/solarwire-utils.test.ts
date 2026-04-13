import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerSolarWireLanguage,
  escapeNoteValue,
  unescapeNoteValue,
  updateLineCoords,
  updateLineAttribute,
  bringElementsToFront,
  getElementRelatedLines,
  alignElements,
  hasDoubleQuoteNotes,
  convertDoubleQuoteNotesToTriple
} from '../solarwire-utils';

describe('SolarWire Utils', () => {
  describe('registerSolarWireLanguage', () => {
    it('should register solarwire language when monaco is available', () => {
      const mockMonaco = {
        languages: {
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn()
        }
      };
      
      (window as any).monaco = mockMonaco;
      
      registerSolarWireLanguage();
      
      expect(mockMonaco.languages.register).toHaveBeenCalledWith({ id: 'solarwire' });
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalled();
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalled();
      
      delete (window as any).monaco;
    });

    it('should do nothing when monaco is not available', () => {
      delete (window as any).monaco;
      
      expect(() => registerSolarWireLanguage()).not.toThrow();
    });
  });

  describe('escapeNoteValue', () => {
    it('should escape backslashes', () => {
      expect(escapeNoteValue('\n')).toBe('\\n');
    });

    it('should escape double quotes', () => {
      expect(escapeNoteValue('"test"')).toBe('\\"test\\"');
    });

    it('should escape newlines', () => {
      expect(escapeNoteValue('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape all special characters', () => {
      expect(escapeNoteValue('\n"test"\n')).toBe('\\n\\"test\\"\\n');
    });
  });

  describe('unescapeNoteValue', () => {
    it('should unescape backslashes', () => {
      expect(unescapeNoteValue('\\n')).toBe('\n');
    });

    it('should unescape double quotes', () => {
      expect(unescapeNoteValue('\\"test\\"')).toBe('"test"');
    });

    it('should unescape newlines', () => {
      expect(unescapeNoteValue('line1\\nline2')).toBe('line1\nline2');
    });

    it('should unescape all special characters', () => {
      expect(unescapeNoteValue('\\n\\"test\\"\\n')).toBe('\n"test"\n');
    });
  });

  describe('updateLineCoords', () => {
    it('should update existing line coordinates', () => {
      const content = '"Test" @(10, 20)->(30, 40)';
      const updated = updateLineCoords(content, 1, 100, 200, 300, 400);
      expect(updated).toBe('"Test" @(100, 200)->(300, 400)');
    });

    it('should add coordinates to line without coordinates', () => {
      const content = '"Test"';
      const updated = updateLineCoords(content, 1, 100, 200, 300, 400);
      expect(updated).toBe('"Test" @(100, 200)->(300, 400)');
    });

    it('should return content unchanged for invalid line number', () => {
      const content = '"Test"';
      const updated = updateLineCoords(content, 999, 100, 200, 300, 400);
      expect(updated).toBe(content);
    });
  });

  describe('updateLineAttribute', () => {
    it('should update text attribute for rectangle element', () => {
      const content = '["Old Text"] w=100 h=50';
      const updated = updateLineAttribute(content, 1, 'text', 'New Text');
      expect(updated).toBe('["New Text"] w=100 h=50');
    });

    it('should update text attribute for rounded rectangle element', () => {
      const content = '("Old Text") w=100 h=50';
      const updated = updateLineAttribute(content, 1, 'text', 'New Text');
      expect(updated).toBe('("New Text") w=100 h=50');
    });

    it('should update text attribute for circle element', () => {
      const content = '(("Old Text")) w=100 h=50';
      const updated = updateLineAttribute(content, 1, 'text', 'New Text');
      expect(updated).toBe('(("New Text")) w=100 h=50');
    });

    it('should update text attribute for placeholder element', () => {
      const content = '[?"Old Text"] w=100 h=50';
      const updated = updateLineAttribute(content, 1, 'text', 'New Text');
      expect(updated).toBe('[?"New Text"] w=100 h=50');
    });

    it('should update text attribute for text element', () => {
      const content = '"Old Text"';
      const updated = updateLineAttribute(content, 1, 'text', 'New Text');
      expect(updated).toBe('"New Text"');
    });

    it('should update x attribute', () => {
      const content = '"Test" @(10, 20)';
      const updated = updateLineAttribute(content, 1, 'x', 100);
      expect(updated).toBe('"Test" @(100, 20)');
    });

    it('should update y attribute', () => {
      const content = '"Test" @(10, 20)';
      const updated = updateLineAttribute(content, 1, 'y', 200);
      expect(updated).toBe('"Test" @(10, 200)');
    });

    it('should update note attribute', () => {
      const content = '"Test"';
      const updated = updateLineAttribute(content, 1, 'note', 'This is a note');
      expect(updated).toBe('"Test" note="""This is a note"""');
    });

    it('should update bold attribute', () => {
      const content = '"Test"';
      const updated = updateLineAttribute(content, 1, 'bold', 'true');
      expect(updated).toBe('"Test" bold');
    });

    it('should remove bold attribute', () => {
      const content = '"Test" bold';
      const updated = updateLineAttribute(content, 1, 'bold', 'false');
      expect(updated).toBe('"Test"');
    });

    it('should update italic attribute', () => {
      const content = '"Test"';
      const updated = updateLineAttribute(content, 1, 'italic', 'true');
      expect(updated).toBe('"Test" italic');
    });

    it('should remove italic attribute', () => {
      const content = '"Test" italic';
      const updated = updateLineAttribute(content, 1, 'italic', 'false');
      expect(updated).toBe('"Test"');
    });

    it('should update regular attribute', () => {
      const content = '"Test" w=100';
      const updated = updateLineAttribute(content, 1, 'h', 50);
      expect(updated).toBe('"Test" w=100 h=50');
    });

    it('should return content unchanged for invalid line number', () => {
      const content = '"Test"';
      const updated = updateLineAttribute(content, 999, 'text', 'New Text');
      expect(updated).toBe(content);
    });
  });

  describe('bringElementsToFront', () => {
    it('should bring selected elements to front', () => {
      const content = '"Element 1"\n"Element 2"\n"Element 3"';
      const updated = bringElementsToFront(content, ['2']);
      expect(updated).toBe('"Element 1"\n"Element 3"\n"Element 2"');
    });

    it('should handle multiple selected elements', () => {
      const content = '"Element 1"\n"Element 2"\n"Element 3"\n"Element 4"';
      const updated = bringElementsToFront(content, ['2', '3']);
      expect(updated).toBe('"Element 1"\n"Element 4"\n"Element 2"\n"Element 3"');
    });

    it('should handle elements with note attributes', () => {
      const content = '"Element 1"\n"Element 2"\nnote="This is a note"\n"Element 3"';
      const updated = bringElementsToFront(content, ['2']);
      expect(updated).toBe('"Element 1"\n"Element 3"\n"Element 2"\nnote="This is a note"');
    });
  });

  describe('getElementRelatedLines', () => {
    it('should return only the element line for simple elements', () => {
      const content = '"Element 1"\n"Element 2"\n"Element 3"';
      const relatedLines = getElementRelatedLines(content, 2);
      expect(relatedLines).toEqual([2]);
    });

    it('should return element line and note lines for elements with notes', () => {
      const content = '"Element 1"\n"Element 2"\nnote="This is a note"\n"Element 3"';
      const relatedLines = getElementRelatedLines(content, 2);
      expect(relatedLines).toEqual([2, 3]);
    });

    it('should return element line and multi-line note lines', () => {
      const content = '"Element 1"\n"Element 2"\nnote="""\nThis is a\nmulti-line note\n"""\n"Element 3"';
      const relatedLines = getElementRelatedLines(content, 2);
      expect(relatedLines).toEqual([2, 3, 4, 5, 6]);
    });
  });

  describe('alignElements', () => {
    it('should align elements to the left', () => {
      const content = '"Element 1" @(100, 20)\n"Element 2" @(200, 30)';
      const updated = alignElements(content, ['1', '2'], 'left');
      expect(updated).toBe('"Element 1" @(100, 20)\n"Element 2" @(100, 30)');
    });

    it('should align elements to the top', () => {
      const content = '"Element 1" @(100, 100)\n"Element 2" @(200, 200)';
      const updated = alignElements(content, ['1', '2'], 'top');
      expect(updated).toBe('"Element 1" @(100, 100)\n"Element 2" @(200, 100)');
    });

    it('should return content unchanged for less than 2 elements', () => {
      const content = '"Element 1" @(100, 20)';
      const updated = alignElements(content, ['1'], 'left');
      expect(updated).toBe(content);
    });
  });

  describe('hasDoubleQuoteNotes', () => {
    it('should return true for content with double quote notes', () => {
      const content = '"Element 1" note="This is a note"';
      expect(hasDoubleQuoteNotes(content)).toBe(true);
    });

    it('should return false for content with triple quote notes', () => {
      const content = '"Element 1" note="""This is a note"""';
      expect(hasDoubleQuoteNotes(content)).toBe(false);
    });

    it('should return false for content without notes', () => {
      const content = '"Element 1"';
      expect(hasDoubleQuoteNotes(content)).toBe(false);
    });
  });

  describe('convertDoubleQuoteNotesToTriple', () => {
    it('should convert double quote notes to triple quotes', () => {
      const content = '"Element 1" note="This is a note"';
      const updated = convertDoubleQuoteNotesToTriple(content);
      expect(updated).toBe('"Element 1" note="""This is a note"""');
    });

    it('should leave triple quote notes unchanged', () => {
      const content = '"Element 1" note="""This is a note"""';
      const updated = convertDoubleQuoteNotesToTriple(content);
      expect(updated).toBe(content);
    });

    it('should leave content without notes unchanged', () => {
      const content = '"Element 1"';
      const updated = convertDoubleQuoteNotesToTriple(content);
      expect(updated).toBe(content);
    });
  });
});
