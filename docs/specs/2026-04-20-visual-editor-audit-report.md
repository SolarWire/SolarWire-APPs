# SolarWire 可视化编辑功能 - 全面问题检查报告与修复方案

> **检查日期**: 2026-04-20
> **检查范围**: editor 目录下所有可视化编辑相关组件、状态管理、渲染器、工具函数
> **检查深度**: 逐行代码审查 + 架构分析

---

## 一、问题总览

| 优先级 | 问题数 | 核心影响 |
|--------|--------|----------|
| 🔴 严重 | 3 | 性能瓶颈、架构缺陷、数据不一致 |
| 🟠 功能 | 4 | 核心交互能力缺失 |
| 🟡 质量 | 4 | 可维护性、类型安全、错误处理 |
| 🟢 体验 | 7 | 用户体验和扩展性优化 |

---

## 二、严重问题 (🔴)

### P0-1: 双画布实现导致代码重复与维护灾难

**严重程度**: 🔴 严重
**涉及文件**:
- `editor/src/app/components/editor/SolarWireCanvas.tsx` (770 行)
- `editor/src/app/components/editor/SolarWirePreview.tsx` (1585 行)
- `editor/src/app/components/editor-modes/SolarWireMode.tsx`

**问题详情**:
1. `SolarWireCanvas.tsx` 和 `SolarWirePreview.tsx` 实现了高度重叠的功能：
   - 各自独立实现缩放逻辑 (handleWheel)
   - 各自独立实现拖拽逻辑 (handleMouseDown/MouseMove/MouseUp)
   - 各自独立实现框选逻辑 (testBoxSelection)
   - 各自独立实现坐标转换 (getWorldCoords / getSvgCoords)
   - 各自独立处理元素选择 (getElementAtPosition / findElementAtPosition)
2. 两处代码的正则表达式和解析逻辑存在细微差异，可能导致行为不一致
3. 维护时需要同步修改两处，修复一个 bug 容易遗漏另一处

**影响**:
- 代码总量约 2355 行，其中约 60% 是重复逻辑
- Bug 修复成本翻倍，容易引入回归
- 新增功能需要在两处同时实现

**修复方案**:
```
1. 合并为单一画布组件 UnifiedCanvas.tsx
2. 提取公共交互逻辑到 hooks:
   - useCanvasInteraction.ts (拖拽、缩放、框选)
   - useElementSelection.ts (元素选择、悬停检测)
   - useElementDragging.ts (元素拖动、resize)
3. 统一使用 useCoordinateSystem hook 处理坐标转换
4. 保留一个入口点，通过 mode prop 切换渲染方式 (Canvas/SVG)
```

**预估工作量**: 中等 (需要仔细重构，但不涉及功能变更)

---

### P0-2: AST 重复解析导致性能瓶颈

**严重程度**: 🔴 严重
**涉及文件**:
- `SolarWireCanvas.tsx:L117-126` - 独立 parse
- `PropertyPanel.tsx:L78-86` - 独立 parse
- `SolarWirePreview.tsx:L240-260` - 独立 parse

**问题详情**:
1. 三个组件各自独立调用 `parse(content)`，每次内容变化触发 3 次完整 AST 解析
2. 大型文档 (100+ 元素) 时，单次 parse 耗时 50-100ms，三次累计 150-300ms
3. 没有 AST 缓存机制，相同内容反复解析
4. 解析结果没有共享，每个组件维护自己的 AST 副本

**影响**:
- 快速编辑时出现明显卡顿 (输入延迟 > 100ms)
- 内存浪费，三个 AST 副本同时存在
- 缩放/切换选中元素时触发不必要的重解析

