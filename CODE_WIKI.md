# SolarWire-APP Code Wiki

## 1. 项目概览

### 1.1 项目定位

SolarWire-APP 是一个基于 Electron 的本地桌面编辑器应用，用于可视化编辑 SolarWire 格式的文档。项目包含两个核心子项目：

| 子项目 | 路径 | 定位 |
|--------|------|------|
| **editor** | `editor/` | Electron 桌面编辑器应用（主项目） |
| **mcp-server** | `mcp-server/` | MCP 协议服务器，为 AI 工具提供 PRD 生成、SVG 渲染等能力 |

### 1.2 核心功能

1. **SolarWire 代码编辑** — Monaco Editor 驱动，支持语法高亮和自动补全
2. **可视化拖放编辑** — 拖放方式创建和组织 SolarWire 元素，实时预览
3. **实时 SVG 预览** — 编辑过程中实时渲染文档为 SVG 图形
4. **Markdown 编辑** — 支持 Markdown 文档编辑和预览，内嵌 SolarWire 代码块
5. **组件库管理** — 创建、导入、导出 .swc 组件库文件
6. **MCP 工具链** — PRD 生成、代码逆向分析、测试用例生成等 AI 辅助能力

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 选型依据 |
|------|------|------|----------|
| 桌面框架 | Electron | 27.x | 跨平台桌面应用，Node.js + Web 技术 |
| 前端框架 | React + TypeScript | 19.x / 5.x | 组件化开发，类型安全 |
| 构建工具 | Vite | 5.x | 快速 HMR 和构建 |
| 状态管理 | Zustand | 4.x | 轻量级，无 boilerplate |
| 代码编辑器 | Monaco Editor | 0.55.x | VS Code 同款编辑器内核 |
| 可视化渲染 | SVG（@solarwire/renderer-svg） | — | 矢量图形，可缩放 |
| 解析器 | Peggy（PEG 解析器生成） | 0.10.x | 语法解析器生成 |
| MCP SDK | @modelcontextprotocol/sdk | 1.x | AI 工具协议标准 |
| 打包 | electron-builder | 24.x | 跨平台打包分发 |
| 测试 | Vitest + Playwright | 4.x / 1.x | 单元测试 + E2E 测试 |

---

## 3. 项目架构

### 3.1 顶层目录结构

```
SolarWire-APP/
├── editor/                  # Electron 桌面编辑器（主项目）
│   ├── src/                 # 源代码
│   ├── public/              # 静态资源（Monaco Editor、Logo）
│   ├── scripts/             # 构建脚本
│   ├── dist/                # 构建产物
│   └── releases/            # 发布包
├── mcp-server/              # MCP 协议服务器
│   ├── src/                 # 源代码
│   ├── tests/               # 测试
│   └── output/              # 输出目录
├── editor-skills/           # AI Skills 参考文档和备份
│   ├── backup/              # 旧版 Skills 备份
│   └── reference/           # 通用 Skills 参考
├── docs/                    # 项目文档
└── .trae/                   # Trae 配置
```

