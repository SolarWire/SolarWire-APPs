# 组件库功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps using checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SolarWire 编辑器实现组件库功能，包括组件库面板（拖拽使用）和组件库管理功能（全屏编辑）。

**Architecture:** 独立于现有元素库的新功能模块，包含类型定义、状态管理、服务层、UI 组件四个层次。组件库管理功能基于复制的可视化编辑功能实现。

**Tech Stack:** TypeScript, React 18, Zustand, IndexedDB, SVG 渲染器

---

## 文件结构总览

### 新增文件
| 文件路径 | 说明 |
|---------|------|
| `editor/src/shared/types/component.ts` | 组件库类型定义 |
| `editor/src/app/stores/componentLibraryStore.ts` | 组件库状态管理 |
| `editor/src/app/services/IndexedDBService.ts` | IndexedDB 封装服务 |
| `editor/src/app/services/ComponentLibraryManager.ts` | 组件库管理服务 |
| `editor/src/app/components/editor/ComponentLibrary.tsx` | 组件库面板组件（使用模式） |
| `editor/src/app/components/editor/ComponentLibrary.css` | 组件库面板样式 |
| `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx` | 组件库管理功能弹窗 |
| `editor/src/app/components/editor/ComponentLibraryManagerModal.css` | 组件库管理功能样式 |
| `editor/src/app/components/editor/ComponentEditor.tsx` | 组件编辑器（复制的可视化编辑） |
| `editor/src/app/components/editor/ComponentEditor.css` | 组件编辑器样式 |
| `editor/src/lib/components/presets/default.swc.json` | 默认组件库 |

### 修改文件
| 文件路径 | 变更说明 |
|---------|---------|
| `editor/src/app/components/editor-modes/SolarWireMode.tsx` | 添加工具栏组件库面板按钮 |
| `editor/src/app/components/layout/TopMenuBar.tsx` | 添加顶部导航组件库管理按钮 |
| `editor/src/app/stores/solarWireStore.ts` | 添加 showComponentLibrary 状态 |

---

## 阶段一：基础架构（类型、状态、服务）

### Task 1: 组件库类型定义

**Files:**
- Create: `editor/src/shared/types/component.ts`

- [ ] **Step 1: 创建组件库类型定义文件**

```typescript
// editor/src/shared/types/component.ts

/**
 * 组件库元数据
 */
export interface ComponentLibraryMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 分类/目录
 */
export interface ComponentCategory {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

/**
 * 组件定义
 */
export interface Component {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  thumbnail: string; // Base64 SVG
  code: string; // Pure SolarWire DSL (no !title= etc)
  createdAt: string;
  updatedAt: string;
}

/**
 * 组件库（.swc 文件结构）
 */
export interface ComponentLibrary {
  $schema: 'solarwire-component-library-v1';
  metadata: ComponentLibraryMetadata;
  categories: ComponentCategory[];
  components: Component[];
}

/**
 * 组件库列表项（用于 UI 展示）
 */
export interface ComponentLibraryItem {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
  isPreset: boolean;
  source: 'preset' | 'indexeddb' | 'file';
}
```

- [ ] **Step 2: 导出类型（如果需要）**

检查 `editor/src/shared/types/` 是否有 index.ts 文件，如果有则添加导出：

```typescript
export * from './component';
```

---

### Task 2: IndexedDB 服务

**Files:**
- Create: `editor/src/app/services/IndexedDBService.ts`

- [ ] **Step 1: 创建 IndexedDB 服务**

```typescript
// editor/src/app/services/IndexedDBService.ts

import { ComponentLibrary } from '../../shared/types/component';

const DB_NAME = 'solarwire-components';
const DB_VERSION = 1;
const STORE_NAME = 'libraries';

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
          store.createIndex('name', 'metadata.name', { unique: false });
          store.createIndex('author', 'metadata.author', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  async getAllLibraries(): Promise<ComponentLibrary[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveLibrary(library: ComponentLibrary): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(library);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteLibrary(libraryId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(libraryId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLibrary(libraryId: string): Promise<ComponentLibrary | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(libraryId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
```

---

### Task 3: 组件库管理服务

**Files:**
- Create: `editor/src/app/services/ComponentLibraryManager.ts`
- Create: `editor/src/lib/components/presets/default.swc.json`

- [ ] **Step 1: 创建默认组件库文件**

