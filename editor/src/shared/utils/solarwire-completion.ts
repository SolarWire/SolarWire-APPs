import { SOLARWIRE_LANGUAGE_ID } from './solarwire-language';

type ElementType = 'rectangle' | 'circle' | 'text' | 'placeholder' | 'image' | 'line' | 'table' | 'table-row' | 'table-cell';

interface CompletionContext {
  elementType: ElementType | null;
  position: 'line-start' | 'in-element' | 'after-coords' | 'in-attrs' | 'attr-value';
  isInTable: boolean;
  isInTableRow: boolean;
  isInTableCell: boolean;
  currentAttr: string | null;
  existingAttrs: Set<string>;
  linePrefix: string;
}

const COMMON_COLORS = [
  { label: '#FFFFFF', detail: 'White' },
  { label: '#000000', detail: 'Black' },
  { label: '#333333', detail: 'Dark Gray' },
  { label: '#6A737D', detail: 'Gray' },
  { label: '#F3F4F6', detail: 'Light Gray' },
  { label: '#E5E7EB', detail: 'Silver' },
  { label: '#3B82F6', detail: 'Blue' },
  { label: '#2563EB', detail: 'Dark Blue' },
  { label: '#1D4ED8', detail: 'Deeper Blue' },
  { label: '#10B981', detail: 'Green' },
  { label: '#059669', detail: 'Dark Green' },
  { label: '#F59E0B', detail: 'Amber' },
  { label: '#EF4444', detail: 'Red' },
  { label: '#8B5CF6', detail: 'Purple' },
  { label: '#EC4899', detail: 'Pink' },
  { label: '#6366F1', detail: 'Indigo' },
  { label: '#14B8A6', detail: 'Teal' },
  { label: '#F97316', detail: 'Orange' },
];

const BOOLEAN_ATTRS = ['bold', 'italic'];

const ENUM_VALUES: Record<string, string[]> = {
  align: ['l', 'c', 'r'],
  'vertical-align': ['t', 'm', 'b'],
  'text-decoration': ['underline', 'line-through'],
  style: ['dashed', 'dotted'],
};

const ELEMENT_ATTRIBUTES: Record<ElementType, string[]> = {
  rectangle: [
    'w', 'h', 'bg', 'c', 'b', 's', 'r', 'size', 'bold', 'italic', 'align',
    'opacity', 'line-height', 'note', 'letter-spacing', 'vertical-align',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'text-decoration', 'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color',
  ],
  circle: [
    'w', 'bg', 'c', 'b', 's', 'size', 'bold', 'italic', 'align',
    'opacity', 'line-height', 'note', 'letter-spacing', 'vertical-align',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'text-decoration', 'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color',
  ],
  text: [
    'c', 'size', 'bold', 'italic', 'align', 'opacity', 'line-height', 'note',
    'letter-spacing', 'text-decoration', 'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color',
  ],
  placeholder: [
    'w', 'h', 'bg', 'c', 'b', 's', 'size', 'bold', 'italic', 'align',
    'opacity', 'line-height', 'note', 'letter-spacing', 'vertical-align',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'text-decoration',
  ],
  image: [
    'w', 'h', 'bg', 'c', 'b', 's', 'size', 'opacity',
    'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color',
  ],
  line: [
    'c', 's', 'style', 'size', 'text-color', 'note',
  ],
  table: [
    'w', 'h', 'border', 'cellspacing', 'b', 'note',
  ],
  'table-row': [
    'h', 'bg', 'c', 'b', 's', 'size', 'bold', 'italic', 'align',
    'line-height', 'letter-spacing', 'vertical-align', 'text-decoration',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  ],
  'table-cell': [
    'bg', 'c', 'b', 's', 'size', 'bold', 'italic', 'align',
    'line-height', 'letter-spacing', 'vertical-align', 'text-decoration',
    'colspan', 'rowspan',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  ],
};

const DOCUMENT_DECLARATIONS = [
  { label: '!title=', detail: 'Page title', insertText: '!title="${1}"' },
  { label: '!c=', detail: 'Default text color', insertText: '!c=${1|#333333,#000000,#FFFFFF|}' },
  { label: '!size=', detail: 'Default font size', insertText: '!size=${1|12,13,14,16,18,20,24|}' },
  { label: '!line-height=', detail: 'Default line height', insertText: '!line-height=${1|18,20,22,24,28|}' },
  { label: '!gap=', detail: 'Default gap', insertText: '!gap=${1|8,12,16,20,24|}' },
  { label: '!bg=', detail: 'Default background color', insertText: '!bg=${1|#FFFFFF,#F9FAFB,#F3F4F6|}' },
  { label: '!r=', detail: 'Default border radius', insertText: '!r=${1|0,4,6,8,12,16|}' },
  { label: '!bold', detail: 'Default bold', insertText: '!bold' },
];

