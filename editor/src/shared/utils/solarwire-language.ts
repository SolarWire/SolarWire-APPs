export const SOLARWIRE_LANGUAGE_ID = 'solarwire';

export function registerSolarWireLanguage(monaco: any): void {
  if (!monaco) return;

  registerTheme(monaco);

  const existing = monaco.languages.getLanguages().find((lang: any) => lang.id === SOLARWIRE_LANGUAGE_ID);
  if (existing) return;

  monaco.languages.register({ id: SOLARWIRE_LANGUAGE_ID });

  registerMinimalTokenizer(monaco);
  registerLanguageConfiguration(monaco);
  registerSemanticTokensProvider(monaco);
}

function registerMinimalTokenizer(monaco: any): void {
  monaco.languages.setMonarchTokensProvider(SOLARWIRE_LANGUAGE_ID, {
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

const TOKEN_TYPES = [
  'elementDelimiter',
  'elementContent',
  'tableDelimiter',
  'coordDelimiter',
  'coordNumber',
  'attrName',
  'attrEquals',
  'attrValue',
  'noteDelimiter',
  'noteContent',
  'comment',
  'declaration',
  'lineDelimiter',
];

const TOKEN_MODIFIERS: string[] = [];

function registerSemanticTokensProvider(monaco: any): void {
  const legend: any = {
    tokenTypes: TOKEN_TYPES,
    tokenModifiers: TOKEN_MODIFIERS,
  };

  monaco.languages.registerDocumentSemanticTokensProvider(SOLARWIRE_LANGUAGE_ID, {
    getLegend: () => legend,
    provideDocumentSemanticTokens: (model: any) => {
      const text = model.getValue();
      const lines = text.split('\n');
      const tokens = tokenizeSolarWire(lines);

      const data = new Uint32Array(tokens.length * 5);
      let prevLine = 0;
      let prevCol = 0;

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const lineDelta = t.line - prevLine;
        const colDelta = prevLine === t.line ? t.col - prevCol : t.col;
        const offset = i * 5;
        data[offset] = lineDelta;
        data[offset + 1] = colDelta;
        data[offset + 2] = t.length;
        data[offset + 3] = t.typeIndex;
        data[offset + 4] = 0;
        prevLine = t.line;
        prevCol = t.col;
      }

      return {
        data: data,
        resultId: undefined,
      };
    },
    releaseDocumentSemanticTokens: () => {},
  });
}

interface SemanticToken {
  line: number;
  col: number;
  length: number;
  typeIndex: number;
}

function tokenizeSolarWire(lines: string[]): SemanticToken[] {
  const tokens: SemanticToken[] = [];
  const occupied = new Map<string, number>();

  const mark = (line: number, col: number, length: number, typeIndex: number) => {
    for (let c = col; c < col + length; c++) {
      occupied.set(`${line}:${c}`, typeIndex);
    }
    tokens.push({ line, col, length, typeIndex });
  };

  const isOccupied = (line: number, col: number, length: number): boolean => {
    for (let c = col; c < col + length; c++) {
      if (occupied.has(`${line}:${c}`)) return true;
    }
    return false;
  };

  scanComments(lines, mark);
  scanNoteContent(lines, mark, isOccupied);
  scanElementDeclarations(lines, mark, isOccupied);
  scanTableDeclarations(lines, mark, isOccupied);
  scanCoordinates(lines, mark, isOccupied);
  scanAttributes(lines, mark, isOccupied);
  scanDeclarations(lines, mark, isOccupied);

  tokens.sort((a, b) => (a.line !== b.line ? a.line - b.line : a.col - b.col));
  return tokens;
}

function scanComments(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
): void {
  const COMMENT = TOKEN_TYPES.indexOf('comment');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let inString = false;
    let stringChar = '';
    let tripleQuotePos = -1;
    for (let j = 0; j < line.length; j++) {
      if (tripleQuotePos >= 0) {
        if (j <= tripleQuotePos + 2) continue;
        if (line.substring(j, j + 3) === '"""') {
          tripleQuotePos = -1;
          j += 2;
          continue;
        }
        continue;
      }
      if (inString) {
        if (line[j] === stringChar) inString = false;
        continue;
      }
      if (line.substring(j, j + 3) === '"""') {
        tripleQuotePos = j;
        j += 2;
        continue;
      }
      if (line[j] === '"' || line[j] === "'") {
        inString = true;
        stringChar = line[j];
        continue;
      }
      if (line.substring(j, j + 2) === '//') {
        mark(i, j, line.length - j, COMMENT);
        break;
      }
    }
  }
}

function scanNoteContent(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const NOTE_DELIM = TOKEN_TYPES.indexOf('noteDelimiter');
  const NOTE_CONTENT = TOKEN_TYPES.indexOf('noteContent');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const noteMatch = line.match(/\bnote[ \t]*=/g);
    if (!noteMatch) continue;

    for (const nm of noteMatch) {
      const noteStart = line.indexOf(nm);
      const valueStart = noteStart + nm.length;

      if (valueStart >= line.length) continue;

      if (line.substring(valueStart, valueStart + 3) === '"""') {
        mark(i, valueStart, 3, NOTE_DELIM);
        let contentStart = valueStart + 3;
        let endLine = -1;
        let endCol = -1;

        for (let li = i; li < lines.length; li++) {
          const searchLine = li === i ? lines[li].substring(contentStart) : lines[li];
          const searchOffset = li === i ? contentStart : 0;
          const endIdx = searchLine.indexOf('"""');

          if (endIdx !== -1) {
            if (endIdx > 0) {
              mark(li, searchOffset, endIdx, NOTE_CONTENT);
            }
            endLine = li;
            endCol = searchOffset + endIdx;
            mark(endLine, endCol, 3, NOTE_DELIM);
            break;
          } else {
            if (searchLine.length > 0) {
              mark(li, searchOffset, searchLine.length, NOTE_CONTENT);
            }
          }
        }
      } else if (line[valueStart] === '"') {
        mark(i, valueStart, 1, NOTE_DELIM);
        const endIdx = line.indexOf('"', valueStart + 1);
        if (endIdx !== -1) {
          if (endIdx - valueStart - 1 > 0) {
            mark(i, valueStart + 1, endIdx - valueStart - 1, NOTE_CONTENT);
          }
          mark(i, endIdx, 1, NOTE_DELIM);
        } else {
          if (line.length - valueStart - 1 > 0) {
            mark(i, valueStart + 1, line.length - valueStart - 1, NOTE_CONTENT);
          }
        }
      }
    }
  }
}

