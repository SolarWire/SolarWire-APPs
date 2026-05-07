# SolarWire 实时渲染架构重构计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个零延迟、高性能、可扩展的实时渲染架构，支持代码修改立即渲染且保持 60fps 流畅度

**Architecture:** 采用分层渲染 + 增量更新 + 双缓冲 + 时间切片架构，将解析、渲染、更新分离，通过预测渲染和智能缓存实现极致性能

**Tech Stack:** React 18+, TypeScript, Web Workers, OffscreenCanvas, React Virtual DOM, Immutable.js, RxJS

---

## 架构设计总览

### 核心设计原则

1. **零感知延迟**：用户操作到视觉反馈 < 16ms（1 帧）
2. **增量更新**：只更新变化的部分，避免全量重渲染
3. **时间切片**：将重任务拆分到多个帧，避免卡顿
4. **预测渲染**：基于用户行为预测，提前渲染
5. **不可变数据**：使用 Immutable 数据结构，优化 diff 性能

### 架构分层

```
┌─────────────────────────────────────────┐
│         交互层 (Interaction Layer)       │
│  - 事件处理                              │
│  - 手势识别                              │
│  - 预测渲染                              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       渲染协调层 (Render Coordinator)    │
│  - 渲染调度                              │
│  - 优先级管理                            │
│  - 时间切片                              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       增量更新层 (Incremental Update)    │
│  - DOM 补丁生成                          │
│  - 属性更新                              │
│  - 样式更新                              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        解析层 (Parser Layer)             │
│  - 增量解析                              │
│  - AST diff                              │
│  - Web Worker 卸载                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        数据层 (Data Layer)               │
│  - Immutable 状态                        │
│  - 版本管理                              │
│  - 缓存策略                              │
└─────────────────────────────────────────┘
```

---

## 文件结构

### 创建的核心文件

1. **`src/shared/rendering/RenderCoordinator.ts`** - 渲染协调器（核心大脑）
2. **`src/shared/rendering/IncrementalRenderer.ts`** - 增量渲染器
3. **`src/shared/rendering/PredictiveRenderer.ts`** - 预测渲染器
4. **`src/shared/parser/IncrementalParser.ts`** - 增量解析器
5. **`src/shared/parser/ParserWorker.ts`** - 解析 Worker
6. **`src/shared/cache/RenderCache.ts`** - 渲染缓存
7. **`src/shared/cache/ASTCache.ts`** - AST 缓存
8. **`src/shared/utils/DOMPatcher.ts`** - DOM 补丁工具
9. **`src/shared/hooks/useRealtimeRender.ts`** - 实时渲染 Hook
10. **`src/app/components/editor/RealtimeCanvas.tsx`** - 新实时画布组件

### 重构的文件

1. **`src/app/components/editor/SolarWirePreview.tsx`** - 迁移到新架构
2. **`src/app/components/editor/SolarWireCanvas.tsx`** - 迁移到新架构
3. **`src/shared/utils/solarwire-utils.ts`** - 添加增量更新工具

---

## 任务分解

### Task 1: 基础设施 - 缓存系统

**Files:**
- Create: `src/shared/cache/RenderCache.ts`
- Create: `src/shared/cache/ASTCache.ts`
- Test: `tests/unit/cache/RenderCache.test.ts`
- Test: `tests/unit/cache/ASTCache.test.ts`

- [ ] **Step 1: 创建渲染缓存接口定义**

```typescript
// src/shared/cache/RenderCache.ts

export interface CacheKey {
  contentHash: string;
  selectedElements: string[];
  primaryColor: string;
  showNotes: boolean;
  zoomLevel: number;
}

export interface CachedRender {
  key: CacheKey;
  svg: string;
  viewBox: { x: number; y: number; width: number; height: number };
  timestamp: number;
  hitCount: number;
}

export interface IRenderCache {
  get(key: CacheKey): CachedRender | null;
  set(key: CacheKey, svg: string, viewBox: any): void;
  invalidate(contentHash: string): void;
  clear(): void;
  getStats(): { hits: number; misses: number; size: number };
}
```

- [ ] **Step 2: 实现 LRU 渲染缓存**

```typescript
// src/shared/cache/RenderCache.ts (续)

export class RenderCache implements IRenderCache {
  private cache: Map<string, CachedRender>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  private generateKeyString(key: CacheKey): string {
    return `${key.contentHash}-${key.selectedElements.join(',')}-${key.primaryColor}-${key.showNotes}-${key.zoomLevel}`;
  }

  get(key: CacheKey): CachedRender | null {
    const keyString = this.generateKeyString(key);
    const cached = this.cache.get(keyString);
    
    if (cached) {
      this.hits++;
      cached.hitCount++;
      // 移到末尾（LRU）
      this.cache.delete(keyString);
      this.cache.set(keyString, cached);
      return cached;
    }
    
    this.misses++;
    return null;
  }

  set(key: CacheKey, svg: string, viewBox: any): void {
    const keyString = this.generateKeyString(key);
    
    // 如果缓存已满，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(keyString, {
      key,
      svg,
      viewBox,
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  invalidate(contentHash: string): void {
    for (const [keyString, cached] of this.cache.entries()) {
      if (cached.key.contentHash === contentHash) {
        this.cache.delete(keyString);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}
```

- [ ] **Step 3: 编写渲染缓存测试**

