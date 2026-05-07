import { monacoService } from '../../app/services/monaco-service';

export function registerSolarWireLanguage(): void {
  const monaco = monacoService.getMonaco();
  if (!monaco) return;

  monaco.languages.register({ id: 'solarwire' });

  monaco.languages.setMonarchTokensProvider('solarwire', {
    tokenizer: {
      root: [
        [/\[.*?\]/, 'element'],
        [/".*?"/, 'string'],
        [/".*?'/, 'string'],
        [/#.*$/, 'comment'],
        [/@\w+/, 'attribute'],
        [/=\s*[^"]\s+/, 'value'],
      ]
    }
  });

  monaco.languages.setLanguageConfiguration('solarwire', {
    comments: {
      lineComment: '#'
    },
    brackets: [
      ['[', ']'],
      ['"', '"'],
      ["'", "'"]
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });
}
