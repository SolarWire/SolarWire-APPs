import { describe, it, expect } from 'vitest';
import {
  updateLineAttribute,
  deleteLineAttribute,
  updateLineCoords,
} from '../shared/utils/attribute-updater';

describe('updateLineAttribute - 坐标属性', () => {
  describe('x/y 坐标更新', () => {
    it('rectangle: 有坐标替换 x', () => {
      const src = '["按钮"] @(10, 20) w=100 h=40';
      expect(updateLineAttribute(src, 1, 'x', 50)).toBe('["按钮"] @(50, 20) w=100 h=40');
    });

    it('rectangle: 有坐标替换 y', () => {
      const src = '["按钮"] @(10, 20) w=100 h=40';
      expect(updateLineAttribute(src, 1, 'y', 80)).toBe('["按钮"] @(10, 80) w=100 h=40');
    });

    it('rectangle: 无坐标新增 x', () => {
      const src = '["按钮"] w=100 h=40';
      const result = updateLineAttribute(src, 1, 'x', 120);
      expect(result).toContain('@(120, 0)');
    });

    it('rectangle: 无坐标新增 y', () => {
      const src = '["按钮"] w=100 h=40';
      const result = updateLineAttribute(src, 1, 'y', 40);
      expect(result).toContain('@(40, 0)');
    });

    it('circle: 有坐标替换 x', () => {
      const src = '("OK") @(10, 20) w=50 h=50';
      expect(updateLineAttribute(src, 1, 'x', 30)).toBe('("OK") @(30, 20) w=50 h=50');
    });

    it('circle: 无坐标新增 x', () => {
      const src = '("text")';
      const result = updateLineAttribute(src, 1, 'x', 100);
      expect(result).toContain('@(100, 0)');
    });

    it('text: 有坐标替换 x', () => {
      const src = '"Hello" @(10, 20)';
      expect(updateLineAttribute(src, 1, 'x', 50)).toBe('"Hello" @(50, 20)');
    });

    it('text: 无坐标新增 x', () => {
      const src = '"Hello"';
      const result = updateLineAttribute(src, 1, 'x', 100);
      expect(result).toContain('@(100, 0)');
    });

    it('placeholder: 有坐标替换 x', () => {
      const src = '[?"Image"] @(10, 20)';
      expect(updateLineAttribute(src, 1, 'x', 50)).toBe('[?"Image"] @(50, 20)');
    });

    it('table: 有坐标替换 x', () => {
      const src = '## @(10, 20) w=600';
      expect(updateLineAttribute(src, 1, 'x', 50)).toBe('## @(50, 20) w=600');
    });

    it('table: 无坐标新增 x', () => {
      const src = '## w=600';
      const result = updateLineAttribute(src, 1, 'x', 100);
      expect(result).toContain('@(100, 0)');
    });
  });

  describe('x2/y2 终点坐标更新', () => {
    it('line: 有终点替换 x2', () => {
      const src = '-- @(0, 0)->(100, 50)';
      expect(updateLineAttribute(src, 1, 'x2', 200)).toBe('-- @(0, 0)->(200, 50)');
    });

    it('line: 有终点替换 y2', () => {
      const src = '-- @(0, 0)->(100, 50)';
      expect(updateLineAttribute(src, 1, 'y2', 80)).toBe('-- @(0, 0)->(100, 80)');
    });

    it('line: 无终点新增 x2', () => {
      const src = '-- @(0, 0)';
      const result = updateLineAttribute(src, 1, 'x2', 100);
      expect(result).toContain('->(100, 0)');
    });

    it('line: 负值坐标', () => {
      const src = '-- @(0, 0)->(-50, -30)';
      expect(updateLineAttribute(src, 1, 'x2', 50)).toBe('-- @(0, 0)->(50, -30)');
    });
  });
});