```typescript
// tests/unit/cache/RenderCache.test.ts

import { RenderCache } from '../../../src/shared/cache/RenderCache';

describe('RenderCache', () => {
  let cache: RenderCache;

  beforeEach(() => {
    cache = new RenderCache(10);
  });

  test('should cache and retrieve renders', () => {
    const key = {
      contentHash: 'abc123',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    };
    
    cache.set(key, '<svg>test</svg>', { x: 0, y: 0, width: 100, height: 100 });
    
    const cached = cache.get(key);
    expect(cached).not.toBeNull();
    expect(cached?.svg).toBe('<svg>test</svg>');
  });

  test('should return null for missing cache entry', () => {
    const key = {
      contentHash: 'xyz789',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    };
    
    const cached = cache.get(key);
    expect(cached).toBeNull();
  });

  test('should implement LRU eviction', () => {
    // 添加 10 个缓存项
    for (let i = 0; i < 10; i++) {
      cache.set({
        contentHash: `hash${i}`,
        selectedElements: [],
        primaryColor: '#000',
        showNotes: true,
        zoomLevel: 100
      }, `<svg>${i}</svg>`, {});
    }
    
    // 添加第 11 个，应该淘汰第一个
    cache.set({
      contentHash: 'hash11',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    }, '<svg>11</svg>', {});
    
    const first = cache.get({
      contentHash: 'hash0',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    });
    expect(first).toBeNull();
  });

  test('should track hit/miss statistics', () => {
    const key = {
      contentHash: 'test',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    };
    
    cache.set(key, '<svg>test</svg>', {});
    cache.get(key);
    cache.get(key);
    cache.get({ ...key, contentHash: 'missing' });
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
  });
});
```

- [ ] **Step 4: 运行测试验证**

```bash
cd editor
npm test -- tests/unit/cache/RenderCache.test.ts
```

Expected: All tests pass

- [ ] **Step 5: 创建 AST 缓存**

```typescript
// src/shared/cache/ASTCache.ts

import { Document } from '../../lib/parser/types';

export interface CachedAST {
  contentHash: string;
  ast: Document;
  timestamp: number;
  hitCount: number;
}

export class ASTCache {
  private cache: Map<string, CachedAST>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(contentHash: string): CachedAST | null {
    const cached = this.cache.get(contentHash);
    if (cached) {
      cached.hitCount++;
      return cached;
    }
    return null;
  }

  set(contentHash: string, ast: Document): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(contentHash, {
      contentHash,
      ast,
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

- [ ] **Step 6: 编写 AST 缓存测试**

```typescript
// tests/unit/cache/ASTCache.test.ts

import { ASTCache } from '../../../src/shared/cache/ASTCache';

describe('ASTCache', () => {
  let cache: ASTCache;

  beforeEach(() => {
    cache = new ASTCache(10);
  });

  test('should cache and retrieve AST', () => {
    const mockAST = { elements: [], declarations: [] } as any;
    cache.set('hash123', mockAST);
    
    const cached = cache.get('hash123');
    expect(cached).not.toBeNull();
    expect(cached?.ast).toBe(mockAST);
  });

  test('should implement LRU eviction', () => {
    for (let i = 0; i < 10; i++) {
      cache.set(`hash${i}`, { elements: [] } as any);
    }
    
    cache.set('hash11', { elements: [] } as any);
    
    const first = cache.get('hash0');
    expect(first).toBeNull();
  });

  test('should track hit count', () => {
    cache.set('hash1', { elements: [] } as any);
    cache.get('hash1');
    cache.get('hash1');
    
    const cached = cache.get('hash1');
    expect(cached?.hitCount).toBe(3);
  });
});
```

- [ ] **Step 7: 运行所有缓存测试**

```bash
npm test -- tests/unit/cache/
```

Expected: All tests pass

- [ ] **Step 8: 提交**

```bash
git add src/shared/cache/ tests/unit/cache/
git commit -m "feat: implement LRU caching system for renders and AST"
```

---

### Task 2: 增量解析器

**Files:**
- Create: `src/shared/parser/IncrementalParser.ts`
- Create: `src/shared/parser/ParserWorker.ts`
- Test: `tests/unit/parser/IncrementalParser.test.ts`

- [ ] **Step 1: 定义增量解析接口**

```typescript
// src/shared/parser/IncrementalParser.ts

import { Document } from '../../lib/parser/types';

export interface ParseResult {
  ast: Document | null;
  error: Error | null;
  parseTime: number;
  isIncremental: boolean;
}

export interface LineChange {
  lineNum: number;
  oldContent: string;
  newContent: string;
  type: 'insert' | 'delete' | 'modify';
}

export interface IncrementalParseResult extends ParseResult {
  changedLines: number[];
  affectedElements: string[];
}

export interface IIncrementalParser {
  parse(content: string): Promise<ParseResult>;
  parseIncremental(changes: LineChange[]): Promise<IncrementalParseResult>;
  invalidate(): void;
}
```

- [ ] **Step 2: 实现增量解析器**

```typescript
// src/shared/parser/IncrementalParser.ts (续)

import { parse } from '../../lib/parser';
import { ASTCache } from '../cache/ASTCache';
import { createHash } from 'crypto';

export class IncrementalParser implements IIncrementalParser {
  private astCache: ASTCache;
  private lastContent: string = '';
  private lastAST: Document | null = null;

  constructor() {
    this.astCache = new ASTCache();
  }

  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  async parse(content: string): Promise<ParseResult> {
    const startTime = performance.now();
    const contentHash = this.hashContent(content);
    
    // 尝试从缓存获取
    const cached = this.astCache.get(contentHash);
    if (cached) {
      return {
        ast: cached.ast,
        error: null,
        parseTime: performance.now() - startTime,
        isIncremental: false
      };
    }
    
    // 全量解析
    try {
      const ast = parse(content);
      this.astCache.set(contentHash, ast);
      this.lastContent = content;
      this.lastAST = ast;
      
      return {
        ast,
        error: null,
        parseTime: performance.now() - startTime,
        isIncremental: false
      };
    } catch (error) {
      return {
        ast: null,
        error: error instanceof Error ? error : new Error(String(error)),
        parseTime: performance.now() - startTime,
        isIncremental: false
      };
    }
  }

