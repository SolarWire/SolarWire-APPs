import { Coordinate, CoordinateExpression, RelativeEndCoordinate, Element, DocumentDeclaration, SourceLocation } from '../parser';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ErrorDetails {
  title: string;
  expected?: string;
  found?: string;
  location?: string;
  reason?: string;
  solution?: string;
}

export function formatRenderError(
  details: ErrorDetails,
  sourceInput: string | undefined,
  location: SourceLocation | undefined,
  contextLines: number = 3
): string {
  let result = '═'.repeat(60) + '\n';
  result += '  RENDER ERROR\n';
  result += '═'.repeat(60) + '\n\n';
  result += `  ${details.title}\n\n`;
  
  if (details.expected || details.found) {
    if (details.expected) {
      result += `  Expected: ${details.expected}\n`;
    }
    if (details.found) {
      result += `  Found:    ${details.found}\n`;
    }
    result += '\n';
  }
  
  if (details.location) {
    result += `  Position: ${details.location}\n\n`;
  }
  
  if (details.reason) {
    result += `  Reason: ${details.reason}\n\n`;
  }
  
  if (details.solution) {
    result += `  Solution: ${details.solution}\n`;
  }
  
  if (!sourceInput || !location) {
    return result;
  }
  
  const lines = sourceInput.split(/\r?\n/);
  const lineNum = location.line;
  const columnNum = location.column || 1;
  
  const startLine = Math.max(0, lineNum - contextLines - 1);
  const endLine = Math.min(lines.length, lineNum + contextLines);
  
  const maxLineNumWidth = Math.max(
    String(startLine + 1).length,
    String(endLine).length,
    4
  );
  
  result += '\n' + '─'.repeat(60) + '\n';
  result += '  Context:\n';
  result += '─'.repeat(60) + '\n';
  
  for (let i = startLine; i < endLine; i++) {
    const currentLineNum = i + 1;
    const isErrorLine = i === lineNum - 1;
    const lineContent = lines[i] || '';
    
    if (isErrorLine) {
      result += `>>> ${currentLineNum.toString().padStart(maxLineNumWidth, ' ')} | ${lineContent}\n`;
      const pointerOffset = columnNum > 0 ? columnNum - 1 : 0;
      const spaces = ' '.repeat(5 + maxLineNumWidth + 3 + pointerOffset);
      result += `${spaces}^\n`;
      result += `${spaces}| HERE\n`;
    } else {
      result += `    ${currentLineNum.toString().padStart(maxLineNumWidth, ' ')} | ${lineContent}\n`;
    }
  }
  
  result += '─'.repeat(60) + '\n';
  
  return result;
}

export function getElementLocationInfo(element: Element): string {
  if (element.location) {
    return `line ${element.location.line}`;
  }
  if (element.coordinates) {
    const x = element.coordinates.x.type === 'absolute' 
      ? element.coordinates.x.value 
      : 'relative';
    const y = element.coordinates.y.type === 'absolute' 
      ? element.coordinates.y.value 
      : 'relative';
    return `@(${x}, ${y})`;
  }
  return 'unknown position';
}

export interface GlobalDefaults {
  c?: string;
  size?: number;
  'line-height'?: number;
  gap?: number;
  bg?: string;
  r?: number;
  bold?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationContext {
  sourceInput?: string;
  element: Element;
}

export interface RenderContext {
  offsetX: number;
  offsetY: number;
  lastElementBounds: ElementBounds | null;
  isFirstElement: boolean;
  globalDefaults: GlobalDefaults;
  sourceInput?: string;
}

export function createRenderContext(declarations: DocumentDeclaration[] = [], sourceInput?: string): RenderContext {
  const globalDefaults: GlobalDefaults = {};
  
  declarations.forEach(decl => {
    const { key, value } = decl;
    if (['size', 'line-height', 'gap', 'r'].includes(key)) {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(formatRenderError({
          title: `Invalid value for "!${key}" declaration`,
          expected: 'A valid number',
          found: `"${value}"`,
          location: `declaration !${key}=${value}`,
          reason: `The value "${value}" cannot be parsed as a number.`,
          solution: `Use a numeric value for the "!${key}" declaration, e.g., !${key}=10.`
        }, sourceInput, undefined));
      }
      globalDefaults[key] = parsed;
    } else if (key === 'bold') {
      globalDefaults[key] = true;
    } else {
      globalDefaults[key] = value;
    }
  });
  
