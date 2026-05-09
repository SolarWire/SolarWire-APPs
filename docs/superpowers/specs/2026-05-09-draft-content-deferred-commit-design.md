# Phase 1: Draft Content + mark/commit 延迟提交设计

## 问题

SolarWire 可视化编辑器当前在拖拽/缩放/线段端点拖拽时，每帧（~60fps）都会：
1. 修改内容字符串
2. 记录一条历史
3. 同步写入文件
4. 更新 Monaco 编辑器

导致：
- 历史记录被中间状态污染（一次拖拽产生 100+ 条历史）
- Undo 不可用（需撤销上百次才能回到拖拽前）
- 文件系统频繁写入
- Monaco 编辑器频繁同步

## 方案

借鉴 tldraw 的 `mark/commit` 模式，引入 Draft Content 机制：

- **Draft Content**：操作期间的临时内容，仅用于视觉渲染
- **mark()**：操作开始前标记当前内容为历史起点
- **commit()**：操作完成后将 draft content 提交为正式内容

### 数据流

```
mouseDown → mark(effectiveContent)

mouseMove → updateLineAttribute → setDraftContent(newContent)
  → 预览从 draftContent 渲染
  → 不记录历史
  → 不写文件
  → 不更新 Monaco

mouseUp → commit()
  → effectiveSetContent(draftContent)
  → 记录一条历史（从 mark 快照到最终状态）
  → 文件同步一次
  → Monaco 更新一次
  → clearDraftContent
```

## 改动文件

### 1. previewStore.ts

新增状态和方法：

```ts
draftContent: string | null;
markSnapshot: string | null;

setDraftContent: (content: string) => void;
mark: (currentContent: string) => void;
commit: () => { content: string; snapshot: string } | null;
clearDraftContent: () => void;
```

- `mark(currentContent)`: 保存当前内容快照到 `markSnapshot`，设置 `draftContent = currentContent`
- `setDraftContent(content)`: 更新 `draftContent`（仅在 mark 后有效）
- `commit()`: 返回 `{ content: draftContent, snapshot: markSnapshot }`，清除 draft 状态
- `clearDraftContent()`: 清除 draft 和 snapshot（取消操作时用）

### 2. editorStore.ts

新增方法：

```ts
commitContent: (content: string, snapshot: string) => void;
```

- 用 `snapshot` 作为历史前驱（而非当前 content），只产生一条历史记录
- 同时更新 content 和 isModified

### 3. SolarWirePreview.tsx

- 从 previewStore 读取 `draftContent`
- 计算 `renderContent = draftContent ?? effectiveContent`
- 用 `renderContent` 替代所有 `effectiveContent` 的渲染用途（parse、render、传给 hooks）
- `effectiveSetContent` 保持不变（仍用于非拖拽操作）

### 4. useElementInteraction.ts

- `handleMouseDown`：在设置 dragElementState/resizeHandleState/multiDragElements 时调用 `mark(effectiveContent)`
- `handleMouseMove`：将 `rafUpdater(newContent)` 替换为 `setDraftContent(newContent)`
- `handleMouseUp`：调用 `commit()` 获取最终内容，通过 `effectiveSetContent` 提交

### 5. SolarWireMode.tsx

- `handleContentChange` 需要区分"拖拽中的 draft 更新"和"正式内容提交"
- commit 时调用 `editorStore.commitContent` 而非 `setContent`
- commit 时调用 `syncFullFileContent` 一次

## 边界情况

| 场景 | 处理 |
|------|------|
| 鼠标离开画布 | onMouseLeave 触发 commit |
| 组件卸载 | useEffect 清理中 clearDraftContent |
| 外部内容变更 | 清除 draft，用新内容渲染 |
| PropertyPanel 修改 | 不走 draft，直接 effectiveSetContent |
| 拖拽中无实际移动 | commit 时检测 draft === snapshot，跳过提交 |

## 性能预期

| 指标 | 当前 | Phase 1 后 |
|------|------|-----------|
| 拖拽期间历史记录 | ~60条/秒 | 0 |
| 拖拽期间文件写入 | ~60次/秒 | 0 |
| 拖拽期间 Monaco 更新 | ~60次/秒 | 0 |
| 操作完成历史记录 | N/A | 1条 |
| Undo 恢复到拖拽前 | 撤销 N 次 | 撤销 1 次 |

## 未来优化方向

- Phase 2: 增量渲染（只重新渲染变化的元素）
- Phase 3: 结构化数据模型（O(1) 属性更新）
