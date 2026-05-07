# 表格编辑器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SolarWire 可视化编辑器实现完整的表格可视化编辑能力，包括属性面板表格级编辑、模态窗口网格编辑器、源码同步保存，以及为未来画布内编辑铺垫的渲染器改造。

**Architecture:** 分层架构：
- Layer 1（属性面板）：表格级属性编辑 + 概览信息 + 快捷入口
- Layer 2（模态窗口）：类 Excel 网格编辑 + 单元格属性面板 + 实时预览
- 渲染器改造：为单元格添加 data 属性支持画布内命中检测

**Tech Stack:** React 18 + TypeScript + CSS Modules + Zustand

---

## 变更文件总览

| 动作 | 文件路径 | 变更说明 |
|------|----------|----------|
| 创建 | `editor/src/app/components/editor/TableEditorModal.tsx` | 表格编辑器模态窗口主组件 |
| 创建 | `editor/src/app/components/editor/TableEditorModal.css` | 模态窗口样式 |
| 创建 | `editor/src/app/components/editor/TableGrid.tsx` | 表格网格编辑组件 |
| 创建 | `editor/src/app/components/editor/CellProperties.tsx` | 单元格/行属性面板 |
| 创建 | `editor/src/app/components/editor/TablePreview.tsx` | 实时 SVG 预览组件 |
| 创建 | `editor/src/app/components/editor/TablePreview.css` | 预览组件样式 |
| 创建 | `editor/src/shared/hooks/useTableEditor.ts` | 表格编辑器状态 hook |
| 创建 | `editor/src/shared/utils/table-source-utils.ts` | 表格源码解析/序列化工具 |
| 修改 | `editor/src/app/components/editor/PropertyPanel.tsx` | 添加表格元素类型支持 |
| 修改 | `editor/src/app/components/editor/hooks/useElementProps.ts` | 添加表格属性提取 |
| 修改 | `editor/src/lib/renderer/elements/otherElements.ts` | 为单元格添加 data 属性 |
| 修改 | `editor/src/app/components/editor/hooks/useElementInteraction.ts` | 单元格命中检测 |

---

## Task 1: 表格源码解析工具

**Files:**
- Create: `editor/src/shared/utils/table-source-utils.ts`
- Create: `editor/src/shared/hooks/useTableEditor.ts`
- Test: （手动功能测试）

**依赖:** 无

---

- [ ] **Step 1: 创建表格数据模型类型定义**

```typescript
export interface TableCell {
  row: number;
  col: number;
  text: string;
  colspan: number;
  rowspan: number;
  attrs: {
    bg?: string;
    c?: string;
    size?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'l' | 'c' | 'r';
    'vertical-align'?: 't' | 'm' | 'b';
  };
}

export interface TableRow {
  index: number;
  attrs: {
    bg?: string;
    c?: string;
    size?: string;
    bold?: boolean;
    italic?: boolean;
    'line-height'?: string;
    'letter-spacing'?: string;
  };
  cells: TableCell[];
}

export interface TableData {
  line: number;
  attrs: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    border?: number;
    cellspacing?: number;
    b?: string;
  };
  rows: TableRow[];
}

export interface TableEditorState {
  tableData: TableData | null;
  selectedCells: Set<string>;  // "row-col" 格式
  editingCell: string | null;   // "row-col" 格式
  isDirty: boolean;
  previewSvg: string;
}
```

- [ ] **Step 2: 创建 parseTableFromSource 解析函数**

```typescript
import { parse } from '../../../lib/parser';
import type { Element } from '../../../lib/parser/types';

export function parseTableFromSource(
  content: string,
  tableLine: number
): TableData | null {
  try {
    const ast = parse(content);
    const tableElement = ast.elements.find(
      el => el.type === 'table' && el.location?.line === tableLine
    );
    if (!tableElement) return null;

    const table = tableElement as Element & { children?: Element[] };
    const rows: TableRow[] = [];

    table.children?.forEach((rowEl, rowIndex) => {
      const row = rowEl as Element & { children?: Element[]; attributes?: Record<string, string> };
      const cells: TableCell[] = [];

      row.children?.forEach((cellEl, colIndex) => {
        const attrs = (cellEl as any).attributes || {};
        cells.push({
          row: rowIndex,
          col: colIndex,
          text: (cellEl as any).text || '',
          colspan: parseInt(attrs.colspan) || 1,
          rowspan: parseInt(attrs.rowspan) || 1,
          attrs: {
            bg: attrs.bg,
            c: attrs.c,
            size: attrs.size,
            bold: !!attrs.bold,
            italic: !!attrs.italic,
            align: attrs.align as 'l' | 'c' | 'r' | undefined,
            'vertical-align': attrs['vertical-align'] as 't' | 'm' | 'b' | undefined,
          },
        });
      });

      const rowAttrs = row.attributes || {};
      rows.push({
        index: rowIndex,
        attrs: {
          bg: rowAttrs.bg,
          c: rowAttrs.c,
          size: rowAttrs.size,
          bold: !!rowAttrs.bold,
          italic: !!rowAttrs.italic,
          'line-height': rowAttrs['line-height'],
          'letter-spacing': rowAttrs['letter-spacing'],
        },
        cells,
      });
    });

    const tableAttrs = tableElement.attributes || {};
    return {
      line: tableLine,
      attrs: {
        x: parseInt(tableAttrs.x),
        y: parseInt(tableAttrs.y),
        w: parseInt(tableAttrs.w) || 600,
        h: parseInt(tableAttrs.h),
        border: parseInt(tableAttrs.border) || 1,
        cellspacing: parseInt(tableAttrs.cellspacing) || 0,
        b: tableAttrs.b || '#333333',
      },
      rows,
    };
  } catch (e) {
    console.error('Failed to parse table:', e);
    return null;
  }
}
```

