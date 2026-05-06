# 统一反馈系统设计文档

## 1. 背景与问题

### 现状
项目当前存在 3 套并行的反馈系统，以及大量分散的临时实现：

1. **Toast 系统**（`toast-service.ts` + `Toast.tsx`）— 命令式，右上角浮动，3秒消失
2. **StatusStore 通知**（`statusStore.ts`）— 响应式，有数据写入但**无 UI 渲染**（死代码）
3. **导出通知**（`export-notification`）— 硬编码在 SolarWireVisualEditor 内部，不可复用

### 核心问题

| 问题 | 说明 |
|------|------|
| 三套系统并行 | Toast / StatusStore / export-notification 互不通信，功能重叠 |
| StatusStore 通知是死代码 | `notifications` 队列有数据写入但无 UI 消费 |
| 错误展示 5 种形式 | ErrorCard / ErrorPanel / error-overlay(×2) / ComponentLibrary 错误列表，接口和视觉不统一 |
| 加载状态各自为政 | 每个组件各自实现加载 UI，有的甚至没有 UI 反馈 |
| Toast 功能简陋 | 无 warning 类型、无动画、无堆叠管理 |
| 确认对话框重复 | ConfirmModal 和 DeleteConfirmModal 功能重叠 |
| 语言混乱 | 消息中英文混杂 |

## 2. 设计目标

1. **统一反馈通道** — 一套 FeedbackStore 替代所有反馈系统
2. **补全反馈能力** — 每个用户操作都有即时、清晰的反馈
3. **统一视觉风格** — 一致的动画、颜色、排版
4. **国际化** — 所有消息通过 i18n key 引用

## 3. 架构设计

### 3.1 整体架构

```
用户操作 / 系统事件
        │
        ▼
┌─────────────────────┐
│   FeedbackStore     │  ← 唯一数据源 (Zustand)
│   ┌───────────────┐ │
│   │ toasts[]      │ │  ← 轻量提示（自动消失）
│   │ notifications[]│ │  ← 通知（可交互、可持久）
│   │ operations[]  │ │  ← 长操作（进度条）
│   │ confirmQueue  │ │  ← 确认对话框
│   └───────────────┘ │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  FeedbackProvider   │  ← 全局渲染层（挂载在 App 顶层）
│   ┌───────────────┐ │
│   │ ToastLayer    │ │  ← 右上角浮动
│   │ Notification  │ │ │  ← 右下角通知
│   │ ConfirmDialog │ │  ← 居中模态
│   │ StatusBar     │ │  ← 底部状态栏（消费 operation 状态）
│   └───────────────┘ │
└─────────────────────┘
```

### 3.2 反馈层级规范

| 层级 | 类型 | 场景 | 自动消失 | 交互 |
|------|------|------|----------|------|
| Toast | info/success/warning/error | 轻量操作结果 | 3-5s | 仅关闭 |
| Notification | info/success/warning/error | 重要结果需用户知晓 | 手动关闭 | 关闭 + 操作按钮 |
| Operation | running/success/error | 长时间操作 | 成功2s后消失 | 取消按钮 |
| Confirm | danger/warning/info | 破坏性操作确认 | 必须响应 | 确认/取消 |
| ErrorDisplay | syntax/runtime | 代码/渲染错误 | 修复后消失 | 跳转到代码 |
| StatusBar | 运行时状态 | 当前模式、文件信息、操作进度 | 持续显示 | 无 |

### 3.3 选择规则

- 操作耗时 < 1s 且结果不重要 → **Toast**
- 操作结果重要需用户知晓 → **Notification**
- 操作耗时 > 1s 或有进度 → **Operation**
- 操作不可逆或破坏性 → **Confirm**（先确认，再执行操作）
- 代码/渲染错误 → **ErrorDisplay**（保留 ErrorCard/ErrorPanel，统一接口）

## 4. API 设计

### 4.1 FeedbackStore 定义