### 3.2 Editor 架构（Electron 多进程）

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  index.ts    │  │  ipc/                             │ │
│  │  (入口)      │  │  ├── index.ts (IPC 注册)          │ │
│  │              │  │  ├── file-handlers.ts (文件操作)   │ │
│  │              │  │  ├── dialog-handlers.ts (对话框)   │ │
│  │              │  │  └── test-handlers.ts (测试API)    │ │
│  └──────────────┘  └──────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (contextBridge)
┌──────────────────────┴──────────────────────────────────┐
│                   Preload Script                         │
│  ┌──────────────────────────────────────────────────────┐│
│  │  preload/index.ts — 暴露 window.api 到渲染进程       ││
│  │  readFile / writeFile / getFileTree / ...            ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  Renderer Process (React)                │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  App.tsx     │  │  stores/     │  │  services/    │  │
│  │  (根组件)    │  │  (Zustand)   │  │  (业务服务)   │  │
│  └──────┬──────┘  └──────────────┘  └───────────────┘  │
│         │                                                │
│  ┌──────┴──────────────────────────────────────────────┐│
│  │  context/EditorContext — 统一编辑器上下文             ││
│  └──────┬──────────────────────────────────────────────┘│
│         │                                                │
│  ┌──────┴──────────────────────────────────────────────┐│
│  │  components/                                         ││
│  │  ├── layout/     (AppLayout, TopMenuBar, Panels)    ││
│  │  ├── editor/     (MonacoEditor, Preview, Property)  ││
│  │  └── editor-modes/ (SolarWireMode, MarkdownMode)    ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  lib/ (核心引擎)                                     ││
│  │  ├── parser/     (SolarWire 语法解析)               ││
│  │  ├── renderer/   (SVG 渲染)                         ││
│  │  └── components/ (SWC 解析器, 缩略图生成)           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  shared/ (共享代码)                                  ││
│  │  ├── types/      (TypeScript 类型定义)              ││
│  │  ├── utils/      (工具函数)                         ││
│  │  └── hooks/      (React Hooks)                      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.3 MCP Server 架构

```
┌─────────────────────────────────────────────────────┐
│                  MCP Server (Stdio)                  │
│                                                     │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │  server.ts    │  │  tools/                     │  │
│  │  (入口+注册)  │  │  ├── generate-prd.tool.ts   │  │
│  │               │  │  ├── code-to-prd.tool.ts    │  │
│  │               │  │  ├── validate-code.tool.ts  │  │
│  │               │  │  ├── render-svg.tool.ts     │  │
│  │               │  │  ├── generate-component.ts  │  │
│  │               │  │  └── prd-to-testcase.tool.ts │  │
│  └───────────────┘  └────────────────────────────┘  │
│                                                     │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │  prompts/     │  │  engines/                   │  │
│  │  ├── brainstorm         │  ├── solarwire-parser │  │
│  │  ├── requirements      │  └── solarwire-renderer│  │
│  │  ├── user-story        │                        │  │
│  │  ├── acceptance-criteria│                        │  │
│  │  └── competitor-analysis│                        │  │
│  └───────────────┘  └────────────────────────────┘  │
│                                                     │
│  ┌───────────────┐                                  │
│  │  middleware/  │                                  │
│  │  └── logger.ts                                   │
│  └───────────────┘                                  │
└─────────────────────────────────────────────────────┘
```

---

## 4. 核心模块详解

### 4.1 主进程（Main Process）

#### 4.1.1 入口文件 `editor/src/main/index.ts`

| 函数 | 职责 |
|------|------|
| `checkPort(port)` | 检测 Vite 开发服务器是否在指定端口运行 |
| `findVitePort()` | 从 3000~3010 端口自动发现 Vite 服务器 |
| `createWindow()` | 创建 BrowserWindow，配置安全策略（contextIsolation、sandbox） |

**安全策略**：`nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`，通过 preload 脚本暴露受限 API。

#### 4.1.2 IPC 处理器 `editor/src/main/ipc/`

| 文件 | 注册通道 | 职责 |
|------|----------|------|
| `index.ts` | — | 统一注册入口，调用各子模块 |
| `file-handlers.ts` | `file:read`、`file:write`、`file:listDirectory`、`file:getFileTree`、`file:copy`、`file:ensureDir`、`file:readImageAsBase64`、`file:setAllowedRoot`、`file:rename`、`file:deleteFile`、`file:deleteDirectory`、`file:mkdir`、`file:exists`、`file:showItemInFolder`、`file:collectSolarWireSnippets` | 文件系统操作 |
| `dialog-handlers.ts` | `dialog:openFile`、`dialog:saveFile` | 原生对话框 |
| `test-handlers.ts` | `test:set-directory` | 测试环境专用 |

#### 4.1.3 Preload 脚本 `editor/src/preload/index.ts`

通过 `contextBridge.exposeInMainWorld('api', {...})` 向渲染进程暴露安全的文件系统 API。测试环境额外暴露 `testAPI`。

---

### 4.2 渲染进程（Renderer Process）

