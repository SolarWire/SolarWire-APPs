# SolarWire Editor 设计与视觉规范

> **文档版本**: v1.0
> **创建日期**: 2026-04-20
> **适用范围**: SolarWire Editor 编辑器全模块

---

## 一、设计原则

### 1.1 核心设计理念

| 原则 | 说明 |
|------|------|
| **专业效率工具定位** | 面向产品经理和开发者的专业线框图编辑工具，追求高效、精确、可信赖的编辑体验 |
| **双模式编辑统一** | 代码编辑与可视化编辑无缝切换，底层数据同源，视觉风格统一 |
| **暗色主题优先** | 默认暗色主题，灵感来自专业 IDE（VS Code），长时间使用不易疲劳 |
| **一致性高于一切** | 所有组件、交互、样式遵循统一规范，降低认知负担 |
| **渐进式复杂度** | 基础功能开箱即用，高级功能按需展开，不干扰核心工作流 |

### 1.2 设计参照

- **布局范式**: VS Code / JetBrains 系列 IDE
- **视觉风格**: 暗色专业编辑器，主色暖橙色点缀
- **交互模式**: 图形设计工具（Figma/Sketch）的画布操作体验

---

## 二、色彩系统

### 2.1 主色调（Accent Color）

**主色**: `#FCA506`（暖橙色）

| 用途 | CSS 变量 | 色值 | 说明 |
|------|----------|------|------|
| 主色基础 | `--accent-color` | `#FCA506` | 按钮、高亮、强调文本、选中态 |
| 主色悬浮 | `--accent-hover` | `#e89700` | 按钮 hover 态 |
| 主色 10% | `--accent-opacity-10` | `color-mix(in srgb, var(--accent-color) 10%, transparent)` | 背景点缀、Toast |
| 主色 15% | `--accent-opacity-15` | 同上 15% | 卡片选中边框、悬浮背景 |
| 主色 35% | `--accent-opacity-35` | 同上 35% | 工具栏激活态 |
| 主色 50% | `--accent-opacity-50` | 同上 50% | 分隔线、边框 |
| 主色浅色 | `--accent-light` | `color-mix(in srgb, var(--accent-color) 15%, white)` | 亮面派生色 |

### 2.2 暗色主题（默认）

| 类别 | CSS 变量 | 色值 | 用途 |
|------|----------|------|------|
| **背景** |
| 一级背景 | `--bg-primary` | `#1e1e1e` | 应用主背景、画布背景 |
| 二级背景 | `--bg-secondary` | `#252526` | 面板背景、Tab 激活背景 |
| 三级背景 | `--bg-tertiary` | `#2d2d2d` | 顶部栏、输入框背景 |
| 悬浮背景 | `--bg-hover` | `#3d3d3d` | 元素 hover 态 |
| 选中背景 | `--bg-selected` | `#0e639c` | 元素/文件选中态（蓝色） |
| **文本** |
| 一级文本 | `--text-primary` | `#ffffff` | 标题、主内容文本 |
| 二级文本 | `--text-secondary` | `#cccccc` | 副标题、次要信息 |
| 弱化文本 | `--text-muted` | `#888888` | 占位符、标签、禁用态 |
| 深色文本 | `--text-dark` | `#333333` | 亮面模式文本 |
| 信息文本 | `--text-info` | `#9cdcfe` | 提示性信息 |
| **边框** |
| 主边框 | `--border-color` | `#3c3c3c` | 面板分隔线、组件边框 |
| 浅边框 | `--border-light` | `#cccccc` | 输入框、轻量分隔 |
| 更浅边框 | `--border-lighter` | `#ddd` | 表格边框 |
| 深边框 | `--border-dark` | `#404040` | 深色强调边框 |

### 2.3 亮色主题

通过 `body.theme-light` 切换，变量名相同，色值调整：

| 类别 | 暗色 | 亮色 | 说明 |
|------|------|------|------|
| `--bg-primary` | `#1e1e1e` | `#ffffff` | 反转 |
| `--bg-secondary` | `#252526` | `#f5f5f5` | 浅灰 |
| `--bg-tertiary` | `#2d2d2d` | `#eeeeee` | 更浅灰 |
| `--bg-hover` | `#3d3d3d` | `#e0e0e0` | hover 态 |
| `--text-primary` | `#ffffff` | `#1a1a1a` | 反转 |
| `--text-secondary` | `#cccccc` | `#444444` | 深灰 |
| `--border-color` | `#3c3c3c` | `#e0e0e0` | 浅边框 |

