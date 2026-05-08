# SolarWire 属性自动化测试方案

> 生成日期：2026-05-08
> 版本：v1.0
> 状态：待实施

---

## 一、元素与属性全景矩阵

### 1.1 元素类型总览（7 种）

| # | 元素类型 | 语法模式 | 示例 | 分类 |
|---|---------|---------|------|------|
| 1 | `rectangle` | `["text"] @...` / `[] @...` | `["按钮"] @(10, 20) w=100 h=40` | 形状 |
| 2 | `circle` | `("text") @...` / `() @...` | `("OK") @(10, 20) w=50 h=50` | 形状 |
| 3 | `text` | `"text" @...` | `"Hello World" @(10, 20)` | 文本 |
| 4 | `placeholder` | `[?"text"] @...` / `[?] @...` | `[?"图片"] @(10, 20) w=200 h=150` | 占位符 |
| 5 | `line` | `--` / `--"label"--` | `-- @(0, 0)->(+100, +50)` | 线条 |
| 6 | `image` | `<url> @...` | `<./assets/logo.png> @(10, 20) w=200 h=100` | 媒体 |
| 7 | `table` | `## @...` + `  #` + `    "text"` | `## @(0,0) w=600`<br/>`  #    "A"    "B"` | 表格 |

---

### 1.2 属性清单（39 个）

#### 通用属性（所有元素）

| # | 属性名 | 代码名 | 类型 | 适用元素 | 说明 |
|---|-------|-------|------|---------|------|
| 1 | 坐标 X | `x` | coord (number) | 除 line 外所有元素 | 元素左上角 X |
| 2 | 坐标 Y | `y` | coord (number) | 除 line 外所有元素 | 元素左上角 Y |
| 3 | 透明度 | `opacity` | number (0-1) | 所有元素 | 元素透明度 |
| 4 | 备注 | `note` | string (multiline) | 所有元素 | 元素备注 |

#### 尺寸属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 说明 |
|---|-------|-------|------|---------|------|
| 5 | 宽度 | `w` | number | rectangle, circle, text, placeholder, image, table | 元素宽度 |
| 6 | 高度 | `h` | number | rectangle, circle, text, placeholder, image, table | 元素高度 |
| 7 | 圆角 | `r` | number | rectangle（`r>0` 时渲染圆角矩形） | 圆角半径，通过矩形元素的 `r` 属性控制 |

#### 颜色属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 8 | 填充色 | `bg` | color | 所有元素 | `transparent` |
| 9 | 边框色 | `b` | color | 所有元素 | `#333333` |
| 10 | 边框宽 | `s` | number | 所有元素 | 1 |
| 11 | 文字色 | `c` | color | 所有带文本的元素 | `#333333` |

#### 文本样式属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 12 | 字号 | `size` | number | 所有带文本的元素 | 12 |
| 13 | 粗体 | `bold` | boolean | 所有带文本的元素 | false |
| 14 | 斜体 | `italic` | boolean | 所有带文本的元素 | false |
| 15 | 水平对齐 | `align` | string (`l\|c\|r`) | 所有带文本的元素 | 见各元素差异 |
| 16 | 垂直对齐 | `vertical-align` | string (`t\|m\|b`) | 所有带文本的元素 | 见各元素差异 |
| 17 | 文本装饰 | `text-decoration` | string (`underline\|line-through`) | 所有带文本的元素 | none |
| 18 | 行高 | `line-height` | number | 所有带文本的元素 | 22 |
| 19 | 字间距 | `letter-spacing` | number | 所有带文本的元素 | 0 |

#### 内边距属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 20 | 内边距-上 | `padding-top` | number | 所有带文本的元素 | 0 |
| 21 | 内边距-右 | `padding-right` | number | 所有带文本的元素 | 0 |
| 22 | 内边距-下 | `padding-bottom` | number | 所有带文本的元素 | 0 |
| 23 | 内边距-左 | `padding-left` | number | 所有带文本的元素 | 0 |

#### 阴影属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 24 | 阴影 X | `shadow-x` | number | 所有元素 | 0 |
| 25 | 阴影 Y | `shadow-y` | number | 所有元素 | 0 |
| 26 | 阴影模糊 | `shadow-blur` | number | 所有元素 | 0 |
| 27 | 阴影颜色 | `shadow-color` | color | 所有元素 | transparent |

#### Line 专属属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 28 | 终点 X | `x2` | number (coord) | `line` | 0 |
| 29 | 终点 Y | `y2` | number (coord) | `line` | 0 |
| 30 | 线条样式 | `style` | string (`solid\|dashed\|dotted`) | `line` | solid |
| 31 | 线条标签 | `label` | string | `line` | - |
| 32 | 标签色 | `text-color` | color | `line` | `#333333` |
| 33 | 终点坐标 | `@(...)->(...)` | coord pair | `line` | - |

#### Image 专属属性

| # | 属性名 | 代码名 | 类型 | 适用元素 | 默认值 |
|---|-------|-------|------|---------|--------|
| 33 | 图片 URL | `url` | string | `image` | - |

#### Table 专属属性

| # | 属性名 | 代码名 | 类型 | 适用层级 | 默认值 |
|---|-------|-------|------|---------|--------|
| 34 | 表格线宽 | `border` | number | table | 1 |
| 35 | 单元格间距 | `cellspacing` | number | table | 0 |

#### Table Cell 专属属性

| # | 属性名 | 代码名 | 类型 | 适用层级 | 默认值 |
|---|-------|-------|------|---------|--------|
| 36 | 跨列 | `colspan` | number | cell | 1 |
| 37 | 跨行 | `rowspan` | number | cell | 1 |

---

### 1.3 各元素支持的属性汇总

#### rectangle（24 个属性）

坐标 X/Y、w/h、r（r>0 时为圆角矩形）、bg、b、s、c、size、bold、italic、align、vertical-align、text-decoration、padding-top/right/bottom/left、line-height、letter-spacing、opacity、shadow-x/y/blur/color、text、note

**特殊默认值：**
- `bg` = `#ffffff`（白色）
- `align` = `l`（左对齐）
- `vertical-align` = `t`（顶部对齐）
- `r` = `0`（直角矩形，设置 `r>0` 时自动变为圆角矩形）

