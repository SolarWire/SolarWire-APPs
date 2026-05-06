# 属性面板重构设计文档

## 1. 问题清单

### 功能 Bug

| # | 问题 | 位置 |
|---|------|------|
| 1 | Border ColorPicker 重复渲染（两次绑定 `handleChange('b')`) | PropertyPanel.tsx L474-488 + L499-506 |
| 2 | 阴影关闭时设置空字符串而非删除属性 | PropertyPanel.tsx L533-536 |
| 3 | ui/ColorPicker onClick 中 `e.button === 2` 永远不触发 | ui/ColorPicker.tsx L65-68 |
| 4 | handleTextResize 错误调用 setNoteTextareaHeight | PropertyPanel.tsx L213 |

### 交互体验问题

| # | 问题 |
|---|------|
| 5 | editor/ColorPicker 弹出位置每次渲染重新计算，滚动时不跟随 |
| 6 | ui/ColorPicker 下拉菜单 absolute 定位，滚动时消失 |
| 7 | 两个 ColorPicker 实现不统一 |
| 8 | 弹出框无动画 |
| 9 | 无 HEX 输入框（ui/ColorPicker.css 有样式但未使用） |

### 代码质量问题

| # | 问题 |
|---|------|
| 10 | PropertyPanel.tsx 739 行，包含 3 个子组件，违反 SRP |
| 11 | editor/ColorPicker.css 硬编码颜色，暗色主题异常 |
| 12 | image Browse 按钮内联样式 |
| 13 | PropertyPanel.css 中有 ColorPicker 的样式（应独立） |

## 2. 设计目标

1. 统一 ColorPicker 为全新组件，集成 HEX 输入 + 预设颜色 + 动画 + 边界检测
2. 拆分 PropertyPanel 为独立子组件
3. 修复所有功能 Bug
4. 消除硬编码颜色和内联样式

## 3. ColorPicker 全新设计

### 3.1 组件结构

```
ColorPicker (单一组件，替代 editor/ 和 ui/ 两个版本)
├── 颜色预览块 (点击打开原生取色器)
├── HEX 输入框 (直接输入颜色值)
├── 预设按钮 ▼ (点击展开预设面板)
└── 预设面板 (createPortal + fixed 定位)
    ├── 预设颜色网格
    ├── 添加当前颜色
    └── 重置默认
```

### 3.2 API

```typescript
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}
```

与现有接口完全一致，确保零改动替换。

### 3.3 交互设计

- **颜色预览块**：28×28px 色块，点击打开原生 `<input type="color">`
- **HEX 输入框**：紧邻色块，显示当前 HEX 值，可直接编辑，失焦时校验格式
- **预设按钮**：▼ 图标，点击展开预设面板
- **预设面板**：
  - 使用 `createPortal` 渲染到 `document.body`
  - `position: fixed` + 边界检测（上下左右溢出时自动调整）
  - 位置在打开时计算一次，不随渲染重新计算
  - 点击外部关闭
  - slideDown 动画（0.15s ease）
- **预设颜色**：5 列网格，点击选色，右键删除
- **添加当前颜色**：按钮，将当前颜色加入预设
- **重置默认**：按钮，恢复默认预设

### 3.4 样式

全部使用 CSS 变量，不硬编码颜色：
- 背景：`var(--bg-secondary)`
- 边框：`var(--border-color)`
- 文本：`var(--text-primary)` / `var(--text-muted)`
- 悬停：`var(--bg-hover)` / `var(--accent-color)`

### 3.5 文件位置

```
components/ui/ColorPicker.tsx   ← 统一组件
components/ui/ColorPicker.css   ← 统一样式
```

删除：
- `components/editor/ColorPicker.tsx`
- `components/editor/ColorPicker.css`

## 4. PropertyPanel 拆分

### 4.1 拆分方案

