# 阶段 2：Store 拆分 - gitStore 职责分离

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将膨胀的 gitStore 拆分为 3 个职责单一的 Store

**Architecture:** 创建 gitDiffStore（版本对比）和 gitAnalysisStore（分析进度），精简 gitStore 为基础 Git 操作

**Tech Stack:** TypeScript, Zustand, React

**Prerequisites:** 阶段 1 完成

---

## 文件结构

### 创建的文件
1. `src/app/stores/gitDiffStore.ts` - 版本对比功能
2. `src/app/stores/gitAnalysisStore.ts` - 版本分析进度

### 修改的文件
1. `src/app/stores/gitStore.ts` - 移除已迁移的状态和方法
2. 所有使用 `gitStore` 中 diff/analysis 相关状态的组件 - 更新导入

---

### Task 1: 创建 gitDiffStore

**Files:**
- Create: `c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor\src\app\stores\gitDiffStore.ts`

- [ ] **Step 1: 创建 gitDiffStore.ts**

```typescript
import { create } from 'zustand';
import { GitCommit } from '../../shared/types/git';

interface GitDiffState {
  isDiffMode: boolean;
  leftCommit: GitCommit | null;
  rightCommit: GitCommit | null;
  leftFileContent: string;
  rightFileContent: string;
  fileDiff: string;
}

interface GitDiffActions {
  enterDiffMode: () => void;
  exitDiffMode: () => void;
  setLeftCommit: (commit: GitCommit | null) => void;
  setRightCommit: (commit: GitCommit | null) => void;
  loadLeftFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadRightFileContent: (filePath: string, commitHash: string) => Promise<void>;
  loadFileDiff: (filePath: string, commitHash1: string, commitHash2: string) => Promise<void>;
}

type GitDiffStore = GitDiffState & GitDiffActions;

const api = (window as any).api?.git;

export const useGitDiffStore = create<GitDiffStore>((set) => ({
  // 初始状态
  isDiffMode: false,
  leftCommit: null,
  rightCommit: null,
  leftFileContent: '',
  rightFileContent: '',
  fileDiff: '',

  // Actions
  enterDiffMode: () => set({ isDiffMode: true }),
  
  exitDiffMode: () => set({ 
    isDiffMode: false,
    leftCommit: null,
    rightCommit: null,
    leftFileContent: '',
    rightFileContent: '',
    fileDiff: ''
  }),
  
  setLeftCommit: (commit) => set({ leftCommit: commit }),
  
  setRightCommit: (commit) => set({ rightCommit: commit }),
  
  loadLeftFileContent: async (filePath: string, commitHash: string) => {
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ leftFileContent: content });
    } catch (error) {
      console.error('Failed to load left file content:', error);
    }
  },
  
  loadRightFileContent: async (filePath: string, commitHash: string) => {
    if (!api) return;
    try {
      const content = await api.getFileContentAtCommit(filePath, commitHash);
      set({ rightFileContent: content });
    } catch (error) {
      console.error('Failed to load right file content:', error);
    }
  },
  
  loadFileDiff: async (filePath: string, commitHash1: string, commitHash2: string) => {
    if (!api) return;
    try {
      const diff = await api.getFileDiffBetweenCommits(filePath, commitHash1, commitHash2);
      set({ fileDiff: diff });
    } catch (error) {
      console.error('Failed to load file diff:', error);
    }
  },
}));
```

- [ ] **Step 2: 验证文件创建成功**

检查文件无语法错误

- [ ] **Step 3: Commit**

```bash
git add src/app/stores/gitDiffStore.ts
git commit -m "feat: create gitDiffStore for version comparison"
```

---

### Task 2: 创建 gitAnalysisStore

**Files:**
- Create: `c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor\src\app\stores\gitAnalysisStore.ts`

- [ ] **Step 1: 创建 gitAnalysisStore.ts**

```typescript
import { create } from 'zustand';

interface GitAnalysisProgress {
  total: number;
  processed: number;
  status: 'running' | 'completed' | 'cancelled';
  matchingCommits?: number;
  onCancel?: () => void;
}

interface GitAnalysisState {
  gitAnalysis: GitAnalysisProgress | null;
}

interface GitAnalysisActions {
  setGitAnalysis: (progress: GitAnalysisProgress | null) => void;
  cancelAnalysis: () => void;
}

type GitAnalysisStore = GitAnalysisState & GitAnalysisActions;

export const useGitAnalysisStore = create<GitAnalysisStore>((set) => ({
  gitAnalysis: null,

  setGitAnalysis: (progress) => set({ gitAnalysis: progress }),

  cancelAnalysis: () => set((state) => {
    if (state.gitAnalysis?.onCancel) {
      state.gitAnalysis.onCancel();
    }
    return { gitAnalysis: null };
  }),
}));
```