**语法说明：**
- 直角矩形：`[] @(x,y) w=100 h=40` 或 `["文本"] @(x,y) w=100 h=40`
- 圆角矩形：`[] @(x,y) w=100 h=40 r=8`（通过 `r` 属性控制圆角）

#### circle（23 个属性）

坐标 X/Y、w/h、bg、b、s、c、size、bold、italic、align、vertical-align、text-decoration、padding-top/right/bottom/left、line-height、letter-spacing、opacity、shadow-x/y/blur/color、text、note

**特殊默认值：**
- `bg` = `transparent`（透明）
- `align` = `c`（居中）
- `vertical-align` = `m`（居中）
- **无 `r` 属性**（圆形渲染自动根据 w/h 计算半径）

**语法说明：**
- 圆形元素：`("文本") @(x,y) w=50 h=50` 或 `() @(x,y) w=50 h=50`

#### text（15 个属性）

坐标 X/Y、w、c、size、bold、italic、align、line-height、letter-spacing、text-decoration、opacity、shadow-x/y/blur/color、text、note

**不支持的属性：** bg、b、s、h、vertical-align、padding-*

#### placeholder（24 个属性）

同 rectangle。

**特殊默认值：**
- `bg` = `#f0f0f0`（灰色）
- `b` = `#999999`（灰色边框）
- `c` = `#999999`（灰色文字）
- `align` = `c`（居中）
- `vertical-align` = `m`（居中）

#### line（10 个属性）

起点坐标（`@(...)`）、终点坐标（`->(...)` 或 `->(+dx, +dy)`）、label、c、s、style、text-color、note

**语法说明：**
- 无线段标签：`-- @(0, 0)->(100, 50)`
- 带线段标签：`--"连接"-- @(0, 0)->(+100, +50)`
- 支持相对坐标：`-- @(0, 0)->(+100, +50)`
- 支持绝对坐标：`-- @(0, 0)->(100, 50)`

**不支持的属性：** x/y/w/h/bg/bold/italic/align/opacity/shadow 等

#### image（13 个属性）

坐标 X/Y、w、h、bg、b、s、c、size、opacity、shadow-x/y/blur/color、url、note

**特殊默认值：**
- `bg` = `#f0f0f0`
- `b` = `#cccccc`
- `c` = `#999999`
- `h` = 80（不同于其他元素的默认值）
- `s` = 0（无边框）

#### table（27+ 个属性）

**表格层（8 个）：** 坐标 X/Y、w、h、border、cellspacing、b、bg、note

**单元格层（19 个）：** bg、b、s、c、size、bold、italic、align、vertical-align、text-decoration、padding-top/right/bottom/left、line-height、letter-spacing、colspan、rowspan

---

## 二、测试分层架构

### Layer 1: 单元测试 — 属性更新函数

**文件：** `editor/src/__tests__/attribute-updater.test.ts`

**测试目标：** 验证 `updateLineAttribute` 和 `deleteLineAttribute` 对所有元素类型、所有属性的正确性。

#### 1.1 坐标属性更新（x/y）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.1.1 | rectangle: 有坐标替换 x | `[] @(100, 200) w=50` | `updateLineAttribute(src, 1, 'x', 150)` | `[] @(150, 200) w=50` |
| 1.1.2 | rectangle: 有坐标替换 y | `[] @(100, 200) w=50` | `updateLineAttribute(src, 1, 'y', 300)` | `[] @(100, 300) w=50` |
| 1.1.3 | rectangle: 无坐标新增 x | `[] w=50 h=30` | `updateLineAttribute(src, 1, 'x', 100)` | `[] w=50 h=30 @(100, 0)` |
| 1.1.4 | rectangle: 有坐标替换 x | `() @(50, 80) w=60` | `updateLineAttribute(src, 1, 'x', 120)` | `() @(120, 80) w=60` |
| 1.1.5 | rectangle: 无坐标新增 y | `("text") w=60` | `updateLineAttribute(src, 1, 'y', 40)` | `("text") w=60 @(0, 40)` |
| 1.1.6 | circle: 有坐标替换 x | `("OK") @(10, 20) w=50 h=50` | `updateLineAttribute(src, 1, 'x', 30)` | `("OK") @(30, 20) w=50 h=50` |
| 1.1.7 | circle: 无坐标新增 x | `("text")` | `updateLineAttribute(src, 1, 'x', 100)` | `("text") @(100, 0)` |
| 1.1.8 | placeholder: 有坐标替换 y | `[?] @(100, 200)` | `updateLineAttribute(src, 1, 'y', 50)` | `[?] @(100, 50)` |
| 1.1.9 | placeholder: 无坐标新增 x | `[?"text"] w=100` | `updateLineAttribute(src, 1, 'x', 200)` | `[?"text"] w=100 @(200, 0)` |
| 1.1.10 | text: 有坐标替换 x | `"Hello" @(100, 200)` | `updateLineAttribute(src, 1, 'x', 150)` | `"Hello" @(150, 200)` |
| 1.1.11 | text: 无坐标新增 y | `"World"` | `updateLineAttribute(src, 1, 'y', 30)` | `"World" @(0, 30)` |
| 1.1.12 | table: 有坐标替换 x | `## @(240, 203) w=600` | `updateLineAttribute(src, 1, 'x', 300)` | `## @(300, 203) w=600` |
| 1.1.13 | table: 无坐标新增 x | `## w=600` | `updateLineAttribute(src, 1, 'x', 100)` | `## @(100, 0) w=600` |
| 1.1.14 | multiline: 无坐标新增 x | `"""Hello World""" @(0, 0)` | `updateLineAttribute(src, 1, 'x', 50)` | `"""Hello World""" @ (50, 0)` |

#### 1.2 终点坐标更新（x2/y2）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.2.1 | line: 有终点替换 x2 | `-- @(0, 0)->(100, 50)` | `updateLineAttribute(src, 1, 'x2', 200)` | `-- @(0, 0)->(200, 50)` |
| 1.2.2 | line: 有终点替换 y2 | `-- @(0, 0)->(100, 50)` | `updateLineAttribute(src, 1, 'y2', 80)` | `-- @(0, 0)->(100, 80)` |
| 1.2.3 | line: 无终点新增 x2 | `-- @(0, 0)` | `updateLineAttribute(src, 1, 'x2', 100)` | `-- @(0, 0) ->(100, 0)` |
| 1.2.4 | line: 负值坐标 | `-- @(0, 0)->(-50, -30)` | `updateLineAttribute(src, 1, 'x2', 50)` | `-- @(0, 0)->(50, -30)` |
| 1.2.5 | line: 相对坐标 | `-- @(0, 0)->(+100, +50)` | `updateLineAttribute(src, 1, 'x2', 200)` | `-- @(0, 0)->(200, 50)`（相对坐标替换为绝对坐标） |

