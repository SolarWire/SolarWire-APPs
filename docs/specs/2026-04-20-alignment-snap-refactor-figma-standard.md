# 对齐吸附功能重构方案（Figma 标准完整版）

> 日期：2026-04-20
> 状态：待审批

---

## 一、问题回顾

当前实现的核心问题：
1. **移动吸附只检测 left/top**：传入 `activeHandle='nw'`，导致右边缘/底边缘/中心轴无法吸附
2. **双重阈值过滤**：`calculateAlignmentGuides` 生成时过滤 + `snapToAlignment` 再次过滤，吸附不稳定
3. **引导线渲染与吸附位置不同步**：引导线基于吸附前位置计算，元素最终在吸附后位置
4. **多选移动无吸附**：`multiDragElements` 分支未调用对齐逻辑
5. **Resize 中心轴吸附缺失**：`snapToAlignment` 已移除 centerX/centerY
6. **缺少间距等分吸附**：Figma 会检测相等间距并提示
7. **缺少画布中心吸附**：元素靠近画布中心时不吸附
8. **缺少线段元素吸附**：线段使用 x1/y1/x2/y2，未特殊处理
9. **缺少智能分布线**：多个等间距排列时不显示分布提示
10. **缺少用户引导线**：Figma 支持从标尺拖出用户引导线

---

## 二、Figma 完整特性清单

### 2.1 吸附触发类型（6 大类 18 种）

| # | 大类 | 子类 | 移动 | Resize | 说明 |
|---|------|------|:----:|:------:|------|
| 1 | **边缘对齐**（Edge Snap） | left/right/top/bottom | ✅ | ✅ | 四条边对齐到其他元素边缘 |
| 2 | **中心轴对齐**（Center Snap） | centerX/centerY | ✅ | ✅（角句柄） | 中心轴对齐到其他元素中心 |
| 3 | **间距相等**（Spacing Snap） | spacingX/spacingY | ✅ | ❌ | 两元素间距相等时显示等分线 |
| 4 | **画布对齐**（Canvas Snap） | canvasLeft/Right/Top/Bottom/CenterX/CenterY | ✅ | ❌ | 对齐到画布边缘/中心 |
| 5 | **多选包围盒**（Group Snap） | 整体包围盒吸附 | ✅ | ❌ | 多元素作为整体吸附 |
| 6 | **智能分布**（Smart Distribute） | distributeX/distributeY | ✅ | ❌ | 3+ 元素等间距排列时显示分布线 |
| 7 | **用户引导线**（User Guides） | 用户从标尺拖出的参考线 | ✅ | ✅ | 用户自定义参考线 |

### 2.2 视觉反馈（5 类）

| # | 视觉类型 | 样式 | 触发条件 | 说明 |
|---|---------|------|---------|------|
| 1 | **对齐引导线**（Guide Lines） | 实线，accentColor，2px | 吸附时 | 标准对齐线 |
| 2 | **间距引导线**（Spacing Lines） | 虚线，accentColor，1px + 距离标签 | 间距相等时 | 等分线 + "24px" 标签 |
| 3 | **画布中心线**（Canvas Center） | 虚线，弱化颜色，1px | 默认隐藏（元素靠近时显示） | 画布十字中心线 |
| 4 | **距离线**（Distance Lines） | 实线，弱化，带标签 | 元素接近时 | 边到边的距离数值 |
| 5 | **分布线**（Distribute Lines） | 虚线，弱色 | 3+ 元素等间距时 | 等分布提示线 |

### 2.3 吸附行为规则（6 条）

| 规则 | 说明 |
|------|------|
| **优先级** | 边缘(1) > 中心轴(2) > 间距等分(3) > 画布(4) > 用户引导线(5) > 智能分布(6) |
| **互斥性** | 同一时刻每个轴只触发一种吸附（最近的） |
| **多方向独立** | X 轴和 Y 轴吸附独立判断，各自维护独立的 `snapped` 状态 |
| **阈值** | 默认 5px，可配置 |
| **固定边缘** | Resize 时固定边缘位置不变 |
| **临时关闭** | 按住 Alt/Option 临时关闭吸附 |

### 2.4 Figma 特有行为

| 特性 | 说明 |
|------|------|
| **吸附时保持相对位置** | 多选移动时，元素间相对位置不变，整体吸附 |
| **吸附线跨画布** | 引导线横跨整个画布可视区域 |
| **距离标签跟随** | 距离标签始终在引导线中央，跟随元素移动 |
| **多元素对齐提示** | 一个元素同时对齐多个元素时，显示多条引导线 |
| **缩放适配** | 引导线宽度随画布缩放自适应 |

---

## 三、完整数据结构

```typescript
// 引导线类型
type GuideType =
  // 元素级对齐
  | 'left'       // 左边缘对齐
  | 'right'      // 右边缘对齐
  | 'top'        // 上边缘对齐
  | 'bottom'     // 下边缘对齐
  | 'centerX'    // 垂直中心轴对齐
  | 'centerY'    // 水平中心轴对齐
  // 间距相等
  | 'spacingX'   // 水平间距相等
  | 'spacingY'   // 垂直间距相等
  // 画布级
  | 'canvasLeft'    // 画布左边缘
  | 'canvasRight'   // 画布右边缘
  | 'canvasTop'     // 画布上边缘
  | 'canvasBottom'  // 画布下边缘
  | 'canvasCenterX' // 画布垂直中心
  | 'canvasCenterY' // 画布水平中心
  // 智能分布
  | 'distributeX'   // 水平等分布
  | 'distributeY'   // 垂直等分布
  // 用户引导线
  | 'userH'         // 用户水平引导线
  | 'userV';        // 用户垂直引导线

// 引导线
interface AlignmentGuide {
  type: GuideType;
  position: number;           // 引导线位置（像素）
  sourceElementId?: string;   // 来源元素 ID（画布类/用户类无来源）
  sourceBounds?: Bounds;      // 来源元素包围盒
  distance?: number;          // 间距值（spacing/distribute 类型专用）
  relatedElementIds?: string[]; // 相关元素 ID 列表（等分/分布类型专用）
  priority: number;           // 优先级：1=edge, 2=center, 3=spacing, 4=canvas, 5=user, 6=distribute
  isSnapped: boolean;         // 是否已触发吸附
}

// 活跃边缘（决定哪些边参与吸附）
interface ActiveEdges {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

// 吸附结果
interface SnapResult {
  x: number;
  y: number;
  w: number;
  h: number;
  snapped: boolean;
  snappedGuides: AlignmentGuide[]; // 命中的引导线
}

// 元素包围盒
interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 线段坐标（特殊处理）
interface LineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// 距离信息（边到边）
interface EdgeGap {
  direction: 'left' | 'right' | 'top' | 'bottom';
  distance: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// 用户引导线
interface UserGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
}
```

