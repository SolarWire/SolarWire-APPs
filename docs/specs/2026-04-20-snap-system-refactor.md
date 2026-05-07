# 吸附系统重构方案

> 日期：2026-04-20
> 状态：待审批
> 背景：修复 resize 吸附导致的右下角跳变问题，优化吸附体验

---

## 一、问题诊断

### 1.1 核心问题

**resize 吸附时，对向边（如右下角）产生意外位移**

### 1.2 根本原因

`snapToGuides` 内部使用 `fixedRight = currentX + currentW` 计算固定边，但 `currentX/currentW` 是**当前帧的临时值**（已包含鼠标偏移 dx/dy），而非**鼠标按下时的起始位置**。

当左侧边吸附时：
```typescript
// 当前逻辑
candidate = { x: guide.position, w: fixedRight - guide.position };
// fixedRight = newX + newW（已包含 dx，不是固定的！）
```

这导致吸附时重新计算了 `newW`，对向边位置发生变化。

### 1.3 吸附解除缺失

当手柄吸附到参考线后，如果用户继续拖动超过一定距离，吸附不会自动解除，导致"手柄被吸住拖不动"的糟糕体验。

---

## 二、重构方案

### 2.1 核心思路

**职责分离**：
- **resize 分支**：负责句柄拖动和固定边计算（已正确实现，无需修改）
- **snapToGuides**：只负责找到参考线并微调句柄坐标，**不重新计算宽度/高度**
- **吸附解除**：当句柄偏移超过阈值时自动解除吸附

**关键洞察**：
- resize 分支已正确计算 `newX = elementX + dx, newW = startW - dx`（nw 手柄）
- `snapToGuides` 只需微调 `newX`（如吸附到参考线）
- resize 分支根据微调后的 `newX` 重新计算 `newW = startW - (newX - elementX)`
- 固定边自动保留，无需在 `snapToGuides` 中处理

### 2.2 吸附系统架构

```
吸附系统 = 多个独立方法的组合

1. collectGuides()       → 收集参考线（元素/画布/间距/用户）
2. snapToGuides()        → 计算吸附后的坐标（只微调，不干预尺寸）
3. renderGuides()        → 渲染参考线（snapped/faint 状态）
4. shouldCancelSnap()    → 判断是否应取消吸附（新增）
```

---

## 三、具体变更

### 3.1 `snapToGuides` 函数简化

#### 变更：移除 fixedRight/fixedBottom 计算，只返回吸附后的坐标

```typescript
const snapToGuides = useCallback((
  guides: AlignmentGuide[],
  currentX: number,
  currentY: number,
  currentW: number,
  currentH: number,
  activeEdges: ActiveEdges,
  threshold: number = ALIGN_THRESHOLD,
  altPressed: boolean = false,
  isResize: boolean = false
): SnapResult => {
  if (altPressed) {
    return {
      x: currentX, y: currentY, w: currentW, h: currentH,
      snapped: false, snappedGuides: []
    };
  }

  // 返回吸附后的坐标，但不重新计算宽度/高度
  // 对于 resize：只返回吸附后的 x/y，w/h 保持不变
  // 对于 move：返回吸附后的 x/y，w/h 保持不变

  let resultX = currentX;
  let resultY = currentY;
  let snapped = false;
  const snappedGuides: AlignmentGuide[] = [];

  const myLeft = currentX;
  const myRight = currentX + currentW;
  const myTop = currentY;
  const myBottom = currentY + currentH;
  const myCenterX = currentX + currentW / 2;
  const myCenterY = currentY + currentH / 2;

  const sortedGuides = [...guides].sort((a, b) => a.priority - b.priority);

  // ===== X 轴吸附 =====
  let bestXDistance = threshold;
  let bestXGuide: AlignmentGuide | null = null;
  let bestXSnappedX = currentX;

  for (const guide of sortedGuides) {
    let distance = Infinity;
    let snappedX: number | null = null;

    switch (guide.type) {
      case 'left':
      case 'canvasLeft':
      case 'userV':
        if (activeEdges.left) {
          distance = Math.abs(myLeft - guide.position);
          if (distance < bestXDistance) {
            snappedX = guide.position;  // ← 只返回吸附后的 x，不计算 w
          }
        }
        break;

      case 'right':
      case 'canvasRight':
        if (activeEdges.right) {
          distance = Math.abs(myRight - guide.position);
          if (distance < bestXDistance) {
            snappedX = guide.position - currentW;  // ← 只返回吸附后的 x
          }
        }
        break;

      case 'centerX':
      case 'canvasCenterX':
        if (activeEdges.left || activeEdges.right) {
          distance = Math.abs(myCenterX - guide.position);
          if (distance < bestXDistance) {
            const delta = guide.position - myCenterX;
            snappedX = currentX + delta;  // ← 只返回吸附后的 x
          }
        }
        break;

      case 'spacingX':
      case 'distributeX':
        if (activeEdges.right) {
          distance = Math.abs(myRight - guide.position);
          if (distance < bestXDistance) {
            snappedX = guide.position - currentW;
          }
        }
        break;
    }

    if (snappedX !== null && distance < bestXDistance) {
      bestXDistance = distance;
      bestXSnappedX = snappedX;
      bestXGuide = guide;
    }
  }

  if (bestXGuide) {
    resultX = bestXSnappedX;
    snapped = true;
    bestXGuide.isSnapped = true;
    snappedGuides.push(bestXGuide);
  }

  // ===== Y 轴吸附（同理） =====
  let bestYDistance = threshold;
  let bestYGuide: AlignmentGuide | null = null;
  let bestYSnappedY = currentY;

  for (const guide of sortedGuides) {
    let distance = Infinity;
    let snappedY: number | null = null;

    switch (guide.type) {
      case 'top':
      case 'canvasTop':
      case 'userH':
        if (activeEdges.top) {
          distance = Math.abs(myTop - guide.position);
          if (distance < bestYDistance) {
            snappedY = guide.position;
          }
        }
        break;

      case 'bottom':
      case 'canvasBottom':
        if (activeEdges.bottom) {
          distance = Math.abs(myBottom - guide.position);
          if (distance < bestYDistance) {
            snappedY = guide.position - currentH;
          }
        }
        break;

      case 'centerY':
      case 'canvasCenterY':
        if (activeEdges.top || activeEdges.bottom) {
          distance = Math.abs(myCenterY - guide.position);
          if (distance < bestYDistance) {
            const delta = guide.position - myCenterY;
            snappedY = currentY + delta;
          }
        }
        break;

      case 'spacingY':
      case 'distributeY':
        if (activeEdges.bottom) {
          distance = Math.abs(myBottom - guide.position);
          if (distance < bestYDistance) {
            snappedY = guide.position - currentH;
          }
        }
        break;
    }

    if (snappedY !== null && distance < bestYDistance) {
      bestYDistance = distance;
      bestYSnappedY = snappedY;
      bestYGuide = guide;
    }
  }

  if (bestYGuide) {
    resultY = bestYSnappedY;
    snapped = true;
    bestYGuide.isSnapped = true;
    snappedGuides.push(bestYGuide);
  }

  return {
    x: resultX,
    y: resultY,
    w: currentW,  // ← w/h 保持不变
    h: currentH,
    snapped,
    snappedGuides
  };
});
```