#### 1.3 文本属性更新（text）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.3.1 | rectangle: 修改文本 | `["old"] w=50` | `updateLineAttribute(src, 1, 'text', 'new')` | `["new"] w=50` |
| 1.3.2 | rectangle: 空矩形添加文本 | `[] w=50` | `updateLineAttribute(src, 1, 'text', 'Hello')` | `["Hello"] w=50` |
| 1.3.3 | circle: 修改文本 | `("old") w=50` | `updateLineAttribute(src, 1, 'text', 'new')` | `("new") w=50` |
| 1.3.4 | circle: 空圆添加文本 | `() w=50` | `updateLineAttribute(src, 1, 'text', 'Hello')` | `("Hello") w=50` |
| 1.3.5 | placeholder: 修改文本 | `[?"old"] w=50` | `updateLineAttribute(src, 1, 'text', 'new')` | `[?"new"] w=50` |
| 1.3.6 | placeholder: 空占位添加文本 | `[?] w=50` | `updateLineAttribute(src, 1, 'text', 'Image')` | `[?"Image"] w=50` |
| 1.3.7 | text: 修改文本 | `"old"` | `updateLineAttribute(src, 1, 'text', 'new')` | `"new"` |
| 1.3.8 | text: 修改多行文本 | `"""line1\nline2"""` | `updateLineAttribute(src, 1, 'text', 'single')` | `"""single"""` |
| 1.3.9 | text: 带属性修改文本 | `"old" @(10, 20) w=100` | `updateLineAttribute(src, 1, 'text', 'new')` | `"new" @(10, 20) w=100` |

#### 1.4 备注属性更新（note）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.4.1 | 添加 note（三引号） | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'note', '这是一个备注')` | `[] @(10, 20) note="""这是一个备注"""` |
| 1.4.2 | 添加 note（已有其他属性） | `[] @(10, 20) w=100 bg=#fff` | `updateLineAttribute(src, 1, 'note', '备注')` | `[] @(10, 20) w=100 bg=#fff note="""备注"""` |
| 1.4.3 | 替换 note | `[] note="""旧"""` | `updateLineAttribute(src, 1, 'note', '新')` | `[] note="""新"""` |
| 1.4.4 | 跨行 note 替换 | `[] note="""第一行\n第二行"""` | `updateLineAttribute(src, 1, 'note', '单行')` | `[] note="""单行"""` |

#### 1.5 布尔属性更新（bold/italic）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.5.1 | 添加 bold | `"text" w=50` | `updateLineAttribute(src, 1, 'bold', true)` | `"text" w=50 bold` |
| 1.5.2 | 移除 bold | `"text" w=50 bold` | `updateLineAttribute(src, 1, 'bold', false)` | `"text" w=50` |
| 1.5.3 | 添加 italic | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'italic', true)` | `[] @(10, 20) italic` |
| 1.5.4 | 移除 italic | `["text"] @(10, 20) italic` | `updateLineAttribute(src, 1, 'italic', false)` | `["text"] @(10, 20)` |
| 1.5.5 | 在 note 前添加 bold | `"text" note="""备注"""` | `updateLineAttribute(src, 1, 'bold', true)` | `"text" bold note="""备注"""` |

#### 1.6 颜色属性更新

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.6.1 | 新增 bg | `[] @(10, 20) w=50` | `updateLineAttribute(src, 1, 'bg', '#FF0000')` | `[] @(10, 20) w=50 bg=#FF0000` |
| 1.6.2 | 替换 bg | `[] bg=#FFFFFF @(10, 20)` | `updateLineAttribute(src, 1, 'bg', '#000000')` | `[] bg=#000000 @(10, 20)` |
| 1.6.3 | 新增 b | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'b', '#FF0000')` | `"text" b=#FF0000 @(10, 20)` |
| 1.6.4 | 替换 c | `["Hello"] c=#000000` | `updateLineAttribute(src, 1, 'c', '#FF0000')` | `["Hello"] c=#FF0000` |
| 1.6.5 | 新增 shadow-color | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'shadow-color', '#333')` | `[] @(10, 20) shadow-color=#333` |
| 1.6.6 | 替换已有属性后 | `[] @(10, 20) w=50` | `updateLineAttribute(src, 1, 'bg', '#AAA')` | `[] @(10, 20) w=50 bg=#AAA` |

#### 1.7 数字属性更新（w/h/r/s/size/shadow-x/y/blur）

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.7.1 | 新增 w | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'w', 200)` | `[] @(10, 20) w=200` |
| 1.7.2 | 替换 w | `[] w=100 @(10, 20)` | `updateLineAttribute(src, 1, 'w', 300)` | `[] w=300 @(10, 20)` |
| 1.7.3 | 新增 h | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'h', 80)` | `[] @(10, 20) h=80` |
| 1.7.4 | 新增 r | `[] @(10, 20) w=100` | `updateLineAttribute(src, 1, 'r', 8)` | `[] @(10, 20) w=100 r=8` |
| 1.7.5 | 新增 s | `[] @(10, 20)` | `updateLineAttribute(src, 1, 's', 3)` | `[] @(10, 20) s=3` |
| 1.7.6 | 新增 size | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'size', 20)` | `"text" @(10, 20) size=20` |
| 1.7.7 | 新增 shadow-x | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'shadow-x', 5)` | `[] @(10, 20) shadow-x=5` |
| 1.7.8 | 新增 shadow-y | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'shadow-y', 3)` | `[] @(10, 20) shadow-y=3` |
| 1.7.9 | 新增 shadow-blur | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'shadow-blur', 8)` | `[] @(10, 20) shadow-blur=8` |

