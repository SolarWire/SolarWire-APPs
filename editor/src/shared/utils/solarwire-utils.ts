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
  attributeValue: string | number
): string {
  const lines = content.split(/\r?\n/);
  
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  // 特殊处理 text 属性 - 修改元素内部的 text 而不是添加 text= 属性
  if (attributeName === 'text') {
    // 检查各种元素类型的 text 部分
    // 矩形: ["text"]
    const rectMatch = line.match(/^(\s*)\["([^"]*)"\](.*)$/);
    if (rectMatch) {
      lines[lineIndex] = `${rectMatch[1]}["${attributeValue}"]${rectMatch[3]}`;
      return lines.join('\n');
    }
    
    // 圆角矩形: ("text")
    const roundedRectMatch = line.match(/^(\s*)\("([^"]*)"\)(.*)$/);
    if (roundedRectMatch) {
      lines[lineIndex] = `${roundedRectMatch[1]}("${attributeValue}")${roundedRectMatch[3]}`;
      return lines.join('\n');
    }
    
    // 圆形: (("text"))
    const circleMatch = line.match(/^(\s*)\(\("([^"]*)"\)\)(.*)$/);
    if (circleMatch) {
      lines[lineIndex] = `${circleMatch[1]}(("${attributeValue}"))${circleMatch[3]}`;
      return lines.join('\n');
    }
    
    // 占位符: [?"text"]
    const placeholderMatch = line.match(/^(\s*)\[\?"([^"]*)"\](.*)$/);
    if (placeholderMatch) {
      lines[lineIndex] = `${placeholderMatch[1]}[?"${attributeValue}"]${placeholderMatch[3]}`;
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

  if (attributeName === 'x' || attributeName === 'y') {
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
      const hasOtherAttributes = /\s\w+=/.test(line);
      if (hasOtherAttributes) {
        line = line.replace(/(\s\w+=[^\s]+)/, `$1 ${attributeName}=${attributeValue}`);
      } else {
        line = line.trimEnd() + ` ${attributeName}=${attributeValue}`;
      }
    }
    
    lines[lineIndex] = line;
    return lines.join('\n');
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
    
    if (attributeValue === true || attributeValue === 'true') {
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
): string {
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
  
  return newLines.join('\n');
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
  let endLine = startLine;
  
  const i = startLine - 1;
  if (i < 0 || i >= lines.length) {
    return { startLine, endLine };
  }
  
  const currentLine = lines[i];
  const trimmedLine = currentLine.trim();
  
  if (!trimmedLine.startsWith('##')) {
    return { startLine, endLine };
  }
  
  const getIndent = (line: string): number => {
    let indent = 0;
    while (indent < line.length && line[indent] === ' ') {
      indent++;
    }
    return indent;
  };
  
  const tableIndent = getIndent(currentLine);
  let nextUnindentedLineIndex = -1;
  
  // 从表格声明行的下一行开始，找到下一个无缩进（或缩进不大于表格声明）的元素声明行
  for (let j = i + 1; j < lines.length; j++) {
    const line = lines[j];
    const lineTrimmed = line.trim();
    
    // 跳过空行和注释行
    if (lineTrimmed === '' || lineTrimmed.startsWith('#')) {
      continue;
    }
    
    const lineIndent = getIndent(line);
    
    // 如果缩进不大于表格声明行，说明这是表格外的元素
    if (lineIndent <= tableIndent) {
      nextUnindentedLineIndex = j;
      break;
    }
  }
  
  // 确定表格的结束索引
  let lastTableLineIndex = nextUnindentedLineIndex - 1;
  if (nextUnindentedLineIndex === -1) {
    // 没有找到下一个无缩进行，说明表格是最后一个元素，取到文件末尾
    lastTableLineIndex = lines.length - 1;
  }
  
  endLine = lastTableLineIndex + 1;
  
  return { startLine, endLine };
}

export function getElementRelatedLines(
  content: string,
  elementLine: number
): number[] {
  const lines = content.split(/\r?\n/);
  const relatedLines: number[] = [elementLine];
  
  const i = elementLine - 1;
  const currentLine = lines[i];
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
  // 检查是否有绝对坐标
  const absoluteMatch = line.match(/@\(([\d]+),\s*([\d]+)\)/);
  if (absoluteMatch) {
    // 更新绝对坐标
    return line.replace(absoluteMatch[0], `@(${newX}, ${newY})`);
  }
  
  // 更新 x 和 y 属性
  let updated = line;
  if (updated.includes('x=')) {
    updated = updated.replace(/x=([\d]+)/, `x=${newX}`);
  } else {
    // 如果没有 x 属性，尝试添加
    const firstSpace = updated.indexOf(' ');
    if (firstSpace !== -1) {
      updated = updated.substring(0, firstSpace + 1) + `x=${newX} ` + updated.substring(firstSpace + 1);
    }
  }
  if (updated.includes('y=')) {
    updated = updated.replace(/y=([\d]+)/, `y=${newY}`);
  } else {
    // 如果没有 y 属性，尝试添加
    const firstSpace = updated.indexOf(' ');
    if (firstSpace !== -1) {
      updated = updated.substring(0, firstSpace + 1) + `y=${newY} ` + updated.substring(firstSpace + 1);
    }
  }
  return updated;
}

/**
 * 检查是否存在单引号或双引号包裹的note
 * @param content 代码内容
 * @returns 是否存在单引号或双引号包裹的note
 */
export function hasDoubleQuoteNotes(content: string): boolean {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // 检测双引号包裹的note（但不是三引号）
    if (line.includes('note="') && !line.includes('note="""')) {
      return true;
    }
    // 检测单引号包裹的note
    if (line.includes("note='") && !line.includes("note='''")) {
      return true;
    }
  }
  return false;
}

/**
 * 将单引号或双引号包裹的note转换为三引号包裹
 * @param content 代码内容
 * @returns 更新后的代码内容
 */
export function convertDoubleQuoteNotesToTriple(content: string): string {
  // 先处理双引号包裹的note（但不是三引号）
  let result = content.replace(/note="([^"]*)"(?!")/g, 'note="""$1"""');
  // 再处理单引号包裹的note（但不是三引号）
  result = result.replace(/note='([^']*)'(?!')/g, "note=\"\"\"$1\"\"\"");
  return result;
}