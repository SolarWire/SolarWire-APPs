/**
 * 注册SolarWire语言支持
 * 为Monaco编辑器添加SolarWire语言的语法高亮和配置
 */
export function registerSolarWireLanguage(): void {
  const monaco = (window as any).monaco;
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

/**
 * 转义note值中的特殊字符
 * @param value note值
 * @returns 转义后的note值
 */
export function escapeNoteValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * 反转义note值中的特殊字符
 * @param value 转义后的note值
 * @returns 原始note值
 */
export function unescapeNoteValue(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * 更新行的坐标信息
 * @param content 代码内容
 * @param lineNum 行号（从1开始）
 * @param x1 起始x坐标
 * @param y1 起始y坐标
 * @param x2 结束x坐标
 * @param y2 结束y坐标
 * @returns 更新后的代码内容
 */
export function updateLineCoords(
  content: string,
  lineNum: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  const lines = content.split(/\r?\n/);
  
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];
  
  const lineCoordPattern = /@\(\d+,\s*\d+\)->\(\d+,\s*\d+\)/;
  
  if (lineCoordPattern.test(line)) {
    line = line.replace(lineCoordPattern, `@(${x1}, ${y1})->(${x2}, ${y2})`);
  } else {
    line = line.trimEnd() + ` @(${x1}, ${y1})->(${x2}, ${y2})`;
  }
  
  lines[lineIndex] = line;
  return lines.join('\n');
}

function isInsideMultilineNoteContent(lines: string[], lineIndex: number): boolean {
  if (lineIndex < 0 || lineIndex >= lines.length) return false;

  let inMultilineNote = false;
  let multilineQuote = '';

  for (let i = 0; i <= lineIndex; i++) {
    const currentLine = lines[i];

    if (!inMultilineNote) {
      if (currentLine.includes('note="""') || currentLine.includes("note='''")) {
        if (!currentLine.includes('"""') && !currentLine.includes("'''")) {
          inMultilineNote = true;
          multilineQuote = currentLine.includes('note="""') ? '"""' : "'''";
        }
      }
    } else {
      if (currentLine.includes(multilineQuote)) {
        inMultilineNote = false;
        multilineQuote = '';
      }
    }
  }

  return inMultilineNote;
}

function getElementStartLine(content: string, lineNum: number): number {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) return lineNum;

  const line = lines[lineNum - 1].trim();

  if (line.startsWith('##')) {
    const { startLine } = detectTableBounds(content, lineNum);
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
 * 更新行的属性值
 * @param content 代码内容
 * @param lineNum 行号（从1开始）
 * @param attributeName 属性名
 * @param attributeValue 属性值
 * @returns 更新后的代码内容
 */
export function updateLineAttribute(
  content: string,
  lineNum: number,
  attributeName: string,
  attributeValue: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);

  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const actualStartLine = getElementStartLine(content, lineNum);
  if (lineNum !== actualStartLine) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  // 特殊处理 text 属性 - 修改元素内部的 text 而不是添加 text= 属性
  if (attributeName === 'text') {
    // 检查各种元素类型的 text 部分
    // 矩形: ["text"] 或 [""] 或 []
    const rectMatch = line.match(/^(\s*)\["([^"]*)"\](.*)$/);
    if (rectMatch) {
      lines[lineIndex] = `${rectMatch[1]}["${attributeValue}"]${rectMatch[3]}`;
      return lines.join('\n');
    }
    
    // 矩形无引号: []
    const rectEmptyMatch = line.match(/^(\s*)\[\](.*)$/);
    if (rectEmptyMatch) {
      lines[lineIndex] = `${rectEmptyMatch[1]}["${attributeValue}"]${rectEmptyMatch[2]}`;
      return lines.join('\n');
    }
    
    // 圆角矩形: ("text") 或 ("") 或 ()
    const roundedRectMatch = line.match(/^(\s*)\("([^"]*)"\)(.*)$/);
    if (roundedRectMatch) {
      lines[lineIndex] = `${roundedRectMatch[1]}("${attributeValue}")${roundedRectMatch[3]}`;
      return lines.join('\n');
    }
    
    const roundedRectEmptyMatch = line.match(/^(\s*)\(\)(.*)$/);
    if (roundedRectEmptyMatch) {
      lines[lineIndex] = `${roundedRectEmptyMatch[1]}("${attributeValue}")${roundedRectEmptyMatch[2]}`;
      return lines.join('\n');
    }
    
    // 圆形: (("text")) 或 (("")) 或 (())
    const circleMatch = line.match(/^(\s*)\(\("([^"]*)"\)\)(.*)$/);
    if (circleMatch) {
      lines[lineIndex] = `${circleMatch[1]}(("${attributeValue}"))${circleMatch[3]}`;
      return lines.join('\n');
    }
    
    const circleEmptyMatch = line.match(/^(\s*)\(\(\)\)(.*)$/);
    if (circleEmptyMatch) {
      lines[lineIndex] = `${circleEmptyMatch[1]}(("${attributeValue}"))${circleEmptyMatch[2]}`;
      return lines.join('\n');
    }
    
    // 占位符: [?"text"] 或 [?""] 或 [?]
    const placeholderMatch = line.match(/^(\s*)\[\?"([^"]*)"\](.*)$/);
    if (placeholderMatch) {
      lines[lineIndex] = `${placeholderMatch[1]}[?"${attributeValue}"]${placeholderMatch[3]}`;
      return lines.join('\n');
    }
    
    const placeholderEmptyMatch = line.match(/^(\s*)\[\?\](.*)$/);
    if (placeholderEmptyMatch) {
      lines[lineIndex] = `${placeholderEmptyMatch[1]}[?"${attributeValue}"]${placeholderEmptyMatch[2]}`;
      return lines.join('\n');
    }
    
    // 文本元素: "text"
    const textMatch = line.match(/^(\s*)"([^"]*)"(.*)$/);
    if (textMatch) {
      lines[lineIndex] = `${textMatch[1]}"${attributeValue}"${textMatch[3]}`;
      return lines.join('\n');
    }
    
    // 如果没有找到匹配的元素类型，回退到添加 text= 属性（虽然这种情况不应该发生）
  }

  if (attributeName === 'url') {
    const imageUrlPattern = /<([^>]+)>/;
    const match = line.match(imageUrlPattern);
    if (match) {
      line = line.replace(imageUrlPattern, `<${attributeValue}>`);
    }
    lines[lineIndex] = line;
    return lines.join('\n');
  }

  if (attributeName === 'x' || attributeName === 'y') {
    if (isInsideMultilineNoteContent(lines, lineIndex)) {
      return lines.join('\n');
    }

    const coordPattern = /@\((\d+),\s*(\d+)\)/;
    const match = line.match(coordPattern);

    if (match) {
      const currentX = parseInt(match[1]);
      const currentY = parseInt(match[2]);

      if (attributeName === 'x') {
        line = line.replace(coordPattern, `@(${attributeValue}, ${currentY})`);
      } else {
        line = line.replace(coordPattern, `@(${currentX}, ${attributeValue})`);
      }
    } else {
      const coordPattern = /@\(\d+,\s*\d+\)/;
      if (!coordPattern.test(line)) {
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else {
        line = line.replace(coordPattern, `@(${attributeValue}, 0)`);
      }
    }

    lines[lineIndex] = line;
    return lines.join('\n');
  }

  if (attributeName === 'x2' || attributeName === 'y2') {
    const lineEndPattern = /->\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/;
    const lineEndMatch = line.match(lineEndPattern);

    if (lineEndMatch) {
      const currentX2 = parseInt(lineEndMatch[1]);
      const currentY2 = parseInt(lineEndMatch[2]);

      if (attributeName === 'x2') {
        line = line.replace(lineEndPattern, `->(${attributeValue}, ${currentY2})`);
      } else {
        line = line.replace(lineEndPattern, `->(${currentX2}, ${attributeValue})`);
      }

      lines[lineIndex] = line;
      return lines.join('\n');
    }

    const startCoordPattern = /@\(\d+,\s*\d+\)/;
    if (startCoordPattern.test(line) && !lineEndPattern.test(line)) {
      line = line.trimEnd() + ` ->(${attributeValue}, 0)`;
      lines[lineIndex] = line;
      return lines.join('\n');
    }

    return content;
  }

  if (attributeName === 'note') {
    const finalValue = `"""${attributeValue}"""`;
    
    // 检查当前行是否包含 note 属性的开始
    const noteStartIdx = line.indexOf('note=');
    
    if (noteStartIdx !== -1) {
      // 找到了 note 属性的开始
      const noteStart = noteStartIdx + 5; // 跳过 'note='
      let endQuote = '';
      let endLineIdx = lineIndex;
      let foundEnd = false;
      let afterNote = '';
      
      // 检查 note 开始后面是什么引号
      if (noteStart < line.length) {
        if (line.substring(noteStart, noteStart + 3) === '"""') {
          // 三引号开始
          endQuote = '"""';
          const noteStartInLine = noteStart + 3;
          
          // 检查当前行是否包含结束的三引号
          if (line.indexOf('"""', noteStartInLine) !== -1) {
            // note 在同一行内结束
            const noteEndIdx = line.indexOf('"""', noteStartInLine) + 3;
            afterNote = line.substring(noteEndIdx);
            endLineIdx = lineIndex;
            foundEnd = true;
          } else {
            // 查找结束的三引号在哪一行
            const contentLines = content.split(/\r?\n/);
            for (let i = lineIndex; i < contentLines.length; i++) {
              const currentLine = contentLines[i];
              if (i > lineIndex && currentLine.includes('"""')) {
                endLineIdx = i;
                foundEnd = true;
                const endQuoteIdx = currentLine.indexOf('"""') + 3;
                afterNote = currentLine.substring(endQuoteIdx);
                break;
              }
            }
          }
        } else if (line[noteStart] === '"') {
          // 双引号开始
          endQuote = '"';
          const noteStartInLine = noteStart + 1;
          
          // 检查当前行是否包含结束的双引号
          if (line.indexOf('"', noteStartInLine) !== -1) {
            // note 在同一行内结束
            const noteEndIdx = line.indexOf('"', noteStartInLine) + 1;
            afterNote = line.substring(noteEndIdx);
            endLineIdx = lineIndex;
            foundEnd = true;
          } else {
            // 查找结束的双引号在哪一行
            const contentLines = content.split(/\r?\n/);
            for (let i = lineIndex; i < contentLines.length; i++) {
              const currentLine = contentLines[i];
              if (i > lineIndex && currentLine.includes('"')) {
                endLineIdx = i;
                foundEnd = true;
                const endQuoteIdx = currentLine.indexOf('"') + 1;
                afterNote = currentLine.substring(endQuoteIdx);
                break;
              }
            }
          }
        } else if (line[noteStart] === "'") {
          // 单引号开始
          endQuote = "'";
          const noteStartInLine = noteStart + 1;
          
          // 检查当前行是否包含结束的单引号
          if (line.indexOf("'", noteStartInLine) !== -1) {
            // note 在同一行内结束
            const noteEndIdx = line.indexOf("'", noteStartInLine) + 1;
            afterNote = line.substring(noteEndIdx);
            endLineIdx = lineIndex;
            foundEnd = true;
          } else {
            // 查找结束的单引号在哪一行
            const contentLines = content.split(/\r?\n/);
            for (let i = lineIndex; i < contentLines.length; i++) {
              const currentLine = contentLines[i];
              if (i > lineIndex && currentLine.includes("'")) {
                endLineIdx = i;
                foundEnd = true;
                const endQuoteIdx = currentLine.indexOf("'") + 1;
                afterNote = currentLine.substring(endQuoteIdx);
                break;
              }
            }
          }
        } else {
          // 无引号的 note（简单值）
          const otherMatch = line.match(/\s+note=[^\s]+/);
          if (otherMatch) {
            const beforeNote = line.substring(0, otherMatch.index).trimEnd();
            const afterNote = line.substring(otherMatch.index! + otherMatch[0].length);
            line = beforeNote + ` note=${finalValue}${afterNote}`;
            lines[lineIndex] = line;
            return lines.join('\n');
          }
        }
      }
      
      // 提取起始行中 note 属性前面的内容
      const baseLine = line.substring(0, noteStartIdx).trimEnd();
      
      // 移除旧的 note 行
      if (foundEnd) {
        lines.splice(lineIndex, endLineIdx - lineIndex + 1);
      } else {
        // 如果没有找到结束，移除从开始到最后的所有行
        lines.splice(lineIndex);
      }
      
      // 插入新的 note
      lines.splice(lineIndex, 0, baseLine + ` note=${finalValue}${afterNote}`);
      
      return lines.join('\n');
    } else {
      // 没有 note 属性，直接添加
      line = line.trimEnd() + ` note=${finalValue}`;
      lines[lineIndex] = line;
      return lines.join('\n');
    }
  }

  if (attributeName === 'bold' || attributeName === 'italic') {
    const attrPattern = new RegExp(`\\s+${attributeName}(?:=[^\\s]+)?`);
    
    if (attributeValue === true || (typeof attributeValue === 'string' && attributeValue === 'true')) {
      if (!attrPattern.test(line)) {
        const notePattern = /\s+note=/;
        const noteMatch = line.match(notePattern);
        
        if (noteMatch) {
          const noteStartIndex = noteMatch.index!;
          const beforeNote = line.substring(0, noteStartIndex);
          const noteAndAfter = line.substring(noteStartIndex);
          line = beforeNote + ` ${attributeName}` + noteAndAfter;
        } else {
          line = line.trimEnd() + ` ${attributeName}`;
        }
      }
    } else {
      line = line.replace(attrPattern, '');
    }
  } else {
    const attrPattern = new RegExp(`(\\s)${attributeName}=[^\\s]+`);
    
    if (attrPattern.test(line)) {
      line = line.replace(attrPattern, `$1${attributeName}=${attributeValue}`);
    } else {
      const notePattern = /\s+note=/;
      const noteMatch = line.match(notePattern);
      
      if (noteMatch) {
        const noteStartIndex = noteMatch.index!;
        const beforeNote = line.substring(0, noteStartIndex);
        const noteAndAfter = line.substring(noteStartIndex);
        line = beforeNote + ` ${attributeName}=${attributeValue}` + noteAndAfter;
      } else {
        const hasOtherAttributes = /\s\w+=/.test(line);
        if (hasOtherAttributes) {
          line = line.replace(/(\s\w+=[^\s]+)$/, `$1 ${attributeName}=${attributeValue}`);
        } else {
          line = line.trimEnd() + ` ${attributeName}=${attributeValue}`;
        }
      }
    }
  }

  lines[lineIndex] = line;
  return lines.join('\n');
}

/**
 * 将选中的元素移到代码的最前面
 * @param content 代码内容
 * @param selectedElementIds 选中的元素行号数组
 * @returns 更新后的代码内容
 */
export function bringElementsToFront(
  content: string,
  selectedElementIds: string[]
): { content: string; newElementIds: string[] } {
  const lines = content.split(/\r?\n/);
  
  // 收集所有选中元素的行和内容，包括note的多行内容和表格的多行内容
  const selectedBlocks: Array<{ startLine: number, endLine: number, content: string[] }> = [];
  const remainingLines: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (selectedElementIds.includes(lineNum.toString())) {
      // 这是一个选中的元素行
      const blockLines: string[] = [line];
      let endLine = lineNum;
      
      const isTableElement = trimmedLine.startsWith('##');
      
      if (isTableElement) {
        // 使用抽象的表格边界检测函数
        const { endLine: tableEndLine } = detectTableBounds(content, lineNum);
        endLine = tableEndLine;
        
        // 收集从表格声明行到最后一行内容之间的所有行
        for (let j = i + 1; j < endLine; j++) {
          blockLines.push(lines[j]);
        }
        i = endLine;
      } else {
        // 使用抽象的note边界检测函数
        const { endLine: noteEndLine } = detectNoteBounds(content, lineNum);
        endLine = noteEndLine;
        
        // 收集从元素行到note结束行之间的所有行
        for (let j = i + 1; j < endLine; j++) {
          blockLines.push(lines[j]);
        }
        i = endLine;
      }
      
      selectedBlocks.push({ startLine: lineNum, endLine, content: blockLines });
    } else {
      // 这不是选中的元素行，添加到剩余行
      remainingLines.push(line);
      i++;
    }
  }
  
  // 按照选中元素的原顺序添加到剩余行的末尾
  const newLines = [...remainingLines, ...selectedBlocks.flatMap(block => block.content)];
  
  // 计算元素的新行号
  const remainingCount = remainingLines.length;
  let currentLine = remainingCount + 1;
  const newElementIds: string[] = [];
  
  for (const block of selectedBlocks) {
    newElementIds.push(currentLine.toString());
    currentLine += block.content.length;
  }
  
  return { content: newLines.join('\n'), newElementIds };
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
    
    // 跳过空行和注释行
    if (lineTrimmed === '' || lineTrimmed.startsWith('//')) {
      continue;
    }
    
    const lineIndent = getIndent(line);
    
    // 找到没有缩进的行，说明这是表格外的下一个元素
    if (lineIndent === 0) {
      // 从当前行往前找，跳过所有注释行和空行
      let endIdx = j - 1;
      while (endIdx >= scanStartIndex) {
        const prevLine = lines[endIdx].trim();
        // 如果是注释或空行，继续往前
        if (prevLine === '' || prevLine.startsWith('//')) {
          endIdx--;
        } else {
          // 找到最后一个非注释行
          break;
        }
      }
      return { startLine, endLine: endIdx + 1 };
    }
  }
  
  // 没有找到下一个无缩进行，表格是文件最后一个元素
  // 从文件末尾往前找最后一个非注释行
  let endIdx = lines.length - 1;
  while (endIdx >= scanStartIndex) {
    const line = lines[endIdx].trim();
    if (line === '' || line.startsWith('//')) {
      endIdx--;
    } else {
      break;
    }
  }
  
  return { startLine, endLine: endIdx + 1 };
}