#### 1.8 文本样式属性更新

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.8.1 | 新增 align | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'align', 'c')` | `"text" @(10, 20) align=c` |
| 1.8.2 | 替换 align | `"text" align=l @(10, 20)` | `updateLineAttribute(src, 1, 'align', 'r')` | `"text" align=r @(10, 20)` |
| 1.8.3 | 新增 vertical-align | `["Hello"] @(10, 20)` | `updateLineAttribute(src, 1, 'vertical-align', 'm')` | `["Hello"] @(10, 20) vertical-align=m` |
| 1.8.4 | 新增 text-decoration | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'text-decoration', 'underline')` | `"text" @(10, 20) text-decoration=underline` |
| 1.8.5 | 替换 text-decoration | `"text" text-decoration=underline` | `updateLineAttribute(src, 1, 'text-decoration', 'line-through')` | `"text" text-decoration=line-through` |
| 1.8.6 | 新增 padding-top | `["text"] @(10, 20)` | `updateLineAttribute(src, 1, 'padding-top', 10)` | `["text"] @(10, 20) padding-top=10` |
| 1.8.7 | 新增 padding-right | `["text"] @(10, 20)` | `updateLineAttribute(src, 1, 'padding-right', 8)` | `["text"] @(10, 20) padding-right=8` |
| 1.8.8 | 新增 padding-bottom | `["text"] @(10, 20)` | `updateLineAttribute(src, 1, 'padding-bottom', 10)` | `["text"] @(10, 20) padding-bottom=10` |
| 1.8.9 | 新增 padding-left | `["text"] @(10, 20)` | `updateLineAttribute(src, 1, 'padding-left', 8)` | `["text"] @(10, 20) padding-left=8` |
| 1.8.10 | 新增 line-height | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'line-height', 28)` | `"text" @(10, 20) line-height=28` |
| 1.8.11 | 新增 letter-spacing | `"text" @(10, 20)` | `updateLineAttribute(src, 1, 'letter-spacing', 2)` | `"text" @(10, 20) letter-spacing=2` |
| 1.8.12 | 新增 opacity | `[] @(10, 20)` | `updateLineAttribute(src, 1, 'opacity', 0.5)` | `[] @(10, 20) opacity=0.5` |

#### 1.9 Line 专属属性更新

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.9.1 | 新增 style | `-- @(0, 0)->(100, 50)` | `updateLineAttribute(src, 1, 'style', 'dashed')` | `-- @(0, 0)->(100, 50) style=dashed` |
| 1.9.2 | 替换 style | `-- @(0, 0)->(100, 50) style=dashed` | `updateLineAttribute(src, 1, 'style', 'dotted')` | `-- @(0, 0)->(100, 50) style=dotted` |
| 1.9.3 | 新增 label | `-- @(0, 0)->(100, 50)` | `updateLineAttribute(src, 1, 'label', 'connection')` | `--"connection"-- @(0, 0)->(100, 50)` |
| 1.9.4 | 新增 text-color | `-- @(0, 0)->(100, 50)` | `updateLineAttribute(src, 1, 'text-color', '#FF0000')` | `-- @(0, 0)->(100, 50) text-color=#FF0000` |

#### 1.10 Image 专属属性更新

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.10.1 | 新增 url | `<> @(10, 20)` | `updateLineAttribute(src, 1, 'url', './img.png')` | `<./img.png> @(10, 20)` |
| 1.10.2 | 替换 url | `<./old.png> @(10, 20)` | `updateLineAttribute(src, 1, 'url', './new.png')` | `<./new.png> @(10, 20)` |

#### 1.11 删除属性

| # | 测试用例 | 输入源码 | 操作 | 预期输出 |
|---|---------|---------|------|---------|
| 1.11.1 | 删除 bg | `[] bg=#FFF @(10, 20)` | `deleteLineAttribute(src, 1, 'bg')` | `[] @(10, 20)` |
| 1.11.2 | 删除 bold | `"text" bold @(10, 20)` | `deleteLineAttribute(src, 1, 'bold')` | `"text" @(10, 20)` |
| 1.11.3 | 删除 italic | `[] @(10, 20) italic` | `deleteLineAttribute(src, 1, 'italic')` | `[] @(10, 20)` |
| 1.11.4 | 删除 w | `[] w=100 @(10, 20)` | `deleteLineAttribute(src, 1, 'w')` | `[] @(10, 20)` |
| 1.11.5 | 删除 s | `[] s=2 @(10, 20)` | `deleteLineAttribute(src, 1, 's')` | `[] @(10, 20)` |
| 1.11.6 | 删除 style | `-- @(0, 0)->(100, 50) style=dashed` | `deleteLineAttribute(src, 1, 'style')` | `-- @(0, 0)->(100, 50)` |
| 1.11.7 | 删除 label | `--"test"-- @(0, 0)->(100, 50)` | `deleteLineAttribute(src, 1, 'label')` | `-- @(0, 0)->(100, 50)` |
| 1.11.8 | 删除 note | `[] @(10, 20) note="""备注"""` | `deleteLineAttribute(src, 1, 'note')` | `[] @(10, 20)` |
| 1.11.9 | 删除 r（圆角变直角） | `[] @(10, 20) r=8` | `deleteLineAttribute(src, 1, 'r')` | `[] @(10, 20)` |

**Layer 1 总计：约 90 个测试用例**

---

### Layer 2: 单元测试 — 表格工具函数

**文件：** `editor/src/__tests__/table-source-utils.test.ts`

#### 2.1 parseTableFromSource

| # | 测试用例 | 输入源码 | 预期结果 |
|---|---------|---------|---------|
| 2.1.1 | 基本 3x3 表格解析 | `## @(0,0) w=600 h=120` + 3 行 | rows.length=3, rows[0].cells.length=3 |
| 2.1.2 | 坐标提取 | `## @(240, 203) w=600` | attrs.x=240, attrs.y=203 |
| 2.1.3 | colspan 解析 | `  #    "A" colspan=2    "B"` | rows[0].cells[0].colspan=2 |
| 2.1.4 | rowspan 解析 | `  #    "A" rowspan=2` | rows[0].cells[0].rowspan=2 |
| 2.1.5 | 空表格解析 | `## @(0,0) w=600` | rows=[] |
| 2.1.6 | 带属性行解析 | `  #    "A" bg=#FFF c=#000` | cells[0].attrs.bg='#FFF', cells[0].attrs.c='#000' |
| 2.1.7 | 单元格文本解析 | `  #    "Hello"` | cells[0].text='Hello' |
| 2.1.8 | 表格默认属性 | `## @(0,0) w=600` | attrs.border=1, attrs.cellspacing=0, attrs.b='#333333' |

