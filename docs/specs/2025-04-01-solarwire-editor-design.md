# SolarWire Editor 设计文档

## 概述

SolarWire Editor 是一个完整的文档工作台，提供 SolarWire 代码编辑、可视化拖拽编辑、Markdown 编辑、实时预览、批量 SVG 生成、版本管理和 Git 管理功能。

## 目标

创建一个独立运行的 SolarWire 编辑器应用，支持代码编辑和可视化拖拽编辑两种模式，同时集成完整的文档管理功能。

## 技术选型

### 框架和工具
- **框架**: Electron + React 18 + TypeScript
- **代码编辑器**: Monaco Editor
- **可视化画布**: SVG（基于现有 renderer-svg）
- **状态管理**: Zustand（轻量级，适合 Electron）
- **文件系统**: Electron API（fs、dialog）
- **Git 管理**: simple-git
- **Markdown**: marked + highlight.js
- **构建工具**: Vite + electron-builder

### 为什么选择 SVG
- 直接复用现有 renderer-svg 代码
- 每个 SVG 元素都是 DOM 节点，交互简单
- 易于调试（浏览器开发者工具）
- 样式控制灵活（CSS）
- 开发效率高
- PRD 文档通常 < 100 个元素，性能足够

## 架构设计

### 进程架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ File System  │  │  Git Manager │  │ IPC Bridge   │ │
│  │   Manager    │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                  Electron Renderer Process              │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │   Layout   │  │   Editor   │  │  Preview   │ │  │
│  │  │  Manager   │  │  Manager   │  │  Manager   │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘ │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │   File     │  │   Version  │  │    Git     │ │  │
│  │  │   View     │  │  Manager   │  │  Manager   │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │            Zustand Store                    │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Core Libraries                       │  │
│  │  @solarwire/parser  @solarwire/renderer-svg      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 模块划分

**核心模块**:
1. **EditorManager** - 编辑器管理（Monaco Editor、SVG 画布）
2. **PreviewManager** - 预览管理（实时渲染、双向同步）
3. **FileManager** - 文件管理（打开、保存、监听变化）
4. **VersionManager** - 版本管理（需求版本、页面版本）
5. **GitManager** - Git 管理（本地、远程操作）

**视图模块**:
1. **FileView** - 文件树视图
2. **RequirementView** - 需求视图
3. **SolarWireView** - SolarWire 页面视图
4. **VersionView** - 版本视图（独立，根据选中内容筛选）
5. **GitView** - Git 视图

**编辑模式**:
1. **MarkdownMode** - Markdown 编辑模式
2. **SolarWireMode** - SolarWire 编辑模式
3. **BlankMode** - 空白模式
4. **VersionMode** - 版本管理模式
5. **GitMode** - Git 模式

## 组件设计

### 核心组件层次结构

```
App
├── AppLayout
│   ├── TopMenuBar          # 顶部菜单栏
│   ├── MainContent
│   │   ├── LeftPanel
│   │   │   ├── ViewTabs   # 视图切换标签
│   │   │   ├── ViewContent
│   │   │   │   ├── FileView
│   │   │   │   ├── RequirementView
│   │   │   │   ├── SolarWireView
│   │   │   │   └── GitView
│   │   │   └── VersionView  # 版本视图（独立）
│   │   └── RightPanel
│   │       ├── EditorArea
│   │       │   ├── MarkdownMode
│   │       │   ├── SolarWireMode
│   │       │   ├── BlankMode
│   │       │   ├── VersionMode
│   │       │   └── GitMode
│   └── StatusBar
```

### 主要组件

#### AppLayout（应用布局）
- **职责**: 整体布局管理
- **状态**: 当前视图、当前编辑模式、选中文件
- **子组件**: TopMenuBar、MainContent、StatusBar

#### TopMenuBar（顶部菜单栏）
- **职责**: 提供文件、编辑、视图、工具、帮助等菜单
- **功能**: 
  - 文件：新建、打开、保存、导出
  - 编辑：撤销、重做、复制、粘贴
  - 视图：切换视图、切换编辑模式
  - 工具：批量生成 SVG
  - 帮助：快捷键、关于