**修复方案**:
```typescript
// 方案 A: 使用 Zustand 共享 AST (推荐)
// src/app/stores/astStore.ts
import { create } from 'zustand';
import { parse } from '../lib/parser';
import type { Document } from '../lib/parser/types';

interface ASTState {
  ast: Document | null;
  parseError: string | null;
  lastParsedContent: string;
  setAST: (content: string) => void;
  invalidate: () => void;
}

export const useASTStore = create<ASTState>((set, get) => ({
  ast: null,
  parseError: null,
  lastParsedContent: '',
  
  setAST: (content: string) => {
    const { lastParsedContent } = get();
    if (content === lastParsedContent) return; // 内容未变，跳过
    
    try {
      const ast = parse(content);
      set({ ast, parseError: null, lastParsedContent: content });
    } catch (e) {
      set({ ast: null, parseError: e instanceof Error ? e.message : String(e) });
    }
  },
  
  invalidate: () => set({ ast: null, lastParsedContent: '' })
}));

// 方案 B: 添加 AST 缓存
// src/shared/cache/ASTCache.ts
const astCache = new Map<string, Document | null>();
function parseWithCache(content: string) {
  const hash = simpleHash(content);
  if (astCache.has(hash)) return astCache.get(hash);
  const result = parse(content);
  astCache.set(hash, result);
  return result;
}
```

**预估工作量**: 小 (改动集中，风险可控)

---

### P0-3: 节流 setContent 导致状态不一致

**严重程度**: 🔴 严重
**涉及文件**:
- `SolarWirePreview.tsx:L214` - `throttle(setContent, 100)`
- `SolarWireMode.tsx:L141` - 直接 `setContent(newContent)`

**问题详情**:
1. `SolarWirePreview` 使用节流版 `setContent` (100ms 间隔)
2. `SolarWireMode` 中的键盘移动直接调用 `setContent`
3. 快速拖拽元素时，节流可能导致：
   - 最终位置与鼠标位置不一致
   - 多次拖拽的中间状态丢失
   - 与键盘移动产生竞争条件
4. 节流期间用户松开鼠标，最后一次更新可能被丢弃

**影响**:
- 元素拖拽后位置不准确
- 快速操作时视觉反馈与实际数据不一致
- 撤销/重做历史可能不完整

**修复方案**:
```typescript
// 1. 移除节流，使用 requestAnimationFrame 代替
// src/app/hooks/useSmoothDrag.ts
const useSmoothDrag = (elementId: string, onUpdate: (dx: number, dy: number) => void) => {
  const rafRef = useRef<number>(0);
  const pendingRef = useRef({ dx: 0, dy: 0 });
  
  const handleDrag = useCallback((dx: number, dy: number) => {
    pendingRef.current.dx += dx;
    pendingRef.current.dy += dy;
    
    if (rafRef.current) return; // 已有待执行的帧
    
    rafRef.current = requestAnimationFrame(() => {
      onUpdate(pendingRef.current.dx, pendingRef.current.dy);
      pendingRef.current = { dx: 0, dy: 0 };
      rafRef.current = 0;
    });
  }, [onUpdate]);
  
  return handleDrag;
};

// 2. 键盘移动也通过统一的事件总线
// 确保所有更新路径一致
```

**预估工作量**: 小

---

## 三、功能性问题 (🟠)

### P1-1: 多选拖拽功能缺失

**严重程度**: 🟠 高
**涉及文件**:
- `SolarWirePreview.tsx:L743-767` - 拖拽逻辑只处理单选
- `SolarWireMode.tsx:L119-141` - 键盘移动支持多选

**问题详情**:
1. 键盘方向键移动支持多选 (`selectedElements.forEach`)
2. 但画布拖拽只处理 `dragElementState` (单元素)
3. 多选后只能通过键盘微调，不能鼠标拖拽
4. 用户预期多选后应该可以一起拖动

**修复方案**:
```typescript
// 修改 handleMouseDown 中的拖拽逻辑
if (elementId && e.shiftKey) {
  // 多选拖拽
  const allSelectedBounds = selectedElements.map(id => ({
    id,
    bounds: getElementBounds(id)
  }));
  
  setDragElementState({
    type: 'multi',
    elements: allSelectedBounds,
    startX: e.clientX,
    startY: e.clientY
  });
}

// 修改 handleMouseMove 处理多选拖动
if (dragElementState?.type === 'multi') {
  selectedElements.forEach(id => {
    const el = dragElementState.elements.find(e => e.id === id);
    // 统一偏移应用到所有选中元素
  });
}
```

**预估工作量**: 中

---

### P1-2: 框选逻辑不一致

**严重程度**: 🟠 高
**涉及文件**:
- `SolarWireCanvas.tsx:L398-400` - 严格包含框选
- `SolarWirePreview.tsx:L591-641` - 线段使用相交框选