export function getElementRelatedLines(
  content: string,
  elementLine: number
): number[] {
  const lines = content.split(/\r?\n/);
  
  const i = elementLine - 1;
  if (i < 0 || i >= lines.length) {
    return [elementLine];
  }
  
  const currentLine = lines[i];
  if (!currentLine) {
    return [elementLine];
  }
  
  const relatedLines: number[] = [elementLine];
  const trimmedLine = currentLine.trim();
  
  const isTableElement = trimmedLine.startsWith('##');
  
  if (isTableElement) {
    // 使用抽象的表格边界检测函数
    const { startLine, endLine } = detectTableBounds(content, elementLine);
    for (let j = startLine; j <= endLine; j++) {
      if (!relatedLines.includes(j)) {
        relatedLines.push(j);
      }
    }
    return relatedLines.sort((a, b) => a - b);
  }
  
  // 非表格元素：检查是否包含 note 属性
  const { startLine, endLine } = detectNoteBounds(content, elementLine);
  for (let j = startLine; j <= endLine; j++) {
    if (!relatedLines.includes(j)) {
      relatedLines.push(j);
    }
  }
  
  return relatedLines;
}

/**
 * 元素边界接口
 */
interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 对齐类型
 */
type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';

/**
 * 对齐选中的元素
 * @param content 代码内容
 * @param selectedElementIds 选中的元素行号数组
 * @param alignmentType 对齐类型
 * @returns 更新后的代码内容
 */
