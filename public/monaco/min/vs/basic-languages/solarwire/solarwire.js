// SolarWire language definition for Monaco Editor
monaco.languages.register({
  id: 'solarwire'
});

monaco.languages.setMonarchTokensProvider('solarwire', {
  tokenizer: {
    root: [
      // Comments
      { regex: /\/\/.*$/, action: { token: 'comment' } },
      
      // Rectangles - 蓝色
      { regex: /\(\("[^"]*"\)\)/, action: { token: 'type' } },
      { regex: /\(\('[^']*'\)\)/, action: { token: 'type' } },
      { regex: /\["[^"]*"\]/, action: { token: 'type' } },
      { regex: /\('[^']*'\)/, action: { token: 'type' } },
      
      // Circles - 蓝色
      { regex: /\(\[[^\]]*\]\)/, action: { token: 'type' } },
      { regex: /\[[^\]]*\]/, action: { token: 'type' } },
      
      // Text - 蓝色
      { regex: /"[^"]*"/, action: { token: 'type' } },
      
      // Lines - 蓝色
      { regex: /--/, action: { token: 'type' } },
      
      // Tables - 紫色
      { regex: /##/, action: { token: 'namespace' } },
      
      // Placeholders - 蓝色
      { regex: /\[\?"[^"]*"\]/, action: { token: 'type' } },
      
      // Images - 蓝色
      { regex: /<[^>]+>/, action: { token: 'type' } },
      
      // Coordinates
      { regex: /@\([^)]+\)/, action: { token: 'number' } },
      
      // Attributes - key为橙色（attribute），值为绿色（string）
      { regex: /(\b\w+)\s*(=)\s*([^\s]+)/, action: { token: 'attribute', next: '@values' } },
      
      // Bold and italic
      { regex: /\bbold\b/, action: { token: 'attribute' } },
      { regex: /\bitalic\b/, action: { token: 'attribute' } },
      
      // Note - 橙色
      { regex: /\bnote\b/, action: { token: 'attribute' } },
      
      // Numbers
      { regex: /\b\d+\b/, action: { token: 'number' } },
      
      // Colors - 绿色
      { regex: /#[0-9a-fA-F]{6}/, action: { token: 'string' } }
    ],
    values: [
      // Values - 绿色
      { regex: /[^\s]+/, action: { token: 'string', next: '@pop' } }
    ]
  }
});

monaco.languages.setLanguageConfiguration('solarwire', {
  comments: {
    lineComment: '//'
  },
  brackets: [
    ['(', ')'],
    ['[', ']'],
    ['{', '}']
  ]
});

// Define the theme colors
monaco.editor.defineTheme('solarwire-theme', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A737D' },
    { token: 'type', foreground: '005CC5' }, // 蓝色 - 元素声明
    { token: 'namespace', foreground: '6F42C1' }, // 紫色 - 表格声明
    { token: 'attribute', foreground: 'D73A49' }, // 橙色 - 属性key和note
    { token: 'string', foreground: '22863A' }, // 绿色 - 值
    { token: 'number', foreground: '005CC5' } // 蓝色 - 数字
  ],
  colors: {}
});