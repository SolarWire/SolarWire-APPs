# 复制粘贴功能重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构可视化编辑器的复制粘贴功能，统一剪贴板状态管理，正确处理图片元素复制

**Architecture:** 新建独立的 clipboard 服务模块（store + service），统一管理复制粘贴逻辑，替代当前分散在 SolarWireMode 和 SolarWirePreview 中的实现

**Tech Stack:** Zustand (状态管理), TypeScript, React

---

## 文件结构

```
editor/src/app/services/clipboard/
├── types.ts              # 类型定义
├── clipboardStore.ts      # Zustand store
└── copy-paste-service.ts # 核心复制粘贴服务

修改文件:
├── editor/src/app/components/editor/SolarWirePreview.tsx   # 移除旧逻辑，使用新 service
└── editor/src/app/components/editor-modes/SolarWireMode.tsx # 右键菜单使用新 service
```

---

## Task 1: 创建类型定义

**Files:**
- Create: `editor/src/app/services/clipboard/types.ts`

- [ ] **Step 1: 创建 types.ts 文件**

```typescript
export type ElementType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'text'
  | 'line'
  | 'image'
  | 'placeholder'
  | 'table'
  | 'unknown';

export interface ClipboardElementData {
  id: string;
  lineNumber: number;
  content: string;
  type: ElementType;
  originalX: number;
  originalY: number;
  imagePath?: string;
  imageBase64?: string;
}

export interface RelativePosition {
  dx: number;
  dy: number;
}

export interface CopyOptions {
  elementIds: string[];
  content: string;
  fileDir?: string;
}

export interface PasteOptions {
  content: string;
  targetPosition: { x: number; y: number };
  selectedElementId?: string;
  setContent: (content: string) => void;
  setSelectedElements: (ids: string[]) => void;
  fileDir?: string;
}

export interface CopyResult {
  success: boolean;
  elementCount: number;
  hasImages: boolean;
  error?: string;
}

export interface PasteResult {
  success: boolean;
  newContent: string;
  newElementIds: string[];
  error?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/types.ts
git commit -m "feat: add clipboard service types"
```

---

## Task 2: 创建 ClipboardStore

**Files:**
- Create: `editor/src/app/services/clipboard/clipboardStore.ts`

- [ ] **Step 1: 创建 clipboardStore.ts**

```typescript
import { create } from 'zustand';
import type { ClipboardElementData } from './types';

interface ClipboardState {
  hasContent: boolean;
  elements: ClipboardElementData[];
  referencePosition: { x: number; y: number } | null;
  timestamp: number;
  rawContent: string;

  setClipboardContent: (
    elements: ClipboardElementData[],
    referencePos: { x: number; y: number },
    rawContent: string
  ) => void;
  clearClipboard: () => void;
  getRelativePosition: (elementId: string) => { dx: number; dy: number } | null;
  hasImages: () => boolean;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  hasContent: false,
  elements: [],
  referencePosition: null,
  timestamp: 0,
  rawContent: '',

  setClipboardContent: (
    elements: ClipboardElementData[],
    referencePos: { x: number; y: number },
    rawContent: string
  ) => {
    set({
      hasContent: true,
      elements,
      referencePosition: referencePos,
      timestamp: Date.now(),
      rawContent
    });
  },

  clearClipboard: () => {
    set({
      hasContent: false,
      elements: [],
      referencePosition: null,
      timestamp: 0,
      rawContent: ''
    });
  },

  getRelativePosition: (elementId: string) => {
    const { elements, referencePosition } = get();
    if (!referencePosition) return null;

    const element = elements.find(el => el.id === elementId);
    if (!element) return null;

    return {
      dx: element.originalX - referencePosition.x,
      dy: element.originalY - referencePosition.y
    };
  },

  hasImages: () => {
    const { elements } = get();
    return elements.some(el => el.type === 'image');
  }
}));
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/clipboardStore.ts
git commit -m "feat: add clipboard zustand store"
```

---

## Task 3: 创建 Copy-Paste Service 辅助函数

**Files:**
- Create: `editor/src/app/services/clipboard/copy-paste-service.ts`

