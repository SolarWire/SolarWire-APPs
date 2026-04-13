/**
 * 统一的错误格式化工具
 * 从 index.ts 中提取,便于单独测试
 */

export interface ParseErrorContext {
  message: string;
  input: string;
  line?: number;
  column?: number;
  expected?: string;
  found?: string;
}

export function formatParseError(context: ParseErrorContext): string {
  const { message, input, line, column, expected, found } = context;
  
  let errorMsg = '';
  
  errorMsg += '═'.repeat(60) + '\n';
  errorMsg += '  PARSE ERROR\n';
  errorMsg += '═'.repeat(60) + '\n\n';
  
  if (line !== undefined && column !== undefined) {
    errorMsg += `  Location: Line ${line}, Column ${column}\n\n`;
  }

  if (expected || found) {
    errorMsg += '  Details:\n';
    if (expected) {
      errorMsg += `    Expected: ${expected}\n`;
    }
    if (found) {
      errorMsg += `    Found:    ${found}\n`;
    }
    errorMsg += '\n';
  }
  
  errorMsg += `  ${message}\n\n`;

  if (line !== undefined) {
    errorMsg += '─'.repeat(60) + '\n';
    errorMsg += '  Context:\n';
    errorMsg += '─'.repeat(60) + '\n';
    errorMsg += getContextAroundPosition(input, line, column || 1);
    errorMsg += '─'.repeat(60) + '\n';
  }

  return errorMsg;
}

function getContextAroundPosition(
  input: string, 
  lineNum: number, 
  columnNum: number, 
  contextLines: number = 3
): string {
  const lines = input.split(/\r?\n/);
  const startLine = Math.max(0, lineNum - contextLines - 1);
  const endLine = Math.min(lines.length, lineNum + contextLines);
  let context = '';
  
  const maxLineNumWidth = Math.max(
    String(startLine + 1).length,
    String(endLine).length,
    4
  );

  for (let i = startLine; i < endLine; i++) {
    const lineNumDisplay = i + 1;
    const isErrorLine = i === lineNum - 1;
    const lineContent = lines[i] || '';
    
    if (isErrorLine) {
      context += `>>> ${lineNumDisplay.toString().padStart(maxLineNumWidth, ' ')} | ${lineContent}\n`;
      const pointerOffset = columnNum > 0 ? columnNum - 1 : 0;
      const spaces = ' '.repeat(5 + maxLineNumWidth + 3 + pointerOffset);
      context += `${spaces}^\n`;
      context += `${spaces}| HERE\n`;
    } else {
      context += `    ${lineNumDisplay.toString().padStart(maxLineNumWidth, ' ')} | ${lineContent}\n`;
    }
  }

  return context;
}
