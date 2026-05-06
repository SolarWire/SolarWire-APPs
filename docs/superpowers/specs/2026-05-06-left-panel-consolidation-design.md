# 左侧面板整合设计文档

## 1. 背景与问题

### 现状
项目当前有三层垂直空间占用：
1. **系统标题栏** (~34px) — Electron 默认
2. **TopMenuBar** (32px) — Logo + 打开/保存 + 主题/设置
3. **StatusBar** (24px) — 模式 + 操作状态 + 文件名

共计 ~90px 非内容区域高度，对画布编辑器来说过于奢侈。

### 核心问题

| 问题 | 说明 |
|------|------|
| 垂直空间浪费 | TopMenuBar + StatusBar 共 56px，画布面积损失 ~7% |
| 功能冗余 | StatusBar 的模式显示与 ViewTabs 重复，操作状态与 feedbackStore 重复 |
| 信息密度低 | TopMenuBar 32px 只放 4 个按钮，StatusBar 24px 只显示 3 项信息 |
| 大量死代码 | StatusBar.css 有 ~470 行，实际使用不到 20% |
| StatusStore 数据未渲染 | 9 项状态数据中只有 3 项被 UI 消费 |

## 2. 设计目标

1. **移除 TopMenuBar 和 StatusBar** — 节省 56px 垂直空间
2. **功能整合进左侧面板** — 头部区(Logo+操作) + 导航区(视图标签) + 内容区 + 底部区(状态+设置)
3. **补全缺失的状态显示** — 光标位置、缩放比例
4. **清理死代码** — 移除未使用的 CSS 和 statusStore 中无消费者的数据

## 3. 布局设计

### 3.1 整合后的布局