> **主色在两个主题下保持一致** (`#FCA506`)

### 2.4 语义化颜色

| 状态 | 背景 | 边框 | 文本 | 用途 |
|------|------|------|------|------|
| **错误** | `rgba(211, 47, 47, 0.1)` | `rgba(211, 47, 47, 0.5)` | `#ff6b6b`（暗）/ `#d32f2f`（亮） | 解析错误、操作失败 |
| **警告** | `rgba(255, 152, 0, 0.1)` | `rgba(255, 152, 0, 0.5)` | `#ff9800` | 需要注意但非阻断 |
| **成功** | `rgba(76, 175, 80, 0.1)` | `rgba(76, 175, 80, 0.5)` | `#4caf50` | 保存成功、操作完成 |

### 2.5 状态颜色

| 状态 | 色值 | 用途 |
|------|------|------|
| 状态蓝 | `--status-blue: #2196f3` | Git 分析中、进度指示 |
| 状态灰 | `--status-gray: #9e9e9e` | 无文件打开 |
| 状态橙 | `--status-orange: #ffb347` | 未保存修改 |
| 状态绿 | `--status-green: #4caf50` | 已保存 |

---

## 三、字体规范

### 3.1 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

- 优先使用系统默认无衬线字体
- 跨平台一致性：Windows → Segoe UI, macOS → San Francisco, Linux → Ubuntu/DejaVu

### 3.2 字体大小层级

| 层级 | 字号 | 字重 | 用途 | 示例 |
|------|------|------|------|------|
| **大标题** | 14px | 600 (semi-bold) | 面板标题、属性面板标题 | 属性、元素库、版本历史 |
| **中标题** | 13px | 500 (medium) | 应用标题、视图标题 | TopMenuBar 标题 |
| **正文** | 12px | 400 (normal) | 按钮、输入框、属性标签、列表项 | 文件列表、属性值 |
| **小字** | 11px | 400 | 状态栏、标签、占位符 | 状态栏信息、缩放百分比 |
| **代码** | 12px (Monaco 默认) | 400 | 代码编辑器内容 | Monaco Editor |
| **等宽字体** | `'Monaco', 'Menlo', 'Ubuntu Mono', monospace` | 400 | 错误信息、代码片段 | 错误提示 |

### 3.3 字体颜色应用

| 场景 | 颜色变量 | 示例 |
|------|----------|------|
| 标题/主内容 | `--text-primary` | 文件名、属性值 |
| 次要信息 | `--text-secondary` | Git 状态、提交时间 |
| 标签/占位符 | `--text-muted` | 属性标签、placeholder |
| 禁用态 | `--text-muted` + `opacity: 0.5` | 不可用按钮 |
| 激活/选中 | `--accent-color` | 当前 Tab、Save 按钮（修改态） |

---

## 四、布局规范

### 4.1 整体布局结构

```
┌────────────────────────────────────────────────────────────┐
│                    TopMenuBar (h: 32px)                    │
├──────────┬────────────────────────────────────┬────────────┤
│          │                                    │            │
│ LeftPanel│         MainContent                │ RightPanel │
│ (可变宽) │         (自适应)                   │ (可变宽)   │
│          │                                    │            │
├──────────┴────────────────────────────────────┴────────────┤
│                    StatusBar (h: 24px)                     │
└────────────────────────────────────────────────────────────┘
```

| 区域 | 最小宽度 | 最大宽度 | 默认宽度 | 高度 |
|------|----------|----------|----------|------|
| LeftPanel | 200px | 40vw | 300px | 自适应 |
| MainContent | 300px | - | 自适应 | 自适应 |
| RightPanel | 200px | 40vw | 300px | 自适应 |
| TopMenuBar | - | - | 100% | 32px |
| StatusBar | - | - | 100% | 24px |

### 4.2 响应式断点

| 断点 | 屏幕宽度 | 布局行为 |
|------|----------|----------|
| **桌面** | ≥ 1025px | 三栏完整显示 |
| **平板** | 769px - 1024px | 侧栏最大 40vw，Tab 字体略小 (11px) |
| **手机** | ≤ 768px | 侧栏固定定位，默认隐藏，按钮切换 |
| **小屏** | ≤ 480px | 侧栏 90vw，Tab 字体 9px |
| **横屏** | height ≤ 500px | 减少顶部栏高度，工具栏垂直布局 |

### 4.3 间距规范

