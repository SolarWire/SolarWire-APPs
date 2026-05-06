# 统一反馈系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建统一的 FeedbackStore 替代现有的 Toast/StatusStore 通知/导出通知三套并行系统，补全缺失的反馈 UI，统一视觉风格。

**Architecture:** 以 Zustand store 为唯一数据源，命令式 API (`feedback.toast.*` / `feedback.notify.*` / `feedback.operation.*` / `feedback.confirm()`) 驱动，全局 FeedbackProvider 渲染 ToastLayer/NotificationLayer/ConfirmDialog，StatusBar 消费 operation 状态。

**Tech Stack:** React, TypeScript, Zustand, CSS (现有变量体系)

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|------|------|
| `src/app/stores/feedbackStore.ts` | 反馈数据源 + 命令式 API |
| `src/app/components/feedback/FeedbackProvider.tsx` | 全局反馈渲染层 |
| `src/app/components/feedback/ToastLayer.tsx` | Toast 浮动层 |
| `src/app/components/feedback/ToastLayer.css` | Toast 样式 |
| `src/app/components/feedback/NotificationLayer.tsx` | 通知浮动层 |
| `src/app/components/feedback/NotificationLayer.css` | 通知样式 |
| `src/app/components/feedback/ConfirmDialog.tsx` | 确认对话框 |
| `src/app/components/feedback/ConfirmDialog.css` | 确认对话框样式 |
| `src/shared/types/feedback.ts` | 反馈相关类型定义 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/app/App.tsx` | 挂载 FeedbackProvider |
| `src/app/components/layout/StatusBar.tsx` | 改为消费 feedbackStore.operations |
| `src/app/stores/statusStore.ts` | 移除通知/操作相关代码 |
| `src/app/stores/i18nStore.ts` | showToast → feedback.toast |
| `src/app/stores/fileStore.ts` | showToast/showInfo/showSuccess/showError → feedback.* |
| `src/app/stores/settingsStore.ts` | showToast → feedback.toast |
| `src/app/services/system-monitor-service.ts` | addNotification → feedback.notify |
| `src/app/components/views/FileView.tsx` | showToast → feedback.toast, DeleteConfirmModal → feedback.confirm |
| `src/app/components/editor/SolarWireVisualEditor.tsx` | showToast → feedback.toast, exportNotification → feedback.operation |
| `src/app/components/editor/SolarWirePreview.tsx` | showToast → feedback.toast |
| `src/app/components/editor/PropertyPanel.tsx` | showToast → feedback.toast |
| `src/app/components/editor/ComponentLibrary.tsx` | 无 showToast 调用，保持不变 |
| `src/app/components/views/ComponentLibraryManagerView.tsx` | showToast → feedback.toast, ConfirmModal → feedback.confirm |
| `src/app/components/editor-modes/ComponentLibraryManagerMode.tsx` | showToast → feedback.toast, ConfirmModal → feedback.confirm |
| `src/app/components/editor-modes/ComponentLibraryCategoryEditMode.tsx` | showToast → feedback.toast |
| `src/app/components/editor-modes/ComponentLibraryLibraryEditMode.tsx` | showToast → feedback.toast |
| `src/app/components/editor-modes/ComponentLibraryComponentEditMode.tsx` | showToast → feedback.toast |
| `src/app/components/editor/ChangeComponentParentModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/ChangeCategoryParentModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateComponentModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/RenameModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateSolarWireModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateMarkdownModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateFolderModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateFileModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateCategoryModal.tsx` | showToast → feedback.toast |
| `src/app/components/editor/CreateLibraryModal.tsx` | showToast → feedback.toast |
| `src/app/components/ui/SettingsModal.tsx` | showToast → feedback.toast |
| `src/app/components/layout/TopMenuBar.tsx` | showToast → feedback.toast |
| `src/app/hooks/useImageDrop.ts` | showToast → feedback.toast |

### 删除文件

| 文件 | 原因 |
|------|------|
| `src/app/services/toast-service.ts` | 被 feedbackStore 替代 |
| `src/app/components/ui/Toast.tsx` | 被 ToastLayer 替代 |
| `src/app/components/ui/Toast.css` | 被 ToastLayer.css 替代 |
| `src/app/components/editor/DeleteConfirmModal.tsx` | 被 feedback.confirm() 替代 |
| `src/app/components/editor/DeleteConfirmModal.css` | 被 ConfirmDialog.css 替代 |

---

## Task 1: 创建反馈类型定义

**Files:**
- Create: `src/shared/types/feedback.ts`

- [ ] **Step 1: 创建 feedback 类型文件**

```typescript
export type FeedbackType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: FeedbackType;
  message: string;
  duration: number;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  persistent: boolean;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