- [ ] **Step 2: 验证文件创建成功**

检查文件无语法错误

- [ ] **Step 3: Commit**

```bash
git add src/app/stores/gitAnalysisStore.ts
git commit -m "feat: create gitAnalysisStore for version analysis progress"
```

---

### Task 3: 精简 gitStore

**Files:**
- Modify: `c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor\src\app\stores\gitStore.ts`

- [ ] **Step 1: 从 gitStore 中删除 diff 相关状态**

从 gitStore.ts 的 `GitState` 接口中删除：
```typescript
// ❌ 删除以下行
isDiffMode: boolean;
leftCommit: GitCommit | null;
rightCommit: GitCommit | null;
leftFileContent: string;
rightFileContent: string;
fileDiff: string;
```

- [ ] **Step 2: 从 gitStore 中删除 analysis 相关状态**

从 gitStore.ts 的 `GitState` 接口中删除：
```typescript
// ❌ 删除以下行
gitAnalysis: GitAnalysisProgress | null;
```

- [ ] **Step 3: 从 gitStore 中删除 diff 相关方法**

删除以下方法：
```typescript
// ❌ 删除
enterDiffMode
exitDiffMode
setLeftCommit
setRightCommit
loadLeftFileContent
loadRightFileContent
loadFileDiff
```

- [ ] **Step 4: 从 gitStore 中删除 analysis 相关方法**

删除所有更新 `gitAnalysis` 状态的代码

- [ ] **Step 5: 验证 gitStore 只保留基础功能**

确认 gitStore 现在只包含：
- `isInitialized`
- `status`
- `history`
- `branches`
- `currentBranch`
- 基础操作方法（initGit, commit, push, pull 等）
- `getGitLog`

- [ ] **Step 6: 类型检查**

Run: `cd editor && npx tsc --noEmit`

Expected: 可能有引用错误（下一步修复）

- [ ] **Step 7: Commit**

```bash
git add src/app/stores/gitStore.ts
git commit -m "refactor: simplify gitStore to basic git operations only"
```

---

### Task 4: 更新所有引用

**Files:**
- Modify: 所有使用 `isDiffMode`, `gitAnalysis` 等状态的组件

- [ ] **Step 1: 搜索所有引用**

搜索以下关键字：
- `useGitStore.*isDiffMode`
- `useGitStore.*leftCommit`
- `useGitStore.*rightCommit`
- `useGitStore.*fileDiff`
- `useGitStore.*gitAnalysis`

- [ ] **Step 2: 更新每个文件的导入**

对于每个找到的文件，将：
```typescript
import { useGitStore } from '../stores/gitStore';
```

改为（根据需要）：
```typescript
import { useGitStore } from '../stores/gitStore';
import { useGitDiffStore } from '../stores/gitDiffStore';
import { useGitAnalysisStore } from '../stores/gitAnalysisStore';
```

- [ ] **Step 3: 更新状态访问**

将：
```typescript
const { isDiffMode, setLeftCommit } = useGitStore();
```

改为：
```typescript
const { isDiffMode, setLeftCommit } = useGitDiffStore();
```

- [ ] **Step 4: 验证类型检查通过**

Run: `cd editor && npx tsc --noEmit`

Expected: 无错误

- [ ] **Step 5: 验证应用可启动**

Run: `cd editor && npm run dev`

Expected: 应用正常启动

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: update all components to use new git stores"
```

---

## 验收标准

- [ ] `gitDiffStore.ts` 已创建并包含所有 diff 相关功能
- [ ] `gitAnalysisStore.ts` 已创建并包含分析进度管理
- [ ] `gitStore.ts` 只包含基础 Git 操作（< 150 行）
- [ ] 所有组件正确导入新的 Store
- [ ] TypeScript 检查零错误
- [ ] 应用正常运行
- [ ] 无循环依赖

---

**Next:** 阶段 3 - 组件解耦（需要先完成此阶段）