```json
{
  "$schema": "solarwire-component-library-v1",
  "metadata": {
    "id": "preset-default",
    "name": "默认组件库",
    "description": "SolarWire 内置的基础组件库",
    "version": "1.0.0",
    "author": "SolarWire",
    "createdAt": "2026-04-21T00:00:00Z",
    "updatedAt": "2026-04-21T00:00:00Z"
  },
  "categories": [
    {
      "id": "cat-basic",
      "name": "基础组件",
      "parentId": null,
      "order": 1
    },
    {
      "id": "cat-forms",
      "name": "表单组件",
      "parentId": null,
      "order": 2
    }
  ],
  "components": []
}
```

- [ ] **Step 2: 创建组件库管理服务**

```typescript
// editor/src/app/services/ComponentLibraryManager.ts

import { ComponentLibrary, Component } from '../../shared/types/component';
import { indexedDBService } from './IndexedDBService';

// 导入默认组件库
import defaultLibrary from '../../lib/components/presets/default.swc.json';

class ComponentLibraryManager {
  private libraries: Map<string, ComponentLibrary> = new Map();

  async initialize(): Promise<void> {
    await indexedDBService.init();
    
    // 加载官方预制组件库
    this.libraries.set(defaultLibrary.metadata.id, defaultLibrary as ComponentLibrary);

    // 加载用户组件库
    const userLibraries = await indexedDBService.getAllLibraries();
    userLibraries.forEach(lib => {
      this.libraries.set(lib.metadata.id, lib);
    });
  }

  getLibraries(): ComponentLibrary[] {
    return Array.from(this.libraries.values());
  }

  getLibrary(id: string): ComponentLibrary | null {
    return this.libraries.get(id) || null;
  }

  async addLibrary(library: ComponentLibrary): Promise<void> {
    this.libraries.set(library.metadata.id, library);
    if (!library.metadata.id.startsWith('preset-')) {
      await indexedDBService.saveLibrary(library);
    }
  }

  async removeLibrary(id: string): Promise<void> {
    this.libraries.delete(id);
    if (!id.startsWith('preset-')) {
      await indexedDBService.deleteLibrary(id);
    }
  }

  async updateLibrary(id: string, updates: Partial<ComponentLibrary>): Promise<void> {
    const library = this.libraries.get(id);
    if (!library) throw new Error(`Library ${id} not found`);

    const updated = { ...library, ...updates };
    updated.metadata.updatedAt = new Date().toISOString();
    
    this.libraries.set(id, updated);
    if (!id.startsWith('preset-')) {
      await indexedDBService.saveLibrary(updated);
    }
  }

  async addComponent(libraryId: string, component: Component): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    library.components.push(component);
    library.metadata.updatedAt = new Date().toISOString();
    
    this.libraries.set(libraryId, library);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(library);
    }
  }

  async updateComponent(libraryId: string, componentId: string, updates: Partial<Component>): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const index = library.components.findIndex(c => c.id === componentId);
    if (index === -1) throw new Error(`Component ${componentId} not found`);

    library.components[index] = { ...library.components[index], ...updates };
    library.components[index].updatedAt = new Date().toISOString();
    library.metadata.updatedAt = new Date().toISOString();

    this.libraries.set(libraryId, library);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(library);
    }
  }

  async deleteComponent(libraryId: string, componentId: string): Promise<void> {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    library.components = library.components.filter(c => c.id !== componentId);
    library.metadata.updatedAt = new Date().toISOString();

    this.libraries.set(libraryId, library);
    if (!libraryId.startsWith('preset-')) {
      await indexedDBService.saveLibrary(library);
    }
  }

  exportLibrary(libraryId: string): void {
    const library = this.libraries.get(libraryId);
    if (!library) throw new Error(`Library ${libraryId} not found`);

    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${library.metadata.name.replace(/\s+/g, '-').toLowerCase()}.swc.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importLibrary(file: File): Promise<ComponentLibrary> {
    const text = await file.text();
    const library = JSON.parse(text) as ComponentLibrary;

    // 验证格式
    if (!library.$schema || !library.metadata || !library.components) {
      throw new Error('Invalid component library file format');
    }

    // 确保有 ID
    if (!library.metadata.id) {
      library.metadata.id = `imported-${Date.now()}`;
    }

    await this.addLibrary(library);
    return library;
  }

  async generateThumbnail(code: string): Promise<string> {
    try {
      // 使用现有的 SVG 渲染器
      const { generateSVG } = await import('../../lib/renderer');
      const svg = generateSVG(code);
      
      // 转换为 Base64
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (error) {
      // 渲染失败时返回叉号占位图
      const errorSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100">
        <rect width="150" height="100" fill="#f5f5f5"/>
        <text x="75" y="55" font-size="40" text-anchor="middle" fill="#999">❌</text>
      </svg>`;
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(errorSVG)))}`;
    }
  }
}

export const componentLibraryManager = new ComponentLibraryManager();
```

