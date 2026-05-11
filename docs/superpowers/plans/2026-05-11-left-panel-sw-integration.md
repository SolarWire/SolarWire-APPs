# 左侧面板 SW 整合实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 SW 视图 Tab，在文件视图中为 md 文件添加 snippet badge/tooltip，选中含 snippet 的 md 时下半栏展示 snippet 列表，支持拖动分隔线。

**Architecture:** 在 fileStore 中新增 snippetsByFile 分组数据，FileTree 组件读取 badge/tooltip 数据，FileView 组件管理上下分栏布局和拖动分隔线，新增 SnippetListPanel 组件复用 SolarWireView 的 snippet 交互逻辑。

**Tech Stack:** React, Zustand, TypeScript, CSS (CSS Variables)

---

## File Structure

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 修改 | `editor/src/shared/types/app.ts` | 从 ViewType 移除 'solarwire' |
| 修改 | `editor/src/shared/types/file.ts` | 新增 SnippetInfo 类型和 FileState 扩展 |
| 修改 | `editor/src/app/stores/selectionStore.ts` | 移除 'solarwire' 视图引用 |
| 修改 | `editor/src/app/stores/fileStore.ts` | 新增 snippetsByFile 状态和 snippet 收集逻辑 |
| 修改 | `editor/src/app/stores/appStore.ts` | 无需修改（currentView 类型跟随 ViewType） |
| 修改 | `editor/src/app/components/views/ViewTabs.tsx` | 移除 solarwire Tab |
| 修改 | `editor/src/app/components/editor/FileTree.tsx` | md 文件添加 badge 和 tooltip |
| 修改 | `editor/src/app/components/editor/FileTree.css` | badge 和 tooltip 样式 |
| 修改 | `editor/src/app/components/views/FileView.tsx` | 添加下半栏和拖动分隔线 |
| 修改 | `editor/src/app/components/views/FileView.css` | 下半栏和分隔线样式 |
| 创建 | `editor/src/app/components/editor/SnippetListPanel.tsx` | snippet 列表组件 |
| 创建 | `editor/src/app/components/editor/SnippetListPanel.css` | snippet 列表样式 |
| 修改 | `editor/src/app/components/editor/MarkdownPreview.tsx` | 更新 setSelection 调用 |
| 删除 | `editor/src/app/components/views/SolarWireView.tsx` | 不再需要 |
| 删除 | `editor/src/app/components/views/SolarWireView.css` | 不再需要 |

---

### Task 1: 移除 ViewType 中的 'solarwire'

**Files:**
- Modify: `editor/src/shared/types/app.ts:1`

- [ ] **Step 1: 修改 ViewType 类型定义**

将 `app.ts` 第 1 行：

```typescript
export type ViewType = 'file' | 'solarwire' | 'componentLibraryManager';
```

改为：

```typescript
export type ViewType = 'file' | 'componentLibraryManager';
```

- [ ] **Step 2: 验证编译**

Run: `cd editor && npx tsc --noEmit 2>&1 | head -30`

预期：出现引用 'solarwire' 的类型错误，这是正常的，后续 Task 会修复。

---

### Task 2: 更新 selectionStore 移除 'solarwire' 视图引用

**Files:**
- Modify: `editor/src/app/stores/selectionStore.ts`

- [ ] **Step 1: 修改 SelectedItem 和 SelectionState 类型**

将 `selectionStore.ts` 全部内容替换为：

```typescript
import { create } from 'zustand';

export interface SelectedItem {
  view: 'file';
  path: string;
  snippetId?: string;
}

export interface SelectionState {
  selectedItem: SelectedItem | null;
  setSelection: (view: 'file', path: string, snippetId?: string) => void;
  getSelectionForView: (view: 'file') => SelectedItem | null;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedItem: null,
  setSelection: (view: 'file', path: string, snippetId?: string) => {
    set({ selectedItem: { view, path, snippetId } });
  },
  getSelectionForView: (view: 'file') => {
    const { selectedItem } = get();
    return selectedItem && selectedItem.view === view ? selectedItem : null;
  },
  clearSelection: () => {
    set({ selectedItem: null });
  },
}));
```

---

### Task 3: 更新 MarkdownPreview 中的 setSelection 调用

