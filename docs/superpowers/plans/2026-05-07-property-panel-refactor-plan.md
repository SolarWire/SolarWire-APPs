# 属性面板重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 SolarWire 可视化编辑器的属性面板，修复 P1-P17 所有问题，建立属性名双层显示 + Tooltip 学习系统，统一 ColorPicker 组件，拆分 PropertyPanel 职责，实现多选批量编辑。

**Architecture:** 以组件化为核心，将 PropertyPanel 拆分为独立子组件（PropertyRow、PropertyPair、ShadowEditor、PaddingEditor、PropertyTooltip），统一 ColorPicker 到 ui/ 目录，引入属性元数据系统支持双层标签和 tooltip。

**Tech Stack:** React 18 + TypeScript + CSS Modules + Zustand

---

## 变更文件总览

| 动作 | 文件路径 | 变更说明 |
|------|----------|----------|
| 创建 | `editor/src/app/components/ui/ColorPicker.tsx` | 统一 ColorPicker 组件 |
| 创建 | `editor/src/app/components/ui/ColorPicker.css` | ColorPicker 样式 |
| 创建 | `editor/src/app/components/editor/property/PropertyTooltip.tsx` | Tooltip 浮层组件 |
| 创建 | `editor/src/app/components/editor/property/PropertyTooltip.css` | Tooltip 样式 |
| 创建 | `editor/src/app/components/editor/property/PaddingEditor.tsx` | Padding 折叠编辑器 |
| 创建 | `editor/src/app/components/editor/property/PaddingEditor.css` | PaddingEditor 样式 |
| 修改 | `editor/src/app/components/editor/PropertyPanel.tsx` | 精简 + 修复所有问题 |
| 修改 | `editor/src/app/components/editor/PropertyPanel.css` | 清理 + 扩展样式 |
| 修改 | `editor/src/app/components/editor/property/PropertyRow.tsx` | 支持双层标签 |
| 修改 | `editor/src/app/components/editor/property/PropertyPair.tsx` | 支持双层标签 |
| 修改 | `editor/src/app/components/editor/hooks/useElementProps.ts` | 统一布尔判断 + 提取 text-color |
| 修改 | `editor/src/app/components/editor/property/ShadowEditor.tsx` | Props 接口扩展 |
| 修改 | `editor/src/shared/utils/attribute-updater.ts` | 支持 text-color 属性 |
| 删除 | `editor/src/app/components/editor/ColorPicker.tsx` | 废弃 |
| 删除 | `editor/src/app/components/editor/ColorPicker.css` | 废弃 |

---

## Task 1: 创建统一 ColorPicker 组件

**Files:**
- Create: `editor/src/app/components/ui/ColorPicker.tsx`
- Create: `editor/src/app/components/ui/ColorPicker.css`
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx:9`（更新 import）
- Modify: `editor/src/app/components/editor/PropertyPanel.css`（移除旧 ColorPicker 样式）
- Delete: `editor/src/app/components/editor/ColorPicker.tsx`
- Delete: `editor/src/app/components/editor/ColorPicker.css`

**依赖:** 无

---

- [ ] **Step 1: 创建 ColorPicker.tsx 骨架**

参考设计文档 3.3 节，实现以下 API：

```typescript
interface ColorPickerProps {
  label: string;       // 标签文本
  value: string;       // 当前颜色值，如 '#ffffff'
  onChange: (color: string) => void;
  className?: string;
}
```

组件内部结构：
- `inputRef`: 指向原生 `<input type="color">` 的 ref（用于触发取色器）
- `showPreset`: 预设面板展开状态
- `presetPosition`: 预设面板位置 `{ x, y }`
- `colorInput`: HEX 输入框的值（controlled）
- `lastValidColor`: 上一个有效颜色（用于校验回退）

- [ ] **Step 2: 实现颜色预览块 + HEX 输入**

渲染逻辑：
```tsx
<div className="color-picker">
  <div
    className="color-preview"
    style={{ backgroundColor: value }}
    onClick={() => inputRef.current?.click()}
    title="点击选择颜色"
  />
  <input
    type="color"
    ref={inputRef}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ display: 'none' }}
  />
  <input
    type="text"
    className="hex-input"
    value={colorInput}
    onChange={(e) => setColorInput(e.target.value)}
    onBlur={() => {
      const hex = colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        onChange(hex);
      } else {
        setColorInput(value);
      }
    }}
  />
  <button
    className="preset-toggle"
    onClick={togglePreset}
    title="预设颜色"
  >▼</button>
</div>
```

- [ ] **Step 3: 实现预设面板 + createPortal + 边界检测**

预设面板渲染：
```tsx
const presetColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#808080', '#c0c0c0',
  '#800000', '#008000', '#000080', '#808000', '#800080',
  '#008080', '#ffc0cb', '#f0e68c', '#add8e6', '#90ee90',
];

const presets = useSettingsStore(s => s.colorPresets) || presetColors;