| 类型 | 值 | 用途 |
|------|-----|------|
| **组件内间距** | 4px | 按钮组内间距、图标与文本间距 |
| **元素间距** | 8px | 列表项间距、属性行间距 |
| **区块间距** | 12px | 面板标题与内容间距 |
| **面板内边距** | 10px - 12px | 面板内容区 padding |
| **面板外边距** | 0 | 面板紧贴分隔线，无额外 margin |
| **工具栏按钮间距** | `gap: 4px` | SolarWire 工具栏 |
| **工具栏分区** | `gap: 2px` (section 内) | 工具分组内 |
| **分隔线宽度** | 1px | 工具栏分隔线 |

### 4.4 圆角规范

| 元素 | 圆角值 | 示例 |
|------|--------|------|
| 按钮 | `4px` | 工具栏按钮、面板按钮 |
| 输入框 | `4px` | 属性输入框、搜索框 |
| 下拉菜单 | `4px` | 颜色选择器菜单 |
| 卡片 | `8px` | 需求卡片、版本卡片 |
| 进度条容器 | `4px` | 状态栏进度条 |
| 滚动条 thumb | `0px` | 无圆角，直角矩形 |

### 4.5 阴影规范

| 层级 | 阴影值 | 用途 |
|------|--------|------|
| **弹出层** | `0 4px 12px rgba(0, 0, 0, 0.15)` | 颜色选择器菜单、Tooltip |
| **文件路径 Tooltip** | `0 2px 8px rgba(0, 0, 0, 0.15)` | 底部状态栏路径悬浮 |

---

## 五、组件规范

### 5.1 按钮

#### 5.1.1 工具栏按钮

```
┌──────────────┐
│    [Icon]    │  24px × 24px
└──────────────┘
```

| 状态 | 背景 | 边框 | 文本/图标 |
|------|------|------|-----------|
| 默认 | `--bg-tertiary` | `1px solid --border-color` | `--text-primary` |
| Hover | `--border-color` | `1px solid --text-muted` | `--text-primary` |
| 激活 | `--accent-opacity-35` | `1px solid --accent-color` | `--accent-color` |
| 禁用 | `transparent` | `1px solid --border-color` | `opacity: 0.3` |

#### 5.1.2 功能按钮（Open / Save）

| 按钮 | 尺寸 | 样式 | 特殊行为 |
|------|------|------|----------|
| Open | `min-width: 72px, height: 22px` | 透明背景 + 边框 | Hover 时边框和文本变为主色 |
| Save | 自适应宽度, height: 22px | 同 Open | 修改态时：主色文本+边框+10%主色背景 |

#### 5.1.3 主题切换按钮

- 尺寸: `28px × 28px`
- 圆形: `border-radius: 50%`
- 背景: `transparent`
- 图标: 字体 emoji（🌙 / ☀️）或图标库

#### 5.1.4 设置按钮

- 同主题切换按钮样式
- 位置: TopMenuBar 最右侧

### 5.2 Tab 标签页

#### 5.2.1 视图切换 Tab（左侧栏顶部）

```
┌──────┬──────┬──────┬──────┐
│ 文件 │ 需求 │ Solar│ Git  │  ← 背景: --bg-tertiary
└──────┴──────┴──────┴──────┘
```

| 状态 | 背景 | 文本 | 下边框 |
|------|------|------|--------|
| 默认 | `transparent` | `--text-muted` | 无 |
| Hover | `--bg-secondary` | `--text-primary` | 无 |
| 激活 | `--bg-secondary` | `--text-primary` | `2px solid --accent-color` |

- 字体: `12px`
- 内边距: `8px 12px`
- 图标间距: `gap: 8px`
- 容器高度: 由内容撑开，下边框 `1px solid --border-color`

#### 5.2.2 编辑模式 Tab（Markdown / SolarWire 模式）

- 样式与视图切换 Tab **完全一致**
- 图标: 代码图标 (`</>`) / 眼睛图标（预览）
- 顺序:
  - Markdown 模式: **预览** → **编辑**
  - SolarWire 模式: **可视化** → **代码**

### 5.3 输入框

| 属性 | 值 |
|------|-----|
| 高度 | `32px`（通过 `padding: 6px 8px` + 字体 `12px` 实现） |
| 背景 | `--bg-tertiary` |
| 边框 | `1px solid --border-color` |
| 圆角 | `4px` |
| 文本颜色 | `--text-primary` |
| 字体 | `12px` |
| 聚焦态 | `border-color: --accent-color`（无边框阴影） |
| 占位符色 | `--text-muted` |

#### 5.3.1 数字输入框

