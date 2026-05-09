import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMonarchTokensProvider = vi.fn();
const mockRegisterLanguage = vi.fn();
const mockDefineTheme = vi.fn();
const mockGetLanguages = vi.fn();
const mockSetLanguageConfiguration = vi.fn();

function createMockMonaco() {
  mockMonarchTokensProvider.mockClear();
  mockRegisterLanguage.mockClear();
  mockDefineTheme.mockClear();
  mockGetLanguages.mockClear();
  mockSetLanguageConfiguration.mockClear();

  mockGetLanguages.mockReturnValue([]);

  return {
    languages: {
      register: mockRegisterLanguage,
      setMonarchTokensProvider: mockMonarchTokensProvider,
      setLanguageConfiguration: mockSetLanguageConfiguration,
      getLanguages: mockGetLanguages,
    },
    editor: {
      defineTheme: mockDefineTheme,
    },
  };
}

describe('SolarWire Language Registration', () => {
  let mockMonaco: ReturnType<typeof createMockMonaco>;

  beforeEach(async () => {
    mockMonaco = createMockMonaco();
    vi.resetModules();

    const { registerSolarWireLanguage, getThemeName } = await import('../shared/utils/solarwire-language');
    registerSolarWireLanguage(mockMonaco);
  });

  it('should register the solarwire language', () => {
    expect(mockRegisterLanguage).toHaveBeenCalledWith({ id: 'solarwire' });
  });

  it('should set Monarch tokens provider', () => {
    expect(mockMonarchTokensProvider).toHaveBeenCalledWith('solarwire', expect.objectContaining({
      tokenizer: expect.objectContaining({
        root: expect.any(Array),
        declaration: expect.any(Array),
        afterElement: expect.any(Array),
        coordinates: expect.any(Array),
        afterCoords: expect.any(Array),
        tableRowAttrs: expect.any(Array),
        attrValue: expect.any(Array),
        inBracketText: expect.any(Array),
        inParenText: expect.any(Array),
        inQuotedText: expect.any(Array),
        inTripleQuotedText: expect.any(Array),
        inImageUrl: expect.any(Array),
        inLine: expect.any(Array),
        lineCoords: expect.any(Array),
      }),
    }));
  });

  it('should register language configuration with // line comments', () => {
    expect(mockSetLanguageConfiguration).toHaveBeenCalledWith('solarwire', expect.objectContaining({
      comments: {
        lineComment: '//',
      },
    }));
  });

  it('should define solarwire-light theme', () => {
    const lightTheme = mockDefineTheme.mock.calls.find(
      (call: any) => call[0] === 'solarwire-light'
    );
    expect(lightTheme).toBeDefined();
    expect(lightTheme[1]).toHaveProperty('base', 'vs');
    expect(lightTheme[1].rules).toContainEqual(
      expect.objectContaining({ token: 'comment', foreground: '6A737D' })
    );
    expect(lightTheme[1].rules).toContainEqual(
      expect.objectContaining({ token: 'keyword', foreground: 'D73A49' })
    );
    expect(lightTheme[1].rules).toContainEqual(
      expect.objectContaining({ token: 'attribute', foreground: 'E36209' })
    );
    expect(lightTheme[1].colors).toHaveProperty('editorBracketMatch.background');
  });

  it('should define solarwire-dark theme', () => {
    const darkTheme = mockDefineTheme.mock.calls.find(
      (call: any) => call[0] === 'solarwire-dark'
    );
    expect(darkTheme).toBeDefined();
    expect(darkTheme[1]).toHaveProperty('base', 'vs-dark');
    expect(darkTheme[1].rules).toContainEqual(
      expect.objectContaining({ token: 'keyword', foreground: 'FF7B72' })
    );
    expect(darkTheme[1].rules).toContainEqual(
      expect.objectContaining({ token: 'attribute', foreground: 'FFA657' })
    );
    expect(darkTheme[1].colors).toHaveProperty('editorBracketMatch.background');
  });

  it('should return correct theme name for light mode', async () => {
    const { getThemeName } = await import('../shared/utils/solarwire-language');
    expect(getThemeName(false)).toBe('solarwire-light');
  });

  it('should return correct theme name for dark mode', async () => {
    const { getThemeName } = await import('../shared/utils/solarwire-language');
    expect(getThemeName(true)).toBe('solarwire-dark');
  });

  it('should not re-register if language already exists', async () => {
    mockGetLanguages.mockReturnValue([{ id: 'solarwire' }]);
    mockRegisterLanguage.mockClear();
    mockMonarchTokensProvider.mockClear();
    vi.resetModules();

    const { registerSolarWireLanguage } = await import('../shared/utils/solarwire-language');
    registerSolarWireLanguage(mockMonaco);

    expect(mockRegisterLanguage).not.toHaveBeenCalled();
    expect(mockMonarchTokensProvider).not.toHaveBeenCalled();
  });
});

