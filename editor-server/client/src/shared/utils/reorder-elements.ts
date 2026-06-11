export function bringElementsToFront(
  content: string,
  selectedElementIds: string[]
): { content: string; newElementIds: string[] } {
  const lines = content.split(/\r?\n/);

  const selectedBlocks: Array<{ startLine: number, endLine: number, content: string[] }> = [];
  const remainingLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmedLine = line.trim();

    if (selectedElementIds.includes(lineNum.toString())) {
      const blockContent: string[] = [];
      let endIdx = i;

      const noteMatch = line.match(/note=(["']{3})/);
      if (noteMatch) {
        const quote = noteMatch[1];
        const matchIndex = line.indexOf(noteMatch[0]);
        const afterNoteStart = line.substring(matchIndex + noteMatch[0].length);

        if (!afterNoteStart.includes(quote)) {
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
          blockContent.push(line);
        }
      } else if (trimmedLine.startsWith('##')) {
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

          if (currentIndent < tableIndent) {
            break;
          }

          blockContent.push(currentLine);
          endIdx++;
        }
        endIdx--;
      } else {
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

  const newContent = [
    ...selectedBlocks.flatMap(block => block.content),
    ...remainingLines
  ].join('\n');

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