#### ViewTabs（视图切换标签）
- **职责**: 切换左侧面板的视图
- **状态**: 当前视图（file/requirement/solarwire/git）
- **交互**: 点击切换视图，隐藏/显示 VersionView

#### FileView（文件视图）
- **职责**: 显示文件树结构
- **功能**: 
  - 展开/折叠文件夹
  - 双击打开文件
  - 右键菜单（新建、删除、重命名）
- **数据**: 文件树结构（递归）

#### RequirementView（需求视图）
- **职责**: 显示所有需求（.solarwire 目录）
- **功能**:
  - 平铺显示需求卡片
  - 显示需求基本信息（名称、日期、页面数）
  - 点击展开/折叠详情
- **数据**: 需求列表（从 .solarwire 目录解析）

#### SolarWireView（SolarWire 页面视图）
- **职责**: 显示所有 SolarWire 页面
- **功能**:
  - 显示页面缩略图和标题
  - 点击快速跳转到对应页面
  - 搜索和筛选
- **数据**: SolarWire 页面列表（从所有需求文档解析）

#### VersionView（版本视图）
- **职责**: 显示 Git 提交历史
- **功能**:
  - 根据选中内容筛选 Git 提交
  - 显示提交信息（提交 ID、时间、作者、提交信息）
  - 点击进入版本管理模式
  - 支持恢复到任意提交（checkout/reset）
  - 支持版本对比（diff）
- **数据**: Git 提交历史（从 Git 获取）
- **筛选逻辑**:
  - 未选中任何内容：显示整个工作区所有 Git 提交（按时间倒序）
  - 选中文件：显示该文件的所有 Git 提交
  - 选中需求：显示该需求的所有 Git 提交
  - 选中页面：显示该页面的所有 Git 提交

#### GitView（Git 视图）
- **职责**: 显示 Git 状态和历史
- **功能**:
  - 显示已修改、暂存、未跟踪文件
  - 显示提交历史
  - 显示分支列表
- **数据**: Git 状态、提交历史、分支列表

#### MarkdownMode（Markdown 编辑模式）
- **职责**: Markdown 编辑和预览
- **布局**: 左侧编辑器 + 右侧预览
- **组件**:
  - MonacoEditor（Markdown 编辑）
  - MarkdownPreview（实时预览，支持 Markdown、Mermaid、SolarWire）

#### SolarWireMode（SolarWire 编辑模式）
- **职责**: SolarWire 代码编辑 + 可视化编辑
- **布局**: 左侧代码编辑 + 中间预览 + 右侧属性面板
- **组件**:
  - MonacoEditor（SolarWire 代码编辑）
  - SolarWirePreview（SVG 预览，支持交互）
  - ElementLibrary（元素库，拖拽区）
  - PropertyPanel（属性面板）

#### SolarWirePreview（SolarWire 预览）
- **职责**: 渲染 SolarWire SVG 并支持交互
- **功能**:
  - 使用 renderer-svg 渲染 SVG
  - 选中元素（点击）
  - 多选（Ctrl + 点击 / 框选）
  - 拖动元素
  - 调整大小（8 个手柄）
  - 双击编辑文本
  - 右键菜单（复制、删除、层级）
- **状态**: 选中元素列表、拖动状态、调整大小状态

#### ElementLibrary（元素库）
- **职责**: 提供可拖拽的基础元素
- **基础元素列表**:
  1. 矩形 - 普通矩形元素
  2. 圆角矩形 - 带圆角的矩形
  3. 圆形 - 圆形元素
  4. 文本 - 纯文本元素
  5. 线条 - 直线元素（可带标签）
  6. 图片 - 图片元素（支持占位符）
  7. 占位符 - 占位符元素（带对角线）
  8. 表格 - 表格元素（支持 colspan/rowspan）
- **交互**: 拖拽到 SolarWirePreview