#### 2.2 serializeTableToSource

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 2.2.1 | 基本序列化 | 3x3 TableData | 正确的 ## + 3 行源码 |
| 2.2.2 | 坐标保留 | attrs.x=100, attrs.y=200 | `## @(100, 200) w=...` |
| 2.2.3 | 坐标保留（原始行无坐标时） | 原始行 `## w=600`，新 attrs.x/y=undefined | `## w=600` |
| 2.2.4 | 属性顺序正确 | attrs 含 bg, w, border | `## @(x,y) w=... border=... bg=...` |
| 2.2.5 | 新增行 | 原 2 行，新增第 3 行 | 输出 3 行源码 |
| 2.2.6 | 单元格属性序列化 | cell.attrs.bg='#AAA', c='#FFF' | `"text" bg=#AAA c=#FFF` |
| 2.2.7 | 新属性支持序列化 | cell.attrs.align='c' | `"text" align=c` |
| 2.2.8 | padding 属性序列化 | cell.attrs.pt=10, pr=5 | `"text" pt=10 pr=5` |

#### 2.3 createDefaultTableSource

| # | 测试用例 | 预期结果 |
|---|---------|---------|
| 2.3.1 | 默认 3x3 结构 | 输出 `## @(0, 0) w=600 h=120` + 3 行，每行 3 个空单元格 |
| 2.3.2 | 语法正确性 | 解析后 rows.length=3, 每行 cells.length=3 |

#### 2.4 坐标保留完整流程

| # | 测试用例 | 流程 | 预期 |
|---|---------|------|------|
| 2.4.1 | 解析→修改→序列化→坐标保留 | `## @(100, 200) w=600` → 修改 w=700 → 序列化 | `## @(100, 200) w=700` |
| 2.4.2 | 无坐标→添加坐标→序列化 | `## w=600` → 设置 x=50, y=30 → 序列化 | `## @(50, 30) w=600` |
| 2.4.3 | 有坐标→清空坐标→序列化 | `## @(100, 200) w=600` → x/y=undefined → 序列化 | 保留原始坐标或移除（取决于实现策略） |
| 2.4.4 | 多轮修改坐标不丢失 | 5 轮修改属性后，坐标仍在 | `## @(100, 200) ...` |

**Layer 2 总计：22 个测试用例**

---

### Layer 3: 单元测试 — Renderer Context 辅助函数

**文件：** `editor/src/__tests__/renderer-context.test.ts`

#### 3.1 getNumberAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.1.1 | 本地值存在 | `attrs={w: '100'}`, key='w', default=50 | 100 |
| 3.1.2 | 本地值不存在，使用全局默认 | `attrs={}`, globalDefaults={w: 80}, default=50 | 80 |
| 3.1.3 | 本地和全局都没有 | `attrs={}`, globalDefaults={}, default=50 | 50 |
| 3.1.4 | 本地值非数字 | `attrs={w: 'abc'}`, default=50 | 50 |
| 3.1.5 | 本地值空字符串 | `attrs={w: ''}`, default=50 | 50 |
| 3.1.6 | 全局默认值非数字类型 | `attrs={}`, globalDefaults={w: 'abc'}, default=50 | 50 |

#### 3.2 getColorAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.2.1 | 本地值存在 | `attrs={bg: '#FFF'}`, key='bg', default='transparent' | `#FFF` |
| 3.2.2 | 本地不存在，用全局 | `attrs={}`, globalDefaults={bg: '#EEE'}, default='transparent' | `#EEE` |
| 3.2.3 | 都没有 | `attrs={}`, globalDefaults={}, default='#000' | `#000` |
| 3.2.4 | undefined vs 空字符串 | `attrs={bg: undefined}`, default='#000' | `#000` |

#### 3.3 getBooleanAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.3.1 | key 存在于 attrs | `attrs={bold: ''}` | true |
| 3.3.2 | key 不存在，全局为 true | `attrs={}`, globalDefaults={bold: true} | true |
| 3.3.3 | key 不存在，全局为 false | `attrs={}`, globalDefaults={bold: false} | false |
| 3.3.4 | key 都不存在 | `attrs={}`, globalDefaults={} | false |

#### 3.4 getAlignAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.4.1 | align=l | `attrs={align: 'l'}` | `start` |
| 3.4.2 | align=c | `attrs={align: 'c'}` | `middle` |
| 3.4.3 | align=r | `attrs={align: 'r'}` | `end` |
| 3.4.4 | align 无效值 | `attrs={align: 'x'}` | default（`start`） |
| 3.4.5 | align 不存在 | `attrs={}` | default（`start`） |
| 3.4.6 | 自定义默认值 | `attrs={align: 'x'}`, default='end' | `end` |

#### 3.5 getVerticalAlignAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.5.1 | vertical-align=t | `attrs={'vertical-align': 't'}` | `top` |
| 3.5.2 | vertical-align=m | `attrs={'vertical-align': 'm'}` | `middle` |
| 3.5.3 | vertical-align=b | `attrs={'vertical-align': 'b'}` | `bottom` |
| 3.5.4 | 无效值 | `attrs={'vertical-align': 'x'}` | `top` |
| 3.5.5 | 不存在 | `attrs={}` | `top` |
| 3.5.6 | 自定义默认值 | `attrs={}`, default='middle' | `middle` |

#### 3.6 getTextDecorationAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.6.1 | text-decoration=underline | `attrs={'text-decoration': 'underline'}` | `underline` |
| 3.6.2 | text-decoration=line-through | `attrs={'text-decoration': 'line-through'}` | `line-through` |
| 3.6.3 | text-decoration=none | `attrs={'text-decoration': 'none'}` | `none` |
| 3.6.4 | 无效值 | `attrs={'text-decoration': 'bold'}` | `none` |
| 3.6.5 | 不存在 | `attrs={}` | `none` |

#### 3.7 getPaddingValues

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.7.1 | 四个方向完整 | `attrs={'padding-top': '10', 'padding-right': '8', 'padding-bottom': '10', 'padding-left': '8'}` | `{top:10, right:8, bottom:10, left:8}` |
| 3.7.2 | 部分方向 | `attrs={'padding-top': '10'}` | `{top:10, right:0, bottom:0, left:0}` |
| 3.7.3 | 全空 | `attrs={}` | `{top:0, right:0, bottom:0, left:0}` |
| 3.7.4 | 自定义默认值 | `attrs={}`, default=4 | `{top:4, right:4, bottom:4, left:4}` |