- 隐藏默认 spinner（上下箭头）
- 支持滚轮增减（通过组件逻辑）

### 5.4 下拉选择框

- 样式同输入框
- 光标: `cursor: pointer`

### 5.5 颜色选择器

#### 5.5.1 触发按钮

- 高度: `32px`
- 边框、背景同输入框
- Hover 时边框变为主色

#### 5.5.2 弹出菜单

```
┌─────────────────┐
│ 最近使用         │
│ [ ][ ][ ][ ][ ] │  ← 24px × 24px 色块，5 列网格
│ [ ][ ][ ][ ][ ] │
├─────────────────┤  ← 1px 分隔线
│ 预设颜色         │
│ [ ][ ][ ][ ][ ] │
│ [ ][ ][ ][ ][ ] │
│ [ ][ ][ ][ ][ ] │
├─────────────────┤
│  + 自定义颜色    │  ← 全宽按钮
└─────────────────┘
```

- 背景: `--bg-tertiary`
- 边框: `1px solid --border-color`
- 圆角: `6px`
- 阴影: `0 4px 12px rgba(0, 0, 0, 0.15)`
- z-index: `1000`
- 最小宽度: `160px`
- 色块尺寸: `24px × 24px`
- 色块圆角: `4px`
- 色块 Hover: `border-color: --accent-color, transform: scale(1.1)`

### 5.6 滚动条

```css
/* 宽度 */
width: 14px;          /* 垂直滚动条 */
height: 10px;         /* 水平滚动条 */

/* Track */
background: transparent;

/* Thumb */
background: --border-color;
border-radius: 0px;    /* 直角 */

/* Thumb Hover */
background: --text-muted;

/* Corner */
background: transparent;
```

**使用规范**:
- 所有需要滚动的区域都使用 `.scrollbar` 类
- 通过 `Scrollbar` 组件复用
- Firefox 通过 `scrollbar-width: thin` 和 `scrollbar-color` 兼容

### 5.7 卡片

| 类型 | 背景 | 边框 | 圆角 | 间距 |
|------|------|------|------|------|
| 需求卡片 | `--white`（亮面） | `1px solid --border-light` | `8px` | 16px 间距 |
| SolarWire 卡片 | `--white` | `1px solid --border-light` | `8px` | 8px 间距（单栏） |
| 版本提交卡片 | `--white` | `1px solid --border-light` | `8px` | 8px 间距 |
| 选中态 | 同卡片背景 | `2px solid --accent-color` | `8px` | - |

### 5.8 分隔线

| 类型 | 样式 |
|------|------|
| 水平分隔线 | `border-bottom: 1px solid --border-color` |
| 工具栏分隔线 | `width: 1px, height: 20px, background: --border-color` |
| 可拖拽分隔线 | `width/height: 4px (透明), hover 时显示 --accent-color` |
| 主色强调分隔线 | `border-color: --accent-opacity-50, background: --accent-opacity-35` |

---

## 六、交互规范

### 6.1 过渡动画

| 场景 | 时长 | 缓动函数 |
|------|------|----------|
| 按钮 Hover | `0.15s` | `ease` |
| Tab 切换 | `0.15s` | `ease` |
| 侧栏展开/折叠 | `0.3s` | `ease` |
| 颜色选择器弹出 | `0.2s` | `ease-out` |
| Toast 通知 | `0.3s` | `ease-out` |

### 6.2 Hover 反馈

所有可交互元素必须具有 Hover 态：

| 元素 | Hover 效果 |
|------|-----------|
| 按钮 | 背景色变化（`--bg-secondary` 或 `--border-color`） |
| Tab | 背景 `--bg-secondary`，文本变 `--text-primary` |
| 列表项 | 背景 `--bg-hover` |
| 色块 | `border-color: --accent-color, scale(1.1)` |
| 文件树节点 | 背景 `--bg-hover` |
| 工具栏图标 | 背景 `--border-color` |

### 6.3 选中态

| 元素 | 选中效果 |
|------|---------|
| 文件树节点 | 背景 `--bg-selected` + 白色文本 |
| 需求/SolarWire 卡片 | 边框 `2px solid --accent-color` |
| Tab | 下边框 `2px solid --accent-color` |
| 工具栏按钮 | 背景 `--accent-opacity-35` + 边框 `--accent-color` |
| 画布元素 | 高亮边框 + resize 手柄 |

### 6.4 禁用态

```css
opacity: 0.3;
cursor: not-allowed;
pointer-events: none; /* 部分元素 */
```

### 6.5 画布交互