export type OperationType = 'save' | 'open' | 'load' | 'export' | 'import' | 'refresh' | 'compile' | 'render' | 'parse';
export type OperationStatus = 'running' | 'success' | 'error';

export interface OperationItem {
  id: string;
  type: OperationType;
  status: OperationStatus;
  message: string;
  progress: number;
  errorDetail?: string;
  cancellable: boolean;
  onCancel?: () => void;
  createdAt: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmItem {
  id: string;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}
```

- [ ] **Step 2: 验证构建**

Run: `npx tsc --noEmit` (在 editor 目录)
Expected: 无新增错误

---

## Task 2: 创建 FeedbackStore

**Files:**
- Create: `src/app/stores/feedbackStore.ts`

- [ ] **Step 1: 创建 feedbackStore**

实现完整的 FeedbackState 接口，包含：
- `toasts[]` + `addToast` / `removeToast`
- `notifications[]` + `addNotification` / `removeNotification` / `clearNotifications`
- `operations[]` + `startOperation` (返回 id) / `updateOperationProgress` / `completeOperation` / `failOperation` / `cancelOperation` / `removeOperation`
- `confirmQueue[]` + `confirm` (返回 Promise<boolean>) / `resolveConfirm`
- 命令式快捷 API `feedback.toast.*` / `feedback.notify.*` / `feedback.operation.*` / `feedback.confirm()`

关键实现细节：
- Toast 自动消失：`addToast` 中根据 duration 启动 setTimeout → `removeToast`
- Toast 堆叠上限：5 条，超出时移除最早的
- Operation 成功自动清除：`completeOperation` 后 2s 自动 `removeOperation`
- Notification 非 persistent 自动消失：8s 后 `removeNotification`
- Confirm Promise 机制：`confirm()` 创建 ConfirmItem 并返回 new Promise，`resolveConfirm` 调用 resolve(true/false)

- [ ] **Step 2: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 3: 创建 ToastLayer 组件

**Files:**
- Create: `src/app/components/feedback/ToastLayer.tsx`
- Create: `src/app/components/feedback/ToastLayer.css`

- [ ] **Step 1: 创建 ToastLayer.tsx**

React 组件，消费 `useFeedbackStore().toasts`：
- 右上角固定定位，垂直堆叠
- 每个 toast 显示类型图标 + 消息 + 关闭按钮
- 类型图标：info=ℹ️ success=✅ warning=⚠️ error=❌
- error 类型始终显示关闭按钮，其他类型 hover 时显示
- 动画：CSS slideIn from right + fadeOut
- 使用 z-index 变量 `var(--z-toast)`

- [ ] **Step 2: 创建 ToastLayer.css**

样式要点：
- `.toast-layer` — 固定右上角，flex-column，gap: 8px，padding: 16px
- `.toast-item` — 圆角卡片，根据类型着色（使用现有语义化颜色变量）
- `.toast-info` — 蓝色左边框
- `.toast-success` — 绿色左边框
- `.toast-warning` — 橙色左边框
- `.toast-error` — 红色左边框
- `@keyframes toast-slide-in` — translateX(100%) → translateX(0)
- `@keyframes toast-fade-out` — opacity 1 → 0

- [ ] **Step 3: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 4: 创建 NotificationLayer 组件

**Files:**
- Create: `src/app/components/feedback/NotificationLayer.tsx`
- Create: `src/app/components/feedback/NotificationLayer.css`

- [ ] **Step 1: 创建 NotificationLayer.tsx**

React 组件，消费 `useFeedbackStore().notifications`：
- 右下角固定定位，垂直堆叠
- 每个 notification 显示类型图标 + 标题(可选) + 消息 + 操作按钮(可选) + 关闭按钮
- persistent 类型不自动消失
- 使用 z-index 变量 `var(--z-notification)`

- [ ] **Step 2: 创建 NotificationLayer.css**

样式要点：
- `.notification-layer` — 固定右下角，flex-column，gap: 8px，padding: 16px
- `.notification-item` — 圆角卡片，比 toast 更宽 (min-width: 300px)
- 类型着色同 toast
- `.notification-action` — 操作按钮样式

- [ ] **Step 3: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 5: 创建 ConfirmDialog 组件

**Files:**
- Create: `src/app/components/feedback/ConfirmDialog.tsx`
- Create: `src/app/components/feedback/ConfirmDialog.css`

- [ ] **Step 1: 创建 ConfirmDialog.tsx**

React 组件，消费 `useFeedbackStore().confirmQueue`：
- 显示 confirmQueue[0]（一次只显示一个确认对话框）
- 居中模态 + 背景遮罩
- 支持 danger/warning/info 三种样式
- ESC 键 = resolveConfirm(id, false)
- 点击遮罩 = resolveConfirm(id, false)
- 确认按钮 = resolveConfirm(id, true)
- 取消按钮 = resolveConfirm(id, false)
- 使用 z-index 变量 `var(--z-modal)`

- [ ] **Step 2: 创建 ConfirmDialog.css**

样式要点：
- `.confirm-overlay` — 全屏遮罩，z-index: var(--z-overlay-backdrop)
- `.confirm-dialog` — 居中卡片，z-index: var(--z-modal)
- `.confirm-dialog-danger` — 确认按钮红色
- `.confirm-dialog-warning` — 确认按钮橙色
- `.confirm-dialog-info` — 确认按钮蓝色
- 复用现有 ConfirmModal.css 的设计语言

- [ ] **Step 3: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 6: 创建 FeedbackProvider 并挂载

**Files:**
- Create: `src/app/components/feedback/FeedbackProvider.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 创建 FeedbackProvider.tsx**

组合渲染 ToastLayer + NotificationLayer + ConfirmDialog：

```tsx
import ToastLayer from './ToastLayer';
import NotificationLayer from './NotificationLayer';
import ConfirmDialog from './ConfirmDialog';

export function FeedbackProvider() {
  return (
    <>
      <ToastLayer />
      <NotificationLayer />
      <ConfirmDialog />
    </>
  );
}
```

- [ ] **Step 2: 在 App.tsx 中挂载 FeedbackProvider**

在 `<div className="app">` 内部末尾添加 `<FeedbackProvider />`：

```tsx
import { FeedbackProvider } from './components/feedback/FeedbackProvider';

// ...

return (
  <EditorProvider>
    <div className="app">
      <AppLayout />
      <FeedbackProvider />
    </div>
  </EditorProvider>
);
```

- [ ] **Step 3: 验证构建 + 运行**

Run: `npx vite build`
Expected: 构建成功

---

## Task 7: 迁移所有 showToast 调用到 feedback.toast

**Files:**
- Modify: 所有 26 个使用 showToast 的文件（见上方修改文件列表）

- [ ] **Step 1: 批量替换 import 语句**

对每个文件，将：
```typescript
import { showToast } from '../../services/toast-service';
```
替换为：
```typescript
import { feedback } from '../../stores/feedbackStore';
```
（注意：不同文件的相对路径不同，需逐个确认）

特殊处理：
- `SolarWirePreview.tsx` 从 `'../ui/Toast'` 导入，需改为 feedbackStore 路径
- `i18nStore.ts` 从 `'../services/toast-service'` 导入

- [ ] **Step 2: 批量替换调用**

| 原调用 | 新调用 |
|--------|--------|
| `showToast(msg, 'success')` | `feedback.toast.success(msg)` |
| `showToast(msg, 'error')` | `feedback.toast.error(msg)` |
| `showToast(msg, 'error', false)` | `feedback.toast.error(msg)` |
| `showToast(msg, 'info')` | `feedback.toast.info(msg)` |
| `showToast(msg, 'info', false)` | `feedback.toast.info(msg)` |

逐文件替换，每个文件替换后确认无语法错误。

- [ ] **Step 3: 迁移 statusStore 的 showInfo/showSuccess/showWarning/showError**

在 `fileStore.ts` 中：
```typescript
// 旧
import { useStatusStore, showInfo, showSuccess, showError } from './statusStore';
// 新
import { feedback } from './feedbackStore';
```

替换所有调用：
- `showInfo(msg)` → `feedback.toast.info(msg)`
- `showSuccess(msg)` → `feedback.toast.success(msg)`
- `showError(msg)` → `feedback.notify.error(msg)` (fileStore 中的错误通常较重要)

- [ ] **Step 4: 迁移 system-monitor-service.ts**

```typescript
// 旧
statusStore.addNotification('warning', `内存使用率较高: ${memoryUsagePercent}%`);
// 新
feedback.notify.warning(`内存使用率较高: ${memoryUsagePercent}%`);
```

- [ ] **Step 5: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误（旧有错误可能仍在）

---

## Task 8: 迁移 StatusStore 操作状态到 FeedbackStore

**Files:**
- Modify: `src/app/stores/fileStore.ts`
- Modify: `src/app/components/layout/StatusBar.tsx`
- Modify: `src/app/stores/statusStore.ts`

- [ ] **Step 1: 迁移 fileStore.ts 中的操作状态调用**

将所有 `statusStore.startOperation/completeOperation/failOperation` 替换为 `feedback.operation.*`：

```typescript
// 旧
statusStore.startOperation('save', '保存中...');
statusStore.completeOperation('保存成功');
statusStore.failOperation('保存失败', errorMessage);

// 新
const opId = feedback.operation.start('save', '保存中...');
feedback.operation.complete(opId, '保存成功');
feedback.operation.fail(opId, '保存失败', errorMessage);
```

注意：`startOperation` 现在返回 `string` (opId)，需要在合适的作用域保存。

- [ ] **Step 2: 改造 StatusBar 消费 feedbackStore**

```tsx
import { useFeedbackStore } from '../../stores/feedbackStore';

export function StatusBar() {
  const operations = useFeedbackStore(state => state.operations);
  const currentOp = operations.length > 0 ? operations[0] : null;
  // ... 用 currentOp 替代 currentOperation
}
```

- [ ] **Step 3: 清理 statusStore**

从 statusStore 中移除：
- `currentOperation` 状态
- `startOperation` / `updateOperationProgress` / `completeOperation` / `failOperation` / `clearOperation` 方法
- `notifications` 状态
- `addNotification` / `removeNotification` / `clearNotifications` 方法
- `showStatusMessage` / `showInfo` / `showSuccess` / `showWarning` / `showError` 函数
- `OperationType` / `OperationStatus` / `OperationState` 类型
- `NotificationMessage` 类型
- `operationIcons` / `notificationIcons` 常量
- `getOperationIcon` / `getNotificationIcon` 函数

保留：
- `filePath` / `setCurrentFilePath`
- `fileStatus` / `updateFileStatus`
- `editorStatus` / `updateEditorStatus`
- `isOnline` / `setOnlineStatus`（但内部改为 `feedback.notify.*`）
- `memoryUsage` / `updateMemoryUsage`

- [ ] **Step 4: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 9: 迁移导出通知

**Files:**
- Modify: `src/app/components/editor/SolarWireVisualEditor.tsx`
- Modify: `src/app/components/editor/SolarWireVisualEditor.css`

- [ ] **Step 1: 替换 exportNotification state**

在 SolarWireVisualEditor.tsx 中：
- 移除 `exportNotification` state 和 `setExportNotification`
- 移除 `clearExportNotification` callback
- 导出操作改为使用 `feedback.operation.start('export', ...)` / `feedback.operation.complete()` / `feedback.operation.fail()`

- [ ] **Step 2: 移除 export-notification JSX**

删除 SolarWireVisualEditor 渲染中的 `.export-notification` 部分。

- [ ] **Step 3: 移除 export-notification CSS**

从 SolarWireVisualEditor.css 中删除 `.export-notification` 及其所有子选择器、`@keyframes slideIn` 和 `@keyframes spin`（如果仅被 export-notification 使用）。

- [ ] **Step 4: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 10: 合并确认对话框

**Files:**
- Modify: `src/app/components/views/FileView.tsx`
- Modify: `src/app/components/views/ComponentLibraryManagerView.tsx`
- Modify: `src/app/components/editor-modes/ComponentLibraryManagerMode.tsx`
- Delete: `src/app/components/editor/DeleteConfirmModal.tsx`
- Delete: `src/app/components/editor/DeleteConfirmModal.css`

- [ ] **Step 1: FileView.tsx — 替换 DeleteConfirmModal**

将 DeleteConfirmModal 的使用改为 `feedback.confirm()`：

```typescript
// 旧
<DeleteConfirmModal isOpen={showDeleteConfirm} onClose={...} target={...} />

// 新
const handleDelete = async () => {
  const confirmed = await feedback.confirm({
    title: '删除确认',
    message: `确定要删除 "${targetName}" 吗？此操作不可撤销。`,
    type: 'danger',
    confirmText: '删除',
  });
  if (confirmed) {
    // 执行删除逻辑
  }
};
```

移除 DeleteConfirmModal 的 import 和 state。

- [ ] **Step 2: ComponentLibraryManagerView.tsx — 替换 ConfirmModal**

将 ConfirmModal 的使用改为 `feedback.confirm()`，移除 ConfirmModal 的 import 和 state。

- [ ] **Step 3: ComponentLibraryManagerMode.tsx — 替换 ConfirmModal**

同上。

- [ ] **Step 4: 删除 DeleteConfirmModal 文件**

删除 `DeleteConfirmModal.tsx` 和 `DeleteConfirmModal.css`。

- [ ] **Step 5: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 11: 统一错误接口

**Files:**
- Modify: `src/shared/types/feedback.ts` (添加 SyntaxError)
- Modify: `src/app/components/editor/ErrorCard.tsx`
- Modify: `src/app/components/editor/ErrorPanel.tsx`
- Modify: `src/app/components/editor/SolarWirePreview.tsx`

- [ ] **Step 1: 在 feedback.ts 中定义统一 SyntaxError 接口**

```typescript
export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'parser' | 'diagnostic';
}
```

- [ ] **Step 2: ErrorCard.tsx 引用统一接口**

移除 ErrorCard.tsx 中的本地 `SyntaxError` 定义，改为从 `shared/types/feedback` 导入。

- [ ] **Step 3: ErrorPanel.tsx 引用统一接口**

移除 ErrorPanel.tsx 中的本地 `ErrorInfo` 定义，改为从 `shared/types/feedback` 导入 `SyntaxError`。

- [ ] **Step 4: SolarWirePreview.tsx error-overlay 改用 ErrorCard**

将 `.error-overlay` 中的自定义错误展示替换为 ErrorCard 组件。

- [ ] **Step 5: 验证构建**

Run: `npx tsc --noEmit`
Expected: 无新增错误

---

## Task 12: 清理废弃代码

**Files:**
- Delete: `src/app/services/toast-service.ts`
- Delete: `src/app/components/ui/Toast.tsx`
- Delete: `src/app/components/ui/Toast.css`

- [ ] **Step 1: 确认无残留引用**

Grep 搜索 `toast-service` 和 `Toast.tsx`，确认无文件引用。

- [ ] **Step 2: 删除 toast-service.ts**

- [ ] **Step 3: 删除 Toast.tsx 和 Toast.css**

- [ ] **Step 4: 清理 statusStore 中已废弃的导出**

确认 `showInfo` / `showSuccess` / `showWarning` / `showError` / `showStatusMessage` / `getOperationIcon` / `getNotificationIcon` 无外部引用后，从 statusStore 中移除。

- [ ] **Step 5: 验证构建**

Run: `npx vite build`
Expected: 构建成功

---

## Task 13: 最终验证

- [ ] **Step 1: 全量 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无新增错误

- [ ] **Step 2: Vite 构建验证**

Run: `npx vite build`
Expected: 构建成功

- [ ] **Step 3: 搜索残留引用**

Grep 搜索以下关键词，确认无残留：
- `toast-service`
- `showToast`
- `showInfo` / `showSuccess` / `showWarning` / `showError` (来自 statusStore)
- `DeleteConfirmModal`
- `exportNotification`
- `ToastContainer`

- [ ] **Step 4: 功能验证清单**

手动验证以下操作有正确的反馈：
- [ ] 保存文件 → Toast success
- [ ] 保存失败 → Toast error
- [ ] 删除文件 → ConfirmDialog → Toast success/error
- [ ] 导出 SVG → Operation progress → Notification success/error
- [ ] 语法错误 → ErrorCard/ErrorPanel 显示
- [ ] 组件库操作 → Toast success/error
