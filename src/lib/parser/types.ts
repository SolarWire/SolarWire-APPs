/**
 * 绝对坐标接口
 */
export interface AbsoluteCoordinate {
  type: 'absolute';
  value: number;
}

/**
 * 相对坐标接口
 */
export interface RelativeCoordinate {
  type: 'relative';
  value: number;
}

/**
 * 边缘坐标接口
 */
export interface EdgeCoordinate {
  type: 'edge';
  direction: 'L' | 'R' | 'T' | 'B' | 'C';
  value: number;
}

/**
 * 坐标类型
 */
export type Coordinate = AbsoluteCoordinate | RelativeCoordinate | EdgeCoordinate;

/**
 * 相对终点坐标接口
 */
export interface RelativeEndCoordinate {
  type: 'relative';
  dx: number;
  dy: number;
}

/**
 * 坐标表达式类型
 */
export type CoordinateExpression = {
  x: Coordinate;
  y: Coordinate;
};

/**
 * 源码位置接口
 */
export interface SourceLocation {
  line: number;
  column?: number;
}

/**
 * 基础元素接口
 */
export interface BaseElement {
  type: string;
  attributes: Record<string, string>;
  coordinates?: CoordinateExpression;
  children?: BaseElement[];
  location?: SourceLocation;
}

/**
 * 矩形元素接口
 */
export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  text?: string;
}

/**
 * 圆形元素接口
 */
export interface CircleElement extends BaseElement {
  type: 'circle';
  text?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
}

/**
 * 占位符元素接口
 */
export interface PlaceholderElement extends BaseElement {
  type: 'placeholder';
  text?: string;
}

/**
 * 图片元素接口
 */
export interface ImageElement extends BaseElement {
  type: 'image';
  url: string;
}

/**
 * 线段元素接口
 */
export interface LineElement extends BaseElement {
  type: 'line';
  label?: string;
  start: CoordinateExpression;
  end: CoordinateExpression | RelativeEndCoordinate;
}

/**
 * 表格元素接口
 */
export interface TableElement extends BaseElement {
  type: 'table';
  children: TableRowElement[];
}

/**
 * 表格行元素接口
 */
export interface TableRowElement extends BaseElement {
  type: 'table-row';
  children: BaseElement[];
}

/**
 * 元素类型联合
 */
export type Element =
  | RectangleElement
  | CircleElement
  | TextElement
  | PlaceholderElement
  | ImageElement
  | LineElement
  | TableElement
  | TableRowElement;

/**
 * 文档声明接口
 */
export interface DocumentDeclaration {
  key: string;
  value: string;
}

/**
 * 文档接口
 */
export interface Document {
  /** 文档声明列表 */
  declarations: DocumentDeclaration[];
  /** 元素列表 */
  elements: Element[];
}