| 操作 | 行为 |
|------|------|
| 单击元素 | 单选，显示属性面板和 resize 手柄 |
| Ctrl + 单击 | 多选/取消选中 |
| Shift + 单击 | 范围选中 |
| 空白处拖拽 | 框选（完全包含才选中） |
| 元素拖拽 | 移动元素位置，同步代码 |
| 滚轮 | 缩放画布 |
| Shift + 滚轮 | 水平平移 |
| 双击元素 | 进入文本编辑模式 |
| Ctrl+A | 选中所有元素 |
| Ctrl+C/V | 复制粘贴元素 |
| Delete | 删除选中元素 |
| 方向键 | 移动元素 1px |
| Shift + 方向键 | 移动元素 10px |

### 6.6 Resize 交互

| 手柄位置 | 行为 |
|----------|------|
| 四角 (nw/ne/se/sw) | 双向调整宽高 |
| 四边 (n/s/e/w) | 单向调整 |
| Shift + 拖拽 | 等比例缩放 |
| 线段端点 + Shift | 约束水平/垂直 |

### 6.7 吸附交互

| 类型 | 说明 |
|------|------|
| 网格吸附 | 元素移动时吸附到最近网格点 |
| 元素边缘吸附 | 接近其他元素边缘时自动对齐 |
| 辅助线 | 吸附时显示红色（边缘对齐）或蓝色（中心对齐）参考线 |
| 距离提示 | 显示与最近元素的距离数值 |
| Alt 键 | 临时禁用吸附 |

---

## 七、图标规范

### 7.1 图标库

- **首选**: Radix Icons (`@radix-ui/react-icons`)
- **备选**: Lucide React

### 7.2 图标尺寸

| 尺寸 | 用途 | 示例 |
|------|------|------|
| **12px** | 工具栏按钮内图标 | 选择模式、Note 切换 |
| **14px** | Tab 图标 | 预览/编辑 Tab |
| **16px** | 文件树图标、列表图标 | 文件夹、文件类型 |
| **20px** | 导航图标、通用图标 | Open、Save |

### 7.3 图标颜色

| 场景 | 颜色 |
|------|------|
| 默认 | `currentColor`（继承父元素文本色） |
| 强调 | `--accent-color` |
| 成功 | `--success-text` |
| 警告 | `--warning-text` |
| 错误 | `--error-text` |
| 禁用 | `--text-muted` + `opacity: 0.3` |

### 7.4 图标映射

| 功能 | 图标名 | 尺寸 |
|------|--------|------|
| 文件夹 | `Folder` / `FolderOpen` | 16px |
| 文件 | `File` | 16px |
| Markdown | `FileText` | 16px |
| SolarWire | `Code` | 16px |
| 打开 | `FolderOpen` | 20px |
| 保存 | `Save` | 20px |
| 编辑 | `Pencil2` | 16px |
| 删除 | `Trash` | 16px |
| 搜索 | `MagnifyingGlass` | 16px |
| 设置 | `Gear` | 20px |
| 预览 | `EyeOpen` | 14px |
| 代码 | `Code` | 14px |
| 展开 | `ChevronDown` | 16px |
| 折叠 | `ChevronRight` | 16px |
| Git 提交 | `Commit` | 16px |
| Git 分支 | `Branch` | 16px |
| 刷新 | `Reload` | 16px |
| 选择工具 | `Cursor` | 12px |
| 框选工具 | `Square` | 12px |
| 平移工具 | `Hand` | 12px |
| 对齐 | `AlignLeft` 等 | 12px |
| 层级 | `Layers` | 12px |
| 快捷键 | `Keyboard` | 16px |

---

## 八、布局组件规范

### 8.1 TopMenuBar（顶部菜单栏）