---

## 四、核心函数设计

### 4.1 引导线收集层

#### `collectElementGuides` - 收集元素级引导线

收集所有其他元素的 6 类引导线（4 边 + 2 中心），不做阈值过滤。

```typescript
const collectElementGuides = (
  excludeIds: string[],
  elements: SolarWireElement[],
  getBounds: (id: string) => Bounds | null
): AlignmentGuide[] => {
  const guides: AlignmentGuide[] = [];

  elements.forEach((el) => {
    const id = el.id;
    if (excludeIds.includes(id)) return;

    const bounds = getBounds(id);
    if (!bounds || (bounds.w === 0 && bounds.h === 0)) return;

    const { x, y, w, h } = bounds;

    guides.push(
      { type: 'left',     position: x,         sourceElementId: id, sourceBounds: bounds, priority: 1, isSnapped: false },
      { type: 'right',    position: x + w,     sourceElementId: id, sourceBounds: bounds, priority: 1, isSnapped: false },
      { type: 'top',      position: y,         sourceElementId: id, sourceBounds: bounds, priority: 1, isSnapped: false },
      { type: 'bottom',   position: y + h,     sourceElementId: id, sourceBounds: bounds, priority: 1, isSnapped: false },
      { type: 'centerX',  position: x + w / 2, sourceElementId: id, sourceBounds: bounds, priority: 2, isSnapped: false },
      { type: 'centerY',  position: y + h / 2, sourceElementId: id, sourceBounds: bounds, priority: 2, isSnapped: false },
    );
  });

  return guides;
};
```

#### `collectSpacingGuides` - 收集间距相等引导线

检测当前元素与相邻元素之间是否存在相等间距。

```typescript
const collectSpacingGuides = (
  currentBounds: Bounds,
  allElementsBounds: Array<{ id: string; bounds: Bounds }>,
  threshold: number
): AlignmentGuide[] => {
  const guides: AlignmentGuide[] = [];

  // 将当前元素加入列表后排序，确保位置正确
  const allWithCurrent = [
    ...allElementsBounds,
    { id: 'current', bounds: currentBounds }
  ];

  // 按 X 排序，检测水平间距
  const sortedByX = allWithCurrent
    .filter(e => Math.abs(e.bounds.y - currentBounds.y) < threshold * 2)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  for (let i = 0; i < sortedByX.length - 1; i++) {
    const a = sortedByX[i];
    const b = sortedByX[i + 1];
    const gap = b.bounds.x - (a.bounds.x + a.bounds.w);

    // 连续两个间距相等时触发
    if (i > 0) {
      const prevGap = a.bounds.x - (sortedByX[i - 1].bounds.x + sortedByX[i - 1].bounds.w);
      if (Math.abs(gap - prevGap) < 2 && gap > 0 && prevGap > 0) {
        const spacingX = a.bounds.x + a.bounds.w + gap / 2;
        guides.push({
          type: 'spacingX',
          position: spacingX,
          distance: Math.round(gap),
          relatedElementIds: [sortedByX[i - 1].id, a.id, b.id],
          priority: 3,
          isSnapped: false
        });
      }
    }
  }

  // 将当前元素加入列表后排序，确保位置正确
  const allWithCurrentY = [
    ...allElementsBounds,
    { id: 'current', bounds: currentBounds }
  ];

  // 按 Y 排序，检测垂直间距（同理）
  const sortedByY = allWithCurrentY
    .filter(e => Math.abs(e.bounds.x - currentBounds.x) < threshold * 2)
    .sort((a, b) => a.bounds.y - b.bounds.y);

  for (let i = 0; i < sortedByY.length - 1; i++) {
    const a = sortedByY[i];
    const b = sortedByY[i + 1];
    const gap = b.bounds.y - (a.bounds.y + a.bounds.h);

    // 连续两个间距相等时触发
    if (i > 0) {
      const prevGap = a.bounds.y - (sortedByY[i - 1].bounds.y + sortedByY[i - 1].bounds.h);
      if (Math.abs(gap - prevGap) < 2 && gap > 0 && prevGap > 0) {
        const spacingY = a.bounds.y + a.bounds.h + gap / 2;
        guides.push({
          type: 'spacingY',
          position: spacingY,
          distance: Math.round(gap),
          relatedElementIds: [sortedByY[i - 1].id, a.id, b.id],
          priority: 3,
          isSnapped: false
        });
      }
    }
  }

  return guides;
};
```

#### `collectCanvasGuides` - 收集画布级引导线