**问题详情**:
1. `SolarWireCanvas` 使用严格包含：元素必须完全在框选区域内
2. `SolarWirePreview` 对线段使用相交检测：起点或终点在框内即选中
3. 用户在不同模式下行为预期不一致
4. 没有"相交框选"选项 (主流工具都支持)

**修复方案**:
```typescript
// 统一框选逻辑，支持两种模式
type BoxSelectMode = 'contain' | 'intersect';

const testBoxSelection = useCallback((
  x1: number, y1: number, x2: number, y2: number,
  mode: BoxSelectMode = 'intersect' // 默认相交
) => {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  
  ast.elements.forEach(element => {
    const bounds = getElementBounds(element);
    if (mode === 'contain') {
      // 元素完全在框内
      const selected = bounds.x >= minX && bounds.x + bounds.w <= maxX &&
                       bounds.y >= minY && bounds.y + bounds.h <= maxY;
    } else {
      // 元素与框相交
      const selected = !(bounds.x + bounds.w < minX || bounds.x > maxX ||
                        bounds.y + bounds.h < minY || bounds.y > maxY);
    }
  });
}, [ast, getElementBounds]);
```

**预估工作量**: 小

---

### P1-3: Resize 逻辑仅支持单元素

**严重程度**: 🟠 高
**涉及文件**:
- `SolarWirePreview.tsx:L810-936`

**问题详情**:
1. resize 逻辑只处理 `resizeHandleState.elementId` (单元素)
2. 多选后无法同时调整多个元素大小
3. 缺少等比例缩放、中心等比缩放等常用功能

**修复方案**:
```typescript
// 多选等比缩放
if (selectedElements.length > 1) {
  const center = calculateSelectionCenter(selectedElements);
  selectedElements.forEach(id => {
    const bounds = getElementBounds(id);
    const scale = calculateScaleFactor(bounds, center, dx, dy);
    resizeElement(id, bounds, scale, center);
  });
}
```

**预估工作量**: 中

---

### P1-4: 画布操作无法撤销

**严重程度**: 🟠 高
**涉及文件**:
- `SolarWireMode.tsx:L188-191` - 只处理 Ctrl+Z
- `editorStore.ts:L155-174` - undo 逻辑

**问题详情**:
1. `Ctrl+Z` 只撤销代码编辑器中的文本变更
2. 画布上的拖拽、resize、新增元素等操作未记录到历史
3. 用户拖拽元素后无法通过 Ctrl+Z 撤销

**修复方案**:
```typescript
// 在 setContent 中统一记录历史
// 所有画布操作最终都调用 setContent，所以应该已经记录
// 问题在于：节流版 setContent 可能丢失中间状态

// 修复：确保每次视觉操作都触发历史快照
const handleElementDragEnd = () => {
  // 拖拽结束时，强制记录一次历史
  const currentContent = getContent();
  recordHistorySnapshot(currentContent);
};
```

**预估工作量**: 小

---

## 四、代码质量问题 (🟡)

### P2-1: 重复的坐标解析逻辑

**严重程度**: 🟡 中
**涉及文件**:
- `SolarWirePreview.tsx:L37-72` - getElementDataFromContent
- `SolarWireMode.tsx:L144-179` - getElementDataFromContent
- `solarwire-utils.ts:L774-800` - getElementCoordsAndBounds

**问题详情**:
三处几乎相同的正则表达式和解析逻辑，维护成本高

**修复方案**:
```typescript
// 提取到单一工具函数
// src/shared/utils/element-coords.ts
export function parseElementCoords(content: string, lineNum: number): ElementCoords | null {
  // 统一实现
}
```

---

### P2-2: 正则表达式边界处理不健壮

**严重程度**: 🟡 中
**涉及文件**:
- `solarwire-utils.ts:L112-393` - updateLineAttribute

**问题详情**:
1. 大量使用正则表达式修改 SolarWire DSL 代码
2. note 处理逻辑极其复杂 (L216-344)，容易在特殊字符场景下出错
3. 没有处理转义字符、嵌套引号等边界情况

