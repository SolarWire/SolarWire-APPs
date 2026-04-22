# 组件库管理与可视化编辑修复设计

**日期**: 2026-04-22
**状态**: 待用户评审

## 背景

组件库管理存在五个相关问题：
1. 组件排序不生效 — 跨组件库移动组件时位置没有按预期排列
2. 分类/组件的跨库移动位置失败 — 显示了高亮但实际移动到错误位置
3. 拖入组件内部元素堆叠 — 组件内多个元素被放在同一个坐标
4. 缩略图显示为 Base64 文字 — data URL 被当作纯文本显示
5. 组件管理器的可视化编辑功能不足 — 只有预览，没有编辑能力

---

## 问题 1 & 2: 分类/组件的跨库移动位置失败

### 根本原因

1. `moveComponentToCategory` (L396-427) — 跨库移动组件时直接 push 到末尾，完全忽略 position 参数
2. `moveCategoryToLibrary` (L309-363) — 当 `targetCategoryId` 为 null 或找不到目标时，也是直接 push
3. `handleDrop` (L189) — 调用 `moveCategory` 跨库时传入 `targetCategoryId: null`，导致总是 push

### 修复方案

**1. 修改 `moveComponentToCategory` 方法**

```typescript
// L408 原代码 — 直接 push 忽略 position
const targetComponents = [...targetLibrary.components, updatedMovedComponent];

// 修改为：根据 targetComponentId 和 position 插入到正确位置
let targetComponents: Component[];
if (targetComponentId) {
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
```

**2. 跨库拖拽时自动展开目标库**

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

## 问题 3: 组件拖入画布后元素堆叠

### 根本原因

`handleDropComponentToCanvas` 直接拼接代码，没有坐标偏移：

```typescript
const newContent = content + '\n\n' + component.code;
```

### 修复方案

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

---

## 问题 4: 缩略图显示为 Base64 文字

### 根本原因

`generateThumbnail` 返回的是 `data:image/svg+xml;base64,...` 格式的 data URL，但 `ComponentLibrary.tsx` 使用 `dangerouslySetInnerHTML` 期望接收 HTML 标签字符串，导致 data URL 被当作纯文本显示。

### 修复方案

**1. 修改 `generateThumbnail` 返回原始 SVG 字符串**

```typescript
// thumbnail-generator.ts
export async function generateThumbnail(code: string, width: number = 150, height: number = 100): Promise<string> {
  try {
    // ... 现有解析和渲染逻辑 ...
    
    const thumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#fafafa"/>
      <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
        ${result.svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
      </g>
    </svg>`;

    // 改为返回原始 SVG 字符串，不再 base64 编码
    return thumbnailSvg;
  } catch (error) {
    return createErrorThumbnail();
  }
}
```

**2. 修改 `ComponentLibrary.tsx` 使用 `<img>` 显示缩略图**

```typescript
// ComponentLibrary.tsx L278
{/* 原代码 */}
<div dangerouslySetInnerHTML={{ __html: thumbnail }} />

{/* 修改为 */}
<img src={thumbnail} alt={component.name} className="thumbnail-image" />
```

**3. 添加 CSS 样式**

```css
.component-thumbnail img.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

---

## 问题 5: 组件管理器的可视化编辑功能不足

### 现状

`ComponentLibraryManagerModal.tsx` 中的 `VisualCanvasEditor` 只有：
- SVG 渲染显示
- 缩放/平移

缺少：元素选择、拖动、缩放、属性编辑等功能。

### 修复方案

**直接复制 `SolarWirePreview.tsx` 的可视化编辑能力到组件管理器，独立实现。**

新建文件：`ComponentVisualEditor.tsx`

此文件将包含：
- 完整的 SVG 渲染（基于 `render()` 函数）
- 元素选择、hover 高亮
- 元素拖动、缩放
- 四角 resize 手柄
- 属性面板编辑（文字、颜色、尺寸等）
- 撤销/重做
- 键盘快捷键

**重要约束**：
- 不修改 `SolarWirePreview.tsx` — 现有编辑体验保持不变
- 工具方法（如坐标转换、颜色处理等）不复制，直接复用

### 新文件结构

```
ComponentVisualEditor.tsx
├── 状态管理（选中元素、hover、拖动、缩放等）
├── SVG 渲染层（基于 render()）
├── 交互层（选择框、resize 手柄）
├── 属性编辑面板
├── 工具栏（撤销、重做、删除、层级调整）
└── 事件处理（键盘快捷键）
```

---

## 实现计划

### Phase 1: 缩略图修复
1. 修改 `generateThumbnail` 返回原始 SVG 字符串
2. 修改 `ComponentLibrary.tsx` 使用 `<img>` 显示
3. 添加 CSS 样式

### Phase 2: 组件库管理排序修复
1. 修改 `moveComponentToCategory` 支持 position 插入
2. 修改 `handleDrop` 传递正确的 targetComponentId 和 position
3. 添加跨库拖拽时自动展开目标库的逻辑

### Phase 3: 组件拖入画布修复
1. 修改 `handleDropComponentToCanvas` 添加坐标偏移逻辑

### Phase 4: 组件管理器可视化编辑器
1. 创建 `ComponentVisualEditor.tsx`
2. 实现完整的可视化编辑能力
3. 集成到 `ComponentLibraryManagerModal.tsx`

### Phase 5: 测试验证
1. 缩略图正确渲染
2. 同库内组件排序
3. 跨库组件移动
4. 同库内分类排序
5. 跨库分类移动
6. 组件拖入画布坐标偏移
7. 组件管理器可视化编辑功能

---

## 影响范围

- `thumbnail-generator.ts` — 返回值格式变更
- `ComponentLibrary.tsx` — 显示方式变更
- `ComponentLibrary.css` — 添加缩略图样式
- `ComponentLibraryManager.ts` — 排序逻辑修复
- `ComponentLibraryManagerModal.tsx` — 拖拽交互优化
- `SolarWireMode.tsx` — 坐标偏移逻辑添加
- `ComponentVisualEditor.tsx` — 新文件

无破坏性变更，向后兼容。
