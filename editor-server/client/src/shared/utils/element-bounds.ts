/**
 * 元素边界检测工具函数
 */

export enum ElementType {
  Simple = 'Simple',
  Table = 'Table',
  MultilineText = 'MultilineText'
}

export interface NoteBounds {
  noteStartLine: number;
  noteEndLine: number;
  hasNote: boolean;
}

export interface TableBounds {
  tableDeclarationLine: number;
  tableNoteStartLine?: number;
  tableNoteEndLine?: number;
  headerLine: number;
  tableEndLine: number;
}

export interface MultilineTextBounds {
  textDeclarationLine: number;
  textStartLine: number;
  textEndLine: number;
}

export interface ElementBoundsInfo {
  type: ElementType;
  elementLine: number;
  attributeLine: number;
  noteBounds?: NoteBounds;
  tableBounds?: TableBounds;
  multilineTextBounds?: MultilineTextBounds;
  getStartLine(): number;
  getEndLine(): number;
  getRelatedLines(): number[];
}

export function isInsideMultilineNoteContent(lines: string[], lineIndex: number): boolean {
  if (lineIndex < 0 || lineIndex >= lines.length) return false;

  let inMultilineNote = false;
  let multilineQuote = '';
  let noteStartLine = -1;

  for (let i = 0; i <= lineIndex; i++) {
    const currentLine = lines[i];

    if (!inMultilineNote) {
      // 检查是否是note属性的开始
      const noteMatch = currentLine.match(/note=(["']{3})/);
      if (noteMatch) {
        const quote = noteMatch[1];
        const matchIndex = currentLine.indexOf(noteMatch[0]);
        const afterNoteStart = currentLine.substring(matchIndex + noteMatch[0].length);
        // 检查note的结束引号是否在同一行
        if (!afterNoteStart.includes(quote)) {
          inMultilineNote = true;
          multilineQuote = quote;
          noteStartLine = i;
        }
      }
    } else {
      if (currentLine.includes(multilineQuote)) {
        // 检查这个"""是否是note的结束，而不是多行文本的结束
        // 如果这一行包含note=，则说明这是另一个note的开始，不是当前note的结束
        if (currentLine.includes('note=')) {
          continue;
        }
        inMultilineNote = false;
        multilineQuote = '';
        noteStartLine = -1;
      }
    }
  }

  return inMultilineNote;
}

/**
 * 检测note的第一行和最后一行位置
 * @param content 代码内容
 * @param startLine 起始行号（从1开始）
 * @returns 包含起始行和结束行的对象
 */
export function detectNoteBounds(
  content: string,
  startLine: number
): { startLine: number; endLine: number } {
  const lines = content.split(/\r?\n/);
  let endLine = startLine;
  
  const i = startLine - 1;
  if (i < 0 || i >= lines.length) {
    return { startLine, endLine };
  }
  
  const currentLine = lines[i];
  const noteIndex = currentLine.indexOf('note=');
  
  if (noteIndex !== -1) {
    const noteStart = noteIndex + 5;
    if (noteStart < currentLine.length) {
      if (currentLine.substring(noteStart, noteStart + 3) === '"""') {
        // 三引号开始的note
        const endQuoteInLine = currentLine.indexOf('"""', noteStart + 3);
        if (endQuoteInLine === -1) {
          // 跨行的note，寻找结束的三引号
          let j = i + 1;
          while (j < lines.length) {
            endLine = j + 1;
            if (lines[j].includes('"""')) {
              break;
            }
            j++;
          }
        }
      } else if (currentLine[noteStart] === '"' || currentLine[noteStart] === "'") {
        // 单引号或双引号开始的note
        const quote = currentLine[noteStart];
        const endQuoteInLine = currentLine.indexOf(quote, noteStart + 1);
        if (endQuoteInLine === -1) {
          // 跨行的note，寻找结束的引号
          let j = i + 1;
          while (j < lines.length) {
            endLine = j + 1;
            if (lines[j].includes(quote)) {
              break;
            }
            j++;
          }
        }
      }
    }
  } else {
    // 检查下一行是否是独立的note=行
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.trim().startsWith('note=')) {
        endLine = startLine + 1;
        
        if (nextLine.includes('"""')) {
          // 三引号note，寻找结束的三引号
          const endQuoteInLine = nextLine.indexOf('"""', nextLine.indexOf('note=') + 5 + 3);
          if (endQuoteInLine === -1) {
            let j = i + 2;
            while (j < lines.length) {
              endLine = j + 1;
              if (lines[j].includes('"""')) {
                break;
              }
              j++;
            }
          }
        }
      }
    }
  }
  
  return { startLine, endLine };
}

/**
 * 检测text元素的三引号多行文本的第一行和最后一行位置
 * @param content 代码内容
 * @param startLine 起始行号（从1开始）
 * @returns 包含起始行和结束行的对象
 */
export function detectMultilineTextBounds(
  content: string,
  startLine: number
): { startLine: number; endLine: number } {
  const lines = content.split(/\r?\n/);
  let endLine = startLine;

  const i = startLine - 1;
  if (i < 0 || i >= lines.length) {
    return { startLine, endLine };
  }

  const currentLine = lines[i];
  const trimmedLine = currentLine.trim();

  // 检查是否是三引号开始的text元素
  // text元素格式: "文本内容" 或 """多行文本"""
  const tripleQuoteMatch = trimmedLine.match(/^"""/);
  if (tripleQuoteMatch) {
    // 检查结束的三引号是否在同一行
    const endQuoteInLine = currentLine.indexOf('"""', 3);
    if (endQuoteInLine === -1) {
      // 跨行的text，寻找结束的三引号
      let j = i + 1;
      while (j < lines.length) {
        if (lines[j].includes('"""')) {
          endLine = j + 1;
          break;
        }
        j++;
      }
    } else {
      // 单行的text
      endLine = startLine;
    }
  }

  return { startLine, endLine };
}

/**
 * 检测表格元素的第一行和最后一行位置
 * @param content 代码内容
 * @param startLine 表格起始行号（从1开始）
 * @returns 包含起始行和结束行的对象
 */
export function detectTableBounds(
  content: string,
  startLine: number
): { startLine: number; endLine: number } {
  const lines = content.split(/\r?\n/);

  
  const i = startLine - 1;
  if (i < 0 || i >= lines.length) {
    return { startLine, endLine: startLine };
  }
  
  const currentLine = lines[i];
  const trimmedLine = currentLine.trim();
  
  if (!trimmedLine.startsWith('##')) {
    return { startLine, endLine: startLine };
  }
  
  const getIndent = (line: string): number => {
    let indent = 0;
    while (indent < line.length && line[indent] === ' ') {
      indent++;
    }
    return indent;
  };
  
  // 先检测表格声明行的 note 边界，避免将 note 内容误判为下一个元素
  const { endLine: noteEndLine } = detectNoteBounds(content, startLine);
  
  // 从 note 结束行的下一行开始逐行检测
  const scanStartIndex = noteEndLine;
  
  for (let j = scanStartIndex; j < lines.length; j++) {
    const line = lines[j];
    const lineTrimmed = line.trim();

    if (lineTrimmed === '') {
      continue;
    }

    const lineIndent = getIndent(line);

    if (lineIndent === 0) {
      return { startLine, endLine: j };
    }
  }
  
  // 没有找到下一个无缩进行，表格是文件最后一个元素
  // 从文件末尾往前找最后一个非空行
  let endIdx = lines.length - 1;
  while (endIdx >= scanStartIndex) {
    const line = lines[endIdx].trim();
    if (line === '') {
      endIdx--;
    } else {
      break;
    }
  }
  
  return { startLine, endLine: endIdx + 1 };
}

/**
 * 创建ElementBoundsInfo实例
 */
export function createElementBoundsInfo(
  type: ElementType,
  elementLine: number,
  attributeLine: number,
  options: {
    noteBounds?: NoteBounds;
    tableBounds?: TableBounds;
    multilineTextBounds?: MultilineTextBounds;
  } = {}
): ElementBoundsInfo {
  const { noteBounds, tableBounds, multilineTextBounds } = options;
  
  return {
    type,
    elementLine,
    attributeLine,
    noteBounds,
    tableBounds,
    multilineTextBounds,
    getStartLine() {
      if (tableBounds) return tableBounds.headerLine;
      if (multilineTextBounds) return multilineTextBounds.textStartLine;
      if (noteBounds?.hasNote) return noteBounds.noteStartLine;
      return elementLine;
    },
    getEndLine() {
      if (tableBounds) return tableBounds.tableEndLine;
      if (multilineTextBounds) return multilineTextBounds.textEndLine;
      if (noteBounds?.hasNote) return noteBounds.noteEndLine;
      return elementLine;
    },
    getRelatedLines() {
      const lines: number[] = [elementLine];
      
      if (noteBounds?.hasNote) {
        for (let i = noteBounds.noteStartLine; i <= noteBounds.noteEndLine; i++) {
          if (!lines.includes(i)) lines.push(i);
        }
      }
      
      if (tableBounds) {
        for (let i = tableBounds.headerLine; i <= tableBounds.tableEndLine; i++) {
          if (!lines.includes(i)) lines.push(i);
        }
      }
      
      if (multilineTextBounds) {
        for (let i = multilineTextBounds.textStartLine; i <= multilineTextBounds.textEndLine; i++) {
          if (!lines.includes(i)) lines.push(i);
        }
      }
      
      return lines.sort((a, b) => a - b);
    }
  };
}

/**
 * 检测元素的边界信息
 */
export function detectElementBounds(content: string, lineNum: number): ElementBoundsInfo {
  const lines = content.split(/\r?\n/);
  
  if (lineNum < 1 || lineNum > lines.length) {
    return createElementBoundsInfo(ElementType.Simple, lineNum, lineNum);
  }
  
  const i = lineNum - 1;
  const currentLine = lines[i];
  const trimmedLine = currentLine.trim();

  // 检测table元素
  if (trimmedLine.startsWith('##')) {
    const { startLine, endLine } = detectTableBounds(content, lineNum);
    const noteResult = detectNoteBounds(content, lineNum);
    
    return createElementBoundsInfo(ElementType.Table, startLine, startLine, {
      tableBounds: {
        tableDeclarationLine: startLine,
        tableNoteStartLine: noteResult.startLine > startLine ? noteResult.startLine : undefined,
        tableNoteEndLine: noteResult.endLine > startLine ? noteResult.endLine : undefined,
        headerLine: startLine,
        tableEndLine: endLine
      }
    });
  }

  // 检测text元素的三引号多行文本
  // 如果当前行以"""开头，直接检测
  if (trimmedLine.match(/^"""/)) {
    const { startLine, endLine } = detectMultilineTextBounds(content, lineNum);
    
    return createElementBoundsInfo(ElementType.MultilineText, startLine, endLine, {
      multilineTextBounds: {
        textDeclarationLine: startLine,
        textStartLine: startLine,
        textEndLine: endLine
      }
    });
  }

  // 如果当前行包含"""但不以"""开头，可能是多行文本的中间或结束行
  // 向前搜索找到多行文本的起始行
  if (currentLine.includes('"""')) {
    let searchLine = i;
    while (searchLine >= 0) {
      const searchTrimmed = lines[searchLine].trim();
      if (searchTrimmed.match(/^"""/)) {
        // 找到了多行文本的起始行
        const { startLine, endLine } = detectMultilineTextBounds(content, searchLine + 1);
        
        // 检查当前行是否在多行文本的范围内
        if (lineNum >= startLine && lineNum <= endLine) {
          return createElementBoundsInfo(ElementType.MultilineText, startLine, endLine, {
            multilineTextBounds: {
              textDeclarationLine: startLine,
              textStartLine: startLine,
              textEndLine: endLine
            }
          });
        }
        break;
      }
      searchLine--;
    }
  }

  // 检测note属性
  const { startLine: noteStartLine, endLine: noteEndLine } = detectNoteBounds(content, lineNum);
  const hasNote = noteStartLine !== lineNum || noteEndLine !== lineNum;
  
  return createElementBoundsInfo(ElementType.Simple, lineNum, lineNum, {
    noteBounds: hasNote ? {
      noteStartLine,
      noteEndLine,
      hasNote
    } : undefined
  });
}

/**
 * 获取元素起始行
 */
export function getElementStartLine(content: string, lineNum: number): number {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) return lineNum;

  const line = lines[lineNum - 1].trim();

  if (line.startsWith('##')) {
    const { startLine } = detectTableBounds(content, lineNum);
    return startLine;
  }

  // 检查是否是text元素的三引号多行文本
  if (line.match(/^"""/)) {
    const { startLine } = detectMultilineTextBounds(content, lineNum);
    return startLine;
  }

  const noteIdx = line.indexOf('note=');
  if (noteIdx !== -1) {
    const { startLine } = detectNoteBounds(content, lineNum);
    return startLine;
  }

  return lineNum;
}

/**
 * 获取元素相关的行号数组（包括note的多行内容和表格的多行内容）
 */
export function getElementRelatedLines(content: string, elementLine: number): number[] {
  const bounds = detectElementBounds(content, elementLine);
  return bounds.getRelatedLines();
}
