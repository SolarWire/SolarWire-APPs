# Draft Content + mark/commit 延迟提交 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现拖拽/缩放/线段端点操作的延迟提交机制，消除历史污染和不必要的文件/Monaco同步。

**Architecture:** 在 previewStore 中引入 draftContent 和 markSnapshot 状态，拖拽期间只更新 draftContent 用于视觉渲染，松手后通过 commit 一次性提交到 editorStore。editorStore 新增 commitContent 方法，用 markSnapshot 作为历史前驱，确保一次操作只产生一条历史记录。

**Tech Stack:** React, Zustand, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `editor/src/shared/types/editor.ts` | Modify | 新增 `commitContent` 类型签名 |
| `editor/src/app/stores/editorStore.ts` | Modify | 新增 `commitContent` 方法 |
| `editor/src/app/stores/previewStore.ts` | Modify | 新增 draftContent/markSnapshot 状态和 mark/commit/clearDraftContent 方法 |
| `editor/src/app/components/editor/SolarWirePreview.tsx` | Modify | 用 draftContent ?? effectiveContent 作为渲染内容 |
| `editor/src/app/components/editor/hooks/useElementInteraction.ts` | Modify | 拖拽中写 draftContent，松手时 commit |
| `editor/src/app/components/editor-modes/SolarWireMode.tsx` | Modify | commit 时调用 commitContent + syncFullFileContent |

---

### Task 1: editorStore 新增 commitContent 方法

**Files:**
- Modify: `editor/src/shared/types/editor.ts`
- Modify: `editor/src/app/stores/editorStore.ts`

- [ ] **Step 1: 在 EditorState 接口中新增 commitContent 方法签名**

在 `editor/src/shared/types/editor.ts` 的 `EditorState` 接口中添加：

```ts
commitContent: (content: string, snapshot: string) => void;
```

- [ ] **Step 2: 在 editorStore 中实现 commitContent**

在 `editor/src/app/stores/editorStore.ts` 的 return 对象中，在 `setContent` 方法之后添加：

```ts
commitContent: (content: string, snapshot: string) => {
  const { history, historyIndex } = get();

  if (content === snapshot) return;

  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(snapshot);

  if (newHistory.length > 50) {
    newHistory.shift();
  }

  set({
    content,
    isModified: true,
    history: newHistory,
    historyIndex: newHistory.length - 1
  });
},
```

与 `setContent` 的区别：`setContent` 用 `oldContent`（当前内容）作为历史前驱，而 `commitContent` 用 `snapshot`（mark 时保存的快照）作为历史前驱。这确保一次完整操作只产生一条历史记录。

- [ ] **Step 3: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add editor/src/shared/types/editor.ts editor/src/app/stores/editorStore.ts
git commit -m "feat: add commitContent method to editorStore for deferred history recording"
```

---

### Task 2: previewStore 新增 draft 状态和 mark/commit 方法

**Files:**
- Modify: `editor/src/app/stores/previewStore.ts`

- [ ] **Step 1: 在 PreviewState 接口中新增 draft 状态**

在 `previewStore.ts` 的 `PreviewState` 接口中，`altKeyPressed` 之后添加：

```ts
draftContent: string | null;
markSnapshot: string | null;
```

- [ ] **Step 2: 在 PreviewActions 接口中新增 draft 方法**

在 `PreviewActions` 接口中，`setAltKeyPressed` 之后添加：

```ts
setDraftContent: (content: string) => void;
mark: (currentContent: string) => void;
commit: () => { content: string; snapshot: string } | null;
clearDraftContent: () => void;
```

- [ ] **Step 3: 在 store 实现中添加初始状态**

在 `usePreviewStore` 的初始状态中，`altKeyPressed: false` 之后添加：

```ts
draftContent: null,
markSnapshot: null,
```

- [ ] **Step 4: 在 store 实现中添加方法**

在 `setAltKeyPressed` 方法之后添加：

```ts
setDraftContent: (content) => {
  const { markSnapshot } = get();
  if (markSnapshot !== null) {
    set({ draftContent: content });
  }
},
mark: (currentContent) => set({
  markSnapshot: currentContent,
  draftContent: currentContent,
}),
commit: () => {
  const { draftContent, markSnapshot } = get();
  if (draftContent !== null && markSnapshot !== null) {
    set({ draftContent: null, markSnapshot: null });
    return { content: draftContent, snapshot: markSnapshot };
  }
  return null;
},
clearDraftContent: () => set({
  draftContent: null,
  markSnapshot: null,
}),
```

关键设计：
- `setDraftContent` 只在 `markSnapshot !== null`（即 mark 已调用）时才更新，防止误写
- `mark` 同时设置 `markSnapshot` 和 `draftContent`，确保 draft 从当前内容开始
- `commit` 返回最终内容和快照，同时清除 draft 状态
- `clearDraftContent` 用于取消操作时清理

- [ ] **Step 5: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add editor/src/app/stores/previewStore.ts
git commit -m "feat: add draftContent state and mark/commit methods to previewStore"
```