**Files:**
- Modify: `editor/src/app/components/editor/MarkdownPreview.tsx:40-79`

- [ ] **Step 1: 修改 handleSolarWireEditClick 中的 setSelection 和 setCurrentView 调用**

将 `MarkdownPreview.tsx` 中 `handleSolarWireEditClick` 函数体内的：

```typescript
setCurrentView('solarwire')
```

改为：

```typescript
setCurrentView('file')
```

将以下三处 `setSelection('solarwire', ...)` 调用：

```typescript
setSelection('solarwire', matchingSnippet.sourceFile, matchingSnippet.id)
```

```typescript
setSelection('solarwire', selectedFile.path)
```

```typescript
setSelection('solarwire', selectedFile.path)
```

全部改为 `'file'`：

```typescript
setSelection('file', matchingSnippet.sourceFile, matchingSnippet.id)
```

```typescript
setSelection('file', selectedFile.path)
```

```typescript
setSelection('file', selectedFile.path)
```

---

### Task 4: 扩展 fileStore 添加 snippetsByFile 状态

**Files:**
- Modify: `editor/src/shared/types/file.ts`
- Modify: `editor/src/app/stores/fileStore.ts`

- [ ] **Step 1: 在 file.ts 中添加 SnippetInfo 类型和扩展 FileState**

在 `file.ts` 的 `SolarWireSnippet` 接口后添加：

```typescript
export interface SnippetInfo {
  id: string;
  snippetIndex: number;
  title: string;
}
```

在 `FileState` 接口中，在 `refreshKey: number;` 后添加：

```typescript
snippetsByFile: Record<string, SolarWireSnippet[]>;
snippetInfosByFile: Record<string, SnippetInfo[]>;
setSnippetsByFile: (data: Record<string, SolarWireSnippet[]>) => void;
setSnippetInfosByFile: (data: Record<string, SnippetInfo[]>) => void;
```

- [ ] **Step 2: 在 fileStore.ts 中添加状态初始值和 setter**

在 `fileStore.ts` 的 `create<FileState>()((set, get) => ({` 内部，在 `refreshKey: 0,` 后添加：

```typescript
snippetsByFile: {},
snippetInfosByFile: {},
```

在 `setCurrentPath` setter 后添加：

```typescript
setSnippetsByFile: (data: Record<string, SolarWireSnippet[]>) => set({ snippetsByFile: data }),
setSnippetInfosByFile: (data: Record<string, SnippetInfo[]>) => set({ snippetInfosByFile: data }),
```

在 `fileStore.ts` 顶部的 import 中添加 `SnippetInfo`：

```typescript
import { FileState, FileNode, SolarWireSnippet, SnippetInfo } from '../../shared/types/file';
```

---

### Task 5: 更新 ViewTabs 移除 solarwire Tab

**Files:**
- Modify: `editor/src/app/components/views/ViewTabs.tsx`

- [ ] **Step 1: 移除 solarwire 视图配置**

将 `ViewTabs.tsx` 中的 views 数组：

```typescript
const views: { type: ViewType; emoji: string; title: string }[] = [
  { type: 'file', emoji: '📁', title: '文件管理器' },
  { type: 'solarwire', emoji: '🎨', title: 'SolarWire' },
  { type: 'componentLibraryManager', emoji: '🧩', title: '组件库管理' },
];
```

改为：

```typescript
const views: { type: ViewType; emoji: string; title: string }[] = [
  { type: 'file', emoji: '📁', title: '文件管理器' },
  { type: 'componentLibraryManager', emoji: '🧩', title: '组件库管理' },
];
```

- [ ] **Step 2: 移除 SolarWireView import 和 renderViewContent 中的 case**

移除 import 行：

```typescript
import SolarWireView from './SolarWireView';
```

将 `renderViewContent` 函数改为：

```typescript
const renderViewContent = () => {
  switch (currentView) {
    case 'file':
      return <FileView />;
    case 'componentLibraryManager':
      return <ComponentLibraryManagerView />;
    default:
      return null;
  }
};
```

---

### Task 6: 创建 SnippetListPanel 组件

**Files:**
- Create: `editor/src/app/components/editor/SnippetListPanel.tsx`
- Create: `editor/src/app/components/editor/SnippetListPanel.css`

