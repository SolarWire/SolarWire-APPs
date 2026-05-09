import {
  detectElementBounds,
  detectNoteBounds,
  detectMultilineTextBounds,
  detectTableBounds,
  getElementStartLine
} from './element-bounds';

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
  
  const lineCoordPattern = /@\(-?\d+,\s*-?\d+\)->\(-?\d+,\s*-?\d+\)/;
  
  if (lineCoordPattern.test(line)) {
    line = line.replace(lineCoordPattern, `@(${x1}, ${y1})->(${x2}, ${y2})`);
  } else {
    line = line.trimEnd() + ` @(${x1}, ${y1})->(${x2}, ${y2})`;
  }
  
  lines[lineIndex] = line;
  return lines.join('\n');
}

export function deleteLineAttribute(
  content: string,
  lineNum: number,
  attributeName: string
): string {
  const lines = content.split(/\r?\n/);

  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  const actualStartLine = getElementStartLine(content, lineNum);
  if (lineNum !== actualStartLine) {
    return content;
  }

  if (['bold', 'italic', 'shadow-enabled'].includes(attributeName)) {
    const attrPattern = new RegExp(`\\s+${attributeName}(?:=[^\\s]+)?`);
    line = line.replace(attrPattern, '');
  } else {
    const attrPattern = new RegExp(`\\s+${attributeName}=[^\\s]+`);
    line = line.replace(attrPattern, '');
  }

  lines[lineIndex] = line;
  return lines.join('\n');
}

function updateCoordAttribute(
  content: string,
  lineNum: number,
  attribute: string,
  value: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  if (attribute === 'x' || attribute === 'y') {
    const bounds = detectElementBounds(content, lineNum);
    const isSameLine = bounds.elementLine === bounds.attributeLine;

    const coordPattern = /@\((-?\d+),\s*(-?\d+)\)/;
    const match = line.match(coordPattern);

    if (match) {
      const currentX = parseInt(match[1]);
      const currentY = parseInt(match[2]);

      if (attribute === 'x') {
        line = line.replace(coordPattern, `@(${value}, ${currentY})`);
      } else {
        line = line.replace(coordPattern, `@(${currentX}, ${value})`);
      }
    } else {
      const rectMatch = line.match(/^(\s*)\["([^"]*)"\](.*)$/);
      const rectEmptyMatch = line.match(/^(\s*)\[\](.*)$/);

      const roundedRectMatch = line.match(/^(\s*)\("([^"]*)"\)(.*)$/);
      const roundedRectEmptyMatch = line.match(/^(\s*)\(\)(.*)$/);

      const circleMatch = line.match(/^(\s*)\(\("([^"]*)"\)\)(.*)$/);
      const circleEmptyMatch = line.match(/^(\s*)\(\(\)\)(.*)$/);

      const placeholderMatch = line.match(/^(\s*)\[\?"([^"]*)"\](.*)$/);
      const placeholderEmptyMatch = line.match(/^(\s*)\[\?\](.*)$/);

      const textMatch = line.match(/^(\s*)"([^"]*)"(.*)$/);

      const tableMatch = line.match(/^(\s*)##(.*)$/);

      if (rectMatch || rectEmptyMatch) {
        line = line.trimEnd() + ` @(${value}, 0)`;
      } else if (roundedRectMatch || roundedRectEmptyMatch) {
        line = line.trimEnd() + ` @(${value}, 0)`;
      } else if (circleMatch || circleEmptyMatch) {
        line = line.trimEnd() + ` @(${value}, 0)`;
      } else if (placeholderMatch || placeholderEmptyMatch) {
        line = line.trimEnd() + ` @(${value}, 0)`;
      } else if (textMatch) {
        line = line.trimEnd() + ` @(${value}, 0)`;
      } else if (tableMatch) {
        line = `${tableMatch[1]}## @(${value}, 0)${tableMatch[2]}`;
      } else if (isSameLine) {
        const quotes = line.match(/"""/g);
        if (quotes && quotes.length >= 2) {
          let quoteCount = 0;
          let secondQuoteIndex = -1;
          for (let i = 0; i < line.length; i++) {
            if (line.substring(i, i + 3) === '"""') {
              quoteCount++;
              if (quoteCount === 2) {
                secondQuoteIndex = i + 3;
                break;
              }
              i += 2;
            }
          }
          if (secondQuoteIndex !== -1) {
            line = line.substring(0, secondQuoteIndex) + ` @(${value}, 0)` + line.substring(secondQuoteIndex);
          }
        }
      } else {
        const firstQuoteIndex = line.indexOf('"""');
        if (firstQuoteIndex !== -1) {
          line = line.substring(0, firstQuoteIndex + 3) + ` @(${value}, 0)` + line.substring(firstQuoteIndex + 3);
        }
      }
    }

    lines[lineIndex] = line;
    return lines.join('\n');
  }

  if (attribute === 'x2' || attribute === 'y2') {
    const lineEndPattern = /->\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/;
    const lineEndMatch = line.match(lineEndPattern);

    if (lineEndMatch) {
      const currentX2 = parseInt(lineEndMatch[1]);
      const currentY2 = parseInt(lineEndMatch[2]);

      if (attribute === 'x2') {
        line = line.replace(lineEndPattern, `->(${value}, ${currentY2})`);
      } else {
        line = line.replace(lineEndPattern, `->(${currentX2}, ${value})`);
      }

      lines[lineIndex] = line;
      return lines.join('\n');
    }

    const startCoordPattern = /@\(-?\d+,\s*-?\d+\)/;
    if (startCoordPattern.test(line) && !lineEndPattern.test(line)) {
      line = line.trimEnd() + ` ->(${value}, 0)`;
      lines[lineIndex] = line;
      return lines.join('\n');
    }

    return content;
  }

  return content;
}

