# Canvas 渲染器实施计划

## 概述

将 SolarWire 编辑器的预览渲染从 SVG 迁移到 Canvas，同时保留 SVG 渲染器用于导出功能。

## 目标

1. 创建独立的 Canvas 渲染器，不影响现有 SVG 渲染器
2. 解决鼠标位置与渲染位置对应问题
3. 实现元素拖动功能
4. 优化属性面板布局
5. 完善属性面板属性覆盖

## 文件结构

```
src/renderer/
├── lib/
│   ├── parser-src/              # 解析器（不变）
│   ├── renderer-svg-src/        # SVG 渲染器（保留，用于导出）
│   └── renderer-canvas-src/     # 新增：Canvas 渲染器
│       ├── index.ts             # 导出入口
│       ├── context.ts           # 渲染上下文
│       ├── renderer.ts          # 主渲染器
│       ├── elements/            # 元素渲染器
│       │   ├── rectangle.ts
│       │   ├── circle.ts
│       │   ├── text.ts
│       │   ├── line.ts
│       │   ├── image.ts
│       │   ├── placeholder.ts
│       │   └── table.ts
│       └── interaction/         # 交互层
│           ├── selection.ts     # 选中高亮
│           ├── handles.ts       # 缩放句柄
│           └── boxSelection.ts  # 框选
├── components/
│   └── editor/
│       ├── SolarWireCanvas.tsx  # 新增：Canvas 预览组件
│       ├── SolarWirePreview.tsx # 保留：SVG 预览组件（可选切换）
│       └── PropertyPanel.tsx    # 属性面板（优化）
```

## 实施阶段

### 阶段一：Canvas 渲染器基础架构

#### 1.1 创建渲染上下文

```typescript
// renderer-canvas-src/context.ts

export interface CanvasRenderContext {
  ctx: CanvasRenderingContext2D;
  offsetX: number;
  offsetY: number;
  scale: number;
  globalDefaults: GlobalDefaults;
  selectedElementIds: string[];
  primaryColor: string;
  lastElementBounds: ElementBounds | null;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

#### 1.2 主渲染器

```typescript
// renderer-canvas-src/renderer.ts

export interface CanvasRenderOptions {
  selectedElementIds?: string[];
  primaryColor?: string;
  showNotes?: boolean;
}

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  ast: Document,
  options?: CanvasRenderOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 应用变换
  ctx.save();
  
  // 渲染所有元素
  ast.elements.forEach((element, index) => {
    renderElement(element, context);
  });
  
  // 渲染交互层（选中高亮、句柄等）
  renderInteractionLayer(ctx, ast, options);
  
  ctx.restore();
}
```

#### 1.3 元素渲染器示例

```typescript
// renderer-canvas-src/elements/rectangle.ts

export function renderRectangle(
  element: RectangleElement | RoundedRectangleElement,
  context: CanvasRenderContext
): ElementBounds {
  const { ctx } = context;
  const pos = calculatePosition(context, element.coordinates);
  const w = getNumberAttribute(element.attributes, 'w', 100);
  const h = getNumberAttribute(element.attributes, 'h', 40);
  const bg = getColorAttribute(element.attributes, 'bg', '#ffffff');
  const b = getColorAttribute(element.attributes, 'b', '#333333');
  const s = getNumberAttribute(element.attributes, 's', 1);
  const r = element.type === 'rounded-rectangle' 
    ? getNumberAttribute(element.attributes, 'r', 6) 
    : 0;
  
  ctx.beginPath();
  if (r > 0) {
    roundRect(ctx, pos.x, pos.y, w, h, r);
  } else {
    ctx.rect(pos.x, pos.y, w, h);
  }
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = b;
  ctx.lineWidth = s;
  ctx.stroke();
  
  // 渲染文本
  if (element.text) {
    renderTextContent(ctx, element.text, pos, w, h, element.attributes);
  }
  
  return { x: pos.x, y: pos.y, width: w, height: h };
}
```

### 阶段二：交互层实现

#### 2.1 选中高亮

```typescript
// renderer-canvas-src/interaction/selection.ts

export function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  bounds: ElementBounds,
  primaryColor: string
): void {
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);
  ctx.restore();
}
```

#### 2.2 缩放句柄

```typescript
// renderer-canvas-src/interaction/handles.ts