describe('updateLineAttribute - 文本属性', () => {
  it('rectangle: 修改文本', () => {
    const src = '["old"] w=50';
    expect(updateLineAttribute(src, 1, 'text', 'new')).toBe('["new"] w=50');
  });

  it('rectangle: 空矩形添加文本', () => {
    const src = '[] w=50';
    expect(updateLineAttribute(src, 1, 'text', 'Hello')).toBe('["Hello"] w=50');
  });

  it('circle: 修改文本', () => {
    const src = '("old") w=50';
    expect(updateLineAttribute(src, 1, 'text', 'new')).toBe('("new") w=50');
  });

  it('circle: 空圆添加文本', () => {
    const src = '() w=50';
    expect(updateLineAttribute(src, 1, 'text', 'Hello')).toBe('("Hello") w=50');
  });

  it('placeholder: 修改文本', () => {
    const src = '[?"old"] w=50';
    expect(updateLineAttribute(src, 1, 'text', 'new')).toBe('[?"new"] w=50');
  });

  it('placeholder: 空占位添加文本', () => {
    const src = '[?] w=50';
    expect(updateLineAttribute(src, 1, 'text', 'Image')).toBe('[?"Image"] w=50');
  });

  it('text: 修改文本', () => {
    const src = '"old"';
    expect(updateLineAttribute(src, 1, 'text', 'new')).toBe('"new"');
  });

  it('text: 带属性修改文本', () => {
    const src = '"old" @(10, 20) w=100';
    expect(updateLineAttribute(src, 1, 'text', 'new')).toBe('"new" @(10, 20) w=100');
  });
});

describe('updateLineAttribute - 布尔属性', () => {
  it('新增 bold', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'bold', true)).toBe('[] @(10, 20) bold');
  });

  it('移除 bold', () => {
    const src = '[] @(10, 20) bold';
    expect(updateLineAttribute(src, 1, 'bold', false)).toBe('[] @(10, 20)');
  });

  it('新增 italic', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'italic', true)).toBe('[] @(10, 20) italic');
  });

  it('移除 italic', () => {
    const src = '[] @(10, 20) italic';
    expect(updateLineAttribute(src, 1, 'italic', false)).toBe('[] @(10, 20)');
  });

  it('bold 在 note 前插入', () => {
    const src = '[] @(10, 20) note="""test"""';
    const result = updateLineAttribute(src, 1, 'bold', true);
    expect(result).toContain('bold');
    expect(result.indexOf('bold')).toBeLessThan(result.indexOf('note='));
  });
});

describe('updateLineAttribute - 简单属性', () => {
  it('新增 bg', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'bg', '#FF0000')).toBe('[] @(10, 20) bg=#FF0000');
  });

  it('替换 bg', () => {
    const src = '[] @(10, 20) bg=#FFF';
    expect(updateLineAttribute(src, 1, 'bg', '#000')).toBe('[] @(10, 20) bg=#000');
  });

  it('新增 w', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'w', 100)).toBe('[] @(10, 20) w=100');
  });

  it('替换 w', () => {
    const src = '[] @(10, 20) w=50';
    expect(updateLineAttribute(src, 1, 'w', 100)).toBe('[] @(10, 20) w=100');
  });

  it('新增 h', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'h', 40)).toBe('[] @(10, 20) h=40');
  });

  it('新增 r（圆角）', () => {
    const src = '[] @(10, 20) w=100 h=40';
    const result = updateLineAttribute(src, 1, 'r', 8);
    expect(result).toContain('r=8');
  });

  it('新增 c（文字色）', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'c', '#333')).toBe('[] @(10, 20) c=#333');
  });

  it('新增 size', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'size', 14)).toBe('[] @(10, 20) size=14');
  });

  it('新增 align', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'align', 'c')).toBe('[] @(10, 20) align=c');
  });

  it('新增 opacity', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 'opacity', 0.5)).toBe('[] @(10, 20) opacity=0.5');
  });

  it('新增 s（边框宽度）', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 1, 's', 2)).toBe('[] @(10, 20) s=2');
  });

  it('属性在 note 前插入', () => {
    const src = '[] @(10, 20) note="""test"""';
    const result = updateLineAttribute(src, 1, 'bg', '#FFF');
    expect(result).toContain('bg=#FFF');
    expect(result.indexOf('bg=')).toBeLessThan(result.indexOf('note='));
  });
});

describe('updateLineAttribute - Line 专属属性', () => {
  it('新增 style', () => {
    const src = '-- @(0, 0)->(100, 50)';
    const result = updateLineAttribute(src, 1, 'style', 'dashed');
    expect(result).toContain('style=dashed');
  });

  it('替换 style', () => {
    const src = '-- @(0, 0)->(100, 50) style=dashed';
    expect(updateLineAttribute(src, 1, 'style', 'dotted')).toBe('-- @(0, 0)->(100, 50) style=dotted');
  });

  it('新增 c (文字色)', () => {
    const src = '-- @(0, 0)->(100, 50)';
    const result = updateLineAttribute(src, 1, 'c', '#FF0000');
    expect(result).toContain('c=#FF0000');
  });
});

