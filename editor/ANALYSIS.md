# SolarWire Editor - 项目架构分析报告

## 1. 项目概述

**SolarWire Editor** 是一个基于 Electron + React 的桌面端文档编辑工作区，专为 SolarWire 标记语言设计。它整合了代码编辑、可视化拖拽编辑、Markdown 编辑、SVG 实时预览和 Git 版本管理等功能。

| 属性 | 值 |
|------|-----|
| 名称 | solarwire-editor |
| 版本 | 0.1.0 |
| 应用 ID | com.solarwire.editor |
| 窗口尺寸 | 1400 × 900 |
| 主题 | Dark / Light |
| 品牌色 | #FCA506 (琥珀黄) |

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | ^27.0.0 |
| UI 框架 | React | ^18.2.0 |
| 语言 | TypeScript | ^5.2.0 |
| 构建工具 | Vite | ^5.0.0 |
| 代码编辑器 | Monaco Editor | ^0.55.1 |
| 状态管理 | Zustand | ^4.4.0 |
| Markdown 渲染 | marked | ^17.0.5 |
| 代码高亮 | highlight.js | ^11.11.1 |
| 图表渲染 | Mermaid | ^11.14.0 |
| Git 操作 | simple-git | ^3.22.0 |
| 单元测试 | Vitest | ^4.1.4 |
| E2E 测试 | Playwright | ^1.59.1 |
| 打包发布 | electron-builder | ^24.6.0 |

### 核心依赖（本地包）
- `@solarwire/parser` — SolarWire 语法解析器（PEG.js 语法文件）
- `@solarwire/renderer-svg` — SVG 渲染引擎

---

## 3. 项目架构

### 3.1 目录结构

```
editor/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 应用入口、窗口创建
│   │   ├── file-manager.ts      # 文件系统操作 (CRUD + 安全校验)
│   │   ├── git-manager.ts       # Git 仓库管理类
│   │   └── ipc/                 # IPC 通信处理器
│   │       ├── index.ts         # IPC 注册入口
│   │       ├── file-handlers.ts # 文件操作 IPC
│   │       ├── dialog-handlers.ts # 对话框 IPC
│   │       ├── git-handlers.ts  # Git 操作 IPC
│   │       └── test-handlers.ts # 测试环境 IPC
│   ├── preload/
│   │   └── index.ts             # Context Bridge API 暴露
│   ├── renderer/                # React 渲染进程
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── components/
│   │   │   ├── layout/          # 布局组件 (5组件)
│   │   │   ├── editor/          # 编辑器组件 (7组件)
│   │   │   ├── editor-modes/    # 编辑模式 (5模式)
│   │   │   ├── views/           # 视图面板 (7组件)
│   │   │   └── ui/              # 通用 UI 组件
│   │   ├── stores/              # Zustand 状态管理 (8个 store)
│   │   ├── styles/              # 全局样式
│   │   ├── types/               # TypeScript 类型定义
│   │   ├── utils/               # 工具函数
│   │   └── lib/                 # SolarWire 核心库
│   │       ├── parser-src/      # 语法解析器源码
│   │       └── renderer-svg-src/# SVG 渲染器源码
│   └── shared/                  # (预留) 共享模块
├── tests/e2e/                   # E2E 测试
├── public/                      # 静态资源
└── releases/                    # 构建输出
```

### 3.2 进程架构