#### PropertyPanel（属性面板）
- **职责**: 编辑选中元素的属性
- **功能**:
  - 单选：显示所有属性（文本、坐标、尺寸、样式、note）
  - 多选：只显示对齐工具和批量删除
- **属性**:
  - 基本属性：text、x、y、w、h
  - 样式属性：bg、c、b、r、size、bold、italic、align、opacity
  - Note 编辑器：多行文本框

#### VersionMode（版本管理模式）
- **职责**: 查看和对比版本
- **布局**: 左侧当前版本（只读）+ 右侧对比版本
- **功能**:
  - 选择对比版本
  - 高亮显示差异
  - 恢复到历史版本

#### GitMode（Git 模式）
- **职责**: Git 操作面板
- **功能**:
  - Git 状态（已修改、暂存、未跟踪）
  - 暂存/取消暂存文件
  - 提交（带提交信息）
  - 分支管理
  - 远程仓库操作（push/pull/fetch）
  - 文件差异对比

#### StatusBar（状态栏）
- **职责**: 显示应用状态
- **信息**: 保存状态、文件状态、当前编辑模式、其他状态

## 数据流设计

### Zustand Store 结构

```typescript
// 主 Store
interface AppState {
  // 视图状态
  currentView: 'file' | 'requirement' | 'solarwire' | 'git';
  currentEditMode: 'markdown' | 'solarwire' | 'blank' | 'version' | 'git';
  
  // 文件状态
  selectedFile: string | null;
  openFiles: string[];
  fileContents: Record<string, string>;
  
  // 编辑器状态
  editorContent: string;
  isDirty: boolean;
  
  // SolarWire 状态
  solarWireAST: Document | null;
  solarWireSVG: string;
  selectedElements: string[];
  dragState: DragState | null;
  
  // 版本状态
  versions: Version[];
  selectedVersion: string | null;
  
  // Git 状态
  gitStatus: GitStatus;
  gitHistory: GitCommit[];
  currentBranch: string;
  
  // Actions
  setCurrentView: (view: AppState['currentView']) => void;
  setCurrentEditMode: (mode: AppState['currentEditMode']) => void;
  setSelectedFile: (file: string | null) => void;
  openFile: (file: string) => Promise<void>;
  saveFile: (file: string, content: string) => Promise<void>;
  updateEditorContent: (content: string) => void;
  parseSolarWire: (code: string) => void;
  selectElements: (ids: string[]) => void;
  updateElementProperty: (id: string, property: string, value: any) => void;
  loadVersions: (filter: VersionFilter) => Promise<void>;
  loadGitStatus: () => Promise<void>;
}
```

### 核心数据流

#### 文件打开流程

```
用户双击文件
  ↓
FileView.onDoubleClick(file)
  ↓
store.openFile(file)
  ↓
Main Process: 读取文件内容
  ↓
store.fileContents[file] = content
  ↓
store.selectedFile = file
  ↓
根据文件类型切换编辑模式:
  - .md → MarkdownMode
  - .solarwire → SolarWireMode
  - 其他 → BlankMode
```

#### SolarWire 编辑流程（代码 → 可视化）

```
用户在 MonacoEditor 输入代码
  ↓
MonacoEditor.onChange(content)
  ↓
store.updateEditorContent(content)
  ↓
store.parseSolarWire(content)
  ↓
@solarwire/parser.parse(content) → AST
  ↓
@solarwire/renderer-svg.render(AST) → SVG
  ↓
store.solarWireAST = AST
  ↓
store.solarWireSVG = SVG
  ↓
SolarWirePreview 重新渲染 SVG
```

#### SolarWire 编辑流程（可视化 → 代码）

```
用户在 SolarWirePreview 拖拽元素
  ↓
SolarWirePreview.onDrag(element, newX, newY)
  ↓
store.updateElementProperty(element.id, 'x', newX)
  ↓
store.updateElementProperty(element.id, 'y', newY)
  ↓
根据 AST 重新生成代码
  ↓
store.editorContent = newCode
  ↓
MonacoEditor 更新代码
```

#### 双向同步实现