---

### Task 4: 状态管理

**Files:**
- Create: `editor/src/app/stores/componentLibraryStore.ts`
- Modify: `editor/src/app/stores/solarWireStore.ts`

- [ ] **Step 1: 创建组件库状态管理**

```typescript
// editor/src/app/stores/componentLibraryStore.ts

import { create } from 'zustand';
import { ComponentLibrary, Component, ComponentCategory } from '../../shared/types/component';
import { componentLibraryManager } from '../services/ComponentLibraryManager';

interface ComponentLibraryStore {
  // 面板状态
  showComponentLibrary: boolean;
  setShowComponentLibrary: (show: boolean) => void;

  // 管理功能状态
  showComponentManager: boolean;
  setShowComponentManager: (show: boolean) => void;

  // 组件库列表
  libraries: ComponentLibrary[];
  activeLibraryId: string | null;
  
  // 选中状态
  selectedLibraryId: string | null;
  selectedComponentId: string | null;
  
  // 搜索和筛选
  searchQuery: string;
  activeCategoryId: string | null;
  
  // 初始化
  initialize: () => Promise<void>;
  
  // 组件库操作
  setActiveLibrary: (libraryId: string | null) => void;
  setSelectedLibrary: (libraryId: string | null) => void;
  setSelectedComponent: (componentId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  
  // 组件操作
  addComponent: (libraryId: string, component: Component) => Promise<void>;
  updateComponent: (libraryId: string, componentId: string, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (libraryId: string, componentId: string) => Promise<void>;
  
  // 组件库操作
  addLibrary: (library: ComponentLibrary) => Promise<void>;
  removeLibrary: (libraryId: string) => Promise<void>;
  updateLibrary: (libraryId: string, updates: Partial<ComponentLibrary>) => Promise<void>;
  exportLibrary: (libraryId: string) => void;
  importLibrary: (file: File) => Promise<ComponentLibrary>;
}

export const useComponentLibraryStore = create<ComponentLibraryStore>((set, get) => ({
  // 初始状态
  showComponentLibrary: false,
  showComponentManager: false,
  libraries: [],
  activeLibraryId: null,
  selectedLibraryId: null,
  selectedComponentId: null,
  searchQuery: '',
  activeCategoryId: null,

  setShowComponentLibrary: (show) => set({ showComponentLibrary: show }),
  setShowComponentManager: (show) => set({ showComponentManager: show }),

  initialize: async () => {
    await componentLibraryManager.initialize();
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  setActiveLibrary: (libraryId) => set({ activeLibraryId: libraryId }),
  setSelectedLibrary: (libraryId) => set({ selectedLibraryId: libraryId }),
  setSelectedComponent: (componentId) => set({ selectedComponentId: componentId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

  addComponent: async (libraryId, component) => {
    await componentLibraryManager.addComponent(libraryId, component);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  updateComponent: async (libraryId, componentId, updates) => {
    await componentLibraryManager.updateComponent(libraryId, componentId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  deleteComponent: async (libraryId, componentId) => {
    await componentLibraryManager.deleteComponent(libraryId, componentId);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  addLibrary: async (library) => {
    await componentLibraryManager.addLibrary(library);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  removeLibrary: async (libraryId) => {
    await componentLibraryManager.removeLibrary(libraryId);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  updateLibrary: async (libraryId, updates) => {
    await componentLibraryManager.updateLibrary(libraryId, updates);
    set({ libraries: componentLibraryManager.getLibraries() });
  },

  exportLibrary: (libraryId) => {
    componentLibraryManager.exportLibrary(libraryId);
  },

  importLibrary: async (file) => {
    const library = await componentLibraryManager.importLibrary(file);
    set({ libraries: componentLibraryManager.getLibraries() });
    return library;
  },
}));
```