```
┌─ 系统标题栏 (~34px) ────────────────────────────────────────┐
├──────────┬───────────────────────────────────────────────────┤
│ 头部区    │                                                   │
│ 🖼️ Logo  │                                                   │
│ 📂 💾 ●  │                                                   │
│──────────│                                                   │
│ 导航区    │              RightPanel                           │
│ 📁🎨🧩   │                                                   │
│──────────│         (编辑器/预览/属性)                          │
│ 内容区    │                                                   │
│          │                                                   │
│ 文件树/   │                                                   │
│ 组件库    │                                                   │
│          │                                                   │
│──────────│                                                   │
│ 底部区    │                                                   │
│ 📄 file ●│                                                   │
│ Ln 12:5  │                                                   │
│ 100% ⚙️🌙│                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

### 3.2 左侧面板分区

#### 头部区 (LeftPanelHeader)

高度约 48px，包含：
- Logo 图标 (20×20px)
- 📂 打开目录按钮
- 💾 保存按钮（文件有修改时高亮显示 ● 标记，无修改时 disabled）

布局：水平排列，Logo 在左，按钮在右

#### 导航区 (ViewTabs — 已有)

视图切换标签：📁 文件 / 🎨 SolarWire / 🧩 组件库

#### 内容区 (已有)

文件树 / SolarWire 编辑器 / 组件库管理

#### 底部区 (LeftPanelFooter)

高度约 52px，包含：
- 第一行：文件名 + 修改标记（📄 filename ●）
- 第二行：上下文状态信息
  - SolarWire 模式：缩放比例 (100%)
  - Markdown 模式：光标位置 (Ln 12, Col 5)
- 右侧：⚙️ 设置按钮 + ☀️/🌙 主题切换

## 4. 功能迁移映射

### TopMenuBar → 左侧面板

| 原功能 | 新位置 | 组件 |
|--------|--------|------|
| Logo | 头部区左侧 | LeftPanelHeader |
| 📂 打开目录 | 头部区右侧 | LeftPanelHeader |
| 💾 保存 | 头部区右侧 | LeftPanelHeader |
| ☀️/🌙 主题切换 | 底部区右侧 | LeftPanelFooter |
| ⚙️ 设置 | 底部区右侧 | LeftPanelFooter |

### StatusBar → 左侧面板

| 原功能 | 新位置 | 说明 |
|--------|--------|------|
| 编辑器模式 | 导航区 (ViewTabs) | 已有，无需重复 |
| 操作状态 | feedbackStore | Toast/Notification/Operation 已承担 |
| 文件名+修改标记 | 底部区第一行 | LeftPanelFooter |

### StatusStore 数据 → 左侧面板底部区

| 数据 | 显示方式 | 条件 |
|------|----------|------|
| `filePath` + `fileStatus.isModified` | 📄 filename ● | 始终显示 |
| `editorStatus.zoom` | 100% | SolarWire 模式 |
| `fileStatus.cursorPosition` | Ln 12, Col 5 | Markdown 模式 |

### 不再显示的数据

| 数据 | 理由 |
|------|------|
| `fileStatus.encoding` | 始终 UTF-8，无需显示 |
| `fileStatus.lineCount` | 不重要 |
| `fileStatus.selectionCount` | 不重要 |
| `editorStatus.elementCount` | 可在属性面板查看 |
| `editorStatus.selectedElementCount` | 可在属性面板查看 |
| `isOnline` | 桌面应用始终在线 |
| `memoryUsage` | 开发调试用，不应暴露 |

## 5. 组件设计

### 5.1 LeftPanelHeader

```tsx
interface LeftPanelHeaderProps {
  // 无需 props，直接从 store 读取
}
```

- 从 `useFileStore` 读取 `saveFile`, `openDirectoryAtPath`
- 从 `useEditorStore` 读取 `isModified`
- 保存按钮：`isModified` 时添加 `.modified` 类名高亮，否则 disabled

### 5.2 LeftPanelFooter

```tsx
interface LeftPanelFooterProps {
  // 无需 props，直接从 store 读取
}
```

- 从 `useStatusStore` 读取 `filePath`, `fileStatus`, `editorStatus`
- 从 `useAppStore` 读取 `theme`, `setTheme`
- 状态行：根据 `editorStatus.mode` 切换显示缩放/光标
- 设置按钮：打开 SettingsModal

### 5.3 LeftPanel (改造)

```tsx
const LeftPanel: React.FC = () => {
  return (
    <div className="left-panel">
      <LeftPanelHeader />
      <ViewTabs />
      <LeftPanelFooter />
    </div>
  );
};
```

ViewTabs 的内容区占据剩余空间（flex: 1）。

## 6. 废弃清单

| 文件/代码 | 处理方式 |
|-----------|----------|
| `components/layout/TopMenuBar.tsx` | 删除 |
| `components/layout/TopMenuBar.css` | 删除 |
| `components/layout/StatusBar.tsx` | 删除 |
| `components/layout/StatusBar.css` | 删除 |
| `components/layout/AppLayout.tsx` | 移除 TopMenuBar 和 StatusBar 引用 |
| `components/layout/AppLayout.css` | 移除相关布局样式 |
| `stores/statusStore.ts` → `isOnline` / `setOnlineStatus` | 移除（桌面应用不需要） |
| `stores/statusStore.ts` → `memoryUsage` / `updateMemoryUsage` | 移除（开发调试用） |
| `services/system-monitor-service.ts` | 删除（仅服务 isOnline/memoryUsage） |

## 7. 迁移计划

### Phase 1: 创建 LeftPanelHeader 和 LeftPanelFooter

1. 创建 `LeftPanelHeader.tsx` + `LeftPanelHeader.css`
2. 创建 `LeftPanelFooter.tsx` + `LeftPanelFooter.css`
3. 改造 `LeftPanel.tsx` + `LeftPanel.css`（添加头部区和底部区）

### Phase 2: 移除 TopMenuBar 和 StatusBar

1. 从 `AppLayout.tsx` 移除 TopMenuBar 和 StatusBar
2. 删除 `TopMenuBar.tsx` / `TopMenuBar.css`
3. 删除 `StatusBar.tsx` / `StatusBar.css`
4. 清理 `AppLayout.css`

### Phase 3: 清理 StatusStore

1. 移除 `isOnline` / `setOnlineStatus`
2. 移除 `memoryUsage` / `updateMemoryUsage`
3. 删除 `system-monitor-service.ts`
4. 清理所有引用

### Phase 4: 验证

1. TypeScript 编译检查
2. Vite 构建验证
3. 功能验证：打开/保存/主题切换/设置/视图切换