**代码 → 可视化**:
1. 监听 MonacoEditor 的 onChange 事件
2. 解析代码生成 AST
3. 渲染 AST 生成 SVG
4. 更新 SolarWirePreview

**可视化 → 代码**:
1. 监听 SolarWirePreview 的交互事件（拖拽、调整大小、属性修改）
2. 更新 AST 中对应元素的属性
3. 根据 AST 重新生成代码
4. 更新 MonacoEditor 的内容

**同步策略**:
- 防抖处理（避免频繁更新）
- 标记 dirty 状态（避免循环更新）
- 使用 data-id 属性关联 SVG 元素和 AST 元素

#### 版本管理流程

**平时保存**:
```
用户保存文件
  ↓
Main Process: 保存文件到磁盘
  ↓
不创建版本号
  ↓
不经过 Git
  ↓
更新状态栏（已保存）
```

**Git 版本管理**:
```
用户通过 Git 管理功能提交变更
  ↓
Main Process: 执行 Git 提交
  ↓
Git 提交记录作为版本历史
  ↓
可以通过 Git 历史查看和恢复版本
```

#### Git 管理流程

```
用户打开 Git 视图
  ↓
store.setCurrentView('git')
  ↓
store.loadGitStatus()
  ↓
Main Process: simple-git.status()
  ↓
store.gitStatus = status
  ↓
GitView 显示 Git 状态
```

```
用户提交变更
  ↓
GitMode.onCommit(message)
  ↓
Main Process: simple-git.add('.').commit(message)
  ↓
store.loadGitStatus()
  ↓
store.loadGitHistory()
  ↓
GitView 更新状态和历史
```

### IPC 通信

**Main Process → Renderer Process**:
- 文件读取完成
- 文件保存完成
- Git 操作完成
- 版本创建完成

**Renderer Process → Main Process**:
- 读取文件
- 保存文件
- Git 操作（init、commit、push、pull 等）
- 创建版本快照
- 恢复版本

## 关键功能设计

### 1. SolarWire 可视化编辑

#### 1.1 元素选中

**实现方式**:
- 给每个 SVG 元素添加 `data-element-id` 属性
- 监听 SVG 的 `onClick` 事件
- 点击时获取 `data-element-id`，更新 `selectedElements`

**多选**:
- Ctrl + 点击：切换选中状态
- 框选：鼠标拖拽绘制矩形框，计算相交元素

#### 1.2 元素拖拽

**实现方式**:
```
用户按下鼠标
  ↓
检查是否点击到元素（通过 data-element-id）
  ↓
记录起始位置（mouseX, mouseY）和元素位置（elementX, elementY）
  ↓
鼠标移动
  ↓
计算偏移量（deltaX = mouseX - startX, deltaY = mouseY - startY）
  ↓
更新元素位置（newX = elementX + deltaX, newY = elementY + deltaY）
  ↓
更新 AST 中对应元素的 x, y 属性
  ↓
重新生成代码
  ↓
更新 MonacoEditor
```

**边界处理**:
- 限制拖拽范围（不超出画布）
- 可选：吸附功能（吸附到网格、其他元素）

#### 1.3 调整大小

**实现方式**:
- 选中元素后显示 8 个调整手柄（四角 + 四边中点）
- 每个手柄有不同的调整方向：
  - 左上角：调整 x, y, w, h
  - 右上角：调整 y, w, h
  - 左下角：调整 x, w, h
  - 右下角：调整 w, h
  - 上边：调整 y, h
  - 下边：调整 h
  - 左边：调整 x, w
  - 右边：调整 w

**最小尺寸限制**:
- 矩形：最小 20x20
- 圆形：最小直径 20
- 文本：根据内容自动计算

#### 1.4 属性编辑

**PropertyPanel 实现**:
```
选中单个元素
  ↓
显示所有可编辑属性
  ↓
用户修改属性
  ↓
更新 AST 中对应元素的属性
  ↓
重新生成代码
  ↓
更新 MonacoEditor
  ↓
重新渲染 SVG
```