function scanElementDeclarations(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const DELIM = TOKEN_TYPES.indexOf('elementDelimiter');
  const CONTENT = TOKEN_TYPES.indexOf('elementContent');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const bracketPairs = findMatchingPairs(line, '[', ']');
    for (const pair of bracketPairs) {
      if (isOccupied(i, pair.open, 1)) continue;
      mark(i, pair.open, 1, DELIM);
      mark(i, pair.close, 1, DELIM);
      if (pair.close - pair.open > 1) {
        const innerStart = pair.open + 1;
        const innerEnd = pair.close;
        const innerText = line.substring(innerStart, innerEnd);
        const quotedContent = extractQuotedContent(innerText, 0);
        if (quotedContent) {
          mark(i, innerStart + quotedContent.quoteStart, 1, DELIM);
          if (quotedContent.contentLength > 0) {
            mark(i, innerStart + quotedContent.contentStart, quotedContent.contentLength, CONTENT);
          }
          mark(i, innerStart + quotedContent.quoteEnd, 1, DELIM);
        } else {
          if (innerText.length > 0 && !isOccupied(i, innerStart, innerText.length)) {
            mark(i, innerStart, innerText.length, CONTENT);
          }
        }
      }
    }

    const parenPairs = findMatchingPairs(line, '(', ')');
    for (const pair of parenPairs) {
      if (isOccupied(i, pair.open, 1)) continue;
      const beforeOpen = line.substring(Math.max(0, pair.open - 1), pair.open);
      if (beforeOpen === '@') continue;

      mark(i, pair.open, 1, DELIM);
      mark(i, pair.close, 1, DELIM);
      if (pair.close - pair.open > 1) {
        const innerStart = pair.open + 1;
        const innerEnd = pair.close;
        const innerText = line.substring(innerStart, innerEnd);
        const quotedContent = extractQuotedContent(innerText, 0);
        if (quotedContent) {
          mark(i, innerStart + quotedContent.quoteStart, 1, DELIM);
          if (quotedContent.contentLength > 0) {
            mark(i, innerStart + quotedContent.contentStart, quotedContent.contentLength, CONTENT);
          }
          mark(i, innerStart + quotedContent.quoteEnd, 1, DELIM);
        } else {
          if (innerText.length > 0 && !isOccupied(i, innerStart, innerText.length)) {
            mark(i, innerStart, innerText.length, CONTENT);
          }
        }
      }
    }

    const anglePairs = findMatchingPairs(line, '<', '>');
    for (const pair of anglePairs) {
      if (isOccupied(i, pair.open, 1)) continue;
      mark(i, pair.open, 1, DELIM);
      mark(i, pair.close, 1, DELIM);
      if (pair.close - pair.open > 1) {
        const innerStart = pair.open + 1;
        const innerEnd = pair.close;
        const innerText = line.substring(innerStart, innerEnd);
        if (innerText.length > 0 && !isOccupied(i, innerStart, innerText.length)) {
          mark(i, innerStart, innerText.length, CONTENT);
        }
      }
    }

    const linePattern = /--(?:\s*"([^"]*)")?/g;
    let lineMatch;
    while ((lineMatch = linePattern.exec(line)) !== null) {
      const dashStart = lineMatch.index;
      if (isOccupied(i, dashStart, 2)) continue;
      mark(i, dashStart, 2, DELIM);
    }
  }
}