export function alignElements(
  content: string,
  selectedElementIds: string[],
  alignmentType: AlignmentType
): string {
  const lines = content.split(/\r?\n/);
  
  // 收集所有选中元素的信息，包括边界和原始内容
  const elements: Array<{
    lineNum: number;
    line: string;
    bounds: ElementBounds;
    x: number;
    y: number;
  }> = [];
  
  // 先收集所有选中元素的信息
  selectedElementIds.forEach((elementId) => {
    const lineNum = parseInt(elementId);
    if (!isNaN(lineNum) && lineNum > 0 && lineNum <= lines.length) {
      const line = lines[lineNum - 1];
      const { x, y, bounds } = getElementCoordsAndBounds(line);
      elements.push({ lineNum, line, bounds, x, y });
    }
  });
  
  if (elements.length < 2) {
    return content;
  }
  
  // 找到最先选择的元素（selectedElementIds中第一个）
  const firstElementId = selectedElementIds[0];
  const firstElement = elements.find(e => e.lineNum.toString() === firstElementId);
  if (!firstElement) {
    return content;
  }
  
  // 计算对齐后的位置
  const newLines = [...lines];
  
  elements.forEach((element) => {
    if (element.lineNum === firstElement.lineNum) {
      return; // 第一个元素不改变
    }
    
    let newX = element.x;
    let newY = element.y;
    
    switch (alignmentType) {
      case 'left':
        newX = firstElement.x;
        break;
      case 'center-h':
        newX = firstElement.x + (firstElement.bounds.width - element.bounds.width) / 2;
        break;
      case 'right':
        newX = firstElement.x + firstElement.bounds.width - element.bounds.width;
        break;
      case 'top':
        newY = firstElement.y;
        break;
      case 'center-v':
        newY = firstElement.y + (firstElement.bounds.height - element.bounds.height) / 2;
        break;
      case 'bottom':
        newY = firstElement.y + firstElement.bounds.height - element.bounds.height;
        break;
    }
    
    // 更新元素的坐标
    const updatedLine = updateElementCoords(element.line, newX, newY);
    newLines[element.lineNum - 1] = updatedLine;
  });
  
  return newLines.join('\n');
}