- [ ] **Step 3: 创建 serializeTableToSource 序列化函数**

```typescript
export function serializeTableToSource(
  tableData: TableData,
  originalContent: string
): string {
  const lines = originalContent.split('\n');
  const { line, attrs, rows } = tableData;

  // 更新表格属性行
  const tableLineIdx = line - 1;
  const tableLine = lines[tableLineIdx];

  const attrParts: string[] = [];
  if (attrs.w) attrParts.push(`w=${attrs.w}`);
  if (attrs.h) attrParts.push(`h=${attrs.h}`);
  if (attrs.border !== undefined && attrs.border !== 1) attrParts.push(`border=${attrs.border}`);
  if (attrs.cellspacing !== undefined && attrs.cellspacing !== 0) attrParts.push(`cellspacing=${attrs.cellspacing}`);
  if (attrs.b && attrs.b !== '#333333') attrParts.push(`b=${attrs.b}`);

  const attrsStr = attrParts.length > 0 ? ` ${attrParts.join(' ')}` : '';
  lines[tableLineIdx] = `##${attrsStr}`;

  // 更新每行的单元格内容
  let currentLine = line + 1;
  rows.forEach((row, rowIdx) => {
    const rowLineIdx = currentLine;
    const rowLine = lines[rowLineIdx];
    const rowAttrParts: string[] = [];
    const rowAttrs = row.attrs;

    if (rowAttrs.bg) rowAttrParts.push(`bg=${rowAttrs.bg}`);
    if (rowAttrs.c) rowAttrParts.push(`c=${rowAttrs.c}`);
    if (rowAttrs.size) rowAttrParts.push(`size=${rowAttrs.size}`);
    if (rowAttrs.bold) rowAttrParts.push(`bold`);
    if (rowAttrs.italic) rowAttrParts.push(`italic`);
    if (rowAttrs['line-height']) rowAttrParts.push(`line-height=${rowAttrs['line-height']}`);
    if (rowAttrs['letter-spacing']) rowAttrParts.push(`letter-spacing=${rowAttrs['letter-spacing']}`);

    const rowAttrsStr = rowAttrParts.length > 0 ? ` ${rowAttrParts.join(' ')}` : '';
    lines[rowLineIdx] = `  #${rowAttrsStr}`;

    currentLine++;

    // 写入每个单元格
    row.cells.forEach((cell) => {
      const cellLineIdx = currentLine;
      const cellAttrParts: string[] = [];

      if (cell.colspan > 1) cellAttrParts.push(`colspan=${cell.colspan}`);
      if (cell.rowspan > 1) cellAttrParts.push(`rowspan=${cell.rowspan}`);

      // 单元格私有属性（与行属性不同的）
      if (cell.attrs.bg && cell.attrs.bg !== rowAttrs.bg) cellAttrParts.push(`bg=${cell.attrs.bg}`);
      if (cell.attrs.c && cell.attrs.c !== rowAttrs.c) cellAttrParts.push(`c=${cell.attrs.c}`);
      if (cell.attrs.size && cell.attrs.size !== rowAttrs.size) cellAttrParts.push(`size=${cell.attrs.size}`);
      if (cell.attrs.bold !== rowAttrs.bold) cellAttrParts.push(`bold`);
      if (cell.attrs.italic !== rowAttrs.italic) cellAttrParts.push(`italic`);

      const text = cell.text || '';
      const quotedText = text.includes('\n') || text.includes('"""')
        ? `"""${text.replace(/"/g, '\\"')}"""`
        : `"${text.replace(/"/g, '\\"')}"`;

      const cellAttrsStr = cellAttrParts.length > 0 ? ` ${cellAttrParts.join(' ')}` : '';
      lines[cellLineIdx] = `    ${cellAttrsStr} ${quotedText}`;

      currentLine++;
    });
  });

  return lines.join('\n');
}
```

- [ ] **Step 4: 创建 useTableEditor hook**

```typescript
import { useState, useCallback, useMemo } from 'react';
import { parseTableFromSource, serializeTableToSource } from '../utils/table-source-utils';
import type { TableData, TableCell, TableRow } from '../utils/table-source-utils';