**修复方案**:
```typescript
// 使用 AST-based 更新代替正则
function updateElementAttribute(ast: Document, lineNum: number, attr: string, value: any): string {
  const element = findElementByLine(ast, lineNum);
  if (!element) return '';
  
  // 修改 AST 节点
  modifyElementAttribute(element, attr, value);
  
  // 重新序列化回 DSL
  return serializeAST(ast);
}
```

---

### P2-3: 类型定义不完整

**严重程度**: 🟡 中
**涉及文件**:
- `solarWireStore.ts:L9-10` - `any` 类型
- 多处 `as any` 类型断言

**修复方案**:
```typescript
interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementX2?: number;
  elementY2?: number;
  isLine: boolean;
}

interface ResizeState {
  elementId: string;
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w' | 'start' | 'end';
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
  elementW?: number;
  elementH?: number;
  elementX2?: number;
  elementY2?: number;
  isLine?: boolean;
}
```

---

### P2-4: 错误处理不统一

**严重程度**: 🟡 中
**涉及文件**:
- `SolarWireCanvas.tsx:L156-159` - console.error
- `SolarWirePreview.tsx:L255-258` - setError 状态
- `PropertyPanel.tsx:L173-192` - 显示错误但按钮无功能

**修复方案**:
```typescript
// 统一错误处理
interface EditorError {
  type: 'parse' | 'render' | 'runtime';
  message: string;
  line?: number;
  column?: number;
  recoverable: boolean;
}

// 使用全局错误边界 + toast 通知
```

---

## 五、体验优化建议 (🟢)

### P3-1: 元素库缺少搜索/分类
**当前**: 8 个元素平铺展示
**优化**: 搜索过滤、分类标签、常用置顶、拖拽排序

### P3-2: 属性面板缺乏批量编辑
**当前**: 多选只显示数量
**优化**: 批量修改共同属性、差异属性高亮

### P3-3: 缺少对齐辅助线
**当前**: 只有对齐按钮
**优化**: 实时智能对齐辅助线、间距提示、等距分布

### P3-4: 缺少画布网格/吸附
**当前**: 无网格背景
**优化**: 可配置网格、智能吸附、对齐到元素边缘

### P3-5: 颜色选择器功能有限
**当前**: 预设颜色
**优化**: 自定义颜色输入、吸管工具、最近使用、色板管理

### P3-6: 缺少快捷键提示
**当前**: 快捷键无提示
**优化**: 快捷键面板、操作时 tooltip 提示

### P3-7: 性能优化：虚拟化渲染
**当前**: 渲染所有元素
**优化**: 视口外元素延迟渲染、Web Worker 解析、增量更新

---

## 六、修复优先级与执行计划

### 第一阶段：紧急修复 (1-2 周)
| 优先级 | 问题 | 预估工作量 | 风险 |
|--------|------|-----------|------|
| P0-2 | AST 重复解析 | 小 | 低 |
| P0-3 | 节流状态不一致 | 小 | 低 |
| P1-4 | 画布操作撤销 | 小 | 低 |
| P2-3 | 类型定义完善 | 小 | 低 |

### 第二阶段：架构重构 (2-3 周)
| 优先级 | 问题 | 预估工作量 | 风险 |
|--------|------|-----------|------|
| P0-1 | 双画布合并 | 中 | 中 |
| P1-1 | 多选拖拽 | 中 | 低 |
| P1-2 | 框选逻辑统一 | 小 | 低 |
| P2-1 | 坐标解析提取 | 小 | 低 |

### 第三阶段：功能增强 (3-4 周)
| 优先级 | 问题 | 预估工作量 | 风险 |
|--------|------|-----------|------|
| P1-3 | 多选 Resize | 中 | 中 |
| P2-2 | AST-based 更新 | 中 | 中 |
| P2-4 | 错误处理统一 | 小 | 低 |
| P3-1~P3-7 | 体验优化 | 中 | 低 |

---

## 七、风险评估

| 风险项 | 影响 | 缓解措施 |
|--------|------|----------|
| 双画布合并可能引入回归 bug | 高 | 完整的 E2E 测试覆盖 |
| AST-based 更新可能破坏现有语法兼容性 | 中 | 保留正则 fallback，渐进迁移 |
| 多选功能复杂度超出预期 | 中 | 分阶段实现，先单选后多选 |
| 性能优化可能影响现有功能 | 低 | 性能基准测试 + A/B 对比 |