describe('updateLineAttribute - Image 专属属性', () => {
  it('修改 url', () => {
    const src = '<./old.png> @(10, 20)';
    expect(updateLineAttribute(src, 1, 'url', './new.png')).toBe('<./new.png> @(10, 20)');
  });
});

describe('updateLineAttribute - Note 属性', () => {
  it('新增 note', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'note', 'test');
    expect(result).toContain('note="""test"""');
  });

  it('替换 note', () => {
    const src = '[] @(10, 20) note="""old"""';
    const result = updateLineAttribute(src, 1, 'note', 'new');
    expect(result).toContain('note="""new"""');
    expect(result).not.toContain('old');
  });
});

describe('updateLineAttribute - 多行文档', () => {
  it('修改第二行元素', () => {
    const src = '[] @(10, 20)\n["按钮"] @(30, 40) w=100';
    expect(updateLineAttribute(src, 2, 'w', 200)).toBe('[] @(10, 20)\n["按钮"] @(30, 40) w=200');
  });

  it('修改第三行元素', () => {
    const src = '[] @(10, 20)\n["A"] @(30, 40)\n["B"] @(50, 60) w=100';
    expect(updateLineAttribute(src, 3, 'w', 200)).toBe('[] @(10, 20)\n["A"] @(30, 40)\n["B"] @(50, 60) w=200');
  });
});

describe('updateLineAttribute - 边界情况', () => {
  it('行号超出范围（过小）', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 0, 'w', 100)).toBe(src);
  });

  it('行号超出范围（过大）', () => {
    const src = '[] @(10, 20)';
    expect(updateLineAttribute(src, 5, 'w', 100)).toBe(src);
  });

  it('空字符串', () => {
    const result = updateLineAttribute('', 1, 'w', 100);
    expect(result).toContain('w=100');
  });
});

describe('deleteLineAttribute', () => {
  it('删除 bg', () => {
    const src = '[] bg=#FFF @(10, 20)';
    const result = deleteLineAttribute(src, 1, 'bg');
    expect(result).not.toContain('bg=');
  });

  it('删除 bold', () => {
    const src = '"text" bold @(10, 20)';
    const result = deleteLineAttribute(src, 1, 'bold');
    expect(result).not.toContain('bold');
  });

  it('删除 italic', () => {
    const src = '[] @(10, 20) italic';
    const result = deleteLineAttribute(src, 1, 'italic');
    expect(result).not.toContain('italic');
  });

  it('删除 w', () => {
    const src = '[] w=100 @(10, 20)';
    const result = deleteLineAttribute(src, 1, 'w');
    expect(result).not.toContain('w=');
  });

  it('删除 s', () => {
    const src = '[] s=2 @(10, 20)';
    const result = deleteLineAttribute(src, 1, 's');
    expect(result).not.toContain('s=');
  });

  it('删除 style', () => {
    const src = '-- @(0, 0)->(100, 50) style=dashed';
    const result = deleteLineAttribute(src, 1, 'style');
    expect(result).not.toContain('style=');
  });

  it('删除 r（圆角变直角）', () => {
    const src = '[] @(10, 20) r=8';
    const result = deleteLineAttribute(src, 1, 'r');
    expect(result).not.toContain('r=');
  });

  it('删除 shadow-enabled', () => {
    const src = '[] @(10, 20) shadow-enabled shadow-x=0 shadow-y=0 shadow-blur=3 shadow-color=#000000';
    const result = deleteLineAttribute(src, 1, 'shadow-enabled');
    expect(result).not.toContain('shadow-enabled');
  });

  it('删除 shadow-x', () => {
    const src = '[] @(10, 20) shadow-x=2';
    const result = deleteLineAttribute(src, 1, 'shadow-x');
    expect(result).not.toContain('shadow-x=');
  });

  it('删除 text-decoration', () => {
    const src = '"text" @(10, 20) text-decoration=underline';
    const result = deleteLineAttribute(src, 1, 'text-decoration');
    expect(result).not.toContain('text-decoration=');
  });
});