  return {
    offsetX: 0,
    offsetY: 0,
    lastElementBounds: null,
    isFirstElement: true,
    globalDefaults,
    sourceInput,
  };
}

export function createChildContext(parentContext: RenderContext, offsetX: number, offsetY: number): RenderContext {
  return {
    offsetX: parentContext.offsetX + offsetX,
    offsetY: parentContext.offsetY + offsetY,
    lastElementBounds: null,
    isFirstElement: true,
    globalDefaults: parentContext.globalDefaults,
    sourceInput: parentContext.sourceInput,
  };
}

export function updateLastElementBounds(context: RenderContext, bounds: ElementBounds): void {
  context.lastElementBounds = bounds;
  context.isFirstElement = false;
}

export interface AbsolutePosition {
  x: number;
  y: number;
}

export function calculateCoordinate(
  context: RenderContext,
  coord: Coordinate,
  isX: boolean,
  lastBounds: ElementBounds | null
): number {
  let baseValue: number;

  switch (coord.type) {
    case 'absolute':
      baseValue = coord.value;
      break;
    case 'relative':
      baseValue = coord.value;
      break;
    case 'edge':
      if (!lastBounds) {
        baseValue = 0;
      } else {
        switch (coord.direction) {
          case 'L':
            baseValue = lastBounds.x;
            break;
          case 'R':
            baseValue = lastBounds.x + lastBounds.width;
            break;
          case 'T':
            baseValue = lastBounds.y;
            break;
          case 'B':
            baseValue = lastBounds.y + lastBounds.height;
            break;
          case 'C':
            baseValue = isX 
              ? lastBounds.x + lastBounds.width / 2 
              : lastBounds.y + lastBounds.height / 2;
            break;
          default:
            baseValue = 0;
        }
      }
      baseValue += coord.value;
      break;
    default: {
      const exhaustiveCheck: never = coord;
      throw new Error(`Internal error: Unknown coordinate type "${(exhaustiveCheck as any).type}". This is a renderer bug, not a user input error.`);
    }
  }

  return baseValue + (isX ? context.offsetX : context.offsetY);
}

export function calculatePosition(
  context: RenderContext,
  coords: CoordinateExpression
): AbsolutePosition {
  const x = calculateCoordinate(context, coords.x, true, context.lastElementBounds);
  const y = calculateCoordinate(context, coords.y, false, context.lastElementBounds);
  return { x, y };
}

export function calculateLineEnd(
  context: RenderContext,
  start: AbsolutePosition,
  end: CoordinateExpression | RelativeEndCoordinate
): AbsolutePosition {
  if ('dx' in end) {
    return {
      x: start.x + end.dx,
      y: start.y + end.dy,
    };
  } else {
    return calculatePosition(context, end);
  }
}

export function getNumberAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string,
  defaultValue: number,
  vc?: ValidationContext
): number {
  const localValue = attributes[key];
  if (localValue !== undefined) {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      if (vc) {
        throw new Error(formatRenderError({
          title: `Invalid value for "${key}" attribute`,
          expected: 'A valid number',
          found: `"${localValue}"`,
          location: getElementLocationInfo(vc.element),
          reason: `The value "${localValue}" cannot be parsed as a number.`,
          solution: `Use a numeric value for the "${key}" attribute, e.g., ${key}=10.`
        }, vc.sourceInput, vc.element.location));
      }
      return defaultValue;
    }
    return parsed;
  }
  if (globalDefaults[key] !== undefined && typeof globalDefaults[key] === 'number') {
    if (isNaN(globalDefaults[key] as number)) {
      if (vc) {
        throw new Error(formatRenderError({
          title: `Invalid value for "${key}" attribute`,
          expected: 'A valid number',
          found: `"${globalDefaults[key]}"`,
          location: getElementLocationInfo(vc.element),
          reason: `The global default value for "${key}" is not a valid number.`,
          solution: `Use a numeric value for the "!${key}" declaration, e.g., !${key}=10.`
        }, vc.sourceInput, vc.element.location));
      }
    }
    return globalDefaults[key] as number;
  }
  return defaultValue;
}

