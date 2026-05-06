# 保存逻辑重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构保存逻辑，用 `fullFileContent` 替代 `fileContent`，实现 md 模式和 solarwire 模式对同一文件的安全编辑

**Architecture:** `fullFileContent` 作为完整文件的唯一内存真相，solarwire 编辑实时同步到 `fullFileContent`，保存统一写 `fullFileContent` 到磁盘

**Tech Stack:** React, Zustand, TypeScript, Electron

---

### Task 1: 更新类型定义

**Files:**
- Modify: `editor/src/shared/types/file.ts`

- [ ] **Step 1: 替换 `fileContent` 为 `fullFileContent`，删除 `setFileContent`/`updateFileContent`**

```typescript
export interface FileState {
  currentPath: string;
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  selectedImage: { path: string } | null;
  fullFileContent: string;
  expandedDirectories: Set<string>;
  currentSnippet: SolarWireSnippet | null;
  autoRefreshEnabled: boolean;
  autoRefreshTimer: NodeJS.Timeout | null;
  refreshKey: number;
  setCurrentPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setSelectedFile: (file: FileNode | null) => void;
  setSelectedImage: (image: { path: string } | null) => void;
  setCurrentSnippet: (snippet: SolarWireSnippet | null) => void;
  openFileAtPath?: (filePath: string) => Promise<void>;
  openSolarWireSnippet?: (snippet: SolarWireSnippet) => Promise<void>;
  openDirectoryAtPath?: (dirPath: string) => Promise<void>;
  toggleDirectory?: (dirPath: string) => void;
  saveFile: () => Promise<void>;
  refreshCurrentDirectory: () => Promise<void>;
  toggleAutoRefresh: () => void;
}
```

- [ ] **Step 2: 运行 typecheck 确认类型错误暴露所有需要修改的位置**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -50`

---

### Task 2: 重写 fileStore

**Files:**
- Modify: `editor/src/app/stores/fileStore.ts`

- [ ] **Step 1: 替换 `fileContent` 为 `fullFileContent`，删除 `setFileContent`/`updateFileContent`**

将初始状态中 `fileContent: ''` 改为 `fullFileContent: ''`，删除 `setFileContent` 和 `updateFileContent` 方法。

- [ ] **Step 2: 重写 `openFileAtPath`**

```
打开文件时：
- fullFileContent = 磁盘内容
- selectedFile = node
- currentSnippet = null
- 不再设置 fileContent
```

- [ ] **Step 3: 重写 `openSolarWireSnippet`**

```
打开 snippet 时：
- 从磁盘读取完整 md 内容 → fullFileContent = 完整 md
- 从 fullFileContent 中提取 snippet 代码
- editorContent = 提取的代码
- currentSnippet = snippet
```

- [ ] **Step 4: 重写 `saveFile`**

```
保存逻辑：
1. 校验内容类型
2. md 模式：fullFileContent = editorContent，写磁盘
3. solarwire snippet 模式：fullFileContent 已实时同步，直接写磁盘
4. solarwire 独立文件模式：fullFileContent = editorContent，写磁盘
5. 保存后不清空 currentSnippet
6. 保存后重新解析 snippet 元数据（md 文件场景）
```

- [ ] **Step 5: 运行 typecheck**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -50`

---

### Task 3: 重写 SolarWireMode

**Files:**
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

- [ ] **Step 1: 删除有害 useEffect**

删除 L132-138（同步 `fileContent` 到 `editorContent`）和 L141-146（同步 `editorContent` 到 `fileContent`）。

- [ ] **Step 2: 重写 `handleContentChange`，增加实时同步 `fullFileContent`**

```
handleContentChange(newContent):
1. setContent(newContent)
2. 如果 currentSnippet 存在：
   fullFileContent = replaceSolarWireSnippetInMarkdown(fullFileContent, snippetIndex, newContent)
3. 如果 currentSnippet 不存在：
   fullFileContent = newContent
```

- [ ] **Step 3: 增加撤销/重做同步 `fullFileContent` 的逻辑**

监听 `editorStore.content` 变化，同步到 `fullFileContent`。使用 zustand subscribe 或 useEffect。

- [ ] **Step 4: 更新 store 引用**

`fileContent` → `fullFileContent`，`setFileContent` → 直接操作 `fullFileContent`。

- [ ] **Step 5: 运行 typecheck**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -50`

---

### Task 4: 更新 MarkdownMode

**Files:**
- Modify: `editor/src/app/components/editor-modes/MarkdownMode.tsx`

- [ ] **Step 1: 替换 `fileContent` 为 `fullFileContent`**

所有 `fileContent` 引用替换为 `fullFileContent`，删除 `updateFileContent` 引用。

- [ ] **Step 2: 简化内容加载逻辑**

md 模式下 `editorContent` 应始终等于 `fullFileContent`，简化 useEffect。

- [ ] **Step 3: 运行 typecheck**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -50`

---

### Task 5: 更新 MarkdownPreview

**Files:**
- Modify: `editor/src/app/components/editor/MarkdownPreview.tsx`

- [ ] **Step 1: 替换 `fileContent` 为 `fullFileContent`**

所有 `fileContent` 引用替换为 `fullFileContent`。

- [ ] **Step 2: 运行 typecheck**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -50`

---

### Task 6: 全量 typecheck + lint

- [ ] **Step 1: 运行全量 typecheck**

Run: `cd editor && npx tsc --noEmit -p tsconfig.app.json`

- [ ] **Step 2: 运行 lint**

Run: `cd editor && npx eslint src --ext .ts,.tsx`

- [ ] **Step 3: 修复所有错误**

---

### Task 7: 手动验证

- [ ] **Step 1: 启动开发服务器**

Run: `cd editor && npm run dev`

- [ ] **Step 2: 验证场景**

1. md 模式保存 → 文件内容正确
2. solarwire snippet 保存 → md 文件中只有代码块被替换
3. solarwire 编辑后切换到 md 模式 → 显示包含未保存编辑的 md
4. md 模式编辑后切换到 solarwire 模式 → md 编辑不丢失
5. solarwire 代码 tab 保存后 → 不会自动切换 tab
6. 连续多次保存 → 内容不重复