useEffect(() => {
  if (!showPreset) return;
  const rect = triggerRef.current.getBoundingClientRect();
  const panelWidth = 240;
  const panelHeight = 200;
  let x = rect.right + 8;
  let y = rect.top;
  if (x + panelWidth > window.innerWidth) x = rect.left - panelWidth - 8;
  if (y + panelHeight > window.innerHeight) y = window.innerHeight - panelHeight - 8;
  setPresetPosition({ x, y });
}, [showPreset]);

return createPortal(
  <div
    className="color-preset-panel"
    style={{ left: presetPosition.x, top: presetPosition.y }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* 预设颜色网格 */}
    <div className="preset-grid">
      {presets.map((color, i) => (
        <div
          key={i}
          className="preset-color"
          style={{ backgroundColor: color }}
          onClick={() => { onChange(color); setShowPreset(false); }}
          onContextMenu={(e) => {
            e.preventDefault();
            removePreset(color);
          }}
        />
      ))}
    </div>
    <div className="preset-actions">
      <button onClick={() => addPreset(value)}>添加当前颜色</button>
      <button onClick={() => resetPresets()}>重置默认</button>
    </div>
  </div>,
  document.body
);
```

- [ ] **Step 4: 实现点击外部关闭 + ESC 关闭**

在组件 mount 时注册全局事件：
```tsx
useEffect(() => {
  if (!showPreset) return;
  const handleClickOutside = (e: MouseEvent) => {
    if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      setShowPreset(false);
    }
  };
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowPreset(false);
  };
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEsc);
  };
}, [showPreset]);
```

- [ ] **Step 5: 创建 ColorPicker.css 样式**

使用 CSS 变量，不硬编码颜色：
```css
.color-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.color-preview {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s;
}

.color-preview:hover {
  border-color: var(--accent-color);
}

.hex-input {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: monospace;
  text-transform: uppercase;
}

.hex-input:focus {
  border-color: var(--accent-color);
  outline: none;
}

.preset-toggle {
  padding: 3px 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
}

.preset-toggle:hover {
  border-color: var(--accent-color);
  color: var(--text-primary);
}