```typescript
const collectCanvasGuides = (
  canvasBounds: { width: number; height: number }
): AlignmentGuide[] => {
  return [
    { type: 'canvasLeft',     position: 0,                  priority: 4, isSnapped: false },
    { type: 'canvasRight',    position: canvasBounds.width, priority: 4, isSnapped: false },
    { type: 'canvasTop',      position: 0,                  priority: 4, isSnapped: false },
    { type: 'canvasBottom',   position: canvasBounds.height,priority: 4, isSnapped: false },
    { type: 'canvasCenterX',  position: canvasBounds.width / 2, priority: 4, isSnapped: false },
    { type: 'canvasCenterY',  position: canvasBounds.height / 2, priority: 4, isSnapped: false },
  ];
};
```

#### `collectDistributeGuides` - 收集智能分布引导线

当 3+ 元素在一条线上等间距排列时，显示分布提示线。

```typescript
const collectDistributeGuides = (
  currentBounds: Bounds,
  allElementsBounds: Array<{ id: string; bounds: Bounds }>,
  threshold: number
): AlignmentGuide[] => {
  const guides: AlignmentGuide[] = [];

  // 将当前元素加入列表
  const allWithCurrent = [
    ...allElementsBounds,
    { id: 'current', bounds: currentBounds }
  ];

  // 检测水平方向：找到与当前元素 Y 接近的所有元素
  const yAligned = allWithCurrent
    .filter(e => Math.abs(e.bounds.y - currentBounds.y) < threshold * 2)
    .sort((a, b) => a.bounds.x - b.bounds.x);

  if (yAligned.length >= 3) {
    // 计算相邻间距
    const gaps: number[] = [];
    for (let i = 0; i < yAligned.length - 1; i++) {
      const gap = yAligned[i + 1].bounds.x - (yAligned[i].bounds.x + yAligned[i].bounds.w);
      gaps.push(gap);
    }

    // 检查是否所有间距相等（允许 2px 误差）
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const isUniform = gaps.every(g => Math.abs(g - avgGap) < 2 && g > 0);

    if (isUniform && gaps.length >= 2) {
      // 在每两个元素之间显示分布线
      for (let i = 0; i < yAligned.length - 1; i++) {
        const distX = yAligned[i].bounds.x + yAligned[i].bounds.w + avgGap / 2;
        guides.push({
          type: 'distributeX',
          position: distX,
          distance: Math.round(avgGap),
          relatedElementIds: [yAligned[i].id, yAligned[i + 1].id],
          priority: 6,
          isSnapped: false
        });
      }
    }
  }

  // 垂直方向同理
  const xAligned = allWithCurrent
    .filter(e => Math.abs(e.bounds.x - currentBounds.x) < threshold * 2)
    .sort((a, b) => a.bounds.y - b.bounds.y);

  if (xAligned.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < xAligned.length - 1; i++) {
      const gap = xAligned[i + 1].bounds.y - (xAligned[i].bounds.y + xAligned[i].bounds.h);
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const isUniform = gaps.every(g => Math.abs(g - avgGap) < 2 && g > 0);

    if (isUniform && gaps.length >= 2) {
      for (let i = 0; i < xAligned.length - 1; i++) {
        const distY = xAligned[i].bounds.y + xAligned[i].bounds.h + avgGap / 2;
        guides.push({
          type: 'distributeY',
          position: distY,
          distance: Math.round(avgGap),
          relatedElementIds: [xAligned[i].id, xAligned[i + 1].id],
          priority: 6,
          isSnapped: false
        });
      }
    }
  }

  return guides;
};
```

#### `collectUserGuides` - 收集用户引导线

```typescript
const collectUserGuides = (
  userGuides: UserGuide[]
): AlignmentGuide[] => {
  return userGuides.map(guide => ({
    type: guide.type === 'horizontal' ? 'userH' : 'userV',
    position: guide.position,
    priority: 5,
    isSnapped: false
  }));
};
```

### 4.2 吸附计算层

#### `snapToGuides` - 统一吸附函数

