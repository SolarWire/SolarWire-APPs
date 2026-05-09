import { describe, it, expect } from 'vitest';
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
} from '../lib/renderer/context';

const defaultGlobalDefaults = {};

describe('getShadowAttribute', () => {
  it('无阴影属性返回 null', () => {
    expect(getShadowAttribute({}, defaultGlobalDefaults)).toBeNull();
  });

  it('只有 shadow-enabled 返回阴影配置', () => {
    const result = getShadowAttribute({ 'shadow-enabled': 'true' }, defaultGlobalDefaults);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(0);
    expect(result!.y).toBe(0);
    expect(result!.blur).toBe(3);
    expect(result!.color).toBe('#000000');
  });

  it('shadow-x/y/blur 全为 0 返回 null', () => {
    expect(getShadowAttribute({ 'shadow-x': '0', 'shadow-y': '0', 'shadow-blur': '0' }, defaultGlobalDefaults)).toBeNull();
  });

  it('有 shadow-x 返回阴影配置', () => {
    const result = getShadowAttribute({ 'shadow-x': '5' }, defaultGlobalDefaults);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(5);
  });

  it('有 shadow-enabled + 自定义值', () => {
    const result = getShadowAttribute({
      'shadow-enabled': 'true',
      'shadow-x': '2',
      'shadow-y': '3',
      'shadow-blur': '5',
      'shadow-color': '#FF0000',
    }, defaultGlobalDefaults);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(2);
    expect(result!.y).toBe(3);
    expect(result!.blur).toBe(5);
    expect(result!.color).toBe('#FF0000');
  });

  it('shadow-enabled 但 blur=0 且 x=0 y=0 返回 null', () => {
    const result = getShadowAttribute({
      'shadow-enabled': 'true',
      'shadow-x': '0',
      'shadow-y': '0',
      'shadow-blur': '0',
    }, defaultGlobalDefaults);
    expect(result).toBeNull();
  });
});

describe('getAlignAttribute', () => {
  it('无 align 返回默认值', () => {
    expect(getAlignAttribute({}, 'start')).toBe('start');
    expect(getAlignAttribute({}, 'middle')).toBe('middle');
  });

  it('align=l 返回 start', () => {
    expect(getAlignAttribute({ align: 'l' }, 'start')).toBe('start');
  });

  it('align=c 返回 middle', () => {
    expect(getAlignAttribute({ align: 'c' }, 'start')).toBe('middle');
  });

  it('align=r 返回 end', () => {
    expect(getAlignAttribute({ align: 'r' }, 'start')).toBe('end');
  });
});

describe('getTextDecorationAttribute', () => {
  it('无 text-decoration 返回 none', () => {
    expect(getTextDecorationAttribute({})).toBe('none');
  });

  it('text-decoration=underline 返回 underline', () => {
    expect(getTextDecorationAttribute({ 'text-decoration': 'underline' })).toBe('underline');
  });

  it('text-decoration=line-through 返回 line-through', () => {
    expect(getTextDecorationAttribute({ 'text-decoration': 'line-through' })).toBe('line-through');
  });
});

describe('getVerticalAlignAttribute', () => {
  it('无 vertical-align 返回默认值', () => {
    expect(getVerticalAlignAttribute({}, 'top')).toBe('top');
    expect(getVerticalAlignAttribute({}, 'middle')).toBe('middle');
  });

  it('vertical-align=t 返回 top', () => {
    expect(getVerticalAlignAttribute({ 'vertical-align': 't' }, 'top')).toBe('top');
  });

  it('vertical-align=m 返回 middle', () => {
    expect(getVerticalAlignAttribute({ 'vertical-align': 'm' }, 'top')).toBe('middle');
  });

  it('vertical-align=b 返回 bottom', () => {
    expect(getVerticalAlignAttribute({ 'vertical-align': 'b' }, 'top')).toBe('bottom');
  });
});

describe('getOpacityAttribute', () => {
  it('无 opacity 返回 1', () => {
    expect(getOpacityAttribute({})).toBe(1);
  });

  it('opacity=0.5', () => {
    expect(getOpacityAttribute({ opacity: '0.5' })).toBe(0.5);
  });

  it('opacity=0', () => {
    expect(getOpacityAttribute({ opacity: '0' })).toBe(0);
  });
});

describe('getPaddingValues', () => {
  it('无 padding 返回全 0', () => {
    const result = getPaddingValues({}, defaultGlobalDefaults, 0);
    expect(result.top).toBe(0);
    expect(result.right).toBe(0);
    expect(result.bottom).toBe(0);
    expect(result.left).toBe(0);
  });

  it('四向 padding', () => {
    const result = getPaddingValues({
      'padding-top': '10',
      'padding-right': '5',
      'padding-bottom': '10',
      'padding-left': '5',
    }, defaultGlobalDefaults, 0);
    expect(result.top).toBe(10);
    expect(result.right).toBe(5);
    expect(result.bottom).toBe(10);
    expect(result.left).toBe(5);
  });
});

describe('getNumberAttribute', () => {
  it('无属性返回默认值', () => {
    expect(getNumberAttribute({}, defaultGlobalDefaults, 'w', 100)).toBe(100);
  });

  it('有属性返回解析值', () => {
    expect(getNumberAttribute({ w: '200' }, defaultGlobalDefaults, 'w', 100)).toBe(200);
  });

  it('非法值返回默认值', () => {
    expect(getNumberAttribute({ w: 'abc' }, defaultGlobalDefaults, 'w', 100)).toBe(100);
  });
});

describe('getColorAttribute', () => {
  it('无属性返回默认值', () => {
    expect(getColorAttribute({}, defaultGlobalDefaults, 'bg', '#ffffff')).toBe('#ffffff');
  });

  it('有属性返回颜色值', () => {
    expect(getColorAttribute({ bg: '#FF0000' }, defaultGlobalDefaults, 'bg', '#ffffff')).toBe('#FF0000');
  });
});

describe('getBooleanAttribute', () => {
  it('无属性返回 false', () => {
    expect(getBooleanAttribute({}, defaultGlobalDefaults, 'bold')).toBe(false);
  });

  it('bold=true 返回 true', () => {
    expect(getBooleanAttribute({ bold: 'true' }, defaultGlobalDefaults, 'bold')).toBe(true);
  });

  it('bold 存在（无值）返回 true', () => {
    expect(getBooleanAttribute({ bold: '' }, defaultGlobalDefaults, 'bold')).toBe(true);
  });
});