- [ ] **Step 2: 修改 solarWireStore.ts 添加 showComponentLibrary 状态**

读取 `editor/src/app/stores/solarWireStore.ts`，找到状态定义部分，添加：

```typescript
showComponentLibrary: boolean,
setShowComponentLibrary: (show: boolean) => void,
```

并在 create 函数中添加：

```typescript
showComponentLibrary: false,
setShowComponentLibrary: (show) => set({ showComponentLibrary: show }),
```

---

## 阶段二：组件库面板（使用模式）

### Task 5: 组件库面板组件

**Files:**
- Create: `editor/src/app/components/editor/ComponentLibrary.tsx`
- Create: `editor/src/app/components/editor/ComponentLibrary.css`
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

- [ ] **Step 1: 创建组件库面板 CSS**

```css
/* editor/src/app/components/editor/ComponentLibrary.css */

.component-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: 0;
  overflow: hidden;
}

.component-library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  user-select: none;
}

.component-library-actions {
  display: flex;
  gap: 4px;
}

.component-library-actions button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.component-library-actions button:hover {
  background: var(--bg-hover);
}

.component-library-search {
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.component-library-search input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.component-library-search input:focus {
  border-color: var(--accent-color);
}

.component-library-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  overflow: hidden;
}

.component-card:hover {
  background: var(--accent-opacity-10);
  border-color: var(--accent-opacity-50);
  transform: translateY(-2px);
}

.component-card:active {
  cursor: grabbing;
}

.component-thumbnail {
  width: 100%;
  aspect-ratio: 3 / 2;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.component-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.component-info {
  padding: 6px;
}

.component-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-description {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-library-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.component-library-empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}
```

- [ ] **Step 2: 创建组件库面板组件**

```typescript
// editor/src/app/components/editor/ComponentLibrary.tsx

import React, { useMemo } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { Component, ComponentLibrary } from '../../../shared/types/component';
import './ComponentLibrary.css';

interface ComponentLibraryProps {
  onDropToCanvas: (component: Component, x: number, y: number) => void;
}

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onDropToCanvas }) => {
  const {
    libraries,
    activeLibraryId,
    setActiveLibrary,
    searchQuery,
    setSearchQuery,
    activeCategoryId,
    setActiveCategoryId,
  } = useComponentLibraryStore();

  const activeLibrary = useMemo(() => {
    return libraries.find(lib => lib.metadata.id === activeLibraryId) || null;
  }, [libraries, activeLibraryId]);

  const filteredComponents = useMemo(() => {
    if (!activeLibrary) return [];

    let components = activeLibrary.components;

    // 按分类筛选
    if (activeCategoryId) {
      components = components.filter(c => c.categoryId === activeCategoryId);
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      components = components.filter(
        c => c.name.toLowerCase().includes(query) || 
             c.description?.toLowerCase().includes(query)
      );
    }

    return components;
  }, [activeLibrary, activeCategoryId, searchQuery]);

  const handleDragStart = (e: React.DragEvent, component: Component) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const categories = useMemo(() => {
    if (!activeLibrary) return [];
    return activeLibrary.categories.filter(c => c.parentId === null);
  }, [activeLibrary]);

  if (libraries.length === 0) {
    return (
      <div className="component-library">
        <div className="component-library-header">
          <span>组件库</span>
        </div>
        <div className="component-library-empty">
          <div className="component-library-empty-icon">📦</div>
          <div>暂无组件库</div>
          <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
            点击顶部导航栏的组件库管理按钮添加
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="component-library">
      <div className="component-library-header">
        <span>组件库</span>
        <div className="component-library-actions">
          <button title="导入组件库">➕</button>
        </div>
      </div>

      {/* 组件库选择器 */}
      <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <select
          value={activeLibraryId || ''}
          onChange={(e) => setActiveLibrary(e.target.value || null)}
          style={{
            width: '100%',
            padding: '6px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontSize: '12px',
          }}
        >
          {libraries.map(lib => (
            <option key={lib.metadata.id} value={lib.metadata.id}>
              {lib.metadata.name}
            </option>
          ))}
        </select>
      </div>

      {/* 搜索框 */}
      <div className="component-library-search">
        <input
          type="text"
          placeholder="搜索组件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 分类标签 */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '8px', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '4px 8px',
              background: !activeCategoryId ? 'var(--accent-color)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: !activeCategoryId ? '#fff' : 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            onClick={() => setActiveCategoryId(null)}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{
                padding: '4px 8px',
                background: activeCategoryId === cat.id ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: activeCategoryId === cat.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* 组件网格 */}
      <div className="component-library-content">
        {filteredComponents.length === 0 ? (
          <div className="component-library-empty">
            <div>暂无组件</div>
          </div>
        ) : (
          <div className="component-grid">
            {filteredComponents.map(component => (
              <div
                key={component.id}
                className="component-card"
                draggable
                onDragStart={(e) => handleDragStart(e, component)}
                title={component.description || component.name}
              >
                <div className="component-thumbnail">
                  <img src={component.thumbnail} alt={component.name} />
                </div>
                <div className="component-info">
                  <div className="component-name">{component.name}</div>
                  {component.description && (
                    <div className="component-description">{component.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
```