export function renderResizeHandles(
  ctx: CanvasRenderingContext2D,
  bounds: ElementBounds,
  handleSize: number = 8
): void {
  const handles = [
    { x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
    { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
    { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' }
  ];
  
  handles.forEach(handle => {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
}
```

#### 2.3 框选

```typescript
// renderer-canvas-src/interaction/boxSelection.ts

export function renderBoxSelection(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  primaryColor: string
): void {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);
  
  ctx.save();
  ctx.fillStyle = `${primaryColor}20`;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
```

### 阶段三：Canvas 预览组件

```typescript
// components/editor/SolarWireCanvas.tsx

function SolarWireCanvas({ zoomLevel, selectionTool, showNotes }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { content } = useEditorStore();
  const { selectedElements, selectElements } = useSolarWireStore();
  
  // 解析 AST
  const ast = useMemo(() => parse(content || ''), [content]);
  
  // 渲染循环
  useEffect(() => {
    if (!canvasRef.current || !ast) return;
    renderToCanvas(canvasRef.current, ast, {
      selectedElementIds: selectedElements,
      showNotes
    });
  }, [ast, selectedElements, showNotes]);
  
  // 处理画布大小变化
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    // 处理选中、拖动、框选等
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // 处理拖动、框选更新
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    // 完成拖动、框选
  };
  
  return (
    <div ref={containerRef} className="solarwire-canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
```

### 阶段四：元素拖动功能

```typescript
// SolarWireCanvas.tsx 中的拖动逻辑

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elements: Array<{
    id: string;
    originalX: number;
    originalY: number;
  }>;
}

const handleMouseDown = (e: React.MouseEvent) => {
  const coords = getCanvasCoords(e);
  const elementId = getElementAtPosition(coords.x, coords.y);
  
  if (elementId && selectionTool === 'select') {
    // 开始拖动
    setDragState({
      isDragging: true,
      startX: coords.x,
      startY: coords.y,
      elements: selectedElements.map(id => {
        const bounds = getElementBounds(id);
        return { id, originalX: bounds.x, originalY: bounds.y };
      })
    });
  }
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!dragState?.isDragging) return;
  
  const coords = getCanvasCoords(e);
  const dx = coords.x - dragState.startX;
  const dy = coords.y - dragState.startY;
  
  // 更新所有选中元素的位置
  dragState.elements.forEach(({ id, originalX, originalY }) => {
    const newX = Math.round(originalX + dx);
    const newY = Math.round(originalY + dy);
    updateElementPosition(id, newX, newY);
  });
};
```

### 阶段五：属性面板优化

#### 5.1 布局优化

```css
/* PropertyPanel.css */

.property-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  overflow: hidden;
}

.properties-section {
  flex-shrink: 0;
  overflow-y: auto;
}

.note-section {
  flex: 1;
  min-height: 80px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
}

.note-section textarea {
  flex: 1;
  resize: none;
  min-height: 60px;
}

/* 属性行布局 */
.property-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.property-row .property-group {
  flex: 1;
}

/* 属性分组标题 */
.property-group-title {
  font-size: 11px;
  color: var(--text-muted);
  margin: 15px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
}
```

#### 5.2 属性分组

根据元素类型，属性面板显示不同的属性组：

**通用属性（所有元素）**：
- 位置：x, y（同一行）
- 背景：bg（颜色选择器）
- 边框：b（颜色）、s（宽度）
- 透明度：opacity

**矩形/圆角矩形**：
- 尺寸：w, h（同一行）
- 圆角：r（仅圆角矩形）
- 文本：text
- 文本颜色：c
- 字体大小：size
- 对齐：align

**圆形**：
- 尺寸：w, h（同一行）或 r（半径）
- 文本：text
- 文本颜色：c
- 字体大小：size

**文本**：
- 宽度：w
- 文本颜色：c
- 字体大小：size
- 行高：line-height
- 对齐：align
- 粗体：bold
- 斜体：italic

**线段**：
- 起点：x, y（同一行）
- 终点：x2, y2（同一行）
- 颜色：c
- 宽度：s
- 样式：style（solid/dashed/dotted）
- 标签：label

**图片**：
- 尺寸：w, h（同一行）
- URL：url

**占位符**：
- 尺寸：w, h（同一行）
- 文本：text

**表格**：
- 尺寸：w, h（同一行）
- 边框：border
- 单元格间距：cellspacing

#### 5.3 属性面板组件重构

```typescript
// PropertyPanel.tsx

function PropertyPanel(): JSX.Element {
  const { selectedElements } = useSolarWireStore();
  const { content, setContent } = useEditorStore();
  
  // ... 获取元素数据
  
  return (
    <div className="property-panel">
      <h3>Properties</h3>
      
      <div className="properties-section">
        {/* 位置属性 */}
        <div className="property-group-title">Position</div>
        <div className="property-row">
          <div className="property-group">
            <label>X</label>
            <input type="number" value={x} onChange={...} />
          </div>
          <div className="property-group">
            <label>Y</label>
            <input type="number" value={y} onChange={...} />
          </div>
        </div>
        
        {/* 尺寸属性（根据元素类型显示） */}
        {showSizeControls && (
          <>
            <div className="property-group-title">Size</div>
            <div className="property-row">
              <div className="property-group">
                <label>Width</label>
                <input type="number" value={w} onChange={...} />
              </div>
              <div className="property-group">
                <label>Height</label>
                <input type="number" value={h} onChange={...} />
              </div>
            </div>
          </>
        )}
        
        {/* 外观属性 */}
        <div className="property-group-title">Appearance</div>
        <div className="property-row">
          <div className="property-group">
            <label>Background</label>
            <input type="color" value={bg} onChange={...} />
          </div>
          <div className="property-group">
            <label>Border</label>
            <input type="color" value={borderColor} onChange={...} />
          </div>
        </div>
        
        {/* 文本属性（如果有文本） */}
        {hasText && (
          <>
            <div className="property-group-title">Text</div>
            <div className="property-row">
              <div className="property-group">
                <label>Color</label>
                <input type="color" value={textColor} onChange={...} />
              </div>
              <div className="property-group">
                <label>Size</label>
                <input type="number" value={fontSize} onChange={...} />
              </div>
            </div>
          </>
        )}
        
        {/* 特殊属性（根据元素类型） */}
        {type === 'line' && <LineProperties element={element} />}
        {type === 'table' && <TableProperties element={element} />}
      </div>
      
      {/* Note 区域 - 自适应底部 */}
      <div className="note-section">
        <div className="property-group-title">Note</div>
        <textarea
          value={note}
          placeholder="Add a note..."
          onChange={...}
        />
      </div>
    </div>
  );
}
```

## 任务清单

### 第一周：Canvas 渲染器基础

- [ ] 创建 `renderer-canvas-src` 目录结构
- [ ] 实现渲染上下文 (`context.ts`)
- [ ] 实现主渲染器 (`renderer.ts`)
- [ ] 实现矩形渲染器
- [ ] 实现圆角矩形渲染器
- [ ] 实现圆形渲染器
- [ ] 实现文本渲染器
- [ ] 实现线段渲染器
- [ ] 实现图片渲染器
- [ ] 实现占位符渲染器
- [ ] 实现表格渲染器

### 第二周：交互层

- [ ] 实现选中高亮
- [ ] 实现缩放句柄
- [ ] 实现框选
- [ ] 创建 `SolarWireCanvas` 组件
- [ ] 集成到 `SolarWireMode`

### 第三周：交互功能

- [ ] 实现元素拖动功能
- [ ] 实现句柄缩放功能
- [ ] 优化鼠标坐标转换
- [ ] 实现平移和缩放

### 第四周：属性面板优化

- [ ] 重构属性面板布局
- [ ] 实现属性分组
- [ ] 完善 Note 输入区域
- [ ] 添加缺失的属性控件
- [ ] 测试所有元素类型的属性编辑

## 注意事项

1. **保留 SVG 渲染器**：不要修改 `renderer-svg-src` 目录下的任何文件
2. **坐标系统**：Canvas 使用左上角为原点，与 SVG 一致
3. **性能优化**：考虑使用 `requestAnimationFrame` 进行渲染循环
4. **高 DPI 支持**：需要处理 `devicePixelRatio`
5. **文本渲染**：Canvas 文本渲染与 SVG 有差异，需要仔细处理换行和对齐

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Canvas 文本渲染与 SVG 不一致 | 中 | 使用相同的文本测量逻辑 |
| 性能问题 | 低 | 使用脏区域渲染优化 |
| 高 DPI 显示问题 | 中 | 正确处理 devicePixelRatio |
| 交互精度问题 | 低 | Canvas 坐标系统统一解决此问题 |

## 验收标准

1. 所有元素类型正确渲染
2. 选中高亮显示正确
3. 框选功能正常工作
4. 元素拖动功能正常工作
5. 句柄缩放功能正常工作
6. 属性面板完整覆盖所有属性
7. Note 输入区域自适应底部
8. 导出 SVG 功能仍然正常
