# SolarWire 主题系统扩展 + 毛玻璃主题设计

## 目标

1. 将现有的 `dark/light` 双主题系统扩展为可插拔的多主题架构
2. 首批实现 4 种主题：solid-dark、solid-light、glass-dark、glass-light
3. 预留 3 种未来主题规格：cyberpunk、paper、minimal
4. 框架扩展能力：后续主题只需新增 CSS 变量组 + Theme 类型值

## 架构

### Theme 类型扩展

```typescript
// shared/types/app.ts
export type Theme = 'solid-dark' | 'solid-light' | 'glass-dark' | 'glass-light';

// 向后兼容映射
const THEME_MIGRATION: Record<string, Theme> = {
  'dark': 'solid-dark',
  'light': 'solid-light',
};
```

### CSS 变量驱动

每个主题通过 `body.theme-{id}` class 覆盖 CSS 变量。毛玻璃效果通过两个新变量控制：

```css
--glass-blur: 0px;           /* solid 主题为 0，glass 主题为 20px */
--glass-border: transparent;  /* solid 主题透明，glass 主题为半透明白 */
--glass-saturate: 100%;       /* glass 主题可增加饱和度增强效果 */
```

### 毛玻璃面板 class

```css
.glass-panel {
  backdrop-filter: blur(var(--glass-blur, 0px)) saturate(var(--glass-saturate, 100%));
  -webkit-backdrop-filter: blur(var(--glass-blur, 0px)) saturate(var(--glass-saturate, 100%));
  border: 1px solid var(--glass-border, transparent);
}
```

当 `--glass-blur` 为 `0px` 时，毛玻璃不生效，对现有主题零影响。

## 毛玻璃应用区域

### ✅ 应用毛玻璃（添加 .glass-panel class）

| 区域 | 组件/容器 |
|---|---|
| 工具栏 | `.solarwire-toolbar` |
| 左侧面板 | `.left-panel` |
| 右侧属性面板 | `.property-panel-fixed` |
| 图层面板 | `.layer-panel-fixed` |
| 组件库面板 | `.component-library-panel-fixed` |
| Toast 通知 | `.toast-item` |
| 右键菜单 | `.context-menu` |
| 模态框 | `.modal-overlay` / `.modal-content` |
| 错误卡片 | `.error-card` |
| 标签栏 | `.tab-bar` |

### ❌ 不应用毛玻璃

| 区域 | 原因 |
|---|---|
| 画布/SVG 渲染区 | 性能 + 不需要透出 |
| Monaco 编辑器 | 有自己的渲染机制 |
| 文本内容/图标 | 不需要模糊 |
| 交互层 SVG overlay | 纯功能性，不需要装饰 |

## CSS 变量定义

### glass-dark 主题

```css
body.theme-glass-dark {
  --bg-primary: rgba(18, 18, 18, 0.65);
  --bg-secondary: rgba(30, 30, 30, 0.55);
  --bg-tertiary: rgba(40, 40, 40, 0.45);
  --bg-hover: rgba(60, 60, 60, 0.5);
  --bg-selected: rgba(14, 99, 156, 0.7);

  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-muted: #999999;

  --border-color: rgba(255, 255, 255, 0.08);
  --border-light: rgba(255, 255, 255, 0.12);

  --accent-color: #FCA506;
  --accent-hover: #e89700;
  --primary-color: #007bff;
  --status-bar-bg: rgba(0, 122, 204, 0.7);

  --accent-opacity-10: color-mix(in srgb, var(--accent-color) 10%, transparent);
  --accent-opacity-15: color-mix(in srgb, var(--accent-color) 15%, transparent);
  --accent-opacity-35: color-mix(in srgb, var(--accent-color) 35%, transparent);
  --accent-opacity-50: color-mix(in srgb, var(--accent-color) 50%, transparent);
  --accent-light: color-mix(in srgb, var(--accent-color) 15%, white);

  --glass-blur: 20px;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-saturate: 120%;

  --error-bg: rgba(211, 47, 47, 0.15);
  --error-border: rgba(211, 47, 47, 0.5);
  --error-text: #ff6b6b;
  --warning-bg: rgba(255, 152, 0, 0.15);
  --warning-border: rgba(255, 152, 0, 0.5);
  --warning-text: #ff9800;
  --success-bg: rgba(76, 175, 80, 0.15);
  --success-border: rgba(76, 175, 80, 0.5);
  --success-text: #4caf50;
}
```

### glass-light 主题