export function useTableEditor(
  content: string,
  tableLine: number,
  onSave: (newContent: string) => void
) {
  const [tableData, setTableData] = useState<TableData | null>(() =>
    parseTableFromSource(content, tableLine)
  );
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updateCell = useCallback((row: number, col: number, updates: Partial<TableCell>) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, rows: [...prev.rows] };
      const newRow = { ...newData.rows[row], cells: [...newData.rows[row].cells] };
      newRow.cells[col] = { ...newRow.cells[col], ...updates };
      newData.rows[row] = newRow;
      return newData;
    });
    setIsDirty(true);
  }, []);

  const updateRow = useCallback((rowIndex: number, updates: Partial<TableRow['attrs']>) => {
    setTableData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, rows: [...prev.rows] };
      newData.rows[rowIndex] = {
        ...newData.rows[rowIndex],
        attrs: { ...newData.rows[rowIndex].attrs, ...updates },
      };
      return newData;
    });
    setIsDirty(true);
  }, []);

  const updateTableAttrs = useCallback((updates: Partial<TableData['attrs']>) => {
    setTableData(prev => {
      if (!prev) return prev;
      return { ...prev, attrs: { ...prev.attrs, ...updates } };
    });
    setIsDirty(true);
  }, []);

  const addRow = useCallback((index?: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const insertAt = index ?? prev.rows.length;
      const numCols = prev.rows[0]?.cells.length || 1;
      const newCells: TableCell[] = Array.from({ length: numCols }, (_, i) => ({
        row: insertAt,
        col: i,
        text: '',
        colspan: 1,
        rowspan: 1,
        attrs: {},
      }));
      const newRow: TableRow = { index: insertAt, attrs: {}, cells: newCells };
      const newRows = [...prev.rows];
      newRows.splice(insertAt, 0, newRow);
      // 重新编号
      newRows.forEach((r, i) => { r.index = i; });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setTableData(prev => {
      if (!prev || prev.rows.length <= 1) return prev;
      const newRows = prev.rows.filter((_, i) => i !== index);
      newRows.forEach((r, i) => { r.index = i; });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const addColumn = useCallback((colIndex?: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const insertAt = colIndex ?? (prev.rows[0]?.cells.length || 1);
      const newRows = prev.rows.map(row => {
        const newCells = [...row.cells];
        newCells.splice(insertAt, 0, {
          row: row.index,
          col: insertAt,
          text: '',
          colspan: 1,
          rowspan: 1,
          attrs: {},
        });
        // 重新编号
        newCells.forEach((c, i) => { c.col = i; });
        return { ...row, cells: newCells };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const deleteColumn = useCallback((colIndex: number) => {
    setTableData(prev => {
      if (!prev) return prev;
      const numCols = prev.rows[0]?.cells.length || 1;
      if (numCols <= 1) return prev;
      const newRows = prev.rows.map(row => {
        const newCells = row.cells.filter((_, i) => i !== colIndex);
        newCells.forEach((c, i) => { c.col = i; });
        return { ...row, cells: newCells };
      });
      return { ...prev, rows: newRows };
    });
    setIsDirty(true);
  }, []);

  const selectCell = useCallback((cellKey: string, multi: boolean = false) => {
    setSelectedCells(prev => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(cellKey)) next.delete(cellKey);
        else next.add(cellKey);
        return next;
      }
      return new Set([cellKey]);
    });
    setEditingCell(null);
  }, []);

  const startEditing = useCallback((cellKey: string) => {
    setEditingCell(cellKey);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const save = useCallback(() => {
    if (!tableData) return;
    const newContent = serializeTableToSource(tableData, content);
    onSave(newContent);
    setIsDirty(false);
  }, [tableData, content, onSave]);

  const reload = useCallback(() => {
    setTableData(parseTableFromSource(content, tableLine));
    setSelectedCells(new Set());
    setEditingCell(null);
    setIsDirty(false);
  }, [content, tableLine]);

  return {
    tableData,
    selectedCells,
    editingCell,
    isDirty,
    updateCell,
    updateRow,
    updateTableAttrs,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    selectCell,
    startEditing,
    stopEditing,
    save,
    reload,
  };
}
```

- [ ] **Step 5: 验证解析/序列化逻辑**

手动测试：
1. 写入一个包含表格的 SolarWire 内容
2. 调用 `parseTableFromSource` → 正确解析出 TableData ✓
3. 修改 tableData 中的某个单元格
4. 调用 `serializeTableToSource` → 源码正确更新 ✓

---

## Task 2: 属性面板表格部分（Layer 1）

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementProps.ts`（添加表格属性）
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`（添加 Table 分组 + 按钮）
- Modify: `editor/src/app/components/editor/PropertyPanel.css`（Table 概览样式）

**依赖:** Task 1（源码解析工具）

---

- [ ] **Step 1: 在 useElementProps 中添加表格特有属性提取**

在 `ElementProps` 接口中添加：
```tsx
// Table 特有
isTable: boolean;
tableBorder: string;
tableCellspacing: string;
tableRows: number;
tableCols: number;
tableBg: string;
tableBorderColor: string;
```

在实现中添加（type === 'table' 时）：
```tsx
const tableBorder = attrs.border || '1';
const tableCellspacing = attrs.cellspacing || '0';
const tableBg = attrs.bg || 'transparent';
const tableBorderColor = attrs.b || '#333333';
const tableRows = (element as any).children?.length || 0;
const tableCols = (element as any).children?.[0]?.children?.length || 0;
```

- [ ] **Step 2: 在 PropertyPanel 中添加 Table 分组**

在 `PropertyPanel.tsx` 的 return JSX 中，找到元素类型条件渲染部分，添加 Table 分组：

```tsx
{type === 'table' && (
  <>
    <PropertyGroupTitle title="Table">
      <PropertyRow label="Border (border)" codeAttr="border">
        <DraggableNumberInput
          label=""
          value={tableBorder}
          onChange={(v) => handleChange('border', v)}
        />
      </PropertyRow>
      <PropertyRow label="Spacing (cellspacing)" codeAttr="cellspacing">
        <DraggableNumberInput
          label=""
          value={tableCellspacing}
          onChange={(v) => handleChange('cellspacing', v)}
        />
      </PropertyRow>
    </PropertyGroupTitle>

    <PropertyGroupTitle title="Structure">
      <div className="table-structure-info">
        <span className="structure-text">
          {tableRows} rows × {tableCols} cols
        </span>
        <button
          className="edit-table-btn"
          onClick={() => onOpenTableEditor(element.location?.line)}
        >
          编辑表格
        </button>
      </div>
    </PropertyGroupTitle>

    <PropertyGroupTitle title="Appearance">
      <div className="property-row">
        <ColorPicker
          label="Fill (bg)"
          value={tableBg}
          onChange={(color) => handleChange('bg', color)}
        />
        <ColorPicker
          label="Border (b)"
          value={tableBorderColor}
          onChange={(color) => handleChange('b', color)}
        />
      </div>
    </PropertyGroupTitle>
  </>
)}
```

- [ ] **Step 3: 添加 Table 属性面板样式**

在 `PropertyPanel.css` 中添加：
```css
.table-structure-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.structure-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.edit-table-btn {
  padding: 6px 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.edit-table-btn:hover {
  background: var(--accent-hover);
}
```

- [ ] **Step 4: 在 PropertyPanel 中添加模态窗口触发回调**

修改 `PropertyPanelProps` 接口：
```tsx
interface PropertyPanelProps {
  // ... existing
  onOpenTableEditor?: (tableLine: number) => void;
}
```

在 PropertyPanel 中：
```tsx
const handleOpenTableEditor = useCallback(() => {
  if (element && element.location?.line) {
    onOpenTableEditor?.(element.location.line);
  }
}, [element, onOpenTableEditor]);
```

将内联 `onClick={() => onOpenTableEditor(...)}` 替换为 `onClick={handleOpenTableEditor}`。

- [ ] **Step 5: 验证属性面板表格部分**

1. 选择 Table 元素 → 显示 Table 分组（Border, Spacing）✓
2. 显示 Structure 概览（X rows × Y cols）✓
3. 点击"编辑表格"按钮 → 触发 onOpenTableEditor ✓
4. 修改 Border/Spacing → 画布实时更新 ✓

---

## Task 3: 表格网格编辑组件 TableGrid

**Files:**
- Create: `editor/src/app/components/editor/TableGrid.tsx`
- Create: `editor/src/app/components/editor/TableGrid.css`

**依赖:** Task 1, Task 2

---

- [ ] **Step 1: 创建 TableGrid.tsx 骨架**

```tsx
import React, { useRef, useState, useCallback } from 'react';
import type { TableData, TableCell, TableRow } from '../../shared/utils/table-source-utils';
import './TableGrid.css';

interface TableGridProps {
  tableData: TableData;
  selectedCells: Set<string>;
  editingCell: string | null;
  onSelectCell: (key: string, multi: boolean) => void;
  onStartEditing: (key: string) => void;
  onStopEditing: (key: string) => void;
  onUpdateCell: (row: number, col: number, updates: Partial<TableCell>) => void;
  onAddRow: (index?: number) => void;
  onDeleteRow: (index: number) => void;
  onAddColumn: (index?: number) => void;
  onDeleteColumn: (index: number) => void;
}

const TableGrid: React.FC<TableGridProps> = ({
  tableData,
  selectedCells,
  editingCell,
  onSelectCell,
  onStartEditing,
  onStopEditing,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
}) => {
  // ...
};

export default TableGrid;
```

- [ ] **Step 2: 实现列头渲染**

```tsx
const numCols = tableData.rows[0]?.cells.length || 0;

return (
  <div className="table-grid-container">
    {/* 添加列按钮行 */}
    <div className="table-grid">
      <div className="grid-corner">
        <button
          className="add-col-btn"
          onClick={() => onAddColumn(0)}
          title="在最左侧添加列"
        >+</button>
      </div>
      {Array.from({ length: numCols }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="grid-col-header"
          onClick={(e) => {
            // 点击列标选中整列
            tableData.rows.forEach((row, rowIdx) => {
              onSelectCell(`${rowIdx}-${colIdx}`, rowIdx > 0);
            });
          }}
        >
          <span className="col-label">
            {String.fromCharCode(65 + colIdx)}
          </span>
          <div className="col-actions">
            <button
              className="col-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddColumn(colIdx + 1);
              }}
            >+</button>
            <button
              className="col-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteColumn(colIdx);
              }}
              disabled={numCols <= 1}
            >×</button>
          </div>
        </div>
      ))}
    </div>

    {/* 表格数据行 */}
    {tableData.rows.map((row, rowIdx) => (
      <div key={rowIdx} className="grid-row">
        {/* 行号 */}
        <div
          className="grid-row-header"
          onClick={(e) => {
            row.cells.forEach((_, colIdx) => {
              onSelectCell(`${rowIdx}-${colIdx}`, colIdx > 0);
            });
          }}
        >
          <span className="row-label">{rowIdx + 1}</span>
          <div className="row-actions">
            <button
              className="row-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddRow(rowIdx + 1);
              }}
            >+</button>
            <button
              className="row-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRow(rowIdx);
              }}
              disabled={tableData.rows.length <= 1}
            >×</button>
          </div>
        </div>

        {/* 单元格 */}
        {row.cells.map((cell, colIdx) => {
          const cellKey = `${rowIdx}-${colIdx}`;
          const isSelected = selectedCells.has(cellKey);
          const isEditing = editingCell === cellKey;

          return (
            <div
              key={colIdx}
              className={`grid-cell ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
              style={{
                backgroundColor: cell.attrs.bg || row.attrs.bg || 'white',
              }}
              onClick={(e) => {
                if (!isEditing) {
                  onSelectCell(cellKey, e.shiftKey || e.ctrlKey || e.metaKey);
                }
              }}
              onDoubleClick={() => {
                onStartEditing(cellKey);
              }}
              colSpan={cell.colspan > 1 ? cell.colspan : undefined}
            >
              {isEditing ? (
                <input
                  type="text"
                  className="cell-input"
                  value={cell.text}
                  autoFocus
                  onChange={(e) => {
                    onUpdateCell(rowIdx, colIdx, { text: e.target.value });
                  }}
                  onBlur={() => onStopEditing(cellKey)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onStopEditing(cellKey);
                    } else if (e.key === 'Escape') {
                      onStopEditing(cellKey);
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      onStopEditing(cellKey);
                      const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
                      if (nextCol >= 0 && nextCol < numCols) {
                        onSelectCell(`${rowIdx}-${nextCol}`, false);
                      }
                    }
                  }}
                />
              ) : (
                <div className="cell-text">{cell.text || <span className="cell-placeholder">双击编辑</span>}</div>
              )}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);
```

- [ ] **Step 3: 创建 TableGrid.css**

```css
.table-grid-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
}

.table-grid {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.grid-corner {
  width: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--border-color);
}

.grid-col-header {
  flex: 1;
  min-width: 100px;
  padding: 8px 4px;
  text-align: center;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: background 0.15s;
}

.grid-col-header:hover {
  background: var(--bg-hover);
}

.col-label {
  font-weight: 600;
  font-size: 12px;
  color: var(--text-primary);
}

.col-actions, .row-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.grid-col-header:hover .col-actions,
.grid-row-header:hover .row-actions {
  opacity: 1;
}

.col-add-btn, .col-delete-btn,
.row-add-btn, .row-delete-btn {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-muted);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.col-add-btn:hover, .row-add-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.col-delete-btn:hover, .row-delete-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

.col-delete-btn:disabled, .row-delete-btn:disabled,
.col-add-btn:disabled, .row-add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.grid-row {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.grid-row:last-child {
  border-bottom: none;
}

.grid-row-header {
  width: 48px;
  min-width: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  gap: 4px;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
}

.grid-row-header:hover {
  background: var(--bg-hover);
}

.row-label {
  font-weight: 600;
  font-size: 12px;
  color: var(--text-primary);
}

.grid-cell {
  flex: 1;
  min-width: 100px;
  padding: 8px;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.grid-cell:last-child {
  border-right: none;
}

.grid-cell:hover {
  background: rgba(0, 0, 0, 0.05);
}

.grid-cell.selected {
  outline: 2px solid var(--accent-color);
  outline-offset: -2px;
  z-index: 1;
}

.grid-cell.editing {
  padding: 0;
}

.cell-text {
  font-size: 13px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.cell-placeholder {
  color: var(--text-muted);
  font-style: italic;
}

.cell-input {
  width: 100%;
  height: 100%;
  padding: 8px;
  border: none;
  outline: none;
  font-size: 13px;
  background: white;
  color: var(--text-primary);
  box-sizing: border-box;
}
```

- [ ] **Step 4: 验证 TableGrid 功能**

1. 网格正确显示所有行和列 ✓
2. 单击选中单元格（高亮边框）✓
3. 双击进入编辑模式（input 自动聚焦）✓
4. Enter 确认 / ESC 取消 / Tab 跳转下一单元格 ✓
5. Shift+点击多选 ✓
6. 点击行号选中整行 ✓
7. 点击列标选中整列 ✓
8. 添加/删除行和列 ✓

---

## Task 4: 单元格属性面板 CellProperties

**Files:**
- Create: `editor/src/app/components/editor/CellProperties.tsx`
- Create: `editor/src/app/components/editor/CellProperties.css`

**依赖:** Task 1, Task 3

---

- [ ] **Step 1: 创建 CellProperties.tsx**

```tsx
import React from 'react';
import { DraggableNumberInput } from './property/PropertyRow';
import ColorPicker from '../ui/ColorPicker';
import type { TableData, TableRow } from '../../shared/utils/table-source-utils';
import './CellProperties.css';

interface CellPropertiesProps {
  tableData: TableData;
  selectedCells: Set<string>;
  onUpdateCell: (row: number, col: number, updates: any) => void;
  onUpdateRow: (rowIndex: number, updates: Partial<TableRow['attrs']>) => void;
}

const CellProperties: React.FC<CellPropertiesProps> = ({
  tableData,
  selectedCells,
  onUpdateCell,
  onUpdateRow,
}) => {
  // 解析选中单元格
  const cellKeys = Array.from(selectedCells);
  if (cellKeys.length === 0) {
    return (
      <div className="cell-properties empty">
        <p className="empty-hint">选择一个单元格以编辑属性</p>
      </div>
    );
  }

  const firstKey = cellKeys[0];
  const [firstRow, firstCol] = firstKey.split('-').map(Number);
  const firstCell = tableData.rows[firstRow]?.cells[firstCol];
  const firstRowData = tableData.rows[firstRow];

  const isMultiCell = cellKeys.length > 1;
  const isWholeRow = cellKeys.length === (tableData.rows[firstRow]?.cells.length || 0);

  const effectiveBg = firstCell?.attrs.bg || firstRowData?.attrs.bg || '#ffffff';
  const effectiveColor = firstCell?.attrs.c || firstRowData?.attrs.c || '#000000';

  const handleCellChange = (attr: string, value: any) => {
    if (isWholeRow) {
      onUpdateRow(firstRow, { [attr]: value });
    } else {
      onUpdateCell(firstRow, firstCol, { attrs: { ...firstCell.attrs, [attr]: value } });
    }
  };

  return (
    <div className="cell-properties">
      <h4 className="properties-title">
        {isWholeRow ? `行 ${firstRow + 1} 属性` : isMultiCell ? `${cellKeys.length} 个单元格` : `单元格 (${firstRow + 1}, ${firstCol + 1})`}
      </h4>

      <div className="property-section">
        <ColorPicker
          label="Fill (bg)"
          value={effectiveBg}
          onChange={(color) => handleCellChange('bg', color)}
        />
      </div>

      <div className="property-section">
        <ColorPicker
          label="Color (c)"
          value={effectiveColor}
          onChange={(color) => handleCellChange('c', color)}
        />
      </div>

      <div className="property-section">
        <div className="property-row">
          <span className="property-label">Size (size)</span>
          <DraggableNumberInput
            label=""
            value={parseInt(firstCell?.attrs.size || firstRowData?.attrs.size || '12')}
            onChange={(v) => handleCellChange('size', v.toString())}
          />
        </div>
      </div>

      <div className="property-section">
        <span className="property-label">Align</span>
        <div className="align-buttons">
          {(['l', 'c', 'r'] as const).map((align) => {
            const effectiveAlign = firstCell?.attrs.align || firstRowData?.attrs.align || 'l';
            return (
              <button
                key={align}
                className={`align-btn ${effectiveAlign === align ? 'active' : ''}`}
                onClick={() => handleCellChange('align', align)}
              >
                {align === 'l' ? 'L' : align === 'c' ? 'C' : 'R'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="property-section">
        <span className="property-label">V-Align</span>
        <div className="align-buttons">
          {(['t', 'm', 'b'] as const).map((va) => {
            const effectiveVa = firstCell?.attrs['vertical-align'] || 't';
            return (
              <button
                key={va}
                className={`align-btn ${effectiveVa === va ? 'active' : ''}`}
                onClick={() => handleCellChange('vertical-align', va)}
              >
                {va === 't' ? '↑' : va === 'm' ? '↕' : '↓'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="property-section toggle-section">
        <button
          className={`toggle-btn ${firstCell?.attrs.bold || firstRowData?.attrs.bold ? 'active' : ''}`}
          onClick={() => handleCellChange('bold', !(firstCell?.attrs.bold || firstRowData?.attrs.bold))}
        ><b>B</b></button>
        <button
          className={`toggle-btn ${firstCell?.attrs.italic || firstRowData?.attrs.italic ? 'active' : ''}`}
          onClick={() => handleCellChange('italic', !(firstCell?.attrs.italic || firstRowData?.attrs.italic))}
        ><i>I</i></button>
      </div>

      {isWholeRow && (
        <button
          className="reset-cell-btn"
          onClick={() => onUpdateRow(firstRow, {})}
        >
          重置行属性
        </button>
      )}
      {!isWholeRow && (
        <button
          className="reset-cell-btn"
          onClick={() => onUpdateCell(firstRow, firstCol, { attrs: {} })}
        >
          重置单元格
        </button>
      )}
    </div>
  );
};

export default CellProperties;
```

- [ ] **Step 2: 创建 CellProperties.css**

```css
.cell-properties {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
}

.cell-properties.empty {
  align-items: center;
  justify-content: center;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.properties-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.property-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.property-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 60px;
}

.toggle-section {
  flex-direction: row;
  gap: 4px;
}

.reset-cell-btn {
  margin-top: auto;
  padding: 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.reset-cell-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent-color);
}
```

- [ ] **Step 5: 验证 CellProperties**

1. 未选中单元格 → 显示提示"选择一个单元格" ✓
2. 选中单个单元格 → 显示该单元格属性 ✓
3. 修改 Fill/Color/Size/Align → 单元格实时更新 ✓
4. 选中整行 → 属性应用到整行 ✓

---

## Task 5: 实时预览组件 TablePreview

**Files:**
- Create: `editor/src/app/components/editor/TablePreview.tsx`
- Create: `editor/src/app/components/editor/TablePreview.css`

**依赖:** Task 1

---

- [ ] **Step 1: 创建 TablePreview.tsx**

```tsx
import React, { useMemo, useEffect, useState } from 'react';
import { parse } from '../../../lib/parser';
import { render } from '../../../lib/renderer/renderer';
import type { TableData } from '../../shared/utils/table-source-utils';
import './TablePreview.css';

interface TablePreviewProps {
  tableData: TableData;
  originalSource: string;
}

const TablePreview: React.FC<TablePreviewProps> = ({ tableData, originalSource }) => {
  const [previewSvg, setPreviewSvg] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // 从原始源码中提取表格行号范围
        const lines = originalSource.split('\n');
        const tableLineIdx = tableData.line - 1;

        // 找到表格结束位置（通过解析）
        const ast = parse(originalSource);
        const tableEl = ast.elements.find(
          el => el.type === 'table' && el.location?.line === tableData.line
        );

        if (tableEl) {
          // 简单处理：只渲染表格部分
          const tableContent = lines.slice(tableLineIdx).join('\n');
          const tempAst = parse(`## w=${tableData.attrs.w || 600}\n${tableContent}`);
          const svg = render(tempAst);
          setPreviewSvg(svg);
        }
      } catch (e) {
        console.error('Preview render error:', e);
      }
    }, 150); // 150ms 防抖

    return () => clearTimeout(timer);
  }, [tableData, originalSource]);

  return (
    <div className={`table-preview ${collapsed ? 'collapsed' : ''}`}>
      <div className="preview-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="preview-title">实时预览</span>
        <span className="preview-toggle">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
      )}
    </div>
  );
};