#### 4.2.1 应用入口 `editor/src/app/App.tsx`

初始化流程：
1. 加载用户设置（`settingsStore.loadSettings`）
2. 加载语言配置（`i18nStore.loadLanguage`）
3. 恢复主题（从 localStorage）
4. 恢复上次打开的目录
5. 注册系统监控服务清理
6. 包裹 `EditorProvider` 提供统一上下文

#### 4.2.2 布局组件 `editor/src/app/components/layout/`

| 组件 | 职责 |
|------|------|
| `AppLayout` | 顶层布局：TopMenuBar + MainContent + StatusBar，注册 Ctrl+S 快捷键 |
| `TopMenuBar` | 顶部菜单栏 |
| `MainContent` | 主内容区域，根据编辑模式切换视图 |
| `LeftPanel` | 左侧面板（文件树/组件库） |
| `RightPanel` | 右侧面板（属性面板） |
| `StatusBar` | 底部状态栏 |

#### 4.2.3 编辑器组件 `editor/src/app/components/editor/`

| 组件 | 职责 |
|------|------|
| `MonacoEditor` | Monaco 代码编辑器封装，支持 SolarWire 语法高亮 |
| `SolarWireVisualEditor` | 可视化拖放编辑器，处理元素选择、拖拽、缩放 |
| `SolarWirePreview` | SVG 实时预览渲染 |
| `PropertyPanel` | 属性面板，编辑选中元素的属性 |
| `ElementLibrary` | 元素库面板，提供可拖放的 SolarWire 元素 |
| `LayerPanel` | 图层面板，管理元素层级 |
| `ComponentLibrary` | 组件库面板，管理 .swc 组件 |
| `FileTree` | 文件树组件 |
| `ColorPicker` | 颜色选择器 |
| `ErrorPanel` / `ErrorCard` | 错误面板 |
| `ImagePreview` | 图片预览 |
| `MarkdownPreview` | Markdown 预览 |
| `ShortcutPanel` | 快捷键面板 |

#### 4.2.4 编辑器模式 `editor/src/app/components/editor-modes/`

| 模式组件 | 对应 EditorMode | 职责 |
|----------|----------------|------|
| `BlankMode` | `blank` | 空白模式，无文件打开时显示 |
| `SolarWireMode` | `solarwire` | SolarWire 编辑模式，代码+可视化双栏 |
| `MarkdownMode` | `markdown` | Markdown 编辑模式，代码+预览双栏 |
| `ComponentLibraryManagerMode` | `componentLibraryManager` | 组件库管理器模式 |

---

### 4.3 状态管理（Zustand Stores）

#### 4.3.1 Store 概览

| Store | 文件 | 核心职责 |
|-------|------|----------|
| `useAppStore` | `stores/appStore.ts` | 视图切换（file/requirement/solarwire/componentLibraryManager）、主题管理 |
| `useEditorStore` | `stores/editorStore.ts` | 编辑器内容、模式、修改状态、历史记录（撤销） |
| `useFileStore` | `stores/fileStore.ts` | 文件树、文件打开/保存、目录导航、自动刷新 |
| `useSolarWireStore` | `stores/solarWireStore.ts` | SolarWire 编辑器状态：选择、工具、缩放、平移 |
| `usePreviewStore` | `stores/previewStore.ts` | 预览画布状态：缩放、位置、拖拽、对齐辅助线、框选 |
| `useSettingsStore` | `stores/settingsStore.ts` | 用户设置：主色、收藏颜色、选择工具 |
| `useComponentLibraryStore` | `stores/componentLibraryStore.ts` | 组件库 CRUD、拖放排序、导入导出 |
| `useSelectionStore` | `stores/selectionStore.ts` | 跨视图选择状态 |
| `useSwcContentStore` | `stores/swcContentStore.ts` | SWC 文件编辑内容 |
| `useI18nStore` | `stores/i18nStore.ts` | 国际化（中/英） |
| `useStatusStore` | `stores/statusStore.ts` | 状态栏信息 |

#### 4.3.2 Store 间通信

