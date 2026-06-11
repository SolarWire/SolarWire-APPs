monaco.languages.register({
  id: 'solarwire'
});

monaco.languages.setMonarchTokensProvider('solarwire', {
  tokenizer: {
    root: [
      { regex: /\/\/.*$/, action: { token: 'comment' } },
      { regex: /"""/, action: { token: 'string' } },
      { regex: /"/, action: { token: 'string' } },
      { regex: /\[/, action: { token: 'tag' } },
      { regex: /\]/, action: { token: 'tag' } },
      { regex: /\(/, action: { token: 'tag' } },
      { regex: /\)/, action: { token: 'tag' } },
      { regex: /</, action: { token: 'tag' } },
      { regex: />/, action: { token: 'tag' } },
      { regex: /##/, action: { token: 'namespace' } },
      { regex: /#/, action: { token: 'namespace' } },
      { regex: /!/, action: { token: 'keyword' } },
      { regex: /--/, action: { token: 'keyword' } },
      { regex: /@\(/, action: { token: 'number' } },
      { regex: /->\(/, action: { token: 'keyword' } },
      { regex: /\d+(\.\d+)?/, action: { token: 'number' } },
      { regex: /[a-zA-Z_][-a-zA-Z0-9_]*/, action: { token: 'identifier' } },
      { regex: /=/, action: { token: 'delimiter' } },
      { regex: /,/, action: { token: 'delimiter' } },
      { regex: /[+\-]/, action: { token: 'operator' } },
      { regex: /#([0-9a-fA-F]{3,8})/, action: { token: 'number' } },
    ],
  }
});

monaco.languages.setLanguageConfiguration('solarwire', {
  comments: {
    lineComment: '//'
  },
  brackets: [
    ['(', ')'],
    ['[', ']']
  ],
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
    { open: '"""', close: '"""' }
  ],
  surroundingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' }
  ]
});

monaco.editor.defineTheme('solarwire-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '9CA3AF', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'DC2626' },
    { token: 'tag', foreground: '2563EB' },
    { token: 'identifier', foreground: '1F2937' },
    { token: 'string', foreground: '1F2937' },
    { token: 'number', foreground: '2563EB' },
    { token: 'namespace', foreground: '7C3AED' },
    { token: 'delimiter', foreground: '374151' },
    { token: 'operator', foreground: '374151' },
    { token: 'elementDelimiter', foreground: '2563EB' },
    { token: 'elementContent', foreground: '1F2937' },
    { token: 'tableDelimiter', foreground: '7C3AED' },
    { token: 'coordDelimiter', foreground: '2563EB' },
    { token: 'coordNumber', foreground: '2563EB' },
    { token: 'attrName', foreground: 'EA580C' },
    { token: 'attrEquals', foreground: '374151' },
    { token: 'attrValue', foreground: 'A855F7' },
    { token: 'noteDelimiter', foreground: '9333EA' },
    { token: 'noteContent', foreground: '16A34A' },
    { token: 'declaration', foreground: 'DC2626' },
    { token: 'lineDelimiter', foreground: 'DC2626' }
  ],
  colors: {
    'editor.foreground': '#374151',
    'editor.background': '#FFFFFF',
    'editorBracketHighlight.foreground1': '#2563EB',
    'editorBracketHighlight.foreground2': '#7C3AED',
    'editorBracketHighlight.foreground3': '#16A34A',
    'editorBracketHighlight.foreground4': '#EA580C',
    'editorBracketMatch.background': '#DBEAFE',
    'editorBracketMatch.border': '#2563EB'
  }
});

monaco.editor.defineTheme('solarwire-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'F87171' },
    { token: 'tag', foreground: '60A5FA' },
    { token: 'identifier', foreground: 'F9FAFB' },
    { token: 'string', foreground: 'F9FAFB' },
    { token: 'number', foreground: '60A5FA' },
    { token: 'namespace', foreground: 'C084FC' },
    { token: 'delimiter', foreground: 'E5E7EB' },
    { token: 'operator', foreground: 'E5E7EB' },
    { token: 'elementDelimiter', foreground: '60A5FA' },
    { token: 'elementContent', foreground: 'F9FAFB' },
    { token: 'tableDelimiter', foreground: 'C084FC' },
    { token: 'coordDelimiter', foreground: '60A5FA' },
    { token: 'coordNumber', foreground: '60A5FA' },
    { token: 'attrName', foreground: 'FB923C' },
    { token: 'attrEquals', foreground: 'E5E7EB' },
    { token: 'attrValue', foreground: 'E879F9' },
    { token: 'noteDelimiter', foreground: 'C084FC' },
    { token: 'noteContent', foreground: '4ADE80' },
    { token: 'declaration', foreground: 'F87171' },
    { token: 'lineDelimiter', foreground: 'F87171' }
  ],
  colors: {
    'editor.foreground': '#E5E7EB',
    'editor.background': '#0D1117',
    'editorBracketHighlight.foreground1': '#60A5FA',
    'editorBracketHighlight.foreground2': '#C084FC',
    'editorBracketHighlight.foreground3': '#4ADE80',
    'editorBracketHighlight.foreground4': '#FB923C',
    'editorBracketMatch.background': '#1E3A5F',
    'editorBracketMatch.border': '#60A5FA'
  }
});