export default TablePreview;
```

- [ ] **Step 2: 创建 TablePreview.css**

```css
.table-preview {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.table-preview.collapsed .preview-content {
  display: none;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-header:hover {
  background: var(--bg-hover);
}

.preview-title {
  font-weight: 500;
}

.preview-toggle {
  font-size: 10px;
}

.preview-content {
  height: 200px;
  overflow: auto;
  padding: 12px;
  background: white;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.preview-content svg {
  max-width: 100%;
  height: auto;
}
```

- [ ] **Step 3: 验证 TablePreview**

1. 修改表格数据 → 150ms 后预览更新 ✓
2. 折叠/展开预览区域 ✓

---

## Task 6: 模态窗口 TableEditorModal

**Files:**
- Create: `editor/src/app/components/editor/TableEditorModal.tsx`
- Create: `editor/src/app/components/editor/TableEditorModal.css`
- Modify: `editor/src/app/components/editor/SolarWireVisualEditor.tsx`（集成模态窗口）

**依赖:** Task 1-5 全部完成

---

- [ ] **Step 1: 创建 TableEditorModal.tsx 骨架**

```tsx
import React, { useEffect, useCallback } from 'react';
import TableGrid from './TableGrid';
import CellProperties from './CellProperties';
import TablePreview from './TablePreview';
import { useTableEditor } from '../../shared/hooks/useTableEditor';
import './TableEditorModal.css';

interface TableEditorModalProps {
  isOpen: boolean;
  content: string;
  tableLine: number;
  onSave: (newContent: string) => void;
  onClose: () => void;
}

const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  content,
  tableLine,
  onSave,
  onClose,
}) => {
  const {
    tableData,
    selectedCells,
    editingCell,
    isDirty,
    updateCell,
    updateRow,
    updateTableAttrs,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    selectCell,
    startEditing,
    stopEditing,
    save,
    reload,
  } = useTableEditor(content, tableLine, onSave);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDirty) {
          if (window.confirm('有未保存的修改，确定要关闭吗？')) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isDirty, onClose]);

  // Ctrl+S 保存
  useEffect(() => {
    if (!isOpen) return;
    const handleCtrlS = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener('keydown', handleCtrlS);
    return () => document.removeEventListener('keydown', handleCtrlS);
  }, [isOpen, save]);

  const handleSave = useCallback(() => {
    save();
    onClose();
  }, [save, onClose]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('有未保存的修改，确定要关闭吗？')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">编辑表格</h2>
          <div className="modal-header-actions">
            <span className="dirty-indicator">{isDirty ? '●' : ''}</span>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-main">
            <TableGrid
              tableData={tableData!}
              selectedCells={selectedCells}
              editingCell={editingCell}
              onSelectCell={selectCell}
              onStartEditing={startEditing}
              onStopEditing={stopEditing}
              onUpdateCell={updateCell}
              onAddRow={addRow}
              onDeleteRow={deleteRow}
              onAddColumn={addColumn}
              onDeleteColumn={deleteColumn}
            />
          </div>

          <div className="modal-sidebar">
            <CellProperties
              tableData={tableData!}
              selectedCells={selectedCells}
              onUpdateCell={updateCell}
              onUpdateRow={updateRow}
            />
          </div>
        </div>

        <div className="modal-preview">
          <TablePreview
            tableData={tableData!}
            originalSource={content}
          />
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleClose}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default TableEditorModal;
```

- [ ] **Step 2: 创建 TableEditorModal.css**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  max-height: 800px;
  background: var(--bg-primary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 8px 8px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dirty-indicator {
  color: var(--accent-color);
  font-size: 16px;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.modal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.modal-sidebar {
  width: 220px;
  min-width: 220px;
  overflow-y: auto;
}

.modal-preview {
  padding: 0 16px 16px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 0 0 8px 8px;
}

.cancel-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.save-btn {
  padding: 8px 20px;
  background: var(--accent-color);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover {
  background: var(--accent-hover);
}
```