- [ ] **Step 3: 在 SolarWireMode 工具栏中添加组件库按钮**

读取 `editor/src/app/components/editor-modes/SolarWireMode.tsx`，找到工具栏的 display-section 部分（图层按钮附近），添加：

```tsx
<button
  className={`component-library-toggle-button ${showComponentLibrary ? 'active' : ''}`}
  onClick={() => setShowComponentLibrary(!showComponentLibrary)}
  title="Toggle Component Library"
>
  📦
</button>
```

- [ ] **Step 4: 在 SolarWireMode 中渲染组件库面板**

在图层面板渲染位置附近（左侧悬浮面板），添加：

```tsx
{showComponentLibrary && (
  <div className="component-library-panel-fixed">
    <ComponentLibrary onDropToCanvas={handleDropComponentToCanvas} />
  </div>
)}
```

---

## 阶段三：组件库管理功能（全屏弹窗）

### Task 6: 组件库管理功能弹窗

**Files:**
- Create: `editor/src/app/components/editor/ComponentLibraryManagerModal.tsx`
- Create: `editor/src/app/components/editor/ComponentLibraryManagerModal.css`
- Modify: `editor/src/app/components/layout/TopMenuBar.tsx`

- [ ] **Step 1: 创建组件库管理功能弹窗 CSS**

```css
/* editor/src/app/components/editor/ComponentLibraryManagerModal.css */

.component-library-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.component-library-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.component-library-manager-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.component-library-manager-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  font-size: 18px;
}

.component-library-manager-close:hover {
  background: var(--bg-hover);
}

.component-library-manager-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.component-library-manager-sidebar {
  width: 280px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.component-library-manager-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.library-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.library-item {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: all 0.15s;
}

.library-item:hover {
  background: var(--bg-hover);
}

.library-item.selected {
  background: var(--accent-opacity-20);
  border: 1px solid var(--accent-color);
}

.library-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.library-item-count {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
```

- [ ] **Step 2: 创建组件库管理功能弹窗组件**