| 组件 | 文件 | 职责 |
|------|------|------|
| PropertyRow | components/editor/property/PropertyRow.tsx | 单属性行 |
| PropertyPair | components/editor/property/PropertyPair.tsx | 双属性并排行 |
| PropertyGroupTitle | components/editor/property/PropertyGroupTitle.tsx | 分组标题 |
| ShadowEditor | components/editor/property/ShadowEditor.tsx | 阴影编辑器（含启用/参数/颜色） |
| PropertyPanel | components/editor/PropertyPanel.tsx | 主面板（精简后） |

### 4.2 ShadowEditor 设计

```typescript
interface ShadowEditorProps {
  attrs: Record<string, string>;
  onChange: (property: string, value: string | number | boolean) => void;
}
```

包含：
- 启用复选框
- X/Y 偏移（PropertyPair）
- 模糊半径（PropertyRow）
- 阴影颜色（ColorPicker）

关闭时使用 `handleChange('shadow-x', undefined)` 删除属性而非设置空字符串。

### 4.3 PropertyPanel 精简后

主组件只负责：
- 读取 store 数据
- 解析 element 属性
- 组合子组件渲染

## 5. Bug 修复

### 5.1 Border ColorPicker 重复

移除 L499-506 的重复 Border ColorPicker（保留 L484 的那个）。

### 5.2 阴影关闭时删除属性

`updateLineAttribute` 需要支持 `undefined` 值表示删除属性。关闭阴影时：

```typescript
handleChange('shadow-enabled', false);
handleChange('shadow-x', undefined);
handleChange('shadow-y', undefined);
handleChange('shadow-blur', undefined);
handleChange('shadow-color', undefined);
```

### 5.3 handleTextResize 回调修复

```typescript
const handleTextResize = useCallback(() => {
  if (textTextareaRef.current) {
    setNoteTextareaHeight(textTextareaRef.current.offsetHeight);
  }
}, []);
```

改为使用独立的 textTextareaHeight state（或统一为通用高度）。

### 5.4 image Browse 按钮样式

移除内联样式，使用 CSS 类。

## 6. 废弃清单

| 文件 | 处理方式 |
|------|----------|
| `components/editor/ColorPicker.tsx` | 删除 |
| `components/editor/ColorPicker.css` | 删除 |
| `components/ui/ColorPicker.tsx` | 重写 |
| `components/ui/ColorPicker.css` | 重写 |
| `components/editor/PropertyPanel.tsx` | 精简 |
| `components/editor/PropertyPanel.css` | 清理 ColorPicker 样式 |

## 7. 新建文件

| 文件 | 职责 |
|------|------|
| `components/editor/property/PropertyRow.tsx` | 属性行组件 |
| `components/editor/property/PropertyPair.tsx` | 双属性并排组件 |
| `components/editor/property/PropertyGroupTitle.tsx` | 分组标题组件 |
| `components/editor/property/ShadowEditor.tsx` | 阴影编辑器组件 |
| `components/editor/property/ShadowEditor.css` | 阴影编辑器样式 |

## 8. 迁移计划

### Phase 1: 全新 ColorPicker

1. 重写 `components/ui/ColorPicker.tsx` + `.css`
2. 删除 `components/editor/ColorPicker.tsx` + `.css`
3. 更新 PropertyPanel 的 import
4. 从 PropertyPanel.css 移除 ColorPicker 样式

### Phase 2: 拆分 PropertyPanel 子组件

1. 创建 `property/PropertyRow.tsx`
2. 创建 `property/PropertyPair.tsx`
3. 创建 `property/PropertyGroupTitle.tsx`
4. 创建 `property/ShadowEditor.tsx` + `.css`
5. 精简 PropertyPanel.tsx

### Phase 3: Bug 修复

1. 移除重复 Border ColorPicker
2. 修复阴影关闭逻辑
3. 修复 handleTextResize 回调
4. 移除 image Browse 内联样式

### Phase 4: 验证

1. TypeScript 编译检查
2. Vite 构建验证
3. 功能验证：颜色选择、阴影编辑、属性修改
