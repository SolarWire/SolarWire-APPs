# 左侧面板交互重构：移除 SW 视图，改为下半栏展示

## 背景

当前左侧面板包含 3 个 Tab 视图：文件管理器、SolarWire、组件库管理。SW 视图作为独立 Tab 存在，与文件视图割裂。用户需要频繁切换 Tab 才能查看 md 文件中的 SolarWire 页面列表，交互路径长，体验不连贯。

## 目标

将 SW 页面列表从独立 Tab 整合到文件视图中，选中 md 文件时在下半栏展示其 SolarWire snippet 列表，消除视图切换，提升浏览效率。

## 设计决策

### 核心方案：下半栏独立展示（方案 B）

选中含 SolarWire snippet 的 md 文件时，文件视图下半部分出现一栏，专门展示该 md 文件的 snippet 列表。

选择此方案而非内嵌展开（方案 A）的理由：
- 交互更直觉：点击 md 就是选中，下半栏自动响应，无需额外按钮操作
- 布局更稳定：文件树不被撑开，始终完整可见
- 信息空间充足：下半栏有独立空间展示 snippet 信息

### 决策记录

| 决策项 | 结论 |
|--------|------|
| SW Tab | 完全移除 |
| 下半栏触发条件 | 仅选中含 snippet 的 md 文件时显示 |
| 下半栏隐藏条件 | 选中其他文件 / 无 snippet 的 md 时完全隐藏（非折叠） |
| md 文件 badge | 右侧显示带 ⚡ 图标的 snippet 数量，如 `⚡3` |
| md 文件 tooltip | hover 显示页面数量 + 编号名称列表 |
| snippet 列表内容 | 精简：只显示编号和名称 |
| snippet 点击行为 | 打开该 snippet 的 SolarWire 编辑模式 |
| 分栏大小 | 支持拖动分隔线调整上下比例 |

## 详细设计

### 1. ViewTabs 变更

移除 `solarwire` 视图 Tab，只保留 `file` 和 `componentLibraryManager` 两个 Tab。

**涉及文件：**
- `ViewTabs.tsx`：从 views 数组中移除 solarwire 项
- `app.ts`：从 `ViewType` 中移除 `'solarwire'`
- `appStore.ts`：移除相关 solarwire 视图切换逻辑

### 2. FileTree 中 md 文件的增强

md 文件行右侧新增 snippet 数量 badge，hover 时显示 tooltip。

**badge 规格说明：**
- 样式：`⚡{count}`，带边框的小标签，颜色与 SolarWire 主题一致
- 数据来源：需要为每个 md 文件解析其包含的 SolarWire snippet 数量
- 仅在 snippet 数量 > 0 时显示
- badge 不影响点击 md 文件本身的行为（点击 md 仍打开 md 编辑模式）

**tooltip 规格说明：**
- 显示格式（有条目的 md）：`{count} 个页面: #1 {name1}, #2 {name2}, ...`
- 显示格式（无条目的 md）：`未检测到 SolarWire 页面`
- 数据来源：解析 md 文件中的 SolarWire 代码块，提取 snippetIndex 和 title
- 所有 md 文件 hover 都显示 tooltip

**涉及文件：**
- `FileTree.tsx`：TreeItem 组件增加 badge 和 tooltip 渲染
- `FileTree.css`：badge 和 tooltip 样式
- `fileStore.ts`：新增 md 文件 snippet 信息的存储和查询

### 3. 下半栏 Snippet 列表

文件视图下半部分，选中含 snippet 的 md 时出现。

**布局结构：**
```
┌─────────────────────────┐
│  Tab: 文件 | 组件库      │
├─────────────────────────┤
│  文件树（上半部分）       │
│  📂 src/                │
│    📝 home.md    ⚡3    │
│    📝 about.md   ⚡1    │
├─── ┋ 拖动分隔线 ┋ ──────┤
│  📝 home.md · SW 页面   │
│  ⚡ #1 首页             │
│  ⚡ #2 列表             │
│  ⚡ #3 详情             │
└─────────────────────────┘
```