- [ ] **Step 3: 在 SolarWireVisualEditor 中集成模态窗口**

在 `SolarWireVisualEditor.tsx` 中：

1. 添加 state：
```tsx
const [tableEditorOpen, setTableEditorOpen] = useState(false);
const [tableEditorLine, setTableEditorLine] = useState<number | null>(null);
```

2. 传递回调到 PropertyPanel：
```tsx
<PropertyPanel
  // ... other props
  onOpenTableEditor={(line) => {
    setTableEditorLine(line);
    setTableEditorOpen(true);
  }}
/>
```

3. 渲染模态窗口：
```tsx
{tableEditorOpen && tableEditorLine !== null && (
  <TableEditorModal
    isOpen={tableEditorOpen}
    content={content}
    tableLine={tableEditorLine}
    onSave={(newContent) => {
      setContent(newContent);
      setTableEditorOpen(false);
    }}
    onClose={() => setTableEditorOpen(false)}
  />
)}
```

- [ ] **Step 4: 验证完整模态窗口**

1. 属性面板点击"编辑表格" → 模态窗口打开 ✓
2. ESC 关闭（有修改时提示确认）✓
3. 点击遮罩层关闭（有修改时提示确认）✓
4. Ctrl+S 保存 ✓
5. 保存后关闭并同步到画布 ✓
6. 修改表格数据 → 实时预览更新 ✓
7. 添加/删除行和列 → 预览同步更新 ✓