#### 3.8 getOpacityAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.8.1 | 正常值 | `attrs={opacity: '0.5'}` | 0.5 |
| 3.8.2 | 超过 1 | `attrs={opacity: '1.5'}` | 1 |
| 3.8.3 | 小于 0 | `attrs={opacity: '-0.3'}` | 0 |
| 3.8.4 | NaN | `attrs={opacity: 'abc'}` | 1（默认值） |
| 3.8.5 | 不存在 | `attrs={}` | 1 |

#### 3.9 getShadowAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.9.1 | 完整阴影 | `attrs={'shadow-x': '2', 'shadow-y': '3', 'shadow-blur': '4', 'shadow-color': '#333'}` | `{x:2, y:3, blur:4, color:'#333'}` |
| 3.9.2 | 部分值 | `attrs={'shadow-x': '2'}` | `{x:2, y:0, blur:0, color:'transparent'}` |
| 3.9.3 | 全默认值 | `attrs={}` | `null` |
| 3.9.4 | 只有颜色 | `attrs={'shadow-color': '#333'}` | `null`（x/y/blur 都是 0） |

#### 3.10 getStyleAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.10.1 | style=solid | `attrs={style: 'solid'}` | `{}` |
| 3.10.2 | style=dashed | `attrs={style: 'dashed'}` | `{strokeDasharray: '5,5'}` |
| 3.10.3 | style=dotted | `attrs={style: 'dotted'}` | `{strokeDasharray: '2,2'}` |
| 3.10.4 | 无效值 | `attrs={style: 'double'}` | `{}` |
| 3.10.5 | 不存在 | `attrs={}` | `{}` |

#### 3.11 getLetterSpacingAttribute

| # | 测试用例 | 输入 | 预期输出 |
|---|---------|------|---------|
| 3.11.1 | 正常值 | `attrs={'letter-spacing': '2'}` | 2 |
| 3.11.2 | 使用全局默认 | `attrs={}`, globalDefaults={'letter-spacing': 1} | 1 |
| 3.11.3 | 不存在 | `attrs={}` | 0 |

**Layer 3 总计：52 个测试用例**

---

### Layer 4: 组件测试 — PropertyPanel 渲染

**文件：** `editor/src/__tests__/PropertyPanel.test.tsx`

| # | 测试用例 | 前置条件 | 预期显示的属性组 |
|---|---------|---------|-----------------|
| 4.1 | rectangle 选中 | 选中 `[] @(10, 20) w=100 h=40` | Position, Size(W/H/R), Appearance(Fill/Border/Width/Opacity), Shadow, Note |
| 4.2 | rectangle（圆角）选中 | 选中 `[] @(10, 20) w=100 r=8` | Position, Size(W/H/R), Appearance, Shadow, Note |
| 4.3 | circle 选中 | 选中 `("OK") @(10, 20) w=50 h=50` | Position, Size(W/H), Appearance, Shadow, Note |
| 4.4 | text 选中 | 选中 `"Hello" @(10, 20)` | Position, Appearance(Color/Size), Text(Content/Color/Size/Align/V-Align/B/I/U/S/LH/LS), Shadow, Note |
| 4.5 | placeholder 选中 | 选中 `[?"Image"] @(10, 20)` | Position, Size(W/H), Appearance, Shadow, Note |
| 4.6 | line 选中 | 选中 `-- @(0, 0)->(100, 50)` | Position(X/Y/X2/Y2), Line End(Style/Label/Label Color), Appearance(Color/Width) |
| 4.7 | line（带标签）选中 | 选中 `--"连接"-- @(0, 0)->(+100, +50)` | Position, Line Label, Appearance, Note |
| 4.8 | image 选中 | 选中 `<./img.png> @(10, 20)` | Position, Size(W/H), Appearance(Fill/Border/Width/Opacity), Image(URL), Shadow, Note |
| 4.9 | table 选中 | 选中 `## @(0, 0) w=600` | Position, Size(W/H), Table(结构信息+编辑按钮), Note |
| 4.10 | 多选 | 选中 2 个元素 | "2 Elements Selected" + "Select a single element..." |
| 4.11 | 空选中 | 无选中元素 | "No element selected" |
| 4.12 | 解析错误 | 输入非法 SolarWire 源码 | Error section + 错误信息 + "Go to Error Line" 按钮 |

**Layer 4 总计：12 个测试用例**

---

### Layer 5: 组件测试 — TableEditorModal 功能

**文件：** `editor/src/__tests__/TableEditorModal.test.tsx`

#### 5.1 表格属性工具栏

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.1.1 | Fill 颜色修改 | 在顶部工具栏修改 Fill 颜色 | 所有单元格背景色更新 |
| 5.1.2 | Border 颜色修改 | 在顶部工具栏修改 Border 颜色 | 所有单元格边框色更新 |
| 5.1.3 | W 修改 | 修改表格宽度 | 表格宽度属性更新 |
| 5.1.4 | H 修改 | 修改表格高度 | 表格高度属性更新 |
| 5.1.5 | Border Width 修改 | 修改边框宽度 | 表格 border 属性更新 |
| 5.1.6 | Cell Spacing 修改 | 修改单元格间距 | 表格 cellspacing 属性更新 |
| 5.1.7 | 属性修改不影响源码 | 修改任意属性 | 源码区域不改变（仅在保存时序列化） |

#### 5.2 表格结构操作

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.2.1 | 插入行（上方） | 选中某行，点击"Insert Row Above" | 在该行上方新增一行 |
| 5.2.2 | 插入行（下方） | 选中某行，点击"Insert Row Below" | 在该行下方新增一行 |
| 5.2.3 | 删除行 | 选中某行，点击"Delete Row" | 该行被删除，行数-1 |
| 5.2.4 | 删除最后一行 | 删除表格最后一行 | 删除成功，至少保留 1 行 |
| 5.2.5 | 插入列（左侧） | 选中某列，点击"Insert Column Left" | 在该列左侧新增一列 |
| 5.2.6 | 插入列（右侧） | 选中某列，点击"Insert Column Right" | 在该列右侧新增一列 |
| 5.2.7 | 删除列 | 选中某列，点击"Delete Column" | 该列被删除，列数-1 |
| 5.2.8 | 删除最后一列 | 删除表格最后一列 | 删除成功，至少保留 1 列 |
| 5.2.9 | 默认 3x3 表格 | 打开空表格编辑器 | 默认显示 3 行 3 列 |

