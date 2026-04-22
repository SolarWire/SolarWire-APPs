# 组件库管理排序与拖拽修复设计

**日期**: 2026-04-22
**状态**: 待用户评审

## 背景

组件库管理存在三个相关问题：
1. 组件排序不生效 — 跨组件库移动组件时位置没有按预期排列
2. 分类/组件的跨库移动位置失败 — 显示了高亮但实际移动到错误位置
3. 拖入组件内部元素堆叠 — 组件内多个元素被放在同一个坐标

## 问题分析

### 问题 1 & 2: 分类/组件的跨库移动位置失败

**根本原因：**

1. `moveComponentToCategory` (L396-427) — 跨库移动组件时直接 push 到末尾，完全忽略 position 参数
2. `moveCategoryToLibrary` (L309-363) — 当 `targetCategoryId` 为 null 或找不到目标时，也是直接 push
3. `handleDrop` (L189) — 调用 `moveCategory` 跨库时传入 `targetCategoryId: null`，导致总是 push

**表现：**
- 用户拖动组件到另一个库的指定位置，看到高亮线后放手
- 实际移动到库的末尾，position 被忽略

### 问题 3: 组件拖入画布后元素堆叠

**根本原因：**

`handleDropComponentToCanvas` (SolarWireMode.tsx L340-344) 直接拼接代码：
```typescript
const newContent = content + '\n\n' + component.code;
```

而 `SolarWirePreview.tsx` 拖入普通代码有坐标偏移逻辑，但组件拖入没有。

**表现：**
- 组件内多个元素各有原始坐标
- 拖入画布后全部堆叠在同一点

---

## 修复方案

### 方案 A：修复业务逻辑 + 优化拖拽交互

#### 1. 修复 `moveComponentToCategory` 方法

**文件**: `ComponentLibraryManager.ts`

**现状问题**:
```typescript
// L408 — 直接 push 忽略 position
const targetComponents = [...targetLibrary.components, updatedMovedComponent];
```

**修复方案**:

当 `targetComponentId` 有值时，根据 position 插入到正确位置：
- `before`: 插入到 targetComponentId 之前
- `after`: 插入到 targetComponentId 之后
- 空/无目标: push 到末尾

```typescript
async moveComponentToCategory(
  sourceLibraryId: string,
  componentId: string,
  targetLibraryId: string,
  targetCategoryId: string | null,
  targetComponentId: string | null,
  position: 'before' | 'after'
): Promise<void> {
  // ... 保持现有逻辑直到创建 targetComponents

  let targetComponents: Component[];
  if (targetComponentId) {
    // 找到目标组件位置，按 before/after 插入
    const insertIndex = targetComponents.findIndex(c => c.id === targetComponentId);
    if (insertIndex >= 0) {
      const finalIndex = position === 'before' ? insertIndex : insertIndex + 1;
      targetComponents.splice(finalIndex, 0, updatedMovedComponent);
    } else {
      targetComponents.push(updatedMovedComponent);
    }
  } else {
    targetComponents.push(updatedMovedComponent);
  }
  // ... 后续保持不变
}
```

#### 2. 修复组件拖入画布的坐标偏移

**文件**: `SolarWireMode.tsx`

**现状问题**:
```typescript
const handleDropComponentToCanvas = (component, x, y) => {
  const newContent = content + '\n\n' + component.code;
  // 没有坐标偏移！
};
```

**修复方案**:

复用 `SolarWirePreview.tsx` 中已有的坐标偏移逻辑：

```typescript
const handleDropComponentToCanvas = useCallback((component: Component, x: number, y: number) => {
  if (!component.code) return;

  const adjustedCode = component.code
    .split(/\r?\n/)
    .map((line) => {
      const coordMatch = line.match(/@\((\d+),\s*(\d+)\)/);
      if (coordMatch) {
        const origX = parseInt(coordMatch[1], 10);
        const origY = parseInt(coordMatch[2], 10);
        const dx = x - origX;
        const dy = y - origY;
        return line.replace(
          /@\(\d+,\s*\d+\)/g,
          (match) => {
            const m = match.match(/@\((\d+),\s*(\d+)\)/);
            if (m) {
              const nx = Math.max(0, parseInt(m[1], 10) + dx);
              const ny = Math.max(0, parseInt(m[2], 10) + dy);
              return `@(${nx},${ny})`;
            }
            return match;
          }
        );
      }
      return line;
    })
    .join('\n');

  const newContent = content.trimEnd() + '\n\n' + adjustedCode;
  setContent(newContent);
  setShowComponentLibrary(false);
}, [content, setContent, setShowComponentLibrary]);
```

#### 3. 跨库拖拽时自动展开目标库

**文件**: `ComponentLibraryManagerModal.tsx`

**现状问题**:
- 跨库拖拽时，如果目标库未展开，无法显示高亮和精确放置

**修复方案**:

在 `handleDragOver` 中检测跨库拖拽到折叠库的情况：

```typescript
const handleDragOver = (e: React.DragEvent, targetId: string, targetType: TreeNodeType) => {
  e.preventDefault();
  if (!draggedNode) return;
  if (draggedNode.id === targetId && draggedNode.type === targetType) return;

  // 跨库拖拽时，自动展开目标库
  if (draggedNode.libraryId !== selectedLibraryId && targetType === 'library') {
    if (!expandedNodes.has(targetId)) {
      toggleNode(targetId); // 自动展开
    }
  }

  setDragOverTarget({ id: targetId, type: targetType, position: computeDropPosition(e, targetType) });
};
```

---

## 实现计划

### Phase 1: 组件库管理修复
1. 修改 `moveComponentToCategory` 支持 position 插入
2. 修改 `handleDrop` 传递正确的 targetComponentId 和 position
3. 添加跨库拖拽时自动展开目标库的逻辑

### Phase 2: 组件拖入画布修复
1. 修改 `handleDropComponentToCanvas` 添加坐标偏移逻辑

### Phase 3: 测试验证
1. 同库内组件排序
2. 跨库组件移动
3. 同库内分类排序
4. 跨库分类移动
5. 组件拖入画布坐标偏移

---

## 影响范围

- `ComponentLibraryManager.ts` — 核心排序逻辑
- `ComponentLibraryManagerModal.tsx` — 拖拽交互逻辑
- `SolarWireMode.tsx` — 组件拖入画布逻辑

无破坏性变更，向后兼容。