```
┌──────────────────────────────────────────────────────────────┐
│ [Open] [Save] │ [选择] [框选] [Note] │ ─ │ [Zoom] │ ... │ 🌙 ⚙ │
│                  ↑ SolarWire 工具栏（仅 SolarWire 模式显示）    │
└──────────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 高度 | `32px` |
| 背景 | `--bg-tertiary` |
| 下边框 | `1px solid --border-color` |
| 内边距 | `0 12px` |
| 文本色 | `--text-primary` |

**内容分区**:
1. **左侧**: Open / Save 按钮
2. **中左**: SolarWire 工具栏（仅 SolarWire 模式下显示）
3. **中间**: 模式 Tab（Markdown/SolarWire）
4. **右侧**: 主题切换 + 设置按钮

### 8.2 LeftPanel（左侧面板）

```
┌────────────────┐
│ 文件 │ 需求 │ S │ G │  ← ViewTabs
├────────────────┤
│                │
│   内容区        │
│   (文件树/      │
│   卡片列表)     │
│                │
└────────────────┘
```

| 属性 | 值 |
|------|-----|
| 背景 | `--bg-secondary` |
| 默认宽度 | `300px` |
| 最小宽度 | `200px` |
| 最大宽度 | `40vw` |
| 右边框 | `1px solid --border-color` |

### 8.3 MainContent（主内容区）

```
┌──────────────────────────────────────┐
│  [Tab: 预览 | 编辑]                   │  ← 编辑模式 Tab
├──────────────────────────────────────┤
│                                      │
│         编辑/预览内容                 │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 背景 | `--bg-primary` |
| 宽度 | 自适应（剩余空间） |
| 最小宽度 | `300px` |

### 8.4 RightPanel（右侧面板）

```
┌──────────────────┐
│    属性面板       │
│  ┌────────────┐  │
│  │ Text       │  │
│  │ [输入框]    │  │
│  │ X   [100]  │  │
│  │ Y   [150]  │  │
│  │ ...        │  │
│  └────────────┘  │
│    Note 编辑     │
└──────────────────┘
```

| 属性 | 值 |
|------|-----|
| 背景 | `--bg-secondary` |
| 默认宽度 | `300px` |
| 最小宽度 | `200px` |
| 最大宽度 | `40vw` |
| 左边框 | `1px solid --border-color` |
| 内边距 | `10px` |

### 8.5 StatusBar（底部状态栏）