---

### Task 3: SolarWirePreview 使用 draftContent 渲染

**Files:**
- Modify: `editor/src/app/components/editor/SolarWirePreview.tsx`

- [ ] **Step 1: 从 previewStore 读取 draftContent**

在 `SolarWirePreview.tsx` 中，从 `usePreviewStore` 的解构中添加 `draftContent`：

找到：
```ts
const {
  scale, setScale, position, setPosition,
  isInitialized, setIsInitialized,
  boxSelection, dragPreviewElement,
  hoveredElement, setHoveredElement,
  alignmentGuides, distanceLines,
} = usePreviewStore();
```

替换为：
```ts
const {
  scale, setScale, position, setPosition,
  isInitialized, setIsInitialized,
  boxSelection, dragPreviewElement,
  hoveredElement, setHoveredElement,
  alignmentGuides, distanceLines,
  draftContent,
} = usePreviewStore();
```

- [ ] **Step 2: 计算 renderContent 并替换 effectiveContent 的渲染用途**

在 `effectiveSetContent` 定义之后添加：

```ts
const renderContent = draftContent ?? effectiveContent;
```

然后将以下位置中的 `effectiveContent` 替换为 `renderContent`（仅渲染用途）：

1. `ast` 的 useMemo：`parse(safeContent)` 中的 `safeContent` 来源
2. `render()` 调用中的 `sourceInput` 参数
3. `parseErrorMsg` 的 useMemo
4. `elementBounds` 的 `effectiveContent` 参数
5. `useElementInteraction` 的 `effectiveContent` 参数
6. `useDropHandler` 的 `effectiveContent` 参数
7. `useKeyboardShortcuts` 的 `effectiveContent` 参数
8. `SnapOverlay` 的 `effectiveContent` prop

注意：`effectiveSetContent` 和 `handleImageAdded` 中的 `effectiveContent` 保持不变（这些是写入操作，不是渲染用途）。

- [ ] **Step 3: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add editor/src/app/components/editor/SolarWirePreview.tsx
git commit -m "feat: use draftContent for rendering when available in SolarWirePreview"
```

---

### Task 4: useElementInteraction 拖拽中写 draft，松手时 commit

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementInteraction.ts`

这是最核心的改动。需要修改三个地方：handleMouseDown（mark）、handleMouseMove（写 draft）、handleMouseUp（commit）。

- [ ] **Step 1: 在 handleMouseDown 中添加 mark 调用**

在 `handleMouseDown` 中，当设置 `dragElementState`、`resizeHandleState` 或 `multiDragElements` 时，调用 `mark`。

在 `setDragElementState(dragState)` 之前添加：
```ts
usePreviewStore.getState().mark(effectiveContent);
```

在 `setResizeHandleState({...})` 之前添加：
```ts
usePreviewStore.getState().mark(effectiveContent);
```

在 `setMultiDragElements(initialPositions)` 之前添加：
```ts
usePreviewStore.getState().mark(effectiveContent);
```

注意：只在真正开始拖拽/缩放操作时调用 mark，不在选择操作或画布拖拽时调用。