**Note 编辑**:
- 多行文本框
- 支持 Markdown 语法
- 实时预览

#### 1.5 元素拖拽到画布

**实现方式**:
```
用户从 ElementLibrary 拖拽元素
  ↓
记录拖拽的元素类型
  ↓
鼠标释放到 SolarWirePreview
  ↓
获取释放位置（相对于画布）
  ↓
创建新元素（默认尺寸和样式）
  ↓
添加到 AST
  ↓
重新生成代码
  ↓
更新 MonacoEditor
  ↓
重新渲染 SVG
  ↓
自动选中新元素
```

### 2. 双向同步（代码 ↔ 可视化）

#### 2.1 代码 → 可视化

**触发条件**:
- MonacoEditor 内容变化（防抖 300ms）
- 用户手动触发（Ctrl + Enter）

**实现流程**:
```
MonacoEditor 内容变化
  ↓
防抖 300ms
  ↓
检查 dirty 状态（避免循环更新）
  ↓
解析代码：@solarwire/parser.parse(code)
  ↓
渲染 SVG：@solarwire/renderer-svg.render(AST)
  ↓
更新 SolarWirePreview
  ↓
清除 dirty 状态
```

#### 2.2 可视化 → 代码

**触发条件**:
- 元素拖拽结束
- 元素调整大小结束
- 属性修改完成
- 元素删除/添加

**实现流程**:
```
用户操作（拖拽/调整大小/属性修改）
  ↓
更新 AST 中对应元素的属性
  ↓
根据 AST 重新生成代码
  ↓
设置 dirty 状态
  ↓
更新 MonacoEditor 内容
  ↓
清除 dirty 状态
```

**代码生成算法**:
```
遍历 AST
  ↓
对每个元素：
  - 获取元素类型和属性
  - 格式化为 SolarWire 语法
  - 添加缩进和换行
  ↓
拼接所有元素的代码
  ↓
添加声明部分（如果有）
```

#### 2.3 同步冲突处理

**场景**:
- 用户在 MonacoEditor 输入代码时，同时在可视化界面操作

**解决方案**:
- 使用 dirty 标志位
- 代码 → 可视化：设置 dirty = true，可视化 → 代码时检查 dirty，如果为 true 则跳过
- 可视化 → 代码：设置 dirty = true，代码 → 可视化时检查 dirty，如果为 true 则跳过

### 3. 版本管理

#### 3.1 版本管理策略

**版本管理完全通过 Git 实现**：
- 平时保存：只保存到磁盘，不创建版本号
- Git 提交：通过 Git 提交管理版本历史
- Git 提交记录：作为版本历史，包含时间、作者、提交信息
- 版本恢复：通过 Git checkout 或 Git reset 实现
- 版本对比：通过 Git diff 实现

**VersionView 显示内容**：
- Git 提交历史（按时间倒序）
- 提交信息：提交 ID、时间、作者、提交信息
- 文件变更：显示本次提交修改的文件列表

#### 3.2 版本创建流程

**平时保存**:
```
用户保存文件（Ctrl + S）
  ↓
Main Process: 保存文件到磁盘
  ↓
检查文件是否变化
  ↓
如果变化：
  - 保存文件内容到磁盘
  - 不创建版本号
  - 不经过 Git
  ↓
通知 Renderer Process
  ↓
更新状态栏（已保存）
```

**Git 版本管理**:
```
用户通过 Git 管理功能提交变更
  ↓
Main Process: 执行 Git 提交
  ↓
Git 提交记录作为版本历史
  ↓
可以通过 Git 历史查看和恢复版本
```

**版本管理策略**:
- 平时保存：只保存到磁盘，不创建版本号
- Git 版本：通过 Git 提交管理版本历史，适合长期版本管理

#### 3.3 版本恢复流程

**Git checkout 恢复**:
```
用户在 VersionView 选择提交
  ↓
点击"恢复到此提交"
  ↓
Main Process: 执行 Git checkout
  ↓
通知 Renderer Process
  ↓
更新编辑器内容
  ↓
更新预览
```

