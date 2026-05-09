import { describe, it, expect } from 'vitest';
import {
  updateLineAttribute,
  deleteLineAttribute,
  updateLineCoords,
} from '../shared/utils/attribute-updater';
import {
  getShadowAttribute,
  getAlignAttribute,
  getTextDecorationAttribute,
  getOpacityAttribute,
  getVerticalAlignAttribute,
  getPaddingValues,
  getNumberAttribute,
  getColorAttribute,
  getBooleanAttribute,
  getStyleAttribute,
  getLetterSpacingAttribute,
  calculateCoordinate,
  calculatePosition,
  calculateLineEnd,
  createRenderContext,
  createChildContext,
  escapeHtml,
  formatRenderError,
  getElementLocationInfo,
  generateShadowFilter,
} from '../lib/renderer/context';
import {
  detectTableBounds,
  detectNoteBounds,
  detectMultilineTextBounds,
  detectElementBounds,
  getElementStartLine,
  isInsideMultilineNoteContent,
  ElementType,
} from '../shared/utils/element-bounds';
import {
  createDefaultTableSource,
  ensureTableHasRows,
} from '../shared/utils/table-source-utils';
import { PROPERTY_META } from '../app/components/editor/property/propertyMeta';

const gd = {};

describe('attribute-updater 边缘场景', () => {
  describe('坐标边界', () => {
    it('负坐标 x', () => {
      const src = '["btn"] @(10, 20) w=100';
      expect(updateLineAttribute(src, 1, 'x', -50)).toBe('["btn"] @(-50, 20) w=100');
    });

    it('负坐标 y', () => {
      const src = '["btn"] @(10, 20) w=100';
      expect(updateLineAttribute(src, 1, 'y', -30)).toBe('["btn"] @(10, -30) w=100');
    });

    it('坐标为 0', () => {
      const src = '["btn"] @(10, 20) w=100';
      expect(updateLineAttribute(src, 1, 'x', 0)).toBe('["btn"] @(0, 20) w=100');
    });

    it('line: 无起点坐标添加 x2 返回原内容（需要先有起点）', () => {
      const src = '--';
      const result = updateLineAttribute(src, 1, 'x2', 100);
      expect(result).toBe(src);
    });

    it('line: 无起点也无终点添加 y2 返回原内容', () => {
      const src = '--';
      const result = updateLineAttribute(src, 1, 'y2', 50);
      expect(result).toBe(src);
    });
  });

  describe('文本属性边界', () => {
    it('空文本设置 text', () => {
      const src = '"" @(10, 20)';
      expect(updateLineAttribute(src, 1, 'text', 'Hello')).toBe('"Hello" @(10, 20)');
    });

    it('文本含特殊字符', () => {
      const src = '["old"] @(10, 20)';
      const result = updateLineAttribute(src, 1, 'text', '<script>');
      expect(result).toContain('<script>');
    });

    it('multiline text: 单行三引号文本修改', () => {
      const src = '"""hello""" @(10, 20)';
      const result = updateLineAttribute(src, 1, 'text', 'world');
      expect(result).toContain('world');
    });
  });

  describe('布尔属性边界', () => {
    it('shadow-enabled 设为 true 字符串', () => {
      const src = '[] @(10, 20)';
      const result = updateLineAttribute(src, 1, 'shadow-enabled', 'true');
      expect(result).toContain('shadow-enabled');
    });

    it('bold 已存在时重复设为 true 不重复添加', () => {
      const src = '[] @(10, 20) bold';
      const result = updateLineAttribute(src, 1, 'bold', true);
      expect(result.match(/bold/g)?.length).toBe(1);
    });

    it('italic 已存在时重复设为 true 不重复添加', () => {
      const src = '[] @(10, 20) italic';
      const result = updateLineAttribute(src, 1, 'italic', true);
      expect(result.match(/italic/g)?.length).toBe(1);
    });

    it('shadow-enabled 已存在时重复设为 true 不重复添加', () => {
      const src = '[] @(10, 20) shadow-enabled';
      const result = updateLineAttribute(src, 1, 'shadow-enabled', true);
      expect(result.match(/shadow-enabled/g)?.length).toBe(1);
    });
  });

  describe('简单属性边界', () => {
    it('替换已有 opacity', () => {
      const src = '[] @(10, 20) opacity=0.5';
      expect(updateLineAttribute(src, 1, 'opacity', 0.8)).toBe('[] @(10, 20) opacity=0.8');
    });

    it('替换已有 align', () => {
      const src = '[] @(10, 20) align=l';
      expect(updateLineAttribute(src, 1, 'align', 'r')).toBe('[] @(10, 20) align=r');
    });

    it('替换已有 vertical-align', () => {
      const src = '[] @(10, 20) vertical-align=t';
      expect(updateLineAttribute(src, 1, 'vertical-align', 'b')).toBe('[] @(10, 20) vertical-align=b');
    });

    it('新增 line-height', () => {
      const src = '[] @(10, 20)';
      expect(updateLineAttribute(src, 1, 'line-height', 22)).toBe('[] @(10, 20) line-height=22');
    });

    it('新增 letter-spacing', () => {
      const src = '[] @(10, 20)';
      expect(updateLineAttribute(src, 1, 'letter-spacing', 1)).toBe('[] @(10, 20) letter-spacing=1');
    });

    it('新增 padding', () => {
      const src = '[] @(10, 20)';
      expect(updateLineAttribute(src, 1, 'padding', 8)).toBe('[] @(10, 20) padding=8');
    });

    it('新增 padding-top', () => {
      const src = '[] @(10, 20)';
      expect(updateLineAttribute(src, 1, 'padding-top', 4)).toBe('[] @(10, 20) padding-top=4');
    });
  });

  describe('deleteLineAttribute 边界', () => {
    it('删除不存在的属性不改变内容', () => {
      const src = '[] @(10, 20) w=100';
      expect(deleteLineAttribute(src, 1, 'bold')).toBe(src);
    });

    it('删除 opacity', () => {
      const src = '[] @(10, 20) opacity=0.5';
      const result = deleteLineAttribute(src, 1, 'opacity');
      expect(result).not.toContain('opacity');
    });

    it('删除 align', () => {
      const src = '[] @(10, 20) align=c';
      const result = deleteLineAttribute(src, 1, 'align');
      expect(result).not.toContain('align');
    });

    it('删除 line-height', () => {
      const src = '[] @(10, 20) line-height=22';
      const result = deleteLineAttribute(src, 1, 'line-height');
      expect(result).not.toContain('line-height');
    });

    it('行号超出范围不改变内容', () => {
      const src = '[] @(10, 20) w=100';
      expect(deleteLineAttribute(src, 0, 'w')).toBe(src);
      expect(deleteLineAttribute(src, 5, 'w')).toBe(src);
    });
  });

  describe('updateLineCoords 边界', () => {
    it('行号超出范围不改变内容', () => {
      const src = '-- @(0, 0)->(100, 50)';
      expect(updateLineCoords(src, 0, 10, 20, 200, 80)).toBe(src);
      expect(updateLineCoords(src, 5, 10, 20, 200, 80)).toBe(src);
    });

    it('负坐标', () => {
      const src = '-- @(0, 0)->(100, 50)';
      expect(updateLineCoords(src, 1, -10, -20, -100, -50)).toBe('-- @(-10, -20)->(-100, -50)');
    });
  });

  describe('Note 属性边界', () => {
    it('替换单引号 note', () => {
      const src = "[] @(10, 20) note='old note'";
      const result = updateLineAttribute(src, 1, 'note', 'new');
      expect(result).toContain('note="""new"""');
      expect(result).not.toContain("note='old note'");
    });

    it('替换跨行三引号 note', () => {
      const src = '[] @(10, 20) note="""line1\nline2"""';
      const result = updateLineAttribute(src, 1, 'note', 'replaced');
      expect(result).toContain('note="""replaced"""');
      expect(result).not.toContain('line1');
    });

    it('新增 note 到有其他属性的元素', () => {
      const src = '[] @(10, 20) w=100 h=40';
      const result = updateLineAttribute(src, 1, 'note', 'test');
      expect(result).toContain('note="""test"""');
      expect(result).toContain('w=100');
      expect(result).toContain('h=40');
    });
  });
});