- [ ] **Step 2: 在 handleMouseMove 中将 rafUpdater 替换为 setDraftContent**

将 `rafUpdater` 的所有调用替换为 `usePreviewStore.getState().setDraftContent`。

具体替换位置（在 handleMouseMove 回调内部）：

1. 线段端点拖拽（resize handle start/end）：
   找到 `rafUpdater(lines.join('\n'));`
   替换为 `usePreviewStore.getState().setDraftContent(lines.join('\n'));`

2. 普通元素 resize：
   找到 `rafUpdater(newContent);`（在 resize 的 `if (newW >= 10 && newH >= 10)` 块中）
   替换为 `usePreviewStore.getState().setDraftContent(newContent);`

3. 单元素拖拽 - handleLineDrag 调用：
   找到 `handleLineDrag(effectiveContent, lineNum, ..., rafUpdater, isEndRelative);`
   替换为 `handleLineDrag(effectiveContent, lineNum, ..., (c: string) => usePreviewStore.getState().setDraftContent(c), isEndRelative);`

4. 单元素拖拽 - handleElementDrag 调用：
   找到 `handleElementDrag(effectiveContent, lineNum, ..., rafUpdater);`
   替换为 `handleElementDrag(effectiveContent, lineNum, ..., (c: string) => usePreviewStore.getState().setDraftContent(c));`

5. 多元素拖拽：
   找到 `rafUpdater(newContent);`（在 multiDragElements forEach 之后）
   替换为 `usePreviewStore.getState().setDraftContent(newContent);`

6. 多元素拖拽中 groupBounds 为 null 的 fallback：
   找到 `rafUpdater(effectiveContent);`
   替换为 `usePreviewStore.getState().setDraftContent(effectiveContent);`

注意：`handleLineDrag` 和 `handleElementDrag` 函数签名中的 `setContentFn` 参数类型已经是 `(content: string) => void`，所以传入 `(c: string) => usePreviewStore.getState().setDraftContent(c)` 是兼容的。

- [ ] **Step 3: 在 handleMouseUp 中添加 commit 逻辑**

在 `handleMouseUp` 中，当清除 `resizeHandleState`、`dragElementState` 或 `multiDragElements` 时，先 commit draft content。

找到 resize handle 清除部分：
```ts
if (currentResizeHandleState) {
  setResizeHandleState(null);
  return;
}
```

替换为：
```ts
if (currentResizeHandleState) {
  const result = usePreviewStore.getState().commit();
  if (result && result.content !== result.snapshot) {
    effectiveSetContent(result.content);
  } else {
    usePreviewStore.getState().clearDraftContent();
  }
  setResizeHandleState(null);
  setAlignmentGuides([]);
  return;
}
```

找到 drag element 清除部分：
```ts
if (currentDragElementState) {
  setDragElementState(null);
  setAlignmentGuides([]);
  return;
}
```

替换为：
```ts
if (currentDragElementState) {
  const result = usePreviewStore.getState().commit();
  if (result && result.content !== result.snapshot) {
    effectiveSetContent(result.content);
  } else {
    usePreviewStore.getState().clearDraftContent();
  }
  setDragElementState(null);
  setAlignmentGuides([]);
  return;
}
```

找到 multi drag 清除部分：
```ts
if (currentMultiDragElements.length > 0) {
  setMultiDragElements([]);
  setAlignmentGuides([]);
  return;
}
```

替换为：
```ts
if (currentMultiDragElements.length > 0) {
  const result = usePreviewStore.getState().commit();
  if (result && result.content !== result.snapshot) {
    effectiveSetContent(result.content);
  } else {
    usePreviewStore.getState().clearDraftContent();
  }
  setMultiDragElements([]);
  setAlignmentGuides([]);
  return;
}
```

- [ ] **Step 4: 处理 onMouseLeave 中的 commit**

在 `SolarWirePreview.tsx` 中，`onMouseLeave` 调用了 `handleMouseUp({} as React.MouseEvent)`。由于 handleMouseUp 已经包含了 commit 逻辑，这里不需要额外修改。但需要确认 `onMouseLeave` 时如果有 draft content 也能正确 commit。