### 3.2 resize 分支调用修改

#### 变更：根据吸附后的句柄位置重新计算尺寸

```typescript
// handleMouseMove - resize 分支
let newX = ...;
let newY = ...;
let newW = ...;
let newH = ...;

if (!isShiftPressed && !resizeHandleState.isLine) {
  // ... 收集 guides ...
  
  const activeEdges = getActiveEdgesForResize(resizeHandleState.handle);
  const snapped = snapToGuides(
    allGuides,
    newX,
    newY,
    newW,
    newH,
    activeEdges,
    ALIGN_THRESHOLD,
    altKeyPressed,
    true
  );

  if (snapped.snapped) {
    // 检查是否应取消吸附
    const shouldCancel = shouldCancelSnap(
      resizeHandleState.handle,
      { x: snapped.x, y: snapped.y },
      { x: newX, y: newY }
    );

    if (!shouldCancel) {
      newX = snapped.x;
      newY = snapped.y;
      
      // 根据吸附后的句柄位置重新计算尺寸（固定边自动保留）
      const startW = resizeHandleState.elementW ?? 0;
      const startH = resizeHandleState.elementH ?? 0;
      const startElemX = resizeHandleState.elementX;
      const startElemY = resizeHandleState.elementY;
      
      switch (resizeHandleState.handle) {
        case 'nw':
          newW = startW - (newX - startElemX);
          newH = startH - (newY - startElemY);
          break;
        case 'n':
          newH = startH - (newY - startElemY);
          break;
        case 'ne':
          newW = startW + (newX - startElemX);
          newH = startH - (newY - startElemY);
          break;
        case 'e':
          newW = startW + (newX - startElemX);
          break;
        case 'se':
          newW = startW + (newX - startElemX);
          newH = startH + (newY - startElemY);
          break;
        case 's':
          newH = startH + (newY - startElemY);
          break;
        case 'sw':
          newW = startW - (newX - startElemX);
          newH = startH + (newY - startElemY);
          break;
        case 'w':
          newW = startW - (newX - startElemX);
          break;
      }
    }
  }
}
```

---

## 四、变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `SolarWirePreview.tsx` | 修改 | `snapToGuides` 增加 `fixedEdges` 参数 |
| `SolarWirePreview.tsx` | 修改 | `snapToGuides` 内部使用 `fixedEdges` 计算候选值 |
| `SolarWirePreview.tsx` | 新增 | `shouldCancelSnap` 函数 |
| `SolarWirePreview.tsx` | 新增 | `getHandlePosition` 函数 |
| `SolarWirePreview.tsx` | 修改 | resize 分支调用 `snapToGuides` 传入 `fixedEdges` |
| `SolarWirePreview.tsx` | 修改 | resize 分支增加吸附解除逻辑 |

---

## 五、预期效果

1. **resize 吸附时，对向边不再跳变**（固定边使用起始位置）
2. **吸附超过阈值时自动解除**（手柄不会被吸住拖不动）
3. **移动吸附不受影响**（不使用 fixedEdges）
4. **代码结构更清晰**（吸附系统模块化）

---

## 六、风险与约束

1. **性能**：新增函数计算量极小，不影响性能
2. **兼容性**：`fixedEdges` 为可选参数，不影响现有调用
3. **阈值可配置**：吸附解除阈值默认 15px，后续可接入设置面板