---

## Task 7: 渲染器改造 — 单元格 data 属性

**Files:**
- Modify: `editor/src/lib/renderer/elements/otherElements.ts`

**依赖:** Task 6

---

- [ ] **Step 1: 为表格单元格 rect 添加 data 属性**

找到 `renderTableCells` 函数中绘制单元格 rect 的位置，添加 data 属性：

当前代码（约 line 646）：
```tsx
svgParts.push(`<rect x="${cellX}" y="${cellY}" width="${cellWidth}" height="${cellHeight}" fill="${cellBg}" stroke="${cellBorder}" stroke-width="${cellStrokeWidth}"/>`);
```

修改为：
```tsx
svgParts.push(`<rect 
  x="${cellX}" 
  y="${cellY}" 
  width="${cellWidth}" 
  height="${cellHeight}" 
  fill="${cellBg}" 
  stroke="${cellBorder}" 
  stroke-width="${cellStrokeWidth}"
  data-element-id="${id}"
  data-cell-row="${data.row}"
  data-cell-col="${data.col}"
  data-cell-key="${data.row}-${data.col}"
/>`);
```

- [ ] **Step 2: 为表格外层 g 添加 data 属性**

当前代码（约 line 688）：
```tsx
svgParts.push(`<g>`);
```

修改为：
```tsx
svgParts.push(`<g data-table-id="${element.location?.line || 'table'}">`);
```

