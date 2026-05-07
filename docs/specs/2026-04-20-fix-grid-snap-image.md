# 问题修复方案

> 日期：2026-04-20
> 状态：待审批

---

## 问题一：网格点随缩放脱离原来的点

### 问题诊断
当前网格使用 CSS `radial-gradient` 背景 + `transform: scale()` 实现。当缩放时：
- SVG 内的网格点按世界坐标渲染（正确）
- CSS 网格 overlay 的 `backgroundSize` 固定为 `10px 10px`
- 但 `getTransform()` 会对整个 div 进行 scale 变换
- 导致 CSS 网格点的间距被放大，与 SVG 网格点不对齐

### 解决方案
将网格 overlay 的 `backgroundSize` 从固定 `10px 10px` 改为 `10px 10px`（不随 scale 变化），因为 `getTransform()` 已经包含了缩放变换。CSS background 会被 transform 缩放，所以实际的视觉间距 = `backgroundSize * scale`。

**当前实现**：`backgroundSize: 10px 10px` + `transform: getTransform()` 会导致背景间距被放大。

**正确做法**：使用 SVG 渲染网格，与主 SVG 共用同一个坐标系和 transform，确保完全对齐。

---

## 问题二：拖动吸附偶尔失效

### 问题诊断
可能的原因：
1. `snapToGuides` 只检测 `activeEdges` 中为 true 的边
2. 对于移动操作，`getActiveEdgesForMove` 根据拖动方向动态计算 activeEdges
3. 如果元素正在移动但方向计算不正确，可能导致没有边被标记为 active

### 解决方案
1. 添加吸附调试日志（临时）以诊断失效原因
2. 确保 `getActiveEdgesForMove` 在所有情况下都正确返回 active edges
3. 检查 guide 收集是否在特定情况下返回空数组

---

## 问题三：图片选择本地图片功能

### 当前实现
- `ImageAssetManager` 使用 Blob URL 管理图片（内存中）
- `useImageDrop` 处理拖拽和粘贴图片
- 没有文件选择器支持

### 需求
1. 支持通过文件选择器选择本地图片
2. 图片文件备份到项目目录下（如 `assets/images/`）
3. 刷新页面后图片仍然可用

### 解决方案
1. 在工具栏添加"插入图片"按钮
2. 使用 `<input type="file" accept="image/*">` 选择图片
3. 将图片文件保存到 IndexedDB 或项目目录
4. 在 SolarWire 语法中添加 `<filename.png> @(x,y) w=200` 元素

---

## 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `SolarWirePreview.tsx` | 修改 | 使用 SVG 渲染网格替代 CSS background |
| `SolarWirePreview.tsx` | 修改 | 修复吸附失效问题 |
| `SolarWirePreview.tsx` | 新增 | 添加图片选择器按钮 |
| `useImageDrop.ts` | 修改 | 增加图片持久化支持 |
