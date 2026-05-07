# 阶段 1：基础修复 - 类型统一与死代码清理

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一所有 Git 相关类型定义到一个位置，删除冗余的 versionStore

**Architecture:** 删除重复的类型定义，统一使用 `shared/types/git.ts` 中的定义，删除未被使用的 versionStore

**Tech Stack:** TypeScript, Zustand, React

---

## 文件结构

### 需要修改的文件
1. `src/app/stores/gitStore.ts` - 删除本地类型定义，导入共享类型
2. `src/app/stores/versionStore.ts` - **删除整个文件**
3. 所有引用 `versionStore` 的文件 - 删除导入

### 不需要修改的文件（已正确）
- `src/shared/types/git.ts` - 已经是正确的共享类型定义
- `src/shared/types/version.ts` - 已正确扩展 GitCommit

---

### Task 1: 删除 versionStore.ts

**Files:**
- Delete: `c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor\src\app\stores\versionStore.ts`

- [ ] **Step 1: 搜索 versionStore 的所有引用**

Run: 在整个项目中搜索 `versionStore` 和 `useVersionStore`

- [ ] **Step 2: 删除 versionStore.ts 文件**

```bash
rm src/app/stores/versionStore.ts
```

- [ ] **Step 3: 删除所有对 versionStore 的导入**

如果在 Step 1 发现引用，删除这些导入语句

- [ ] **Step 4: 验证删除成功**

Run: 搜索 `versionStore` 确认无引用

Expected: 零结果

---

### Task 2: 更新 gitStore.ts 使用共享类型

**Files:**
- Modify: `c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor\src\app\stores\gitStore.ts`

- [ ] **Step 1: 添加共享类型导入**

在 gitStore.ts 文件顶部，替换现有的本地类型定义为：

```typescript
import { create } from 'zustand';
import { GitCommit, GitStatus, GitBranch } from '../../shared/types/git';

// 删除以下本地类型定义（如果存在）：
// interface GitCommit { ... }
// interface GitStatus { ... }
// interface GitBranch { ... }
```

- [ ] **Step 2: 删除 gitStore.ts 中的本地类型定义**

删除文件中第 3-20 行左右的本地接口定义：

```typescript
// ❌ 删除这些
interface GitCommit {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  authorName: string;
}

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
}

interface GitBranch {
  name: string;
  current: boolean;
}
```

- [ ] **Step 3: 验证类型检查通过**

Run: `cd editor && npx tsc --noEmit`

Expected: 无类型错误

- [ ] **Step 4: 验证应用可启动**

Run: `cd editor && npm run dev`

Expected: 应用正常启动，无编译错误

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: unify git types and remove versionStore"
```

---

## 验收标准

- [ ] `versionStore.ts` 已删除
- [ ] `gitStore.ts` 使用 `shared/types/git.ts` 中的类型
- [ ] TypeScript 检查零错误
- [ ] 应用正常编译和启动
- [ ] 无 `any` 类型引入

---

**Next:** 阶段 2 - Store 拆分（需要先完成此阶段）