**Git reset 恢复**:
```
用户在 VersionView 选择提交
  ↓
点击"重置到此提交"
  ↓
Main Process: 执行 Git reset --hard
  ↓
通知 Renderer Process
  ↓
更新编辑器内容
  ↓
更新预览
```

#### 3.4 版本对比

**实现方式**:
- 使用 Git diff 命令
- 对比两个提交的内容
- 高亮显示差异（新增、删除、修改）
- 支持逐行对比和逐字符对比

### 4. 批量 SVG 生成

#### 4.1 从 Markdown 提取 SolarWire 代码块

**正则表达式**:
```typescript
const solarWireBlockRegex = /```solarwire\n([\s\S]*?)\n```/g;
```

**提取流程**:
```
读取 Markdown 文件
  ↓
使用正则表达式匹配所有 SolarWire 代码块
  ↓
提取代码块内容
  ↓
解析代码块获取页面名称（从第一行注释提取）
  ↓
生成文件名（kebab-case）
```

#### 4.2 批量生成 SVG

**流程**:
```
遍历所有 SolarWire 代码块
  ↓
对每个代码块：
  - 解析代码：@solarwire/parser.parse(code)
  - 渲染 SVG（带注释）：@solarwire/renderer-svg.render(AST)
  - 渲染 SVG（不带注释）：@solarwire/renderer-svg.render(AST, { disableNotes: true })
  - 保存到 .solarwire/[requirement-name]/ 目录
  - 文件名：[page-name]-with-notes.svg
  - 文件名：[page-name]-without-notes.svg
  ↓
完成
```

#### 4.3 文件命名规范

**页面名称提取**:
```solarwire
# Page Name
["Button"] w=100 h=40
```
提取为：`page-name`

**文件名生成**:
- 转换为小写
- 空格替换为连字符
- 移除特殊字符
- kebab-case 格式

### 5. Markdown 编辑和预览

#### 5.1 Markdown 编辑

**Monaco Editor 配置**:
- 语言模式：markdown
- 自动补全：Markdown 语法
- 语法高亮：Markdown 语法
- 快捷键：Ctrl + B（粗体）、Ctrl + I（斜体）等

#### 5.2 Markdown 预览

**实现方式**:
```
Monaco Editor 内容变化
  ↓
防抖 300ms
  ↓
解析 Markdown：marked.parse(content)
  ↓
渲染 HTML
  ↓
支持扩展：
  - Mermaid 图表
  - SolarWire 代码块
  - 代码高亮（highlight.js）
  ↓
更新 MarkdownPreview
```

**SolarWire 代码块渲染**:
```
检测 ```solarwire 代码块
  ↓
提取代码内容
  ↓
解析代码：@solarwire/parser.parse(code)
  ↓
渲染 SVG：@solarwire/renderer-svg.render(AST)
  ↓
嵌入到 HTML 中
```

## 错误处理和测试

### 1. 错误处理策略

#### 1.1 错误分类

**文件系统错误**:
- 文件不存在
- 文件权限不足
- 文件被占用
- 磁盘空间不足

**解析错误**:
- SolarWire 语法错误
- Markdown 格式错误
- JSON 解析错误

**渲染错误**:
- SVG 渲染失败
- 元素属性无效
- 渲染超时

**Git 错误**:
- Git 仓库不存在
- Git 操作失败（push/pull 冲突）
- 网络错误

**用户操作错误**:
- 无效的拖拽位置
- 无效的属性值
- 版本恢复失败

#### 1.2 错误处理流程

```
错误发生
  ↓
捕获错误（try-catch）
  ↓
分类错误类型
  ↓
记录错误日志
  ↓
显示用户友好的错误提示
  ↓
提供解决方案（如果可能）
  ↓
恢复到稳定状态
```

#### 1.3 错误提示 UI

**Toast 通知**:
- 轻量级错误提示
- 自动消失（3-5 秒）
- 支持手动关闭

**对话框**:
- 严重错误（需要用户确认）
- 提供详细信息
- 提供操作按钮（重试、取消、查看详情）

**内联错误**:
- 编辑器内显示错误位置
- 语法错误高亮
- 错误提示信息

#### 1.4 具体错误处理

**SolarWire 解析错误**:
```
MonacoEditor 内容变化
  ↓