function updateTextAttribute(
  content: string,
  lineNum: number,
  value: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  const rectMatch = line.match(/^(\s*)\["([^"]*)"\](.*)$/);
  if (rectMatch) {
    lines[lineIndex] = `${rectMatch[1]}["${value}"]${rectMatch[3]}`;
    return lines.join('\n');
  }

  const rectEmptyMatch = line.match(/^(\s*)\[\](.*)$/);
  if (rectEmptyMatch) {
    lines[lineIndex] = `${rectEmptyMatch[1]}["${value}"]${rectEmptyMatch[2]}`;
    return lines.join('\n');
  }

  const roundedRectMatch = line.match(/^(\s*)\("([^"]*)"\)(.*)$/);
  if (roundedRectMatch) {
    lines[lineIndex] = `${roundedRectMatch[1]}("${value}")${roundedRectMatch[3]}`;
    return lines.join('\n');
  }

  const roundedRectEmptyMatch = line.match(/^(\s*)\(\)(.*)$/);
  if (roundedRectEmptyMatch) {
    lines[lineIndex] = `${roundedRectEmptyMatch[1]}("${value}")${roundedRectEmptyMatch[2]}`;
    return lines.join('\n');
  }

  const circleMatch = line.match(/^(\s*)\(\("([^"]*)"\)\)(.*)$/);
  if (circleMatch) {
    lines[lineIndex] = `${circleMatch[1]}(("${value}"))${circleMatch[3]}`;
    return lines.join('\n');
  }

  const circleEmptyMatch = line.match(/^(\s*)\(\(\)\)(.*)$/);
  if (circleEmptyMatch) {
    lines[lineIndex] = `${circleEmptyMatch[1]}(("${value}"))${circleEmptyMatch[2]}`;
    return lines.join('\n');
  }

  const placeholderMatch = line.match(/^(\s*)\[\?"([^"]*)"\](.*)$/);
  if (placeholderMatch) {
    lines[lineIndex] = `${placeholderMatch[1]}[?"${value}"]${placeholderMatch[3]}`;
    return lines.join('\n');
  }

  const placeholderEmptyMatch = line.match(/^(\s*)\[\?\](.*)$/);
  if (placeholderEmptyMatch) {
    lines[lineIndex] = `${placeholderEmptyMatch[1]}[?"${value}"]${placeholderEmptyMatch[2]}`;
    return lines.join('\n');
  }

  const textMatch = line.match(/^(\s*)"([^"]*)"(.*)$/);
  if (textMatch) {
    lines[lineIndex] = `${textMatch[1]}"${value}"${textMatch[3]}`;
    return lines.join('\n');
  }

  const multilineTextMatch = line.match(/^(\s*)"""(.*)"""(.*)$/);
  if (multilineTextMatch) {
    lines[lineIndex] = `${multilineTextMatch[1]}"""${value}"""${multilineTextMatch[3]}`;
    return lines.join('\n');
  }

  return updateSimpleAttribute(content, lineNum, 'text', value);
}

