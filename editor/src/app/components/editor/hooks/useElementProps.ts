import { useMemo } from 'react';
import type { Element } from '../../../../lib/parser/types';

export interface ElementProps {
  type: string;
  attrs: Record<string, string>;

  position: {
    x: number;
    y: number;
  };

  size: {
    w: string;
    h: string;
    r: string;
    show: boolean;
    showRadius: boolean;
    showPadding: boolean;
  };

  appearance: {
    bg: string;
    borderColor: string;
    borderSize: string;
    textColor: string;
    opacity: string;
    showBorder: boolean;
    showFill: boolean;
    showOpacity: boolean;
    showShadow: boolean;
  };

  text: {
    content: string;
    isMultiline: boolean;
    fontSize: string;
    align: string;
    verticalAlign: string;
    bold: boolean;
    italic: boolean;
    textDecoration: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    lineHeight: string;
    letterSpacing: string;
    show: boolean;
    showAlign: boolean;
  };

  line?: {
    end: { type: string; x?: { type: string; value: number }; y?: { type: string; value: number }; dx?: number; dy?: number };
    label?: string;
    labelColor: string;
    style: string;
  };

  table?: {
    border: string;
    cellspacing: string;
    rows: number;
    cols: number;
  };

  image?: {
    url: string;
  };

  note: string;
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

    const rawText = el.text || '';
    const w = attrs.w || '';
    const h = attrs.h || '';
    const r = attrs.r || '';
    const bg = attrs.bg || (type === 'text' ? 'transparent' : '#ffffff');
    const borderColor = type === 'line' ? (attrs.b || '#333333') : (attrs.b || '#333333');
    const borderSize = attrs.s || '1';
    const textColor = type === 'line' ? (attrs.c || '#333333') : (attrs.c || '#000000');
    const fontSize = attrs.size || attrs['text-size'] || '12';
    const align = attrs.align || '';
    const verticalAlign = attrs['vertical-align'] || '';
    const paddingTop = attrs['padding-top'] || '';
    const paddingRight = attrs['padding-right'] || '';
    const paddingBottom = attrs['padding-bottom'] || '';
    const paddingLeft = attrs['padding-left'] || '';
    const textDecoration = attrs['text-decoration'] || '';
    const opacity = attrs.opacity || '1';
    const bold = !!attrs.bold;
    const italic = !!attrs.italic;
    const lineHeight = attrs['line-height'] || '';
    const letterSpacing = attrs['letter-spacing'] || '0';
    let note = attrs.note || '';
    if (typeof note === 'string') {
      note = note.replace(/^"""|"""$/g, '');
    }

    const showSizeControls = type !== 'line' && type !== 'text';
    const showRadiusControl = type === 'rectangle';
    const showTextControls = 'text' in element || type === 'text';
    const showBorderControls = type !== 'line' && type !== 'text';
    const showAlignControl = type !== 'text' && ('text' in element);
    const showFill = type !== 'line';
    const showShadow = ['rectangle', 'circle', 'text', 'image'].includes(type);
    const showOpacity = ['rectangle', 'circle', 'text', 'image'].includes(type);
    const showPaddingControls = showSizeControls && showTextControls && type !== 'table';

    const isMultilineText = rawText.startsWith('"""') && rawText.endsWith('"""');
    let textContent = rawText;
    if (isMultilineText) {
      textContent = rawText.replace(/^"""|"""$/g, '');
    }

    const lineLabelColor = attrs.c || '#333333';
    const lineStyle = attrs.style || 'solid';

    const tableBorder = attrs.border || '1';
    const tableCellspacing = attrs.cellspacing || '0';
    const tableRows = el.children?.length || 0;
    const tableCols = (el.children?.[0] as any)?.children?.length || 0;

    return {
      type,
      attrs,
      position: { x, y },
      size: {
        w, h, r,
        show: showSizeControls,
        showRadius: showRadiusControl,
        showPadding: showPaddingControls,
      },
      appearance: {
        bg, borderColor, borderSize, textColor, opacity,
        showBorder: showBorderControls,
        showFill,
        showOpacity,
        showShadow,
      },
      text: {
        content: textContent,
        isMultiline: isMultilineText,
        fontSize, align, verticalAlign,
        bold, italic, textDecoration,
        paddingTop, paddingRight, paddingBottom, paddingLeft,
        lineHeight, letterSpacing,
        show: showTextControls,
        showAlign: showAlignControl,
      },
      line: type === 'line' ? {
        end: el.end!,
        label: el.label,
        labelColor: lineLabelColor,
        style: lineStyle,
      } : undefined,
      table: type === 'table' ? {
        border: tableBorder,
        cellspacing: tableCellspacing,
        rows: tableRows,
        cols: tableCols,
      } : undefined,
      image: type === 'image' ? {
        url: el.url || '',
      } : undefined,
      note,
    };
  }, [element]);
}