---

## 八、测试计划

### 单元测试
- [ ] AST 解析缓存测试
- [ ] 坐标转换精度测试
- [ ] 元素选择/拖拽/resize 逻辑测试
- [ ] 属性更新函数测试 (替代正则的 AST-based 方案)

### 集成测试
- [ ] 代码编辑器 ↔ 画布同步测试
- [ ] 多选操作全流程测试
- [ ] 撤销/重做历史完整性测试
- [ ] 大型文档 (100+ 元素) 性能测试

### E2E 测试
- [ ] 拖拽元素 → 验证代码同步
- [ ] 修改代码 → 验证画布渲染
- [ ] 框选 → 多选 → 拖拽 → 撤销 全流程
- [ ] 缩放/平移交互测试

---

## 九、附录

### A. 关键文件清单
```
editor/src/
├── app/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── SolarWireCanvas.tsx      ← 待合并
│   │   │   ├── SolarWirePreview.tsx     ← 待合并
│   │   │   ├── PropertyPanel.tsx
│   │   │   └── ElementLibrary.tsx
│   │   └── editor-modes/
│   │       └── SolarWireMode.tsx
│   ├── stores/
│   │   ├── solarWireStore.ts
│   │   ├── editorStore.ts
│   │   └── settingsStore.ts
│   └── hooks/
│       └── useSelection.ts
├── lib/
│   ├── renderer/
│   │   ├── renderer.ts
│   │   └── elements/
│   └── parser/
│       └── index.ts
└── shared/
    ├── utils/
    │   ├── solarwire-utils.ts
    │   └── coordinate-utils.ts
    └── hooks/
        └── useCoordinateSystem.ts
```

### B. 相关设计文档
- `plan/specs/2026-04-16-coordinate-system-refactoring.md` - 坐标系统重构 (已完成)
- `plan/specs/2026-04-16-realtime-rendering-architecture.md` - 实时渲染架构 (计划中)
- `plan/specs/2026-04-15-solarwire-editor-solutions.md` - 编辑器解决方案

---

## 十、补充需求分析 (2026-04-20)

### 需求 1: Shift+拖拽等比例缩放

**用户期望**:
- 按住 Shift 拖拽 resize 手柄时，保持元素宽高比不变
- 不按 Shift 时为自由缩放

**当前状态**:
- `SolarWirePreview.tsx:L879-914` 的 resize 逻辑只支持自由缩放
- 8 个 resize 手柄 (nw/n/ne/e/se/s/sw/w) 各自独立计算 newW 和 newH
- 没有 aspect ratio 锁定机制

**技术分析**:

| Handle | 当前行为 | Shift 行为 |
|--------|---------|-----------|
| nw | dx 影响 width 和 height，dy 也影响两者 | 以对角线 (se) 为中心等比缩放 |
| n | 只影响 height | 以底边为中心等比缩放高度 |
| ne | dx 影响 width，dy 影响 height | 以对角线 (sw) 为中心等比缩放 |
| e | 只影响 width | 以左边为中心等比缩放宽度 |
| se | dx 影响 width，dy 影响 height | 以对角线 (nw) 为中心等比缩放 |
| s | 只影响 height | 以顶边为中心等比缩放高度 |
| sw | dx 影响 width，dy 影响 height | 以对角线 (ne) 为中心等比缩放 |
| w | 只影响 width | 以右边为中心等比缩放宽度 |

**修复方案**:

