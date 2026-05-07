export function alignElements(
  content: string,
  selectedElementIds: string[],
  alignType: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
  elementsBounds?: Map<number, { x: number; y: number; width: number; height: number }>
): string {
  if (selectedElementIds.length === 0) return content;

  const lines = content.split(/\r?\n/);
  const elementCoords: Array<{ lineNum: number; x: number; y: number; width: number; height: number }> = [];

  for (const id of selectedElementIds) {
    const lineNum = parseInt(id);
    if (lineNum < 1 || lineNum > lines.length) continue;

    const line = lines[lineNum - 1];
    const coordMatch = line.match(/@\((\d+),\s*(\d+)\)/);
    if (coordMatch) {
      let width = 0;
      let height = 0;

      if (elementsBounds && elementsBounds.has(lineNum)) {
        const bounds = elementsBounds.get(lineNum);
        width = bounds?.width || 0;
        height = bounds?.height || 0;
      } else {
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
