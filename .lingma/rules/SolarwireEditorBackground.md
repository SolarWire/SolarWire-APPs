---
trigger: always_on
---

# SolarWire Editor 项目背景与上下文

## 项目定位
**SolarWire Editor** 是一个基于 **Electron** 的**本地桌面编辑器应用**，用于可视化编辑 SolarWire 格式的文档。

## 技术栈
| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 27.x |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5.x |
| 状态管理 | Zustand |
| 代码编辑器 | Monaco Editor |
| 可视化渲染 | SVG (自定义 parser + renderer) |
| Git 集成 | simple-git |
| 打包工具 | electron-builder |

## 关键开发约束

### 1. Electron 架构约束
- **主进程/渲染进程分离**：文件系统、Git 等操作必须在主进程中执行，通过 IPC 通信
- **Preload 脚本**：使用 `contextBridge` 暴露安全 API 给渲染进程
- **Sandbox 模式**：启用 `sandbox: true`，渲染进程无法直接访问 Node.js API
- **IPC 通信**：所有跨进程调用必须通过 `ipcMain.handle` / `ipcRenderer.invoke`

### 2. 本地文件系统安全
- **路径白名单验证**：所有文件操作必须验证路径在项目根目录内（防止 Path Traversal）
- **用户授权**：文件/目录访问必须通过用户主动选择（dialog.showOpenDialog）
- **禁止任意路径访问**：不允许硬编码或外部传入的绝对路径直接操作

### 3. 原生模块与依赖
- **避免浏览器专用库**：不要引入依赖 `window.localStorage`、`IndexedDB` 等浏览器 API 且无 Electron 替代方案的库
- **Node.js 模块**：仅在主进程中使用 `fs`、`path`、`os` 等 Node.js 原生模块
- **包体积控制**：Electron 应用对包体积敏感，避免引入大型依赖

### 4. 构建与打包
- **开发命令**：`npm run dev`（Windows: `npm run dev:win`）
- **生产构建**：`npm run build`（使用 electron-builder 打包）
- **输出目录**：`editor/dist/`（主进程编译产物）、`editor/releases/`（安装包）

### 5. 数据存储
- **用户配置**：使用 `app.getPath('userData')` 存储应用数据
- **项目文件**：用户选择的本地目录，不复制到应用内部
- **持久化状态**：使用 `localStorage`（渲染进程）或 JSON 文件（主进程）

## 目录结构
```
editor/
├── src/
│   ├── main/           # Electron 主进程代码
│   │   ├── index.ts    # 入口文件
│   │   ├── ipc/        # IPC handlers
│   │   ├── file-manager.ts
│   │   └── git-manager.ts
│   ├── preload/        # Preload 脚本
│   └── renderer/       # React 渲染进程代码
│       ├── components/
│       ├── stores/     # Zustand stores
│       └── utils/
├── package.json
└── vite.config.ts
```