由于 `handleMouseUp` 中检查的是 `currentResizeHandleState`、`currentDragElementState` 和 `currentMultiDragElements`，当传入空事件时，这些状态仍然存在（因为它们是在 mouseDown 时设置的，还没有被清除），所以 commit 逻辑会正确执行。

- [ ] **Step 5: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 6: Commit**

```bash
git add editor/src/app/components/editor/hooks/useElementInteraction.ts
git commit -m "feat: use draftContent during drag/resize, commit on mouseUp"
```

---

### Task 5: SolarWireMode 使用 commitContent 提交

**Files:**
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

- [ ] **Step 1: 修改 handleContentChange 以支持 commit 模式**

当前 `handleContentChange` 总是调用 `setContent` + `syncFullFileContent`。当从 draft commit 提交时，应该使用 `commitContent` 代替 `setContent`。

找到：
```ts
const handleContentChange = useCallback((newContent: string) => {
  setContent(newContent);
  syncFullFileContent(newContent);

  syntaxErrorService.setCurrentSourceId(mainErrorSourceId);
  syntaxErrorService.runRendererCheck(newContent);
}, [setContent, syncFullFileContent, mainErrorSourceId]);
```

替换为：
```ts
const handleContentChange = useCallback((newContent: string, snapshot?: string) => {
  if (snapshot !== undefined) {
    commitContent(newContent, snapshot);
  } else {
    setContent(newContent);
  }
  syncFullFileContent(newContent);

  syntaxErrorService.setCurrentSourceId(mainErrorSourceId);
  syntaxErrorService.runRendererCheck(newContent);
}, [setContent, commitContent, syncFullFileContent, mainErrorSourceId]);
```

注意：`snapshot` 参数是可选的。当从 draft commit 提交时传入 snapshot，其他情况（如 Monaco 编辑、PropertyPanel 修改）不传 snapshot，走原有的 `setContent` 逻辑。

- [ ] **Step 2: 修改 useElementInteraction 中的 commit 调用，传递 snapshot**

回到 `useElementInteraction.ts`，修改 handleMouseUp 中的 commit 调用。

将所有三处 commit 后的调用从：
```ts
effectiveSetContent(result.content);
```

改为：
```ts
effectiveSetContent(result.content, result.snapshot);
```

这需要 `effectiveSetContent` 的类型签名支持可选的 `snapshot` 参数。

- [ ] **Step 3: 更新 effectiveSetContent 类型签名**

在 `useElementInteraction.ts` 的 `UseElementInteractionOptions` 接口中：

找到：
```ts
effectiveSetContent: (c: string) => void;
```

替换为：
```ts
effectiveSetContent: (c: string, snapshot?: string) => void;
```

同样在 `SolarWirePreview.tsx` 中，`effectiveSetContent` 的定义：

找到：
```ts
const effectiveSetContent = isExternalMode ? (onExternalContentChange || (() => {})) : setContent;
```

替换为：
```ts
const effectiveSetContent = isExternalMode
  ? (onExternalContentChange ? (c: string, _snapshot?: string) => onExternalContentChange(c) : () => {})
  : (c: string, snapshot?: string) => { if (snapshot !== undefined) { commitContent(c, snapshot); } else { setContent(c); } };
```

需要从 `useEditorStore` 中解构 `commitContent`：
```ts
const { content, setContent, commitContent } = useEditorStore();
```

- [ ] **Step 4: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 5: Commit**

```bash
git add editor/src/app/components/editor-modes/SolarWireMode.tsx editor/src/app/components/editor/hooks/useElementInteraction.ts editor/src/app/components/editor/SolarWirePreview.tsx
git commit -m "feat: integrate commitContent for deferred history recording on drag/resize commit"
```

---