```typescript
const snapToGuides = (
  guides: AlignmentGuide[],
  currentX: number,
  currentY: number,
  currentW: number,
  currentH: number,
  activeEdges: ActiveEdges,
  threshold: number = 5,
  altPressed: boolean = false // Alt 临时关闭吸附
): SnapResult => {
  // Alt 键临时关闭吸附
  if (altPressed) {
    return {
      x: currentX, y: currentY, w: currentW, h: currentH,
      snapped: false, snappedGuides: []
    };
  }

  let resultX = currentX;
  let resultY = currentY;
  let resultW = currentW;
  let resultH = currentH;
  let snapped = false;
  const snappedGuides: AlignmentGuide[] = [];

  // 固定边缘（resize 时使用）
  const fixedRight = currentX + currentW;
  const fixedBottom = currentY + currentH;

  // 当前元素的对齐位置
  const myLeft = currentX;
  const myRight = currentX + currentW;
  const myTop = currentY;
  const myBottom = currentY + currentH;
  const myCenterX = currentX + currentW / 2;
  const myCenterY = currentY + currentH / 2;

  // 按优先级排序引导线
  const sortedGuides = [...guides].sort((a, b) => a.priority - b.priority);

  // ===== X 轴吸附 =====
  let bestXDistance = threshold;
  let bestXGuide: AlignmentGuide | null = null;
  let bestXSnapped = { x: currentX, w: currentW };

  for (const guide of sortedGuides) {
    let distance = Infinity;
    let candidate: { x: number; w: number } | null = null;

    switch (guide.type) {
      case 'left':
      case 'canvasLeft':
      case 'userV':
        if (activeEdges.left) {
          distance = Math.abs(myLeft - guide.position);
          if (distance < bestXDistance) {
            candidate = { x: guide.position, w: fixedRight - guide.position };
          }
        }
        break;

      case 'right':
      case 'canvasRight':
        if (activeEdges.right) {
          distance = Math.abs(myRight - guide.position);
          if (distance < bestXDistance) {
            candidate = { w: guide.position - currentX };
          }
        }
        break;

      case 'centerX':
      case 'canvasCenterX':
        if (activeEdges.left || activeEdges.right) {
          distance = Math.abs(myCenterX - guide.position);
          if (distance < bestXDistance) {
            const delta = guide.position - myCenterX;
            candidate = { x: currentX + delta, w: currentW };
          }
        }
        break;

      case 'spacingX':
        if (activeEdges.right) {
          distance = Math.abs(myRight - guide.position);
          if (distance < bestXDistance) {
            candidate = { w: guide.position - currentX };
          }
        }
        break;

      case 'distributeX':
        if (activeEdges.right) {
          distance = Math.abs(myRight - guide.position);
          if (distance < bestXDistance) {
            candidate = { w: guide.position - currentX };
          }
        }
        break;
    }

    if (candidate && distance < bestXDistance) {
      bestXDistance = distance;
      bestXSnapped = candidate;
      bestXGuide = guide;
    }
  }

  if (bestXGuide) {
    resultX = bestXSnapped.x;
    resultW = Math.max(10, bestXSnapped.w);
    snapped = true;
    bestXGuide.isSnapped = true;
    snappedGuides.push(bestXGuide);
  }

  // ===== Y 轴吸附（独立判断） =====
  let bestYDistance = threshold;
  let bestYGuide: AlignmentGuide | null = null;
  let bestYSnapped = { y: currentY, h: currentH };

  for (const guide of sortedGuides) {
    let distance = Infinity;
    let candidate: { y: number; h: number } | null = null;

    switch (guide.type) {
      case 'top':
      case 'canvasTop':
      case 'userH':
        if (activeEdges.top) {
          distance = Math.abs(myTop - guide.position);
          if (distance < bestYDistance) {
            candidate = { y: guide.position, h: fixedBottom - guide.position };
          }
        }
        break;

      case 'bottom':
      case 'canvasBottom':
        if (activeEdges.bottom) {
          distance = Math.abs(myBottom - guide.position);
          if (distance < bestYDistance) {
            candidate = { h: guide.position - currentY };
          }
        }
        break;

      case 'centerY':
      case 'canvasCenterY':
        if (activeEdges.top || activeEdges.bottom) {
          distance = Math.abs(myCenterY - guide.position);
          if (distance < bestYDistance) {
            const delta = guide.position - myCenterY;
            candidate = { y: currentY + delta, h: currentH };
          }
        }
        break;

      case 'spacingY':
        if (activeEdges.bottom) {
          distance = Math.abs(myBottom - guide.position);
          if (distance < bestYDistance) {
            candidate = { h: guide.position - currentY };
          }
        }
        break;

      case 'distributeY':
        if (activeEdges.bottom) {
          distance = Math.abs(myBottom - guide.position);
          if (distance < bestYDistance) {
            candidate = { h: guide.position - currentY };
          }
        }
        break;
    }

    if (candidate && distance < bestYDistance) {
      bestYDistance = distance;
      bestYSnapped = candidate;
      bestYGuide = guide;
    }
  }

  if (bestYGuide) {
    resultY = bestYSnapped.y;
    resultH = Math.max(10, bestYSnapped.h);
    snapped = true;
    bestYGuide.isSnapped = true;
    snappedGuides.push(bestYGuide);
  }

  return {
    x: resultX,
    y: resultY,
    w: resultW,
    h: resultH,
    snapped,
    snappedGuides
  };
};
```

### 4.3 活跃边缘映射

```typescript
// 移动时：所有边缘都活跃
const getActiveEdgesForMove = (): ActiveEdges => ({
  left: true, right: true, top: true, bottom: true
});

// Resize 时：根据句柄决定活跃边缘
const getActiveEdgesForResize = (
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 'e' | 's' | 'w'
): ActiveEdges => ({
  left: handle.includes('w'),
  right: handle.includes('e'),
  top: handle.includes('n'),
  bottom: handle.includes('s'),
});

// 多选移动：包围盒的所有边缘都活跃
const getActiveEdgesForGroupMove = (): ActiveEdges => ({
  left: true, right: true, top: true, bottom: true
});
```

### 4.4 元素包围盒计算（含线段）

```typescript
// 通用包围盒计算
const getElementBounds = (
  element: SolarWireElement
): Bounds | null => {
  if (element.location?.line) {
    const { x1, y1, x2, y2 } = element.location.line;
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1)
    };
  }
  return null;
};

// 多选元素包围盒
const getGroupBounds = (
  elements: SolarWireElement[],
  ids: string[]
): Bounds | null => {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  ids.forEach(id => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const bounds = getElementBounds(el);
    if (!bounds) return;

    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.w);
    maxY = Math.max(maxY, bounds.y + bounds.h);
  });

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
};
```

### 4.5 距离信息计算

