# SolarWireToolbar 统一工具栏实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将工具栏抽取为独立组件 `SolarWireToolbar`，实现工具栏与编辑器的解耦，提高代码可维护性和可复用性。

**Architecture:** 创建独立的 `SolarWireToolbar` 组件，接受 props 回调而非直接依赖全局 store。状态管理逻辑留在使用者（SolarWireVisualEditor）中。删除从未被使用的 TopMenuBar 中的 SolarWireToolbar。

**Tech Stack:** React, TypeScript, CSS

---

## 文件结构

```
components/toolbar/
├── SolarWireToolbar.tsx      # Create: 统一工具栏组件
├── SolarWireToolbar.css      # Create: 工具栏样式

Modified:
├── SolarWireVisualEditor.tsx # Modify: 使用新的 SolarWireToolbar 替代内嵌工具栏
├── TopMenuBar.tsx            # Modify: 删除未使用的 SolarWireToolbar
```

---

## Task 1: 创建 SolarWireToolbar 组件

**Files:**
- Create: `src/app/components/toolbar/SolarWireToolbar.tsx`
- Create: `src/app/components/toolbar/SolarWireToolbar.css`

- [ ] **Step 1: 创建 SolarWireToolbar.tsx**

```tsx
import React from 'react';
import ElementLibrary from '../editor/ElementLibrary';
import { SelectionTool } from '../../stores/solarWireStore';
import './SolarWireToolbar.css';

type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';

interface ToolbarState {
  showLayerPanel: boolean;
  showComponentLibrary: boolean;
  showNotes: boolean;
  snapToGrid: boolean;
  zoomLevel: number;
  isPanMode: boolean;
  isSpacePressed: boolean;
  selectionTool: SelectionTool;
  selectedCount: number;
}

interface ToolbarCallbacks {
  onToggleLayerPanel: () => void;
  onToggleComponentLibrary: () => void;
  onToggleNotes: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTogglePanMode: () => void;
  onSelectTool: (tool: SelectionTool) => void;
  onBringToFront: () => void;
  onAlign: (type: AlignmentType) => void;
}

interface SolarWireToolbarProps {
  state: ToolbarState;
  callbacks: ToolbarCallbacks;
}

const selectionTools = [
  { id: 'select' as const, label: '点选', icon: '🖱️', description: '点击选中元素，Shift+点击切换选中状态' },
  { id: 'box-include' as const, label: '包含框选', icon: '⬚', description: '完全包含在框内的元素才会被选中' },
  { id: 'box-intersect' as const, label: '交叉框选', icon: '⬛', description: '与框相交的元素都会被选中' }
];

const SolarWireToolbar: React.FC<SolarWireToolbarProps> = ({ state, callbacks }) => {
  const {
    showLayerPanel, showComponentLibrary, showNotes, snapToGrid,
    zoomLevel, isPanMode, isSpacePressed, selectionTool, selectedCount
  } = state;
  const {
    onToggleLayerPanel, onToggleComponentLibrary, onToggleNotes,
    onToggleSnap, onZoomIn, onZoomOut, onTogglePanMode, onSelectTool,
    onBringToFront, onAlign
  } = callbacks;

  return (
    <div className="solarwire-toolbar">
      <div className="toolbar-section sidebar-section">
        <button
          className={`unified-tool-button layers-toggle-button ${showLayerPanel ? 'active' : ''}`}
          onClick={onToggleLayerPanel}
          title="Toggle Layers Panel"
        >
          ☰
        </button>
        <button
          className={`unified-tool-button component-library-toggle-button ${showComponentLibrary ? 'active' : ''}`}
          onClick={onToggleComponentLibrary}
          title="Toggle Component Library"
        >
          📦
        </button>
        <button
          className={`unified-tool-button note-toggle-button ${showNotes ? 'active' : ''}`}
          onClick={onToggleNotes}
          title={showNotes ? 'Hide Notes' : 'Show Notes'}
        >
          {showNotes ? '👁️' : '🙈'}
        </button>
        <button
          className={`unified-tool-button snap-toggle-button ${snapToGrid ? 'active' : ''}`}
          onClick={onToggleSnap}
          title={snapToGrid ? 'Disable Snap' : 'Enable Snap'}
        >
          🧲
        </button>
        <div className="zoom-controls">
          <button className="zoom-button" onClick={onZoomOut}>-</button>
          <span className="zoom-label">{zoomLevel}%</span>
          <button className="zoom-button" onClick={onZoomIn}>+</button>
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section pan-section">
        <button
          className={`unified-tool-button pan-tool-button ${(isPanMode || isSpacePressed) ? 'active' : ''}`}
          onClick={onTogglePanMode}
          title="Pan Mode: Hold space or click to toggle"
        >
          <span className="tool-icon">👆</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section selection-section">
        <div className="selection-tools">
          {selectionTools.map(tool => (
            <button
              key={tool.id}
              className={`unified-tool-button selection-tool-button ${selectionTool === tool.id && !isPanMode && !isSpacePressed ? 'active' : ''}`}
              onClick={() => {
                onSelectTool(tool.id);
                if (isPanMode) onTogglePanMode();
              }}
              title={tool.description}
            >
              <span className="tool-icon">{tool.icon}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section actions-section">
        <button className="unified-tool-button action-button" onClick={onBringToFront} disabled={selectedCount === 0} title="Bring to Front">
          <span className="tool-icon">⬆️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section align-section">
        <button className="unified-tool-button action-button" onClick={() => onAlign('left')} disabled={selectedCount < 2} title="Align Left">
          <span className="tool-icon">⬅️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('center-h')} disabled={selectedCount < 2} title="Align Center Horizontally">
          <span className="tool-icon">↔️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('right')} disabled={selectedCount < 2} title="Align Right">
          <span className="tool-icon">➡️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('top')} disabled={selectedCount < 2} title="Align Top">
          <span className="tool-icon">⬆️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('center-v')} disabled={selectedCount < 2} title="Align Center Vertically">
          <span className="tool-icon">↕️</span>
        </button>
        <button className="unified-tool-button action-button" onClick={() => onAlign('bottom')} disabled={selectedCount < 2} title="Align Bottom">
          <span className="tool-icon">⬇️</span>
        </button>
      </div>
      <div className="toolbar-divider"></div>
      <div className="toolbar-section elements-section">
        <ElementLibrary compact />
      </div>
    </div>
  );
};

export default SolarWireToolbar;
export type { AlignmentType, ToolbarState, ToolbarCallbacks };
```

