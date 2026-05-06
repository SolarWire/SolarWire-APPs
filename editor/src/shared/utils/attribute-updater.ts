/**
 * 属性更新工具函数
 */

import {
  detectElementBounds,
  detectNoteBounds,
  detectMultilineTextBounds,
  detectTableBounds,
  getElementStartLine
} from './element-bounds';

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
  attributeValue: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);

  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  // 对于坐标属性（x, y, x2, y2），允许在属性行更新，不限制在首行
  const isCoordAttribute = attributeName === 'x' || attributeName === 'y' || attributeName === 'x2' || attributeName === 'y2';
  
  if (!isCoordAttribute) {
    const actualStartLine = getElementStartLine(content, lineNum);
    if (lineNum !== actualStartLine) {
      return content;
    }
  }

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
    
    // 文本元素: "text" 或 """多行文本"""
    const textMatch = line.match(/^(\s*)"([^"]*)"(.*)$/);
    if (textMatch) {
      lines[lineIndex] = `${textMatch[1]}"${attributeValue}"${textMatch[3]}`;
      return lines.join('\n');
    }

    const multilineTextMatch = line.match(/^(\s*)"""(.*)"""(.*)$/);
    if (multilineTextMatch) {
      lines[lineIndex] = `${multilineTextMatch[1]}"""${attributeValue}"""${multilineTextMatch[3]}`;
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
    // 获取元素边界信息
    const bounds = detectElementBounds(content, lineNum);
    const isSameLine = bounds.elementLine === bounds.attributeLine;
    
    const coordPattern = /@\((\d+),\s*(\d+)\)/;
    const match = line.match(coordPattern);

    if (match) {
      // 已有坐标，直接更新
      const currentX = parseInt(match[1]);
      const currentY = parseInt(match[2]);

      if (attributeName === 'x') {
        line = line.replace(coordPattern, `@(${attributeValue}, ${currentY})`);
      } else {
        line = line.replace(coordPattern, `@(${currentX}, ${attributeValue})`);
      }
    } else {
      // 没有坐标，需要添加
      // 检查各种元素类型并添加适当的坐标
      
      // []元素（矩形元素）
      const rectMatch = line.match(/^(\s*)\["([^"]*)"\](.*)$/);
      const rectEmptyMatch = line.match(/^(\s*)\[\](.*)$/);
      
      // ()元素（圆角矩形）
      const roundedRectMatch = line.match(/^(\s*)\("([^"]*)"\)(.*)$/);
      const roundedRectEmptyMatch = line.match(/^(\s*)\(\)(.*)$/);
      
      // (())元素（圆形）
      const circleMatch = line.match(/^(\s*)\(\("([^"]*)"\)\)(.*)$/);
      const circleEmptyMatch = line.match(/^(\s*)\(\(\)\)(.*)$/);
      
      // [?]元素（占位符）
      const placeholderMatch = line.match(/^(\s*)\[\?"([^"]*)"\](.*)$/);
      const placeholderEmptyMatch = line.match(/^(\s*)\[\?\](.*)$/);
      
      // "text"元素（文本）
      const textMatch = line.match(/^(\s*)"([^"]*)"(.*)$/);
      
      if (rectMatch || rectEmptyMatch) {
        // []元素，在元素定义后添加坐标
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else if (roundedRectMatch || roundedRectEmptyMatch) {
        // ()元素，在元素定义后添加坐标
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else if (circleMatch || circleEmptyMatch) {
        // (())元素，在元素定义后添加坐标
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else if (placeholderMatch || placeholderEmptyMatch) {
        // [?]元素，在元素定义后添加坐标
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else if (textMatch) {
        // "text"元素，在文本定义后添加坐标
        line = line.trimEnd() + ` @(${attributeValue}, 0)`;
      } else if (isSameLine) {
        // 首行和属性行为同一行，在第二个"""后添加坐标
        const quotes = line.match(/"""/g);
        if (quotes && quotes.length >= 2) {
          // 找到第二个"""的位置
          let quoteCount = 0;
          let secondQuoteIndex = -1;
          for (let i = 0; i < line.length; i++) {
            if (line.substring(i, i + 3) === '"""') {
              quoteCount++;
              if (quoteCount === 2) {
                secondQuoteIndex = i + 3;
                break;
              }
              i += 2; // 跳过"""的剩余字符
            }
          }
          if (secondQuoteIndex !== -1) {
            line = line.substring(0, secondQuoteIndex) + ` @(${attributeValue}, 0)` + line.substring(secondQuoteIndex);
          }
        }
      } else {
        // 首行和属性行不同行，在第一个"""后添加坐标
        const firstQuoteIndex = line.indexOf('"""');
        if (firstQuoteIndex !== -1) {
          line = line.substring(0, firstQuoteIndex + 3) + ` @(${attributeValue}, 0)` + line.substring(firstQuoteIndex + 3);
        }
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
                // 检查这个"""是否是note的结束，而不是多行文本的结束
                // 如果这一行包含note=，则说明这是另一个note的开始，不是当前note的结束
                if (currentLine.includes('note=')) {
                  continue;
                }
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