function scanTableDeclarations(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const TABLE = TOKEN_TYPES.indexOf('tableDelimiter');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith('##')) {
      if (!isOccupied(i, indent, 2)) {
        mark(i, indent, 2, TABLE);
      }
    } else if (trimmed.startsWith('#') && !trimmed.startsWith('##')) {
      if (!isOccupied(i, indent, 1)) {
        mark(i, indent, 1, TABLE);
      }
    }
  }
}

function scanCoordinates(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const COORD_DELIM = TOKEN_TYPES.indexOf('coordDelimiter');
  const COORD_NUM = TOKEN_TYPES.indexOf('coordNumber');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const coordPattern = /@\(([^)]*)\)/g;
    let match;
    while ((match = coordPattern.exec(line)) !== null) {
      const atIdx = match.index;
      if (isOccupied(i, atIdx, 1)) continue;

      mark(i, atIdx, 1, COORD_DELIM);
      mark(i, atIdx + 1, 1, COORD_DELIM);

      const innerStart = atIdx + 2;
      const innerEnd = atIdx + match[0].length - 1;
      mark(i, innerEnd, 1, COORD_DELIM);

      const inner = match[1];
      const numberPattern = /[+\-]?\d+(\.\d+)?/g;
      let numMatch;
      while ((numMatch = numberPattern.exec(inner)) !== null) {
        const numCol = innerStart + numMatch.index;
        if (!isOccupied(i, numCol, numMatch[0].length)) {
          mark(i, numCol, numMatch[0].length, COORD_NUM);
        }
      }

      const dirPattern = /[LRCBT]/g;
      let dirMatch;
      while ((dirMatch = dirPattern.exec(inner)) !== null) {
        const dirCol = innerStart + dirMatch.index;
        if (!isOccupied(i, dirCol, 1)) {
          mark(i, dirCol, 1, COORD_NUM);
        }
      }
    }

    const arrowPattern = /->\(([^)]*)\)/g;
    let arrowMatch;
    while ((arrowMatch = arrowPattern.exec(line)) !== null) {
      const arrowIdx = arrowMatch.index;
      if (isOccupied(i, arrowIdx, 2)) continue;

      mark(i, arrowIdx, 2, COORD_DELIM);
      mark(i, arrowIdx + 2, 1, COORD_DELIM);

      const innerStart = arrowIdx + 3;
      const innerEnd = arrowIdx + arrowMatch[0].length - 1;
      mark(i, innerEnd, 1, COORD_DELIM);

      const inner = arrowMatch[1];
      const numberPattern = /[+\-]?\d+(\.\d+)?/g;
      let numMatch;
      while ((numMatch = numberPattern.exec(inner)) !== null) {
        const numCol = innerStart + numMatch.index;
        if (!isOccupied(i, numCol, numMatch[0].length)) {
          mark(i, numCol, numMatch[0].length, COORD_NUM);
        }
      }
    }
  }
}

