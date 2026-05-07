# SolarWire 项目架构审计与重构方案

**日期**：2026-04-16  
**审计范围**：整个前端项目（editor/src）  
**审计重点**：文件结构、耦合度、类型管理、状态管理、性能  
**执行优先级**：按依赖关系排序（先修基础，再逐步优化）

---

## 目录

1. [执行摘要](#执行摘要)
2. [严重问题（🔴 必须立即修复）](#严重问题)
3. [中等问题（🟡 需要规划重构）](#中等问题)
4. [轻微问题（🟢 优化建议）](#轻微问题)
5. [按依赖关系排序的执行计划](#执行计划)
6. [验收标准](#验收标准)

---

## 执行摘要

### 项目概况

| 维度 | 评分 | 说明 |
|------|------|------|
| 类型安全 | 🔴 4/10 | 共享类型存在但未被充分利用，多处重复定义 |
| 单一职责 | 🔴 4/10 | 多个 Store 和组件职责过多，违反单一职责原则 |
| 代码复用 | 🟡 6/10 | 有共享目录但使用不一致，工具函数组织混乱 |
| 可测试性 | 🔴 4/10 | 组件直接依赖 Store，难以独立测试 |
| 可维护性 | 🟡 5/10 | 目录结构混乱，但有一定模块划分意识 |
| 耦合度 | 🔴 4/10 | 组件与 Store 高度耦合，循环依赖风险 |

### 核心问题概览

- 🔴 **严重问题**：5 个
- 🟡 **中等问题**：5 个
- 🟢 **轻微问题**：3 个

---

## 严重问题

### 问题 1：类型定义严重重复 🔴

**问题描述**：相同类型在多处重复定义，违反 DRY 原则和可维护性原则

**影响范围**：
- `GitCommit` 在 3 个地方定义
- `GitStatus` 在 2 个地方定义
- `GitBranch` 在 2 个地方定义

**具体位置**：

| 类型 | 正确位置 | 重复位置 | 差异 |
|------|---------|---------|------|
| `GitCommit` | `shared/types/git.ts` | `app/stores/gitStore.ts:L9-15` | 缺少 authorEmail, changedFiles, stats |
| `GitCommit` | `shared/types/git.ts` | `app/stores/versionStore.ts:L3-9` | 字段名完全不同（id vs hash） |
| `GitStatus` | `shared/types/git.ts` | `app/stores/gitStore.ts:L3-7` | 完全相同（纯重复） |
| `GitBranch` | `shared/types/git.ts` | `app/stores/gitStore.ts:L17-20` | 完全相同（纯重复） |

**风险分析**：
- 类型不一致导致潜在 bug（versionStore 用了 `id` 而不是 `hash`）
- 修改类型时需要同时更新多处，容易遗漏
- 新增字段无法自动同步到所有位置

**✅ 已确认方案 A**：统一使用 `shared/types/git.ts`
1. 删除 `gitStore.ts` 和 `versionStore.ts` 中的本地类型定义
2. 所有文件统一导入：`import { GitCommit, GitStatus, GitBranch } from '../../shared/types/git'`
3. 修改 `versionStore.ts` 使用正确的字段名（如果保留）

---

### 问题 2：gitStore 职责过度膨胀 🔴

**问题描述**：`gitStore.ts` 承担了过多职责，违反单一职责原则

**当前职责**：
- ✅ Git 初始化、状态查询
- ✅ 提交历史管理
- ✅ 分支管理
- ✅ 暂存/提交操作
- ❌ 版本对比模式状态管理（isDiffMode, leftCommit, rightCommit）
- ❌ 文件内容加载（leftFileContent, rightFileContent）
- ❌ Diff 内容加载（fileDiff）
- ❌ 版本分析进度管理（gitAnalysis）

**违反原则**：单一职责、可维护性（修改逻辑影响范围过大）

**✅ 已确认方案 A**：拆分为 3 个 Store

#### Store 1: `gitStore.ts` - Git 基础操作
```typescript
interface GitState {
  isInitialized: boolean;
  status: GitStatus;
  history: GitCommit[];
  branches: GitBranch[];
  currentBranch: GitBranch | null;
  // ... 基础操作方法
}
```

#### Store 2: `gitDiffStore.ts` - 版本对比功能
```typescript
interface GitDiffState {
  isDiffMode: boolean;
  leftCommit: GitCommit | null;
  rightCommit: GitCommit | null;
  leftFileContent: string;
  rightFileContent: string;
  fileDiff: string;
  // ... 对比相关方法
}
```

#### Store 3: `gitAnalysisStore.ts` - 版本分析进度
```typescript
interface GitAnalysisState {
  gitAnalysis: GitAnalysisProgress | null;
  // ... 分析进度管理
}
```

**依赖关系**：
- `gitDiffStore` 依赖 `gitStore`（获取提交信息）
- `gitAnalysisStore` 独立

---

### 问题 3：VersionStore 功能冗余 🔴

**问题描述**：`versionStore.ts` 与 `gitStore` 功能重叠，定义了不同的 `GitCommit` 格式，且未被任何组件使用（死代码）

**问题**：
- 字段名与标准 `GitCommit` 不一致（`id` vs `hash`, `timestamp` vs `date`）
- 功能与 `gitStore.history` 完全重叠
- 零引用（代码死区）

**✅ 已确认方案 A**：直接删除 `versionStore.ts`

**执行步骤**：
1. 确认零引用（已完成）
2. 删除文件：`app/stores/versionStore.ts`
3. 检查是否有导入引用（如有则一并删除）

---

### 问题 4：VersionView 组件职责过多 🔴

**问题描述**：`VersionView.tsx` 承担了 6 种不同状态和交互

**当前功能**：
1. 错误提示显示
2. 加载进度显示
3. 空状态提示
4. 提交历史列表（使用 GitLogView）
5. 对比模式选择器
6. CommitDetail 详情查看
7. DiffView 差异显示

**违反原则**：单一职责、可维护性、可测试性

**✅ 已确认方案 A**：拆分为容器组件 + 展示组件

#### 组件结构
```
views/version/
├── VersionView.tsx          # 容器组件，只负责状态管理和数据获取
├── VersionError.tsx         # 错误状态展示
├── VersionLoading.tsx       # 加载进度展示
├── VersionEmpty.tsx         # 空状态展示
├── VersionHistoryList.tsx   # 提交历史列表（使用 GitLogView）
├── VersionCompareSelector.tsx # 对比模式选择器
└── hooks/
    └── useVersionAnalysis.ts # 分析逻辑 Hook
```

**职责划分**：

| 组件 | 职责 | 依赖 |
|------|------|------|
| `VersionView` | 状态管理、数据获取、条件渲染 | `useVersionHistory` |
| `VersionError` | 错误信息展示 | Props |
| `VersionLoading` | 进度条展示 | Props |
| `VersionEmpty` | 空状态 + 提示 | Props |
| `VersionHistoryList` | 提交列表展示 | `GitLogView` |
| `VersionCompareSelector` | 对比模式 UI | Props |

---

### 问题 5：useVersionHistory Hook 直接依赖 Store 🔴

**问题描述**：Hook 内部直接调用 `useGitStore.getState()`，增加耦合度，难以独立测试

**当前实现**：
```typescript
export function useVersionHistory(filePath: string, snippet?: SolarWireSnippet) {
  const { getGitLog } = useGitStore.getState(); // ❌ 直接依赖 Store
  const gitCommits = await getGitLog(relativePath);
}
```

**问题**：
- Hook 与特定 Store 耦合，无法复用
- 难以编写单元测试（需要 mock 整个 Store）
- 违反依赖注入原则

**✅ 已确认方案 A**：通过参数注入依赖

**改进后实现**：
```typescript
interface GitApi {
  getLog: (filePath?: string) => Promise<GitCommit[]>;
  getFileContentAtCommit: (path: string, hash: string) => Promise<string>;
}

export function useVersionHistory(
  filePath: string, 
  snippet?: SolarWireSnippet,
  gitApi: GitApi  // ✅ 通过参数注入
) {
  const gitCommits = await gitApi.getLog(filePath);
}

// 使用时
const { getGitLog, getFileContentAtCommit } = useGitStore();
const result = useVersionHistory(path, snippet, { getGitLog, getFileContentAtCommit });
```

**优势**：
- Hook 与 Store 解耦，可独立测试
- 可在不同场景复用（传入不同的 gitApi）
- 符合依赖注入原则

---

## 中等问题

### 问题 6：组件目录结构混乱 🟡

**现状问题**：
- `editor/` 和 `editor-modes/` 职责重叠
- `views/` 和 `editor-modes/` 都包含 SolarWire 相关组件
- 无法从路径判断组件用途

**当前结构**：
```
app/components/
├── editor/           # ❌ 这些是什么？通用编辑器组件？
│   ├── SolarWireCanvas.tsx
│   ├── PropertyPanel.tsx
│   └── FileTree.tsx
├── editor-modes/     # ❌ 与 editor/ 的关系不清晰
│   ├── SolarWireMode.tsx
│   └── MarkdownMode.tsx
├── views/            # ❌ 左侧视图组件
│   ├── SolarWireView.tsx
│   └── FileView.tsx
└── layout/           # ✅ 布局组件，职责清晰
```

**✅ 已确认方案 A**：按功能域重组

**目标结构**：
```
app/components/
├── common/           # 通用组件（按钮、输入框等）
├── editor/           # 编辑器相关
│   ├── solarwire/    # SolarWire 编辑器
│   │   ├── SolarWireMode.tsx
│   │   ├── SolarWireCanvas.tsx
│   │   └── PropertyPanel.tsx
│   ├── markdown/     # Markdown 编辑器
│   │   └── MarkdownMode.tsx
│   └── shared/       # 编辑器共享组件
│       ├── MonacoEditor.tsx
│       └── MarkdownPreview.tsx
├── views/            # 左侧视图
│   ├── FileView.tsx
│   ├── GitView.tsx
│   └── version/      # Version 相关视图
│       ├── VersionView.tsx
│       ├── CommitDetail.tsx
│       └── DiffView.tsx
└── layout/           # 布局组件
```

**迁移规则**：
- 所有与 SolarWire 画布相关的 → `editor/solarwire/`
- 所有与 Markdown 编辑相关的 → `editor/markdown/`
- 所有左侧面板的视图 → `views/`
- 编辑器共享组件 → `editor/shared/`

---

### 问题 7：SolarWireMode 组件过于庞大 🟡

**问题描述**：`SolarWireMode.tsx` 超过 400 行，包含 Canvas、工具栏、属性面板、Tab 切换

**问题**：
- 包含多个不相关的功能
- 难以定位和修改特定功能
- 测试困难
- 违反单一职责

**✅ 已确认方案 A**：拆分为子组件（2026-04-16 用户确认）

```typescript
// SolarWireMode.tsx - 只负责布局
<SolarWireLayout>
  <SolarWireToolbar />
  <SolarWireCanvasContainer>
    <SolarWireCanvas />
    <FloatingPropertyPanel />
  </SolarWireContainer>
  <ElementSidebar />
</SolarWireLayout>
```

---

### 问题 8：工具函数组织不一致 🟡

**当前状态**：
- `shared/utils/` - 共享工具函数
- `shared/hooks/` - 共享 Hooks
- `app/hooks/` - 应用级 Hooks

**问题**：
- `coordinate-utils.ts` 和 `coordinate-converter.ts` 职责重叠
- `solarwire-utils.ts` 过于庞大

**✅ 已确认方案 A**：按功能模块分组（2026-04-16 用户确认）

```
shared/
├── utils/
│   ├── git/
│   │   ├── diff-parser.ts
│   │   └── commit-utils.ts
│   ├── solarwire/
│   │   ├── coordinate.ts
│   │   └── element.ts
│   └── common/
│       └── file.ts
└── hooks/
    ├── git/
    │   └── useVersionHistory.ts
    └── solarwire/
        └── useCoordinateSystem.ts
```

---

### 问题 9：StatusBar 组件位置不当 🟡

**问题描述**：`StatusBar.tsx` 放在 `layout/` 目录，但实际职责是显示 Git 分析进度

**实际职责**：
- 显示 Git 分析进度
- 属于 Git 功能的一部分

**✅ 已确认方案 C**：保持 `StatusBar.tsx`，扩展为全局状态栏（2026-04-16 用户确认）

---

### 问题 10：Worker 相关文件分散 🟡

**当前状态**：
- `workers/git-diff-analyzer.worker.ts` - Worker 实现
- `shared/utils/WorkerPool.ts` - Worker 池
- `shared/cache/versionCache.ts` - 缓存

**✅ 已确认方案 A**：统一管理到 `shared/workers/`（2026-04-16 用户确认）

```
shared/
└── workers/
    ├── git-diff-analyzer.worker.ts
    ├── WorkerPool.ts
    ├── worker-types.ts
    └── cache/
        └── versionCache.ts
```

---

## 轻微问题

### 问题 11：editorStore 包含示例数据 🟢

**问题描述**：`editorStore.ts` 包含 120 行示例 SolarWire 内容作为默认值

**影响**：
- 增加包体积
- 混淆了配置和数据

**建议**：移到单独的 `sample-data.ts` 文件

---

### 问题 12：缺少测试覆盖 🟢

**现状**：
- 只有少量测试文件
- 核心组件（SolarWireCanvas、VersionView）无测试
- Hooks 无测试

**建议**：建立测试策略
- 单元测试：工具函数、Hooks
- 组件测试：核心 UI 组件
- 集成测试：Store 交互

---

### 问题 13：未使用的依赖 🟢

**检查项目**：
- `package.json` 中可能有未使用的依赖
- 建议运行 `depcheck` 检查

---

## 执行计划

### 阶段 1：基础修复（1-2 天）

**优先级最高，其他修复的前置条件**

#### 任务 1.1：统一类型定义
- [ ] 删除 `gitStore.ts` 中的 `GitCommit`, `GitStatus`, `GitBranch` 定义
- [ ] 删除 `versionStore.ts` 中的 `GitCommit` 定义
- [ ] 更新所有导入使用 `shared/types/git.ts`
- [ ] 验证类型检查通过

**验收标准**：
- `npm run typecheck` 无错误
- 所有 GitCommit 引用指向同一类型

#### 任务 1.2：删除 versionStore
- [ ] 搜索所有引用
- [ ] 删除 `app/stores/versionStore.ts`
- [ ] 删除相关导入

**验收标准**：
- 项目中无 `versionStore` 引用
- 应用正常运行

---

### 阶段 2：Store 拆分（2-3 天）

**依赖**：阶段 1 完成

#### 任务 2.1：创建 gitDiffStore
- [ ] 新建 `app/stores/gitDiffStore.ts`
- [ ] 迁移 diff 相关状态和方法
- [ ] 更新引用

#### 任务 2.2：创建 gitAnalysisStore
- [ ] 新建 `app/stores/gitAnalysisStore.ts`
- [ ] 迁移 analysis 相关状态
- [ ] 更新引用

#### 任务 2.3：精简 gitStore
- [ ] 移除已迁移的状态和方法
- [ ] 保留基础 Git 操作
- [ ] 验证功能完整

**验收标准**：
- 3 个 Store 职责清晰
- 所有功能正常工作
- 无循环依赖

---

### 阶段 3：组件解耦（3-4 天）

**依赖**：阶段 2 完成

#### 任务 3.1：重构 useVersionHistory
- [ ] 添加 gitApi 参数
- [ ] 移除直接 Store 调用
- [ ] 更新调用方

#### 任务 3.2：拆分 VersionView
- [ ] 创建子组件文件
- [ ] 迁移对应逻辑
- [ ] 更新引用

**验收标准**：
- Hook 可独立测试
- 每个组件职责单一
- 无回归问题

---

### 阶段 4：目录重组（2-3 天）

**依赖**：阶段 3 完成

#### 任务 4.1：重组组件目录
- [ ] 创建新目录结构
- [ ] 移动文件到正确位置
- [ ] 更新所有导入路径

#### 任务 4.2：清理空目录
- [ ] 删除 `editor-modes/`
- [ ] 清理未使用文件

**验收标准**：
- 目录结构清晰
- 所有导入路径正确
- 应用正常编译

---

### 阶段 5：优化完善（1-2 天）

**依赖**：阶段 4 完成

#### 任务 5.1：工具函数重组
- [ ] 按功能模块分组
- [ ] 更新导入

#### 任务 5.2：添加测试
- [ ] 为核心函数编写测试
- [ ] 建立测试规范

#### 任务 5.3：性能优化
- [ ] 检查未使用的依赖
- [ ] 优化包体积

**验收标准**：
- 测试覆盖率 > 60%
- 无未使用依赖
- 性能监控正常

---

## 验收标准

### 类型安全
- [ ] 所有类型唯一定义
- [ ] TypeScript 检查零错误
- [ ] 无 `any` 类型滥用

### 单一职责
- [ ] 每个 Store 职责单一（< 200 行）
- [ ] 每个组件职责单一（< 300 行）
- [ ] 每个函数只做一件事

### 可测试性
- [ ] Hooks 可通过参数注入测试
- [ ] 组件可通过 Props 独立测试
- [ ] 核心逻辑测试覆盖率 > 60%

### 目录结构
- [ ] 从路径可判断组件用途
- [ ] 无职责重叠的目录
- [ ] 符合 DDD 领域划分

### 可维护性
- [ ] 修改逻辑只需改一处
- [ ] 无重复代码
- [ ] 代码意图清晰

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 目录重组导致导入路径错误 | 高 | 使用 IDE 批量重构，逐步验证 |
| Store 拆分遗漏状态 | 中 | 编写测试覆盖所有状态 |
| 类型统一导致编译错误 | 中 | 逐步修改，每次验证 |
| 组件拆分引入 bug | 低 | 保留原有测试，逐个验证 |

---

## 后续建议

1. **建立代码规范**：使用 ESLint 规则强制单一职责
2. **添加架构测试**：防止循环依赖
3. **定期审查**：每季度进行一次架构审查
4. **文档更新**：保持此文档与代码同步

---

**文档版本**：v1.0  
**最后更新**：2026-04-16  
**负责人**：AI Assistant + 用户确认
