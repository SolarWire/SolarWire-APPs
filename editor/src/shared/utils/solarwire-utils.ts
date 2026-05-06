/**
 * SolarWire 工具函数集合
 * 重新导出各个模块的函数，保持向后兼容
 */

import { monacoService } from '../../app/services/monaco-service';

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

// 从 element-operations.ts 重新导出
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

// 本地函数 - Monaco语言注册
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