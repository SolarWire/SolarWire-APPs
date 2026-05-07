# 属性面板重构 + 表格编辑器设计文档

| 元信息 | 内容 |
|--------|------|
| 版本 | v1.0 |
| 日期 | 2026-05-07 |
| 状态 | 草稿 |
| 负责人 | — |
| 涉及子系统 | 属性面板重构、表格编辑器 |

---

## 目录

1. [背景与目标](#1-背景与目标)
2. [问题总览](#2-问题总览)
3. [子系统一：属性面板重构](#3-子系统一属性面板重构)
4. [子系统二：表格编辑器](#4-子系统二表格编辑器)
5. [实施计划](#5-实施计划)
6. [废弃清单](#6-废弃清单)
7. [新建文件清单](#7-新建文件清单)

---

## 1. 背景与目标

SolarWire 可视化编辑器的属性面板存在三类问题：

1. **功能缺陷**：Line/Placeholder/Table 等元素类型缺少必要的属性编辑控件，或控件与实际渲染器行为不一致。
2. **代码质量问题**：两个 ColorPicker 实现不统一、属性名映射不透明、组件职责不清。
3. **功能缺失**：Table 元素（SolarWire 中结构最复杂的类型）完全没有可视化编辑支持。

本次重构的目标是：
- 修复所有已发现的 17 个功能缺陷
- 建立统一的属性展示规范（属性名双层显示 + Tooltip 学习系统）
- 实现表格元素的可视化编辑能力
- 为未来画布内编辑奠定基础

---

## 2. 问题总览

### 2.1 严重问题（功能缺陷）

| # | 问题描述 | 影响 | 修复方案 |
|---|----------|------|----------|
| P1 | Line 元素 Fill ColorPicker 修改 `bg` 属性，但渲染器使用 `c` | Line 颜色修改无效 | Line 的 Fill 改为 `handleChange('c', color)` |
| P2 | Line 元素缺少线宽控制（渲染器支持 `s`） | 无法调整线宽 | 在 Line Appearance 区添加 Width 控件 |
| P3 | Line 元素缺少标签颜色控制（`text-color`） | 无法调整标签颜色 | 添加 text-color 属性编辑 |
| P4 | Placeholder 元素显示 Shadow 区，但渲染器不支持 | 用户困惑 | Shadow 区按元素类型条件显示 |
| P5 | Table 元素无任何可视化编辑能力 | 表格无法编辑 | 见子系统二 |
| P6 | Bold/Italic 判断逻辑不一致（面板用 `=== 'true'`，渲染器用 key 存在判断） | 裸 `bold` 属性面板不激活但渲染生效 | 统一使用 key 存在判断 |

### 2.2 中等问题（交互/逻辑缺陷）

| # | 问题描述 | 影响 | 修复方案 |
|---|----------|------|----------|
| P7 | Shadow 区对 Line/Placeholder 也显示 | 视觉误导 | 按元素类型条件显示 |
| P8 | Line Height / Letter Spacing 在 Text 分组外部 | 视觉结构混乱 | 移入 Text 分组内部 |
| P9 | 5 个 Padding 控件全部展开 | 占用大量空间 | 相同时折叠，点击解锁展开 |
| P10 | 多选元素时无编辑能力 | 无法批量操作 | 添加多选批量编辑 |
| P11 | Note/Text textarea 高度使用全局状态 | 切换元素时高度错乱 | 改为组件内部 state |
| P12 | useEffect 依赖数组不完整 | 潜在 bug | 补全依赖 |

### 2.3 轻微问题（体验优化）

| # | 问题描述 | 修复方案 |
|---|----------|----------|
| P13 | Image 的 Fill（bg）语义不清 | Image 使用独立语义标签 |
| P14 | 属性名映射不直观 | 属性名双层显示 + Tooltip |
| P15 | 无属性重置/删除功能 | 提供快捷操作 |
| P16 | 无输入验证反馈 | 添加校验提示 |
| P17 | 已有设计文档中的 Bug 仍未修复 | 本次一并修复 |

---

## 3. 子系统一：属性面板重构

### 3.1 属性名双层显示 + Tooltip 系统

#### 3.1.1 视觉规范

每个属性行的标签由两部分组成：

```
┌──────────────────────────────────────┐
│  Fill (bg)        [色块] [hex input] │
│  Border (b)       [色块] [hex input] │
│  Width (s)        [____40____]      │
└──────────────────────────────────────┘
```

- **主文本**（`Fill`）：用户友好的可读名称
- **次要文本**（`(bg)`）：代码属性名，灰色，小号，括号包裹
- 两者之间留有适当间距（4px）

#### 3.1.2 Tooltip 内容规范

鼠标悬停属性标签 300ms 后显示 Tooltip：

```
┌─────────────────────────────────────┐
│ bg                                  │  ← 代码属性名（加粗）
│                                     │
│ SolarWire 语法:                      │  ← 小标题
│ bg=#ffffff                          │  ← 代码示例
│                                     │
│ 背景填充颜色。                       │  ← 属性说明
│ 支持: rectangle, circle, placeholder│  ← 支持元素
└─────────────────────────────────────┘
```

**Tooltip 样式规范**：
- 背景：`var(--bg-tooltip, #1e1e1e)`
- 文字：`var(--text-tooltip, #d4d4d4)`
- 圆角：6px
- 投影：`0 2px 8px rgba(0,0,0,0.3)`
- 最大宽度：280px
- 内边距：10px 12px
- 出现时机：hover 300ms 后（避免鼠标经过时闪烁）
- 出现位置：优先右侧，右侧空间不足时切换左侧，始终保持在视口内
- 关闭时机：鼠标离开或失去焦点
- 键盘支持：属性名支持 focus，显示 Tooltip

#### 3.1.3 属性名映射表

| 面板显示 | 代码属性 | SolarWire 示例 | Tooltip 说明 |
|----------|----------|----------------|--------------|
| Fill | bg | `bg=#ffffff` | 背景填充颜色 |
| Border | b | `b=#333333` | 边框颜色 |
| Width | s | `s=2` | 边框/线条宽度 |
| Color | c | `c=#000000` | 文字或线条颜色 |
| Size | size | `size=14` | 字体大小 |
| Opacity | opacity | `opacity=0.8` | 透明度（0-1） |
| Padding | padding | `padding=8` | 内边距（所有方向） |
| P-T / P-R / P-B / P-L | padding-top / padding-right / padding-bottom / padding-left | `padding-top=4` | 各个方向的内边距 |
| R | r | `r=8` | 矩形圆角半径 |
| Align | align | `align=l\|c\|r` | 水平对齐方式 |
| V-Align | vertical-align | `vertical-align=t\|m\|b` | 垂直对齐方式 |
| Line Height | line-height | `line-height=22` | 文本行高 |
| Letter Spacing | letter-spacing | `letter-spacing=1` | 字符间距 |
| Style | style | `style=solid\|dashed\|dotted` | 线条样式（仅 Line） |
| Label | label | `label="text"` | 线条标签文字 |
| Label Color | text-color | `text-color=#ff0000` | 标签文字颜色（仅 Line） |
| URL | url | `url=image.png` | 图片资源路径 |
| Border | border | `border=1` | 表格边框宽度（仅 Table） |
| Spacing | cellspacing | `cellspacing=2` | 单元格间距（仅 Table） |

### 3.2 元素类型支持矩阵

每个属性控件按元素类型条件渲染，不再无条件显示：

| 属性控件 | 显示条件 | 对应代码属性 |
|----------|----------|--------------|
| Fill (bg) | 非 line | bg |
| Border (b) | 非 line, 非 text | b |
| Width (s) | 非 text | s |
| Opacity | rectangle, circle, text, image | opacity |
| Shadow | rectangle, circle, text, image | shadow-* |
| Line Style | line | style |
| Line Label | line | label |
| Line Color | line | c |
| Label Color (text-color) | line | text-color |
| URL | image | url |
| R (圆角) | rectangle | r |
| Padding 相关 | rectangle, circle, placeholder | padding-* |

**Shadow 区显示条件**：rectangle, circle, text, image（排除 line 和 placeholder）

### 3.3 ColorPicker 统一重构

合并 `editor/ColorPicker` 和 `ui/ColorPicker` 为单一组件。

#### 3.3.1 组件结构

```
ColorPicker
├── 颜色预览块 (28×28px，点击打开原生取色器)
├── HEX 输入框 (可编辑，失焦校验)
└── 预设按钮 ▼ (点击展开预设面板)
    └── 预设面板 (createPortal + fixed 定位 + 边界检测)
        ├── 预设颜色网格（8列）
        ├── 添加当前颜色按钮
        └── 重置默认按钮
```

#### 3.3.2 交互规范

- **预设面板位置**：使用 `createPortal` 渲染到 `document.body`，`position: fixed`
- **边界检测**：打开时计算位置，若溢出视口则自动调整（左/右/上/下）
- **动画**：slideDown 0.15s ease
- **关闭**：点击面板外部 / ESC 键 / 再次点击触发元素
- **预设颜色**：8 列网格，右键删除某预设色
- **HEX 校验**：失焦时检查 `#RRGGBB` 或 `RRGGBB` 格式，无效时回退到上一个有效值

#### 3.3.3 文件位置

```
components/ui/ColorPicker.tsx   ← 统一组件
components/ui/ColorPicker.css  ← 统一样式
```

**删除**：
- `components/editor/ColorPicker.tsx`
- `components/editor/ColorPicker.css`

### 3.4 Padding 控件折叠机制

当 padding-top、padding-right、padding-bottom、padding-left 四个值相同时：

```
┌──────────────────────────────────────┐
│ Padding  [____8____]  [🔓]          │  ← 折叠状态，点击🔓展开
└──────────────────────────────────────┘
```

点击解锁图标后展开为四个独立控件：

```
┌──────────────────────────────────────┐
│ P-T  [____8____]  [🔒]              │
│ P-R  [____8____]                    │
│ P-B  [____8____]                    │
│ P-L  [____8____]                    │
└──────────────────────────────────────┘
```

用户修改任意方向的值后，若四个值再次相同，自动回退到折叠状态。

### 3.5 多选批量编辑

多选元素时，属性面板显示共有属性：

| 场景 | 显示 | 编辑行为 |
|------|------|----------|
| 所有选中元素某属性值相同 | 显示该值 | 修改同步到所有选中元素 |
| 选中元素某属性值不同 | 显示"混合"标识（灰色） | 修改同步到所有选中元素 |
| 某属性不是所有元素都支持 | 隐藏该控件 | — |

**支持批量编辑的属性**：Position (x, y), Size (w, h), Fill, Border, Opacity

### 3.6 组件拆分

| 组件 | 文件 | 职责 |
|------|------|------|
| PropertyRow | components/editor/property/PropertyRow.tsx | 单属性行（含双层标签 + tooltip） |
| PropertyPair | components/editor/property/PropertyPair.tsx | 双属性并排 |
| PropertyGroupTitle | components/editor/property/PropertyGroupTitle.tsx | 分组标题（可折叠） |
| ShadowEditor | components/editor/property/ShadowEditor.tsx | 阴影编辑器 |
| PaddingEditor | components/editor/property/PaddingEditor.tsx | Padding 编辑器（折叠联动） |
| PropertyTooltip | components/editor/property/PropertyTooltip.tsx | Tooltip 浮层 |
| ColorPicker | components/ui/ColorPicker.tsx | 统一颜色选择器 |
| PropertyPanel | components/editor/PropertyPanel.tsx | 主面板（精简后） |

---

## 4. 子系统二：表格编辑器

### 4.1 分层编辑架构

表格编辑采用双层架构，满足不同深度的编辑需求：

```
Layer 1: 属性面板（始终可用）
│
└── Layer 2: 模态窗口（深度编辑）

    ┌─ 左侧：网格编辑区 ──────────────┐
    │  类 Excel 表格网格              │
    │  单元格双击编辑文本             │
    │  行/列选中高亮                  │
    │  行首/列首选择器                │
    │  添加/删除行/列按钮             │
    └─────────────────────────────────┘

    ┌─ 右侧：属性面板 ────────────────┐
    │  选中单元格/行列的属性           │
    │  bg, c, size, bold 等          │
    └─────────────────────────────────┘

    ┌─ 底部：实时预览 ────────────────┐
    │  SVG 渲染实时更新               │
    └─────────────────────────────────┘
```

### 4.2 Layer 1：属性面板表格部分

当选中 Table 元素时，属性面板显示：

```
┌─────────────────────────────────────┐
│ Table                               │  ← 元素类型标题
├─────────────────────────────────────┤
│ Position                            │
│   X  [________100________]          │
│   Y  [________200________]          │
├─────────────────────────────────────┤
│ Size                                │
│   W  [________600________]          │
│   H  [________200________]          │
├─────────────────────────────────────┤
│ Table                               │
│   Border  [________1________]       │  ← 表格边框宽度
│   Spacing [________2________]      │  ← 单元格间距
├─────────────────────────────────────┤
│ Structure                           │
│   3 rows × 4 cols                  │  ← 概览信息（只读）
├─────────────────────────────────────┤
│ Appearance                          │
│   Fill  [色块] [hex]                │  ← 表格背景色
│   Border [色块] [hex]               │  ← 边框颜色
├─────────────────────────────────────┤
│ Note                                │
│   [textarea...]                     │
├─────────────────────────────────────┤
│           [编辑表格]                 │  ← 打开模态窗口
└─────────────────────────────────────┘
```

**不支持在属性面板直接编辑的内容**：
- 行/列的结构（添加/删除/重排）
- 单元格内容
- 单元格级属性（每个单元格的 bg/c/size 等）
- 合并单元格（colspan/rowspan）

### 4.3 Layer 2：模态窗口

#### 4.3.1 窗口布局

```
┌──────────────────────────────────────────────────────────────────┐
│  编辑表格                                              [×] 关闭   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────┐  ┌────────────────┐ │
│  │ + │ A      │ B      │ C      │ D      │  │ Cell Properties │ │
│  │───┼────────┼────────┼────────┼────────│  │                │ │
│  │ 1 │ Cell   │ Cell   │ Cell   │ Cell   │  │ Fill   [色块]  │ │
│  │   │ A1     │ B1     │ C1     │ D1     │  │ Border [色块]  │ │
│  │   │        │        │        │        │  │ Size   [__14]  │ │
│  │   │        │        │        │        │  │ Align [▼ c  ▼] │ │
│  │   │        │        │        │        │  │ Bold  [  B  ]  │ │
│  │   │        │        │        │        │  │ Italic [  I  ]  │ │
│  ├───┼────────┼────────┼────────┼────────│  │                │ │
│  │ 2 │ Cell   │ [选中] │ Cell   │ Cell   │  │ [Reset Cell]   │ │
│  │   │ A2     │ B2     │ C2     │ D2     │  └────────────────┘ │
│  ├───┼────────┼────────┼────────┼────────│                    │
│  │ 3 │ Cell   │ Cell   │ Cell   │ Cell   │                    │
│  │   │ A3     │ B3     │ C3     │ D3     │                    │
│  └───┴────────┴────────┴────────┴────────┘                    │
│                                                                  │
│  [添加行] [删除行] [添加列] [删除列]          [保存] [取消]      │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 网格编辑区规范

**单元格编辑**：
- 单击选中单元格（高亮边框）
- 双击进入文本编辑模式
- Enter 确认输入
- ESC 取消输入
- Tab 跳转到下一单元格
- Shift+Tab 跳转到上一单元格

**行列操作**：
- 行号/列标处悬停显示快捷按钮
- 右键菜单：插入行/列、删除行/列
- 拖拽行号可重排行顺序
- 拖拽列标可调整列宽

**选中状态**：
- 单单元格选中：浅蓝色边框
- 多单元格选中（Shift+点击）：多个单元格同时选中
- 行/列全选：点击行号/列标

#### 4.3.3 属性侧栏规范

当选中单元格时，右侧属性面板显示：
- **Fill (bg)**：单元格背景色
- **Border (b)**：单元格边框颜色
- **Width (s)**：单元格边框宽度
- **Color (c)**：单元格文字颜色
- **Size (size)**：字体大小
- **Align**：水平对齐（l/c/r）
- **V-Align**：垂直对齐（t/m/b）
- **Bold**：加粗开关
- **Italic**：斜体开关

**Row Properties**：选中整行时，属性面板显示行级属性（行级 bg/c/size 等），单元格继承行级设置。

#### 4.3.4 实时预览

底部区域显示表格的 SVG 渲染预览：
- 修改后 150ms 防抖更新
- 预览区域可折叠/展开
- 预览区域高度固定为 200px

#### 4.3.5 模态窗口交互规范

- **打开方式**：
  - 属性面板点击"编辑表格"按钮
  - 画布中双击表格元素（需要 Phase 2 渲染器支持）
- **关闭方式**：ESC 键 / 点击遮罩层 / 点击"取消"按钮
- **保存方式**：点击"保存"按钮或 Ctrl+S
- **数据同步**：修改实时反映到源码，保存时整体提交
- **取消处理**：未保存的修改在关闭时提示确认

### 4.4 渲染器改造（Phase 2 前置）

为支持画布内选中单元格，需要改造渲染器为表格单元格添加独立标识：

**改动点**（`renderer/elements/otherElements.ts`）：
```typescript
// 单元格渲染时添加 data 属性
svgParts.push(`<g data-element-id="${id}" data-cell-row="${rowIndex}" data-cell-col="${colIndex}">`);
```

每个单元格通过 `data-element-id`、`data-cell-row`、`data-cell-col` 标识，支持画布点击命中检测。

### 4.5 Stage 与 Phase 对应关系

| Stage（交付阶段） | 覆盖表格演进 Phase | 优先级 |
|-------------------|-------------------|--------|
| Stage 1A-1D | 属性面板重构（P1-P17 修复） | P0 |
| Stage 2 | 表格编辑器 Layer 1 | P0 |
| Stage 3 | 表格编辑器 Layer 2 | P0 |
| Stage 4 | 表格演进 Phase 2（渲染器改造） | P1 |
| 后续 | 表格演进 Phase 3-4（画布内编辑） | P2 |

**Phase 演进路径**：

| Phase | 交付内容 | 前置依赖 | 优先级 |
|-------|----------|----------|--------|
| Phase 1 | 属性面板表格属性 + 基础模态窗口（结构+文本编辑） | 无 | P0 |
| Phase 2 | 渲染器为单元格添加独立 data 属性 | Stage 4 | P1 |
| Phase 3 | 画布内点击选中单元格（高亮） | Phase 2 | P2 |
| Phase 4 | 画布内双击直接编辑文本 | Phase 3 | P2 |

---

## 5. 实施计划

> **术语说明**：实施计划中使用 "Stage" 前缀（如 Stage 1A）与表格演进路径中的 "Phase"（Phase 1-4）区分。Stage 是交付阶段，Phase 是表格编辑器能力演进阶段。

### Stage 1A: ColorPicker 统一 + Tooltip 系统

**目标**：统一 ColorPicker 组件，建立 Tooltip 系统

1. 重写 `components/ui/ColorPicker.tsx` + `.css`
2. 删除 `components/editor/ColorPicker.tsx` + `.css`
3. 创建 `components/editor/property/PropertyTooltip.tsx`
4. 更新 PropertyPanel 中所有 ColorPicker 的 import
5. 从 PropertyPanel.css 移除 ColorPicker 样式

**验证**：选择颜色、预设面板打开/关闭、边界检测

### Stage 1B: 属性控件修复

**目标**：修复 P1-P4, P6-P9, P12, P17

1. 创建 `components/editor/property/PaddingEditor.tsx`（折叠联动）
2. 更新 `PropertyRow` / `PropertyPair` 支持双层标签
3. 更新 `useElementProps` 统一布尔属性判断
4. 修复 ShadowEditor 显示条件
5. 移动 Line Height / Letter Spacing 到 Text 分组内
6. 修复 `useEffect` 依赖数组
7. 将 textarea 高度改为组件内部 state

### Stage 1C: 组件拆分

**目标**：拆分 PropertyPanel，遵循 SRP

1. 确认 `PropertyRow.tsx`、`PropertyPair.tsx`、`PropertyGroupTitle.tsx` 已独立
2. 创建 `ShadowEditor.tsx`（确认文件存在，更新逻辑）
3. 创建 `PaddingEditor.tsx`
4. 创建 `PropertyTooltip.tsx`
5. 精简 `PropertyPanel.tsx`

### Stage 1D: 多选批量编辑

**目标**：实现多选元素时的批量属性编辑

1. 扩展 `useElementProps` 支持多元素
2. 修改 PropertyPanel 多选状态分支
3. 实现批量更新逻辑

### Stage 2: 表格编辑器 Layer 1

**目标**：属性面板支持表格级属性编辑

1. 在 PropertyPanel 中添加 Table 元素类型的属性分组
2. 添加表格结构概览（行×列）
3. 添加"编辑表格"按钮

### Stage 3: 表格编辑器 Layer 2

**目标**：实现完整的表格模态编辑器

1. 创建 `TableEditorModal.tsx` 模态窗口
2. 实现网格编辑组件
3. 实现单元格选择和编辑逻辑
4. 实现行列添加/删除操作
5. 实现右侧属性面板
6. 实现实时预览
7. 实现源码同步保存

### Stage 4: 渲染器改造（表格演进 Phase 2 前置）

**目标**：为表格单元格添加独立标识

1. 修改 `renderTableElement` 为每个单元格添加 data 属性
2. 添加单元格的命中检测支持

---

## 6. 废弃清单

| 文件 | 处理方式 |
|------|----------|
| `components/editor/ColorPicker.tsx` | 删除 |
| `components/editor/ColorPicker.css` | 删除 |
| `components/ui/ColorPicker.tsx` | 重写 |
| `components/ui/ColorPicker.css` | 重写 |
| `components/editor/PropertyPanel.tsx` | 精简 |
| `components/editor/PropertyPanel.css` | 清理 ColorPicker 样式 |

---

## 7. 新建文件清单

| 文件 | 职责 | Phase |
|------|------|-------|
| `components/editor/property/PropertyTooltip.tsx` | 属性 tooltip 浮层组件 | 1A |
| `components/editor/property/PaddingEditor.tsx` | Padding 编辑器（折叠联动） | 1B |
| `components/editor/property/PaddingEditor.css` | Padding 编辑器样式 | 1B |
| `components/ui/ColorPicker.tsx` | 统一 ColorPicker（重写） | 1A |
| `components/ui/ColorPicker.css` | ColorPicker 样式（重写） | 1A |
| `components/editor/TableEditorModal.tsx` | 表格编辑器模态窗口 | 3 |
| `components/editor/TableEditorModal.css` | 模态窗口样式 | 3 |
| `components/editor/TableGrid.tsx` | 表格网格编辑组件 | 3 |
| `components/editor/CellProperties.tsx` | 单元格属性面板 | 3 |

---

## 附录 A：属性名 Tooltip 内容定义

| 代码属性 | 说明 | SolarWire 示例 | 支持元素 |
|----------|------|----------------|----------|
| bg | 背景填充颜色 | `bg=#ffffff` | rectangle, circle, placeholder, image |
| b | 边框颜色 | `b=#333333` | rectangle, circle, placeholder, image, table |
| s | 边框/线条宽度 | `s=2` | rectangle, circle, placeholder, image, line |
| c | 文字或线条颜色 | `c=#000000` | rectangle, circle, text, placeholder, line |
| size | 字体大小 | `size=14` | rectangle, circle, text, placeholder |
| text-size | 字体大小（别名） | `text-size=14` | 同 size |
| align | 水平对齐 | `align=l` (左) / `c` (中) / `r` (右) | rectangle, circle, text, placeholder |
| vertical-align | 垂直对齐 | `vertical-align=t` (上) / `m` (中) / `b` (下) | rectangle, circle, placeholder |
| bold | 加粗 | `bold` | rectangle, circle, text, placeholder |
| italic | 斜体 | `italic` | rectangle, circle, text, placeholder |
| text-decoration | 文字装饰 | `text-decoration=underline` | rectangle, circle, text, placeholder |
| opacity | 透明度 | `opacity=0.8` | rectangle, circle, text, image |
| padding | 内边距 | `padding=8` | rectangle, circle, placeholder |
| padding-top | 上内边距 | `padding-top=4` | rectangle, circle, placeholder |
| padding-right | 右内边距 | `padding-right=4` | rectangle, circle, placeholder |
| padding-bottom | 下内边距 | `padding-bottom=4` | rectangle, circle, placeholder |
| padding-left | 左内边距 | `padding-left=4` | rectangle, circle, placeholder |
| r | 圆角半径 | `r=8` | rectangle |
| line-height | 行高 | `line-height=22` | rectangle, circle, text, placeholder |
| letter-spacing | 字间距 | `letter-spacing=1` | rectangle, circle, text, placeholder |
| shadow-enabled | 启用阴影 | `shadow-enabled` | rectangle, circle, text, image |
| shadow-x | 阴影 X 偏移 | `shadow-x=2` | rectangle, circle, text, image |
| shadow-y | 阴影 Y 偏移 | `shadow-y=2` | rectangle, circle, text, image |
| shadow-blur | 阴影模糊半径 | `shadow-blur=4` | rectangle, circle, text, image |
| shadow-color | 阴影颜色 | `shadow-color=#000000` | rectangle, circle, text, image |
| style | 线条样式 | `style=dashed` | line |
| label | 线条标签 | `label="text"` | line |
| text-color | 标签文字颜色 | `text-color=#ff0000` | line |
| url | 图片路径 | `url=image.png` | image |
| border | 表格边框宽度 | `border=1` | table |
| cellspacing | 单元格间距 | `cellspacing=2` | table |
| colspan | 列合并 | `colspan=2` | table-cell |
| rowspan | 行合并 | `rowspan=2` | table-cell |

---

## 附录 B：模态窗口状态机

```
ModalState: closed | editing_cell | editing_row | editing_col

closed ──[点击"编辑表格"]──→ editing_cell
editing_cell ──[双击单元格]──→ input_mode
editing_cell ──[点击行号]──→ editing_row
editing_cell ──[点击列标]──→ editing_col
input_mode ──[Enter/Esc]──→ editing_cell
editing_row ──[点击单元格]──→ editing_cell
editing_col ──[点击单元格]──→ editing_cell
editing_* ──[点击"保存"]──→ closed (提交修改)
editing_* ──[ESC/取消]──→ closed (丢弃修改)
```

---

## 附录 C：渲染器改造细节

### C.1 单元格 data 属性

修改 `renderTableCells` 函数（`otherElements.ts`）：

```typescript
// 为每个单元格添加 data 属性
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
/>`);
```

### C.2 命中检测逻辑

修改 `useElementInteraction.ts` 中的命中检测逻辑，支持表格单元格点击：

```typescript
// 检查是否点击了表格单元格
const cellRow = target.getAttribute('data-cell-row');
const cellCol = target.getAttribute('data-cell-col');
if (cellRow !== null && cellCol !== null) {
  // 查找对应的 table 和 table-row 元素
  // 获取单元格在源码中的位置
  // 返回单元格路径: { tableLine, rowIndex, colIndex }
}
```