/**
 * 获取元素的坐标和边界
 * @param line 元素行
 * @returns 包含x、y坐标和边界的对象
 */
function getElementCoordsAndBounds(line: string): { x: number; y: number; bounds: ElementBounds } {
  let x = 0;
  let y = 0;
  let width = 100;
  let height = 100;

  // 解析坐标
  const absoluteMatch = line.match(/@\(([\d]+),\s*([\d]+)\)/);
  if (absoluteMatch) {
    x = parseInt(absoluteMatch[1]);
    y = parseInt(absoluteMatch[2]);
  } else {
    // 查找 x 和 y 属性
    const xMatch = line.match(/x=([\d]+)/);
    const yMatch = line.match(/y=([\d]+)/);
    if (xMatch) x = parseInt(xMatch[1]);
    if (yMatch) y = parseInt(yMatch[1]);
  }

  // 解析尺寸
  const wMatch = line.match(/w=([\d]+)/);
  const hMatch = line.match(/h=([\d]+)/);
  if (wMatch) width = parseInt(wMatch[1]);
  if (hMatch) height = parseInt(hMatch[1]);

  // 特殊处理文本元素：使用与渲染器一致的边界计算
  const textMatch = line.match(/^\s*["'](.*)["']\s*@\(/);
  if (textMatch) {
    const fontSizeMatch = line.match(/size=([\d]+)/);
    const lineHeightMatch = line.match(/line-height=([\d]+)/);

    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 12;
    const lineHeight = lineHeightMatch ? parseInt(lineHeightMatch[1]) : 22;
    const text = textMatch[1];
    const lines = text.split('\n');

    // 计算文本宽度 - 与渲染器 calculateTextWidth 一致
    const calculateTextWidth = (txt: string, fs: number): number => {
      let w = 0;
      for (let i = 0; i < txt.length; i++) {
        const char = txt[i];
        if (char.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/)) {
          w += fs * 1.0;
        } else {
          w += fs * 0.6;
        }
      }
      return w;
    };

    const estimatedWidth = lines.length > 0 ? Math.max(...lines.map(l => calculateTextWidth(l, fontSize))) : 100;
    const estimatedHeight = lines.length > 0 ? lines.length * lineHeight : fontSize;

    // 使用与渲染器一致的边界
    width = estimatedWidth;
    height = estimatedHeight;
  }

  return { x, y, bounds: { x, y, width, height } };
}

/**
 * 更新元素的坐标
 * @param line 元素行
 * @param newX 新的x坐标
 * @param newY 新的y坐标
 * @returns 更新后的元素行
 */
function updateElementCoords(line: string, newX: number, newY: number): string {
  // 确保坐标不为负数
  newX = Math.max(0, Math.round(newX));
  newY = Math.max(0, Math.round(newY));

  const absoluteMatch = line.match(/@\(([\d]+),\s*([\d]+)\)/);
  if (absoluteMatch) {
    return line.replace(absoluteMatch[0], `@(${newX}, ${newY})`);
  }

  let updated = line;
  if (updated.includes('x=')) {
    updated = updated.replace(/x=([\d]+)/, `x=${newX}`);
  } else {
    const firstSpace = updated.indexOf(' ');
    if (firstSpace !== -1) {
      updated = updated.substring(0, firstSpace + 1) + `x=${newX} ` + updated.substring(firstSpace + 1);
    }
  }
  if (updated.includes('y=')) {
    updated = updated.replace(/y=([\d]+)/, `y=${newY}`);
  } else {
    const firstSpace = updated.indexOf(' ');
    if (firstSpace !== -1) {
      updated = updated.substring(0, firstSpace + 1) + `y=${newY} ` + updated.substring(firstSpace + 1);
    }
  }
  return updated;
}