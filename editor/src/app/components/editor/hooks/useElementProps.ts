import { useMemo } from 'react';
import type { Element } from '../../../../lib/parser/types';

export interface ElementProps {
  type: string;
  attrs: Record<string, string>;
  x: number;
  y: number;
  text: string;
  w: string;
  h: string;
  r: string;
  bg: string;
  borderColor: string;
  borderSize: string;
  textColor: string;
  fontSize: string;
  align: string;
  verticalAlign: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  textDecoration: string;
  opacity: string;
  bold: boolean;
  italic: boolean;
  note: string;
  showSizeControls: boolean;
  showRadiusControl: boolean;
  showTextControls: boolean;
  showBorderControls: boolean;
  showLineControls: boolean;
  showAlignControl: boolean;
  showShadow: boolean;
  showOpacity: boolean;
  isTable: boolean;
  isMultilineText: boolean;
  textContent: string;
  end?: { type: string; x?: { type: string; value: number }; y?: { type: string; value: number }; dx?: number; dy?: number };
  label?: string;
  url?: string;
  lineLabelColor: string;
  lineStyle: string;
  tableBorder: string;
  tableCellspacing: string;
  tableRows: number;
  tableCols: number;
}

interface UseElementPropsOptions {
  element: Element | null | undefined;
}

export function useElementProps({ element }: UseElementPropsOptions): ElementProps | null {
  return useMemo(() => {
    if (!element) return null;

    const el = element as Element & {
      type: string;
      attributes?: Record<string, unknown>;
      coordinates?: { x: { type: string; value: number }; y: { type: string; value: number } };
      start?: { x: { type: string; value: number }; y: { type: string; value: number } };
      end?: { type: string; x?: { type: string; value: number }; y?: { type: string; value: number }; dx?: number; dy?: number };
      label?: string;
      url?: string;
      text?: string;
      children?: Element[];
    };
    const type = el.type;
    const attrs = (el.attributes || {}) as Record<string, string>;

    let x = 0;
    let y = 0;

    if (type === 'line') {
      if (el.start && el.start.x && el.start.y) {
        if (el.start.x.type === 'absolute') {
          x = el.start.x.value;
        } else {
          x = parseInt(attrs.x || '0');
        }
        if (el.start.y.type === 'absolute') {
          y = el.start.y.value;
        } else {
          y = parseInt(attrs.y || '0');
        }
      } else {
        x = parseInt(attrs.x || '0');
        y = parseInt(attrs.y || '0');
      }
    } else {
      const coords = el.coordinates;
      if (coords && coords.x.type === 'absolute' && coords.y.type === 'absolute') {
        x = coords.x.value;
        y = coords.y.value;
      } else {
        x = parseInt(attrs.x || '0');
        y = parseInt(attrs.y || '0');
      }
    }

    const text = el.text || '';
    const w = attrs.w || '';
    const h = attrs.h || '';
    const r = attrs.r || '';
    const bg = attrs.bg || '#ffffff';
    const borderColor = attrs.b || '#333333';
    const borderSize = attrs.s || '1';
    const textColor = attrs.c || '#000000';
    const fontSize = attrs.size || attrs['text-size'] || '12';
    const align = attrs.align || 'c';
    const verticalAlign = attrs['vertical-align'] || 't';
    const paddingTop = attrs['padding-top'] || '';
    const paddingRight = attrs['padding-right'] || '';
    const paddingBottom = attrs['padding-bottom'] || '';
    const paddingLeft = attrs['padding-left'] || '';
    const textDecoration = attrs['text-decoration'] || '';
    const opacity = attrs.opacity || '1';
    const bold = !!attrs.bold;
    const italic = !!attrs.italic;
    let note = attrs.note || '';
    if (typeof note === 'string') {
      note = note.replace(/^"""|"""$/g, '');
    }

    const showSizeControls = type !== 'text' && type !== 'line';
    const showRadiusControl = type === 'rectangle';
    const showTextControls = 'text' in element || type === 'text';
    const showBorderControls = type !== 'line' && type !== 'text';
    const showLineControls = type === 'line';
    const showAlignControl = type === 'text' || 'text' in element;
    const showShadow = ['rectangle', 'circle', 'text', 'image'].includes(type);
    const showOpacity = ['rectangle', 'circle', 'text', 'image'].includes(type);

    const isTable = type === 'table';
    const isMultilineText = text.startsWith('"""') && text.endsWith('"""');
    let textContent = text;
    if (isMultilineText) {
      textContent = text.replace(/^"""|"""$/g, '');
    }

    const lineLabelColor = attrs['text-color'] || '#333333';
    const lineStyle = attrs.style || 'solid';

    const tableBorder = attrs.border || '1';
    const tableCellspacing = attrs.cellspacing || '0';
    const tableRows = el.children?.length || 0;
    const tableCols = (el.children?.[0] as any)?.children?.length || 0;

    return {
      type, attrs, x, y, text, w, h, r, bg, borderColor, borderSize,
      textColor, fontSize, align, verticalAlign, paddingTop, paddingRight, paddingBottom, paddingLeft, textDecoration, opacity, bold, italic, note, showSizeControls,
      showRadiusControl, showTextControls, showBorderControls,
      showLineControls, showAlignControl, showShadow, showOpacity, isTable, isMultilineText, textContent,
      end: el.end, label: el.label, url: el.url,
      lineLabelColor, lineStyle,
      tableBorder, tableCellspacing, tableRows, tableCols,
    };
  }, [element]);
}