- [ ] **Step 1: 添加 extractImageBase64 辅助函数**

```typescript
export async function extractImageBase64(
  imagePath: string,
  fileDir: string
): Promise<string | null> {
  const api = (window as any).api;
  if (!api?.readImageAsBase64) return null;

  try {
    const fullPath = `${fileDir}/${imagePath}`;
    const base64 = await api.readImageAsBase64(fullPath);
    return base64;
  } catch (e) {
    console.warn('Failed to extract image for clipboard:', e);
    return null;
  }
}
```

- [ ] **Step 2: 添加 adjustCoordinates 辅助函数**

```typescript
export function adjustCoordinates(
  content: string,
  offsetX: number,
  offsetY: number
): string {
  let result = content;

  result = result.replace(
    /@\((\d+),\s*(\d+)\)/g,
    (_, x, y) => `@(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
  );

  result = result.replace(
    /->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,
    (_, x, y) => `->(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
  );

  return result;
}
```

- [ ] **Step 3: 添加 getElementType 辅助函数**

```typescript
export function getElementType(content: string, lineNumber: number): ElementType {
  const lines = content.split(/\r?\n/);
  if (lineNumber < 1 || lineNumber > lines.length) return 'unknown';

  const line = lines[lineNumber - 1].trim();

  if (line.startsWith('##')) return 'table';
  if (line.startsWith('--')) return 'line';
  if (line.startsWith('<')) return 'image';
  if (line.startsWith('[?"')) return 'placeholder';
  if (line.startsWith('[?"')) return 'placeholder';
  if (line.startsWith '(("')) return 'circle';
  if (line.startsWith('("')) return 'rounded-rectangle';
  if (line.startsWith('[')) return 'rectangle';
  if (line.startsWith('"')) return 'text';

  return 'unknown';
}
```

- [ ] **Step 4: Commit**

```bash
git add editor/src/app/services/clipboard/copy-paste-service.ts
git commit -m "feat: add clipboard service helper functions"
```

---

## Task 4: 实现 copyElements 函数

**Files:**
- Modify: `editor/src/app/services/clipboard/copy-paste-service.ts`

- [ ] **Step 1: 实现 copyElements 函数**

```typescript
export async function copyElements(options: CopyOptions): Promise<CopyResult> {
  const { elementIds, content, fileDir } = options;

  if (elementIds.length === 0) {
    return { success: false, elementCount: 0, hasImages: false, error: 'No elements selected' };
  }

  const lines = content.split(/\r?\n/);
  const processedLineNums = new Set<number>();
  const clipboardElements: ClipboardElementData[] = [];
  const allLinesToCopy: string[] = [];

  let referencePos: { x: number; y: number } | null = null;

  const sortedElementIds = [...elementIds].sort((a, b) => {
    const lineA = parseInt(a);
    const lineB = parseInt(b);
    return lineA - lineB;
  });

  for (const elementId of sortedElementIds) {
    const lineNum = parseInt(elementId);
    if (isNaN(lineNum) || lineNum < 1 || lineNum > lines.length) continue;
    if (processedLineNums.has(lineNum)) continue;

    const relatedLines = getElementRelatedLines(content, lineNum);
    const startLine = relatedLines[0];
    const endLine = relatedLines[relatedLines.length - 1];

    const firstLineInBlock = lines[startLine - 1];
    const coordMatch = firstLineInBlock.match(/@\((\d+),\s*(\d+)\)/);

    if (coordMatch) {
      const x = parseInt(coordMatch[1]);
      const y = parseInt(coordMatch[2]);

      if (!referencePos || (x < referencePos.x) || (x === referencePos.x && y < referencePos.y)) {
        referencePos = { x, y };
      }
    }

    for (let i = startLine; i <= endLine; i++) {
      if (!processedLineNums.has(i)) {
        allLinesToCopy.push(lines[i - 1]);
        processedLineNums.add(i);
      }
    }

    const elementType = getElementType(content, lineNum);
    let imagePath: string | undefined;
    let imageBase64: string | undefined;

    if (elementType === 'image') {
      const imageMatch = lines[startLine - 1].match(/<([^>]+)>/);
      if (imageMatch) {
        imagePath = imageMatch[1];
        if (fileDir && imagePath) {
          imageBase64 = await extractImageBase64(imagePath, fileDir);
        }
      }
    }

    clipboardElements.push({
      id: elementId,
      lineNumber: lineNum,
      content: allLinesToCopy.join('\n'),
      type: elementType,
      originalX: referencePos?.x ?? 0,
      originalY: referencePos?.y ?? 0,
      imagePath,
      imageBase64
    });
  }

  if (clipboardElements.length === 0) {
    return { success: false, elementCount: 0, hasImages: false, error: 'No valid elements found' };
  }

  const copyText = allLinesToCopy.join('\n');

  useClipboardStore.getState().setClipboardContent(
    clipboardElements,
    referencePos || { x: 0, y: 0 },
    copyText
  );

  return {
    success: true,
    elementCount: clipboardElements.length,
    hasImages: clipboardElements.some(el => el.type === 'image')
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/copy-paste-service.ts
git commit -m "feat: implement copyElements function"
```

---

## Task 5: 实现 pasteElements 函数

**Files:**
- Modify: `editor/src/app/services/clipboard/copy-paste-service.ts`

- [ ] **Step 1: 实现 pasteElements 函数**

```typescript
export async function pasteElements(options: PasteOptions): Promise<PasteResult> {
  const { content, targetPosition, selectedElementId, setContent, setSelectedElements, fileDir } = options;
  const store = useClipboardStore.getState();

  let clipboardText: string;
  let relativePositions: Map<string, { dx: number; dy: number }> = new Map();

  if (store.hasContent && store.rawContent) {
    clipboardText = store.rawContent;

    for (const element of store.elements) {
      if (store.referencePosition) {
        relativePositions.set(element.id, {
          dx: element.originalX - store.referencePosition.x,
          dy: element.originalY - store.referencePosition.y
        });
      }
    }
  } else {
    try {
      clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || clipboardText.trim().length === 0) {
        return { success: false, newContent: content, newElementIds: [], error: 'Clipboard is empty' };
      }
    } catch (e) {
      console.error('Failed to read clipboard:', e);
      return { success: false, newContent: content, newElementIds: [], error: 'Failed to read clipboard' };
    }
  }

  let offsetX = 0;
  let offsetY = 0;

  if (store.referencePosition) {
    offsetX = targetPosition.x - store.referencePosition.x;
    offsetY = targetPosition.y - store.referencePosition.y;
  }

  const adjustedContent = adjustCoordinates(clipboardText, offsetX, offsetY);

  const lines = content.split(/\r?\n/);
  const insertLine = lines.length;

  const newLines = [
    ...lines.slice(0, insertLine),
    adjustedContent,
    ...lines.slice(insertLine)
  ];

  const newContent = newLines.join('\n');

  const clipboardLines = adjustedContent.split(/\r?\n/);
  const startLineNum = insertLine + 1;
  const newElementIds: string[] = [];

  for (let i = 0; i < clipboardLines.length; i++) {
    const lineContent = clipboardLines[i].trim();
    if (lineContent.length > 0) {
      newElementIds.push((startLineNum + i).toString());
    }
  }

  setContent(newContent);

  if (newElementIds.length > 0) {
    setSelectedElements(newElementIds);
  }

  return {
    success: true,
    newContent,
    newElementIds
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/copy-paste-service.ts
git commit -m "feat: implement pasteElements function"
```

---

## Task 6: 实现系统剪贴板写入

**Files:**
- Modify: `editor/src/app/services/clipboard/copy-paste-service.ts`

- [ ] **Step 1: 实现 copyToSystemClipboard 函数**

```typescript
export async function copyToSystemClipboard(): Promise<boolean> {
  const store = useClipboardStore.getState();

  if (!store.hasContent || !store.rawContent) {
    return false;
  }

  try {
    const items: ClipboardItem[] = [];

    const textBlob = new Blob([store.rawContent], { type: 'text/plain' });
    items.push(new ClipboardItem({
      'text/plain': textBlob
    }));

    const imageElements = store.elements.filter(el => el.type === 'image' && el.imageBase64);

    for (const element of imageElements) {
      if (element.imageBase64) {
        try {
          const response = await fetch(element.imageBase64);
          const blob = await response.blob();

          const mimeType = element.imagePath?.endsWith('.png') ? 'image/png' : 'image/jpeg';
          items.push(new ClipboardItem({
            [mimeType]: blob
          }));
        } catch (e) {
          console.warn('Failed to add image to clipboard:', e);
        }
      }
    }

    await navigator.clipboard.write(items);
    return true;
  } catch (e) {
    console.warn('Failed to write to system clipboard:', e);
    try {
      await navigator.clipboard.writeText(store.rawContent);
      return true;
    } catch (textError) {
      console.error('Failed to write text to clipboard:', textError);
      return false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/copy-paste-service.ts
git commit -m "feat: implement system clipboard write with image support"
```

---

## Task 7: 创建剪贴板服务入口文件

**Files:**
- Create: `editor/src/app/services/clipboard/index.ts`

- [ ] **Step 1: 创建 index.ts 导出文件**

```typescript
export * from './types';
export * from './clipboardStore';
export * from './copy-paste-service';
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/services/clipboard/index.ts
git commit -m "feat: add clipboard service exports"
```

---

## Task 8: 集成到 SolarWirePreview

**Files:**
- Modify: `editor/src/app/components/editor/SolarWirePreview.tsx`

**关键变更:**
1. 移除现有的复制粘贴 keydown 监听逻辑（约 3005-3091 行）
2. 导入并使用新的 copy-paste-service
3. 保留其他键盘事件处理（方向键移动、Delete 删除等）

- [ ] **Step 1: 添加导入语句**

```typescript
import { copyElements, pasteElements, useClipboardStore } from '../../services/clipboard';
```

- [ ] **Step 2: 修改 keydown 监听中的复制逻辑**

找到约 3005-3039 行的复制逻辑，替换为：

```typescript
if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElements.length > 0) {
  e.preventDefault();
  const result = await copyElements({
    elementIds: selectedElements,
    content: effectiveContent,
    fileDir: fileDir || undefined
  });
  if (result.success) {
    await copyToSystemClipboard();
  }
}
```

- [ ] **Step 3: 修改 keydown 监听中的粘贴逻辑**

找到约 3041-3091 行的粘贴逻辑，替换为：

```typescript
if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
  e.preventDefault();
  await pasteElements({
    content: effectiveContent,
    targetPosition: lastMousePosition,
    setContent: effectiveSetContent,
    setSelectedElements: selectElements,
    fileDir: fileDir || undefined
  });
}
```

- [ ] **Step 4: 添加 lastMousePosition state**

在组件开头添加：

```typescript
const [lastMousePosition, setLastMousePosition] = useState({ x: 200, y: 200 });
```

在 handleMouseMove 中更新（如果还没有这个逻辑）：

```typescript
const handleMouseMove = useCallback((e: React.MouseEvent) => {
  // ... 现有逻辑

  // 更新 lastMousePosition
  const svgCoords = getSvgCoords(e.clientX, e.clientY);
  setLastMousePosition({
    x: svgCoords.x + viewBoxOffsetX,
    y: svgCoords.y + viewBoxOffsetY
  });
}, [getSvgCoords, viewBoxOffsetX, viewBoxOffsetY]);
```

- [ ] **Step 5: Commit**

```bash
git add editor/src/app/components/editor/SolarWirePreview.tsx
git commit -m "feat: integrate new clipboard service into SolarWirePreview"
```

---

## Task 9: 集成到 SolarWireMode 右键菜单

**Files:**
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

**关键变更:**
1. 导入 clipboard service
2. 修改右键菜单的复制/粘贴/剪切处理函数

- [ ] **Step 1: 添加导入语句**

```typescript
import { copyElements, pasteElements, useClipboardStore } from '../../services/clipboard';
```

- [ ] **Step 2: 修改右键复制逻辑**

找到约 706-746 行的右键复制代码，替换为：

```typescript
<button
  className="context-menu-item"
  onClick={() => {
    if (selectedElements.length > 0) {
      copyElements({
        elementIds: selectedElements,
        content: content
      }).then(async (result) => {
        if (result.success) {
          await copyToSystemClipboard();
        }
      });
    }
    closeContextMenu();
  }}
>
  复制 (Copy)
</button>
```

- [ ] **Step 3: 修改右键粘贴逻辑**

找到约 747-791 行的右键粘贴代码，替换为：

```typescript
<button
  className="context-menu-item"
  onClick={async () => {
    const targetPos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 200, y: 200 };

    await pasteElements({
      content: content,
      targetPosition: targetPos,
      setContent: setContent,
      setSelectedElements: setSelectedElements
    });
    closeContextMenu();
  }}
>
  粘贴 (Paste)
</button>
```

- [ ] **Step 4: 修改右键剪切逻辑**

找到约 792-825 行的右键剪切代码，保持现有删除逻辑，但先复制到剪贴板：

```typescript
<button
  className="context-menu-item"
  onClick={async () => {
    if (selectedElements.length > 0) {
      const copyResult = await copyElements({
        elementIds: selectedElements,
        content: content
      });

      if (copyResult.success) {
        await copyToSystemClipboard();
      }

      handleDeleteSelected();
    }
    closeContextMenu();
  }}
>
  剪切 (Cut)
</button>
```

- [ ] **Step 5: Commit**

```bash
git add editor/src/app/components/editor-modes/SolarWireMode.tsx
git commit -m "feat: integrate clipboard service into context menu"
```

---

## Task 10: 清理 solarWireStore 中的 clipboardOriginalPos

**Files:**
- Modify: `editor/src/app/stores/solarWireStore.ts`

- [ ] **Step 1: 移除不再需要的 clipboardOriginalPos 状态**

从 interface SolarWireState 和实际 state 中移除：
- `clipboardOriginalPos`
- `setClipboardOriginalPos`

- [ ] **Step 2: Commit**

```bash
git add editor/src/app/stores/solarWireStore.ts
git commit -m "refactor: remove unused clipboardOriginalPos from solarWireStore"
```

---

## Task 11: 测试验证

**测试场景:**

- [ ] **Test 1: 复制单个矩形元素**
  1. 在 SolarWire 编辑器中创建矩形
  2. 选中元素
  3. Ctrl+C 复制
  4. Ctrl+V 粘贴
  5. 验证元素被复制且位置正确偏移

- [ ] **Test 2: 复制多个元素（保持相对位置）**
  1. 创建两个矩形，位置分别为 (100,100) 和 (150,100)
  2. 同时选中两个元素
  3. Ctrl+C 复制
  4. Ctrl+V 粘贴到 (300,200)
  5. 验证新元素位置为 (300,200) 和 (350,200)

- [ ] **Test 3: 复制包含图片的元素**
  1. 添加一张图片
  2. 选中图片
  3. Ctrl+C 复制
  4. 尝试在外部应用（如 Word）中粘贴
  5. 验证图片数据被正确写入系统剪贴板

- [ ] **Test 4: 右键菜单复制粘贴**
  1. 右键点击选中元素
  2. 选择"复制"
  3. 右键点击空白处
  4. 选择"粘贴"
  5. 验证功能正常

- [ ] **Test 5: 复制跨行元素（带 note）**
  1. 创建带有多行 note 的元素
  2. 复制该元素
  3. 粘贴
  4. 验证整个元素块（包括 note）被正确复制

---

## 实施检查清单

- [ ] Task 1: types.ts 创建完成
- [ ] Task 2: clipboardStore.ts 创建完成
- [ ] Task 3: copy-paste-service.ts 辅助函数完成
- [ ] Task 4: copyElements 函数实现
- [ ] Task 5: pasteElements 函数实现
- [ ] Task 6: copyToSystemClipboard 函数实现
- [ ] Task 7: 导出文件创建
- [ ] Task 8: SolarWirePreview 集成
- [ ] Task 9: SolarWireMode 集成
- [ ] Task 10: solarWireStore 清理
- [ ] Task 11: 所有测试通过

---

## 实施完成

当所有任务都标记为完成时，执行最终验证：

```bash
cd editor
npm run build
npm run lint
npm run typecheck
```

确保没有构建错误和类型错误。