```typescript
const calculateEdgeGaps = (
  currentBounds: Bounds,
  allElementsBounds: Array<{ id: string; bounds: Bounds }>,
  maxDistance: number = 100
): EdgeGap[] => {
  const gaps: EdgeGap[] = [];

  allElementsBounds.forEach(({ bounds }) => {
    // 检查 Y 轴是否有重叠（投影轴方向）
    const yOverlap = !(currentBounds.y + currentBounds.h < bounds.y ||
                       currentBounds.y > bounds.y + bounds.h);

    if (yOverlap) {
      // 右侧间距
      const rightGap = bounds.x - (currentBounds.x + currentBounds.w);
      if (rightGap > 0 && rightGap < maxDistance) {
        gaps.push({
          direction: 'right',
          distance: rightGap,
          startX: currentBounds.x + currentBounds.w,
          startY: (currentBounds.y + currentBounds.h + bounds.y) / 2,
          endX: bounds.x,
          endY: (currentBounds.y + currentBounds.h + bounds.y) / 2
        });
      }

      // 左侧间距
      const leftGap = currentBounds.x - (bounds.x + bounds.w);
      if (leftGap > 0 && leftGap < maxDistance) {
        gaps.push({
          direction: 'left',
          distance: leftGap,
          startX: bounds.x + bounds.w,
          startY: (currentBounds.y + currentBounds.h + bounds.y) / 2,
          endX: currentBounds.x,
          endY: (currentBounds.y + currentBounds.h + bounds.y) / 2
        });
      }
    }

    // 检查 X 轴是否有重叠
    const xOverlap = !(currentBounds.x + currentBounds.w < bounds.x ||
                       currentBounds.x > bounds.x + bounds.w);

    if (xOverlap) {
      // 下侧间距
      const bottomGap = bounds.y - (currentBounds.y + currentBounds.h);
      if (bottomGap > 0 && bottomGap < maxDistance) {
        gaps.push({
          direction: 'bottom',
          distance: bottomGap,
          startX: (currentBounds.x + currentBounds.w + bounds.x) / 2,
          startY: currentBounds.y + currentBounds.h,
          endX: (currentBounds.x + currentBounds.w + bounds.x) / 2,
          endY: bounds.y
        });
      }

      // 上侧间距
      const topGap = currentBounds.y - (bounds.y + bounds.h);
      if (topGap > 0 && topGap < maxDistance) {
        gaps.push({
          direction: 'top',
          distance: topGap,
          startX: (currentBounds.x + currentBounds.w + bounds.x) / 2,
          startY: bounds.y + bounds.h,
          endX: (currentBounds.x + currentBounds.w + bounds.x) / 2,
          endY: currentBounds.y
        });
      }
    }
  });

  return gaps;
};
```

---

## 五、完整调用流程

### 5.1 移动场景

```typescript
// handleMouseMove - 移动分支
const newX = dragElementState.elementX + dx;
const newY = dragElementState.elementY + dy;

// 1. 收集所有引导线
const excludeIds = [dragElementState.elementId];
const elementGuides = collectElementGuides(excludeIds, elements, getElementBounds);
const spacingGuides = collectSpacingGuides(
  { x: newX, y: newY, w: elementW, h: elementH },
  elements.filter(e => !excludeIds.includes(e.id)).map(e => ({ id: e.id, bounds: getElementBounds(e)! })),
  ALIGN_THRESHOLD
);
const distributeGuides = collectDistributeGuides(
  { x: newX, y: newY, w: elementW, h: elementH },
  elements.filter(e => !excludeIds.includes(e.id)).map(e => ({ id: e.id, bounds: getElementBounds(e)! })),
  ALIGN_THRESHOLD
);
const canvasGuides = collectCanvasGuides({ width: canvasWidth, height: canvasHeight });
const userGuides = collectUserGuides(userGuideList); // 用户引导线

const allGuides = [
  ...elementGuides,
  ...spacingGuides,
  ...distributeGuides,
  ...canvasGuides,
  ...userGuides
];

// 2. 查找吸附
const activeEdges = getActiveEdgesForMove();
const snapped = snapToGuides(allGuides, newX, newY, elementW, elementH, activeEdges, ALIGN_THRESHOLD, e.altKey);

// 3. 使用吸附后的位置
const finalX = snapped.x;
const finalY = snapped.y;

// 4. 计算并渲染距离信息
const currentBounds = { x: finalX, y: finalY, w: elementW, h: elementH };
const edgeGaps = calculateEdgeGaps(currentBounds,
  elements.filter(e => !excludeIds.includes(e.id)).map(e => ({ id: e.id, bounds: getElementBounds(e)! })));

// 5. 更新状态
setAlignmentGuides(allGuides); // 包含已吸附和未吸附的所有引导线
setEdgeGaps(edgeGaps);
```

### 5.2 Resize 场景

```typescript
// handleMouseMove - resize 分支
let newX = ...;
let newY = ...;
let newW = ...;
let newH = ...;

// 1. 收集引导线（Resize 不需要 spacing/distribute）
const excludeIds = [resizeHandleState.elementId];
const elementGuides = collectElementGuides(excludeIds, elements, getElementBounds);
const canvasGuides = collectCanvasGuides({ width: canvasWidth, height: canvasHeight });
const userGuides = collectUserGuides(userGuideList);
const allGuides = [...elementGuides, ...canvasGuides, ...userGuides];

// 2. 查找吸附
const activeEdges = getActiveEdgesForResize(resizeHandleState.handle);
const snapped = snapToGuides(allGuides, newX, newY, newW, newH, activeEdges, ALIGN_THRESHOLD, e.altKey);

// 3. 使用吸附后的位置
if (snapped.snapped) {
  newX = snapped.x;
  newY = snapped.y;
  newW = snapped.w;
  newH = snapped.h;
}

// 4. 更新状态
setAlignmentGuides(allGuides);
setEdgeGaps([]); // Resize 时不显示距离信息
```

### 5.3 多选移动场景

```typescript
// handleMouseMove - 多选移动分支
const groupBounds = getGroupBounds(elements, multiDragElements.map(e => e.elementId));
if (!groupBounds) return;

const newX = groupBounds.x + dx;
const newY = groupBounds.y + dy;

// 1. 收集引导线
const excludeIds = multiDragElements.map(e => e.elementId);
const otherElements = elements.filter(e => !excludeIds.includes(e.id));
const elementGuides = collectElementGuides(excludeIds, otherElements, getElementBounds);
const canvasGuides = collectCanvasGuides({ width: canvasWidth, height: canvasHeight });
const userGuides = collectUserGuides(userGuideList);
const allGuides = [...elementGuides, ...canvasGuides, ...userGuides];

// 2. 查找吸附
const activeEdges = getActiveEdgesForGroupMove();
const snapped = snapToGuides(allGuides, newX, newY, groupBounds.w, groupBounds.h, activeEdges, ALIGN_THRESHOLD, e.altKey);

// 3. 计算吸附偏移
const snapOffsetX = snapped.x - groupBounds.x;
const snapOffsetY = snapped.y - groupBounds.y;

// 4. 应用到所有选中元素（保持相对位置）
multiDragElements.forEach(el => {
  const finalX = el.elementX + dx + snapOffsetX;
  const finalY = el.elementY + dy + snapOffsetY;
  updateElementPosition(el.elementId, finalX, finalY);
});

// 5. 更新状态
setAlignmentGuides(allGuides);
```