### Task 6: 清理 rafUpdater 和边界情况处理

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementInteraction.ts`
- Modify: `editor/src/app/components/editor/SolarWirePreview.tsx`

- [ ] **Step 1: 移除 useElementInteraction 中不再需要的 rafUpdater**

由于 handleMouseMove 中所有 `rafUpdater` 调用都已被替换为 `setDraftContent`，`rafUpdater` 不再被使用。

在 `useElementInteraction.ts` 中：

1. 删除 `rafUpdater` 的定义：
```ts
const rafUpdater = useMemo(() => createRafContentUpdater(effectiveSetContent), [effectiveSetContent]);
```

2. 从 import 中移除 `createRafContentUpdater`：
```ts
import { createRafContentUpdater } from '../../../../shared/utils/preview-utils';
```

3. 从 `useMemo` 的 import 中移除（如果不再使用）

4. 从 `handleMouseMove` 的依赖数组中移除 `rafUpdater`

5. 从 `handleMouseMove` 的依赖数组中移除 `effectiveSetContent`（如果不再直接使用）

注意：`handleLineDrag` 和 `handleElementDrag` 的 `setContentFn` 参数现在通过内联函数传入，不再依赖 `rafUpdater`。

- [ ] **Step 2: 在 SolarWirePreview 中添加 draft content 清理的 useEffect**

当 `effectiveContent` 外部变更时（如从代码编辑器修改），需要清除可能存在的 draft content。

在 `SolarWirePreview.tsx` 中添加：

```ts
useEffect(() => {
  const { draftContent, markSnapshot } = usePreviewStore.getState();
  if (draftContent !== null || markSnapshot !== null) {
    usePreviewStore.getState().clearDraftContent();
  }
}, [effectiveContent]);
```

这确保当外部内容变更时（如切换文件、从代码编辑器修改），draft content 被清除，不会显示过时的草稿。

- [ ] **Step 3: 验证编译通过**

Run: `cd editor && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add editor/src/app/components/editor/hooks/useElementInteraction.ts editor/src/app/components/editor/SolarWirePreview.tsx
git commit -m "refactor: remove rafUpdater from useElementInteraction, add draft cleanup on external content change"
```

---

### Task 7: 端到端验证

**Files:**
- No new files

- [ ] **Step 1: 启动开发服务器**

Run: `cd editor && npm run dev`

- [ ] **Step 2: 验证拖拽移动**

1. 打开一个 SolarWire 文件
2. 拖拽一个元素移动
3. 预期：元素实时跟随鼠标
4. 松手后，检查代码编辑器是否更新
5. 按 Ctrl+Z 撤销
6. 预期：元素回到拖拽前的位置（一次撤销即可）

- [ ] **Step 3: 验证缩放操作**

1. 选中一个元素
2. 拖拽缩放手柄
3. 预期：元素实时缩放
4. 松手后，检查代码编辑器是否更新
5. 按 Ctrl+Z 撤销
6. 预期：元素回到缩放前的状态（一次撤销即可）

- [ ] **Step 4: 验证线段端点拖拽**

1. 选中一条线段
2. 拖拽端点手柄
3. 预期：端点实时跟随鼠标
4. 松手后，检查代码编辑器是否更新
5. 按 Ctrl+Z 撤销
6. 预期：线段回到拖拽前的状态

- [ ] **Step 5: 验证多元素拖拽**

1. 选中多个元素
2. 拖拽移动
3. 预期：所有选中元素实时跟随
4. 松手后，检查代码编辑器是否更新
5. 按 Ctrl+Z 撤销
6. 预期：所有元素回到拖拽前的位置

- [ ] **Step 6: 验证 PropertyPanel 修改**

1. 选中一个元素
2. 在 PropertyPanel 中修改属性（如 x 坐标）
3. 预期：即时生效到代码编辑器（不走 draft 机制）

- [ ] **Step 7: 验证吸附对齐**

1. 开启吸附对齐
2. 拖拽元素靠近另一个元素
3. 预期：吸附引导线正常显示
4. 松手后，元素吸附到对齐位置

- [ ] **Step 8: Commit final**

```bash
git add -A
git commit -m "feat: complete draft content deferred commit implementation"
```
