import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const mockMonaco = {
  languages: {
    CompletionItemKind: {
      Property: 10,
      Keyword: 14,
      Snippet: 15,
      Color: 19,
      EnumMember: 20,
      Value: 22,
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4,
    },
    registerCompletionItemProvider: vi.fn(),
  },
};

describe('SolarWire Completion Provider Registration', () => {
  beforeEach(() => {
    mockMonaco.languages.registerCompletionItemProvider.mockClear();
    vi.resetModules();
  });

  it('should register completion item provider', async () => {
    const { registerSolarWireCompletion } = await import('../shared/utils/solarwire-completion');
    registerSolarWireCompletion(mockMonaco);

    expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      'solarwire',
      expect.objectContaining({
        triggerCharacters: expect.arrayContaining([' ', '=', '!', '@', '#']),
        provideCompletionItems: expect.any(Function),
      })
    );
  });

  it('should not crash when monaco is null', async () => {
    const { registerSolarWireCompletion } = await import('../shared/utils/solarwire-completion');
    expect(() => registerSolarWireCompletion(null)).not.toThrow();
  });
});

describe('Completion Data Structures', () => {
  const completionFilePath = path.resolve(__dirname, '../shared/utils/solarwire-completion.ts');
  let fileContent: string;

  beforeAll(() => {
    fileContent = fs.readFileSync(completionFilePath, 'utf-8');
  });

  it('should have element attributes defined for all types', () => {
    expect(fileContent).toContain('rectangle');
    expect(fileContent).toContain('circle');
    expect(fileContent).toContain('table-row');
    expect(fileContent).toContain('table-cell');
    expect(fileContent).toContain('placeholder');
    expect(fileContent).toContain('image');
    expect(fileContent).toContain('line');
  });

  it('should have common colors defined', () => {
    expect(fileContent).toContain('#FFFFFF');
    expect(fileContent).toContain('#000000');
    expect(fileContent).toContain('#3B82F6');
    expect(fileContent).toContain('#EF4444');
  });

  it('should have enum values defined', () => {
    expect(fileContent).toMatch(/'l',\s*'c',\s*'r'/);
    expect(fileContent).toMatch(/'t',\s*'m',\s*'b'/);
    expect(fileContent).toMatch(/'underline',\s*'line-through'/);
  });

  it('should have element templates defined', () => {
    expect(fileContent).toContain('ELEMENT_TEMPLATES');
    expect(fileContent).toContain('Rectangle');
    expect(fileContent).toContain('Circle');
    expect(fileContent).toContain('Table');
    expect(fileContent).toContain('Line');
  });

  it('should have document declarations defined', () => {
    expect(fileContent).toContain('DOCUMENT_DECLARATIONS');
    expect(fileContent).toContain('!title=');
    expect(fileContent).toContain('!bg=');
    expect(fileContent).toContain('!size=');
    expect(fileContent).toContain('!r=');
  });

  it('should table-row NOT include note attribute', () => {
    const tableRowMatch = fileContent.match(/'table-row':\s*\[([\s\S]*?)\],?\s*\n\s*'table-cell'/);
    expect(tableRowMatch).not.toBeNull();

    const tableRowAttrs = tableRowMatch![1];
    expect(tableRowAttrs).not.toContain("'note'");
    expect(tableRowAttrs).not.toContain('"note"');
  });

  it('should table-cell NOT include w/h/note attributes', () => {
    const tableCellMatch = fileContent.match(/'table-cell':\s*\[([\s\S]*?)\]/);
    expect(tableCellMatch).not.toBeNull();

    const tableCellAttrs = tableCellMatch![1];
    expect(tableCellAttrs).not.toContain("'w'");
    expect(tableCellAttrs).not.toContain("'h'");
    expect(tableCellAttrs).not.toContain("'note'");
  });

  it('should have coordinate suggestion templates', () => {
    expect(fileContent).toContain('buildCoordSuggestions');
    expect(fileContent).toContain('R+');
    expect(fileContent).toContain('T+');
    expect(fileContent).toContain('C+');
  });

  it('should have attribute value suggestions for colors', () => {
    expect(fileContent).toContain('buildAttrValueSuggestions');
    expect(fileContent).toContain('shadow-color');
    expect(fileContent).toContain('COMMON_COLORS');
  });

  it('should have opacity value suggestions', () => {
    expect(fileContent).toContain("'opacity'");
    expect(fileContent).toContain("'0.5'");
  });
});

describe('Integration: SolarWire Language + Completion', () => {
  it('should load both modules without error', async () => {
    await expect(import('../shared/utils/solarwire-language')).resolves.not.toThrow();
    await expect(import('../shared/utils/solarwire-completion')).resolves.not.toThrow();
  });

  it('should export SOLARWIRE_LANGUAGE_ID constant', async () => {
    const { SOLARWIRE_LANGUAGE_ID } = await import('../shared/utils/solarwire-language');
    expect(SOLARWIRE_LANGUAGE_ID).toBe('solarwire');
  });
});