尝试解析：@solarwire/parser.parse(code)
  ↓
如果失败：
  - 获取错误位置（line, column）
  - 在 MonacoEditor 中标记错误位置
  - 显示错误提示
  - 不更新预览
  ↓
如果成功：
  - 清除错误标记
  - 更新预览
```

**文件保存失败**:
```
用户保存文件
  ↓
尝试保存到磁盘
  ↓
如果失败：
  - 显示错误对话框
  - 提供解决方案（关闭其他程序、检查权限等）
  - 保留未保存内容
  - 标记为 dirty
  ↓
如果成功：
  - 清除 dirty 标记
  - 更新状态栏
```

**Git 操作失败**:
```
用户执行 Git 操作
  ↓
尝试执行
  ↓
如果失败：
  - 显示错误对话框
  - 显示 Git 错误输出
  - 提供解决方案（解决冲突、检查网络等）
  ↓
如果成功：
  - 更新 Git 视图
```

### 2. 测试策略

#### 2.1 测试层级

**单元测试**:
- 测试独立函数和组件
- 使用 Jest
- 覆盖率目标：> 80%

**集成测试**:
- 测试模块之间的交互
- 使用 Jest + React Testing Library
- 覆盖率目标：> 70%

**E2E 测试**:
- 测试完整用户流程
- 使用 Playwright
- 覆盖核心流程

#### 2.2 核心测试场景

**文件管理**:
- 打开文件
- 保存文件
- 文件监听（外部修改）
- 文件不存在处理

**SolarWire 编辑**:
- 代码编辑 → 可视化同步
- 可视化编辑 → 代码同步
- 元素拖拽
- 元素调整大小
- 属性编辑
- 双向同步冲突处理

**Markdown 编辑**:
- Markdown 编辑 → 预览同步
- SolarWire 代码块渲染
- Mermaid 图表渲染

**版本管理**:
- 自动创建版本
- 手动创建快照
- 版本恢复
- 版本对比

**Git 管理**:
- Git 状态查看
- 文件暂存/取消暂存
- 提交变更
- 分支切换
- 远程仓库操作

**批量 SVG 生成**:
- 从 Markdown 提取 SolarWire 代码块
- 批量生成 SVG
- 文件命名规范

#### 2.3 测试工具

**单元测试**:
- Jest
- React Testing Library
- @testing-library/user-event

**E2E 测试**:
- Playwright
- Electron 支持

**测试覆盖率**:
- Jest Coverage
- Istanbul

#### 2.4 测试数据

**测试文件**:
- 简单 SolarWire 文件（< 10 个元素）
- 中等 SolarWire 文件（10-50 个元素）
- 复杂 SolarWire 文件（> 50 个元素）
- 包含所有元素类型的文件
- 包含错误的文件（语法错误、属性错误）

**测试需求**:
- 简单需求（< 5 个页面）
- 中等需求（5-20 个页面）
- 复杂需求（> 20 个页面）

### 3. 性能优化

#### 3.1 渲染性能

**SVG 渲染优化**:
- 使用虚拟化（只渲染可见区域）
- 懒加载（延迟加载大型文件）
- 缓存渲染结果

**代码编辑优化**:
- 防抖处理（300ms）
- 增量解析（只解析变化的部分）
- 语法高亮优化

#### 3.2 内存优化

**文件缓存**:
- 限制打开文件数量（最多 10 个）
- 自动关闭未使用的文件
- 清理缓存

**版本存储**:
- 压缩历史版本
- 限制版本数量（最多保留 50 个）
- 定期清理旧版本

#### 3.3 性能监控

**指标**:
- 文件打开时间
- 渲染时间
- 内存占用
- CPU 占用

**工具**:
- Chrome DevTools
- Electron Performance Monitor
- 自定义性能日志

### 4. 日志和调试

#### 4.1 日志级别

**ERROR**: 严重错误，需要立即处理
**WARN**: 警告，不影响核心功能
**INFO**: 一般信息，用于追踪
**DEBUG**: 调试信息，开发阶段使用

#### 4.2 日志存储

**位置**:
- 开发环境：控制台
- 生产环境：日志文件（`logs/` 目录）

**日志文件**:
- 按日期分割
- 自动清理（保留最近 7 天）
- 最大文件大小（10MB）

#### 4.3 调试工具

**开发者工具**:
- Chrome DevTools（Renderer Process）
- Node.js Inspector（Main Process）

**调试模式**:
- 环境变量：`DEBUG=true`
- 启用详细日志
- 禁用生产优化

## 目录结构

```
SolarWire-APP/
├── src/
│   ├── main/                 # Main Process
│   │   ├── index.ts         # 主进程入口
│   │   ├── file-manager.ts   # 文件管理
│   │   ├── git-manager.ts   # Git 管理
│   │   ├── version-manager.ts # 版本管理
│   │   └── ipc/            # IPC 通信
│   ├── renderer/             # Renderer Process
│   │   ├── App.tsx          # 应用入口
│   │   ├── components/      # 组件
│   │   ├── stores/          # Zustand stores
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript 类型
│   └── shared/              # 共享代码
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