Store 之间通过 **EventBus**（发布/订阅模式）解耦通信：

```
EditorEvents 枚举:
├── CONTENT_CHANGED    — 编辑器内容变化
├── MODE_CHANGED       — 编辑模式切换
├── FILE_OPENED        — 文件打开事件
├── FILE_SAVED         — 文件保存事件
├── SELECTION_CHANGED  — 选择变化
├── SETTINGS_CHANGED   — 设置变化
└── COMPONENT_LIBRARY_CHANGED — 组件库变化
```

典型通信链路：
- `fileStore.openFileAtPath` → 发射 `CONTENT_CHANGED` + `MODE_CHANGED` → `editorStore` 监听更新
- `solarWireStore.setSelectionTool` → 发射 `SETTINGS_CHANGED` → `settingsStore` 监听同步

---

### 4.4 服务层（Services）

| 服务 | 文件 | 职责 | 设计模式 |
|------|------|------|----------|
| `ComponentLibraryManager` | `services/ComponentLibraryManager.ts` | 组件库业务逻辑核心，管理内存中的库数据 | 单例 + 操作锁（withLock） |
| `IndexedDBService` | `services/IndexedDBService.ts` | IndexedDB 持久化存储，实现 `IComponentLibraryStorage` 接口 | 接口隔离（ISP） |
| `ElectronFileSystemService` | `services/file-system-service.ts` | 文件系统操作，通过 `window.api` 调用主进程 | 接口隔离（ISP） |
| `IComponentLibraryStorage` | `services/IComponentLibraryStorage.ts` | 组件库存储抽象接口 | 依赖倒置（DIP） |
| `MonacoService` | `services/monaco-service.ts` | Monaco Editor 实例管理 | — |
| `SyntaxErrorService` | `services/syntax-error-service.ts` | 语法错误状态管理 | — |
| `SystemMonitorService` | `services/system-monitor-service.ts` | 系统资源监控 | — |
| `LoggerService` | `services/logger-service.ts` | 日志服务 | — |
| `ImageService` | `services/image-service.ts` | 图片处理 | — |
| `FileDialogService` | `services/file-dialog-service.ts` | 文件对话框 | — |
| `ToastService` | `services/toast-service.ts` | 消息提示 | — |

**关键设计**：`ComponentLibraryManager` 依赖 `IComponentLibraryStorage` 接口而非 `IndexedDBService` 具体实现，符合依赖倒置原则（DIP）。

---

### 4.5 核心引擎（lib/）

#### 4.5.1 解析器 `editor/src/lib/parser/`

| 导出 | 类型 | 职责 |
|------|------|------|
| `parse(input: string): Document` | 函数 | 将 SolarWire DSL 代码解析为 AST（Document 对象） |
| `Document` | 接口 | 文档根节点，包含 declarations 和 elements |
| `Element` | 联合类型 | 所有元素类型的联合（Rectangle/Circle/Text/Placeholder/Image/Line/Table/TableRow） |
| `CoordinateExpression` | 接口 | 坐标表达式，支持绝对/相对/边缘坐标 |

**解析流程**：
1. Peggy 生成的解析器（`parser.js`）执行词法/语法分析
2. `parse()` 函数包装解析结果，添加行号映射
3. `buildNestedStructure()` 根据缩进构建嵌套结构（表格→行→单元格）

**AST 类型体系**：

```
Document
├── declarations: DocumentDeclaration[]  (!key=value 声明)
└── elements: Element[]
    ├── RectangleElement   — [text] @(x,y) width= height=
    ├── CircleElement      — ((text)) @(x,y) radius=
    ├── TextElement        — "text" @(x,y) font-size=
    ├── PlaceholderElement — [?text] @(x,y)
    ├── ImageElement       — <url> @(x,y)
    ├── LineElement        — --label-- @(x1,y1)->(x2,y2)
    ├── TableElement       — ## @(x,y) w= h= (含 children)
    └── TableRowElement    — # (含 children)
```

#### 4.5.2 渲染器 `editor/src/lib/renderer/`