.color-preset-panel {
  position: fixed;
  width: 240px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  padding: 10px;
  z-index: 9999;
  animation: slideDown 0.15s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.preset-color {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: transform 0.1s;
}

.preset-color:hover {
  transform: scale(1.15);
  z-index: 1;
  position: relative;
}

.preset-actions {
  display: flex;
  gap: 4px;
}

.preset-actions button {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
}

.preset-actions button:hover {
  border-color: var(--accent-color);
}
```

- [ ] **Step 6: 更新 PropertyPanel.tsx 的 ColorPicker import**

将：
```tsx
import ColorPicker from '../ui/ColorPicker';
```
替换为统一组件（已指向 ui/ColorPicker，无需改动 import 路径，但需确认所有 ColorPicker 使用方式兼容）

- [ ] **Step 7: 从 PropertyPanel.css 移除旧 ColorPicker 样式**

搜索并删除 `.color-picker`, `.color-preview`, `.color-preset-panel` 等选择器（统一使用 ui/ColorPicker.css）

- [ ] **Step 8: 删除废弃的 ColorPicker 文件**

```bash
# 确认不再被引用后删除
editor/src/app/components/editor/ColorPicker.tsx
editor/src/app/components/editor/ColorPicker.css
```

- [ ] **Step 9: 验证 ColorPicker 功能**

手动测试：
1. 点击颜色预览块 → 原生取色器打开 ✓
2. 输入 HEX 值（带/不带 #）→ 校验并更新 ✓
3. 点击 ▼ 按钮 → 预设面板展开（带 slideDown 动画）✓
4. 点击预设色 → 选中并关闭面板 ✓
5. 点击面板外 → 面板关闭 ✓
6. ESC 键 → 面板关闭 ✓
7. 滚动页面 → 面板保持在固定位置 ✓

---

## Task 2: 创建 PropertyTooltip 组件

**Files:**
- Create: `editor/src/app/components/editor/property/PropertyTooltip.tsx`
- Create: `editor/src/app/components/editor/property/PropertyTooltip.css`
- Modify: `editor/src/app/components/editor/property/PropertyRow.tsx`（集成 tooltip）
- Modify: `editor/src/app/components/editor/property/PropertyPair.tsx`（集成 tooltip）

**依赖:** Task 1（ColorPicker 统一后）

---

- [ ] **Step 1: 创建属性元数据定义文件**

创建 `editor/src/app/components/editor/property/propertyMeta.ts`，定义所有属性的元数据：

```typescript
export interface PropertyMeta {
  codeAttr: string;        // 代码属性名，如 'bg'
  friendlyName: string;    // 友好名称，如 'Fill'
  syntax: string;          // SolarWire 语法示例，如 'bg=#ffffff'
  description: string;     // 属性说明
  supportedTypes: string[]; // 支持的元素类型
}

export const PROPERTY_META: Record<string, PropertyMeta> = {
  bg: {
    codeAttr: 'bg',
    friendlyName: 'Fill',
    syntax: 'bg=#ffffff',
    description: '背景填充颜色',
    supportedTypes: ['rectangle', 'circle', 'placeholder', 'image'],
  },
  b: {
    codeAttr: 'b',
    friendlyName: 'Border',
    syntax: 'b=#333333',
    description: '边框颜色',
    supportedTypes: ['rectangle', 'circle', 'placeholder', 'image', 'table'],
  },
  // ... 其余属性见附录 A
};
```

- [ ] **Step 2: 创建 PropertyTooltip.tsx**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './PropertyTooltip.css';

interface PropertyTooltipProps {
  meta: PropertyMeta;
  children: React.ReactNode;
}

const PropertyTooltip: React.FC<PropertyTooltipProps> = ({ meta, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const panelWidth = 280;
        let x = rect.right + 8;
        if (x + panelWidth > window.innerWidth) {
          x = rect.left - panelWidth - 8;
        }
        setPosition({ x, y: rect.top });
        setVisible(true);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
      {visible && (
        <div
          className="property-tooltip"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
          }}
        >
          <div className="tooltip-code-attr">{meta.codeAttr}</div>
          <div className="tooltip-section">
            <div className="tooltip-label">SolarWire 语法:</div>
            <div className="tooltip-code">{meta.syntax}</div>
          </div>
          <div className="tooltip-desc">{meta.description}</div>
          <div className="tooltip-supported">
            支持: {meta.supportedTypes.join(', ')}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyTooltip;
```

- [ ] **Step 3: 创建 PropertyTooltip.css**

```css
.property-tooltip {
  position: fixed;
  width: 280px;
  background: var(--bg-tooltip, #1e1e1e);
  color: var(--text-tooltip, #d4d4d4);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  padding: 10px 12px;
  z-index: 10000;
  pointer-events: none;
  animation: tooltipFadeIn 0.15s ease;
}

@keyframes tooltipFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tooltip-code-attr {
  font-weight: 700;
  font-size: 13px;
  font-family: monospace;
  color: var(--accent-color, #fca506);
  margin-bottom: 6px;
}

.tooltip-section {
  margin-bottom: 6px;
}

.tooltip-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.tooltip-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: var(--text-tooltip, #d4d4d4);
}

.tooltip-desc {
  font-size: 12px;
  color: var(--text-tooltip, #d4d4d4);
  margin-bottom: 6px;
  line-height: 1.4;
}

.tooltip-supported {
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 6px;
}
```

- [ ] **Step 4: 更新 PropertyRow 支持双层标签 + tooltip**

修改 `PropertyRow.tsx`：
```tsx
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';

interface PropertyRowProps {
  label: string;
  codeAttr?: string;  // 新增：代码属性名
  children: React.ReactNode;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, codeAttr, children }) => {
  const meta = codeAttr ? PROPERTY_META[codeAttr] : undefined;
  const labelContent = (
    <>
      <span className="property-label-text">{label}</span>
      {codeAttr && (
        <span className="property-code-attr">({codeAttr})</span>
      )}
    </>
  );

  return (
    <div className="property-row">
      {meta ? (
        <PropertyTooltip meta={meta}>
          <span className="property-label">{labelContent}</span>
        </PropertyTooltip>
      ) : (
        <span className="property-label">{labelContent}</span>
      )}
      <div className="property-input">{children}</div>
    </div>
  );
};
```

- [ ] **Step 5: 更新 PropertyRow.tsx 的 CSS**

添加双层标签样式：
```css
.property-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 50px;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.property-label:hover {
  color: var(--text-primary);
}

.property-label-text {
  /* 主文本样式 */
}

.property-code-attr {
  font-size: 9px;
  color: var(--text-muted);
  opacity: 0.7;
  font-family: monospace;
}
```

- [ ] **Step 6: 更新 PropertyPair 支持双层标签 + tooltip**

```tsx
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';

export const PropertyPair: React.FC<PropertyPairProps> = ({
  label1, value1, onChange1,
  label2, value2, onChange2,
  codeAttr1, codeAttr2,  // 新增
  type = 'number', step = 1
}) => {
  const renderLabel = (text: string, codeAttr?: string) => {
    const content = (
      <>
        <span>{text}</span>
        {codeAttr && <span className="property-code-attr">({codeAttr})</span>}
      </>
    );
    if (codeAttr && PROPERTY_META[codeAttr]) {
      return (
        <PropertyTooltip meta={PROPERTY_META[codeAttr]}>
          {content}
        </PropertyTooltip>
      );
    }
    return content;
  };

  return (
    <div className="property-row">
      <DraggableNumberInput
        label={renderLabel(label1, codeAttr1)}
        value={value1}
        onChange={onChange1}
        step={step}
      />
      <DraggableNumberInput
        label={renderLabel(label2, codeAttr2)}
        value={value2}
        onChange={onChange2}
        step={step}
      />
    </div>
  );
};
```

- [ ] **Step 7: 验证 Tooltip 功能**

1. 鼠标悬停属性标签 300ms → Tooltip 出现 ✓
2. 右侧空间不足 → Tooltip 出现在左侧 ✓
3. Tooltip 显示代码属性名、语法示例、说明、支持元素 ✓
4. 键盘 focus 属性标签 → Tooltip 出现 ✓
5. 鼠标离开 / blur → Tooltip 消失 ✓

---

## Task 3: 创建 PaddingEditor 组件（折叠联动）

**Files:**
- Create: `editor/src/app/components/editor/property/PaddingEditor.tsx`
- Create: `editor/src/app/components/editor/property/PaddingEditor.css`
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`（替换内联 Padding 控件）

**依赖:** Task 2（PropertyTooltip）

---

- [ ] **Step 1: 创建 PaddingEditor.tsx**

```tsx
import React, { useState, useMemo } from 'react';
import { DraggableNumberInput } from './PropertyRow';
import PropertyTooltip from './PropertyTooltip';
import { PROPERTY_META } from './propertyMeta';
import './PaddingEditor.css';

interface PaddingEditorProps {
  padding: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  onChange: (attr: string, value: number | undefined) => void;
}

const PaddingEditor: React.FC<PaddingEditorProps> = ({
  padding, paddingTop, paddingRight, paddingBottom, paddingLeft, onChange
}) => {
  const parseVal = (v: string) => parseInt(v) || 0;

  const isCollapsed = useMemo(() => {
    return parseVal(paddingTop) === parseVal(paddingRight) &&
           parseVal(paddingRight) === parseVal(paddingBottom) &&
           parseVal(paddingBottom) === parseVal(paddingLeft);
  }, [paddingTop, paddingRight, paddingBottom, paddingLeft]);

  const effectiveValue = parseVal(padding) || parseVal(paddingTop);

  const handleExpand = (value: number) => {
    onChange('padding-top', value);
    onChange('padding-right', value);
    onChange('padding-bottom', value);
    onChange('padding-left', value);
    onChange('padding', undefined);
  };

  const handleCollapse = (value: number) => {
    onChange('padding-top', value);
    onChange('padding-right', undefined);
    onChange('padding-bottom', undefined);
    onChange('padding-left', undefined);
    onChange('padding', value);
  };

  const handleSingleChange = (attr: string, value: number) => {
    onChange(attr, value);
  };

  if (isCollapsed) {
    return (
      <div className="padding-editor collapsed">
        <div className="padding-row">
          <PropertyTooltip meta={PROPERTY_META['padding']}>
            <span className="padding-label">
              <span>Padding</span>
              <span className="property-code-attr">(padding)</span>
            </span>
          </PropertyTooltip>
          <DraggableNumberInput
            label=""
            value={effectiveValue}
            onChange={(v) => handleExpand(v)}
          />
          <button
            className="padding-toggle-btn"
            onClick={() => handleExpand(effectiveValue)}
            title="展开各方向"
          >🔓</button>
        </div>
      </div>
    );
  }

  return (
    <div className="padding-editor expanded">
      {[
        { label: 'P-T', attr: 'padding-top', value: paddingTop },
        { label: 'P-R', attr: 'padding-right', value: paddingRight },
        { label: 'P-B', attr: 'padding-bottom', value: paddingBottom },
        { label: 'P-L', attr: 'padding-left', value: paddingLeft },
      ].map(({ label, attr, value }) => (
        <div key={attr} className="padding-row">
          <PropertyTooltip meta={PROPERTY_META[attr]}>
            <span className="padding-label">
              <span>{label}</span>
              <span className="property-code-attr">({attr})</span>
            </span>
          </PropertyTooltip>
          <DraggableNumberInput
            label=""
            value={parseVal(value)}
            onChange={(v) => handleSingleChange(attr, v)}
          />
        </div>
      ))}
      <button
        className="padding-collapse-btn"
        onClick={() => handleCollapse(parseVal(paddingTop))}
        title="折叠到统一 Padding"
      >🔒</button>
    </div>
  );
};

export default PaddingEditor;
```

- [ ] **Step 2: 创建 PaddingEditor.css**

```css
.padding-editor {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.padding-editor.expanded {
  position: relative;
  padding-right: 30px;
}

.padding-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.padding-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 30px;
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: default;
}

.padding-label:hover {
  color: var(--text-primary);
}

.padding-label .property-code-attr {
  font-size: 8px;
  opacity: 0.6;
  font-family: monospace;
}

.padding-toggle-btn,
.padding-collapse-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
}

