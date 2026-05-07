# SolarWire-APP

## 项目背景

SolarWire-APP 是一个基于 Electron 的本地桌面编辑器应用，用于可视化编辑 SolarWire 格式的文档。该项目旨在提供一个直观、高效的编辑环境，使开发者能够轻松创建和管理 SolarWire 文档。

### 项目目标
- 提供直观的 SolarWire 文档编辑界面
- 支持可视化拖放编辑和代码编辑两种模式
- 实现实时预览功能，确保编辑效果的即时反馈
- 集成版本控制功能，方便文档的历史管理
- 跨平台支持，确保在不同操作系统上的一致体验

### 核心功能
1. **SolarWire 代码编辑**：支持 SolarWire 语法的代码编辑器，提供语法高亮和自动完成
2. **可视化拖放编辑**：通过拖放方式快速创建和组织 SolarWire 元素
3. **实时预览**：编辑过程中实时显示文档的渲染效果
4. **Markdown 编辑**：支持 Markdown 文档的编辑和预览
5. **版本管理**：集成 Git 功能，支持文档的版本控制
6. **批量 SVG 生成**：支持批量生成 SVG 图形

## SolarWire 语法

SolarWire 是一种用于描述可视化文档的标记语言，具有简洁直观的语法。以下是 SolarWire 语法的主要元素：

### 文档结构
- **声明**：以 `!` 开头的行，用于设置文档属性，如 `!title=Document Title`
- **元素**：构成文档的基本单位，包括容器元素和简单元素

### 容器元素
- **表格**：以 `##` 开头，用于组织多个元素
- **表格行**：以 `#` 开头，作为表格的行

### 简单元素
- **矩形**：使用 `[text]`，如 `[Rectangle] @(100, 100) width=200 height=100`
- **圆角矩形**：使用 `(text)`，如 `(Rounded Rectangle) @(100, 100) width=200 height=100`
- **圆形**：使用 `((text))`，如 `((Circle)) @(100, 100) radius=50`
- **文本**：使用 `"text"`，如 `"Hello World" @(100, 100) font-size=20`
- **占位符**：使用 `[?text]`，如 `[?Placeholder] @(100, 100) width=200 height=100`
- **图片**：使用 `<url>`，如 `<https://example.com/image.png> @(100, 100) width=200 height=100`
- **线条**：使用 `--label--` 或 `--label`，如 `--Connect-- @(100, 100)->(200, 200) color=red`

### 元素属性
- **坐标**：使用 `@(x, y)` 表示元素的位置
- **属性**：使用 `key=value` 格式，如 `width=200 height=100 color=blue`
- **布尔属性**：使用 `key` 格式，表示 `key=true`，如 `bold italic`
- **note 属性**：用于添加元素的注释或说明，支持单行和多行内容，统一使用三引号
  - 单行 note：`note="""This is a note"""`
  - 多行 note：直接在三引号内换行
    ```
    note="""This is a
    multiline note"""
    ```

### 值类型
- **双引号字符串**：`"content"`，支持转义字符如 `\n` 和 `\"`
- **三引号字符串**：`"""content"""`，支持多行内容
- **简单值**：不含空格、等号的字符串，如 `red`、`200`

### 注释
- 使用 `//` 开头的单行注释，如 `// This is a comment`

### 示例
```solarwire
!title=Sample Document
!author=John Doe

// 矩形元素 - 带有单行 note
[Rectangle] @(100, 100) width=200 height=100 color=blue note="""This is a rectangle"""

// 圆角矩形元素 - 带有多行 note
(Rounded Rectangle) @(400, 100) width=200 height=100 color=green note="""
This is a rounded rectangle
with multiline note
"""

// 圆形元素
((Circle)) @(700, 100) radius=50 color=red

// 文本元素
"Hello SolarWire" @(400, 300) font-size=24 bold

// 线条元素
--Connect-- @(200, 200)->(400, 200) color=black

// 表格元素
## @(100, 400) width=800 height=300
# @(100, 450) height=50
[Header 1] @(150, 450) width=200
[Header 2] @(350, 450) width=200
[Header 3] @(550, 450) width=200
# @(100, 500) height=50
[Cell 1] @(150, 500) width=200
[Cell 2] @(350, 500) width=200
[Cell 3] @(550, 500) width=200
```

## 技术选型

| 层级 | 技术 | 选型依据 |
|------|------|----------|
| 桌面框架 | Electron 27.x | 跨平台桌面应用开发，支持 Node.js API 和 Web 技术 |
| 前端框架 | React 18 + TypeScript | 组件化开发，类型安全，性能优异 |
| 构建工具 | Vite 5.x | 快速的开发服务器和构建速度 |
| 状态管理 | Zustand | 轻量级状态管理，易于使用和集成 |
| 代码编辑器 | Monaco Editor | 功能强大的代码编辑器，支持语法高亮和自动完成 |
| 可视化渲染 | SVG | 轻量级、可缩放的矢量图形格式 |
| Git 集成 | simple-git | 简化的 Git 操作接口 |
| 样式方案 | CSS + Tailwind CSS | 灵活的样式管理，支持响应式设计 |
| 打包工具 | electron-builder | 跨平台打包和分发 |

## 目录结构

