# 复制粘贴功能重构设计文档

**日期**: 2026-04-23
**状态**: Draft
**问题**: 可视化编辑器的复制粘贴功能失效（特别是图片）

---

## 1. 问题概述

### 1.1 现有问题

1. **复制功能失效**
   - 右键菜单复制和键盘 Ctrl+C 复制代码分散在两个组件
   - `clipboardOriginalPos` 状态没有正确更新
   - 图片元素坐标提取逻辑缺陷

2. **粘贴功能失效**
   - 图片格式 `<path> @(x,y)` 与普通坐标格式冲突
   - `clipboardOriginalPos` 为 null 时行为不一致
   - 粘贴位置计算逻辑混乱

3. **图片复制问题**
   - 图片需要支持复制到系统剪贴板（作为图片数据）
   - 当前只能复制 SolarWire 代码文本

### 1.2 重构目标

- 统一复制粘贴逻辑到一个服务模块
- 正确处理图片元素的复制粘贴
- 支持复制多个元素时保持相对位置
- 提供更好的用户反馈

---

## 2. 架构设计

### 2.1 新的目录结构

```
editor/src/app/services/
  └── clipboard/
      ├── clipboardStore.ts      # Zustand store
      ├── copy-paste-service.ts # 核心逻辑
      └── types.ts              # 类型定义
```

### 2.2 ClipboardStore 设计

```typescript
interface ClipboardElementData {
  id: string;
  lineNumber: number;
  content: string;           # SolarWire 原始代码
  type: ElementType;
  originalX: number;
  originalY: number;
  # 图片专用
  imagePath?: string;
  imageBase64?: string;
}

interface ClipboardState {
  # 是否已复制内容
  hasContent: boolean;
  # 复制的元素数据列表
  elements: ClipboardElementData[];
  # 第一个（最左上角）元素的坐标 - 作为偏移基准
  referencePosition: { x: number; y: number } | null;
  # 时间戳 - 用于判断剪贴板是否过期
  timestamp: number;

  # Actions
  setClipboardContent: (elements: ClipboardElementData[], referencePos: {x: number, y: number}) => void;
  clearClipboard: () => void;
  getRelativePosition: (elementId: string) => {dx: number, dy: number} | null;
}
```

### 2.3 Copy-Paste Service 设计

```typescript
interface CopyOptions {
  elementIds: string[];
  content: string;
}

interface PasteOptions {
  content: string;
  targetPosition: { x: number; y: number };  # 鼠标在 SVG 中的位置
  selectedElementId?: string;  # 当前选中的元素（用于计算偏移）
  setContent: (content: string) => void;
  setSelectedElements: (ids: string[]) => void;
}

interface CopyResult {
  success: boolean;
  elementCount: number;
  hasImages: boolean;
  error?: string;
}

# 核心函数
export function copyElements(options: CopyOptions): CopyResult;
export function pasteElements(options: PasteOptions): PasteResult;
export async function copyToSystemClipboard(state: ClipboardState): Promise<boolean>;
```

---

## 3. 复制功能详细设计

### 3.1 复制流程

```
用户触发复制
    ↓
收集选中元素的完整代码块
    ↓
解析每个元素的：
  - SolarWire 代码
  - 元素类型
  - 坐标 (x, y)
  - 如果是图片：提取路径和 Base64
    ↓
计算 referencePosition（所有元素中最左上角的坐标）
    ↓
计算每个元素的相对位置 (dx, dy)
    ↓
存储到 clipboardStore
    ↓
尝试写入系统剪贴板
  - SolarWire 纯文本
  - 如果有图片，同时写入图片数据
```

### 3.2 相对位置计算

```typescript
function calculateRelativePositions(
  elements: ClipboardElementData[],
  referencePos: {x: number, y: number}
): Map<string, {dx: number, dy: number}> {
  const positions = new Map();

  for (const el of elements) {
    positions.set(el.id, {
      dx: el.originalX - referencePos.x,
      dy: el.originalY - referencePos.y
    });
  }

  return positions;
}
```

### 3.3 图片 Base64 提取

```typescript
async function extractImageBase64(imagePath: string, fileDir: string): Promise<string | null> {
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

---

## 4. 粘贴功能详细设计

### 4.1 粘贴流程

```
用户触发粘贴 (Ctrl+V)
    ↓
检查 clipboardStore 是否有内容
    ↓
如果没有，尝试从系统剪贴板读取文本
    ↓
确定目标位置：
  - 如果有鼠标位置：使用鼠标位置
  - 如果有选中元素：使用选中元素的坐标
  - 否则：文档末尾
    ↓
计算坐标偏移
  - newPosition = targetPosition
  - 对于每个元素：
    - newX = targetPosition.x + relativePosition.dx
    - newY = targetPosition.y + relativePosition.dy
    ↓
调整 SolarWire 代码中的坐标
    ↓