describe('Monarch Tokenizer Rules Validation', () => {
  let tokenizer: any;

  beforeEach(async () => {
    const mockMonaco = createMockMonaco();
    vi.resetModules();

    const { registerSolarWireLanguage } = await import('../shared/utils/solarwire-language');
    registerSolarWireLanguage(mockMonaco);

    tokenizer = mockMonarchTokensProvider.mock.calls[0][1].tokenizer;
  });

  it('should have all actions with token attribute (Monarch spec)', () => {
    function validateActions(obj: any) {
      for (const [stateName, rules] of Object.entries(obj)) {
        if (Array.isArray(rules)) {
          for (const rule of rules) {
            if (rule.action) {
              const action = rule.action;
              if (Array.isArray(action)) {
                throw new Error(`Array actions not allowed at ${stateName}`);
              }
              if (typeof action === 'object') {
                expect(action).toHaveProperty('token');
                expect(typeof action.token).toBe('string');
              }
              if (action.next && typeof action.next === 'string') {
                const nextState = action.next.replace('@', '');
                if (nextState !== 'pop' && !obj[nextState]) {
                  throw new Error(`State ${nextState} referenced at ${stateName} does not exist`);
                }
              }
            }
          }
        }
      }
    }

    expect(() => validateActions(tokenizer)).not.toThrow();
  });

  it('should have root state with element detection rules', () => {
    const rootRules = tokenizer.root;
    const rootRegexes = rootRules.map((r: any) => r.regex.source);

    expect(rootRegexes).toContain('\\/\\/.*$');
    expect(rootRegexes).toContain('!');
    expect(rootRegexes).toContain('##');
    expect(rootRegexes).toContain('\\[\\?');
    expect(rootRegexes).toContain('\\[');
    expect(rootRegexes).toContain('\\(');
    expect(rootRegexes).toContain('--');
    expect(rootRegexes).toContain('<');
    expect(rootRegexes).toContain('"""');
    expect(rootRegexes).toContain('"');
  });

  it('should have declaration state for ! directives', () => {
    const declRules = tokenizer.declaration;
    expect(declRules.length).toBeGreaterThan(0);

    const hasTitleRule = declRules.some(
      (r: any) => r.regex.source.includes('\\w+') && r.action.token === 'keyword.operator'
    );
    expect(hasTitleRule).toBe(true);
  });

  it('should have bracket text state for ["text"] elements', () => {
    const rules = tokenizer.inBracketText;
    const hasCloseBracket = rules.some(
      (r: any) => r.action.next === '@afterElement'
    );
    expect(hasCloseBracket).toBe(true);
  });

  it('should have paren text state for ("text") elements', () => {
    const rules = tokenizer.inParenText;
    const hasCloseParen = rules.some(
      (r: any) => r.action.next === '@afterElement'
    );
    expect(hasCloseParen).toBe(true);
  });

  it('should have attribute parsing in afterElement state', () => {
    const rules = tokenizer.afterElement;
    const hasAttrRule = rules.some(
      (r: any) => r.action.token === 'attribute.operator' && r.action.next === '@attrValue'
    );
    expect(hasAttrRule).toBe(true);
  });

  it('should have coordinate parsing state', () => {
    const rules = tokenizer.coordinates;
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r: any) => r.action.next === '@afterCoords')).toBe(true);
  });

  it('should have table row attrs state without note', () => {
    const rules = tokenizer.tableRowAttrs;
    expect(rules.length).toBeGreaterThan(0);

    const tableRowHasNote = rules.some(
      (r: any) => r.regex.source === 'note'
    );
    expect(tableRowHasNote).toBe(false);
  });

  it('should handle boolean attributes (bold/italic) in keyword rules', () => {
    const afterElementRules = tokenizer.afterElement;
    const hasBold = afterElementRules.some(
      (r: any) => r.regex.source === 'bold|italic'
    );
    expect(hasBold).toBe(true);
  });

  it('should have theme colors for bracket matching', () => {
    const lightCall = mockDefineTheme.mock.calls.find(
      (c: any) => c[0] === 'solarwire-light'
    );
    const colors = lightCall[1].colors;

    expect(colors).toHaveProperty('editorBracketHighlight.foreground1');
    expect(colors).toHaveProperty('editorBracketMatch.background');
    expect(colors).toHaveProperty('editorBracketMatch.border');
  });
});