const ELEMENT_TEMPLATES = [
  { label: '["text"]', detail: 'Rectangle', insertText: '["${1:text}"] @(${2:100},${3:50}) w=${4:120} h=${5:40}' },
  { label: '("text")', detail: 'Circle', insertText: '("${1:avatar}") @(${2:100},${3:50}) w=${4:60}' },
  { label: '"text"', detail: 'Text', insertText: '"${1:text}" @(${2:100},${3:50}) size=${4:14}' },
  { label: '[?"text"]', detail: 'Placeholder', insertText: '[?"${1:image}"] @(${2:100},${3:50}) w=${4:150} h=${5:100}' },
  { label: '<url>', detail: 'Image', insertText: '<${1:https://example.com/image.png}> @(${2:100},${3:50}) w=${4:100} h=${5:100}' },
  { label: '-- "label" --', detail: 'Line', insertText: '-- "${1:label}" -- @(${2:50},${3:200})->(${4:450},${5:200})' },
  { label: '##', detail: 'Table', insertText: '## @(${1:50},${2:50}) w=${3:500}' },
];

function analyzeContext(model: any, position: any): CompletionContext {
  const lineNumber = position.lineNumber;
  const column = position.column;
  const lineContent = model.getLineContent(lineNumber);
  const linePrefix = lineContent.substring(0, column - 1);

  let isInTable = false;
  let isInTableRow = false;
  let isInTableCell = false;

  for (let i = lineNumber - 1; i >= 1; i--) {
    const prevLine = model.getLineContent(i).trimStart();
    if (prevLine.startsWith('##')) {
      isInTable = true;
      break;
    }
    if (prevLine === '' || (!prevLine.startsWith('#') && !prevLine.startsWith(' '))) {
      break;
    }
  }

  const trimmedPrefix = linePrefix.trimStart();
  const indentLevel = linePrefix.length - trimmedPrefix.length;

  if (isInTable && trimmedPrefix.startsWith('#') && indentLevel >= 2) {
    const afterHash = trimmedPrefix.substring(1).trimStart();
    if (afterHash.length > 0 && (afterHash.startsWith('[') || afterHash.startsWith('"') || afterHash.startsWith('('))) {
      isInTableCell = true;
    } else {
      isInTableRow = true;
    }
  }

  let elementType: ElementType | null = null;
  let contextPosition: CompletionContext['position'] = 'line-start';

  if (trimmedPrefix.startsWith('!')) {
    contextPosition = 'in-element';
  } else if (trimmedPrefix.startsWith('[?')) {
    elementType = 'placeholder';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('[')) {
    elementType = 'rectangle';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('(')) {
    elementType = 'circle';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('--')) {
    elementType = 'line';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('<')) {
    elementType = 'image';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('##')) {
    elementType = 'table';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (isInTableRow) {
    elementType = 'table-row';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (isInTableCell) {
    elementType = 'table-cell';
    contextPosition = detectPositionInElement(trimmedPrefix);
  } else if (trimmedPrefix.startsWith('"') || trimmedPrefix.startsWith('"""')) {
    elementType = 'text';
    contextPosition = detectPositionInElement(trimmedPrefix);
  }

  const existingAttrs = extractExistingAttrs(trimmedPrefix);
  const currentAttr = detectCurrentAttr(trimmedPrefix);

  if (currentAttr && contextPosition === 'in-attrs') {
    const attrEqualsMatch = trimmedPrefix.match(/(\w[-\w]*)\s*=\s*$/);
    if (attrEqualsMatch) {
      contextPosition = 'attr-value';
    }
  }

  return {
    elementType,
    position: contextPosition,
    isInTable,
    isInTableRow,
    isInTableCell,
    currentAttr,
    existingAttrs,
    linePrefix,
  };
}

function detectPositionInElement(prefix: string): CompletionContext['position'] {
  const coordMatch = prefix.match(/@\([^)]*\)/);
  if (!coordMatch) {
    return 'in-element';
  }

  const afterCoord = prefix.substring(coordMatch.index! + coordMatch[0].length).trimStart();
  if (afterCoord.length === 0) {
    return 'after-coords';
  }

  return 'in-attrs';
}

function extractExistingAttrs(prefix: string): Set<string> {
  const attrs = new Set<string>();
  const attrRegex = /(\w[-\w]*)\s*=/g;
  let match;
  while ((match = attrRegex.exec(prefix)) !== null) {
    attrs.add(match[1]);
  }
  const boolRegex = /\b(bold|italic)\b/g;
  while ((match = boolRegex.exec(prefix)) !== null) {
    attrs.add(match[1]);
  }
  return attrs;
}

function detectCurrentAttr(prefix: string): string | null {
  const match = prefix.match(/(\w[-\w]*)\s*=\s*$/);
  return match ? match[1] : null;
}

function buildAttributeSuggestions(
  elementType: ElementType,
  existingAttrs: Set<string>,
  range: any,
  monaco: any,
): any[] {
  const allowedAttrs = ELEMENT_ATTRIBUTES[elementType] || [];
  const suggestions: any[] = [];

  for (const attr of allowedAttrs) {
    if (existingAttrs.has(attr)) continue;

    if (BOOLEAN_ATTRS.includes(attr)) {
      suggestions.push({
        label: attr,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: attr,
        detail: 'Boolean attribute',
        range,
      });
      continue;
    }

    if (attr === 'note') {
      suggestions.push({
        label: 'note=',
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: 'note="""${1}"""',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Note (multi-line)',
        range,
      });
      continue;
    }

    const enumVals = ENUM_VALUES[attr];
    if (enumVals) {
      const choices = enumVals.map(v => v).join(',');
      suggestions.push({
        label: `${attr}=`,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: `${attr}=\${1|${choices}|}`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: `Enum: ${enumVals.join(' | ')}`,
        range,
      });
      continue;
    }

    if (['bg', 'c', 'b', 'shadow-color'].includes(attr)) {
      const colorChoices = COMMON_COLORS.slice(0, 8).map(c => c.label).join(',');
      suggestions.push({
        label: `${attr}=`,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: `${attr}=\${1|${colorChoices}|}`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: 'Color value',
        range,
      });
      continue;
    }

    suggestions.push({
      label: `${attr}=`,
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: `${attr}=\${1}`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Attribute',
      range,
    });
  }

  return suggestions;
}

function buildAttrValueSuggestions(
  attrName: string,
  range: any,
  monaco: any,
): any[] {
  const enumVals = ENUM_VALUES[attrName];
  if (enumVals) {
    return enumVals.map(val => ({
      label: val,
      kind: monaco.languages.CompletionItemKind.EnumMember,
      insertText: val,
      detail: `${attrName} value`,
      range,
    }));
  }

  if (['bg', 'c', 'b', 'shadow-color'].includes(attrName)) {
    return COMMON_COLORS.map(color => ({
      label: color.label,
      kind: monaco.languages.CompletionItemKind.Color,
      insertText: color.label,
      detail: color.detail,
      range,
    }));
  }

  if (attrName === 'w' || attrName === 'h') {
    return [
      { label: '100', kind: monaco.languages.CompletionItemKind.Value, insertText: '100', detail: 'Common size', range },
      { label: '120', kind: monaco.languages.CompletionItemKind.Value, insertText: '120', detail: 'Common size', range },
      { label: '200', kind: monaco.languages.CompletionItemKind.Value, insertText: '200', detail: 'Common size', range },
      { label: '300', kind: monaco.languages.CompletionItemKind.Value, insertText: '300', detail: 'Common size', range },
    ];
  }

  if (attrName === 'size') {
    return [
      { label: '12', kind: monaco.languages.CompletionItemKind.Value, insertText: '12', detail: 'Small', range },
      { label: '14', kind: monaco.languages.CompletionItemKind.Value, insertText: '14', detail: 'Normal', range },
      { label: '16', kind: monaco.languages.CompletionItemKind.Value, insertText: '16', detail: 'Medium', range },
      { label: '18', kind: monaco.languages.CompletionItemKind.Value, insertText: '18', detail: 'Large', range },
      { label: '24', kind: monaco.languages.CompletionItemKind.Value, insertText: '24', detail: 'Title', range },
    ];
  }

  if (attrName === 'r') {
    return [
      { label: '4', kind: monaco.languages.CompletionItemKind.Value, insertText: '4', detail: 'Small radius', range },
      { label: '8', kind: monaco.languages.CompletionItemKind.Value, insertText: '8', detail: 'Medium radius', range },
      { label: '12', kind: monaco.languages.CompletionItemKind.Value, insertText: '12', detail: 'Large radius', range },
      { label: '16', kind: monaco.languages.CompletionItemKind.Value, insertText: '16', detail: 'Extra large radius', range },
    ];
  }

  if (attrName === 's') {
    return [
      { label: '1', kind: monaco.languages.CompletionItemKind.Value, insertText: '1', detail: 'Thin border', range },
      { label: '2', kind: monaco.languages.CompletionItemKind.Value, insertText: '2', detail: 'Medium border', range },
      { label: '3', kind: monaco.languages.CompletionItemKind.Value, insertText: '3', detail: 'Thick border', range },
    ];
  }

  if (attrName === 'opacity') {
    return [
      { label: '0.1', kind: monaco.languages.CompletionItemKind.Value, insertText: '0.1', detail: '10%', range },
      { label: '0.3', kind: monaco.languages.CompletionItemKind.Value, insertText: '0.3', detail: '30%', range },
      { label: '0.5', kind: monaco.languages.CompletionItemKind.Value, insertText: '0.5', detail: '50%', range },
      { label: '0.7', kind: monaco.languages.CompletionItemKind.Value, insertText: '0.7', detail: '70%', range },
      { label: '0.9', kind: monaco.languages.CompletionItemKind.Value, insertText: '0.9', detail: '90%', range },
    ];
  }

  return [];
}

function buildElementTemplateSuggestions(range: any, monaco: any): any[] {
  return ELEMENT_TEMPLATES.map(tpl => ({
    label: tpl.label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: tpl.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: tpl.detail,
    range,
  }));
}

function buildDeclarationSuggestions(range: any, monaco: any): any[] {
  return DOCUMENT_DECLARATIONS.map(decl => ({
    label: decl.label,
    kind: monaco.languages.CompletionItemKind.Property,
    insertText: decl.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: decl.detail,
    range,
  }));
}

function buildCoordSuggestions(range: any, monaco: any): any[] {
  return [
    {
      label: '@(x,y)',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '@(${1:100},${2:50})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Absolute coordinates',
      range,
    },
    {
      label: '@(R+dx,T+dy)',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '@(R+\${1:10},T+\${2:0})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Edge-relative coordinates',
      range,
    },
    {
      label: '@(C+0,T+0)',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: '@(C+\${1:0},T+\${2:0})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: 'Center-aligned coordinates',
      range,
    },
  ];
}

export function registerSolarWireCompletion(monaco: any): void {
  if (!monaco) return;

  monaco.languages.registerCompletionItemProvider(SOLARWIRE_LANGUAGE_ID, {
    triggerCharacters: [' ', '=', '!', '[', '(', '"', '<', '-', '@', '#'],
    provideCompletionItems(model: any, position: any) {
      const context = analyzeContext(model, position);
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const trimmedPrefix = context.linePrefix.trimStart();

      if (trimmedPrefix.startsWith('!') && context.position === 'in-element') {
        return { suggestions: buildDeclarationSuggestions(range, monaco) };
      }

      if (context.position === 'line-start' && !context.isInTable) {
        const declSuggestions = buildDeclarationSuggestions(range, monaco);
        const elemSuggestions = buildElementTemplateSuggestions(range, monaco);
        return { suggestions: [...declSuggestions, ...elemSuggestions] };
      }

      if (context.position === 'in-element' && context.elementType && !context.isInTableRow) {
        return { suggestions: buildCoordSuggestions(range, monaco) };
      }

      if (context.position === 'after-coords' || context.position === 'in-attrs') {
        if (context.elementType) {
          return { suggestions: buildAttributeSuggestions(context.elementType, context.existingAttrs, range, monaco) };
        }
      }

      if (context.position === 'attr-value' && context.currentAttr) {
        return { suggestions: buildAttrValueSuggestions(context.currentAttr, range, monaco) };
      }

      if (context.isInTableRow && !context.isInTableCell && context.position === 'in-attrs') {
        return { suggestions: buildAttributeSuggestions('table-row', context.existingAttrs, range, monaco) };
      }

      if (context.isInTableCell && context.position === 'in-attrs') {
        return { suggestions: buildAttributeSuggestions('table-cell', context.existingAttrs, range, monaco) };
      }

      return { suggestions: [] };
    },
  });
}
