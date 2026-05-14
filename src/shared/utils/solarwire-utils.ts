/**
 * SolarWire 工具函数集合
 * 重新导出各个模块的函数，保持向后兼容
 */

// 从 element-bounds.ts 重新导出
export {
  isInsideMultilineNoteContent,
  detectNoteBounds,
  detectMultilineTextBounds,
  detectTableBounds,
  createElementBoundsInfo,
  detectElementBounds,
  getElementStartLine,
  getElementRelatedLines,
  ElementType,
  type NoteBounds,
  type TableBounds,
  type MultilineTextBounds,
  type ElementBoundsInfo
} from './element-bounds';

// 从 attribute-updater.ts 重新导出
export {
  updateLineCoords,
  updateLineAttribute,
  deleteLineAttribute
} from './attribute-updater';

// 从 element-operations/ 重新导出
export {
  bringElementsToFront,
  alignElements
} from './element-operations';

// 从 preview-utils.ts 重新导出
export {
  isValidFileDir,
  getProjectDir,
  getElementDataFromContent,
  snapToGridValue,
  hexToRgba,
  calculateImageSize,
  createRafContentUpdater
} from './preview-utils';

// 从 constants.ts 重新导出
export {
  MAX_IMAGE_DIMENSION,
  DEFAULT_IMAGE_WIDTH,
  DEFAULT_GRID_SIZE,
  DEFAULT_ZOOM_LEVEL
} from './constants';

/**
 * 检测内容中是否有需要转换的双引号或单引号note
 * @param content 代码内容
 * @returns 是否存在双引号或单引号的note
 */
export function hasDoubleQuoteNotes(content: string): boolean {
  // 匹配 note= 后跟双引号或单引号（不是三引号"""）的情况
  // 正则: note= 后面跟一个或多个 " 或 '，但不是 """
  const singleQuotePattern = /note='(?!"")/;
  const doubleQuotePattern = /note="(?!""")/;

  // 检查单引号note
  const hasSingleQuoteNote = singleQuotePattern.test(content);
  if (hasSingleQuoteNote) return true;

  // 检查双引号note（排除三引号"""的情况）
  // 需要更精细的检查，确保不是三引号
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // 检查是否包含 note=" 后面不是 """
    const match = line.match(/note=""""/);
    if (match) continue; // 跳过三引号

    const doubleMatch = line.match(/note="([^"]*)"/);
    if (doubleMatch) {
      // 检查引号中间是否有 """
      const beforeQuote = line.substring(0, line.indexOf('note='));
      const notePart = line.substring(line.indexOf('note='));
      // 如果 note=" 后面紧跟的是 """ 而不是 "，则跳过
      if (notePart.startsWith('note="""')) continue;
      return true;
    }

    const singleMatch = line.match(/note='([^']*)'/);
    if (singleMatch) {
      return true;
    }
  }

  return false;
}

/**
 * 将内容中的双引号和单引号note转换为三引号格式
 * @param content 代码内容
 * @returns 转换后的代码内容
 */
export function convertDoubleQuoteNotesToTriple(content: string): string {
  const lines = content.split(/\r?\n/);
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 跳过已经是三引号的行
    // note="""content""" 格式
    const tripleMatch = line.match(/note="""(.*?)"""/);
    if (tripleMatch) {
      resultLines.push(line);
      continue;
    }

    // 处理 note="..." 格式（不是三引号）
    // 注意：不能简单地用 replace，因为需要确保不是 """
    if (line.includes('note="') && !line.includes('note="""')) {
      // 找到所有 note="..." 的位置并转换（非贪婪匹配）
      line = line.replace(/note="([^"]*)"/g, (match, noteContent) => {
        return `note="""${noteContent}"""`;
      });
    }

    // 处理 note='...' 格式
    if (line.includes("note='")) {
      line = line.replace(/note='([^']*)'/g, (match, noteContent) => {
        return `note="""${noteContent}"""`;
      });
    }

    resultLines.push(line);
  }

  return resultLines.join('\n');
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
 * 验证拖放的内容是否安全
 * @param content 拖放的内容
 * @returns 是否安全
 */
export function validateDropContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // 检查长度限制（100KB）
  if (content.length > 100000) {
    return false;
  }
  
  // 检查是否包含潜在的恶意代码模式
  const dangerousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /<script/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.innerHTML/i,
    /\.outerHTML/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  return true;
}