---

## 六、视觉渲染

### 6.1 引导线渲染（分类渲染）

```typescript
const renderAlignmentGuides = (guides: AlignmentGuide[]) => {
  return guides.map((guide, index) => {
    const { type, position, isSnapped, distance } = guide;

    // 画布引导线：默认隐藏，元素靠近时显示
    if (type.startsWith('canvas')) {
      // canvasCenterX/Y 默认不渲染，仅在元素接近画布中心时显示
      if ((type === 'canvasCenterX' || type === 'canvasCenterY') && !isSnapped) {
        return null;
      }
      return renderCanvasGuide(guide);
    }

    // 用户引导线：固定位置，特殊样式
    if (type.startsWith('user')) {
      return renderUserGuide(guide);
    }

    // 已吸附的引导线：高亮显示
    if (isSnapped) {
      return renderSnappedGuide(guide);
    }

    // 未吸附但接近的引导线：弱化显示
    return renderFaintGuide(guide);
  });
};
```

### 6.2 引导线淡入淡出动画

Figma 中引导线出现/消失时有平滑过渡，避免突兀闪烁。

```css
/* 引导线基础样式 */
.alignment-guide {
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

/* 吸附状态 */
.alignment-guide.snapped {
  opacity: 1;
}

/* 接近但未吸附 */
.alignment-guide.faint {
  opacity: 0.3;
}

/* 画布中心线 */
.alignment-guide.canvas-center {
  opacity: 0.5;
}

/* 用户引导线 */
.alignment-guide.user-guide {
  opacity: 0.8;
}
```

```typescript
// 引导线状态管理（使用 useRef 缓存上一帧状态）
const [guideVisibility, setGuideVisibility] = useState<Record<string, boolean>>({});

useEffect(() => {
  // 计算当前帧需要显示的引导线
  const currentGuides = new Set(snappedGuides.map(g => `${g.type}-${g.position}`));
  
  // 上一帧存在但当前帧不存在的引导线：延迟隐藏（过渡效果）
  setGuideVisibility(prev => {
    const next: Record<string, boolean> = {};
    
    // 当前激活的引导线立即显示
    currentGuides.forEach(key => {
      next[key] = true;
    });
    
    // 上一帧的引导线：标记为即将隐藏（通过 CSS transition 实现淡出）
    Object.keys(prev).forEach(key => {
      if (!currentGuides.has(key)) {
        next[key] = false;
      }
    });
    
    return next;
  });
}, [snappedGuides]);
```

### 6.3 各种引导线样式

```typescript
// 元素对齐引导线（吸附时高亮）
const renderSnappedGuide = (guide: AlignmentGuide) => {
  const isHorizontal = guide.type === 'top' || guide.type === 'bottom' ||
                       guide.type === 'centerY' || guide.type === 'spacingY' ||
                       guide.type === 'distributeY' || guide.type === 'userH';

  return (
    <line
      x1={isHorizontal ? 0 : guide.position}
      y1={isHorizontal ? guide.position : 0}
      x2={isHorizontal ? canvasWidth : guide.position}
      y2={isHorizontal ? guide.position : canvasHeight}
      stroke={primaryColor}
      strokeWidth={2 / scale}
      strokeDasharray={guide.type.startsWith('spacing') || guide.type.startsWith('distribute')
        ? `${4 / scale},${4 / scale}` : 'none'}
    />
  );
};

// 弱化引导线（接近但未吸附）
const renderFaintGuide = (guide: AlignmentGuide) => {
  const isHorizontal = guide.type === 'top' || guide.type === 'bottom' ||
                       guide.type === 'centerY' || guide.type === 'spacingY' ||
                       guide.type === 'distributeY' || guide.type === 'userH';

  return (
    <line
      className="alignment-guide faint"
      x1={isHorizontal ? 0 : guide.position}
      y1={isHorizontal ? guide.position : 0}
      x2={isHorizontal ? canvasWidth : guide.position}
      y2={isHorizontal ? guide.position : canvasHeight}
      stroke={primaryColor}
      strokeWidth={1 / scale}
      strokeDasharray={`${4 / scale},${4 / scale}`}
      opacity={0.3}
    />
  );
};

// 画布中心线
const renderCanvasGuide = (guide: AlignmentGuide) => {
  const isHorizontal = guide.type === 'canvasTop' || guide.type === 'canvasBottom' ||
                       guide.type === 'canvasCenterY';

  return (
    <line
      className="alignment-guide canvas-center"
      x1={isHorizontal ? 0 : guide.position}
      y1={isHorizontal ? guide.position : 0}
      x2={isHorizontal ? canvasWidth : guide.position}
      y2={isHorizontal ? guide.position : canvasHeight}
      stroke={primaryColor}
      strokeWidth={1 / scale}
      strokeDasharray={`${6 / scale},${6 / scale}`}
      opacity={0.5}
    />
  );
};

// 用户引导线
const renderUserGuide = (guide: AlignmentGuide) => {
  const isHorizontal = guide.type === 'userH';

  return (
    <line
      className="alignment-guide user-guide"
      x1={isHorizontal ? 0 : guide.position}
      y1={isHorizontal ? guide.position : 0}
      x2={isHorizontal ? canvasWidth : guide.position}
      y2={isHorizontal ? guide.position : canvasHeight}
      stroke={userGuideColor || '#8B5CF6'}
      strokeWidth={2 / scale}
      strokeDasharray="none"
      opacity={0.8}
    />
  );
};
```

### 6.3 距离标签渲染

