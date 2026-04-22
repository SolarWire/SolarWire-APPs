# 组件库管理与可视化编辑修复实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复组件库管理的排序、拖拽、缩略图显示问题，并增强可视化编辑能力

**Architecture:** 
- Phase 1-3 为小型修复，直接修改现有代码
- Phase 4 新建独立组件，复制 SolarWirePreview 的可视化编辑能力但不修改原组件
- Phase 5 为测试验证

**Tech Stack:** React, TypeScript, Zustand, SVG rendering

---

## Task 1: 缩略图修复 - 修改 generateThumbnail 返回原始 SVG

**Files:**
- Modify: `editor/src/lib/components/thumbnail-generator.ts`
- Modify: `editor/src/app/components/editor/ComponentLibrary.tsx`
- Modify: `editor/src/app/components/editor/ComponentLibrary.css`

- [ ] **Step 1: 修改 generateThumbnail 返回原始 SVG 字符串**

打开 `editor/src/lib/components/thumbnail-generator.ts`，找到第 26 行：
```typescript
return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(thumbnailSvg)))}`;
```
改为：
```typescript
return thumbnailSvg;
```

- [ ] **Step 2: 修改 ComponentLibrary.tsx 使用 <img> 显示缩略图**

打开 `editor/src/app/components/editor/ComponentLibrary.tsx`，找到第 277-278 行：
```typescript
) : thumbnail ? (
  <div dangerouslySetInnerHTML={{ __html: thumbnail }} />
```
改为：
```typescript
) : thumbnail ? (
  <img src={thumbnail} alt={component.name} className="thumbnail-image" />
```

- [ ] **Step 3: 添加 CSS 样式**

打开 `editor/src/app/components/editor/ComponentLibrary.css`，找到 `.component-thumbnail img` 规则（约第 259 行），在其后添加：
```css
.component-thumbnail img.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

---

## Task 2: 组件库管理排序修复 - 修改 manager 方法签名和实现

**Files:**
- Modify: `editor/src/app/services/ComponentLibraryManager.ts`
- Modify: `editor/src/app/stores/componentLibraryStore.ts`

**问题确认：** 
- `moveComponentToCategory` 当前签名只有 4 个参数，缺少 `targetComponentId` 和 `position`
- Store 调用时也没有传这两个参数

- [ ] **Step 1: 修改 ComponentLibraryManager 中 moveComponentToCategory 方法签名和实现**

打开 `editor/src/app/services/ComponentLibraryManager.ts`，找到 `moveComponentToCategory` 方法（第 396-427 行）。

**新的方法签名：**
```typescript
async moveComponentToCategory(
  sourceLibraryId: string,
  componentId: string,
  targetLibraryId: string,
  targetCategoryId: string | null,
  targetComponentId: string | null,
  position: 'before' | 'after'
): Promise<void>
```

**新的实现逻辑（第 396-427 行替换为）：**
```typescript
async moveComponentToCategory(
  sourceLibraryId: string,
  componentId: string,
  targetLibraryId: string,
  targetCategoryId: string | null,
  targetComponentId: string | null,
  position: 'before' | 'after'
): Promise<void> {
  const sourceLibrary = this.libraries.get(sourceLibraryId);
  const targetLibrary = this.libraries.get(targetLibraryId);
  if (!sourceLibrary || !targetLibrary) return;

  const compIndex = sourceLibrary.components.findIndex(c => c.id === componentId);
  if (compIndex === -1) return;

  const sourceComponents = [...sourceLibrary.components];
  const [movedComponent] = sourceComponents.splice(compIndex, 1);
  const updatedMovedComponent = { ...movedComponent, categoryId: targetCategoryId || undefined };

  let targetComponents: Component[];
  if (targetComponentId) {
    const insertIndex = targetLibrary.components.findIndex(c => c.id === targetComponentId);
    if (insertIndex >= 0) {
      const finalIndex = position === 'before' ? insertIndex : insertIndex + 1;
      targetComponents = [
        ...targetLibrary.components.slice(0, finalIndex),
        updatedMovedComponent,
        ...targetLibrary.components.slice(finalIndex)
      ];
    } else {
      targetComponents = [...targetLibrary.components, updatedMovedComponent];
    }
  } else {
    targetComponents = [...targetLibrary.components, updatedMovedComponent];
  }

  const now = new Date().toISOString();
  const updatedSource: ComponentLibrary = {
    ...sourceLibrary,
    components: sourceComponents,
    metadata: { ...sourceLibrary.metadata, updatedAt: now },
  };
  const updatedTarget: ComponentLibrary = {
    ...targetLibrary,
    components: targetComponents,
    metadata: { ...targetLibrary.metadata, updatedAt: now },
  };

  this.libraries.set(sourceLibraryId, updatedSource);
  this.libraries.set(targetLibraryId, updatedTarget);

  if (!sourceLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedSource);
  if (!targetLibraryId.startsWith('preset-')) await indexedDBService.saveLibrary(updatedTarget);
}
```

- [ ] **Step 2: 修改 componentLibraryStore 中 moveComponent 调用**

打开 `editor/src/app/stores/componentLibraryStore.ts`，找到第 219-226 行的 `moveComponent` 实现：

```typescript
moveComponent: async (sourceLibraryId, componentId, targetLibraryId, targetCategoryId, targetComponentId, position) => {
  if (sourceLibraryId === targetLibraryId) {
    await componentLibraryManager.moveComponentInCategory(sourceLibraryId, componentId, targetCategoryId, targetComponentId, position);
  } else {
    await componentLibraryManager.moveComponentToCategory(sourceLibraryId, componentId, targetLibraryId, targetCategoryId);
  }
  set({ libraries: componentLibraryManager.getLibraries() });
},
```

将 else 分支改为：
```typescript
} else {
  await componentLibraryManager.moveComponentToCategory(sourceLibraryId, componentId, targetLibraryId, targetCategoryId, targetComponentId, position);
}
```

---

## Task 3: 跨库拖拽时自动展开目标库

**Files:**
- Modify: `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx`

- [ ] **Step 1: 修改 handleDragOver 方法**

打开 `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx`，找到 `handleDragOver` 函数（约第 172-177 行）。

在 `setDragOverTarget` 调用之前添加跨库自动展开逻辑：
```typescript
const handleDragOver = (e: React.DragEvent, targetId: string, targetType: TreeNodeType) => {
  e.preventDefault();
  if (!draggedNode) return;
  if (draggedNode.id === targetId && draggedNode.type === targetType) return;

  // 跨库拖拽时，自动展开目标库
  if (draggedNode.libraryId !== selectedLibraryId && targetType === 'library') {
    if (!expandedNodes.has(targetId)) {
      toggleNode(targetId);
    }
  }

  setDragOverTarget({ id: targetId, type: targetType, position: computeDropPosition(e, targetType) });
};
```

注意：`selectedLibraryId` 需要从 store 获取。如果当前作用域没有，需要调用 `useComponentLibraryStore.getState().selectedLibraryId` 或通过参数传入。

---

## Task 4: 组件拖入画布坐标偏移

**Files:**
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

- [ ] **Step 1: 修改 handleDropComponentToCanvas 方法**

打开 `editor/src/app/components/editor-modes/SolarWireMode.tsx`，找到 `handleDropComponentToCanvas` 方法（约第 340-344 行）。

将整个方法替换为：
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

确保 `component` 参数类型是 `Component`（从 `../../../shared/types/component` 导入）。

---

## Task 5: 创建 ComponentVisualEditor.tsx

**Files:**
- Create: `editor/src/app/components/editor/ComponentVisualEditor.tsx`
- Create: `editor/src/app/components/editor/ComponentVisualEditor.css`
- Modify: `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx`

### Task 5.1: 创建 ComponentVisualEditor.tsx 基础结构

- [ ] **Step 1: 创建文件并定义导入和接口**

创建 `editor/src/app/components/editor/ComponentVisualEditor.tsx`：

```typescript
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { parse } from '../../../lib/parser';
import { render } from '../../../lib/renderer';
import type { Document, Element as SolarWireElement } from '../../../lib/parser/types';
import './ComponentVisualEditor.css';

interface ComponentVisualEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  x2?: number;
  y2?: number;
  type: string;
}

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  originalBounds: ElementBounds;
}

interface ResizeHandleState {
  elementId: string;
  handle: 'nw' | 'ne' | 'sw' | 'se';
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW: number;
  elementH: number;
}
```

### Task 5.2: 实现状态管理和辅助函数

- [ ] **Step 1: 添加状态变量和解析逻辑**

在 `ComponentVisualEditor` 函数组件内添加：

```typescript
const canvasRef = useRef<HTMLDivElement>(null);
const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
const [scale, setScale] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const [dragState, setDragState] = useState<DragState | null>(null);
const [resizeState, setResizeState] = useState<ResizeHandleState | null>(null);

const panStartRef = useRef({ x: 0, y: 0 });

const ast: Document | null = useMemo(() => {
  try {
    if (!code.trim()) return null;
    return parse(code);
  } catch { return null; }
}, [code]);

const svgContent = useMemo(() => {
  if (!ast) return '';
  const result = render(ast, undefined, true);
  return result.svg;
}, [ast]);
```

### Task 5.3: 实现元素边界计算和交互

- [ ] **Step 1: 添加元素边界计算逻辑**

需要实现 `getElementBounds` 函数来计算每个元素的边界。

### Task 5.4: 实现事件处理

- [ ] **Step 1: 添加鼠标事件处理**

实现 `handleMouseDown`, `handleMouseMove`, `handleMouseUp` 等事件处理。

### Task 5.5: 实现 SVG 渲染层和交互层

- [ ] **Step 1: 渲染选中框和手柄**

使用 SVG 渲染选中高亮和 resize 手柄。

### Task 5.6: 实现属性编辑面板

- [ ] **Step 1: 添加属性编辑 UI**

当选中元素时显示属性编辑面板，支持修改位置、尺寸等属性。

### Task 5.7: 创建 CSS 样式文件

- [ ] **Step 1: 创建 ComponentVisualEditor.css**

```css
.component-visual-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.visual-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.visual-editor-canvas {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.visual-editor-content {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.visual-editor-selection {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-dasharray: 5 3;
}

.visual-editor-handle {
  fill: white;
  stroke: var(--primary-color);
  stroke-width: 2;
  cursor: pointer;
}

.property-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 200px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  padding: 12px;
}
```

### Task 5.8: 集成到 ComponentLibraryManagerModal

- [ ] **Step 1: 替换 VisualCanvasEditor 组件**

打开 `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx`：

1. 在文件顶部添加导入：
```typescript
import ComponentVisualEditor from './ComponentVisualEditor';
```

2. 找到 `ComponentEditPanel` 组件中 `activeTab === 'visual'` 的渲染部分（约第 612-616 行），将：
```typescript
{activeTab === 'visual' && (
  <div className="component-visual-edit">
    <VisualCanvasEditor code={component.code || ''} onCodeChange={(newCode) => onUpdate({ code: newCode })} />
  </div>
)}
```
替换为：
```typescript
{activeTab === 'visual' && (
  <div className="component-visual-edit">
    <ComponentVisualEditor code={component.code || ''} onCodeChange={(newCode) => onUpdate({ code: newCode })} />
  </div>
)}
```

---

## Task 6: 测试验证

**Files:**
- 无文件修改，纯测试

- [ ] **Step 1: 测试缩略图渲染**

在组件面板中：
1. 打开组件库
2. 验证每个组件的缩略图显示为 SVG 图形
3. 验证不是 Base64 文字

- [ ] **Step 2: 测试组件排序（同库内）**

在组件管理器中：
1. 展开一个组件库的分类
2. 拖动组件 A 到组件 B 上方
3. 放手后验证组件顺序改变

- [ ] **Step 3: 测试跨库组件移动**

在组件管理器中：
1. 展开两个不同的组件库
2. 将组件从库 A 拖动到库 B 的分类中
3. 验证组件正确移动到目标分类

- [ ] **Step 4: 测试分类排序（同库内）**

1. 拖动分类 A 到分类 B 上方/下方
2. 验证分类顺序改变

- [ ] **Step 5: 测试跨库分类移动**

1. 将分类从库 A 拖动到库 B
2. 验证分类及其所有组件正确移动

- [ ] **Step 6: 测试组件拖入画布坐标偏移**

在 SolarWire 可视化编辑模式下：
1. 打开组件面板
2. 拖动一个包含多个元素的组件（如包含多个矩形和文字的组件）到画布
3. 验证元素保持相对位置，不堆叠在同一坐标

- [ ] **Step 7: 测试组件管理器可视化编辑器**

在组件管理器中：
1. 选择一个组件
2. 切换到可视化编辑（🎨）标签
3. 验证可以：
   - 选中元素（点击）
   - 拖动元素位置
   - 调整元素大小（resize 手柄）
   - 修改属性（如果实现了属性面板）
4. 修改后验证代码正确更新

---

## 实现顺序建议

1. Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
2. Phase 1-3 (Task 1-4) 可以快速完成
3. Task 5 (ComponentVisualEditor) 是最大任务，建议分配较多时间
4. Task 6 测试验证穿插在每个任务后

---

## 注意事项

1. **不修改 SolarWirePreview.tsx** — 现有可视化编辑体验必须保持不变
2. **工具方法复用** — 如坐标转换、颜色处理等直接 import 使用，不复制代码
3. **向后兼容** — 所有修改不能破坏现有功能
4. **Task 2 关键** — 必须同时修改 manager 方法签名和 store 调用，否则 position 参数无法传递