- [ ] **Step 1: 创建 SnippetListPanel.tsx**

```tsx
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFileStore } from '../../stores/fileStore';
import { SolarWireSnippet } from '../../../shared/types/file';
import { useSelectionStore } from '../../stores/selectionStore';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import { replaceSolarWireSnippetInMarkdown } from '../../stores/fileStore';
import './SnippetListPanel.css';

interface SnippetListPanelProps {
  sourceFilePath: string;
  fileName: string;
}

const SnippetListPanel: React.FC<SnippetListPanelProps> = ({ sourceFilePath, fileName }) => {
  const { snippetsByFile, openSolarWireSnippet, currentSnippet, fullFileContent, syncFullFileContent } = useFileStore();
  const { setSelection } = useSelectionStore();
  const snippets = snippetsByFile[sourceFilePath] || [];

  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuSnippet, setContextMenuSnippet] = useState<SolarWireSnippet | null>(null);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(async (snippet: SolarWireSnippet) => {
    setSelection('file', snippet.sourceFile, snippet.id);
    if (openSolarWireSnippet) {
      await openSolarWireSnippet(snippet);
    }
  }, [openSolarWireSnippet, setSelection]);

  const isSelected = useCallback((snippet: SolarWireSnippet): boolean => {
    return currentSnippet?.id === snippet.id;
  }, [currentSnippet]);

  const handleContextMenu = useCallback((e: React.MouseEvent, snippet: SolarWireSnippet) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuSnippet(snippet);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!contextMenuSnippet) return;
    const declarations = extractDeclarations(contextMenuSnippet.code);
    setRenameValue(declarations['title'] || '');
    setRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [contextMenuSnippet]);

  const handleRenameConfirm = useCallback(async () => {
    if (!contextMenuSnippet || !renameValue.trim()) {
      setRenaming(false);
      return;
    }

    const newTitle = renameValue.trim();
    const code = contextMenuSnippet.code;
    let newCode: string;

    const declarations = extractDeclarations(code);
    if (declarations['title']) {
      newCode = code.replace(/!title=.+/, `!title=${newTitle}`);
    } else {
      newCode = `!title=${newTitle}\n` + code;
    }

    if (contextMenuSnippet.snippetIndex !== undefined) {
      const updatedFullContent = replaceSolarWireSnippetInMarkdown(
        fullFileContent,
        contextMenuSnippet.snippetIndex,
        newCode
      );
      syncFullFileContent(updatedFullContent);

      const api = (window as any).api;
      if (api && typeof api.writeFile === 'function') {
        await api.writeFile(contextMenuSnippet.sourceFile, updatedFullContent);
      }
    }

    setRenaming(false);
  }, [contextMenuSnippet, renameValue, fullFileContent, syncFullFileContent]);

  const handleCopyPath = useCallback(() => {
    if (!contextMenuSnippet) return;
    navigator.clipboard.writeText(contextMenuSnippet.sourceFile);
  }, [contextMenuSnippet]);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => [
    { type: 'item', label: '重命名标题', icon: '✏️', onClick: handleRename },
    { type: 'separator' },
    { type: 'item', label: '复制文件路径', icon: '📋', onClick: handleCopyPath },
  ], [handleRename, handleCopyPath]);

  const getSnippetTitle = (snippet: SolarWireSnippet): string => {
    const declarations = extractDeclarations(snippet.code);
    return declarations['title'] || '';
  };

  if (snippets.length === 0) return null;

  return (
    <div className="snippet-list-panel">
      <div className="snippet-list-header">
        📝 {fileName} · SolarWire 页面
      </div>
      <div className="snippet-list-items">
        {snippets.map((snippet) => {
          const title = getSnippetTitle(snippet);
          const index = snippet.snippetIndex || 1;
          const displayText = title ? `#${index} ${title}` : `#${index}`;

          return (
            <div
              key={snippet.id}
              className={`snippet-list-item ${isSelected(snippet) ? 'snippet-list-item-selected' : ''}`}
              onClick={() => handleClick(snippet)}
              onContextMenu={(e) => handleContextMenu(e, snippet)}
            >
              <span className="snippet-list-item-icon">⚡</span>
              <span className="snippet-list-item-text">{displayText}</span>
            </div>
          );
        })}
      </div>

      <ContextMenu
        visible={contextMenuVisible}
        x={contextMenuPos.x}
        y={contextMenuPos.y}
        items={contextMenuItems}
        onClose={() => setContextMenuVisible(false)}
      />

      {renaming && createPortal(
        <div className="snippet-rename-overlay" onClick={() => setRenaming(false)}>
          <div className="snippet-rename-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="snippet-rename-title">重命名标题</h3>
            <input
              ref={renameInputRef}
              className="snippet-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') setRenaming(false);
              }}
              placeholder="输入新标题"
            />
            <div className="snippet-rename-actions">
              <button className="snippet-rename-btn snippet-rename-btn-cancel" onClick={() => setRenaming(false)}>取消</button>
              <button className="snippet-rename-btn snippet-rename-btn-confirm" onClick={handleRenameConfirm}>确认</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