```typescript
const renderDistanceLabel = (gap: EdgeGap) => {
  const midX = (gap.startX + gap.endX) / 2;
  const midY = (gap.startY + gap.endY) / 2;

  return (
    <g>
      {/* 距离线 */}
      <line
        x1={gap.startX}
        y1={gap.startY}
        x2={gap.endX}
        y2={gap.endY}
        stroke={primaryColor}
        strokeWidth={1 / scale}
        opacity={0.6}
      />
      {/* 距离标签 */}
      <rect
        x={midX - 15 / scale}
        y={midY - 8 / scale}
        width={30 / scale}
        height={16 / scale}
        fill={primaryColor}
        rx={2 / scale}
      />
      <text
        x={midX}
        y={midY + 4 / scale}
        textAnchor="middle"
        fill="#fff"
        fontSize={10 / scale}
      >
        {Math.round(gap.distance)}
      </text>
    </g>
  );
};
```

---

## 七、变更文件清单

### 7.1 变量来源定义

| 变量 | 来源 | 说明 |
|------|------|------|
| `canvasWidth` / `canvasHeight` | `SolarWirePreview` 组件内部状态或 props，从 SVG viewBox 或容器尺寸获取 | 画布可视区域尺寸 |
| `updateElementPosition` | `solarWireStore` 的 action，或直接操作 elements 数组 | 更新元素位置的统一入口 |
| `scale` | 画布缩放状态，来自 `solarWireStore` 或组件状态 | 当前画布缩放比例 |
| `userGuideList` | `solarWireStore.userGuides` | 用户自定义引导线列表 |

### 7.2 文件变更清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `SolarWirePreview.tsx` | 新增 | `collectElementGuides` |
| `SolarWirePreview.tsx` | 新增 | `collectSpacingGuides` |
| `SolarWirePreview.tsx` | 新增 | `collectCanvasGuides` |
| `SolarWirePreview.tsx` | 新增 | `collectDistributeGuides` |
| `SolarWirePreview.tsx` | 新增 | `collectUserGuides` |
| `SolarWirePreview.tsx` | 新增 | `calculateEdgeGaps` |
| `SolarWirePreview.tsx` | 重写 | `snapToGuides` 替代 `snapToAlignment` |
| `SolarWirePreview.tsx` | 删除 | `calculateAlignmentGuides`（旧版） |
| `SolarWirePreview.tsx` | 删除 | `snapToAlignment`（旧版） |
| `SolarWirePreview.tsx` | 修改 | 移动分支调用新逻辑 |
| `SolarWirePreview.tsx` | 修改 | Resize 分支调用新逻辑 |
| `SolarWirePreview.tsx` | 新增 | 多选移动吸附分支 |
| `SolarWirePreview.tsx` | 修改 | `renderAlignmentGuides` 多类型引导线 |
| `SolarWirePreview.tsx` | 修改 | 距离信息渲染 |
| `solarWireStore.ts` | 新增 | `userGuides` 状态（用户引导线） |

---