```css
body.theme-glass-light {
  --bg-primary: rgba(255, 255, 255, 0.65);
  --bg-secondary: rgba(245, 245, 245, 0.55);
  --bg-tertiary: rgba(235, 235, 235, 0.45);
  --bg-hover: rgba(220, 220, 220, 0.5);
  --bg-selected: rgba(14, 99, 156, 0.7);

  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;

  --border-color: rgba(0, 0, 0, 0.08);
  --border-light: rgba(0, 0, 0, 0.12);

  --accent-color: #FCA506;
  --accent-hover: #e89700;
  --primary-color: #007bff;
  --status-bar-bg: rgba(0, 122, 204, 0.7);

  --accent-opacity-10: color-mix(in srgb, var(--accent-color) 10%, transparent);
  --accent-opacity-15: color-mix(in srgb, var(--accent-color) 15%, transparent);
  --accent-opacity-35: color-mix(in srgb, var(--accent-color) 35%, transparent);
  --accent-opacity-50: color-mix(in srgb, var(--accent-color) 50%, transparent);
  --accent-light: color-mix(in srgb, var(--accent-color) 15%, white);

  --glass-blur: 20px;
  --glass-border: rgba(0, 0, 0, 0.06);
  --glass-saturate: 110%;

  --error-bg: rgba(211, 47, 47, 0.1);
  --error-border: rgba(211, 47, 47, 0.5);
  --error-text: #d32f2f;
  --warning-bg: rgba(255, 152, 0, 0.1);
  --warning-border: rgba(255, 152, 0, 0.5);
  --warning-text: #f57c00;
  --success-bg: rgba(76, 175, 80, 0.1);
  --success-border: rgba(76, 175, 80, 0.5);
  --success-text: #4caf50;
}
```

## 设置界面

在设置面板中添加主题选择器，4 个选项：

| 图标 | 名称 | Theme ID |
|---|---|---|
| 🌑 | 深色 | solid-dark |
| ☀️ | 浅色 | solid-light |
| 🔮 | 毛玻璃深色 | glass-dark |
| 💎 | 毛玻璃浅色 | glass-light |

## 向后兼容

- localStorage 中保存的 `'dark'` / `'light'` 自动映射为 `'solid-dark'` / `'solid-light'`
- `body.theme-dark` / `body.theme-light` class 保留，映射到 `body.theme-solid-dark` / `body.theme-solid-light`
- 现有组件无需修改，`.glass-panel` class 由各面板容器添加

## 性能考虑

- `backdrop-filter: blur()` 在 GPU 上运行，现代浏览器性能良好
- 画布区域不使用毛玻璃，避免影响 SVG 渲染
- 使用 `contain: layout style` 提示浏览器优化重绘范围
- 毛玻璃主题下，面板背景使用 `will-change: backdrop-filter` 仅在首次渲染时提示

## 扩展性

新增主题只需：
1. 在 `Theme` 类型中添加新值
2. 在 `global.css` 中添加 `body.theme-{id}` 变量组
3. 在设置界面的选项列表中添加新项

无需修改任何组件代码。

---

## 未来主题规格（暂不实现）

以下 3 种主题已规划视觉方向和关键 CSS 变量，但不在首批实现范围内。实现时只需按上述扩展步骤添加即可。

### 🔮 赛博朋克 (Cyberpunk)

**视觉方向**：霓虹发光边框 + 深黑背景 + 渐变色强调，科技感十足

**关键特征**：
- 纯黑背景 `#0a0a0f`，营造深邃空间感
- 强调色使用霓虹渐变：`#00f0ff`（青）→ `#ff00ff`（品红）→ `#f0ff00`（黄绿）
- 面板边框带 `box-shadow` 发光效果（`0 0 8px var(--neon-color)`）
- 按钮和交互元素使用渐变背景
- 文字带微弱发光（`text-shadow: 0 0 4px currentColor`）
- 边框使用半透明霓虹色而非实色

**关键 CSS 变量预设**：

```css
body.theme-cyberpunk {
  --bg-primary: #0a0a0f;
  --bg-secondary: #0f0f1a;
  --bg-tertiary: #141425;
  --bg-hover: #1a1a30;
  --bg-selected: rgba(0, 240, 255, 0.15);

  --text-primary: #e0e0ff;
  --text-secondary: #8888cc;
  --text-muted: #555588;

  --border-color: rgba(0, 240, 255, 0.15);
  --border-light: rgba(255, 0, 255, 0.15);

  --accent-color: #00f0ff;
  --accent-hover: #00c8d4;
  --primary-color: #ff00ff;

  --neon-cyan: #00f0ff;
  --neon-magenta: #ff00ff;
  --neon-yellow: #f0ff00;
  --neon-glow: 0 0 8px;
  --neon-glow-strong: 0 0 16px;

  --glass-blur: 0px;
  --glass-border: transparent;
  --glass-saturate: 100%;
}
```

**额外需要的 CSS class**：