**Snippet 列表项规格：**
- 显示内容：`⚡ #{snippetIndex} {title}`
- 点击行为：调用 `openSolarWireSnippet` 打开该 snippet 的编辑模式
- 选中状态：当前正在编辑的 snippet 高亮显示
- 右键菜单：保留现有 SolarWireView 中的右键功能（重命名标题、复制路径等）

**涉及文件：**
- `FileView.tsx`：新增下半栏渲染逻辑和拖动分隔线
- `FileView.css`：下半栏和分隔线样式
- 新增 `SnippetListPanel.tsx`：下半栏 snippet 列表组件（从 SolarWireView 中提取复用逻辑）

### 4. 拖动分隔线

**交互规格：**
- 分隔线位于文件树和 snippet 列表之间
- 鼠标悬停时 cursor 变为 `ns-resize`
- 拖动时实时调整上下两栏高度
- 设置最小高度限制（上栏最小 120px，下栏最小 80px）
- 分隔线位置在 localStorage 中持久化，跨刷新保持用户调整的比例

### 5. 数据流

**当前数据流（SolarWireView）：**
1. `currentPath` 变化 → 调用 `api.collectSolarWireSnippets` 收集所有 snippet
2. 全局搜索过滤 → 渲染 snippet 列表

**新数据流：**
1. `currentPath` 变化 → 调用 `api.collectSolarWireSnippets` 收集所有 snippet（不变）
2. 按 `sourceFile` 分组存储到 store
3. md 文件 badge/tooltip：从分组数据中查询对应文件的 snippet 数量和名称
4. 下半栏：根据当前选中的 md 文件，过滤展示其 snippet 列表
5. 点击 snippet：调用 `openSolarWireSnippet` 打开编辑模式（不变）

**涉及文件：**
- `fileStore.ts`：新增 `snippetsByFile` 状态（`Record<string, SolarWireSnippet[]>`），在 snippet 收集完成后按 sourceFile 分组存储
- `FileTree.tsx`：从 store 读取 badge/tooltip 数据
- `SnippetListPanel.tsx`：从 store 读取当前选中 md 的 snippet 列表

### 6. 移除 SolarWireView 后的兼容性

**需要保留的逻辑：**
- `openSolarWireSnippet` 函数及其调用链
- snippet 的 tooltip 组件（移至 SnippetListPanel 中复用）
- snippet 右键菜单（重命名标题、复制路径、在文件视图中定位）
- `collectSolarWireSnippets` API 调用

**需要移除的逻辑：**
- `SolarWireView.tsx` 组件
- `SolarWireView.css` 样式
- `ViewType` 中的 `'solarwire'`
- `ViewTabs` 中的 solarwire Tab
- `selectionStore` 中 solarwire 视图相关的选择逻辑：`setSelection('solarwire', ...)` 调用需替换为 `setSelection('file', ...)`，因为 snippet 点击后主编辑区仍处于文件视图上下文中

## 组件职责划分

| 组件 | 职责 |
|------|------|
| `ViewTabs` | 渲染文件和组件库两个 Tab |
| `FileView` | 协调文件树和下半栏的布局，管理分隔线拖动 |
| `FileTree` | 渲染文件树，md 文件显示 badge 和 tooltip |
| `SnippetListPanel` | 渲染当前选中 md 的 snippet 列表，处理 snippet 点击和右键 |
| `fileStore` | 管理 snippet 分组数据，提供查询接口 |

## 错误处理

- snippet 收集失败：下半栏不显示，控制台输出错误日志
- 选中文件无法解析：视为无 snippet，下半栏隐藏
- 拖动分隔线越界：通过最小高度限制防止

## 不在范围内

- 跨 session 持久化分隔线位置
- 下半栏的搜索/过滤功能（snippet 列表通常较短，不需要）
- snippet 列表的拖拽排序