```typescript
// stores/feedbackStore.ts

type FeedbackType = 'info' | 'success' | 'warning' | 'error';

// ─── Toast ───
interface ToastItem {
  id: string;
  type: FeedbackType;
  message: string;
  duration: number;       // ms, 0 = 不自动关闭
  createdAt: number;
}

// ─── Notification ───
interface NotificationItem {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  persistent: boolean;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

// ─── Operation ───
type OperationType = 'save' | 'open' | 'load' | 'export' | 'import' | 'refresh' | 'compile' | 'render' | 'parse';
type OperationStatus = 'running' | 'success' | 'error';

interface OperationItem {
  id: string;
  type: OperationType;
  status: OperationStatus;
  message: string;
  progress: number;       // 0-100, -1 = 不确定进度
  errorDetail?: string;
  cancellable: boolean;
  onCancel?: () => void;
  createdAt: number;
}

// ─── Confirm ───
interface ConfirmOptions {
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmItem {
  id: string;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

// ─── Store Interface ───
interface FeedbackState {
  toasts: ToastItem[];
  notifications: NotificationItem[];
  operations: OperationItem[];
  confirmQueue: ConfirmItem[];

  // Toast
  addToast: (type: FeedbackType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  // Notification
  addNotification: (type: FeedbackType, message: string, options?: Partial<NotificationItem>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Operation
  startOperation: (type: OperationType, message: string, options?: { cancellable?: boolean; onCancel?: () => void }) => string;
  updateOperationProgress: (id: string, progress: number) => void;
  completeOperation: (id: string, message?: string) => void;
  failOperation: (id: string, message: string, errorDetail?: string) => void;
  cancelOperation: (id: string) => void;
  removeOperation: (id: string) => void;

  // Confirm
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveConfirm: (id: string, confirmed: boolean) => void;
}
```

### 4.2 命令式快捷 API

```typescript
// stores/feedbackStore.ts — 导出便捷函数

export const feedback = {
  toast: {
    info: (msg: string) => store.addToast('info', msg),
    success: (msg: string) => store.addToast('success', msg),
    warning: (msg: string) => store.addToast('warning', msg, 5000),
    error: (msg: string) => store.addToast('error', msg, 0), // error 不自动关闭
  },
  notify: {
    info: (msg: string, opts?) => store.addNotification('info', msg, opts),
    success: (msg: string, opts?) => store.addNotification('success', msg, opts),
    warning: (msg: string, opts?) => store.addNotification('warning', msg, { persistent: true, ...opts }),
    error: (msg: string, opts?) => store.addNotification('error', msg, { persistent: true, ...opts }),
  },
  operation: {
    start: (type, msg, opts?) => store.startOperation(type, msg, opts),
    updateProgress: (id, progress) => store.updateOperationProgress(id, progress),
    complete: (id, msg?) => store.completeOperation(id, msg),
    fail: (id, msg, detail?) => store.failOperation(id, msg, detail),
  },
  confirm: (options: ConfirmOptions) => store.confirm(options),
};
```

### 4.3 调用示例

```typescript
// 轻量操作 — Toast
feedback.toast.success('文件保存成功');
feedback.toast.error('保存失败: 权限不足');

// 重要通知 — Notification
feedback.notify.success('导出完成', {
  action: { label: '打开文件', onClick: () => openFile(path) }
});
feedback.notify.error('内存使用率过高', { persistent: true });

// 长操作 — Operation
const opId = feedback.operation.start('export', '正在导出 SVG...');
feedback.operation.updateProgress(opId, 50);
feedback.operation.complete(opId, '导出成功');

// 确认对话框 — Confirm
const confirmed = await feedback.confirm({
  title: '删除文件',
  message: '确定要删除 xxx.sw 吗？此操作不可撤销。',
  type: 'danger',
  confirmText: '删除',
});
if (confirmed) { deleteFile(); }
```

## 5. UI 组件设计

### 5.1 ToastLayer

- 位置：右上角，垂直堆叠
- 动画：slideIn from right, fadeOut
- 最多显示 5 条，超出时移除最早的
- 类型图标：ℹ️ ✅ ⚠️ ❌
- error 类型不自动关闭，其余 3-5s

### 5.2 NotificationLayer

- 位置：右下角，垂直堆叠
- 动画：slideIn from right, fadeOut
- 支持操作按钮
- persistent 类型不自动关闭
- 非 persistent 类型 8s 后自动关闭