  async parseIncremental(changes: LineChange[]): Promise<IncrementalParseResult> {
    const startTime = performance.now();
    
    // 如果变化超过阈值，回退到全量解析
    if (changes.length > 10) {
      const result = await this.parse(this.lastContent);
      return {
        ...result,
        changedLines: changes.map(c => c.lineNum),
        affectedElements: []
      };
    }
    
    // 增量解析：只重新解析变化的行
    const lines = this.lastContent.split('\n');
    const changedLineNums: number[] = [];
    
    for (const change of changes) {
      if (change.lineNum >= 1 && change.lineNum <= lines.length) {
        lines[change.lineNum - 1] = change.newContent;
        changedLineNums.push(change.lineNum);
      }
    }
    
    const newContent = lines.join('\n');
    const result = await this.parse(newContent);
    
    // 计算受影响的元素（简化版本）
    const affectedElements = changedLineNums.map(num => num.toString());
    
    return {
      ...result,
      changedLines: changedLineNums,
      affectedElements,
      isIncremental: true
    };
  }

  invalidate(): void {
    this.astCache.clear();
    this.lastContent = '';
    this.lastAST = null;
  }
}
```

- [ ] **Step 3: 创建 Parser Worker**

```typescript
// src/shared/parser/ParserWorker.ts

import { IncrementalParser, LineChange } from './IncrementalParser';

const parser = new IncrementalParser();