- [ ] **Step 2: 创建 SolarWireToolbar.css**

从 `SolarWireVisualEditor.css` 中提取工具栏相关样式，创建新文件：

```css
.solarwire-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  z-index: 100;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 4px;
}

.unified-tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.unified-tool-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.unified-tool-button.active {
  background: var(--bg-active);
  color: var(--accent-color);
}

.unified-tool-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.unified-tool-button:disabled:hover {
  background: transparent;
  color: var(--text-secondary);
}

.tool-icon {
  font-size: 16px;
  line-height: 1;
}

.selection-tools {
  display: flex;
  gap: 2px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.zoom-button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-button:hover {
  background: var(--bg-hover);
}

.zoom-label {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
}
```

---

## Task 2: 重构 SolarWireVisualEditor 使用新的 SolarWireToolbar

**Files:**
- Modify: `src/app/components/editor/SolarWireVisualEditor.tsx` (L313-408 替换为新组件)

- [ ] **Step 1: 添加 SolarWireToolbar 导入**

在 `SolarWireVisualEditor.tsx` 顶部添加：
```tsx
import SolarWireToolbar from '../toolbar/SolarWireToolbar';
import { SelectionTool } from '../../stores/solarWireStore';
```

- [ ] **Step 2: 准备传递给工具栏的 state 和 callbacks**

在 `SolarWireVisualEditor` 组件内，在 return 之前添加：

```tsx
const toolbarState = {
  showLayerPanel,
  showComponentLibrary,
  showNotes,
  snapToGrid,
  zoomLevel,
  isPanMode,
  isSpacePressed,
  selectionTool,
  selectedCount: selectedElements.length
};

const toolbarCallbacks = {
  onToggleLayerPanel: () => setShowLayerPanel(!showLayerPanel),
  onToggleComponentLibrary: () => setShowComponentLibrary(!showComponentLibrary),
  onToggleNotes: () => setShowNotes(!showNotes),
  onToggleSnap: () => setSnapToGrid(!snapToGrid),
  onZoomIn: handleZoomIn,
  onZoomOut: handleZoomOut,
  onTogglePanMode: () => setIsPanMode(!isPanMode),
  onSelectTool: (tool: SelectionTool) => {
    setSelectionTool(tool);
    if (isPanMode) setIsPanMode(false);
  },
  onBringToFront: handleBringToFront,
  onAlign: handleAlign
};
```

- [ ] **Step 3: 替换内嵌工具栏 JSX**

将 L313-408 的内嵌工具栏：
```tsx
<div className="solarwire-toolbar">
  <div className="toolbar-section sidebar-section">
    ... (所有按钮)
  </div>
  ...
</div>
```

替换为：
```tsx
<SolarWireToolbar state={toolbarState} callbacks={toolbarCallbacks} />
```

---

## Task 3: 删除 TopMenuBar 中未使用的 SolarWireToolbar

**Files:**
- Modify: `src/app/components/layout/TopMenuBar.tsx`

- [ ] **Step 1: 删除 SolarWireToolbar 定义和未使用的导入**

删除 L15-235 的 `SolarWireToolbar` 组件定义和所有相关导入：
- 删除 `SolarWireToolbarProps` interface
- 删除 `SolarWireToolbar` 组件
- 删除 `bringElementsToFront, alignElements` 导入
- 删除 `saveImageToAssetsDir, getFileDir` 导入
- 删除 `ElementLibrary` 导入（如果仅用于 SolarWireToolbar）

保留 TopMenuBar 组件本身（它还包含其他功能如保存、打开等）。

---

## Task 4: 验证 TypeScript 编译

- [ ] **Step 1: 运行 TypeScript 编译检查**

```bash
cd "c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor"
npx tsc --noEmit
```

预期：无错误输出

---

## Task 5: 验证功能正常

- [ ] **Step 1: 启动开发服务器**

```bash
cd "c:\Users\Mayn\Desktop\Trae_Project\Solarwire\SolarWire-APP\editor"
npm run dev
```

- [ ] **Step 2: 验证 SolarWireMode 工具栏正常工作**
- 验证图层面板切换
- 验证组件库面板切换
- 验证笔记显示切换
- 验证网格吸附切换
- 验证缩放功能
- 验证平移模式
- 验证选择工具切换
- 验证置顶功能
- 验证对齐功能

- [ ] **Step 3: 验证 ComponentEditPanel 工具栏正常工作**
- 切换到组件库管理
- 选择一个组件
- 切换到可视化编辑 tab
- 验证工具栏所有功能

---

## 自检清单

- [ ] SolarWireToolbar 组件只接收 props，不直接使用全局 store
- [ ] SolarWireVisualEditor 使用新的 SolarWireToolbar 组件
- [ ] TopMenuBar 中的 SolarWireToolbar 和相关无用代码已删除
- [ ] TypeScript 编译无错误
- [ ] 工具栏所有按钮功能正常工作