| 导出 | 职责 |
|------|------|
| `render(ast, options?, withMeta?)` | 将 AST 渲染为 SVG 字符串或含元数据对象 |
| `renderElement(element, context)` | 渲染单个元素 |
| `createRenderContext()` / `createChildContext()` | 创建渲染上下文 |
| `RenderContext` | 渲染上下文，维护坐标系统、样式等 |

**渲染器元素模块**：

| 文件 | 渲染元素 |
|------|----------|
| `elements/rectangle.ts` | 矩形、圆角矩形、占位符 |
| `elements/lineAndContainer.ts` | 线条、表格（容器） |
| `elements/otherElements.ts` | 圆形、文本、图片 |

#### 4.5.3 组件库工具 `editor/src/lib/components/`

| 导出 | 职责 |
|------|------|
| `parseSWC(content: string): SWCParseResult` | 解析 .swc 文本格式为 ComponentLibrary 对象 |
| `serializeSWC(library: ComponentLibrary): string` | 将 ComponentLibrary 序列化为 .swc 文本格式 |
| `generateThumbnail(code, width?, height?)` | 为 SolarWire 代码生成 SVG 缩略图 |
| `generateThumbnailBatch(components, onProgress?)` | 批量生成缩略图 |

**SWC 文件格式**：基于 Markdown 风格的文本格式，使用 `#`/`##`/`###` 标记层级，`` ```solarwire `` 代码块包含组件代码。

---

### 4.6 共享工具（shared/）

#### 4.6.1 类型定义 `editor/src/shared/types/`

| 文件 | 核心类型 | 职责 |
|------|----------|------|
| `app.ts` | `ViewType`, `Theme`, `AppState` | 应用级类型 |
| `editor.ts` | `EditorMode`, `EditorState` | 编辑器模式：blank/markdown/solarwire/image/componentLibraryManager |
| `file.ts` | `FileNode`, `SolarWireSnippet`, `FileState` | 文件系统类型 |
| `component.ts` | `ComponentLibrary`, `Component`, `ComponentCategory`, `ComponentLibraryItem` | 组件库类型 |

#### 4.6.2 工具函数 `editor/src/shared/utils/`

| 文件 | 核心函数 | 职责 |
|------|----------|------|
| `EventBus.ts` | `EventBus` 类, `EditorEvents` 枚举 | 全局事件总线，发布/订阅模式 |
| `coordinate-converter.ts` | `absoluteToRelative()`, `relativeToAbsolute()`, `getLineCoordinates()` | 绝对/相对坐标转换，线段坐标处理 |
| `coordinate-utils.ts` | — | 坐标计算辅助 |
| `element-operations.ts` | `bringElementsToFront()`, `alignElements()` | 元素层级操作、对齐操作 |
| `element-bounds.ts` | `detectElementBounds()`, `detectTableBounds()`, `detectNoteBounds()` | 元素边界检测（表格、多行 note、多行文本） |
| `attribute-updater.ts` | — | 属性更新工具 |
| `component-utils.ts` | `generateInternalId()`, `generatePrefixedId()`, `isPresetLibrary()`, `makeNodeId()` | 组件 ID 生成、预设库检测、节点 ID 编码 |
| `solarwire-utils.ts` | Monaco 语言注册、拖放内容验证 | SolarWire 相关工具 |
| `file-utils.ts` | `readFile()` | 文件读取 |
| `preview-utils.ts` | — | 预览相关工具 |
| `constants.ts` | — | 常量定义 |

#### 4.6.3 React Hooks `editor/src/shared/hooks/`

| Hook | 职责 |
|------|------|
| `useCoordinateSystem` | 坐标系统 Hook，处理画布坐标转换 |
| `useDragCoordinate` | 拖拽坐标 Hook，处理拖放过程中的坐标计算 |

---

### 4.7 编辑器上下文 `editor/src/app/context/EditorContext.tsx`

`EditorProvider` 聚合四个 Store 的状态，提供统一的 `useEditorContext()` Hook：

| 来源 Store | 暴露的状态 |
|------------|-----------|
| `editorStore` | content, mode, isModified, undo |
| `solarWireStore` | selectedElements, selectionTool, isPanMode, showNotes, zoomLevel |
| `settingsStore` | showGrid, gridSize, snapToGrid, favoriteColors, primaryColor |
| `componentLibraryStore` | showComponentLibrary, activeLibraryId |

---

### 4.8 MCP Server 模块

#### 4.8.1 服务器入口 `mcp-server/src/server.ts`

使用 `@modelcontextprotocol/sdk` 创建 MCP 服务器，通过 Stdio 传输层通信。

#### 4.8.2 MCP 工具

| 工具 | 文件 | 功能 |
|------|------|------|
| `generate-prd` | `tools/generate-prd.tool.ts` | 生成含 SolarWire 线框图的完整 PRD 文档 |
| `code-to-prd` | `tools/code-to-prd.tool.ts` | 从代码逆向工程生成 PRD |
| `validate-solarwire-code` | `tools/validate-code.tool.ts` | 校验 SolarWire 代码语法和可渲染性 |
| `render-svg` | `tools/render-svg.tool.ts` | 将 SolarWire 代码渲染为 SVG |
| `generate-component-library` | `tools/generate-component.tool.ts` | 生成/修改 .swc 组件库文件 |
| `prd-to-testcase` | `tools/prd-to-testcase.tool.ts` | 从 PRD 生成测试用例（Given-When-Then） |

#### 4.8.3 MCP Prompts

| Prompt | 功能 |
|--------|------|
| `brainstorm` | 头脑风暴，引导需求收集 |
| `requirements-analysis` | 需求分析，多维度评估 |
| `user-story` | 用户故事编写 |
| `acceptance-criteria` | 验收标准制定（Given-When-Then） |
| `competitor-analysis` | 竞品分析框架 |

#### 4.8.4 引擎层 `mcp-server/src/engines/`

MCP Server 内嵌了 SolarWire 解析器和渲染器的 JS 编译产物（与 editor 共享同一套引擎逻辑）。

---

## 5. 依赖关系图

### 5.1 Editor 模块依赖

```
App.tsx
├── EditorProvider (context)
│   ├── editorStore
│   ├── solarWireStore
│   ├── settingsStore
│   └── componentLibraryStore
├── AppLayout
│   ├── TopMenuBar
│   ├── MainContent → editor-modes/*
│   │   ├── SolarWireMode
│   │   │   ├── MonacoEditor ← lib/parser, monaco-service
│   │   │   ├── SolarWireVisualEditor ← lib/renderer, previewStore
│   │   │   └── PropertyPanel ← solarWireStore
│   │   ├── MarkdownMode
│   │   │   ├── MonacoEditor
│   │   │   └── MarkdownPreview ← marked, highlight.js
│   │   └── ComponentLibraryManagerMode
│   │       └── ComponentLibrary ← ComponentLibraryManager
│   └── StatusBar ← statusStore
└── Stores
    ├── fileStore ← fileSystemService (→ preload → main IPC)
    ├── editorStore ← EventBus
    └── componentLibraryStore ← ComponentLibraryManager ← IndexedDBService
```

### 5.2 数据流

```
用户操作 → React Component → Zustand Store → EventBus → 其他 Store
                                    ↓
                              Service Layer
                                    ↓
                          ┌─────────┴──────────┐
                     IndexedDB           Electron IPC
                     (组件库)             (文件系统)
                                              ↓
                                        Main Process
                                              ↓
                                        Node.js fs API
```

### 5.3 外部依赖关系

```
editor
├── @solarwire/parser     → file:../../SolarWire/packages/core/parser
├── @solarwire/renderer-svg → file:../../SolarWire/packages/core/renderer-svg
├── solarwire             → github:SolarWire/SolarWire
├── react / react-dom     → UI 框架
├── zustand               → 状态管理
├── monaco-editor         → 代码编辑器
├── marked                → Markdown 渲染
├── mermaid               → Mermaid 图表渲染
├── @viz-js/viz           → Graphviz 渲染
└── highlight.js          → 代码高亮

mcp-server
├── @modelcontextprotocol/sdk → MCP 协议
├── zod                   → 参数校验
├── exceljs               → Excel 生成
├── commander             → CLI 参数
└── winston               → 日志
```

---

## 6. 关键流程说明

### 6.1 文件打开流程

```
1. 用户点击文件树中的文件
2. fileStore.openFileAtPath(filePath) 被调用
3. 通过 fileSystemService.readFile() → window.api.readFile() → IPC → 主进程读取文件
4. 根据文件扩展名判断模式（.sw → solarwire, .md → markdown, 图片 → image）
5. 发射 EventBus 事件：CONTENT_CHANGED + MODE_CHANGED
6. editorStore 监听事件，更新内容和模式
7. 对应的 Mode 组件渲染编辑界面
```

### 6.2 文件保存流程

```
1. 用户按 Ctrl+S
2. AppLayout 捕获快捷键 → fileStore.saveFile()
3. 区分两种场景：
   a. 独立文件：直接写入 editorContent
   b. Markdown 内嵌 SolarWire 代码块（snippet）：
      → 读取原始 md 文件
      → 用 editorContent 替换对应位置的代码块
      → 写入完整 md 内容
4. 通过 fileSystemService.writeFile() → IPC → 主进程写入文件
5. 重置 isModified 状态
```

### 6.3 可视化编辑流程

```
1. SolarWireMode 渲染 MonacoEditor + SolarWireVisualEditor 双栏
2. MonacoEditor 内容变化 → editorStore.setContent()
3. SolarWireVisualEditor 监听内容变化 → parse() 解析 → render() 渲染 SVG
4. 用户在预览区拖拽元素 → solarWireStore 更新选中状态
5. PropertyPanel 编辑属性 → 更新代码内容 → 重新解析渲染
6. 坐标转换：useCoordinateSystem / useDragCoordinate 处理画布坐标↔代码坐标
```

### 6.4 组件库管理流程

```
1. ComponentLibraryManager 初始化 → IndexedDBService 加载用户库
2. 预设库从内存加载（isPresetLibrary 检测）
3. 组件操作（CRUD）→ withLock 保证操作原子性 → storage.saveLibrary() 持久化
4. 缩略图生成：parse() → render() → 缩放裁剪为 150x100 SVG
5. 导入：parseSWC() 解析 .swc 文件 → 生成缩略图 → 保存到 IndexedDB
6. 导出：serializeSWC() 序列化 → 触发浏览器下载
```

---

## 7. 项目运行与构建

### 7.1 环境准备

```bash
# 前置条件：Node.js >= 18, npm >= 9

# 克隆项目
git clone <repository-url>
cd SolarWire-APP/editor

# 安装依赖
npm install
```

> **注意**：`@solarwire/parser` 和 `@solarwire/renderer-svg` 通过 `file:` 协议引用本地 SolarWire 核心包，需确保 `../../SolarWire/packages/core/` 路径存在。

### 7.2 Editor 开发命令

```bash
# 启动开发服务器（Vite + Electron 并行）
npm run dev

# 仅启动 Vite 开发服务器
npm run vite

# 仅启动 Electron
npm run electron:dev

# 代码检查
npm run lint              # ESLint 检查
npm run lint:fix          # ESLint 自动修复
npm run lint:styles       # Stylelint 检查
npm run lint:styles:fix   # Stylelint 自动修复
npm run lint:all          # 全部检查

# 类型检查
npm run typecheck         # 渲染进程类型检查
npm run typecheck:all     # 全部类型检查

# 测试
npm run test:e2e          # Playwright E2E 测试
npm run test:e2e:ui       # E2E 测试 UI 模式
npm run test:e2e:debug    # E2E 测试调试模式

# 构建
npm run build             # TypeScript 编译 + Vite 构建 + electron-builder 打包
npm run preview           # Vite 预览构建产物
```

### 7.3 MCP Server 开发命令

```bash
cd mcp-server

# 安装依赖
npm install

# 开发模式（tsx watch 热重载）
npm run dev

# 构建
npm run build

# 运行
npm start

# 测试
npm test
npm run test:watch

# 代码检查
npm run lint
npm run format
```

### 7.4 完整打包命令

```bash
# Editor 桌面应用打包
cd c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor
npm run build
```

`npm run build` 执行的完整流程：
1. `tsc -p tsconfig.main.json` — 编译主进程 TypeScript
2. `tsc -p tsconfig.preload.json` — 编译 Preload 脚本
3. `tsc -p tsconfig.app.json` — 编译渲染进程 TypeScript
4. `vite build` — Vite 构建前端资源
5. `electron-builder` — 打包为安装程序

打包配置见 `editor/electron-builder.yml`，支持 Windows（nsis）、macOS（dmg）、Linux（AppImage）。

### 7.5 TypeScript 配置体系

| 配置文件 | 目标 | 模块系统 | 输出 |
|----------|------|----------|------|
| `tsconfig.json` | 根配置，路径映射 | — | — |
| `tsconfig.app.json` | 渲染进程（React） | ESNext | Vite 处理 |
| `tsconfig.main.json` | 主进程（Electron） | CommonJS | `dist/main/` |
| `tsconfig.preload.json` | Preload 脚本 | CommonJS | `dist/preload/` |

---

## 8. SolarWire 语法速查

### 8.1 文档结构

```solarwire
!title=Document Title
!author=Author Name

// 注释
[Rectangle] @(100, 100) width=200 height=100
```

### 8.2 元素类型

| 语法 | 类型 | 示例 |
|------|------|------|
| `[text]` | 矩形 | `[Button] @(100, 100) width=120 height=40` |
| `(text)` | 圆角矩形 | `(Card) @(100, 100) width=200 height=100` |
| `((text))` | 圆形 | `((Avatar)) @(100, 100) radius=30` |
| `"text"` | 文本 | `"Hello" @(100, 100) font-size=16 bold` |
| `[?text]` | 占位符 | `[?Image] @(100, 100) width=200 height=150` |
| `<url>` | 图片 | `<https://img.png> @(100, 100) width=100` |
| `--label--` | 线条 | `--Arrow-- @(100,100)->(200,200) color=red` |
| `##` | 表格 | `## @(100, 400) w=800 h=300` |

### 8.3 属性系统

- **坐标**：`@(x, y)` — 绝对坐标
- **键值对**：`key=value` — 如 `width=200 color=blue`
- **布尔属性**：`bold italic` — 等同于 `bold=true italic=true`
- **Note 属性**：`note="""内容"""` — 支持多行
- **声明**：`!key=value` — 文档级属性

---

## 9. 设计原则与模式

### 9.1 已应用的设计模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| **发布/订阅** | `EventBus` + `EditorEvents` | Store 间解耦通信 |
| **依赖倒置** | `IComponentLibraryStorage` / `IFileSystemService` | 高层模块依赖抽象接口 |
| **单例** | `componentLibraryManager`, `fileSystemService`, `indexedDBService` | 全局唯一服务实例 |
| **操作锁** | `ComponentLibraryManager.withLock()` | 防止并发操作导致数据不一致 |
| **Context Provider** | `EditorProvider` | 聚合多 Store 状态，统一消费 |
| **策略模式** | `EditorMode` 类型切换 | 不同文件类型使用不同编辑模式组件 |

### 9.2 进程隔离

严格遵循 Electron 安全最佳实践：
- 主进程负责文件系统和原生 API
- 渲染进程通过 `contextBridge` 暴露的 `window.api` 访问文件系统
- Preload 脚本作为安全桥梁，不直接暴露 Node.js API

---

## 10. 国际化

项目支持中英文切换，通过 `i18nStore` 管理：

| 配置 | 说明 |
|------|------|
| 存储位置 | `localStorage('solarwire-language')` |
| 支持语言 | `en`（英文）、`zh`（中文） |
| 翻译函数 | `useI18nStore().t` — TranslationKeys 对象 |
| 切换方式 | `useI18nStore().setLanguage('zh')` |