```typescript
// editor/src/app/components/editor/ComponentLibraryManagerModal.tsx

import React, { useState } from 'react';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import { ComponentLibrary } from '../../../shared/types/component';
import ComponentEditor from './ComponentEditor';
import './ComponentLibraryManagerModal.css';

interface ComponentLibraryManagerModalProps {
  onClose: () => void;
}

const ComponentLibraryManagerModal: React.FC<ComponentLibraryManagerModalProps> = ({ onClose }) => {
  const {
    libraries,
    selectedLibraryId,
    selectedComponentId,
    setSelectedLibrary,
    setSelectedComponent,
    removeLibrary,
    exportLibrary,
  } = useComponentLibraryStore();

  const selectedLibrary = libraries.find(lib => lib.metadata.id === selectedLibraryId) || null;

  const handleDeleteLibrary = async (libraryId: string) => {
    if (confirm('确定要删除此组件库吗？')) {
      await removeLibrary(libraryId);
      setSelectedLibrary(null);
      setSelectedComponent(null);
    }
  };

  return (
    <div className="component-library-manager-overlay">
      <div className="component-library-manager-header">
        <div className="component-library-manager-title">📦 组件库管理</div>
        <button className="component-library-manager-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="component-library-manager-content">
        {/* 左栏：组件库列表 */}
        <div className="component-library-manager-sidebar">
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              组件库列表
            </div>
          </div>
          <div className="library-list">
            {libraries.map(library => (
              <div
                key={library.metadata.id}
                className={`library-item ${selectedLibraryId === library.metadata.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedLibrary(library.metadata.id);
                  setSelectedComponent(null);
                }}
              >
                <div className="library-item-name">{library.metadata.name}</div>
                <div className="library-item-count">
                  {library.components.length} 个组件
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右栏：编辑区域 */}
        <div className="component-library-manager-main">
          {!selectedLibrary ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              请选择一个组件库
            </div>
          ) : (
            <div>
              {/* 组件库属性 */}
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>{selectedLibrary.metadata.name}</h3>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {selectedLibrary.metadata.description || '暂无描述'}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => exportLibrary(selectedLibrary.metadata.id)}
                    style={{ padding: '6px 12px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    导出
                  </button>
                  {!selectedLibrary.metadata.id.startsWith('preset-') && (
                    <button
                      onClick={() => handleDeleteLibrary(selectedLibrary.metadata.id)}
                      style={{ padding: '6px 12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>

              {/* 组件列表和编辑器 */}
              <ComponentEditor library={selectedLibrary} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentLibraryManagerModal;
```

- [ ] **Step 3: 在 TopMenuBar 中添加组件库管理按钮**

读取 `editor/src/app/components/layout/TopMenuBar.tsx`，在主题按钮和设置按钮之间添加：

```tsx
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import ComponentLibraryManagerModal from '../editor/ComponentLibraryManagerModal';

// 在组件中添加状态
const { setShowComponentManager, showComponentManager } = useComponentLibraryStore();

// 在主题按钮后添加
<button 
  className="component-library-manager-button" 
  onClick={() => setShowComponentManager(true)} 
  title="组件库管理"
>
  📦
</button>

// 在返回 JSX 的最后添加
{showComponentManager && (
  <ComponentLibraryManagerModal onClose={() => setShowComponentManager(false)} />
)}
```

---

### Task 7: 组件编辑器（复制的可视化编辑）

**Files:**
- Create: `editor/src/app/components/editor/ComponentEditor.tsx`
- Create: `editor/src/app/components/editor/ComponentEditor.css`

- [ ] **Step 1: 复制 SolarWireMode 的可视化编辑部分**

读取 `editor/src/app/components/editor-modes/SolarWireMode.tsx`，复制以下部分到新文件：

1. SolarWirePreview 组件的使用方式
2. 相关的状态管理（zoom、grid、snap 等）
3. 工具栏渲染逻辑

- [ ] **Step 2: 创建组件编辑器组件**

```typescript
// editor/src/app/components/editor/ComponentEditor.tsx

import React, { useState, useEffect } from 'react';
import { ComponentLibrary, Component } from '../../../shared/types/component';
import { useComponentLibraryStore } from '../../stores/componentLibraryStore';
import SolarWirePreview from './SolarWirePreview';
import { TabProvider, TabList, Tab } from '../ui/Tab';
import './ComponentEditor.css';

interface ComponentEditorProps {
  library: ComponentLibrary;
}

const ComponentEditor: React.FC<ComponentEditorProps> = ({ library }) => {
  const {
    selectedComponentId,
    setSelectedComponent,
    updateComponent,
    deleteComponent,
  } = useComponentLibraryStore();

  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [componentCode, setComponentCode] = useState('');
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');

  const selectedComponent = library.components.find(c => c.id === selectedComponentId) || null;

  useEffect(() => {
    if (selectedComponent) {
      setComponentCode(selectedComponent.code);
      setComponentName(selectedComponent.name);
      setComponentDescription(selectedComponent.description || '');
    }
  }, [selectedComponent]);

  const handleSave = async () => {
    if (!selectedComponent) return;
    
    await updateComponent(library.metadata.id, selectedComponent.id, {
      code: componentCode,
      name: componentName,
      description: componentDescription,
    });
  };

  const handleDelete = async () => {
    if (!selectedComponent) return;
    if (confirm('确定要删除此组件吗？')) {
      await deleteComponent(library.metadata.id, selectedComponent.id);
      setSelectedComponent(null);
    }
  };

  if (!selectedComponent) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
        <p>请选择一个组件进行编辑</p>
      </div>
    );
  }

  return (
    <div className="component-editor">
      {/* 组件属性编辑 */}
      <div className="component-editor-properties">
        <h4 style={{ margin: '0 0 12px', fontSize: '13px' }}>组件属性</h4>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            名称
          </label>
          <input
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            style={{ width: '100%', padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            描述
          </label>
          <textarea
            value={componentDescription}
            onChange={(e) => setComponentDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} style={{ padding: '6px 12px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            保存
          </button>
          <button onClick={handleDelete} style={{ padding: '6px 12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            删除
          </button>
        </div>
      </div>

      {/* 可视化/代码编辑 */}
      <div className="component-editor-content">
        <TabProvider activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as 'visual' | 'code')}>
          <div className="component-editor-tabs">
            <TabList>
              <Tab id="visual" title="可视化编辑">🎨</Tab>
              <Tab id="code" title="代码编辑">💻</Tab>
            </TabList>
          </div>

          <div className="component-editor-panel">
            {activeTab === 'visual' && (
              <SolarWirePreview
                content={componentCode}
                zoomLevel={100}
                selectionTool="select"
                showNotes={false}
                showGridProp={false}
                snapToGridProp={false}
                gridSizeProp={20}
                readOnly={false}
              />
            )}
            {activeTab === 'code' && (
              <textarea
                value={componentCode}
                onChange={(e) => setComponentCode(e.target.value)}
                style={{ width: '100%', height: '400px', fontFamily: 'Menlo, Consolas, monospace', fontSize: '12px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            )}
          </div>
        </TabProvider>
      </div>
    </div>
  );
};

export default ComponentEditor;
```

- [ ] **Step 3: 创建组件编辑器 CSS**

```css
/* editor/src/app/components/editor/ComponentEditor.css */

.component-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.component-editor-properties {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.component-editor-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-editor-tabs {
  border-bottom: 1px solid var(--border-color);
}

.component-editor-panel {
  min-height: 400px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.component-editor-panel textarea {
  width: 100%;
  min-height: 400px;
}
```

---

## 阶段四：集成与测试

### Task 8: 集成组件库面板到 SolarWireMode

**Files:**
- Modify: `editor/src/app/components/editor-modes/SolarWireMode.tsx`

- [ ] **Step 1: 在 SolarWireMode 中添加组件库状态**

```typescript
const { showComponentLibrary, setShowComponentLibrary } = useComponentLibraryStore();
```

- [ ] **Step 2: 实现拖拽组件到画布的处理函数**

```typescript
const handleDropComponentToCanvas = useCallback((component: Component, x: number, y: number) => {
  // 将组件 DSL 代码注入到当前文档
  const newContent = content + '\n\n' + component.code;
  setContent(newContent);
}, [content, setContent]);
```

- [ ] **Step 3: 在 SolarWireMode 中渲染组件库面板**

在图层面板渲染位置附近添加：

```tsx
{showComponentLibrary && (
  <div className="component-library-panel-fixed" style={{ position: 'fixed', left: '280px', top: '100px', width: '280px', height: '400px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 999 }}>
    <ComponentLibrary onDropToCanvas={handleDropComponentToCanvas} />
  </div>
)}
```

---

## 验证与测试

### 测试步骤

1. **初始化测试**：
   - 启动应用，检查组件库是否正常初始化
   - 验证默认组件库是否加载

2. **面板显示测试**：
   - 点击工具栏组件库按钮，验证面板显示/隐藏
   - 点击顶部导航组件库管理按钮，验证全屏弹窗显示

3. **拖拽测试**：
   - 从组件库拖拽组件到画布
   - 验证组件 DSL 代码正确注入到文档

4. **管理功能测试**：
   - 在管理界面选择组件库
   - 编辑组件属性和代码
   - 验证保存功能

5. **导入导出测试**：
   - 导出组件库为 .swc.json 文件
   - 导入外部组件库文件

---

## 执行顺序

建议按以下顺序执行：

1. **Task 1-4**: 基础架构（类型、状态、服务）
2. **Task 5**: 组件库面板（使用模式）
3. **Task 6**: 组件库管理功能弹窗
4. **Task 7**: 组件编辑器
5. **Task 8**: 集成测试

每个 Task 完成后应进行测试验证，确保功能正常后再继续下一个 Task。