```
SolarWire-APP/
├── editor/                # 编辑器应用
│   ├── dist/              # 构建产物
│   ├── releases/          # 发布包
│   ├── src/               # 源代码
│   │   ├── app/           # 渲染进程代码（前端应用）
│   │   │   ├── assets/    # 静态资源
│   │   │   ├── components/ # React 组件
│   │   │   │   ├── editor/ # 编辑器相关组件
│   │   │   │   ├── editor-modes/ # 编辑器模式
│   │   │   │   ├── layout/ # 布局组件
│   │   │   │   ├── ui/     # UI 组件
│   │   │   │   └── views/  # 视图组件
│   │   │   ├── hooks/      # 自定义 React Hooks
│   │   │   ├── stores/     # Zustand 状态管理
│   │   │   ├── styles/     # 全局样式
│   │   │   ├── App.tsx     # 根组件
│   │   │   └── main.tsx    # 渲染进程入口
│   │   ├── components/     # 共享 UI 组件
│   │   ├── lib/            # 核心库
│   │   │   ├── parser/     # SolarWire 解析器
│   │   │   ├── renderer/   # SVG 渲染器
│   │   │   └── monaco/     # Monaco Editor
│   │   ├── main/           # 主进程代码
│   │   │   ├── ipc/        # IPC 处理器
│   │   │   ├── file-manager.ts # 文件管理
│   │   │   ├── git-manager.ts # Git 管理
│   │   │   └── index.ts    # 主进程入口
│   │   ├── preload/        # Preload 脚本
│   │   └── shared/         # 共享代码
│   │       ├── services/    # 业务服务
│   │       ├── types/       # TypeScript 类型定义
│   │       └── utils/       # 工具函数
│   ├── .gitignore          # Git 忽略文件
│   ├── README.md           # 项目说明
│   ├── components.json     # 组件配置
│   ├── electron-builder.yml # 打包配置
│   ├── index.html          # HTML 模板
│   ├── package.json        # 项目配置
│   └── vite.config.ts      # Vite 配置
└── .gitignore              # 全局 Git 忽略文件
```

### 核心模块说明

#### 1. 主进程 (src/main/)
- **file-manager.ts**：负责文件系统操作，如读写文件、创建目录等
- **git-manager.ts**：负责 Git 相关操作，如初始化仓库、提交、分支管理等
- **ipc/**：处理主进程与渲染进程之间的通信

#### 2. 渲染进程 (src/app/)
- **components/editor/**：编辑器核心组件，包括 MonacoEditor、SolarWirePreview 等
- **components/editor-modes/**：不同编辑模式的实现，如 SolarWireMode、MarkdownMode 等
- **components/layout/**：应用布局组件，如 TopMenuBar、LeftPanel、RightPanel 等
- **components/views/**：不同视图的实现，如 SolarWireView、FileView、GitView 等
- **stores/**：状态管理，使用 Zustand 管理应用状态
- **hooks/**：自定义 React Hooks，封装业务逻辑

#### 3. 核心库 (src/lib/)
- **parser/**：SolarWire 语言解析器，负责将 SolarWire 代码解析为抽象语法树
- **renderer/**：SVG 渲染器，负责将解析后的元素渲染为 SVG 图形
- **monaco/**：Monaco Editor 相关文件，提供代码编辑功能

#### 4. 共享代码 (src/shared/)
- **services/**：业务服务，封装核心业务逻辑
- **types/**：TypeScript 类型定义
- **utils/**：工具函数，提供通用功能

## 开发历程及关键里程碑

### 项目初始化
- **2026-01-01**：项目立项，确定技术栈和架构设计
- **2026-01-15**：完成项目初始化，搭建基础框架

### 核心功能开发
- **2026-02-01**：实现 SolarWire 解析器
- **2026-02-15**：实现 SVG 渲染器
- **2026-03-01**：集成 Monaco Editor，实现代码编辑功能
- **2026-03-15**：实现可视化拖放编辑功能
- **2026-04-01**：集成 Git 功能，实现版本管理
- **2026-04-14**：完成项目结构重构，优化代码组织

### 后续规划
- **2026-05-15**：添加更多导出格式支持
- **2026-06-01**：优化性能和用户体验
- **2026-06-15**：发布正式版本

## 开发指南

### 环境搭建
1. 克隆项目：`git clone <repository-url>`
2. 进入项目目录：`cd SolarWire-APP/editor`
3. 安装依赖：`npm install`

### 开发命令
- **启动开发服务器**：`npm run dev`
- **启动 Electron 应用**：`npm run electron:dev`
- **构建生产版本**：`npm run build`
- **打包应用**：`npm run package`

### 代码规范
- **代码风格**：使用 ESLint + Prettier 统一代码风格
- **类型检查**：使用 TypeScript 进行类型检查
- **测试**：使用 Jest + React Testing Library 进行测试

### 贡献指南
1.  Fork 项目
2.  创建功能分支：`git checkout -b feature/your-feature`
3.  提交更改：`git commit -m "feat: add your feature"`
4.  推送到分支：`git push origin feature/your-feature`
5.  创建 Pull Request

## 技术文档

- **架构设计**：`docs/architecture.md`
- **开发指南**：`docs/development.md`

---

*SolarWire-APP - 可视化 SolarWire 文档编辑器*