#### 5.3 行列选择

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.3.1 | 点击行号选中整行 | 点击行号标签（如 1、2、3） | 该行所有单元格被选中 |
| 5.3.2 | 点击列号选中整列 | 点击列号标签（如 A、B、C） | 该列所有单元格被选中 |
| 5.3.3 | 选中行后删除 | 选中整行后点击删除行 | 该行被删除 |
| 5.3.4 | 选中列后删除 | 选中整列后点击删除列 | 该列被删除 |
| 5.3.5 | 行号选中状态高亮 | 点击行号 | 行号标签高亮显示 |
| 5.3.6 | 列号选中状态高亮 | 点击列号 | 列号标签高亮显示 |

#### 5.4 单元格选择

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.4.1 | 单击单元格 | 点击单个单元格 | 该单元格被选中，属性面板显示 |
| 5.4.2 | 拖拽多选 | 从一个单元格拖拽到另一个 | 矩形区域内的所有单元格被选中 |
| 5.4.3 | Shift+点击扩展 | 先选一个单元格，Shift+点击另一个 | 两个单元格之间的矩形区域被选中 |
| 5.4.4 | 多选单元格状态 | 选中 3 个单元格 | 属性面板显示混合状态或统一值 |
| 5.4.5 | 取消选中 | 点击表格外部区域 | 所有选中状态清除 |
| 5.4.6 | 选中整行后点击单元格 | 先选整行，再点击其中某个单元格 | 仅该单元格被选中 |

#### 5.5 单元格属性编辑

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.5.1 | Fill 修改 | 修改选中单元格的 Fill 颜色 | 单元格背景色更新 |
| 5.5.2 | Border 修改 | 修改选中单元格的 Border 颜色 | 单元格边框色更新 |
| 5.5.3 | Width 修改 | 修改选中单元格宽度 | 单元格宽度属性更新 |
| 5.5.4 | Text Color 修改 | 修改文字颜色 | 单元格文字色更新 |
| 5.5.5 | Font Size 修改 | 修改字号 | 单元格字号更新 |
| 5.5.6 | Bold 切换 | 点击 Bold 按钮 | 粗体状态切换，文本加粗 |
| 5.5.7 | Italic 切换 | 点击 Italic 按钮 | 斜体状态切换，文本倾斜 |
| 5.5.8 | Align 切换 | 切换水平对齐（L/C/R） | 单元格文本对齐更新 |
| 5.5.9 | V-Align 切换 | 切换垂直对齐（T/M/B） | 单元格文本垂直对齐更新 |
| 5.5.10 | Underline 切换 | 点击 U 按钮 | 文本添加/移除下划线 |
| 5.5.11 | Strikethrough 切换 | 点击 S 按钮 | 文本添加/移除删除线 |
| 5.5.12 | Padding-Top 修改 | 修改上内边距 | 单元格顶部内边距更新 |
| 5.5.13 | Padding-Right 修改 | 修改右内边距 | 单元格右侧内边距更新 |
| 5.5.14 | Padding-Bottom 修改 | 修改下内边距 | 单元格底部内边距更新 |
| 5.5.15 | Padding-Left 修改 | 修改左内边距 | 单元格左侧内边距更新 |
| 5.5.16 | Padding 四向独立 | 分别设置四个方向不同值 | 每个方向独立生效 |
| 5.5.17 | Text 内容修改 | 编辑单元格文本内容 | 单元格文本更新 |

#### 5.6 多单元格批量编辑

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.6.1 | 批量设置 Fill | 选中 3 个单元格，统一设置 Fill | 所有选中单元格背景色更新 |
| 5.6.2 | 批量设置 Bold | 选中多个单元格，切换 Bold | 所有选中单元格粗体状态更新 |
| 5.6.3 | 批量设置 Align | 选中多个单元格，设置对齐方式 | 所有选中单元格对齐更新 |
| 5.6.4 | 批量设置 Padding | 选中多个单元格，设置内边距 | 所有选中单元格内边距更新 |
| 5.6.5 | 混合状态显示 | 选中 2 个 Bold 不同的单元格 | 属性面板显示混合状态（部分选中） |
| 5.6.6 | 批量修改后重置单个 | 批量设置后，单独修改其中一个 | 仅该单元格属性改变 |

#### 5.7 行属性编辑

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.7.1 | 设置行 Fill | 选中整行，设置 Fill 颜色 | 该行所有单元格应用背景色 |
| 5.7.2 | 设置行 Text Color | 选中整行，设置文字色 | 该行所有单元格文字色更新 |
| 5.7.3 | 设置行 Align | 选中整行，设置对齐方式 | 该行所有单元格对齐更新 |
| 5.7.4 | 重置行属性 | 点击"Reset Row"按钮 | 该行的所有属性被清空 |
| 5.7.5 | 行属性继承到单元格 | 设置行属性后，单元格无单独属性 | 单元格继承行属性显示 |
| 5.7.6 | 单元格属性覆盖行属性 | 行设置 bg=#FFF，单元格设置 bg=#AAA | 单元格显示 #AAA（单元格优先） |

#### 5.8 保存与重置

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.8.1 | 保存表格 | 点击 Save 按钮 | 表格序列化回源码，模态关闭 |
| 5.8.2 | 保存后源码正确 | 修改表格后保存 | 源码中 ## 行及所有 # 行正确更新 |
| 5.8.3 | 保存后坐标保留 | 修改表格属性后保存 | @(x,y) 坐标不丢失 |
| 5.8.4 | 保存后新增行列保留 | 插入行/列后保存 | 新增的行列在源码中体现 |
| 5.8.5 | 重置表格 | 点击 Reset 按钮 | 所有修改撤销，恢复打开时状态 |
| 5.8.6 | 关闭模态不保存 | 点击 Cancel 或点外部关闭 | 所有修改丢弃，源码不变 |
| 5.8.7 | 修改后关闭确认 | 有未保存修改时关闭 | 提示是否放弃修改 |