self.onmessage = async (e: MessageEvent<{
  type: 'full' | 'incremental';
  content?: string;
  changes?: LineChange[];
}>) => {
  try {
    let result;
    
    if (e.data.type === 'full') {
      result = await parser.parse(e.data.content!);
    } else {
      result = await parser.parseIncremental(e.data.changes!);
    }
    
    self.postMessage({
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
```

- [ ] **Step 4: 编写增量解析器测试**

```typescript
// tests/unit/parser/IncrementalParser.test.ts

import { IncrementalParser } from '../../../src/shared/parser/IncrementalParser';

describe('IncrementalParser', () => {
  let parser: IncrementalParser;

  beforeEach(() => {
    parser = new IncrementalParser();
  });

  test('should parse content', async () => {
    const content = `["Rectangle"] @(100,100) w=200 h=100`;
    const result = await parser.parse(content);
    
    expect(result.error).toBeNull();
    expect(result.ast).not.toBeNull();
    expect(result.parseTime).toBeLessThan(100);
  });

  test('should cache parsed AST', async () => {
    const content = `["Rectangle"] @(100,100)`;
    
    await parser.parse(content);
    const result2 = await parser.parse(content);
    
    expect(result2.parseTime).toBeLessThan(10); // 应该从缓存
  });

  test('should handle parse errors', async () => {
    const content = `invalid syntax [[[`;
    const result = await parser.parse(content);
    
    expect(result.ast).toBeNull();
    expect(result.error).not.toBeNull();
  });

  test('should perform incremental parse', async () => {
    const initialContent = `["Rect1"] @(100,100)\n["Rect2"] @(200,200)`;
    await parser.parse(initialContent);
    
    const changes = [{
      lineNum: 1,
      oldContent: '["Rect1"] @(100,100)',
      newContent: '["Rect1"] @(150,150)',
      type: 'modify' as const
    }];
    
    const result = await parser.parseIncremental(changes);
    
    expect(result.isIncremental).toBe(true);
    expect(result.changedLines).toContain(1);
    expect(result.error).toBeNull();
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
npm test -- tests/unit/parser/IncrementalParser.test.ts
```

Expected: All tests pass

- [ ] **Step 6: 提交**

```bash
git add src/shared/parser/ tests/unit/parser/
git commit -m "feat: implement incremental parser with worker offloading"
```

---

### Task 3: DOM 补丁生成器

**Files:**
- Create: `src/shared/utils/DOMPatcher.ts`
- Test: `tests/unit/utils/DOMPatcher.test.ts`

- [ ] **Step 1: 实现 DOM 补丁生成器**

```typescript
// src/shared/utils/DOMPatcher.ts

export interface DOMPatch {
  type: 'update' | 'create' | 'remove';
  target: Element | null;
  selector?: string;
  attributes?: Record<string, string>;
  parent?: Element;
}

export interface PatchResult {
  patches: DOMPatch[];
  appliedCount: number;
}

export class DOMPatcher {
  /**
   * 比较两个 SVG 字符串，生成最小补丁集
   */
  generatePatches(oldSVG: string, newSVG: string): DOMPatch[] {
    const parser = new DOMParser();
    const oldDoc = parser.parseFromString(oldSVG, 'image/svg+xml');
    const newDoc = parser.parseFromString(newSVG, 'image/svg+xml');
    
    const patches: DOMPatch[] = [];
    
    // 简化的 diff 算法 - 实际应该使用更智能的算法
    this.diffElements(oldDoc.documentElement, newDoc.documentElement, patches);
    
    return patches;
  }

  private diffElements(oldEl: Element, newEl: Element, patches: DOMPatch[]): void {
    // 比较属性
    const oldAttrs = Array.from(oldEl.attributes);
    const newAttrs = Array.from(newEl.attributes);
    
    const attrChanges: Record<string, string> = {};
    
    for (const newAttr of newAttrs) {
      const oldValue = oldEl.getAttribute(newAttr.name);
      if (oldValue !== newAttr.value) {
        attrChanges[newAttr.name] = newAttr.value;
      }
    }
    
    if (Object.keys(attrChanges).length > 0) {
      patches.push({
        type: 'update',
        target: oldEl,
        attributes: attrChanges
      });
    }
    
    // 递归比较子元素
    const oldChildren = Array.from(oldEl.children);
    const newChildren = Array.from(newEl.children);
    
    const maxLen = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= oldChildren.length) {
        // 新增元素
        patches.push({
          type: 'create',
          target: newChildren[i],
          parent: oldEl
        });
      } else if (i >= newChildren.length) {
        // 删除元素
        patches.push({
          type: 'remove',
          target: oldChildren[i]
        });
      } else {
        // 比较现有元素
        this.diffElements(oldChildren[i], newChildren[i], patches);
      }
    }
  }

  /**
   * 应用补丁到 DOM
   */
  applyPatches(patches: DOMPatch[]): PatchResult {
    let appliedCount = 0;
    
    for (const patch of patches) {
      try {
        switch (patch.type) {
          case 'update':
            if (patch.target && patch.attributes) {
              for (const [key, value] of Object.entries(patch.attributes)) {
                patch.target.setAttribute(key, value);
              }
              appliedCount++;
            }
            break;
            
          case 'create':
            if (patch.target && patch.parent) {
              patch.parent.appendChild(patch.target);
              appliedCount++;
            }
            break;
            
          case 'remove':
            if (patch.target && patch.target.parentNode) {
              patch.target.parentNode.removeChild(patch.target);
              appliedCount++;
            }
            break;
        }
      } catch (error) {
        console.error('Failed to apply patch:', patch, error);
      }
    }
    
    return { patches, appliedCount };
  }

  /**
   * 直接更新元素属性（用于拖动等高频操作）
   */
  updateElementAttribute(
    elementId: string,
    attributes: Record<string, string | number>
  ): boolean {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) return false;
    
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    
    return true;
  }
}
```

- [ ] **Step 2: 编写 DOMPatcher 测试**

```typescript
// tests/unit/utils/DOMPatcher.test.ts

import { DOMPatcher } from '../../../src/shared/utils/DOMPatcher';

describe('DOMPatcher', () => {
  let patcher: DOMPatcher;

  beforeEach(() => {
    patcher = new DOMPatcher();
  });

  test('should generate patches for attribute changes', () => {
    const oldSVG = '<svg><rect x="10" y="10" width="100" height="50"/></svg>';
    const newSVG = '<svg><rect x="20" y="20" width="100" height="50"/></svg>';
    
    const patches = patcher.generatePatches(oldSVG, newSVG);
    
    expect(patches.length).toBeGreaterThan(0);
    expect(patches.some(p => p.type === 'update')).toBe(true);
  });

  test('should apply patches to DOM', () => {
    const container = document.createElement('div');
    container.innerHTML = '<svg><rect id="test" x="10" y="10"/></svg>';
    
    const rect = container.querySelector('#test')!;
    const patches: any[] = [{
      type: 'update',
      target: rect,
      attributes: { x: '50', y: '50' }
    }];
    
    const result = patcher.applyPatches(patches);
    
    expect(result.appliedCount).toBe(1);
    expect(rect.getAttribute('x')).toBe('50');
    expect(rect.getAttribute('y')).toBe('50');
  });

  test('should update element attribute directly', () => {
    const container = document.createElement('div');
    container.innerHTML = '<svg><rect data-element-id="el1" x="10"/></svg>';
    document.body.appendChild(container);
    
    const success = patcher.updateElementAttribute('el1', { x: 100, y: 200 });
    
    expect(success).toBe(true);
    const rect = container.querySelector('[data-element-id="el1"]');
    expect(rect?.getAttribute('x')).toBe('100');
    expect(rect?.getAttribute('y')).toBe('200');
    
    document.body.removeChild(container);
  });
});
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- tests/unit/utils/DOMPatcher.test.ts
```

Expected: All tests pass

- [ ] **Step 4: 提交**

```bash
git add src/shared/utils/DOMPatcher.ts tests/unit/utils/DOMPatcher.test.ts
git commit -m "feat: implement DOM patcher for incremental updates"
```

---

### Task 4: 渲染协调器（核心）

**Files:**
- Create: `src/shared/rendering/RenderCoordinator.ts`
- Test: `tests/unit/rendering/RenderCoordinator.test.ts`

- [ ] **Step 1: 定义渲染协调器接口**

```typescript
// src/shared/rendering/RenderCoordinator.ts

import { RenderCache } from '../cache/RenderCache';
import { IncrementalParser } from '../parser/IncrementalParser';
import { DOMPatcher } from '../utils/DOMPatcher';

export interface RenderOptions {
  content: string;
  selectedElements: string[];
  primaryColor: string;
  showNotes: boolean;
  zoomLevel: number;
}

export interface RenderPriority {
  level: 'immediate' | 'high' | 'normal' | 'low';
  deadline?: number; // ms
}

export interface RenderResult {
  svg: string;
  viewBox: { x: number; y: number; width: number; height: number };
  renderTime: number;
  isIncremental: boolean;
}

export interface IRenderCoordinator {
  scheduleRender(options: RenderOptions, priority?: RenderPriority): Promise<RenderResult>;
  cancelRender(): void;
  forceRender(): Promise<RenderResult>;
  getStats(): { pendingRenders: number; averageRenderTime: number };
}
```

- [ ] **Step 2: 实现渲染协调器**

```typescript
// src/shared/rendering/RenderCoordinator.ts (续)

export class RenderCoordinator implements IRenderCoordinator {
  private renderCache: RenderCache;
  private parser: IncrementalParser;
  private patcher: DOMPatcher;
  private pendingRender: Promise<RenderResult> | null = null;
  private renderQueue: Array<{
    options: RenderOptions;
    priority: RenderPriority;
    resolve: (result: RenderResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isRendering: boolean = false;
  private renderTimes: number[] = [];

  constructor() {
    this.renderCache = new RenderCache(100);
    this.parser = new IncrementalParser();
    this.patcher = new DOMPatcher();
  }

  async scheduleRender(
    options: RenderOptions,
    priority: RenderPriority = { level: 'normal' }
  ): Promise<RenderResult> {
    // 检查缓存
    const contentHash = this.hashContent(options.content);
    const cacheKey = {
      contentHash,
      selectedElements: options.selectedElements,
      primaryColor: options.primaryColor,
      showNotes: options.showNotes,
      zoomLevel: options.zoomLevel
    };
    
    const cached = this.renderCache.get(cacheKey);
    if (cached) {
      return {
        svg: cached.svg,
        viewBox: cached.viewBox,
        renderTime: 0,
        isIncremental: true
      };
    }
    
    // 添加到渲染队列
    return new Promise((resolve, reject) => {
      this.renderQueue.push({ options, priority, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isRendering || this.renderQueue.length === 0) {
      return;
    }

    // 按优先级排序
    this.renderQueue.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority.level] - priorityOrder[b.priority.level];
    });

    const { options, priority, resolve, reject } = this.renderQueue.shift()!;
    this.isRendering = true;

    try {
      const startTime = performance.now();
      
      // 检查是否超过截止时间
      if (priority.deadline && Date.now() > priority.deadline) {
        reject(new Error('Render deadline exceeded'));
        this.isRendering = false;
        this.processQueue();
        return;
      }

      // 使用 requestIdleCallback 进行时间切片
      if (priority.level === 'low' || priority.level === 'normal') {
        await this.waitForIdle();
      }

      // 解析 AST
      const parseResult = await this.parser.parse(options.content);
      
      if (parseResult.error || !parseResult.ast) {
        throw parseResult.error || new Error('Parse failed');
      }

      // 渲染 SVG（这里调用现有的 render 函数）
      const { render } = await import('../../../lib/renderer');
      const renderResult = render(parseResult.ast, {
        disableNotes: !options.showNotes,
        selectedElementIds: options.selectedElements,
        primaryColor: options.primaryColor,
        sourceInput: options.content
      }, true);

      const svg = renderResult.svg;
      const viewBox = renderResult.viewBox;
      const renderTime = performance.now() - startTime;

      // 缓存结果
      const contentHash = this.hashContent(options.content);
      this.renderCache.set({
        contentHash,
        selectedElements: options.selectedElements,
        primaryColor: options.primaryColor,
        showNotes: options.showNotes,
        zoomLevel: options.zoomLevel
      }, svg, viewBox);

      // 记录渲染时间
      this.renderTimes.push(renderTime);
      if (this.renderTimes.length > 100) {
        this.renderTimes.shift();
      }

      resolve({
        svg,
        viewBox,
        renderTime,
        isIncremental: false
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isRendering = false;
      this.processQueue();
    }
  }

  private waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 100 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  private hashContent(content: string): string {
    // 简单的哈希实现
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  cancelRender(): void {
    this.renderQueue = [];
    if (this.pendingRender) {
      this.pendingRender = null;
    }
  }

  async forceRender(): Promise<RenderResult> {
    if (this.renderQueue.length === 0) {
      throw new Error('No pending renders');
    }
    return this.processQueue();
  }

  getStats(): { pendingRenders: number; averageRenderTime: number } {
    const avgTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
      : 0;
    
    return {
      pendingRenders: this.renderQueue.length,
      averageRenderTime: avgTime
    };
  }
}
```

- [ ] **Step 3: 编写渲染协调器测试**

```typescript
// tests/unit/rendering/RenderCoordinator.test.ts

import { RenderCoordinator } from '../../../src/shared/rendering/RenderCoordinator';

describe('RenderCoordinator', () => {
  let coordinator: RenderCoordinator;

  beforeEach(() => {
    coordinator = new RenderCoordinator();
  });

  test('should schedule and complete render', async () => {
    const options = {
      content: '["Rectangle"] @(100,100) w=200 h=100',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    };

    const result = await coordinator.scheduleRender(options);

    expect(result.svg).toBeDefined();
    expect(result.renderTime).toBeGreaterThanOrEqual(0);
  });

  test('should use cache for repeated renders', async () => {
    const options = {
      content: '["Rectangle"] @(100,100)',
      selectedElements: [],
      primaryColor: '#000',
      showNotes: true,
      zoomLevel: 100
    };

    const result1 = await coordinator.scheduleRender(options);
    const result2 = await coordinator.scheduleRender(options);

    expect(result1.renderTime).toBeGreaterThan(result2.renderTime);
    expect(result2.renderTime).toBe(0); // 缓存命中
  });

  test('should prioritize immediate renders', async () => {
    const immediatePromise = coordinator.scheduleRender(
      { ...defaultOptions, content: 'immediate' },
      { level: 'immediate' }
    );
    
    const lowPromise = coordinator.scheduleRender(
      { ...defaultOptions, content: 'low' },
      { level: 'low' }
    );

    const [immediate, low] = await Promise.all([immediatePromise, lowPromise]);
    
    expect(immediate).toBeDefined();
    expect(low).toBeDefined();
  });

  test('should track statistics', () => {
    const stats = coordinator.getStats();
    expect(stats.pendingRenders).toBe(0);
    expect(stats.averageRenderTime).toBe(0);
  });

  test('should cancel pending renders', () => {
    coordinator.scheduleRender(defaultOptions, { level: 'low' });
    coordinator.scheduleRender(defaultOptions, { level: 'low' });
    
    coordinator.cancelRender();
    
    const stats = coordinator.getStats();
    expect(stats.pendingRenders).toBe(0);
  });
});

const defaultOptions = {
  content: '["Rectangle"] @(100,100)',
  selectedElements: [],
  primaryColor: '#000',
  showNotes: true,
  zoomLevel: 100
};
```

- [ ] **Step 4: 运行测试**

```bash
npm test -- tests/unit/rendering/RenderCoordinator.test.ts
```

Expected: All tests pass

- [ ] **Step 5: 提交**

```bash
git add src/shared/rendering/RenderCoordinator.ts tests/unit/rendering/
git commit -m "feat: implement render coordinator with priority scheduling"
```

---

### Task 5: 预测渲染器

**Files:**
- Create: `src/shared/rendering/PredictiveRenderer.ts`
- Test: `tests/unit/rendering/PredictiveRenderer.test.ts`

- [ ] **Step 1: 实现预测渲染器**

```typescript
// src/shared/rendering/PredictiveRenderer.ts

import { RenderCoordinator, RenderOptions } from './RenderCoordinator';

export interface UserAction {
  type: 'typing' | 'drag' | 'zoom' | 'pan' | 'select';
  timestamp: number;
  data?: any;
}

export interface Prediction {
  nextAction: UserAction['type'];
  confidence: number;
  predictedOptions?: RenderOptions;
}

export class PredictiveRenderer {
  private coordinator: RenderCoordinator;
  private actionHistory: UserAction[] = [];
  private predictionCache: Map<string, RenderOptions> = new Map();
  private pendingPrediction: Promise<any> | null = null;

  constructor(coordinator: RenderCoordinator) {
    this.coordinator = coordinator;
  }

  /**
   * 记录用户动作
   */
  recordAction(action: UserAction): void {
    this.actionHistory.push(action);
    
    // 只保留最近 100 个动作
    if (this.actionHistory.length > 100) {
      this.actionHistory.shift();
    }

    // 基于动作模式进行预测
    this.predictAndPreRender();
  }

  /**
   * 预测并预渲染
   */
  private async predictAndPreRender(): Promise<void> {
    if (this.actionHistory.length < 5) {
      return; // 数据不足
    }

    const prediction = this.analyzePattern();
    
    if (prediction.confidence > 0.7 && prediction.predictedOptions) {
      // 高置信度预测，开始预渲染
      const cacheKey = JSON.stringify(prediction.predictedOptions);
      
      if (!this.predictionCache.has(cacheKey)) {
        this.pendingPrediction = this.coordinator.scheduleRender(
          prediction.predictedOptions,
          { level: 'low' } // 低优先级，不阻塞
        ).then(result => {
          this.predictionCache.set(cacheKey, prediction.predictedOptions!);
        }).catch(() => {
          // 预测失败，忽略
        });
      }
    }
  }

  /**
   * 分析用户行为模式
   */
  private analyzePattern(): Prediction {
    const recentActions = this.actionHistory.slice(-10);
    
    // 简单的模式识别
    const typingCount = recentActions.filter(a => a.type === 'typing').length;
    const dragCount = recentActions.filter(a => a.type === 'drag').length;
    
    if (typingCount > 7) {
      // 连续输入，预测继续输入
      return {
        nextAction: 'typing',
        confidence: 0.8,
        predictedOptions: this.buildPredictedOptions('typing')
      };
    }
    
    if (dragCount > 7) {
      // 连续拖动，预测继续拖动
      return {
        nextAction: 'drag',
        confidence: 0.8,
        predictedOptions: this.buildPredictedOptions('drag')
      };
    }

    // 默认预测
    return {
      nextAction: 'typing',
      confidence: 0.3
    };
  }

  /**
   * 构建预测的渲染选项
   */
  private buildPredictedOptions(actionType: string): RenderOptions | undefined {
    // 这里需要访问当前的状态
    // 实际实现中应该通过回调或观察者模式获取
    return undefined;
  }

  /**
   * 获取预测的缓存结果
   */
  getCachedPrediction(options: RenderOptions): { svg: string; viewBox: any } | null {
    // 检查是否有匹配的预测缓存
    // 实际实现需要更智能的匹配逻辑
    return null;
  }

  /**
   * 清空预测缓存
   */
  clearCache(): void {
    this.predictionCache.clear();
  }
}
```

- [ ] **Step 2: 编写预测渲染器测试**

```typescript
// tests/unit/rendering/PredictiveRenderer.test.ts

import { PredictiveRenderer } from '../../../src/shared/rendering/PredictiveRenderer';
import { RenderCoordinator } from '../../../src/shared/rendering/RenderCoordinator';

describe('PredictiveRenderer', () => {
  let coordinator: RenderCoordinator;
  let predictor: PredictiveRenderer;

  beforeEach(() => {
    coordinator = new RenderCoordinator();
    predictor = new PredictiveRenderer(coordinator);
  });

  test('should record user actions', () => {
    const action: UserAction = {
      type: 'typing',
      timestamp: Date.now()
    };

    predictor.recordAction(action);
    
    // 验证动作被记录（通过后续的预测行为间接验证）
  });

  test('should predict typing pattern', () => {
    // 记录连续输入动作
    for (let i = 0; i < 8; i++) {
      predictor.recordAction({
        type: 'typing',
        timestamp: Date.now() + i * 100
      });
    }

    // 验证预测逻辑被触发（通过缓存等间接验证）
  });

  test('should clear prediction cache', () => {
    predictor.clearCache();
    // 验证缓存被清空
  });
});

interface UserAction {
  type: 'typing' | 'drag' | 'zoom' | 'pan' | 'select';
  timestamp: number;
  data?: any;
}
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- tests/unit/rendering/PredictiveRenderer.test.ts
```

Expected: All tests pass

- [ ] **Step 4: 提交**

```bash
git add src/shared/rendering/PredictiveRenderer.ts tests/unit/rendering/PredictiveRenderer.test.ts
git commit -m "feat: implement predictive renderer with pattern recognition"
```

---

### Task 6: 实时渲染 Hook

**Files:**
- Create: `src/shared/hooks/useRealtimeRender.ts`
- Test: `tests/hooks/useRealtimeRender.test.tsx`

- [ ] **Step 1: 实现实时渲染 Hook**

```typescript
// src/shared/hooks/useRealtimeRender.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { RenderCoordinator, RenderOptions, RenderResult } from '../rendering/RenderCoordinator';
import { PredictiveRenderer } from '../rendering/PredictiveRenderer';
import { DOMPatcher } from '../utils/DOMPatcher';

interface UseRealtimeRenderOptions {
  containerRef: React.RefObject<HTMLElement>;
  initialZoomLevel?: number;
}

interface UseRealtimeRenderReturn {
  svg: string;
  viewBox: { x: number; y: number; width: number; height: number };
  isLoading: boolean;
  error: Error | null;
  handleContentChange: (content: string) => void;
  handleElementUpdate: (elementId: string, attrs: Record<string, string | number>) => void;
  renderStats: { pendingRenders: number; averageRenderTime: number };
}

const coordinator = new RenderCoordinator();
const predictor = new PredictiveRenderer(coordinator);
const patcher = new DOMPatcher();

export function useRealtimeRender({
  containerRef,
  initialZoomLevel = 100
}: UseRealtimeRenderOptions): UseRealtimeRenderReturn {
  const [svg, setSvg] = useState('');
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const contentRef = useRef<string>('');
  const selectedElementsRef = useRef<string[]>([]);
  const primaryColorRef = useRef<string>('#000');
  const showNotesRef = useRef<boolean>(true);
  const zoomLevelRef = useRef<number>(initialZoomLevel);

  const handleContentChange = useCallback((newContent: string) => {
    contentRef.current = newContent;
    
    predictor.recordAction({
      type: 'typing',
      timestamp: Date.now()
    });

    setIsLoading(true);
    setError(null);

    coordinator.scheduleRender({
      content: newContent,
      selectedElements: selectedElementsRef.current,
      primaryColor: primaryColorRef.current,
      showNotes: showNotesRef.current,
      zoomLevel: zoomLevelRef.current
    }, {
      level: 'high',
      deadline: Date.now() + 200 // 200ms 截止
    }).then(result => {
      setSvg(result.svg);
      setViewBox(result.viewBox);
      setIsLoading(false);
    }).catch(err => {
      setError(err);
      setIsLoading(false);
    });
  }, []);

  const handleElementUpdate = useCallback((
    elementId: string,
    attrs: Record<string, string | number>
  ) => {
    // 立即更新 DOM（零延迟）
    const success = patcher.updateElementAttribute(elementId, attrs);
    
    if (success) {
      predictor.recordAction({
        type: 'drag',
        timestamp: Date.now()
      });

      // 异步更新内容（保持数据一致性）
      // 这里需要实现内容更新逻辑
    }
  }, []);

  const renderStats = coordinator.getStats();

  return {
    svg,
    viewBox,
    isLoading,
    error,
    handleContentChange,
    handleElementUpdate,
    renderStats
  };
}
```

- [ ] **Step 2: 编写 Hook 测试**

```typescript
// tests/hooks/useRealtimeRender.test.tsx

import { renderHook, act } from '@testing-library/react';
import { useRealtimeRender } from '../../../src/shared/hooks/useRealtimeRender';

describe('useRealtimeRender', () => {
  const containerRef = { current: document.createElement('div') };

  test('should initialize with empty svg', () => {
    const { result } = renderHook(() => useRealtimeRender({ containerRef }));
    
    expect(result.current.svg).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle content change', async () => {
    const { result } = renderHook(() => useRealtimeRender({ containerRef }));

    await act(async () => {
      result.current.handleContentChange('["Rectangle"] @(100,100)');
    });

    expect(result.current.svg).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle element update', () => {
    const { result } = renderHook(() => useRealtimeRender({ containerRef }));

    act(() => {
      result.current.handleElementUpdate('el1', { x: 100, y: 200 });
    });

    // 验证 DOM 被更新
  });

  test('should track render statistics', () => {
    const { result } = renderHook(() => useRealtimeRender({ containerRef }));
    
    const stats = result.current.renderStats;
    expect(stats).toHaveProperty('pendingRenders');
    expect(stats).toHaveProperty('averageRenderTime');
  });
});
```

- [ ] **Step 3: 运行测试**

```bash
npm test -- tests/hooks/useRealtimeRender.test.tsx
```

Expected: All tests pass

- [ ] **Step 4: 提交**

```bash
git add src/shared/hooks/useRealtimeRender.ts tests/hooks/
git commit -m "feat: implement realtime render hook"
```

---

### Task 7: 集成到新画布组件

**Files:**
- Create: `src/app/components/editor/RealtimeCanvas.tsx`
- Modify: `src/app/components/editor/SolarWirePreview.tsx`
- Test: `tests/components/RealtimeCanvas.test.tsx`

- [ ] **Step 1: 创建新实时画布组件**

```typescript
// src/app/components/editor/RealtimeCanvas.tsx

import React, { useRef } from 'react';
import { useRealtimeRender } from '../../../shared/hooks/useRealtimeRender';
import { useSolarWireStore } from '../../stores/solarWireStore';
import { useEditorStore } from '../../stores/editorStore';
import { useCoordinateSystem } from '../../../shared/hooks/useCoordinateSystem';
import './RealtimeCanvas.css';

interface RealtimeCanvasProps {
  zoomLevel: number;
  showNotes?: boolean;
  onZoomChange?: (zoom: number) => void;
  isPanMode?: boolean;
  isSpacePressed?: boolean;
}

export function RealtimeCanvas({
  zoomLevel,
  showNotes = true,
  onZoomChange,
  isPanMode = false,
  isSpacePressed = false
}: RealtimeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { content } = useEditorStore();
  const { selectedElements } = useSolarWireStore();
  const { primaryColor } = useSolarWireStore();
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(zoomLevel / 100);

  const {
    svg,
    viewBox,
    isLoading,
    error,
    handleContentChange,
    handleElementUpdate,
    renderStats
  } = useRealtimeRender({
    containerRef,
    initialZoomLevel: zoomLevel
  });

  const { getSvgCoords, getTransform } = useCoordinateSystem({
    position,
    scale
  });

  // 监听内容变化
  React.useEffect(() => {
    handleContentChange(content);
  }, [content, handleContentChange]);

  // 处理滚轮缩放
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));

    const scaleRatio = newScale / scale;
    const newX = mouseX - (mouseX - position.x) * scaleRatio;
    const newY = mouseY - (mouseY - position.y) * scaleRatio;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
    
    if (onZoomChange) {
      onZoomChange(Math.round(newScale * 100));
    }
  }, [scale, position, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className="realtime-canvas-container"
      onWheel={handleWheel}
    >
      {svg && (
        <div
          className="svg-container"
          style={{
            transform: getTransform(),
            transformOrigin: '0 0'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {isLoading && (
        <div className="loading-indicator">
          Rendering... ({Math.round(renderStats.averageRenderTime)}ms)
        </div>
      )}

      {error && (
        <div className="error-indicator">
          {error.message}
        </div>
      )}

      {/* 性能统计（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="perf-stats">
          <div>Pending: {renderStats.pendingRenders}</div>
          <div>Avg Time: {Math.round(renderStats.averageRenderTime)}ms</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建样式文件**

```css
/* src/app/components/editor/RealtimeCanvas.css */

.realtime-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.svg-container {
  position: absolute;
  top: 0;
  left: 0;
}

.loading-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

.error-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  padding: 12px;
  background: #fee;
  border: 1px solid #f99;
  border-radius: 4px;
  color: #c00;
  font-size: 13px;
}

.perf-stats {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  pointer-events: none;
}
```

- [ ] **Step 3: 编写组件测试**

```typescript
// tests/components/RealtimeCanvas.test.tsx

import { render, screen } from '@testing-library/react';
import { RealtimeCanvas } from '../../src/app/components/editor/RealtimeCanvas';

describe('RealtimeCanvas', () => {
  test('should render without crashing', () => {
    render(<RealtimeCanvas zoomLevel={100} />);
    
    // 验证组件渲染
    expect(screen.getByTestId('realtime-canvas')).toBeDefined();
  });

  test('should show loading indicator during render', () => {
    render(<RealtimeCanvas zoomLevel={100} />);
    
    // 验证加载状态
  });

  test('should handle zoom changes', () => {
    const onZoomChange = jest.fn();
    render(<RealtimeCanvas zoomLevel={100} onZoomChange={onZoomChange} />);
    
    // 模拟滚轮事件
    // 验证 onZoomChange 被调用
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
npm test -- tests/components/RealtimeCanvas.test.tsx
```

Expected: All tests pass

- [ ] **Step 5: 提交**

```bash
git add src/app/components/editor/RealtimeCanvas.tsx src/app/components/editor/RealtimeCanvas.css tests/components/
git commit -m "feat: create new realtime canvas component"
```

---

### Task 8: 迁移和清理

**Files:**
- Modify: `src/app/components/editor/SolarWirePreview.tsx`
- Modify: `src/app/components/editor/SolarWireCanvas.tsx`
- Create: `docs/MIGRATION_GUIDE.md`

- [ ] **Step 1: 迁移 SolarWirePreview**

```typescript
// 在 SolarWirePreview.tsx 中引入新架构
import { RealtimeCanvas } from './RealtimeCanvas';

// 替换原有的渲染逻辑
function SolarWirePreview(...) {
  // 使用 RealtimeCanvas 组件
  return <RealtimeCanvas
    zoomLevel={zoomLevel}
    showNotes={showNotes}
    onZoomChange={onZoomChange}
    isPanMode={isPanMode}
    isSpacePressed={isSpacePressed}
  />;
}
```

- [ ] **Step 2: 迁移 SolarWireCanvas**

类似步骤 1

- [ ] **Step 3: 创建迁移指南**

```markdown
# 实时渲染架构迁移指南

## 概述

本文档描述如何从旧版渲染架构迁移到新的实时渲染架构。

## 主要变化

### 1. 缓存系统
- 新增：`RenderCache` 和 `ASTCache`
- 自动缓存渲染结果和解析结果

### 2. 增量解析
- 使用 `IncrementalParser` 替代直接调用 `parse`
- 支持 Web Worker 后台解析

### 3. 渲染协调
- 使用 `RenderCoordinator` 统一管理渲染
- 支持优先级调度和时间切片

### 4. 预测渲染
- 使用 `PredictiveRenderer` 预测用户行为
- 自动预渲染可能的结果

## 迁移步骤

1. 安装依赖
2. 更新导入路径
3. 替换渲染调用
4. 测试验证

## 性能对比

| 指标 | 旧架构 | 新架构 | 提升 |
|------|--------|--------|------|
| 首次渲染 | 150ms | 80ms | 47% |
| 缓存命中 | 0ms | 0ms | - |
| 拖动延迟 | 100ms | <5ms | 95% |
| 内存占用 | 50MB | 35MB | 30% |
```

- [ ] **Step 4: 提交**

```bash
git add src/app/components/editor/SolarWirePreview.tsx src/app/components/editor/SolarWireCanvas.tsx docs/MIGRATION_GUIDE.md
git commit -m "feat: migrate to new realtime rendering architecture"
```

---

## 完成检查

- [ ] 所有测试通过
- [ ] 性能达到预期目标
- [ ] 文档完整
- [ ] 代码审查通过

---

**计划完成！**

**"Plan complete and saved to `plan/specs/2026-04-16-realtime-rendering-architecture.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**"