export function getColorAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string,
  defaultValue: string,
  vc?: ValidationContext
): string {
  const localValue = attributes[key];
  if (localValue !== undefined) {
    if (localValue === '') return 'transparent';
    return localValue;
  }
  if (globalDefaults[key] !== undefined) {
    return globalDefaults[key] as string;
  }
  return defaultValue;
}

export function getBooleanAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  key: string
): boolean {
  if (key in attributes) return true;
  if (globalDefaults[key] !== undefined) return !!globalDefaults[key];
  return false;
}

export function getAlignAttribute(
  attributes: Record<string, string>,
  defaultValue: 'start' | 'middle' | 'end',
  vc?: ValidationContext
): 'start' | 'middle' | 'end' {
  const align = attributes['align'];
  const allowedValues = ['l', 'c', 'r'];
  if (align !== undefined && !allowedValues.includes(align)) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "align" attribute`,
        expected: `One of: ${allowedValues.join(', ')}`,
        found: `"${align}"`,
        location: getElementLocationInfo(vc.element),
        reason: `"${align}" is not a valid value for the "align" attribute.`,
        solution: `Use one of the allowed values: ${allowedValues.join(', ')}.`
      }, vc.sourceInput, vc.element.location));
    }
    return defaultValue;
  }
  switch (align) {
    case 'l':
      return 'start';
    case 'c':
      return 'middle';
    case 'r':
      return 'end';
    default:
      return defaultValue;
  }
}

export function getStyleAttribute(
  attributes: Record<string, string>,
  vc?: ValidationContext
): { strokeDasharray?: string } {
  const style = attributes['style'];
  const allowedValues = ['dashed', 'dotted'];
  if (style !== undefined && !allowedValues.includes(style)) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "style" attribute`,
        expected: `One of: ${allowedValues.join(', ')}`,
        found: `"${style}"`,
        location: getElementLocationInfo(vc.element),
        reason: `"${style}" is not a valid value for the "style" attribute.`,
        solution: `Use one of the allowed values: ${allowedValues.join(', ')}.`
      }, vc.sourceInput, vc.element.location));
    }
    return {};
  }
  switch (style) {
    case 'dashed':
      return { strokeDasharray: '5,5' };
    case 'dotted':
      return { strokeDasharray: '2,2' };
    default:
      return {};
  }
}

export function getOpacityAttribute(
  attributes: Record<string, string>,
  key: string = 'opacity',
  defaultValue: number = 1,
  vc?: ValidationContext
): number {
  const value = attributes[key];
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "${key}" attribute`,
        expected: 'A valid number between 0 and 1',
        found: `"${value}"`,
        location: getElementLocationInfo(vc.element),
        reason: `The value "${value}" cannot be parsed as a number.`,
        solution: `Use a numeric value between 0 and 1 for the "${key}" attribute, e.g., ${key}=0.5.`
      }, vc.sourceInput, vc.element.location));
    }
    return defaultValue;
  }
  if (parsed < 0 || parsed > 1) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "${key}" attribute`,
        expected: 'A number between 0 and 1',
        found: `"${value}"`,
        location: getElementLocationInfo(vc.element),
        reason: `The value ${parsed} is outside the valid range of 0 to 1.`,
        solution: `Use a value between 0 and 1 for the "${key}" attribute, e.g., ${key}=0.5.`
      }, vc.sourceInput, vc.element.location));
    }
    return Math.max(0, Math.min(1, parsed));
  }
  return parsed;
}