- [ ] **Step 3: 验证渲染器改造**

手动测试：
1. 打开包含表格的 SolarWire 文件
2. 检查 SVG 中每个单元格 rect 是否有 data-cell-row、data-cell-col、data-cell-key 属性 ✓
3. 检查表格 g 是否有 data-table-id 属性 ✓

---

## Task 8: 单元格命中检测（画布内选中）

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementInteraction.ts`

**依赖:** Task 7

---

- [ ] **Step 1: 添加单元格点击检测逻辑**

在 `useElementInteraction.ts` 的 `handleMouseDown` 中，找到元素 ID 检测部分，添加单元格检测：

```tsx
// 在 getElementIdFromSVGElement 之后添加
const getCellKeyFromSVGElement = (target: SVGElement | HTMLElement): string | null => {
  let el: SVGElement | HTMLElement | null = target;
  while (el && el !== document.body) {
    const cellKey = el.getAttribute('data-cell-key');
    if (cellKey) return cellKey;
    el = el.parentElement;
  }
  return null;
};

// 在 handleMouseDown 函数中
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  // ...
  
  const target = e.target as SVGElement | HTMLElement;
  
  // 检查是否点击了表格单元格
  const cellKey = getCellKeyFromSVGElement(target);
  if (cellKey) {
    // 找到所属的表格元素
    let parentG = target;
    while (parentG && parentG.tagName !== 'g') {
      parentG = parentG.parentElement as SVGElement;
    }
    const tableId = parentG?.getAttribute('data-table-id');
    
    if (tableId && cellKey) {
      // 单元格选中逻辑
      const [row, col] = cellKey.split('-').map(Number);
      // TODO: 触发单元格选中状态（需要 Store 支持）
      return;
    }
  }
  
  // ... 其余逻辑
}, [...]);
```

- [ ] **Step 2: 在 previewStore 中添加单元格选中状态**

```tsx
// editor/src/app/stores/previewStore.ts