describe('renderer-context 边缘场景', () => {
  describe('getOpacityAttribute 边界', () => {
    it('opacity > 1 被裁剪为 1', () => {
      expect(getOpacityAttribute({ opacity: '2' })).toBe(1);
    });

    it('opacity < 0 被裁剪为 0', () => {
      expect(getOpacityAttribute({ opacity: '-1' })).toBe(0);
    });

    it('opacity 非法值返回默认值', () => {
      expect(getOpacityAttribute({ opacity: 'abc' })).toBe(1);
    });

    it('自定义默认值', () => {
      expect(getOpacityAttribute({}, 'opacity', 0.5)).toBe(0.5);
    });
  });

  describe('getNumberAttribute 边界', () => {
    it('globalDefaults 优先于默认值', () => {
      expect(getNumberAttribute({}, { w: 200 }, 'w', 100)).toBe(200);
    });

    it('local 属性优先于 globalDefaults', () => {
      expect(getNumberAttribute({ w: '300' }, { w: 200 }, 'w', 100)).toBe(300);
    });

    it('空字符串属性返回默认值', () => {
      expect(getNumberAttribute({ w: '' }, gd, 'w', 100)).toBe(100);
    });
  });

  describe('getColorAttribute 边界', () => {
    it('globalDefaults 颜色', () => {
      expect(getColorAttribute({}, { c: '#FF0000' }, 'c', '#000')).toBe('#FF0000');
    });

    it('local 颜色优先于 globalDefaults', () => {
      expect(getColorAttribute({ c: '#00FF00' }, { c: '#FF0000' }, 'c', '#000')).toBe('#00FF00');
    });
  });

  describe('getBooleanAttribute 边界', () => {
    it('globalDefaults bold=true', () => {
      expect(getBooleanAttribute({}, { bold: true }, 'bold')).toBe(true);
    });

    it('globalDefaults bold=false', () => {
      expect(getBooleanAttribute({}, { bold: false }, 'bold')).toBe(false);
    });
  });

  describe('getStyleAttribute', () => {
    it('无 style 返回空对象', () => {
      expect(getStyleAttribute({})).toEqual({});
    });

    it('style=dashed 返回虚线', () => {
      expect(getStyleAttribute({ style: 'dashed' })).toEqual({ strokeDasharray: '5,5' });
    });

    it('style=dotted 返回点线', () => {
      expect(getStyleAttribute({ style: 'dotted' })).toEqual({ strokeDasharray: '2,2' });
    });

    it('style=solid 返回空对象', () => {
      expect(getStyleAttribute({ style: 'solid' })).toEqual({});
    });
  });

  describe('getLetterSpacingAttribute', () => {
    it('无属性返回默认值 0', () => {
      expect(getLetterSpacingAttribute({}, gd)).toBe(0);
    });

    it('有属性返回解析值', () => {
      expect(getLetterSpacingAttribute({ 'letter-spacing': '2' }, gd)).toBe(2);
    });

    it('globalDefaults 优先', () => {
      expect(getLetterSpacingAttribute({}, { 'letter-spacing': 3 })).toBe(3);
    });
  });

  describe('calculateCoordinate', () => {
    const ctx = createRenderContext();
    const lastBounds = { x: 100, y: 200, width: 50, height: 30 };

    it('absolute 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'absolute', value: 50 }, true, null)).toBe(50);
    });

    it('relative 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'relative', value: 10 }, true, null)).toBe(10);
    });

    it('edge L 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'L', value: 0 }, true, lastBounds)).toBe(100);
    });

    it('edge R 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'R', value: 0 }, true, lastBounds)).toBe(150);
    });

    it('edge T 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'T', value: 0 }, false, lastBounds)).toBe(200);
    });

    it('edge B 坐标', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'B', value: 0 }, false, lastBounds)).toBe(230);
    });

    it('edge C 坐标（水平）', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'C', value: 0 }, true, lastBounds)).toBe(125);
    });

    it('edge C 坐标（垂直）', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'C', value: 0 }, false, lastBounds)).toBe(215);
    });

    it('edge 无 lastBounds 返回 0', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'L', value: 0 }, true, null)).toBe(0);
    });

    it('edge 有偏移', () => {
      expect(calculateCoordinate(ctx, { type: 'edge', direction: 'R', value: 10 }, true, lastBounds)).toBe(160);
    });
  });

  describe('calculatePosition', () => {
    it('计算绝对位置', () => {
      const ctx = createRenderContext();
      const pos = calculatePosition(ctx, {
        x: { type: 'absolute', value: 10 },
        y: { type: 'absolute', value: 20 },
      });
      expect(pos).toEqual({ x: 10, y: 20 });
    });
  });

  describe('calculateLineEnd', () => {
    it('相对终点', () => {
      const ctx = createRenderContext();
      const start = { x: 10, y: 20 };
      const end = calculateLineEnd(ctx, start, { dx: 100, dy: 50 });
      expect(end).toEqual({ x: 110, y: 70 });
    });

    it('绝对终点', () => {
      const ctx = createRenderContext();
      const start = { x: 10, y: 20 };
      const end = calculateLineEnd(ctx, start, {
        x: { type: 'absolute', value: 200 },
        y: { type: 'absolute', value: 300 },
      });
      expect(end).toEqual({ x: 200, y: 300 });
    });
  });

  describe('createRenderContext', () => {
    it('无声明创建默认上下文', () => {
      const ctx = createRenderContext();
      expect(ctx.offsetX).toBe(0);
      expect(ctx.offsetY).toBe(0);
      expect(ctx.isFirstElement).toBe(true);
      expect(ctx.lastElementBounds).toBeNull();
    });

    it('有声明解析全局默认值', () => {
      const ctx = createRenderContext([
        { key: 'size', value: '16' },
        { key: 'bold', value: 'true' },
        { key: 'c', value: '#FF0000' },
      ]);
      expect(ctx.globalDefaults.size).toBe(16);
      expect(ctx.globalDefaults.bold).toBe(true);
      expect(ctx.globalDefaults.c).toBe('#FF0000');
    });
  });

  describe('createChildContext', () => {
    it('子上下文继承全局默认值', () => {
      const parent = createRenderContext([{ key: 'size', value: '14' }]);
      const child = createChildContext(parent, 10, 20);
      expect(child.offsetX).toBe(10);
      expect(child.offsetY).toBe(20);
      expect(child.globalDefaults.size).toBe(14);
      expect(child.isFirstElement).toBe(true);
    });
  });

  describe('escapeHtml', () => {
    it('转义 HTML 特殊字符', () => {
      expect(escapeHtml('<div>&"\'')).toBe('&lt;div&gt;&amp;&quot;&#039;');
    });

    it('无特殊字符不改变', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('空字符串', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('formatRenderError', () => {
    it('无源码输入', () => {
      const result = formatRenderError({ title: 'Test Error' }, undefined, undefined);
      expect(result).toContain('RENDER ERROR');
      expect(result).toContain('Test Error');
    });

    it('完整错误信息', () => {
      const result = formatRenderError(
        { title: 'Parse Error', expected: 'element', found: 'EOF', reason: 'Unexpected end', solution: 'Add element' },
        'line1\nline2\nline3',
        { line: 2, column: 5 }
      );
      expect(result).toContain('Parse Error');
      expect(result).toContain('Expected: element');
      expect(result).toContain('Found:    EOF');
      expect(result).toContain('Reason: Unexpected end');
      expect(result).toContain('Solution: Add element');
    });
  });

  describe('getElementLocationInfo', () => {
    it('有 location 返回行号', () => {
      expect(getElementLocationInfo({ location: { line: 5 } } as any)).toBe('line 5');
    });

    it('有 coordinates 返回坐标', () => {
      expect(getElementLocationInfo({
        coordinates: { x: { type: 'absolute', value: 10 }, y: { type: 'absolute', value: 20 } }
      } as any)).toBe('@(10, 20)');
    });

    it('无 location 和 coordinates 返回 unknown', () => {
      expect(getElementLocationInfo({} as any)).toBe('unknown position');
    });
  });

  describe('generateShadowFilter', () => {
    it('生成 SVG 阴影滤镜', () => {
      const result = generateShadowFilter({ x: 2, y: 3, blur: 5, color: '#FF0000' }, 'test-1');
      expect(result).toContain('filter id="shadow-test-1"');
      expect(result).toContain('dx="2"');
      expect(result).toContain('dy="3"');
      expect(result).toContain('stdDeviation="5"');
      expect(result).toContain('flood-color="#FF0000"');
    });
  });

  describe('getShadowAttribute 边界', () => {
    it('globalDefaults 中的阴影属性', () => {
      const result = getShadowAttribute(
        { 'shadow-enabled': 'true' },
        { 'shadow-x': 5, 'shadow-y': 5 }
      );
      expect(result).not.toBeNull();
      expect(result!.x).toBe(5);
      expect(result!.y).toBe(5);
    });

    it('只有 shadow-x 没有 shadow-enabled', () => {
      const result = getShadowAttribute({ 'shadow-x': '5' }, gd);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(5);
    });

    it('shadow-enabled 但所有值为 0', () => {
      const result = getShadowAttribute({
        'shadow-enabled': 'true',
        'shadow-x': '0',
        'shadow-y': '0',
        'shadow-blur': '0',
      }, gd);
      expect(result).toBeNull();
    });
  });

  describe('getAlignAttribute 边界', () => {
    it('无效 align 值返回默认', () => {
      expect(getAlignAttribute({ align: 'x' }, 'start')).toBe('start');
    });
  });

  describe('getTextDecorationAttribute 边界', () => {
    it('无效 text-decoration 值返回 none', () => {
      expect(getTextDecorationAttribute({ 'text-decoration': 'invalid' })).toBe('none');
    });
  });

  describe('getVerticalAlignAttribute 边界', () => {
    it('无效 vertical-align 值返回默认', () => {
      expect(getVerticalAlignAttribute({ 'vertical-align': 'x' }, 'top')).toBe('top');
    });

    it('默认值为 bottom', () => {
      expect(getVerticalAlignAttribute({}, 'bottom')).toBe('bottom');
    });
  });

  describe('getPaddingValues 边界', () => {
    it('globalDefaults 中的 padding', () => {
      const result = getPaddingValues({}, { 'padding-top': 10 }, 0);
      expect(result.top).toBe(10);
    });

    it('部分 padding 属性', () => {
      const result = getPaddingValues({ 'padding-top': '5' }, gd, 0);
      expect(result.top).toBe(5);
      expect(result.right).toBe(0);
      expect(result.bottom).toBe(0);
      expect(result.left).toBe(0);
    });
  });
});

describe('element-bounds 边缘场景', () => {
  describe('detectTableBounds 边界', () => {
    it('表格后跟空行和元素', () => {
      const content = '## @(0, 0) w=600\n  #\n    "A"\n\n["btn"] @(10, 20)';
      const { startLine, endLine } = detectTableBounds(content, 1);
      expect(startLine).toBe(1);
      expect(endLine).toBe(4);
    });

    it('表格后跟多个空行', () => {
      const content = '## @(0, 0) w=600\n  #\n    "A"\n\n\n["btn"] @(10, 20)';
      const { startLine, endLine } = detectTableBounds(content, 1);
      expect(startLine).toBe(1);
      expect(endLine).toBe(5);
    });

    it('表格末尾有空行', () => {
      const content = '## @(0, 0) w=600\n  #\n    "A"\n';
      const { startLine, endLine } = detectTableBounds(content, 1);
      expect(startLine).toBe(1);
      expect(endLine).toBe(3);
    });

    it('单行表格声明', () => {
      const content = '## @(0, 0) w=600';
      const { startLine, endLine } = detectTableBounds(content, 1);
      expect(startLine).toBe(1);
      expect(endLine).toBe(1);
    });
  });

  describe('detectNoteBounds 边界', () => {
    it('无 note 返回自身', () => {
      const content = '["btn"] @(10, 20) w=100';
      const result = detectNoteBounds(content, 1);
      expect(result).toEqual({ startLine: 1, endLine: 1 });
    });

    it('跨行双引号 note', () => {
      const content = '["btn"] note="line1\nline2"';
      const result = detectNoteBounds(content, 1);
      expect(result.endLine).toBe(2);
    });

    it('跨行单引号 note', () => {
      const content = "['btn'] note='line1\nline2'";
      const result = detectNoteBounds(content, 1);
      expect(result.endLine).toBe(2);
    });
  });

  describe('detectMultilineTextBounds 边界', () => {
    it('非三引号行返回自身', () => {
      const content = '["btn"] @(10, 20)';
      const result = detectMultilineTextBounds(content, 1);
      expect(result).toEqual({ startLine: 1, endLine: 1 });
    });

    it('行号超出范围', () => {
      const content = '"""text"""';
      const result = detectMultilineTextBounds(content, 5);
      expect(result).toEqual({ startLine: 5, endLine: 5 });
    });
  });

  describe('detectElementBounds 边界', () => {
    it('空内容超出范围', () => {
      const result = detectElementBounds('', 1);
      expect(result.type).toBe(ElementType.Simple);
    });

    it('表格元素含 note', () => {
      const content = '## @(0, 0) w=600 note="""table note"""';
      const bounds = detectElementBounds(content, 1);
      expect(bounds.type).toBe(ElementType.Table);
    });
  });

  describe('isInsideMultilineNoteContent', () => {
    it('不在多行 note 中', () => {
      expect(isInsideMultilineNoteContent(['["btn"] @(10, 20)'], 0)).toBe(false);
    });

    it('在多行 note 内容中', () => {
      const lines = ['["btn"] note="""start', 'middle line', 'end"""'];
      expect(isInsideMultilineNoteContent(lines, 1)).toBe(true);
    });

    it('不在 note 开始行', () => {
      const lines = ['["btn"] note="""start"""'];
      expect(isInsideMultilineNoteContent(lines, 0)).toBe(false);
    });

    it('行号超出范围', () => {
      expect(isInsideMultilineNoteContent([], 0)).toBe(false);
      expect(isInsideMultilineNoteContent(['text'], -1)).toBe(false);
      expect(isInsideMultilineNoteContent(['text'], 5)).toBe(false);
    });
  });

  describe('getElementStartLine 边界', () => {
    it('含 note 的元素', () => {
      const content = '["btn"] @(10, 20) note="""test"""';
      expect(getElementStartLine(content, 1)).toBe(1);
    });
  });
});

describe('table-source-utils 边缘场景', () => {
  describe('createDefaultTableSource', () => {
    it('生成 3x3 默认表格', () => {
      const src = createDefaultTableSource();
      const lines = src.split('\n');
      expect(lines[0]).toContain('## @');
      expect(lines.filter(l => l.trim() === '#').length).toBe(3);
      expect(lines.filter(l => l.trim() === '""').length).toBe(9);
    });
  });

  describe('ensureTableHasRows', () => {
    it('已有行的表格不修改', () => {
      const src = '## @(0, 0) w=600\n  #\n    "A"';
      expect(ensureTableHasRows(src)).toBe(src);
    });

    it('无行的表格添加默认行', () => {
      const src = '## @(0, 0) w=600';
      const result = ensureTableHasRows(src);
      expect(result).toContain('  #');
      expect(result).toContain('    ""');
    });

    it('多表格只补充缺失行的', () => {
      const src = '## @(0, 0) w=600\n  #\n    "A"\n## @(100, 0) w=400';
      const result = ensureTableHasRows(src);
      const lines = result.split('\n');
      expect(lines.filter(l => l.trim() === '#').length).toBeGreaterThan(1);
    });

    it('空代码不崩溃', () => {
      expect(() => ensureTableHasRows('')).not.toThrow();
    });
  });
});

describe('propertyMeta 完整性', () => {
  it('所有属性都有 zhName', () => {
    for (const [key, meta] of Object.entries(PROPERTY_META)) {
      expect(meta.zhName, `属性 ${key} 缺少 zhName`).toBeTruthy();
    }
  });

  it('所有属性都有 zhDescription', () => {
    for (const [key, meta] of Object.entries(PROPERTY_META)) {
      expect(meta.zhDescription, `属性 ${key} 缺少 zhDescription`).toBeTruthy();
      expect(meta.zhDescription.length, `属性 ${key} 的 zhDescription 太短`).toBeGreaterThan(10);
    }
  });

  it('所有属性都有 codeAttr', () => {
    for (const [key, meta] of Object.entries(PROPERTY_META)) {
      expect(meta.codeAttr, `属性 ${key} 缺少 codeAttr`).toBeTruthy();
    }
  });

  it('所有属性都有 supportedTypes', () => {
    for (const [key, meta] of Object.entries(PROPERTY_META)) {
      expect(meta.supportedTypes.length, `属性 ${key} 缺少 supportedTypes`).toBeGreaterThan(0);
    }
  });

  it('关键属性都存在', () => {
    const requiredAttrs = ['x', 'y', 'w', 'h', 'bg', 'b', 's', 'c', 'size', 'r', 'opacity', 'align', 'vertical-align', 'bold', 'italic', 'shadow-enabled', 'shadow-x', 'shadow-y', 'shadow-blur', 'shadow-color'];
    for (const attr of requiredAttrs) {
      expect(PROPERTY_META[attr], `缺少关键属性 ${attr}`).toBeDefined();
    }
  });

  it('表格属性都存在', () => {
    const tableAttrs = ['border', 'cellspacing', 'colspan', 'rowspan', 'pt', 'pr', 'pb', 'pl'];
    for (const attr of tableAttrs) {
      expect(PROPERTY_META[attr], `缺少表格属性 ${attr}`).toBeDefined();
    }
  });

  it('线段属性都存在', () => {
    const lineAttrs = ['x2', 'y2', 'style', 'label', 'text-color'];
    for (const attr of lineAttrs) {
      expect(PROPERTY_META[attr], `缺少线段属性 ${attr}`).toBeDefined();
    }
  });
});