```
┌──────────────────────────────────────────────────────────────┐
│ [✓ 已保存] [📄 path/to/file.sw] [SolarWire 模式] [main] │ 60% │
└──────────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 高度 | `24px` |
| 背景 | `--bg-secondary` |
| 上边框 | `1px solid --border-color` |
| 内边距 | `0 12px` |
| 字体 | `12px, --text-secondary` |
| 布局 | `flex, justify-content: space-between` |

---

## 九、画布元素渲染规范

### 9.1 元素选中高亮

| 状态 | 样式 |
|------|------|
| 悬停（未选中） | 轻度高亮，z-index 最上方元素 |
| 选中 | 主色 `2px solid --accent-color` 边框 |
| 多选 | 所有选中元素显示主色边框 |
| 代码高亮对应 | 切换回代码 Tab 时，对应代码行背景 `--bg-selected` |

### 9.2 Resize 手柄

| 属性 | 值 |
|------|-----|
| 尺寸 | `8px × 8px` |
| 背景 | `--white` |
| 边框 | `1px solid --accent-color` |
| 圆角 | `0px`（直角） |
| 数量 | 8 个（四角 + 四边中点） |
| 线段元素 | 仅 2 个端点手柄 |

### 9.3 框选框

| 属性 | 值 |
|------|-----|
| 边框 | `1px dashed --accent-color` |
| 背景 | `--accent-opacity-10` |
| z-index | 高于所有元素，低于工具栏 |
| 选中规则 | 完全包含元素才选中（contain 模式） |

### 9.4 吸附辅助线

| 类型 | 颜色 | 样式 |
|------|------|------|
| 边缘对齐 | 红色 (`--error-text`) | `1px 虚线` |
| 中心对齐 | 蓝色 (`--status-blue`) | `1px 虚线` |
| 距离标签 | `--text-secondary` | 小字 `11px` |

### 9.5 网格背景

| 属性 | 值 |
|------|-----|
| 网格大小 | 可配置（默认 10px） |
| 网格线颜色 | `--border-color`（弱对比） |
| 主网格线 | 每 5 格加粗 |
| 开关 | 通过工具栏切换 |

---

## 十、编辑器规范

### 10.1 Monaco Editor

| 属性 | 值 |
|------|-----|
| 主题 | 暗色/亮色跟随全局主题 |
| 字体大小 | `12px`（默认） |
| 行号 | 显示 |
| 最小化地图 | 不显示 |
| 滚动条 | 使用项目统一滚动条样式 |
| 高亮行 | 选中元素对应代码行背景 `--bg-selected` |

### 10.2 代码行高亮

- 选中元素时，对应代码行（元素首行到尾行）背景色 `--bg-selected`
- 切换回代码 Tab 时滚动到选中元素代码位置
- 代码编辑时不保持滚动位置记忆（跟随选中元素）

### 10.3 Markdown 预览

| 属性 | 值 |
|------|-----|
| 渲染引擎 | marked / markdown-it |
| Mermaid 支持 | 是 |
| SolarWire 代码块渲染 | 是（SVG 嵌入） |
| 滚动条 | 项目统一滚动条样式 |
| 滚动位置记忆 | 是（切换 Tab 时保持） |
| 左右边界 | `24px` padding |

---

## 十一、Git 视图规范

### 11.1 版本历史

| 属性 | 值 |
|------|-----|
| 组件 | `react-git-log` |
| 左右边界 | `24px` padding |
| 排序 | 时间倒序 |
| 显示信息 | 提交 ID (前 8 位)、时间、作者、提交信息 |

### 11.2 Commit 功能

| 功能 | 说明 |
|------|------|
| Commit 按钮 | 弹出提交对话框 |
| 用户名/邮箱 | 从设置中读取 |
| 暂存/取消暂存 | 文件列表操作 |
| 推送/拉取/获取 | 远程操作 |

---

## 十二、视图规范

### 12.1 需求视图（Requirement View）

```
┌────────────────────────┐
│ 需求标题（加粗，12px）   │
│ git:abc12345 · 2026-04-20 · 已修改 │
│ filename.md             │  ← 完整文件名（含扩展名）
└────────────────────────┘
```

| 元素 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 标题（文件夹名） | 12px | 600 | `--text-primary` |
| 副标题（Git 信息） | 11px | 400 | `--text-secondary` |
| 文件名 | 11px | 400 | `--text-muted` |

- 布局: 单栏
- 卡片间距: `16px`
- 选中态: 主色外框 `2px solid --accent-color`

### 12.2 SolarWire 视图

```
┌────────────────────────┐
│ 页面标题（加粗，12px）   │  ← 从 !title= 提取，去双引号
│ 需求名称-#1             │  ← 副标题
│ [代码预览 3 行]         │
└────────────────────────┘
```

| 元素 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 标题 | 12px | 600 | `--text-primary` |
| 副标题 | 11px | 400 | `--text-secondary` |

- 布局: 单栏
- 卡片间距: `8px`
- 选中态: 主色外框

### 12.3 视图切换互斥

- 选择需求视图下的文件时，取消 SolarWire 视图的选中
- 选择 SolarWire 视图的代码块时，取消需求视图的选中
- 切换视图 Tab 时不取消选中状态（保留之前选中）

---

## 十三、工具栏规范（SolarWire 模式）

### 13.1 工具栏分组

| 分组 | 工具 |
|------|------|
| **选择工具** | 单选、框选、平移 |
| **显示控制** | Note 显示/隐藏 |
| **缩放控制** | `-` `100%` `+` |
| **对齐工具** | 左对齐、居中、右对齐、顶对齐、垂直居中、底对齐、等距分布 |
| **层级工具** | 置顶、置底、上移一层、下移一层 |
| **元素工具** | Fix Notes |

### 13.2 工具按钮样式

- 尺寸: `24px × 24px`
- 背景: `--bg-tertiary`
- 边框: `1px solid --border-color`
- 圆角: `4px`
- 图标尺寸: `12px`
- 激活态: 背景 `--accent-opacity-35`，边框 `--accent-color`

---

## 十四、属性面板规范

### 14.1 显示条件

| 条件 | 行为 |
|------|------|
| 未选中任何元素 | 不显示属性面板 |
| 选中单个元素 | 显示完整属性 |
| 选中多个元素 | 显示批量编辑属性 |

### 14.2 属性分组

| 分组 | 包含属性 |
|------|---------|
| **基本属性** | Text, X, Y, W, H |
| **样式属性** | Background (bg), Color (c), Border (b), Radius (r), Opacity, Bold, Italic, Align |
| **Note** | 多行文本框（高度自适应） |

### 14.3 Note 编辑

| 属性 | 值 |
|------|-----|
| 高度 | 内容自适应（无固定高度） |
| 滚动 | 属性面板整体滚动，Note 框内不出现滚动条 |
| 前后空格 | 保留（仅在渲染时 trim） |
| 换行 | 支持（`white-space: pre-wrap`） |

### 14.4 元素特有属性

| 元素 | 特殊属性 | 不需要的属性 |
|------|---------|-------------|
| 线段 | 颜色 (c) | - |
| 圆形 | - | Align |
| 表格 | - | BorderWidth, Fill |

---

## 十五、性能规范

### 15.1 响应时间要求

| 操作 | 目标 |
|------|------|
| 应用启动 | < 3s |
| 文件打开 | < 1s (< 100KB) |
| 代码输入延迟 | < 100ms |
| 预览渲染 | < 500ms (< 100 元素) |
| 视图切换 | < 200ms |
| 元素拖拽 | 实时（60fps） |

### 15.2 节流与防抖

| 场景 | 策略 |
|------|------|
| 代码变化 → 预览更新 | 防抖 300ms |
| 元素拖拽实时更新 | `requestAnimationFrame` |
| 搜索过滤 | 防抖 300ms |

---

## 十六、可访问性规范

### 16.1 键盘导航

| 操作 | 快捷键 |
|------|--------|
| 保存 | `Ctrl + S` |
| 撤销 | `Ctrl + Z` |
| 重做 | `Ctrl + Y` |
| 复制 | `Ctrl + C` |
| 粘贴 | `Ctrl + V` |
| 全选 | `Ctrl + A` |
| 查找 | `Ctrl + F` |
| 切换主题 | - |

### 16.2 焦点状态

- 所有可交互元素必须有可见焦点状态
- 使用 `outline` 或 `ring` 实现

---

## 十七、CSS 变量速查表

```css
:root {
  /* 背景 */
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d2d;
  --bg-light: #f5f5f5;
  --bg-hover: #3d3d3d;
  --bg-selected: #0e639c;
  
  /* 文本 */
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-muted: #888888;
  --text-dark: #333333;
  --text-info: #9cdcfe;
  
  /* 边框 */
  --border-color: #3c3c3c;
  --border-light: #cccccc;
  --border-lighter: #ddd;
  --border-dark: #404040;
  
  /* 主色 */
  --accent-color: #FCA506;
  --accent-hover: #e89700;
  --primary-color: #007bff;
  
  /* 主色派生 */
  --accent-opacity-10: color-mix(in srgb, var(--accent-color) 10%, transparent);
  --accent-opacity-15: color-mix(in srgb, var(--accent-color) 15%, transparent);
  --accent-opacity-35: color-mix(in srgb, var(--accent-color) 35%, transparent);
  --accent-opacity-50: color-mix(in srgb, var(--accent-color) 50%, transparent);
  --accent-light: color-mix(in srgb, var(--accent-color) 15%, white);
  
  /* 语义化 */
  --error-bg: rgba(211, 47, 47, 0.1);
  --error-border: rgba(211, 47, 47, 0.5);
  --error-text: #ff6b6b;
  --error-bg-solid: #d32f2f;
  --warning-bg: rgba(255, 152, 0, 0.1);
  --warning-border: rgba(255, 152, 0, 0.5);
  --warning-text: #ff9800;
  --success-bg: rgba(76, 175, 80, 0.1);
  --success-border: rgba(76, 175, 80, 0.5);
  --success-text: #4caf50;
  
  /* 状态 */
  --status-blue: #2196f3;
  --status-gray: #9e9e9e;
  --status-orange: #ffb347;
  --status-green: #4caf50;
  
  /* 其他 */
  --divider-bg: #666;
  --divider-horizontal: var(--accent-color);
  --status-bar-bg: #007acc;
  --white: #ffffff;
  --black: #000000;
}
```

---

## 十八、命名规范

### 18.1 CSS 类名

- 使用 BEM 风格的短横线连接: `.property-panel`, `.tab-list`, `.color-picker-swatch`
- 组件容器: `-{component-name}-container`
- 状态类: `.active`, `.modified`, `.disabled`

### 18.2 文件命名

- 组件: `ComponentName.tsx` + `ComponentName.css`
- Hook: `useHookName.ts`
- Store: `nameStore.ts`
- 工具: `name-utils.ts`

---

## 十九、禁用规范（禁止事项）

| 禁止项 | 原因 |
|--------|------|
| ❌ 使用 emoji 作为图标 | 不专业、视觉不统一 |
| ❌ 硬编码颜色值 | 无法适配主题 |
| ❌ 使用 inline style | 无法复用，违反 DRY |
| ❌ 自定义滚动条样式（非项目规范） | 视觉不一致 |
| ❌ 超过 4px 的圆角（按钮/输入框） | 不符合工具定位 |
| ❌ 使用阴影超过两层 | 过于浮夸，不专业 |
| ❌ 在 SolarWire 画布上文本可选中 | 干扰拖拽操作 |
| ❌ 使用临时方案 (Workaround) | 必须在代码中注释并创建追踪任务 |

---

*文档生成时间: 2026-04-20*
*维护者: SolarWire 团队*
*下次审查: 主色变更或主题重构时更新*