```
┌─────────────────────────────────────────────────────┐
│                   Electron Main Process              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ file-manager │  │ git-manager  │  │    IPC     │  │
│  │  (fs 操作)   │  │ (simple-git) │  │ (handlers) │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │ contextBridge (安全隔离)
                          │ window.api.*
┌─────────────────────────┴───────────────────────────┐
│                  Renderer Process (React)             │
│  ┌─────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │  Stores  │  │ Components │  │     SolarWire     │  │
│  │ (Zustand)│  │  (React)   │  │  Parser + SVG     │  │
│  └─────────┘  └───────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 4. 状态管理设计

项目使用 **Zustand** 管理全局状态，共 8 个 Store：

| Store | 职责 | 关键状态 |
|-------|------|----------|
| `appStore` | 全局应用状态 | `currentView`, `theme` |
| `editorStore` | 编辑器核心状态 | `mode`, `content`, `isModified`, `history` (undo/redo) |
| `fileStore` | 文件系统状态 | `currentPath`, `fileTree`, `selectedFile`, `currentSnippet` |
| `gitStore` | Git 版本控制 | `status`, `history`, `branches`, `isDiffMode` |
| `solarWireStore` | SolarWire 画布交互 | `selectedElements`, `selectionTool`, `isPanMode`, `dragState` |
| `solarWireUIStore` | SolarWire UI 状态 | `showNotes`, `zoomLevel`, `isSpacePressed` |
| `settingsStore` | 用户设置 | `gitName`, `gitEmail`, `primaryColor`, `favoriteColors` |
| `versionStore` | 版本列表 | `versions`, `selectedVersion` |

### Store 间依赖关系
```
fileStore ──→ editorStore (内容同步)
fileStore ──→ gitStore (目录打开时初始化 Git)
editorStore ──→ (独立，被多个 store 调用)
```

---

## 5. UI 布局架构

```
┌────────────────────────────────────────────────────┐
│                    TopMenuBar                       │
├──────────────┬──────────┬──────────────────────────┤
│              │ Divider  │                          │
│  LeftPanel   │ (可拖拽) │      RightPanel          │
│  ┌────────┐  │          │                          │
│  │ViewTabs│  │          │  ┌────────────────────┐  │
│  │(顶部)  │  │          │  │   EditorMode       │  │
│  ├────────┤  │          │  │  - BlankMode       │  │
│  │Divider │  │          │  │  - MonacoMode      │  │
│  ├────────┤  │          │  │  - SolarWireMode   │  │
│  │Version │  │          │  │  - MarkdownMode    │  │
│  │GitTabs │  │          │  │  - VersionDiffMode │  │
│  │(底部)  │  │          │  └────────────────────┘  │
│  └────────┘  │          │                          │
├──────────────┴──────────┴──────────────────────────┤
│                    StatusBar                        │
└────────────────────────────────────────────────────┘
```

### 5.1 五种视图类型 (ViewType)
1. **File View** — 文件树浏览
2. **Requirement View** — 需求管理
3. **SolarWire View** — SolarWire snippet 列表
4. **Version View** — 版本历史
5. **Git View** — Git 操作面板

### 5.2 五种编辑器模式 (EditorMode)
1. **BlankMode** — 空白/欢迎页
2. **MonacoMode** — 纯代码编辑 (Monaco Editor)
3. **SolarWireMode** — SolarWire 可视化编辑（代码 + 画布 + 属性面板）
4. **MarkdownMode** — Markdown 编辑 + 实时预览
5. **VersionDiffMode** — 版本对比视图

---

## 6. 核心功能模块

### 6.1 SolarWire 解析与渲染管线

```
SolarWire 源码 → PEG.js Parser → AST (Document) → SVG Renderer → SVG Output
```

**AST 类型系统** (types.ts)：
- 坐标系：`AbsoluteCoordinate` | `RelativeCoordinate` | `EdgeCoordinate`
- 元素类型：`Rectangle`, `RoundedRectangle`, `Circle`, `Text`, `Placeholder`, `Image`, `Line`, `Table`
- 文档结构：`Document { declarations[], elements[] }`

**SVG 渲染器** (renderer-svg-src/)：
- `renderer.ts` — 核心渲染逻辑
- `context.ts` — 渲染上下文管理
- `elements/` — 分类渲染器：`rectangle.ts`, `lineAndContainer.ts`, `otherElements.ts`

### 6.2 文件管理

- **路径安全验证**: `validatePath()` 防止 Path Traversal 攻击
- **文件树构建**: 递归扫描目录，深度限制 3 层（snippet 收集 10 层）
- **SolarWire Snippet 提取**: 从 `.sw`/`.solarwire` 文件和 Markdown 代码块中提取
- **Snippet 保存**: 在 Markdown 中精准替换指定 `solarwire` 代码块

### 6.3 Git 版本管理

- **GitRepository 类**: 封装 simple-git 操作，每个实例管理一个仓库
- **安全措施**:
  - `validateFilePath()` — 防止路径遍历
  - `validateBranchName()` — 白名单校验分支名
  - `validateCommitHash()` — 只允许十六进制格式
  - `sanitizeCommitMessage()` — 长度限制 + 特殊字符过滤
- **并发控制**: `gitOperationLock` 互斥锁防止并发 Git 操作
- **重试机制**: `withRetry()` 指数退避策略（最多 3 次，1s/2s/4s）
- **完整操作**: init, status, log, branch, stage, unstage, commit, checkout, push, pull, fetch, diff

### 6.4 IPC 通信

通过 `contextBridge` 安全暴露 API，分 4 组 handler：

| 分组 | Channel 前缀 | 功能 |
|------|-------------|------|
| File | `file:*` | read, write, listDirectory, getFileTree, collectSolarWireSnippets |
| Dialog | `dialog:*` | openFile (系统对话框) |
| Git | `git:*` | 20+ 个 Git 操作 |
| Test | `test:*` | 测试环境专用 |

---

## 7. 安全设计

| 安全措施 | 实现位置 |
|----------|---------|
| Context Isolation | `contextIsolation: true` (main/index.ts:79) |
| Sandbox 模式 | `sandbox: true` (main/index.ts:80) |
| 禁用 Node Integration | `nodeIntegration: false` (main/index.ts:78) |
| CSP 策略 | `<meta http-equiv="Content-Security-Policy">` (index.html:8) |
| 路径遍历防护 | `validatePath()` + `allowedRootPath` 白名单 (file-manager.ts:41-61) |
| Git 命令注入防护 | 分支名/Hash/消息的严格校验 (git-manager.ts:96-138) |
| 禁止不安全内容 | `allowRunningInsecureContent: false` (main/index.ts:82) |

---

## 8. 开发者体验

### 8.1 开发启动
```bash
npm run vite          # 启动 Vite dev server (port 3000)
npm run electron:dev  # 编译 TS + 启动 Electron
```

Electron 启动时自动扫描 3000-3010 端口寻找 Vite 服务器。

### 8.2 测试体系
- **单元测试**: Vitest + Testing Library + jsdom
- **E2E 测试**: Playwright
- **测试目录**: `src/renderer/components/__tests__/`, `src/renderer/stores/__tests__/`, `src/renderer/utils/__tests__/`, `tests/e2e/`

### 8.3 构建与发布
```bash
npm run build  # TS编译(main+preload+app) → Vite打包 → electron-builder
```
输出格式：Windows (NSIS), macOS (DMG), Linux (AppImage)

---

## 9. 特色设计模式

### 9.1 Snippet 编辑模式
编辑器支持从 Markdown 中提取 `solarwire` 代码块作为独立 snippet 编辑，保存时通过 `replaceSolarWireSnippetInMarkdown()` 精准回写到原文件中对应的代码块位置。

### 9.2 主题系统
- CSS 变量驱动：`--bg-primary`, `--bg-secondary`, `--accent-color` 等
- 通过 `body.theme-light` / `body.theme-dark` class 切换
- 品牌色可通过设置面板自定义
- 持久化到 `localStorage`

### 9.3 可拖拽面板
`ResizableDivider` 组件实现面板尺寸可调（水平+垂直），支持最小/最大尺寸约束。

### 9.4 自动恢复
应用启动时自动恢复上次打开的目录路径（`localStorage`），无需用户重新选择。

---

## 10. 代码质量评估

### 优点
- **安全意识强**: Context Isolation + Sandbox + CSP + 路径验证 + 输入校验，多层防护
- **架构清晰**: 严格的 Main/Preload/Renderer 进程分离
- **状态管理规范**: 8 个 Store 职责明确，依赖关系清晰
- **Git 操作健壮**: 并发锁 + 重试机制 + 输入验证
- **类型安全**: 全量 TypeScript，接口定义完整

### 可改进点
- `shared/` 目录为空，Main/Renderer 存在重复的类型定义（如 `FileNode`, `GitStatus` 等）
- `solarWireStore` 中 `dragState` 和 `resizeState` 使用 `any` 类型
- `editorStore` 的 undo/redo 实现是简单的全量快照，大文件场景下内存开销大
- 部分 store（如 `versionStore`）功能较薄，可考虑合并到 `gitStore`
- `window.api` 类型使用 `(window as any).api`，缺少全局类型声明

---

## 11. 文件统计

| 类别 | 文件数 |
|------|--------|
| TypeScript 源文件 | ~50+ |
| CSS 样式文件 | ~15 |
| 配置文件 | 7 (tsconfig ×3, vite, vitest, playwright, electron-builder) |
| 测试文件 | 分布在各模块 `__tests__/` + `tests/e2e/` |