插入到内容中
    ↓
选中刚粘贴的元素
```

### 4.2 坐标调整正则

```typescript
function adjustCoordinates(
  content: string,
  offsetX: number,
  offsetY: number
): string {
  let result = content;

  # 调整起点坐标 @(x,y)
  result = result.replace(
    /@\((\d+),\s*(\d+)\)/g,
    (_, x, y) => `@(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
  );

  # 调整终点坐标 ->(x,y)
  result = result.replace(
    /->\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,
    (_, x, y) => `->(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
  );

  return result;
}
```

### 4.3 图片路径处理

```typescript
function adjustImageCoordinates(
  content: string,
  offsetX: number,
  offsetY: number
): string {
  # 图片格式: <path/to/image.png> @(x,y) w=100 h=100
  # 需要确保只调整 @(x,y) 部分，不影响路径中的 @

  return content.replace(
    /(<[^>]+>)\s*@\((\d+),\s*(\d+)\)/g,
    (match, path, x, y) => `${path} @(${parseInt(x) + offsetX}, ${parseInt(y) + offsetY})`
  );
}
```

---

## 5. 图片复制到系统剪贴板

### 5.1 需求

用户复制包含图片的元素时，希望图片可以粘贴到其他应用（如 Word、PPT）。

### 5.2 实现方案

使用 Clipboard API 的 `write()` 方法写入多种格式：

```typescript
async function copyToSystemClipboard(state: ClipboardState): Promise<boolean> {
  try {
    const items: ClipboardItem[] = [];

    # 1. 写入 SolarWire 纯文本
    const textBlob = new Blob([state.rawContent], { type: 'text/plain' });
    items.push(new ClipboardItem({
      'text/plain': textBlob
    }));

    # 2. 如果有图片，写入图片数据
    if (state.hasImages) {
      for (const [path, base64] of state.imageData) {
        const response = await fetch(base64);
        const blob = await response.blob();
        items.push(new ClipboardItem({
          [blob.type]: blob
        }));
      }
    }

    await navigator.clipboard.write(items);
    return true;
  } catch (e) {
    console.error('Failed to write to system clipboard:', e);
    return false;
  }
}
```

### 5.3 注意事项

- 兼容性：需要 HTTPS 或 localhost
- 降级处理：如果 `write()` 失败，只写入纯文本

---

## 6. 组件集成

### 6.1 SolarWirePreview.tsx 改动

移除现有的复制粘贴键盘事件处理，改用 service：

```typescript
# 删除现有的 keydown 监听中的复制粘贴逻辑
# 保留其他键盘事件处理

# 改为使用 service
import { copyElements, pasteElements } from '../services/clipboard/copy-paste-service';

# 在组件 mount 时设置全局快捷键
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      copyElements({ elementIds: selectedElements, content });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      pasteElements({
        content,
        targetPosition: getCurrentMousePosition(),
        setContent,
        setSelectedElements
      });
    }
  };
  # ...
}, []);
```

### 6.2 SolarWireMode.tsx 改动

右键菜单改为调用 service：

```typescript
# 右键菜单复制
onClick={() => {
  copyElements({
    elementIds: selectedElements,
    content
  });
  closeContextMenu();
}}

# 右键菜单粘贴
onClick={() => {
  pasteElements({
    content,
    targetPosition: getContextMenuPosition(),
    setContent,
    setSelectedElements
  });
  closeContextMenu();
}}
```

---

## 7. 错误处理

### 7.1 复制失败

- 选中元素为空：提示用户"请先选择要复制的元素"
- 内容解析失败：记录错误，返回失败状态

### 7.2 粘贴失败

- 剪贴板为空：提示用户"剪贴板为空"
- 内容无效：提示用户"无法粘贴该内容"
- 写入失败：静默降级到内部剪贴板

### 7.3 图片处理失败

- 图片加载失败：复制时跳过图片，只复制代码
- Base64 编码失败：复制时跳过图片，只复制代码

---

## 8. 性能考虑

- 图片 Base64 提取只在复制时进行，不预加载
- 大量元素复制时使用虚拟列表优化
- 粘贴时使用 RAF 批量更新

---

## 9. 测试场景

### 9.1 复制测试

1. 复制单个矩形元素
2. 复制多个元素（保持相对位置）
3. 复制包含图片的元素
4. 复制跨行元素（带 note）

### 9.2 粘贴测试

1. 粘贴到空白画布
2. 粘贴到有选中元素的位置
3. 粘贴多个元素
4. 粘贴图片元素

### 9.3 系统剪贴板测试

1. 从 SolarWire 复制图片，粘贴到 Word
2. 从 Word 复制文本，粘贴到 SolarWire

---

## 10. 后续扩展

- [ ] 支持复制到内部剪贴板历史
- [ ] 支持剪切功能
- [ ] 支持复制元素为组件模板