interface PreviewState {
  // ... existing
  selectedCellKey: string | null;
  setSelectedCellKey: (key: string | null) => void;
}

// 在 reducer 中添加
setSelectedCellKey: (key) => set({ selectedCellKey: key }),
```

- [ ] **Step 3: 验证命中检测**

1. 在画布中点击表格内某个单元格 → 触发单元格选中（高亮）✓
2. 双击单元格 → 打开 TableEditorModal 并定位到该单元格 ✓

---

## Task 9: 最终清理与验证

**Files:**
- Modify: 各文件最终清理
- 验证 Stage 2-4 全部功能

**依赖:** Task 1-8 全部完成

---

- [ ] **Step 1: TypeScript 编译检查**

```bash
cd editor
npx tsc --noEmit
```

修复所有类型错误。

- [ ] **Step 2: Vite 构建验证**

```bash
npm run build
```

确认无构建错误。

- [ ] **Step 3: 手动功能验证清单**

**Layer 1（属性面板）：**
1. ✓ 选择 Table 元素 → 显示 Table 分组（Border, Spacing）
2. ✓ 显示 Structure 概览（X rows × Y cols）
3. ✓ 点击"编辑表格" → 打开模态窗口

**Layer 2（模态窗口）：**
4. ✓ 网格正确显示所有行和列
5. ✓ 单击选中单元格（高亮边框）
6. ✓ 双击进入编辑模式
7. ✓ Enter 确认 / ESC 取消 / Tab 跳转
8. ✓ 添加/删除行和列
9. ✓ 选中单元格时右侧显示属性面板
10. ✓ 修改 Fill/Color/Size/Align 等 → 预览更新
11. ✓ 实时预览区域正确渲染
12. ✓ Ctrl+S 保存
13. ✓ 未保存关闭时提示确认
14. ✓ 保存后同步到画布

**渲染器改造（Stage 4）：**
15. ✓ 单元格 rect 有 data-cell-* 属性
16. ✓ 表格 g 有 data-table-id 属性
17. ✓ 画布点击单元格能触发选中

---

## 验收标准

Stage 2-4 完成的验收标准：

1. **属性面板表格部分**：表格特有属性编辑 + 概览 + 快捷入口
2. **模态窗口完整功能**：网格编辑 + 属性面板 + 实时预览 + 源码同步
3. **渲染器改造**：单元格 data 属性支持命中检测
4. **TypeScript 编译无错误**
5. **Vite 构建成功**
6. **手动功能验证清单全部通过**

---

## 附录：表格编辑器状态机

```
ModalState: closed | editing_cell | editing_row

closed ──[点击"编辑表格"]──→ editing_cell
editing_cell ──[双击单元格]──→ editing_cell (input mode)
editing_cell ──[点击行号]──→ editing_row
editing_row ──[点击单元格]──→ editing_cell
editing_* ──[点击"保存"]──→ closed (提交修改)
editing_* ──[ESC/取消]──→ closed (丢弃修改)
```