describe('updateLineAttribute - text 元素专属属性', () => {
  it('text: 新增 bg', () => {
    const src = '"Hello" @(10, 20)';
    const result = updateLineAttribute(src, 1, 'bg', '#FF0000');
    expect(result).toContain('bg=#FF0000');
  });

  it('text: 替换 bg', () => {
    const src = '"Hello" @(10, 20) bg=#FFF';
    const result = updateLineAttribute(src, 1, 'bg', '#000');
    expect(result).toContain('bg=#000');
    expect(result).not.toContain('bg=#FFF');
  });

  it('text: 新增 align', () => {
    const src = '"Hello" @(10, 20)';
    const result = updateLineAttribute(src, 1, 'align', 'c');
    expect(result).toContain('align=c');
  });

  it('text: 替换 align', () => {
    const src = '"Hello" @(10, 20) align=l';
    const result = updateLineAttribute(src, 1, 'align', 'r');
    expect(result).toContain('align=r');
    expect(result).not.toContain('align=l');
  });

  it('text: 新增 text-decoration underline', () => {
    const src = '"Hello" @(10, 20)';
    const result = updateLineAttribute(src, 1, 'text-decoration', 'underline');
    expect(result).toContain('text-decoration=underline');
  });

  it('text: 新增 text-decoration line-through', () => {
    const src = '"Hello" @(10, 20)';
    const result = updateLineAttribute(src, 1, 'text-decoration', 'line-through');
    expect(result).toContain('text-decoration=line-through');
  });

  it('text: 替换 text-decoration', () => {
    const src = '"Hello" @(10, 20) text-decoration=underline';
    const result = updateLineAttribute(src, 1, 'text-decoration', 'line-through');
    expect(result).toContain('text-decoration=line-through');
    expect(result).not.toContain('text-decoration=underline');
  });

  it('text: 删除 text-decoration（设为 undefined）', () => {
    const src = '"Hello" @(10, 20) text-decoration=underline';
    const result = deleteLineAttribute(src, 1, 'text-decoration');
    expect(result).not.toContain('text-decoration');
  });
});

describe('updateLineAttribute - 阴影属性', () => {
  it('新增 shadow-enabled', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-enabled', true);
    expect(result).toContain('shadow-enabled');
  });

  it('移除 shadow-enabled', () => {
    const src = '[] @(10, 20) shadow-enabled';
    const result = updateLineAttribute(src, 1, 'shadow-enabled', undefined);
    expect(result).not.toContain('shadow-enabled');
  });

  it('新增 shadow-x', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-x', 0);
    expect(result).toContain('shadow-x=0');
  });

  it('新增 shadow-y', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-y', 0);
    expect(result).toContain('shadow-y=0');
  });

  it('新增 shadow-blur', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-blur', 3);
    expect(result).toContain('shadow-blur=3');
  });

  it('新增 shadow-color', () => {
    const src = '[] @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-color', '#000000');
    expect(result).toContain('shadow-color=#000000');
  });

  it('替换 shadow-blur', () => {
    const src = '[] @(10, 20) shadow-blur=3';
    const result = updateLineAttribute(src, 1, 'shadow-blur', 5);
    expect(result).toContain('shadow-blur=5');
    expect(result).not.toContain('shadow-blur=3');
  });

  it('text: 新增阴影属性', () => {
    const src = '"Hello" @(10, 20)';
    const result = updateLineAttribute(src, 1, 'shadow-enabled', true);
    expect(result).toContain('shadow-enabled');
  });

  it('删除所有阴影属性', () => {
    const src = '[] @(10, 20) shadow-enabled shadow-x=0 shadow-y=0 shadow-blur=3 shadow-color=#000000';
    let result = deleteLineAttribute(src, 1, 'shadow-enabled');
    result = deleteLineAttribute(result, 1, 'shadow-x');
    result = deleteLineAttribute(result, 1, 'shadow-y');
    result = deleteLineAttribute(result, 1, 'shadow-blur');
    result = deleteLineAttribute(result, 1, 'shadow-color');
    expect(result).not.toContain('shadow');
  });
});

describe('updateLineCoords', () => {
  it('更新线段坐标', () => {
    const src = '-- @(0, 0)->(100, 50)';
    expect(updateLineCoords(src, 1, 10, 20, 200, 80)).toBe('-- @(10, 20)->(200, 80)');
  });

  it('新增线段坐标', () => {
    const src = '--';
    const result = updateLineCoords(src, 1, 0, 0, 100, 50);
    expect(result).toContain('@(0, 0)->(100, 50)');
  });
});