#### 5.9 缩放功能

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.9.1 | Ctrl+滚轮放大 | 按住 Ctrl，向上滚动 | 表格放大，zoom 值增加 |
| 5.9.2 | Ctrl+滚轮缩小 | 按住 Ctrl，向下滚动 | 表格缩小，zoom 值减少 |
| 5.9.3 | 缩放范围限制 | 持续缩小 | 最小缩放值限制（如 0.1x） |
| 5.9.4 | 缩放范围限制 | 持续放大 | 最大缩放值限制（如 5x） |
| 5.9.5 | 重置缩放 | 点击重置缩放按钮 | zoom 恢复为 1x |
| 5.9.6 | 当前缩放显示 | 缩放后 | 显示当前缩放百分比（如 150%） |
| 5.9.7 | 非 Ctrl+滚轮不缩放 | 不按 Ctrl，滚动 | 正常页面滚动，不缩放表格 |

#### 5.10 渲染正确性

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|---------|
| 5.10.1 | 单元格文本正确显示 | 打开有文本的表格 | 所有单元格文本正确显示 |
| 5.10.2 | 单元格样式正确显示 | 打开有样式的表格 | Bold/Italic/Align 等样式正确 |
| 5.10.3 | colspan 渲染 | 打开有合并列的表格 | 合并列正确跨越多列 |
| 5.10.4 | rowspan 渲染 | 打开有合并行的表格 | 合并行正确跨越多行 |
| 5.10.5 | 行属性继承渲染 | 行设置 bg=#EEE | 该行单元格显示对应背景色 |
| 5.10.6 | 空单元格显示 | 打开有空单元格的表格 | 空单元格正常显示，不崩溃 |
| 5.10.7 | 表格边框渲染 | 设置 border=2 | 表格线宽度正确 |
| 5.10.8 | 单元格间距渲染 | 设置 cellspacing=5 | 单元格之间有正确间距 |

**Layer 5 总计：76 个测试用例**

---

### Layer 6: E2E 测试 — 完整用户流程（后续）

**文件：** `editor/e2e/table-editor-flow.spec.ts`

| # | 测试用例 | 流程 | 预期结果 |
|---|---------|------|---------|
| 6.1 | 完整表格编辑流程 | 拖入表格→双击打开→修改属性→添加行列→保存 | 源码正确更新，预览正确 |
| 6.2 | 表格属性继承验证 | 设置行属性→保存→查看预览 | 行属性正确继承到单元格 |
| 6.3 | 坐标保留验证 | 移动表格位置→打开编辑器→修改→保存 | 坐标不丢失 |
| 6.4 | 多轮编辑不丢失 | 打开→修改→保存→再打开→再修改→再保存 | 所有修改累积保留 |

**Layer 6 总计：4 个测试用例**

---

## 三、总用例统计

| 层级 | 测试文件 | 用例数 | 说明 |
|------|---------|--------|------|
| Layer 1 | `attribute-updater.test.ts` | 90 | 覆盖所有元素类型 × 所有属性 |
| Layer 2 | `table-source-utils.test.ts` | 22 | 解析/序列化/默认值/坐标保留 |
| Layer 3 | `renderer-context.test.ts` | 52 | 所有 get*Attribute 辅助函数 |
| Layer 4 | `PropertyPanel.test.tsx` | 12 | PropertyPanel 渲染正确性 |
| Layer 5 | `TableEditorModal.test.tsx` | 76 | 表格编辑器完整功能测试 |
| Layer 6 | `table-editor-flow.spec.ts` | 4 | E2E 完整用户流程 |
| **合计** | | **256** | |

---

## 四、技术实现方案

### 4.1 测试框架

- **单元测试**：Jest
- **组件测试**：@testing-library/react + Jest
- **E2E 测试**（后续）：Playwright

### 4.2 依赖安装

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 4.3 Jest 配置

在 `editor/jest.config.js` 或 `editor/package.json` 中添加：

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "setupFilesAfterEnv": ["<rootDir>/src/__tests__/setup.ts"]
  }
}
```

### 4.4 Mock 策略

| 模块 | Mock 方式 | 原因 |
|------|----------|------|
| `element-bounds.ts` | 用简单字符串匹配 mock `detectElementBounds` | 避免复杂的位置检测逻辑 |
| `renderer-context` | 无需 mock（纯函数） | 直接测试 |
| PropertyPanel 的 store | mock `useSolarWireStore` 和 `useEditorStore` | 隔离组件渲染逻辑 |

### 4.5 关键测试模式

```typescript
describe('updateLineAttribute - coordinate', () => {
  test('rectangle: replaces existing @(...) coordinate', () => {
    const source = '[] @(100, 200) w=50 h=30';
    const result = updateLineAttribute(source, 1, 'x', 150);
    expect(result).toContain('@(150, 200)');
  });

  test('rectangle: adds coordinate when missing', () => {
    const source = '[] w=50 h=30';
    const result = updateLineAttribute(source, 1, 'x', 100);
    expect(result).toContain('@(100, 0)');
  });
});
```

### 4.6 测试运行命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- attribute-updater.test.ts

# 运行并生成覆盖率报告
npm test -- --coverage
```

---

## 五、实施优先级

| 阶段 | 内容 | 优先级 | 预估工作量 |
|------|------|--------|----------|
| 第一阶段 | Layer 1 + Layer 2 | 最高 | 核心逻辑覆盖，发现 bug |
| 第二阶段 | Layer 3 | 高 | 辅助函数验证 |
| 第三阶段 | Layer 4 | 中 | 组件渲染正确性 |
| 第四阶段 | E2E 测试 | 低 | 完整用户流程 |

---

## 六、风险与注意事项

1. **element-bounds 的复杂性**：`detectElementBounds` 和 `getElementStartLine` 依赖多行元素检测，单元测试可能需要大量 mock。建议优先测试 attribute-updater 的核心逻辑，bounds 检测后续补充。

2. **属性更新的位置敏感性**：note 属性需要正确处理 note= 前后的属性插入，测试用例必须覆盖 "note 在中间" 和 "note 在末尾" 两种情况。

3. **表格属性继承**：表格单元格的属性可以从行继承，序列化时需要正确处理 cell.attrs vs row.attrs 的优先级。

4. **坐标保留策略**：当 attrs.x/y 都为 undefined 时，serializeTableToSource 应保留原始行的 @(x,y)，而不是删除它。

5. **布尔属性的特殊格式**：bold/italic 不带 = 值（如 `bold` 而非 `bold=true`），deleteLineAttribute 需要特殊处理 `bold(?:=[^\s]+)?` 模式。