## 八、快捷键对照表

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Alt` (Windows) / `Option` (Mac) | 临时关闭吸附 | 按住时移动/Resize 不触发任何吸附，松开后恢复 |
| `Shift` + 拖拽句柄 | 等比例缩放 | Resize 时保持宽高比（如 1:1、4:3） |
| `Alt` + 拖拽元素 | 复制元素 | 拖动时复制当前元素（Figma 标准） |
| `Cmd/Ctrl` + `D` | 等距复制 | Duplicate 并自动偏移（偏移量 = 上次复制的偏移） |
| `Cmd/Ctrl` + `G` | 编组 | 将选中元素编为 Group，吸附时作为整体 |
| `Cmd/Ctrl` + `Shift` + `G` | 取消编组 | 解散 Group |

---

## 九、补充特性说明

### 9.1 Frame/Group 边界吸附

当元素靠近 Frame 或 Group 边缘时，触发边界吸附：

```typescript
// 收集 Frame/Group 边界引导线
const collectFrameGuides = (
  frames: Array<{ id: string; bounds: Bounds }>,
  excludeIds: string[]
): AlignmentGuide[] => {
  return frames
    .filter(f => !excludeIds.includes(f.id))
    .flatMap(frame => [
      { type: 'left', position: frame.bounds.x, sourceElementId: frame.id, sourceBounds: frame.bounds, priority: 1, isSnapped: false },
      { type: 'right', position: frame.bounds.x + frame.bounds.w, sourceElementId: frame.id, sourceBounds: frame.bounds, priority: 1, isSnapped: false },
      { type: 'top', position: frame.bounds.y, sourceElementId: frame.id, sourceBounds: frame.bounds, priority: 1, isSnapped: false },
      { type: 'bottom', position: frame.bounds.y + frame.bounds.h, sourceElementId: frame.id, sourceBounds: frame.bounds, priority: 1, isSnapped: false },
    ]);
};
```

### 9.2 Scale 缩放吸附（Resize 特殊模式）

当使用 `Alt` + 拖拽角句柄时，进入等比例缩放模式，此时吸附行为略有不同：

- 中心轴吸附优先级提升（保持视觉中心不变）
- 边缘吸附同时应用到对边（对称缩放）

```typescript
// 等比例缩放时的吸附修正
const snapWithAspectRatio = (
  guides: AlignmentGuide[],
  currentX: number,
  currentY: number,
  currentW: number,
  currentH: number,
  aspectRatio: number, // width / height
  activeEdges: ActiveEdges,
  threshold: number
): SnapResult => {
  // 先按宽度吸附，高度自动计算
  const widthResult = snapToGuides(guides, currentX, currentY, currentW, currentW / aspectRatio, activeEdges, threshold);
  return {
    ...widthResult,
    h: widthResult.w / aspectRatio
  };
};
```

### 9.3 多选元素间引导线

多选移动时，除了整体包围盒吸附外，还会显示选中元素之间的对齐关系：

```typescript
// 多选内部对齐引导线
const collectInternalGroupGuides = (
  selectedElements: Array<{ id: string; bounds: Bounds }>
): AlignmentGuide[] => {
  const guides: AlignmentGuide[] = [];
  
  // 检测选中元素之间是否有对齐关系
  for (let i = 0; i < selectedElements.length; i++) {
    for (let j = i + 1; j < selectedElements.length; j++) {
      const a = selectedElements[i];
      const b = selectedElements[j];
      
      // 左边缘对齐
      if (Math.abs(a.bounds.x - b.bounds.x) < 2) {
        guides.push({
          type: 'left',
          position: a.bounds.x,
          sourceElementId: a.id,
          relatedElementIds: [a.id, b.id],
          priority: 1,
          isSnapped: true
        });
      }
      // 中心轴对齐、右边缘对齐等同理...
    }
  }
  
  return guides;
};
```

---

## 十、特性对照表（完整性检查）

| # | Figma 特性 | 本方案 | 状态 |
|---|-----------|--------|------|
| 1 | 移动-边缘对齐（4 边） | ✅ `left/right/top/bottom` | 已覆盖 |
| 2 | 移动-中心轴对齐（2 轴） | ✅ `centerX/centerY` | 已覆盖 |
| 3 | 移动-间距相等吸附 | ✅ `spacingX/spacingY` | 已覆盖 |
| 4 | 移动-画布边缘吸附 | ✅ `canvasLeft/Right/Top/Bottom` | 已覆盖 |
| 5 | 移动-画布中心吸附 | ✅ `canvasCenterX/CenterY` | 已覆盖 |
| 6 | Resize-边缘对齐（4 边） | ✅ 活跃边缘控制 | 已覆盖 |
| 7 | Resize-中心轴对齐 | ✅ 角句柄支持 | 已覆盖 |
| 8 | 多选-包围盒吸附 | ✅ `getGroupBounds` + 吸附偏移 | 已覆盖 |
| 9 | 视觉-对齐引导线（吸附高亮） | ✅ `renderSnappedGuide` | 已覆盖 |
| 10 | 视觉-间距引导线+标签 | ✅ `spacingX/Y` + `renderDistanceLabel` | 已覆盖 |
| 11 | 视觉-画布中心线（弱化） | ✅ `renderCanvasGuide` | 已覆盖 |
| 12 | 视觉-距离线+标签 | ✅ `calculateEdgeGaps` + `renderDistanceLabel` | 已覆盖 |
| 13 | 视觉-分布线（3+ 元素） | ✅ `collectDistributeGuides` | 已覆盖 |
| 14 | 视觉-用户引导线 | ✅ `collectUserGuides` | 已覆盖 |
| 15 | 行为-X/Y 轴独立吸附 | ✅ 分开判断 | 已覆盖 |
| 16 | 行为-优先级系统 | ✅ priority 字段 | 已覆盖 |
| 17 | 行为-固定边缘（Resize） | ✅ `fixedRight/fixedBottom` | 已覆盖 |
| 18 | 行为-Alt 临时关闭吸附 | ✅ `altPressed` 参数 | 已覆盖 |
| 19 | 行为-吸附时保持相对位置 | ✅ 多选偏移计算 | 已覆盖 |
| 20 | 线段元素吸附 | ✅ `getElementBounds` 特殊处理 | 已覆盖 |
| 21 | 引导线全量生成+吸附时过滤 | ✅ 分离收集层和吸附层 | 已覆盖 |
| 22 | 引导线使用吸附后位置渲染 | ✅ `snappedGuides` 传递 | 已覆盖 |
| 23 | 引导线跨画布渲染 | ✅ 引导线从 0 到 canvasWidth/Height | 已覆盖 |
| 24 | 缩放适配 | ✅ `strokeWidth` 和 `fontSize` 除以 `scale` | 已覆盖 |
| 25 | 快捷键-Alt 临时关闭 | ✅ `altPressed` 参数 | 已覆盖 |
| 26 | Frame/Group 边界吸附 | ✅ `collectFrameGuides` | 已覆盖 |
| 27 | Scale 等比例缩放吸附 | ✅ `snapWithAspectRatio` | 已覆盖 |
| 28 | 多选内部引导线 | ✅ `collectInternalGroupGuides` | 已覆盖 |
| 29 | 引导线淡入淡出动画 | ✅ CSS transition + state 管理 | 已覆盖 |
| 30 | 画布中心线默认隐藏 | ✅ 仅接近时渲染 | 已覆盖 |

**覆盖率：30/30 = 100%**

---

## 十一、风险与约束

1. **性能**：引导线全量生成，元素数量多时可能影响性能
   - 缓解：设置上限 100 元素，超过时按距离过滤
2. **兼容性**：不改变现有 SolarWire 文件格式
3. **阈值可配置**：对齐阈值默认 5px，后续可接入设置面板
4. **用户引导线持久化**：需考虑是否保存到 SolarWire 文件

---

## 十二、实施步骤

1. **Phase 1**：新增 5 个收集函数（element/spacing/canvas/distribute/user）
2. **Phase 2**：新增 `calculateEdgeGaps` 和 `getGroupBounds`
3. **Phase 3**：重写 `snapToGuides`，删除旧的 `calculateAlignmentGuides` 和 `snapToAlignment`
4. **Phase 4**：更新移动分支调用新逻辑
5. **Phase 5**：更新 Resize 分支调用新逻辑
6. **Phase 6**：实现多选移动吸附
7. **Phase 7**：更新 `renderAlignmentGuides` 支持多类型引导线
8. **Phase 8**：实现距离信息渲染
9. **Phase 9**：实现 Alt/Option 临时关闭吸附
10. **Phase 10**：TypeScript 编译验证 + 功能测试