function scanAttributes(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const ATTR_NAME = TOKEN_TYPES.indexOf('attrName');
  const ATTR_EQUALS = TOKEN_TYPES.indexOf('attrEquals');
  const ATTR_VALUE = TOKEN_TYPES.indexOf('attrValue');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const attrPattern = /([a-zA-Z_][-a-zA-Z0-9_]*)([ \t]*=[ \t]*)/g;
    let match;
    while ((match = attrPattern.exec(line)) !== null) {
      const nameStart = match.index;
      const nameLength = match[1].length;
      const equalsStart = nameStart + nameLength;
      const equalsLength = match[2].length;
      const valueStart = equalsStart + equalsLength;

      if (isOccupied(i, nameStart, nameLength)) continue;

      if (match[1] === 'note') continue;

      mark(i, nameStart, nameLength, ATTR_NAME);
      mark(i, equalsStart, equalsLength, ATTR_EQUALS);

      if (valueStart < line.length) {
        if (line.substring(valueStart, valueStart + 3) === '"""') {
          // handled by note or triple-quoted attr
        } else if (line[valueStart] === '"') {
          const endQuote = line.indexOf('"', valueStart + 1);
          if (endQuote !== -1) {
            const contentLen = endQuote - valueStart - 1;
            if (contentLen > 0 && !isOccupied(i, valueStart + 1, contentLen)) {
              mark(i, valueStart + 1, contentLen, ATTR_VALUE);
            }
          } else {
            const contentLen = line.length - valueStart - 1;
            if (contentLen > 0 && !isOccupied(i, valueStart + 1, contentLen)) {
              mark(i, valueStart + 1, contentLen, ATTR_VALUE);
            }
          }
        } else {
          const valueMatch = line.substring(valueStart).match(/^([^\s]+)/);
          if (valueMatch) {
            const valLen = valueMatch[1].length;
            if (!isOccupied(i, valueStart, valLen)) {
              mark(i, valueStart, valLen, ATTR_VALUE);
            }
          }
        }
      }
    }

    const boolAttrPattern = /[ \t]+(bold|italic)(?![a-zA-Z0-9_-])/g;
    let boolMatch;
    while ((boolMatch = boolAttrPattern.exec(line)) !== null) {
      const attrStart = boolMatch.index + boolMatch[0].indexOf(boolMatch[1]);
      const attrLen = boolMatch[1].length;
      if (!isOccupied(i, attrStart, attrLen)) {
        mark(i, attrStart, attrLen, ATTR_NAME);
      }
    }
  }
}

function scanDeclarations(
  lines: string[],
  mark: (line: number, col: number, length: number, typeIndex: number) => void,
  isOccupied: (line: number, col: number, length: number) => boolean,
): void {
  const DECL = TOKEN_TYPES.indexOf('declaration');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith('!')) {
      if (!isOccupied(i, indent, 1)) {
        mark(i, indent, 1, DECL);
      }
    }
  }
}

interface PairMatch {
  open: number;
  close: number;
}

function findMatchingPairs(line: string, openChar: string, closeChar: string): PairMatch[] {
  const pairs: PairMatch[] = [];
  const stack: number[] = [];

  for (let j = 0; j < line.length; j++) {
    if (line[j] === openChar) {
      stack.push(j);
    } else if (line[j] === closeChar && stack.length > 0) {
      const openIdx = stack.pop()!;
      pairs.push({ open: openIdx, close: j });
    }
  }

  return pairs;
}

interface QuotedContent {
  quoteStart: number;
  contentStart: number;
  contentLength: number;
  quoteEnd: number;
}

function extractQuotedContent(text: string, offset: number): QuotedContent | null {
  if (text.length === 0) return null;

  if (text.startsWith('"""')) {
    const endIdx = text.indexOf('"""', 3);
    if (endIdx !== -1) {
      return {
        quoteStart: 0,
        contentStart: 3,
        contentLength: endIdx - 3,
        quoteEnd: endIdx,
      };
    }
    return {
      quoteStart: 0,
      contentStart: 3,
      contentLength: text.length - 3,
      quoteEnd: -1,
    };
  }

  if (text.startsWith('"')) {
    const endIdx = text.indexOf('"', 1);
    if (endIdx !== -1) {
      return {
        quoteStart: 0,
        contentStart: 1,
        contentLength: endIdx - 1,
        quoteEnd: endIdx,
      };
    }
    return {
      quoteStart: 0,
      contentStart: 1,
      contentLength: text.length - 1,
      quoteEnd: -1,
    };
  }

  return null;
}

function registerTheme(monaco: any): void {
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
      { token: 'lineDelimiter', foreground: 'DC2626' },
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
      { token: 'lineDelimiter', foreground: 'F87171' },
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
