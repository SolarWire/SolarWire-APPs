/**
 * 元素操作工具函数
 */

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
      const blockContent: string[] = [];
      let endIdx = i;
      
      // 检查是否有note的多行内容
      const noteMatch = line.match(/note=(["']{3})/);
      if (noteMatch) {
        const quote = noteMatch[1];
        const matchIndex = line.indexOf(noteMatch[0]);
        const afterNoteStart = line.substring(matchIndex + noteMatch[0].length);
        
        if (!afterNoteStart.includes(quote)) {
          // 多行note
          blockContent.push(line);
          endIdx = i + 1;
          while (endIdx < lines.length && !lines[endIdx].includes(quote)) {
            blockContent.push(lines[endIdx]);
            endIdx++;
          }
          if (endIdx < lines.length) {
            blockContent.push(lines[endIdx]);
          }
        } else {
          // 单行note
          blockContent.push(line);
        }
      } else if (trimmedLine.startsWith('##')) {
        // 表格元素，收集整个表格
        blockContent.push(line);
        endIdx = i + 1;
        let tableIndent = 0;
        while (endIdx < lines.length) {
          const currentLine = lines[endIdx];
          if (currentLine.trim() === '' || currentLine.trim().startsWith('//')) {
            blockContent.push(currentLine);
            endIdx++;
            continue;
          }
          
          if (tableIndent === 0) {
            // 计算表格声明行的缩进
            for (let j = 0; j < currentLine.length; j++) {
              if (currentLine[j] === ' ') tableIndent++;
              else break;
            }
          }
          
          const currentIndent = (() => {
            let indent = 0;
            for (let j = 0; j < currentLine.length; j++) {
              if (currentLine[j] === ' ') indent++;
              else break;
            }
            return indent;
          })();
          
          // 如果缩进小于表格缩进，说明表格结束
          if (currentIndent < tableIndent) {
            break;
          }
          
          blockContent.push(currentLine);
          endIdx++;
        }
        endIdx--;
      } else {
        // 普通元素
        blockContent.push(line);
      }
      
      selectedBlocks.push({
        startLine: lineNum,
        endLine: endIdx + 1,
        content: blockContent
      });
      
      i = endIdx + 1;
    } else {
      remainingLines.push(line);
      i++;
    }
  }
  
  // 将选中的块移到最前面
  const newContent = [
    ...selectedBlocks.flatMap(block => block.content),
    ...remainingLines
  ].join('\n');
  
  // 计算新的元素ID
  const newElementIds: string[] = [];
  let currentLineNum = 1;
  
  for (const block of selectedBlocks) {
    const newLineNum = currentLineNum;
    for (let j = 0; j < block.content.length; j++) {
      currentLineNum++;
    }
    newElementIds.push(newLineNum.toString());
  }
  
  return { content: newContent, newElementIds };
}

/**
 * 对齐选中的元素
 * @param content 代码内容
 * @param selectedElementIds 选中的元素行号数组
 * @param alignType 对齐类型: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
 * @param elementsBounds 元素边界信息映射（行号 -> {x, y, width, height}）
 * @returns 更新后的代码内容
 */
export function alignElements(
  content: string,
  selectedElementIds: string[],
  alignType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
  elementsBounds?: Map<number, { x: number; y: number; width: number; height: number }>
): string {
  if (selectedElementIds.length === 0) return content;
  
  const lines = content.split(/\r?\n/);
  const elementCoords: Array<{ lineNum: number; x: number; y: number; width: number; height: number }> = [];
  
  // 收集所有选中元素的坐标和边界
  for (const id of selectedElementIds) {
    const lineNum = parseInt(id);
    if (lineNum < 1 || lineNum > lines.length) continue;
    
    const line = lines[lineNum - 1];
    const coordMatch = line.match(/@\((\d+),\s*(\d+)\)/);
    if (coordMatch) {
      let width = 0;
      let height = 0;
      
      // 尝试从边界信息获取宽度和高度
      if (elementsBounds && elementsBounds.has(lineNum)) {
        const bounds = elementsBounds.get(lineNum);
        width = bounds?.width || 0;
        height = bounds?.height || 0;
      } else {
        // 从代码中解析 w 和 h 属性
        const wMatch = line.match(/w=(\d+)/);
        const hMatch = line.match(/h=(\d+)/);
        if (wMatch) width = parseInt(wMatch[1]);
        if (hMatch) height = parseInt(hMatch[1]);
      }
      
      elementCoords.push({
        lineNum,
        x: parseInt(coordMatch[1]),
        y: parseInt(coordMatch[2]),
        width,
        height
      });
    }
  }
  
  if (elementCoords.length === 0) return content;
  
  let targetValue: number;
  
  // 计算目标值（考虑元素的宽度和高度）
  switch (alignType) {
    case 'left':
      targetValue = Math.min(...elementCoords.map(c => c.x));
      break;
    case 'right':
      targetValue = Math.max(...elementCoords.map(c => c.x + c.width));
      break;
    case 'center-h':
      const minX = Math.min(...elementCoords.map(c => c.x));
      const maxX = Math.max(...elementCoords.map(c => c.x + c.width));
      targetValue = Math.round((minX + maxX) / 2);
      break;
    case 'top':
      targetValue = Math.min(...elementCoords.map(c => c.y));
      break;
    case 'bottom':
      targetValue = Math.max(...elementCoords.map(c => c.y + c.height));
      break;
    case 'center-v':
      const minY = Math.min(...elementCoords.map(c => c.y));
      const maxY = Math.max(...elementCoords.map(c => c.y + c.height));
      targetValue = Math.round((minY + maxY) / 2);
      break;
    default:
      return content;
  }
  
  // 更新所有元素的坐标
  for (const coord of elementCoords) {
    let newX = coord.x;
    let newY = coord.y;
    
    switch (alignType) {
      case 'left':
        newX = targetValue;
        break;
      case 'right':
        newX = targetValue - coord.width;
        break;
      case 'center-h':
        newX = targetValue - coord.width / 2;
        break;
      case 'top':
        newY = targetValue;
        break;
      case 'bottom':
        newY = targetValue - coord.height;
        break;
      case 'center-v':
        newY = targetValue - coord.height / 2;
        break;
    }
    
    const lineIndex = coord.lineNum - 1;
    const line = lines[lineIndex];
    const coordPattern = /@\((-?\d+),\s*(-?\d+)\)/;
    lines[lineIndex] = line.replace(coordPattern, `@(${newX}, ${newY})`);
  }
  
  return lines.join('\n');
}
