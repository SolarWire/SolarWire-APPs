export { renderToCanvas, getElementAtPosition, getElementsInRect } from './renderer';
export type { CanvasRenderOptions, CanvasRenderResult, ViewBox } from './renderer';

export { 
  createCanvasRenderContext,
  calculatePosition,
  calculateLineEnd,
  getNumberAttribute,
  getColorAttribute,
  getBooleanAttribute,
  getAlignAttribute,
  getStyleAttribute,
  getOpacityAttribute,
  updateLastElementBounds
} from './context';
export type { 
  CanvasRenderContext, 
  ElementBounds, 
  AbsolutePosition,
  GlobalDefaults 
} from './context';

export { 
  renderSelectionHighlight, 
  renderResizeHandles, 
  renderBoxSelection,
  getHandleAtPosition 
} from './interaction';
export type { BoxSelectionState } from './interaction';