.padding-toggle-btn:hover,
.padding-collapse-btn:hover {
  background: var(--bg-hover);
}

.padding-collapse-btn {
  position: absolute;
  right: 0;
  top: 0;
}

.padding-editor.collapsed .padding-row {
  /* collapsed 状态单行布局 */
}
```

- [ ] **Step 3: 验证 PaddingEditor 折叠/展开**

1. 四个方向值相同 → 显示折叠状态 "Padding" ✓
2. 点击 🔓 → 展开为四个独立控件 ✓
3. 修改任意方向值后四个值再次相同 → 自动回退到折叠 ✓
4. 点击 🔒 → 折叠到统一 Padding ✓

---

## Task 4: 更新 useElementProps — 统一布尔判断 + 提取 text-color

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementProps.ts`

**依赖:** 无（独立任务）

---

- [ ] **Step 1: 统一 Bold/Italic 布尔判断逻辑**

当前问题代码：
```tsx
// 错误：使用字符串比较
String(attrs.bold) === 'true'  // 只对 bold="true" 生效
```

修复为：
```tsx
// 正确：key 存在即为 true
const bold = !!attrs.bold;
const italic = !!attrs.attrs;  // 修正为 attrs
```

- [ ] **Step 2: 提取 Line 元素的 text-color 属性**