### 5.3 ConfirmDialog

- 位置：居中模态
- 背景遮罩
- 支持 danger/warning/info 三种样式
- ESC 键 = 取消
- 点击遮罩 = 取消

### 5.4 StatusBar（改造）

- 左侧：当前模式 + 当前操作状态（消费 operations[0]）
- 右侧：文件信息
- 操作状态：running 显示 spinner + 消息，success 显示 ✓ + 消息（2s 后消失），error 显示 ✗ + 消息

### 5.5 ErrorDisplay（保留 + 统一接口）

- ErrorCard：保留，用于 SolarWireVisualEditor 中浮动显示单个错误
- ErrorPanel：保留，用于 SolarWireMode 中可折叠错误列表
- 统一 `SyntaxError` 接口定义到 `shared/types/`
- error-overlay：统一使用 ErrorCard 替代

## 6. 迁移计划

### Phase 1: 创建 FeedbackStore + UI 组件

1. 创建 `feedbackStore.ts`
2. 创建 `FeedbackProvider.tsx`（包含 ToastLayer、NotificationLayer、ConfirmDialog）
3. 挂载到 App 顶层
4. 创建 CSS 样式

### Phase 2: 迁移 Toast 调用

| 原调用 | 新调用 | 文件数 |
|--------|--------|--------|
| `showToast(msg, 'success')` | `feedback.toast.success(msg)` | ~8 |
| `showToast(msg, 'error')` | `feedback.toast.error(msg)` | ~15 |
| `showToast(msg, 'info')` | `feedback.toast.info(msg)` | ~5 |
| `showToast(msg, 'error', false)` | `feedback.toast.error(msg)` | ~3 |

### Phase 3: 迁移 StatusStore

1. 将 `statusStore.currentOperation` 迁移到 `feedbackStore.operations`
2. 将 `statusStore.notifications` 迁移到 `feedbackStore.notifications`
3. 将 `showInfo/showSuccess/showWarning/showError` 迁移到 `feedback.notify.*`
4. StatusBar 改为消费 `feedbackStore.operations`
5. 清理 statusStore，只保留文件/编辑器状态

### Phase 4: 迁移导出通知

1. 将 `exportNotification` state 迁移到 `feedback.operation.start('export', ...)`
2. 删除 SolarWireVisualEditor 中的 export-notification JSX 和 CSS

### Phase 5: 合并确认对话框

1. 将 DeleteConfirmModal 的调用改为 `feedback.confirm()`
2. 删除 DeleteConfirmModal.tsx/DeleteConfirmModal.css
3. ConfirmModal 保留为独立组件，供非 feedback.confirm 场景使用

### Phase 6: 统一错误接口

1. 将 `SyntaxError` 接口移到 `shared/types/`
2. ErrorPanel 的 `ErrorInfo` 改为引用 `SyntaxError`
3. SolarWirePreview 的 error-overlay 改为使用 ErrorCard

### Phase 7: 清理废弃代码

1. 删除 `toast-service.ts`
2. 删除 `Toast.tsx` / `Toast.css`
3. 清理 statusStore 中的通知相关代码
4. 清理所有未使用的 import

## 7. 废弃清单

| 文件/代码 | 处理方式 |
|-----------|----------|
| `services/toast-service.ts` | 删除 |
| `components/ui/Toast.tsx` | 删除 |
| `components/ui/Toast.css` | 删除 |
| `statusStore.ts` → `notifications` | 删除 |
| `statusStore.ts` → `currentOperation` / `startOperation` / `completeOperation` / `failOperation` / `updateOperationProgress` | 删除 |
| `statusStore.ts` → `showStatusMessage` / `showInfo` / `showSuccess` / `showWarning` / `showError` | 删除 |
| `components/editor/DeleteConfirmModal.tsx` | 删除 |
| `components/editor/DeleteConfirmModal.css` | 删除 |
| `SolarWireVisualEditor.tsx` → `exportNotification` state | 删除 |
| `SolarWireVisualEditor.css` → `.export-notification` | 删除 |