```typescript
// SolarWirePreview.tsx resize 逻辑修改
const handleMouseMove = (e: React.MouseEvent) => {
  // ... 前置逻辑不变 ...

  if (resizeHandleState) {
    const isShiftPressed = e.shiftKey;
    const dx = currentCoords.x - startCoords.x;
    const dy = currentCoords.y - startCoords.y;
    
    let newX = resizeHandleState.elementX;
    let newY = resizeHandleState.elementY;
    let newW = resizeHandleState.elementW ?? 0;
    let newH = resizeHandleState.elementH ?? 0;
    
    const startW = resizeHandleState.elementW ?? 0;
    const startH = resizeHandleState.elementH ?? 0;
    const aspectRatio = startW / startH;

    if (isShiftPressed) {
      // 等比例缩放逻辑
      switch (resizeHandleState.handle) {
        case 'nw':
        case 'ne':
        case 'se':
        case 'sw':
          // 对角线手柄：以对角点为中心等比
          {
            const scaleFactor = resizeHandleState.handle === 'se' || resizeHandleState.handle === 'ne'
              ? (startW + dx) / startW  // 右侧手柄用 dx 比例
              : (startW - dx) / startW; // 左侧手柄用 -dx 比例
            const sign = resizeHandleState.handle === 'se' || resizeHandleState.handle === 'ne' ? 1 : -1;
            
            newW = Math.max(10, Math.round(startW * scaleFactor));
            newH = Math.max(10, Math.round(newW / aspectRatio));
            newX = resizeHandleState.elementX + (resizeHandleState.handle.includes('w') ? startW - newW : 0);
            newY = resizeHandleState.elementY + (resizeHandleState.handle.includes('n') ? startH - newH : 0);
          }
          break;
        case 'n':
        case 's':
          // 垂直手柄：只调整高度，宽度跟随保持比例
          {
            const rawH = resizeHandleState.handle === 's' ? startH + dy : startH - dy;
            newH = Math.max(10, Math.round(rawH));
            newW = Math.max(10, Math.round(newH * aspectRatio));
            if (resizeHandleState.handle === 'n') {
              newY = resizeHandleState.elementY + (startH - newH);
            }
          }
          break;
        case 'e':
        case 'w':
          // 水平手柄：只调整宽度，高度跟随保持比例
          {
            const rawW = resizeHandleState.handle === 'e' ? startW + dx : startW - dx;
            newW = Math.max(10, Math.round(rawW));
            newH = Math.max(10, Math.round(newW / aspectRatio));
            if (resizeHandleState.handle === 'w') {
              newX = resizeHandleState.elementX + (startW - newW);
            }
          }
          break;
      }
    } else {
      // 原有自由缩放逻辑
      switch (resizeHandleState.handle) {
        case 'nw':
          newX = Math.max(0, Math.round(resizeHandleState.elementX + dx));
          newY = Math.max(0, Math.round(resizeHandleState.elementY + dy));
          newW = Math.round(startW - dx);
          newH = Math.round(startH - dy);
          break;
        // ... 其他手柄
      }
    }
    
    // 确保尺寸有效
    if (newW >= 10 && newH >= 10) {
      // ... 更新内容逻辑
    }
  }
};
```

**预估工作量**: 小 (约 50 行代码修改)

---

### 需求 1.5: Shift + 线段端点约束水平/垂直

**用户期望**:
- 按住 Shift 拖拽线段端点时，约束为垂直或水平线段
- 判断依据：比较 |dx| 和 |dy|，较大的方向为约束方向
- 例如：|dx| > |dy| 时，水平约束 (dy = 0)；否则垂直约束 (dx = 0)
- 松开 Shift 则为自由角度

**当前状态**:
- `SolarWirePreview.tsx:L819-869` 的线段端点拖拽逻辑
- 当前 dx/dy 直接相加，无约束逻辑

**技术分析**:

| 操作 | 当前行为 | Shift 行为 |
|------|---------|-----------|
| 拖拽端点 (start/end) | dx/dy 自由偏移 | 约束为纯垂直或纯水平 |

**约束判断逻辑**:
```typescript
// 判断约束方向
const absDx = Math.abs(dx);
const absDy = Math.abs(dy);

let finalDx = dx;
let finalDy = dy;

if (absDx > absDy) {
  // 水平约束：dy = 0
  finalDy = 0;
} else {
  // 垂直约束：dx = 0
  finalDx = 0;
}
```

**修复方案**:

