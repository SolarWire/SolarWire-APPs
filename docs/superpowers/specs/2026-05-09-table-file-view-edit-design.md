# 表格文件查看与编辑功能设计

## 概述

在 SolarWire Editor 中增加对 CSV 和 Excel (.xlsx/.xls) 表格文件的查看与编辑支持。左侧文件视图不再过滤表格文件，右侧面板新增表格模式（TableMode），基于 Fortune-sheet 开源组件实现完整电子表格功能。

## 技术选型

| 组件 | 选型 | 版本 | 许可证 |
|---|---|---|---|
| 表格组件 | `@fortune-sheet/react` | ^1.0.3 | MIT |
| CSV 解析 | `papaparse` | ^5.4.1 | MIT |
| Excel 解析 | `xlsx` (SheetJS) | ^0.18.5 | Apache-2.0 |

选择 Fortune-sheet 的理由：
- React 原生组件，与项目 React 19 技术栈契合
- 开箱即用，内置公式引擎、多 Sheet、样式编辑、冻结、排序等
- MIT 许可无商业使用限制
- v1.0 已发布，API 趋于稳定

## 架构

```
┌──────────────────────────────────────────────────────────────┐
│                        AppLayout                              │
│  ┌─────────────┐                        ┌──────────────────┐ │
│  │  LeftPanel   │                        │    RightPanel     │ │
│  │  ┌─────────┐ │                        │  ┌──────────────┐ │ │
│  │  │FileTree │ │  点击表格文件 ──────▶  │  │ TableMode    │ │ │
│  │  │(含.csv  │ │                        │  │(Fortune-sheet│ │ │
│  │  │.xlsx等) │ │                        │  │ + CSV/Excel  │ │ │
│  │  └─────────┘ │                        │  │ 解析层)      │ │ │
│  └─────────────┘                        │  └──────────────┘ │ │
│                                          └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 变更清单

### 1. EditorMode 类型扩展

**文件：** `shared/types/editor.ts`

```ts
export type EditorMode = 'blank' | 'markdown' | 'solarwire' | 'image' | 'componentLibraryManager' | 'table';
```

### 2. 左侧面板：文件视图变更

**文件：** `components/editor/FileTree.tsx`

- `SUPPORTED_EXTENSIONS` 增加 `'csv'`, `'xlsx'`, `'xls'`
- `getIcon()` 增加表格文件图标映射：csv → 📊，xlsx/xls → 📗

### 3. fileStore.openFileAtPath 扩展

**文件：** `stores/fileStore.ts`

- 增加 `TABLE_EXTENSIONS` 集合：`new Set(['csv', 'xlsx', 'xls'])`
- 在 `openFileAtPath` 中识别表格文件扩展名，设置 mode 为 `'table'`
- 表格文件使用二进制方式读取（Excel），CSV 使用文本方式读取
- 新增 `selectedTableFile` 状态存储表格文件信息（路径、内容、格式）

### 4. RightPanel 增加 table 模式

**文件：** `components/layout/RightPanel.tsx`

```tsx
case 'table':
  return <TableMode key={modeKey} />;
```

### 5. 新增 TableMode 组件

**文件：** `components/editor-modes/TableMode.tsx` + `TableMode.css`

职责：
- 从 fileStore 获取当前选中的表格文件
- 根据文件扩展名选择适配器解析文件内容
- 渲染 Fortune-sheet `<Workbook>` 组件
- 处理编辑操作和保存

组件结构：
```tsx
function TableMode() {
  const { selectedFile, fullFileContent } = useFileStore();
  const [sheetData, setSheetData] = useState<WorkbookData[]>([]);

  // 解析文件内容为 Fortune-sheet 数据格式
  useEffect(() => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const adapter = getAdapter(ext);
    const data = adapter.parse(fullFileContent, selectedFile.name);
    setSheetData(data);
  }, [selectedFile?.path, fullFileContent]);

  // 保存时序列化回原格式
  const handleSave = () => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const adapter = getAdapter(ext);
    const content = adapter.serialize(sheetData);
    fileSystemService.writeFile(selectedFile.path, content);
  };

  return (
    <div className="table-mode">
      <Workbook
        data={sheetData}
        onChange={setSheetData}
      />
    </div>
  );
}
```

### 6. 文件适配层

**文件：** `shared/utils/table-file-adapters.ts`

```ts
interface TableFileAdapter {
  parse(content: Buffer | string, fileName: string): WorkbookData[];
  serialize(data: WorkbookData[]): Buffer | string;
}
```

**CsvAdapter：**
- 使用 `papaparse` 解析 CSV 文本
- 将每行每列数据映射为 Fortune-sheet 的 CellData 格式
- 序列化时将 CellData 转回 CSV 文本

**ExcelAdapter：**
- 使用 `xlsx` (SheetJS) 读取 Excel 文件
- 支持多 Sheet，每个 Sheet 映射为 Fortune-sheet 的一个 WorkbookData
- 保留单元格样式（字体、颜色、边框等）
- 序列化时将 WorkbookData 转回 Excel 二进制格式

### 7. 保存逻辑

- 表格文件的保存需要特殊处理，不能走通用的 `saveFile` 流程
- 在 `fileStore.saveFile` 中增加对 `mode === 'table'` 的分支处理
- 保存时从 TableMode 获取当前 Fortune-sheet 数据，通过适配器序列化回原格式

### 8. 新增依赖

```json
{
  "@fortune-sheet/react": "^1.0.3",
  "papaparse": "^5.4.1",
  "xlsx": "^0.18.5"
}
```

## 文件变更汇总

| 操作 | 文件 | 说明 |
|---|---|---|
| 修改 | `shared/types/editor.ts` | EditorMode 增加 `'table'` |
| 修改 | `components/editor/FileTree.tsx` | SUPPORTED_EXTENSIONS 增加表格扩展名 + 图标 |
| 修改 | `stores/fileStore.ts` | openFileAtPath 增加表格文件识别 + 保存逻辑 |
| 修改 | `components/layout/RightPanel.tsx` | switch 增加 `case 'table'` |
| 新增 | `components/editor-modes/TableMode.tsx` | 表格模式组件 |
| 新增 | `components/editor-modes/TableMode.css` | 表格模式样式 |
| 新增 | `shared/utils/table-file-adapters.ts` | CSV/Excel 文件适配器 |
| 新增 | `shared/utils/table-file-adapters.test.ts` | 适配器单元测试 |

## 风险与注意事项

1. **Fortune-sheet 与 React 19 兼容性** — 需验证 @fortune-sheet/react 1.0.3 是否完全兼容 React 19，可能需要 peer dependency 调整
2. **Excel 二进制文件读取** — Electron 环境下需要通过 Node.js API 读取二进制文件，不能使用浏览器的 FileReader
3. **大数据量性能** — DOM 渲染的 Fortune-sheet 在超大数据量时可能卡顿，桌面应用场景通常可接受
4. **样式保留** — Excel 文件的样式（字体、颜色、边框）在解析和序列化过程中可能部分丢失