function extractDeclarations(code: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const regex = /!(\w+)=(.+)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    declarations[match[1]] = value;
  }
  return declarations;
}

export default SnippetListPanel;
```

- [ ] **Step 2: 创建 SnippetListPanel.css**

```css
.snippet-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.snippet-list-header {
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.snippet-list-items {
  flex: 1;
  overflow-y: auto;
  padding: 4px 6px;
}

.snippet-list-item {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  transition: background 0.1s;
}

.snippet-list-item:hover {
  background: var(--accent-opacity-10);
}

.snippet-list-item-selected {
  background: var(--accent-opacity-35);
  color: var(--accent-color);
}

.snippet-list-item-icon {
  color: var(--accent-color, #f0c040);
  margin-right: 6px;
  flex-shrink: 0;
  font-size: 11px;
}

.snippet-list-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
}

.snippet-list-item-selected .snippet-list-item-text {
  color: var(--accent-color);
}

.snippet-rename-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.snippet-rename-dialog {
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #444);
  border-radius: 8px;
  padding: 20px;
  min-width: 320px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.snippet-rename-title {
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.snippet-rename-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #555);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-tertiary, #2a2a2a);
  color: var(--text-primary);
  box-sizing: border-box;
  margin-bottom: 16px;
}

.snippet-rename-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.snippet-rename-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.snippet-rename-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid var(--border-color, #555);
  transition: background 0.15s;
}

.snippet-rename-btn-cancel {
  background: var(--bg-tertiary, #2a2a2a);
  color: var(--text-primary);
}

.snippet-rename-btn-cancel:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.snippet-rename-btn-confirm {
  background: var(--accent-color, #0078d4);
  color: #fff;
  border-color: var(--accent-color, #0078d4);
}

.snippet-rename-btn-confirm:hover {
  opacity: 0.9;
}
```

---

### Task 7: FileTree 添加 badge 和 tooltip

**Files:**
- Modify: `editor/src/app/components/editor/FileTree.tsx`
- Modify: `editor/src/app/components/editor/FileTree.css`

- [ ] **Step 1: 修改 FileTree.tsx 添加 badge 和 tooltip**

在 `FileTree.tsx` 顶部添加 import：

```typescript
import { useFileStore } from '../../stores/fileStore';
import { SnippetInfo } from '../../../shared/types/file';
```

修改 `TreeItemProps` 接口，添加：

```typescript
snippetInfosByFile: Record<string, SnippetInfo[]>;
```

在 `TreeItem` 组件内部，在 `const isSelected = ...` 行后添加：

```typescript
const isMarkdown = node.type === 'file' && /\.(md|markdown)$/i.test(node.name);
const snippetInfos = isMarkdown ? snippetInfosByFile[node.path] : undefined;
const snippetCount = snippetInfos ? snippetInfos.length : 0;
const [showTooltip, setShowTooltip] = useState(false);
```

在 `TreeItem` 组件的 return JSX 中，将：

```tsx
<span className="tree-item-name">{node.name}</span>
```

改为：

```tsx
<span className="tree-item-name">{node.name}</span>
{snippetCount > 0 && (
  <span
    className="tree-item-badge"
    onMouseEnter={() => setShowTooltip(true)}
    onMouseLeave={() => setShowTooltip(false)}
  >
    ⚡{snippetCount}
    {showTooltip && (
      <span className="tree-item-badge-tooltip">
        {snippetCount} 个页面: {snippetInfos!.map(s => `#${s.snippetIndex} ${s.title || '未命名'}`).join(', ')}
      </span>
    )}
  </span>
)}
```

修改 `FileTreeProps` 接口，添加：

```typescript
snippetInfosByFile: Record<string, SnippetInfo[]>;
```

修改 `FileTree` 组件，将 `snippetInfosByFile` 传递给 `TreeItem`：

在 `<TreeItem` 调用中添加 prop `snippetInfosByFile={snippetInfosByFile}`。

在 `TreeItem` 递归调用中也添加 `snippetInfosByFile={snippetInfosByFile}`。

在 `FileTree` 组件顶部添加：

```typescript
const snippetInfosByFile = useFileStore(state => state.snippetInfosByFile);
```

并移除 `FileTreeProps` 中的 `snippetInfosByFile` 属性（改为从 store 直接读取）。

同步移除 `TreeItemProps` 中的 `snippetInfosByFile` 属性，改为从 store 直接读取：

在 `TreeItem` 组件顶部添加：

```typescript
const snippetInfosByFile = useFileStore(state => state.snippetInfosByFile);
```

- [ ] **Step 2: 添加 badge 和 tooltip CSS**

在 `FileTree.css` 末尾添加：

```css
.tree-item-badge {
  margin-left: auto;
  padding-left: 8px;
  font-size: 10px;
  color: var(--accent-color, #f0c040);
  border: 1px solid var(--accent-opacity-35, rgba(240, 192, 64, 0.35));
  border-radius: 3px;
  padding: 0 5px;
  cursor: default;
  position: relative;
  flex-shrink: 0;
  line-height: 18px;
}

.tree-item-badge-tooltip {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 4px;
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
```

---

### Task 8: FileView 添加下半栏和拖动分隔线

**Files:**
- Modify: `editor/src/app/components/views/FileView.tsx`
- Modify: `editor/src/app/components/views/FileView.css`

- [ ] **Step 1: 修改 FileView.tsx 添加 snippet 收集、下半栏和拖动分隔线**

在 `FileView.tsx` 顶部添加 import：

```typescript
import SnippetListPanel from '../editor/SnippetListPanel';
import { SolarWireSnippet, SnippetInfo } from '../../../shared/types/file';
```

在 `FileView` 组件内部，在现有 state 声明后添加：

```typescript
const [splitRatio, setSplitRatio] = useState(0.55);
const [isDragging, setIsDragging] = useState(false);
const containerRef = useRef<HTMLDivElement>(null);
const { snippetsByFile, setSnippetsByFile, snippetInfosByFile, setSnippetInfosByFile } = useFileStore();
```

在 `FileView` 组件内添加 snippet 收集 effect（在 `handleRefresh` 后）：

```typescript
useEffect(() => {
  const collectSnippets = async () => {
    if (!currentPath) {
      setSnippetsByFile({});
      setSnippetInfosByFile({});
      return;
    }
    try {
      const api = (window as any).api;
      if (api && typeof api.collectSolarWireSnippets === 'function') {
        const snippets: SolarWireSnippet[] = await api.collectSolarWireSnippets(currentPath);
        const byFile: Record<string, SolarWireSnippet[]> = {};
        const infosByFile: Record<string, SnippetInfo[]> = {};
        for (const snippet of snippets) {
          if (!byFile[snippet.sourceFile]) {
            byFile[snippet.sourceFile] = [];
            infosByFile[snippet.sourceFile] = [];
          }
          byFile[snippet.sourceFile].push(snippet);
          const declarations = extractDeclarations(snippet.code);
          infosByFile[snippet.sourceFile].push({
            id: snippet.id,
            snippetIndex: snippet.snippetIndex || 1,
            title: declarations['title'] || '',
          });
        }
        setSnippetsByFile(byFile);
        setSnippetInfosByFile(infosByFile);
      }
    } catch (err) {
      console.error('Failed to collect solarwire snippets:', err);
      setSnippetsByFile({});
      setSnippetInfosByFile({});
    }
  };
  collectSnippets();
}, [currentPath, refreshKey]);
```

在 `FileView` 组件内添加拖动处理函数：

```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  setIsDragging(true);
}, []);

useEffect(() => {
  if (!isDragging) return;
  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    setSplitRatio(Math.min(0.85, Math.max(0.2, ratio)));
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging]);
```

添加辅助函数（在组件内）：

```typescript
function extractDeclarations(code: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const regex = /!(\w+)=(.+)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    declarations[match[1]] = value;
  }
  return declarations;
}
```

计算下半栏是否需要显示：

```typescript
const selectedMdPath = selectedFile?.path || '';
const hasSnippets = selectedMdPath && (snippetsByFile[selectedMdPath]?.length || 0) > 0;
```

修改 `FileView` 的 return JSX，将整个内容包裹在带 ref 的容器中，并在文件树和下半栏之间添加分隔线：

将原来的：

```tsx
<div className="file-view-container" onContextMenu={handleBlankContextMenu}>
  <div className="file-view-header">
    ...
  </div>
  <Scrollbar className="file-view-scrollbar">
    <div className="file-view">
      {renderFileTree()}
    </div>
  </Scrollbar>
  ...modals...
</div>
```

改为：

```tsx
<div className="file-view-container" onContextMenu={handleBlankContextMenu} ref={containerRef}>
  <div className="file-view-header">
    ...
  </div>
  <div className="file-view-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <Scrollbar className="file-view-scrollbar" style={{ flex: hasSnippets ? splitRatio : 1 }}>
      <div className="file-view">
        {renderFileTree()}
      </div>
    </Scrollbar>
    {hasSnippets && (
      <>
        <div
          className="file-view-splitter"
          onMouseDown={handleMouseDown}
        >
          <span className="file-view-splitter-handle">⋯</span>
        </div>
        <div className="file-view-snippet-panel" style={{ flex: 1 - splitRatio }}>
          <SnippetListPanel
            sourceFilePath={selectedMdPath}
            fileName={selectedFile?.name || ''}
          />
        </div>
      </>
    )}
  </div>
  ...modals...
</div>
```

注意：`<Scrollbar>` 组件需要确认是否支持 `style` prop。如果不支持，改用外层 div 包裹并设置 flex。

- [ ] **Step 2: 添加下半栏和分隔线 CSS**

在 `FileView.css` 末尾添加：

```css
.file-view-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.file-view-splitter {
  height: 4px;
  background: var(--border-color);
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.file-view-splitter:hover {
  background: var(--accent-color);
}

.file-view-splitter-handle {
  color: var(--text-muted);
  font-size: 8px;
  line-height: 1;
  pointer-events: none;
}

.file-view-snippet-panel {
  min-height: 80px;
  overflow: hidden;
  border-top: none;
}
```

---

### Task 9: 删除 SolarWireView 文件

**Files:**
- Delete: `editor/src/app/components/views/SolarWireView.tsx`
- Delete: `editor/src/app/components/views/SolarWireView.css`

- [ ] **Step 1: 删除文件**

删除 `SolarWireView.tsx` 和 `SolarWireView.css`。

---

### Task 10: 编译验证和清理

- [ ] **Step 1: 运行 TypeScript 编译检查**

Run: `cd editor && npx tsc --noEmit`

预期：无类型错误。如果有错误，根据错误信息修复。

- [ ] **Step 2: 运行 lint 检查**

Run: `cd editor && npx eslint src/app/components/editor/SnippetListPanel.tsx src/app/components/views/ViewTabs.tsx src/app/components/editor/FileTree.tsx src/app/components/views/FileView.tsx src/app/stores/fileStore.ts src/app/stores/selectionStore.ts src/shared/types/app.ts src/shared/types/file.ts src/app/components/editor/MarkdownPreview.tsx --max-warnings=0 2>&1 | head -50`

预期：无 lint 错误。如果有，修复。

- [ ] **Step 3: 启动开发服务器验证**

Run: `cd editor && npm run dev`

手动验证：
1. 左侧面板只显示「文件」和「组件库」两个 Tab
2. md 文件右侧显示 ⚡ badge
3. hover badge 显示 tooltip
4. 点击含 snippet 的 md 文件，下半栏出现 snippet 列表
5. 点击 snippet 打开编辑模式
6. 拖动分隔线调整上下比例
7. 点击非 md 文件，下半栏隐藏