function updateNoteAttribute(
  content: string,
  lineNum: number,
  value: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  const finalValue = `"""${value}"""`;

  const noteStartIdx = line.indexOf('note=');

  if (noteStartIdx !== -1) {
    const noteStart = noteStartIdx + 5;
    let endQuote = '';
    let endLineIdx = lineIndex;
    let foundEnd = false;
    let afterNote = '';

    if (noteStart < line.length) {
      if (line.substring(noteStart, noteStart + 3) === '"""') {
        endQuote = '"""';
        const noteStartInLine = noteStart + 3;

        if (line.indexOf('"""', noteStartInLine) !== -1) {
          const noteEndIdx = line.indexOf('"""', noteStartInLine) + 3;
          afterNote = line.substring(noteEndIdx);
          endLineIdx = lineIndex;
          foundEnd = true;
        } else {
          const contentLines = content.split(/\r?\n/);
          for (let i = lineIndex; i < contentLines.length; i++) {
            const currentLine = contentLines[i];
            if (i > lineIndex && currentLine.includes('"""')) {
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
        endQuote = '"';
        const noteStartInLine = noteStart + 1;

        if (line.indexOf('"', noteStartInLine) !== -1) {
          const noteEndIdx = line.indexOf('"', noteStartInLine) + 1;
          afterNote = line.substring(noteEndIdx);
          endLineIdx = lineIndex;
          foundEnd = true;
        } else {
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
        endQuote = "'";
        const noteStartInLine = noteStart + 1;

        if (line.indexOf("'", noteStartInLine) !== -1) {
          const noteEndIdx = line.indexOf("'", noteStartInLine) + 1;
          afterNote = line.substring(noteEndIdx);
          endLineIdx = lineIndex;
          foundEnd = true;
        } else {
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

    const baseLine = line.substring(0, noteStartIdx).trimEnd();

    if (foundEnd) {
      lines.splice(lineIndex, endLineIdx - lineIndex + 1);
    } else {
      lines.splice(lineIndex);
    }

    lines.splice(lineIndex, 0, baseLine + ` note=${finalValue}${afterNote}`);

    return lines.join('\n');
  } else {
    line = line.trimEnd() + ` note=${finalValue}`;
    lines[lineIndex] = line;
    return lines.join('\n');
  }
}

function updateBooleanAttribute(
  content: string,
  lineNum: number,
  attribute: string,
  value: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  const attrPattern = new RegExp(`\\s+${attribute}(?:=[^\\s]+)?`);

  if (value === true || (typeof value === 'string' && value === 'true')) {
    if (!attrPattern.test(line)) {
      const notePattern = /\s+note=/;
      const noteMatch = line.match(notePattern);

      if (noteMatch) {
        const noteStartIndex = noteMatch.index!;
        const beforeNote = line.substring(0, noteStartIndex);
        const noteAndAfter = line.substring(noteStartIndex);
        line = beforeNote + ` ${attribute}` + noteAndAfter;
      } else {
        line = line.trimEnd() + ` ${attribute}`;
      }
    }
  } else {
    line = line.replace(attrPattern, '');
  }

  lines[lineIndex] = line;
  return lines.join('\n');
}

function updateSimpleAttribute(
  content: string,
  lineNum: number,
  attribute: string,
  value: string | number | boolean
): string {
  const lines = content.split(/\r?\n/);
  if (lineNum < 1 || lineNum > lines.length) {
    return content;
  }

  const lineIndex = lineNum - 1;
  let line = lines[lineIndex];

  if (attribute === 'url') {
    const imageUrlPattern = /<([^>]+)>/;
    const match = line.match(imageUrlPattern);
    if (match) {
      line = line.replace(imageUrlPattern, `<${value}>`);
    }
    lines[lineIndex] = line;
    return lines.join('\n');
  }

  const attrPattern = new RegExp(`(\\s)${attribute}=[^\\s]+`);

  if (attrPattern.test(line)) {
    line = line.replace(attrPattern, `$1${attribute}=${value}`);
  } else {
    const notePattern = /\s+note=/;
    const noteMatch = line.match(notePattern);

    if (noteMatch) {
      const noteStartIndex = noteMatch.index!;
      const beforeNote = line.substring(0, noteStartIndex);
      const noteAndAfter = line.substring(noteStartIndex);
      line = beforeNote + ` ${attribute}=${value}` + noteAndAfter;
    } else {
      const hasOtherAttributes = /\s\w+=/.test(line);
      if (hasOtherAttributes) {
        // Find the position after the last key=value attribute pair
        // Text content follows attributes without a key= prefix
        let insertPos = -1;
        const attrMatchAll = [...line.matchAll(/\s\w+=[^\s]+/g)];
        if (attrMatchAll.length > 0) {
          const lastMatch = attrMatchAll[attrMatchAll.length - 1];
          insertPos = lastMatch.index! + lastMatch[0].length;
        }
        if (insertPos >= 0) {
          line = line.substring(0, insertPos) + ` ${attribute}=${value}` + line.substring(insertPos);
        } else {
          line = line.trimEnd() + ` ${attribute}=${value}`;
        }
      } else {
        line = line.trimEnd() + ` ${attribute}=${value}`;
      }
    }
  }

  lines[lineIndex] = line;
  return lines.join('\n');
}

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

  const isCoordAttribute = ['x', 'y', 'x2', 'y2'].includes(attributeName);
  if (!isCoordAttribute) {
    const actualStartLine = getElementStartLine(content, lineNum);
    if (lineNum !== actualStartLine) {
      return content;
    }
  }

  if (isCoordAttribute) {
    return updateCoordAttribute(content, lineNum, attributeName, attributeValue);
  }
  if (attributeName === 'text') {
    return updateTextAttribute(content, lineNum, attributeValue);
  }
  if (attributeName === 'note') {
    return updateNoteAttribute(content, lineNum, attributeValue);
  }
  if (['bold', 'italic', 'shadow-enabled'].includes(attributeName)) {
    return updateBooleanAttribute(content, lineNum, attributeName, attributeValue);
  }
  return updateSimpleAttribute(content, lineNum, attributeName, attributeValue);
}