在 `useElementProps` 的返回类型和实现中添加：
```tsx
// ElementProps 接口中添加
textColor?: string;

// 提取逻辑（Line 元素）
const textColor = attrs['text-color'] || '#333333';
```

- [ ] **Step 3: 添加表格特有属性提取**

```tsx
// ElementProps 接口中添加
tableBorder?: string;
tableCellspacing?: string;
tableRows?: number;
tableCols?: number;

// 提取逻辑（Table 元素）
const tableBorder = attrs.border || '1';
const tableCellspacing = attrs.cellspacing || '0';
const tableRows = (element as any).children?.length || 0;
// 表格列数需要计算第一行的子元素数量
const tableCols = (element as any).children?.[0]?.children?.length || 0;
```

- [ ] **Step 4: 验证 useElementProps 更新**

1. `bold` 属性无值（`bold` key 存在但值为空）→ 返回 true ✓
2. `bold="false"` → 返回 true（key 存在）✓
3. Line 元素选中 → `textColor` 有值 ✓
4. Table 元素选中 → `tableBorder`, `tableCellspacing`, `tableRows`, `tableCols` 有值 ✓

---

## Task 5: 修复 ShadowEditor 显示条件 + 属性值判断

**Files:**
- Modify: `editor/src/app/components/editor/property/ShadowEditor.tsx`
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`（添加条件渲染）

**依赖:** Task 4（useElementProps 更新后）

---

- [ ] **Step 1: 扩展 ShadowEditor Props 接口**

```tsx
interface ShadowEditorProps {
  attrs: Record<string, string>;
  onChange: (property: string, value: string | number | boolean | undefined) => void;
  elementType?: string;  // 新增：用于判断是否支持阴影
}
```

- [ ] **Step 2: 修复 Bold/Italic 判断逻辑**

将 ShadowEditor 中的判断：
```tsx
checked={!!attrs['shadow-enabled']}
```
替换为使用统一的布尔判断（key 存在即为 true）

- [ ] **Step 3: 在 PropertyPanel 中添加 Shadow 区条件显示**

```tsx
// Shadow 显示条件：rectangle, circle, text, image（排除 line 和 placeholder）
const showShadow = ['rectangle', 'circle', 'text', 'image'].includes(type);

{showShadow && (
  <PropertyGroupTitle title="Shadow" defaultCollapsed={true}>
    <ShadowEditor
      attrs={attrs}
      onChange={handleChange}
      elementType={type}
    />
  </PropertyGroupTitle>
)}
```

- [ ] **Step 4: 修复阴影关闭时删除属性**

当前问题代码（`ShadowEditor.tsx`）：
```tsx
// 错误：设置空字符串
onChange('shadow-x', undefined);  // 这里其实是对的，会走 deleteLineAttribute
// 但需要确认 updateLineAttribute 在 value 为 undefined 时调用 deleteLineAttribute
```

检查 `attribute-updater.ts` 中 `updateLineAttribute` 实现，确保支持 `undefined` 值触发属性删除。

- [ ] **Step 5: 验证 ShadowEditor 显示条件**

1. Rectangle 选中 → Shadow 区显示 ✓
2. Line 选中 → Shadow 区不显示 ✓
3. Placeholder 选中 → Shadow 区不显示 ✓
4. Circle 选中 → Shadow 区显示 ✓

---

## Task 6: 修复 PropertyPanel 中的元素类型特定问题

**Files:**
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`

**依赖:** Task 4, Task 5

---

- [ ] **Step 1: 修复 P1 — Line 元素的 Fill 颜色**

问题：Line 的 Fill ColorPicker 使用 `handleChange('bg', color)`，但 Line 渲染器使用 `c`。

修复：在 Line 元素时，Fill ColorPicker 使用 `handleChange('c', color)`：

```tsx
{type === 'line' ? (
  <ColorPicker
    label="Color (c)"
    value={textColor}
    onChange={(color) => handleChange('c', color)}
  />
) : (
  <ColorPicker
    label="Fill (bg)"
    value={bg}
    onChange={(color) => handleChange('bg', color)}
  />
)}
```

- [ ] **Step 2: 修复 P2 — Line 元素添加线宽控制**

