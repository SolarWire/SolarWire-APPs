import { useMemo } from 'react';
import type { Element } from '../../../../lib/parser/types';
import { computeElementProps, type ElementProps } from './useElementProps';

/**
 * 多选聚合后的属性。
 * - props: 聚合后的 ElementProps（公共值或空字符串）
 * - mixedFields: 值不一致的字段集合（codeAttr）
 */
export interface MultiElementProps {
  props: ElementProps;
  mixedFields: Set<string>;
}

interface UseMultiElementPropsOptions {
  elements: Element[];
}

/**
 * 字符串字段聚合：所有值相同取该值，否则空字符串 + mixed。
 */
function aggregateStringField(
  allProps: ElementProps[],
  getter: (p: ElementProps) => string,
  codeAttr: string,
  mixedFields: Set<string>
): string {
  const values = allProps.map(getter);
  const first = values[0];
  const allSame = values.every(v => v === first);
  if (allSame) return first;
  mixedFields.add(codeAttr);
  return '';
}

/**
 * 布尔字段聚合：所有值相同取该值，否则 false + mixed。
 */
function aggregateBoolField(
  allProps: ElementProps[],
  getter: (p: ElementProps) => boolean,
  codeAttr: string,
  mixedFields: Set<string>
): boolean {
  const values = allProps.map(getter);
  const first = values[0];
  const allSame = values.every(v => v === first);
  if (allSame) return first;
  mixedFields.add(codeAttr);
  return false;
}

/**
 * show* 标志聚合：所有元素都为 true 才为 true（交集）。
 */
function aggregateShowFlag(allProps: ElementProps[], getter: (p: ElementProps) => boolean): boolean {
  return allProps.every(getter);
}

/**
 * 多选元素属性聚合 hook。
 * 复用 CellProperties 的 getCommonAttr/isMixed 模式，但以纯函数 + useMemo 实现。
 */
export function useMultiElementProps({ elements }: UseMultiElementPropsOptions): MultiElementProps | null {
  return useMemo(() => {
    if (elements.length === 0) return null;

    const allProps = elements.map(computeElementProps);
    if (allProps.length !== elements.length) return null;

    const mixedFields = new Set<string>();

    // 聚合 size 字段
    const size = {
      w: aggregateStringField(allProps, p => p.size.w, 'w', mixedFields),
      h: aggregateStringField(allProps, p => p.size.h, 'h', mixedFields),
      r: aggregateStringField(allProps, p => p.size.r, 'r', mixedFields),
      show: aggregateShowFlag(allProps, p => p.size.show),
      showRadius: aggregateShowFlag(allProps, p => p.size.showRadius),
      showPadding: aggregateShowFlag(allProps, p => p.size.showPadding),
    };

    // 聚合 appearance 字段
    const appearance = {
      bg: aggregateStringField(allProps, p => p.appearance.bg, 'bg', mixedFields),
      borderColor: aggregateStringField(allProps, p => p.appearance.borderColor, 'b', mixedFields),
      borderSize: aggregateStringField(allProps, p => p.appearance.borderSize, 's', mixedFields),
      textColor: aggregateStringField(allProps, p => p.appearance.textColor, 'c', mixedFields),
      opacity: aggregateStringField(allProps, p => p.appearance.opacity, 'opacity', mixedFields),
      showBorder: aggregateShowFlag(allProps, p => p.appearance.showBorder),
      showFill: aggregateShowFlag(allProps, p => p.appearance.showFill),
      showOpacity: aggregateShowFlag(allProps, p => p.appearance.showOpacity),
      showShadow: aggregateShowFlag(allProps, p => p.appearance.showShadow),
    };

    // 聚合 text 字段（多选时隐藏内容，但格式属性仍可批量修改）
    const text = {
      content: '',
      isMultiline: false,
      fontSize: aggregateStringField(allProps, p => p.text.fontSize, 'size', mixedFields),
      align: aggregateStringField(allProps, p => p.text.align, 'align', mixedFields),
      vAlign: aggregateStringField(allProps, p => p.text.vAlign, 'v-align', mixedFields),
      bold: aggregateBoolField(allProps, p => p.text.bold, 'bold', mixedFields),
      italic: aggregateBoolField(allProps, p => p.text.italic, 'italic', mixedFields),
      textDecoration: aggregateStringField(allProps, p => p.text.textDecoration, 'text-decoration', mixedFields),
      paddingTop: aggregateStringField(allProps, p => p.text.paddingTop, 'padding-top', mixedFields),
      paddingRight: aggregateStringField(allProps, p => p.text.paddingRight, 'padding-right', mixedFields),
      paddingBottom: aggregateStringField(allProps, p => p.text.paddingBottom, 'padding-bottom', mixedFields),
      paddingLeft: aggregateStringField(allProps, p => p.text.paddingLeft, 'padding-left', mixedFields),
      lineHeight: aggregateStringField(allProps, p => p.text.lineHeight, 'line-height', mixedFields),
      letterSpacing: aggregateStringField(allProps, p => p.text.letterSpacing, 'letter-spacing', mixedFields),
      show: aggregateShowFlag(allProps, p => p.text.show),
      showAlign: aggregateShowFlag(allProps, p => p.text.showAlign),
    };

    // 聚合 line 字段（仅当所有元素都是 line 类型时才有意义）
    const allLine = allProps.every(p => p.type === 'line');
    const line = allLine ? {
      end: allProps[0].line!.end,
      label: aggregateStringField(allProps, p => p.line?.label || '', 'label', mixedFields),
      labelColor: aggregateStringField(allProps, p => p.line?.labelColor || '', 'c', mixedFields),
      style: aggregateStringField(allProps, p => p.line?.style || '', 'style', mixedFields),
    } : undefined;

    // 聚合 shadow attrs
    const shadowAttrs: Record<string, string> = {};
    const shadowKeys = ['shadow-enabled', 'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color'];
    for (const key of shadowKeys) {
      const values = allProps.map(p => p.attrs[key] || '');
      const first = values[0];
      if (values.every(v => v === first)) {
        if (first) shadowAttrs[key] = first;
      } else {
        mixedFields.add(key);
      }
    }

    // 合并 attrs（用于 ShadowEditor）
    const mergedAttrs: Record<string, string> = { ...shadowAttrs };

    return {
      props: {
        type: allProps[0].type,
        attrs: mergedAttrs,
        position: { x: 0, y: 0 },
        size,
        appearance,
        text,
        line,
        table: undefined,
        image: undefined,
        note: '',
      },
      mixedFields,
    };
  }, [elements]);
}
