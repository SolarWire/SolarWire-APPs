export const SOLARWIRE_LANGUAGE_ID = 'solarwire';

export function registerSolarWireLanguage(monaco: any): void {
  if (!monaco) return;

  registerTheme(monaco);

  const existing = monaco.languages.getLanguages().find((lang: any) => lang.id === SOLARWIRE_LANGUAGE_ID);
  if (existing) return;

  monaco.languages.register({ id: SOLARWIRE_LANGUAGE_ID });

  registerTokenizer(monaco);
  registerLanguageConfiguration(monaco);
}

function registerTokenizer(monaco: any): void {
  monaco.languages.setMonarchTokensProvider(SOLARWIRE_LANGUAGE_ID, {
    tokenizer: {
      root: [
        { regex: /\/\/.*$/, action: { token: 'comment' } },

        { regex: /!/, action: { token: 'keyword', next: '@declaration' } },

        { regex: /##/, action: { token: 'namespace', next: '@afterElement' } },
        { regex: /(\s+)(#)/, action: { token: '.namespace', next: '@tableRowAttrs' } },

        { regex: /\[\?/, action: { token: 'tag', next: '@inBracketText' } },
        { regex: /\[/, action: { token: 'tag', next: '@inBracketText' } },

        { regex: /\(/, action: { token: 'tag', next: '@inParenText' } },

        { regex: /--/, action: { token: 'keyword', next: '@inLine' } },

        { regex: /</, action: { token: 'tag', next: '@inImageUrl' } },

        { regex: /"""/, action: { token: 'string.delimiter', next: '@inTripleQuotedText' } },
        { regex: /"/, action: { token: 'string', next: '@inQuotedText' } },
      ],

      declaration: [
        { regex: /(\w+)(\s*=\s*)/, action: { token: 'keyword.attr.equals' } },
        { regex: /(\w+)/, action: { token: 'keyword' } },
        { regex: /"""/, action: { token: 'attr.value', next: '@inDeclarationTripleValue' } },
        { regex: /"/, action: { token: 'attr.value', next: '@inDeclarationValue' } },
        { regex: /#([0-9a-fA-F]{3,8})/, action: { token: 'attr.value' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],

      inDeclarationValue: [
        { regex: /[^"]+/, action: { token: 'attr.value' } },
        { regex: /"/, action: { token: 'attr.value', next: '@pop' } },
      ],

      inDeclarationTripleValue: [
        { regex: /[^"]+/, action: { token: 'attr.value' } },
        { regex: /"""/, action: { token: 'attr.value', next: '@pop' } },
      ],

      inBracketText: [
        { regex: /"""/, action: { token: 'tag', next: '@inBracketTripleQuoted' } },
        { regex: /"/, action: { token: 'tag', next: '@inBracketQuotedContent' } },
        { regex: /[^\]"]+/, action: { token: 'element.content' } },
        { regex: /\]/, action: { token: 'tag', next: '@afterElement' } },
      ],

      inBracketQuotedContent: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"/, action: { token: 'tag', next: '@inBracketText' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inBracketTripleQuoted: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"""/, action: { token: 'tag', next: '@inBracketText' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inParenText: [
        { regex: /"""/, action: { token: 'tag', next: '@inParenTripleQuoted' } },
        { regex: /"/, action: { token: 'tag', next: '@inParenQuotedContent' } },
        { regex: /[^)"]+/, action: { token: 'element.content' } },
        { regex: /\)/, action: { token: 'tag', next: '@afterElement' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      inParenQuotedContent: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"/, action: { token: 'tag', next: '@inParenText' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inParenTripleQuoted: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"""/, action: { token: 'tag', next: '@inParenText' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inQuotedText: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"/, action: { token: 'tag', next: '@afterElement' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inTripleQuotedText: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /\\n/, action: { token: 'element.content' } },
        { regex: /"""/, action: { token: 'tag', next: '@afterElement' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      inImageUrl: [
        { regex: /[^>]+/, action: { token: 'element.content' } },
        { regex: />/, action: { token: 'tag', next: '@afterElement' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      inLine: [
        { regex: /"/, action: { token: 'tag', next: '@inLineLabel' } },
        { regex: /@/, action: { token: '', next: '@lineCoords' } },
        { regex: /\w+/, action: { token: 'attribute' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      inLineLabel: [
        { regex: /[^"]+/, action: { token: 'element.content' } },
        { regex: /"/, action: { token: 'tag', next: '@afterLineLabel' } },
        { regex: /$/, action: { token: 'element.content' } },
      ],

      afterLineLabel: [
        { regex: /--/, action: { token: 'keyword' } },
        { regex: /@/, action: { token: '', next: '@lineCoords' } },
        { regex: /\w+/, action: { token: 'attribute' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      lineCoords: [
        { regex: /\(/, action: { token: 'delimiter.paren' } },
        { regex: /\)/, action: { token: 'delimiter.paren' } },
        { regex: /->/, action: { token: 'keyword' } },
        { regex: /[LRCBT]/, action: { token: 'keyword' } },
        { regex: /[+\-]/, action: { token: 'operator' } },
        { regex: /\d+/, action: { token: 'number' } },
        { regex: /,/, action: { token: 'delimiter' } },
        { regex: /@/, action: { token: 'number' } },
        { regex: /\w+/, action: { token: 'attribute' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],

      afterElement: [
        { regex: /@\(/, action: { token: 'number', next: '@coordinates' } },
        { regex: /note(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@noteValue' } },
        { regex: /bold|italic/, action: { token: 'attribute' } },
        { regex: /(\w[-\w]*)(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@attrValue' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],

      coordinates: [
        { regex: /[LRCBT]/, action: { token: 'keyword' } },
        { regex: /[+\-]/, action: { token: 'operator' } },
        { regex: /\d+/, action: { token: 'number' } },
        { regex: /,/, action: { token: 'delimiter' } },
        { regex: /\)/, action: { token: 'number', next: '@afterCoords' } },
      ],

      afterCoords: [
        { regex: /note(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@noteValue' } },
        { regex: /bold|italic/, action: { token: 'attribute' } },
        { regex: /(\w[-\w]*)(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@attrValue' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],

      tableRowAttrs: [
        { regex: /(\w[-\w]*)(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@attrValue' } },
        { regex: /bold|italic/, action: { token: 'attribute' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],

      attrValue: [
        { regex: /"""/, action: { token: 'attr.value', next: '@inTripleQuotedAttrValue' } },
        { regex: /"/, action: { token: 'attr.value', next: '@inQuotedAttrValue' } },
        { regex: /#([0-9a-fA-F]{3,8})/, action: { token: 'attr.value', next: '@afterAttrValue' } },
        { regex: /[^\s]+/, action: { token: 'attr.value', next: '@afterAttrValue' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      inQuotedAttrValue: [
        { regex: /[^"]+/, action: { token: 'attr.value' } },
        { regex: /"/, action: { token: 'attr.value', next: '@afterAttrValue' } },
        { regex: /$/, action: { token: 'attr.value' } },
      ],

      inTripleQuotedAttrValue: [
        { regex: /[^"]+/, action: { token: 'attr.value' } },
        { regex: /"""/, action: { token: 'attr.value', next: '@afterAttrValue' } },
        { regex: /$/, action: { token: 'attr.value' } },
      ],

      noteValue: [
        { regex: /=/, action: { token: 'attr.equals' } },
        { regex: /"""/, action: { token: 'note.delimiter', next: '@inNoteTripleContent' } },
        { regex: /"/, action: { token: 'note.delimiter', next: '@inNoteQuotedContent' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
      ],

      inNoteQuotedContent: [
        { regex: /[^"]+/, action: { token: 'note.content' } },
        { regex: /"/, action: { token: 'note.delimiter', next: '@afterAttrValue' } },
        { regex: /$/, action: { token: 'note.content' } },
      ],

      inNoteTripleContent: [
        { regex: /[^"]+/, action: { token: 'note.content' } },
        { regex: /"""/, action: { token: 'note.delimiter', next: '@afterAttrValue' } },
        { regex: /$/, action: { token: 'note.content' } },
      ],

      afterAttrValue: [
        { regex: /note(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@noteValue' } },
        { regex: /bold|italic/, action: { token: 'attribute' } },
        { regex: /(\w[-\w]*)(\s*=\s*)/, action: { token: 'attribute.attr.equals', next: '@attrValue' } },
        { regex: /$/, action: { token: '', next: '@pop' } },
        { regex: /\/\/.*$/, action: { token: 'comment', next: '@pop' } },
      ],
    },
  });
}

function registerLanguageConfiguration(monaco: any): void {
  monaco.languages.setLanguageConfiguration(SOLARWIRE_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: '"""', close: '"""' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
  });
}

function registerTheme(monaco: any): void {
  monaco.editor.defineTheme('solarwire-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9CA3AF', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'DC2626' },
      { token: 'tag', foreground: '2563EB' },
      { token: 'element.content', foreground: '1F2937' },
      { token: 'attribute', foreground: 'EA580C' },
      { token: 'attr.equals', foreground: '374151' },
      { token: 'attr.value', foreground: 'A855F7' },
      { token: 'note.content', foreground: '16A34A' },
      { token: 'note.delimiter', foreground: '9333EA' },
      { token: 'number', foreground: '2563EB' },
      { token: 'namespace', foreground: '7C3AED' },
      { token: 'operator', foreground: '374151' },
      { token: 'delimiter', foreground: '6B7280' },
      { token: 'delimiter.paren', foreground: '6B7280' },
    ],
    colors: {
      'editor.foreground': '#374151',
      'editor.background': '#FFFFFF',
      'editorBracketHighlight.foreground1': '#2563EB',
      'editorBracketHighlight.foreground2': '#7C3AED',
      'editorBracketHighlight.foreground3': '#16A34A',
      'editorBracketHighlight.foreground4': '#EA580C',
      'editorBracketMatch.background': '#DBEAFE',
      'editorBracketMatch.border': '#2563EB',
    },
  });

  monaco.editor.defineTheme('solarwire-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F87171' },
      { token: 'tag', foreground: '60A5FA' },
      { token: 'element.content', foreground: 'F9FAFB' },
      { token: 'attribute', foreground: 'FB923C' },
      { token: 'attr.equals', foreground: 'E5E7EB' },
      { token: 'attr.value', foreground: 'E879F9' },
      { token: 'note.content', foreground: '4ADE80' },
      { token: 'note.delimiter', foreground: 'C084FC' },
      { token: 'number', foreground: '60A5FA' },
      { token: 'namespace', foreground: 'C084FC' },
      { token: 'operator', foreground: 'E5E7EB' },
      { token: 'delimiter', foreground: '9CA3AF' },
      { token: 'delimiter.paren', foreground: '9CA3AF' },
    ],
    colors: {
      'editor.foreground': '#E5E7EB',
      'editor.background': '#0D1117',
      'editorBracketHighlight.foreground1': '#60A5FA',
      'editorBracketHighlight.foreground2': '#C084FC',
      'editorBracketHighlight.foreground3': '#4ADE80',
      'editorBracketHighlight.foreground4': '#FB923C',
      'editorBracketMatch.background': '#1E3A5F',
      'editorBracketMatch.border': '#60A5FA',
    },
  });
}

export function getThemeName(isDark: boolean): string {
  return isDark ? 'solarwire-dark' : 'solarwire-light';
}