在 Line 的 Appearance 区添加 Width 控件：
```tsx
{showLineControls && (
  <PropertyGroupTitle title="Appearance">
    <PropertyRow label="Color (c)">
      <ColorPicker
        label=""
        value={textColor}
        onChange={(color) => handleChange('c', color)}
      />
    </PropertyRow>
    <PropertyRow label="Width (s)">
      <DraggableNumberInput
        label=""
        value={borderSize}
        onChange={(v) => handleChange('s', v)}
      />
    </PropertyRow>
    {/* ... */}
  </PropertyGroupTitle>
)}
```

- [ ] **Step 3: 修复 P3 — Line 元素添加 Label Color (text-color)**

添加 text-color ColorPicker：
```tsx
{type === 'line' && label !== undefined && (
  <PropertyRow label="Label Color (text-color)" codeAttr="text-color">
    <ColorPicker
      label=""
      value={attrs['text-color'] || '#333333'}
      onChange={(color) => handleChange('text-color', color)}
    />
  </PropertyRow>
)}
```

- [ ] **Step 4: 修复 P7 — Shadow 区显示条件**

已在 Task 5 Step 3 实现。

- [ ] **Step 5: 修复 P8 — 移动 Line Height / Letter Spacing 到 Text 分组内**

将这两个控件从 `showTextControls` 条件中移出，确保它们始终在 Text `PropertyGroupTitle` 内部：

```tsx
{showTextControls && (
  <PropertyGroupTitle title="Text">
    {/* text content 控件 */}
    {/* color picker */}
    {/* size */}
    {/* align */}
    {/* vertical-align */}
    {/* bold / italic */}
    {/* text-decoration */}
    <PropertyRow label="Line Height (line-height)" codeAttr="line-height">
      <DraggableNumberInput
        label=""
        value={attrs['line-height'] || '22'}
        onChange={(v) => handleChange('line-height', v)}
      />
    </PropertyRow>
    <PropertyRow label="Letter Spacing (letter-spacing)" codeAttr="letter-spacing">
      <DraggableNumberInput
        label=""
        value={attrs['letter-spacing'] || '0'}
        onChange={(v) => handleChange('letter-spacing', v)}
      />
    </PropertyRow>
  </PropertyGroupTitle>
)}
```

- [ ] **Step 6: 修复 P9 — 替换内联 Padding 控件为 PaddingEditor**

将原有的 5 个 Padding 控件替换为：
```tsx
<PaddingEditor
  padding={padding}
  paddingTop={paddingTop}
  paddingRight={paddingRight}
  paddingBottom={paddingBottom}
  paddingLeft={paddingLeft}
  onChange={handleChange}
/>
```

- [ ] **Step 7: 修复 P11 — textarea 高度改为组件内部 state**

删除对 `useSettingsStore` 的 textarea 高度依赖，改为 `useState`：
```tsx
const [noteTextareaHeight, setNoteTextareaHeight] = useState(60);
const [textTextareaHeight, setTextTextareaHeight] = useState(60);
```

- [ ] **Step 8: 修复 P12 — 补全 useEffect 依赖数组**

当前问题代码：
```tsx
useEffect(() => {
  if (elementProps?.note !== undefined && elementProps.note !== noteValue) {
    setNoteValue(elementProps.note);
    setNoteTextareaHeight(60);
  }
}, [elementProps?.note]);  // 缺少 noteValue 和 setNoteTextareaHeight
```

修复：
```tsx
useEffect(() => {
  if (elementProps?.note !== undefined && elementProps.note !== noteValue) {
    setNoteValue(elementProps.note);
    setNoteTextareaHeight(60);
  }
}, [elementProps?.note, noteValue, setNoteTextareaHeight]);
```

类似修复另一个 useEffect。

- [ ] **Step 9: 修复 P13 — Image 元素的 Fill 语义标签**

Image 元素使用独立的语义标签：
```tsx
{type === 'image' && (
  <PropertyRow label="Placeholder BG (bg)" codeAttr="bg">
    <ColorPicker
      label=""
      value={bg}
      onChange={(color) => handleChange('bg', color)}
    />
  </PropertyRow>
)}
```

- [ ] **Step 10: 更新所有属性控件使用双层标签**

将 PropertyPanel 中所有 `PropertyRow` 和 `PropertyPair` 调用更新为传递 `codeAttr` 参数：
```tsx
<PropertyRow label="Width (s)" codeAttr="s">
<PropertyPair
  label1="X" label2="Y"
  codeAttr1="x" codeAttr2="y"
  value1={x} value2={y}
  onChange1={(v) => handleChange('x', v)}
  onChange2={(v) => handleChange('y', v)}
/>
```

---

## Task 7: 实现多选批量编辑

**Files:**
- Modify: `editor/src/app/components/editor/hooks/useElementProps.ts`（扩展支持多元素）
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`（多选状态分支）

**依赖:** Task 6（PropertyPanel 修复）

---

- [ ] **Step 1: 扩展 useElementProps 支持多元素批量计算**

在 `useElementProps.ts` 中添加批量计算函数：
```tsx
export interface MultiElementProps {
  x: { value: number | null; mixed: boolean };
  y: { value: number | null; mixed: boolean };
  w: { value: number | null; mixed: boolean };
  h: { value: number | null; mixed: boolean };
  bg: { value: string; mixed: boolean };
  b: { value: string; mixed: boolean };
  opacity: { value: number | null; mixed: boolean };
  hasMixed: boolean;
}