## 开发阶段

### 阶段 1：基础界面框架
- 整体布局框架（顶部导航、左侧面板、右侧编辑区、底部状态栏）
- 顶部软件导航栏
- 左侧面板：浏览树（文件视图）+ 版本显示区
- 右侧编辑区：空白模式 + Markdown 模式框架
- 底部状态栏

### 阶段 2：代码编辑 + 实时预览
- SolarWire 语法高亮
- 实时预览
- 打开/保存 .solarwire 文件
- 带注释/不带注释切换

### 阶段 3：Markdown 编辑
- Markdown 语法高亮
- 实时 Markdown 预览
- 支持 SolarWire 代码块渲染
- 打开/保存 .md 文件

### 阶段 4：可视化拖拽编辑
- 元素拖拽到画布
- 元素选中/拖动/调整大小
- 属性面板
- note 编辑器
- 双向同步（代码 ↔ 可视化）

### 阶段 5：批量 SVG 生成
- 从 Markdown 提取 SolarWire 代码块
- 批量生成带注释/不带注释 SVG
- .solarwire 目录结构管理
- SVG 命名规范（kebab-case）

### 阶段 6：四种浏览视图
- 文件视图
- 需求视图
- SolarWire 视图
- Git 视图
- 版本视图（独立）

### 阶段 7：Git 版本管理
- Git 提交历史查看
- 恢复到任意 Git 提交（checkout/reset）
- Git 版本对比（diff）
- Git 版本管理模式

### 阶段 8：Git 管理
- Git 视图
- Git 模式编辑区
- 本地 Git 管理（初始化、状态、暂存、提交、历史、分支）
- 远程仓库管理（克隆、添加/移除 remote、push、pull、fetch）

### 阶段 9：增强功能
- 代码自动补全
- 导出 PNG
- 主题切换
- 快捷键支持
- SolarWire 视图搜索和筛选

### 阶段 10：完善
- 错误处理和测试
- 性能优化
- 日志和调试
- 文档完善

## 总结

本设计文档详细描述了 SolarWire Editor 的完整架构、组件设计、数据流、关键功能、错误处理和测试策略。通过 Electron + React + SVG 的技术栈，结合现有的 SolarWire 核心库，可以实现一个功能完整、性能优良的文档工作台。

关键设计决策：
1. 使用 Electron 实现桌面应用，完全本地处理文件
2. 使用 SVG 作为可视化画布，直接复用现有 renderer-svg
3. 使用 Zustand 进行状态管理，轻量且高效
4. 实现双向同步（代码 ↔ 可视化），提供流畅的编辑体验
5. 独立的版本视图，根据选中内容筛选版本历史
6. 完整的错误处理和测试策略，确保应用稳定性