```typescript
// SolarWirePreview.tsx 线段端点拖拽修改
if (resizeHandleState.handle === 'start' || resizeHandleState.handle === 'end') {
  const isShiftPressed = e.shiftKey;

  let rawDx = dx;
  let rawDy = dy;

  if (isShiftPressed) {
    // Shift 按下：约束为垂直或水平
    const absDx = Math.abs(rawDx);
    const absDy = Math.abs(rawDy);

    if (absDx > absDy) {
      // 水平约束
      rawDy = 0;
    } else if (absDy > absDx) {
      // 垂直约束
      rawDx = 0;
    } else {
      // 相等时默认水平
      rawDy = 0;
    }
  }

  // 应用约束后的偏移
  if (resizeHandleState.handle === 'start') {
    x1 = Math.max(0, Math.round(resizeHandleState.elementX + rawDx));
    y1 = Math.max(0, Math.round(resizeHandleState.elementY + rawDy));
  } else {
    x2 = Math.max(0, Math.round((resizeHandleState.elementX2 || x1 + 100) + rawDx));
    y2 = Math.max(0, Math.round((resizeHandleState.elementY2 || y1) + rawDy));
  }

  // ... 后续更新线段逻辑不变
}
```

**预估工作量**: 小 (~20 行代码修改)

---

### 需求 2: 图片添加支持 (本地图片 + 粘贴)

**用户期望**:
1. 从本地文件系统添加图片到 SolarWire 画布
2. 直接粘贴剪贴板中的图片

**当前状态分析**:

| 功能 | 支持情况 | 位置 |
|------|---------|------|
| 解析 `<image.png>` 语法 | ✅ 已支持 | `grammar.pegjs:L112-116` |
| ImageElement 类型定义 | ✅ 已支持 | `types.ts:L70-73` |
| 图片渲染 (SVG `<image>`) | ✅ 已支持 | `otherElements.ts:L232` |
| 从本地添加图片 | ❌ 不支持 | - |
| 粘贴图片 | ❌ 不支持 | - |
| 图片文件存储 | ❌ 不支持 | - |
| 图片路径解析 (相对/绝对) | ⚠️ 部分支持 | URL 直接作为 href |

**核心问题**:

1. **图片存储问题**
   - SolarWire DSL 中图片用 `<filename.png>` 语法，只存储文件名
   - 但编辑器不知道图片文件的实际位置
   - 需要建立文件引用机制

2. **图片预览渲染问题**
   - `otherElements.ts:L232` 使用 `<image href={element.url}/>` 
   - 如果 url 是相对路径，需要知道相对于哪个目录
   - 如果 url 是损坏的，SVG 会显示空白

3. **拖放图片到画布**
   - `ElementLibrary.tsx` 有 image 元素类型
   - 但拖放时无法指定具体图片文件
   - 需要打开文件选择对话框

4. **粘贴图片问题**
   - 需要监听 paste 事件
   - 从剪贴板读取 image/png 或 image/jpeg 数据
   - 需要将图片数据转换为可存储的格式 (Base64 或临时文件)

**推荐解决方案**:

#### 方案 A: 相对路径 + 资源目录 (唯一方案)

```
项目结构:
project/
├── diagram.sw
├── assets/
│   └── images/
│       ├── logo.png
│       └── screenshot.jpg
```

```typescript
// 1. SolarWire DSL 语法扩展
// 支持完整路径语法
<assets/images/logo.png> @(100, 100) w=200

// 2. 图片资源管理器
// src/app/services/ImageAssetManager.ts
interface ImageAssetManager {
  // 添加图片到项目
  addImage(file: File): Promise<string>; // 返回相对路径
  
  // 获取图片 URL (用于渲染)
  getImageUrl(relativePath: string): string;
  
  // 检查图片是否存在
  exists(relativePath: string): boolean;
  
  // 删除图片
  delete(relativePath: string): Promise<void>;
  
  // 获取所有图片
  getAllImages(): string[];
}

// 3. 拖放图片处理
const handleImageDrop = async (e: DragEvent) => {
  const files = Array.from(e.dataTransfer.files);
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  
  for (const file of imageFiles) {
    const relativePath = await imageManager.addImage(file);
    // 添加到 SolarWire 内容
    addElementToContent(`<${relativePath}> @(0, 0) w=200`);
  }
};

// 4. 粘贴图片处理
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      if (blob) {
        // 转换为 Base64 或保存到临时文件
        const base64 = await blobToBase64(blob);
        const tempPath = `paste_${Date.now()}.png`;
        await saveTempImage(tempPath, base64);
        
        // 添加到内容
        addElementToContent(`<${tempPath}> @(0, 0) w=200`);
      }
    }
  }
};
```