```css
.theme-cyberpunk .panel-border-glow {
  box-shadow: var(--neon-glow) var(--neon-cyan);
}
.theme-cyberpunk .neon-text {
  text-shadow: 0 0 4px currentColor;
}
```

### 📄 纸质 (Paper)

**视觉方向**：米白/暖灰背景 + 细微纹理 + 柔和阴影，像在纸上画图

**关键特征**：
- 暖色调背景：米白 `#f5f0e8`、暖灰 `#e8e2d8`
- 细微纸张纹理（CSS `background-image` 使用 SVG noise pattern）
- 柔和的 `box-shadow` 替代硬边框，模拟纸张层叠
- 强调色使用深棕/赭石色系 `#8b6914`，而非蓝色/橙色
- 圆角稍大（8-10px），营造手工感
- 输入框使用下划线样式而非边框，像在纸上书写
- 选中元素使用虚线边框，像手绘标注

**关键 CSS 变量预设**：

```css
body.theme-paper {
  --bg-primary: #f5f0e8;
  --bg-secondary: #ece6da;
  --bg-tertiary: #e2dcd0;
  --bg-hover: #d8d2c6;
  --bg-selected: rgba(139, 105, 20, 0.15);

  --text-primary: #2c2416;
  --text-secondary: #5c4f3a;
  --text-muted: #8a7d68;

  --border-color: rgba(44, 36, 22, 0.12);
  --border-light: rgba(44, 36, 22, 0.08);

  --accent-color: #8b6914;
  --accent-hover: #7a5c10;
  --primary-color: #5c4f3a;

  --paper-texture: url("data:image/svg+xml,..."); /* SVG noise pattern */
  --paper-shadow: 0 1px 3px rgba(44, 36, 22, 0.1);
  --paper-shadow-elevated: 0 4px 12px rgba(44, 36, 22, 0.15);

  --glass-blur: 0px;
  --glass-border: transparent;
  --glass-saturate: 100%;
}
```

**额外需要的 CSS class**：

```css
.theme-paper .paper-texture {
  background-image: var(--paper-texture);
}
.theme-paper .paper-shadow {
  box-shadow: var(--paper-shadow);
  border: none;
}
.theme-paper .paper-shadow-elevated {
  box-shadow: var(--paper-shadow-elevated);
  border: none;
}
```

### ⬜ 极简 (Minimal)

**视觉方向**：纯黑白 + 超细边框 + 大留白，高级感

**关键特征**：
- 纯白背景 `#ffffff`，纯黑文字 `#000000`，无灰色地带
- 边框极细（0.5px 或 1px），颜色为 `#e0e0e0`
- 大量留白，组件间距翻倍
- 强调色只用纯黑 `#000000`（加粗/下划线），不用彩色
- 按钮无边框，仅用文字 + hover 背景变化
- 图标使用线性风格（outline），不使用填充
- 去掉所有阴影、圆角缩小为 2-3px

**关键 CSS 变量预设**：

```css
body.theme-minimal {
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --bg-hover: #f0f0f0;
  --bg-selected: #000000;

  --text-primary: #000000;
  --text-secondary: #666666;
  --text-muted: #999999;

  --border-color: #e0e0e0;
  --border-light: #f0f0f0;

  --accent-color: #000000;
  --accent-hover: #333333;
  --primary-color: #000000;

  --minimal-border-width: 0.5px;
  --minimal-radius: 2px;
  --minimal-spacing: 1.5;  /* 间距倍率 */

  --glass-blur: 0px;
  --glass-border: transparent;
  --glass-saturate: 100%;
}
```

**额外需要的 CSS class**：

```css
.theme-minimal .minimal-border {
  border-width: var(--minimal-border-width);
  border-radius: var(--minimal-radius);
}
.theme-minimal .minimal-spacing {
  padding: calc(8px * var(--minimal-spacing));
  gap: calc(8px * var(--minimal-spacing));
}
```

### 主题规格总结

| 主题 | Theme ID | 首批实现 | 核心视觉 | 特殊 CSS 需求 |
|---|---|---|---|---|
| 深色 | `solid-dark` | ✅ | 不透明深色 | 无 |
| 浅色 | `solid-light` | ✅ | 不透明浅色 | 无 |
| 毛玻璃深色 | `glass-dark` | ✅ | 半透明 + 模糊 | `.glass-panel` |
| 毛玻璃浅色 | `glass-light` | ✅ | 半透明 + 模糊 | `.glass-panel` |
| 赛博朋克 | `cyberpunk` | ❌ | 霓虹发光 | `.panel-border-glow` `.neon-text` |
| 纸质 | `paper` | ❌ | 纹理 + 柔阴影 | `.paper-texture` `.paper-shadow` |
| 极简 | `minimal` | ❌ | 纯黑白 + 留白 | `.minimal-border` `.minimal-spacing` |
