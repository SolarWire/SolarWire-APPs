# SolarWirePreview 巨型组件拆分设计

## 背景

`SolarWirePreview.tsx` 当前 2727 行，承担了画布视口控制、元素边界计算、元素交互（拖动/调整/框选/对齐）、拖放处理、键盘快捷键、渲染覆盖层等全部职责。违反 SRP，难以理解和修改。

## 目标

将主组件降至 ~300 行，每个提取模块职责单一、可独立理解和测试。

## 拆分方案

### Hooks（5 个）

| Hook | 职责 | 原始行范围 | 预计行数 |
|---|---|---|---|
| `useCanvasViewport` | 缩放、平移、fitToScreen、wheel、resize observer | L494-586 | ~100 |
| `useElementBounds` | 元素边界计算、查找、框选测试 | L592-1044 | ~460 |
| `useElementInteraction` | mousedown/move/up（拖动、调整、框选、对齐、平移） | L1046-1768 | ~730 |
| `useDropHandler` | dragover/enter/leave/drop + 图片/文本/JSON 拖放 | L1770-2051 | ~290 |
| `useKeyboardShortcuts` | Alt/Ctrl/Cmd 快捷键 | L2551-2621 | ~75 |

### 渲染组件（3 个）

| 组件 | 职责 | 原始行范围 | 预计行数 |
|---|---|---|---|
| `SelectionOverlay` | 选中手柄、框选矩形、hover 高亮 | L2053-2097 + L2328-2429 | ~150 |
| `DragPreviewOverlay` | 拖放预览元素 | L2150-2326 | ~180 |
| `SnapOverlay` | 对齐辅助线 + 距离线 | L2431-2532 | ~110 |

### 依赖关系

```
useCanvasViewport (独立)
useElementBounds (独立)
useElementInteraction → useElementBounds
useDropHandler (独立)
useKeyboardShortcuts (独立)
```

### 文件结构

```
editor/src/app/components/editor/
├── SolarWirePreview.tsx          (主组件, ~300 行)
├── hooks/
│   ├── useCanvasViewport.ts
│   ├── useElementBounds.ts
│   ├── useElementInteraction.ts
│   ├── useDropHandler.ts
│   └── useKeyboardShortcuts.ts
└── overlays/
    ├── SelectionOverlay.tsx
    ├── DragPreviewOverlay.tsx
    └── SnapOverlay.tsx
```

## 接口设计

### useCanvasViewport

```typescript
interface UseCanvasViewportOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  isInitialized: boolean;
  setIsInitialized: (v: boolean) => void;
}

interface UseCanvasViewportReturn {
  fitToScreen: () => void;
}
```

内部消费 `previewStore` 的 scale/position/setScale/setPosition。

### useElementBounds

```typescript
interface UseElementBoundsOptions {
  ast: any;
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  scale: number;
}

interface UseElementBoundsReturn {
  getElementBounds: (elementId: string) => ElementBounds | null;
  getElementBoundsFromData: (data: any) => ElementBounds | null;
  getAllElementsBoundsMap: () => Map<string, ElementBounds>;
  getCanvasBounds: () => ElementBounds;
  getGroupBounds: (elementIds: string[]) => ElementBounds;
  findElementAtPosition: (clientX: number, clientY: number) => string | null;
  testBoxSelection: (startX: number, startY: number, endX: number, endY: number) => string[];
  isMouseNearLine: (clientX: number, clientY: number, threshold?: number) => boolean;
}
```

### useElementInteraction

```typescript
interface UseElementInteractionOptions {
  ast: any;
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  selectionTool: SelectionTool;
  isPanMode: boolean;
  isSpacePressed: boolean;
  snapToGuides: boolean;
  effectiveContent: string;
  effectiveSetContent: (c: string) => void;
  rafUpdater: any;
  elementBounds: UseElementBoundsReturn;
  allowImageElements: boolean;
}

interface UseElementInteractionReturn {
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  lastMousePosition: { x: number; y: number };
  setLastMousePosition: (pos: { x: number; y: number }) => void;
}
```

### useDropHandler

```typescript
interface UseDropHandlerOptions {
  getSvgCoords: (cx: number, cy: number) => { x: number; y: number };
  effectiveContent: string;
  effectiveSetContent: (c: string) => void;
  allowImageElements: boolean;
  fileDir: string | undefined;
  imageCacheRef: React.MutableRefObject<Record<string, string>>;
  setImageCacheTick: (t: number) => void;
}

interface UseDropHandlerReturn {
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOverCombined: (e: React.DragEvent) => void;
}
```

### useKeyboardShortcuts

```typescript
interface UseKeyboardShortcutsOptions {
  selectedElements: string[];
  content: string;
  setContent: (c: string) => void;
  externalContent?: string;
  onExternalContentChange?: (c: string) => void;
  allowImageElements: boolean;
}
```

## 实施顺序

1. useCanvasViewport（独立，最简单）
2. useElementBounds（独立，最大纯逻辑块）
3. useKeyboardShortcuts（独立，最简单）
4. useDropHandler（独立）
5. useElementInteraction（依赖 useElementBounds，最复杂）
6. SelectionOverlay
7. DragPreviewOverlay
8. SnapOverlay
9. 重构主组件
10. 验证构建