**推荐实施步骤**:

| 阶段 | 功能 | 工作量 |
|------|------|--------|
| 1 | 建立图片资源管理器，管理项目内图片 | 中 |
| 2 | 拖放图片到 ElementLibrary 或画布 | 小 |
| 3 | 粘贴图片支持 | 中 |
| 4 | 图片属性面板 (调整尺寸、裁剪) | 中 |
| 5 | 相对路径解析和渲染 | 中 |

**关键文件变更**:

```
新增:
- src/app/services/ImageAssetManager.ts
- src/app/hooks/useImageDrop.ts
- src/app/components/editor/ImagePickerDialog.tsx

修改:
- src/app/components/editor/ElementLibrary.tsx (添加图片选择功能)
- src/app/components/editor/PropertyPanel.tsx (图片属性编辑)
- src/lib/renderer/elements/otherElements.ts (图片渲染)
- src/lib/parser/grammar.pegjs (支持更多图片路径格式)
```

**预估工作量**: 中等 (需要跨多个模块开发)

---

### 需求 1+2 优先级建议

| 需求 | 优先级 | 原因 |
|------|--------|------|
| Shift 等比缩放 | 🟠 高 | 交互体验直接影响用户效率，实现简单 |
| 线段端点水平/垂直约束 | 🟠 高 | 绘制精确直线的必备功能 |
| 本地图片添加 | 🟠 高 | 核心功能，用户刚需 |
| 图片粘贴 | 🟠 高 | 提升工作流效率 |

---

## 十一、体验优化建议 (2026-04-20)

基于对 SolarWire 编辑器的分析，以下是推荐的体验优化功能（已根据用户反馈筛选）：

### 1. **实时对齐辅助线** ⭐⭐⭐ (强烈推荐)
**当前状态**: 只有对齐按钮，无实时辅助
**优化**: 拖拽元素时显示智能对齐线
- 元素边缘对齐时显示红色参考线
- 元素中心对齐时显示蓝色参考线
- 等距分布提示

### 2. **画布网格 + 智能吸附** ⭐⭐⭐
**当前状态**: 无网格背景
**优化**:
- 可开关的网格背景
- 元素移动时自动吸附到网格/其他元素边缘
- 按住 Alt 临时禁用吸附

### 3. **图层管理面板** ⭐⭐
**当前状态**: 无
**优化**:
- 显示所有元素列表
- 拖拽排序图层顺序
- 锁定/隐藏图层
- 双击图层重命名

### 4. **元素复制粘贴** ⭐⭐⭐
**当前状态**: 无
**优化**:
- Ctrl+C/V 复制粘贴元素
- 粘贴时偏移 10px 避免重叠
- 支持跨文档复制

### 5. **快捷键提示面板** ⭐
**当前状态**: 快捷键无提示
**优化**:
- 工具栏 "?" 按钮打开快捷键列表
- Hover 时显示当前操作的快捷键

### 6. **快速搜索/选择** ⭐⭐
**当前状态**: 无
**优化**:
- Ctrl+F 打开元素搜索
- 输入名称快速定位元素
- Enter 选中下一个匹配

### 7. **撤销历史可视化** ⭐⭐
**当前状态**: 只支持 Ctrl+Z
**优化**:
- 侧边栏显示操作历史
- 点击可跳转到任意历史状态
- 显示操作类型图标

---

### 体验优化优先级

| 优先级 | 功能 | 原因 |
|--------|------|------|
| 🟠 高 | 元素复制粘贴 | 基础功能，大幅提升效率 |
| 🟠 高 | 对齐辅助线 | 专业设计工具标配 |
| 🟠 高 | 画布网格吸附 | 精确排版必备 |
| 🟡 中 | 图层管理 | 多元素项目必需 |
| 🟡 中 | 撤销历史可视化 | 操作可追溯 |
| 🟢 低 | 快捷键提示 | 新手友好 |
| 🟢 低 | 快速搜索 | 大文档场景 |

---

*报告补充时间: 2026-04-20*
*基于用户反馈更新: 图片方案确认 + 体验优化筛选*

*报告生成时间: 2026-04-20*
*下次审查时间: 第一阶段修复完成后*
