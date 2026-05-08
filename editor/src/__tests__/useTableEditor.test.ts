import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableEditor } from '../shared/hooks/useTableEditor';

const SIMPLE_TABLE = '## @(0, 0) w=600\n  #\n    "A"\n    "B"\n  #\n    "C"\n    "D"';

describe('useTableEditor - 初始化', () => {
  it('解析表格内容', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));
    expect(result.current.tableData).not.toBeNull();
    expect(result.current.tableData!.rows).toHaveLength(2);
    expect(result.current.tableData!.rows[0].cells).toHaveLength(2);
  });

  it('初始状态：无选中、无编辑、无修改', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));
    expect(result.current.selectedCells.size).toBe(0);
    expect(result.current.editingCell).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('无效内容返回 null', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor('invalid content', 1, onSave));
    expect(result.current.tableData).toBeNull();
  });
});

describe('useTableEditor - 单元格操作', () => {
  it('updateCell 修改单元格文本', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { text: 'NewA' });
    });

    expect(result.current.tableData!.rows[0].cells[0].text).toBe('NewA');
    expect(result.current.isDirty).toBe(true);
  });

  it('updateCell 修改单元格属性', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { attrs: { bold: true, bg: '#FF0000' } });
    });

    expect(result.current.tableData!.rows[0].cells[0].attrs.bold).toBe(true);
    expect(result.current.tableData!.rows[0].cells[0].attrs.bg).toBe('#FF0000');
  });

  it('updateCell 不影响其他单元格', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { text: 'NewA' });
    });

    expect(result.current.tableData!.rows[0].cells[1].text).toBe('B');
    expect(result.current.tableData!.rows[1].cells[0].text).toBe('C');
  });

  it('resetCellAttrs 清空单元格属性', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { attrs: { bold: true, bg: '#FF0000' } });
    });
    expect(result.current.tableData!.rows[0].cells[0].attrs.bold).toBe(true);

    act(() => {
      result.current.resetCellAttrs(0, 0);
    });
    expect(result.current.tableData!.rows[0].cells[0].attrs).toEqual({});
  });
});

describe('useTableEditor - 行操作', () => {
  it('updateRow 修改行属性', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateRow(0, { bg: '#EEE' });
    });

    expect(result.current.tableData!.rows[0].attrs.bg).toBe('#EEE');
  });

  it('resetRowAttrs 清空行属性', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateRow(0, { bg: '#EEE' });
    });
    expect(result.current.tableData!.rows[0].attrs.bg).toBe('#EEE');

    act(() => {
      result.current.resetRowAttrs(0);
    });
    expect(result.current.tableData!.rows[0].attrs).toEqual({});
  });

  it('addRow 添加行', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.addRow();
    });

    expect(result.current.tableData!.rows).toHaveLength(3);
    expect(result.current.tableData!.rows[2].cells).toHaveLength(2);
    expect(result.current.tableData!.rows[2].cells[0].text).toBe('');
  });

  it('addRow 在指定位置插入', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.addRow(1);
    });

    expect(result.current.tableData!.rows).toHaveLength(3);
    expect(result.current.tableData!.rows[1].cells[0].text).toBe('');
    expect(result.current.tableData!.rows[2].cells[0].text).toBe('C');
  });

  it('deleteRow 删除行', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.deleteRow(0);
    });

    expect(result.current.tableData!.rows).toHaveLength(1);
    expect(result.current.tableData!.rows[0].cells[0].text).toBe('C');
  });

  it('deleteRow 不删除最后一行', () => {
    const singleRowTable = '## @(0, 0) w=600\n  #\n    "A"';
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(singleRowTable, 1, onSave));

    act(() => {
      result.current.deleteRow(0);
    });

    expect(result.current.tableData!.rows).toHaveLength(1);
  });
});

describe('useTableEditor - 列操作', () => {
  it('addColumn 添加列', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.addColumn();
    });

    expect(result.current.tableData!.rows[0].cells).toHaveLength(3);
    expect(result.current.tableData!.rows[1].cells).toHaveLength(3);
  });

  it('addColumn 在指定位置插入', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.addColumn(1);
    });

    expect(result.current.tableData!.rows[0].cells).toHaveLength(3);
    expect(result.current.tableData!.rows[0].cells[0].text).toBe('A');
    expect(result.current.tableData!.rows[0].cells[1].text).toBe('');
    expect(result.current.tableData!.rows[0].cells[2].text).toBe('B');
  });

  it('deleteColumn 删除列', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.deleteColumn(0);
    });

    expect(result.current.tableData!.rows[0].cells).toHaveLength(1);
    expect(result.current.tableData!.rows[0].cells[0].text).toBe('B');
  });

  it('deleteColumn 不删除最后一列', () => {
    const singleColTable = '## @(0, 0) w=600\n  #\n    "A"\n  #\n    "B"';
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(singleColTable, 1, onSave));

    act(() => {
      result.current.deleteColumn(0);
    });

    expect(result.current.tableData!.rows[0].cells).toHaveLength(1);
  });
});

describe('useTableEditor - 表格属性', () => {
  it('updateTableAttrs 修改表格属性', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateTableAttrs({ w: 800, bg: '#F0F0F0' });
    });

    expect(result.current.tableData!.attrs.w).toBe(800);
    expect(result.current.tableData!.attrs.bg).toBe('#F0F0F0');
  });
});

describe('useTableEditor - 选择', () => {
  it('selectCell 选中单元格', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.selectCell('0,0');
    });

    expect(result.current.selectedCells.has('0,0')).toBe(true);
  });

  it('selectCell 多选', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.selectCell('0,0');
    });
    act(() => {
      result.current.selectCell('0,1', true);
    });

    expect(result.current.selectedCells.has('0,0')).toBe(true);
    expect(result.current.selectedCells.has('0,1')).toBe(true);
  });

  it('selectCell 单选替换多选', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.selectCell('0,0');
    });
    act(() => {
      result.current.selectCell('0,1', true);
    });
    act(() => {
      result.current.selectCell('1,0');
    });

    expect(result.current.selectedCells.size).toBe(1);
    expect(result.current.selectedCells.has('1,0')).toBe(true);
  });

  it('startEditing / stopEditing', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.startEditing('0,0');
    });
    expect(result.current.editingCell).toBe('0,0');

    act(() => {
      result.current.stopEditing();
    });
    expect(result.current.editingCell).toBeNull();
  });
});

describe('useTableEditor - 保存与重置', () => {
  it('save 调用 onSave', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { text: 'NewA' });
    });
    act(() => {
      result.current.save();
    });

    expect(onSave).toHaveBeenCalled();
    expect(result.current.isDirty).toBe(false);
  });

  it('reset 恢复原始数据', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useTableEditor(SIMPLE_TABLE, 1, onSave));

    act(() => {
      result.current.updateCell(0, 0, { text: 'NewA' });
    });
    expect(result.current.tableData!.rows[0].cells[0].text).toBe('NewA');

    act(() => {
      result.current.reset();
    });
    expect(result.current.tableData!.rows[0].cells[0].text).toBe('A');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.selectedCells.size).toBe(0);
    expect(result.current.editingCell).toBeNull();
  });
});