export function getLetterSpacingAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  defaultValue: number = 0,
  vc?: ValidationContext
): number {
  return getNumberAttribute(attributes, globalDefaults, 'letter-spacing', defaultValue, vc);
}

export function getVerticalAlignAttribute(
  attributes: Record<string, string>,
  defaultValue: 'top' | 'middle' | 'bottom' = 'top',
  vc?: ValidationContext
): 'top' | 'middle' | 'bottom' {
  const val = attributes['vertical-align'];
  const allowedValues = ['t', 'm', 'b'];
  if (val !== undefined && !allowedValues.includes(val)) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "vertical-align" attribute`,
        expected: `One of: ${allowedValues.join(', ')}`,
        found: `"${val}"`,
        location: getElementLocationInfo(vc.element),
        reason: `"${val}" is not a valid value for the "vertical-align" attribute.`,
        solution: `Use one of the allowed values: ${allowedValues.join(', ')}.`
      }, vc.sourceInput, vc.element.location));
    }
    return defaultValue;
  }
  switch (val) {
    case 't':
      return 'top';
    case 'm':
      return 'middle';
    case 'b':
      return 'bottom';
    default:
      return defaultValue;
  }
}

export function getTextDecorationAttribute(
  attributes: Record<string, string>,
  vc?: ValidationContext
): 'none' | 'underline' | 'line-through' {
  const val = attributes['text-decoration'];
  const allowedValues = ['none', 'underline', 'line-through'];
  if (val !== undefined && !allowedValues.includes(val)) {
    if (vc) {
      throw new Error(formatRenderError({
        title: `Invalid value for "text-decoration" attribute`,
        expected: `One of: ${allowedValues.join(', ')}`,
        found: `"${val}"`,
        location: getElementLocationInfo(vc.element),
        reason: `"${val}" is not a valid value for the "text-decoration" attribute.`,
        solution: `Use one of the allowed values: ${allowedValues.join(', ')}.`
      }, vc.sourceInput, vc.element.location));
    }
    return 'none';
  }
  switch (val) {
    case 'none':
      return 'none';
    case 'underline':
      return 'underline';
    case 'line-through':
      return 'line-through';
    default:
      return 'none';
  }
}

export interface PaddingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function getPaddingValues(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  defaultValue: number = 0,
  vc?: ValidationContext
): PaddingValues {
  return {
    top: getNumberAttribute(attributes, globalDefaults, 'padding-top', defaultValue, vc),
    right: getNumberAttribute(attributes, globalDefaults, 'padding-right', defaultValue, vc),
    bottom: getNumberAttribute(attributes, globalDefaults, 'padding-bottom', defaultValue, vc),
    left: getNumberAttribute(attributes, globalDefaults, 'padding-left', defaultValue, vc),
  };
}

export interface ShadowConfig {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export function getShadowAttribute(
  attributes: Record<string, string>,
  globalDefaults: GlobalDefaults,
  vc?: ValidationContext
): ShadowConfig | null {
  if (attributes['shadow-enabled'] === undefined && attributes['shadow-x'] === undefined) {
    return null;
  }

  const x = getNumberAttribute(attributes, globalDefaults, 'shadow-x', 0, vc);
  const y = getNumberAttribute(attributes, globalDefaults, 'shadow-y', 0, vc);
  const blur = getNumberAttribute(attributes, globalDefaults, 'shadow-blur', 3, vc);
  const color = getColorAttribute(attributes, globalDefaults, 'shadow-color', '#000000', vc);

  if (x === 0 && y === 0 && blur === 0) {
    return null;
  }

  return { x, y, blur, color };
}

export function generateShadowFilter(shadow: ShadowConfig, elementId: string): string {
  return `  <filter id="shadow-${elementId}" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="${shadow.x}" dy="${shadow.y}" stdDeviation="${shadow.blur}" flood-color="${shadow.color}"/>
  </filter>`;
}