export function useMultiElementProps(
  elements: Element[]
): MultiElementProps | null {
  return useMemo(() => {
    if (!elements || elements.length < 2) return null;

    const getNum = (el: Element, key: string) => {
      const attrs = (el as any).attributes || {};
      return parseInt(attrs[key]) || 0;
    };
    const getStr = (el: Element, key: string) => {
      const attrs = (el as any).attributes || {};
      return attrs[key] || '';
    };

    const xValues = elements.map(el => getNum(el, 'x'));
    const yValues = elements.map(el => getNum(el, 'y'));
    const wValues = elements.map(el => getNum(el, 'w'));
    const hValues = elements.map(el => getNum(el, 'h'));
    const bgValues = elements.map(el => getStr(el, 'bg'));
    const bValues = elements.map(el => getStr(el, 'b'));
    const opacityValues = elements.map(el => getStr(el, 'opacity'));

    const allSame = (arr: any[]) => arr.every(v => v === arr[0]);

    return {
      x: { value: xValues[0], mixed: !allSame(xValues) },
      y: { value: yValues[0], mixed: !allSame(yValues) },
      w: { value: wValues[0], mixed: !allSame(wValues) },
      h: { value: hValues[0], mixed: !allSame(hValues) },
      bg: { value: bgValues[0], mixed: !allSame(bgValues) },
      b: { value: bValues[0], mixed: !allSame(bValues) },
      opacity: { value: parseFloat(opacityValues[0]) || 1, mixed: !allSame(opacityValues) },
      hasMixed: true,
    };
  }, [elements]);
}
```

- [ ] **Step 2: 修改 PropertyPanel 多选状态分支**

将多选状态从：
```tsx
if (selectedElements.length > 1) {
  return (
    <div className="property-panel">
      <h3>Multiple Elements</h3>
      <p>{selectedElements.length} elements selected</p>
    </div>
  );
}
```

替换为批量编辑面板：
```tsx
if (selectedElements.length > 1) {
  const multiProps = useMultiElementProps(multiElements);
  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <span className="property-panel-type">
          {selectedElements.length} Elements Selected
        </span>
      </div>

      <PropertyGroupTitle title="Position">
        <PropertyPair
          label1="X" label2="Y"
          value1={multiProps?.x.value ?? 0}
          value2={multiProps?.y.value ?? 0}
          onChange1={(v) => batchUpdate('x', v)}
          onChange2={(v) => batchUpdate('y', v)}
        />
      </PropertyGroupTitle>

      <PropertyGroupTitle title="Size">
        <PropertyPair
          label1="W" label2="H"
          value1={multiProps?.w.value ?? 0}
          value2={multiProps?.h.value ?? 0}
          onChange1={(v) => batchUpdate('w', v)}
          onChange2={(v) => batchUpdate('h', v)}
        />
      </PropertyGroupTitle>

      <PropertyGroupTitle title="Appearance">
        <div className="property-row">
          <ColorPicker
            label={multiProps?.bg.mixed ? 'Fill (mixed)' : 'Fill (bg)'}
            value={multiProps?.bg.value ?? '#ffffff'}
            onChange={(color) => batchUpdate('bg', color)}
          />
          <ColorPicker
            label={multiProps?.b.mixed ? 'Border (mixed)' : 'Border (b)'}
            value={multiProps?.b.value ?? '#333333'}
            onChange={(color) => batchUpdate('b', color)}
          />
        </div>
        <PropertyRow label="Opacity">
          <div className="opacity-control">
            <input
              type="range" min="0" max="1" step="0.1"
              value={multiProps?.opacity.value ?? 1}
              onChange={(e) => batchUpdate('opacity', parseFloat(e.target.value))}
            />
            <input
              type="number" className="opacity-number"
              min="0" max="1" step="0.1"
              value={multiProps?.opacity.value ?? 1}
              onChange={(e) => batchUpdate('opacity', parseFloat(e.target.value) || 0)}
            />
          </div>
        </PropertyRow>
      </PropertyGroupTitle>
    </div>
  );
}
```

- [ ] **Step 3: 实现 batchUpdate 批量更新函数**

```tsx
const batchUpdate = useCallback((attr: string, value: any) => {
  // 对所有选中的元素行号应用相同的属性修改
  multiElements.forEach(element => {
    const lineNum = (element as any).location?.line;
    if (!lineNum) return;
    const newContent = updateLineAttribute(safeContent, lineNum, attr, value);
    effectiveSetContent(newContent);
  });
}, [multiElements, safeContent, effectiveSetContent]);
```

- [ ] **Step 4: 验证多选批量编辑**

1. 选择 2 个元素 → 显示批量编辑面板 ✓
2. 修改 X/Y → 所有选中元素同步更新 ✓
3. 属性值不同 → 显示原值 + "mixed" 标识 ✓
4. 修改混合值 → 所有选中元素统一为新值 ✓

---

## Task 8: 最终清理与验证

**Files:**
- Modify: `editor/src/app/components/editor/PropertyPanel.tsx`（最终精简）
- Modify: `editor/src/app/components/editor/PropertyPanel.css`（清理 + CSS 变量）
- 验证所有 P1-P17 问题已修复

**依赖:** Task 1-7 全部完成

---

- [ ] **Step 1: 清理 PropertyPanel.css**

1. 移除所有 ColorPicker 相关样式（已统一到 ui/ColorPicker.css）
2. 确保所有颜色使用 CSS 变量：
```css
/* 不允许 */
color: #333;
/* 允许 */
color: var(--text-primary);
```
3. 移除内联样式引用（Image browse 按钮等）

- [ ] **Step 2: 验证所有 P1-P17**

| # | 问题 | 验证方法 |
|---|------|----------|
| P1 | Line 颜色修改 | 修改 Line 颜色 → 渲染器同步显示 ✓ |
| P2 | Line 线宽控制 | Line Appearance 显示 Width ✓ |
| P3 | Line 标签颜色 | Line 显示 Label Color ✓ |
| P4 | Placeholder Shadow | Placeholder 不显示 Shadow ✓ |
| P5 | Table 编辑 | 属性面板显示表格属性 ✓ |
| P6 | Bold/Italic 判断 | `bold`（无值）在面板和渲染器都生效 ✓ |
| P7 | Shadow 显示条件 | Line/Placeholder 不显示 Shadow ✓ |
| P8 | Line Height 位置 | 在 Text 分组内部 ✓ |
| P9 | Padding 折叠 | 相同时折叠，点击展开 ✓ |
| P10 | 多选批量编辑 | 多选显示批量编辑面板 ✓ |
| P11 | textarea 高度 | 切换元素高度不互相影响 ✓ |
| P12 | useEffect 依赖 | 所有依赖数组完整 ✓ |
| P13 | Image Fill 语义 | 显示 Placeholder BG ✓ |
| P14 | 属性名双层显示 | 所有控件显示 (codeAttr) ✓ |
| P15 | 属性重置/删除 | 已有 undefined 机制（可扩展） |
| P16 | 输入验证 | HEX 输入校验回退 ✓ |
| P17 | 旧文档 Bug | 重复 Border ColorPicker 等已修复 ✓ |

- [ ] **Step 3: TypeScript 编译检查**

```bash
cd editor
npx tsc --noEmit
```

修复所有类型错误。

- [ ] **Step 4: Vite 构建验证**

```bash
npm run build
```

确认无构建错误。

- [ ] **Step 5: 手动功能验证清单**

1. ✓ 打开编辑器，选择 Rectangle → 属性面板显示所有控件
2. ✓ 修改 Fill/Border/Width 等 → 画布实时更新
3. ✓ Tooltip 悬停显示属性信息
4. ✓ Padding 折叠/展开正常
5. ✓ 选择 Circle → Shadow 显示
6. ✓ 选择 Line → Shadow 不显示，显示线宽/标签颜色
7. ✓ 选择 Table → 显示表格特有属性
8. ✓ 多选 2 个元素 → 批量编辑面板
9. ✓ ColorPicker 预设面板正常
10. ✓ 滚动编辑器 → Tooltip/Panel 保持在正确位置

---

## 验收标准

Stage 1A-1D 完成的验收标准：

1. **所有 17 个问题已修复**（P1-P17）
2. **属性面板显示双层标签**（友好名称 + 代码属性名）
3. **所有属性控件支持 Tooltip**（hover 300ms 后显示）
4. **ColorPicker 统一**（ui/ 目录下单一组件，editor/ 下已删除）
5. **Padding 控件支持折叠/展开**
6. **多选元素显示批量编辑面板**
7. **TypeScript 编译无错误**
8. **Vite 构建成功**
9. **手动功能验证清单全部通过**

---

## 附录：代码属性到友好名称映射

| codeAttr | friendlyName |
|----------|--------------|
| x | X |
| y | Y |
| w | W |
| h | H |
| bg | Fill |
| b | Border |
| s | Width |
| c | Color |
| size | Size |
| r | R |
| opacity | Opacity |
| padding | Padding |
| padding-top | P-T |
| padding-right | P-R |
| padding-bottom | P-B |
| padding-left | P-L |
| align | Align |
| vertical-align | V-Align |
| bold | Bold |
| italic | Italic |
| text-decoration | Decoration |
| line-height | Line Height |
| letter-spacing | Letter Spacing |
| style | Style |
| label | Label |
| text-color | Label Color |
| url | URL |
| border | Border |
| cellspacing | Spacing |
| shadow-x | X |
| shadow-y | Y |
| shadow-blur | Blur |
| shadow-color | Shadow Color |
