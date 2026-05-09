# SolarWire Syntax Reference

## Element Syntax Quick Reference

| 元素 | 语法 | 示例 |
|------|------|------|
| 矩形 | `["文本"] @(x,y)` | `["按钮"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| 圆角矩形 | `["文本"] @(x,y) r=N` | `["卡片"] @(50,100) w=300 h=200 r=8` |
| 圆形 | `("文本") @(x,y)` | `("头像") @(300,50) w=60` |
| 文本 | `"文本" @(x,y)` | `"标题" @(100,50) size=24 bold` |
| 多行文本 | `"""Line1\nLine2""" @(x,y)` | `"""第一行\n第二行""" @(100,50)` |
| 占位符 | `[?"文本"] @(x,y)` | `[?"图片"] @(200,200) w=150 h=100` |
| 图片 | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| 线条 | `-- "标签" -- @(x1,y1)->(x2,y2)` | `-- "连接" -- @(50,200)->(450,200)` |
| 表格 | `## @(x,y)` | `## @(50,50) w=500` |
| 表格行 | `  #` (缩进) | `  # bg=#F3F4F6` |

## Document Declarations

文档声明以 `!` 前缀开头，必须在文件顶部、元素之前。语法：`!key=value`（布尔类型无值，如 `!bold`）

| 声明 | 类型 | 示例 | 说明 |
|------|------|------|------|
| `!title=value` | string | `!title="用户登录页面"` | 页面标题 |
| `!c=value` | color | `!c=#333333` | 默认文字颜色 |
| `!size=value` | number | `!size=13` | 默认字体大小 |
| `!line-height=value` | number | `!line-height=22` | 默认行高 |
| `!gap=value` | number | `!gap=20` | 默认间距 |
| `!bg=value` | color | `!bg=#FFFFFF` | 默认背景色 |
| `!r=value` | number | `!r=8` | 默认圆角 |
| `!bold` | boolean | `!bold` | 默认粗体（无值） |

```solarwire
!title="用户登录页面"
!c=#333333
!size=13
!line-height=22
!bg=#FFFFFF
```

## Coordinate System

### 绝对坐标

```solarwire
["按钮"] @(100,50) w=120 h=40
```

### 线条终点

```solarwire
-- "标签" -- @(100,50)->(300,50)
```

### 锚点规则

所有元素左上角为锚点。`@(x,y)` 指定元素左上角位置。

## Indentation Rules

- 表格行 `#` 必须比表格 `##` 多缩进（至少2空格）
- 表格单元格必须比表格行 `#` 多缩进（至少2空格）
- 使用空格缩进，不使用Tab

```solarwire
## @(50,50) w=500
  #
    ["Header 1"]
    ["Header 2"]
  #
    ["Cell 1"]
    ["Cell 2"]
```

## Common Attributes

| 属性 | 类型 | 默认值 | 说明 | 适用元素 |
|------|------|--------|------|---------|
| `w=N` | number | 元素相关 | 宽度 | 矩形、圆形、占位符、图片、表格 |
| `h=N` | number | 元素相关 | 高度 | 矩形、圆形、占位符、图片、表格、表格行 |
| `bg=#hex` | color | 元素相关 | 背景色 | 矩形、圆形、占位符、图片、表格行 |
| `c=#hex` | color | #000000 | 文字颜色 | 矩形、圆形、文本、占位符、图片 |
| `b=#hex` | color | #333333 | 边框颜色 | 矩形、圆形、占位符、图片、表格 |
| `s=N` | number | 1 | 边框宽度 | 矩形、圆形、占位符、图片、线条 |
| `r=N` | number | 0 | 圆角半径 | 矩形 |
| `size=N` | number | 12 | 字体大小 | 矩形、圆形、文本、占位符、图片、线条 |
| `text-size=N` | number | — | 字体大小(备选，优先用size) | 同size |
| `bold` | boolean | false | 粗体 | 矩形、圆形、文本、占位符 |
| `italic` | boolean | false | 斜体 | 矩形、圆形、文本、占位符 |
| `align=l\|c\|r` | enum | l | 水平对齐方式 | 矩形、圆形、文本、占位符 |
| `opacity=0~1` | number | 1 | 不透明度 | 矩形、圆形、文本、图片 |
| `line-height=N` | number | 22 | 行高 | 矩形、圆形、文本、占位符 |
| `note="""..."""` | string | — | 功能描述(支持三引号多行) | 矩形、圆形、文本、占位符、图片、线条、表格 |
| `letter-spacing=N` | number | 0 | 字间距 | 矩形、圆形、文本、占位符 |
| `vertical-align=t\|m\|b` | enum | t | 垂直对齐(居上/居中/居下) | 矩形、圆形、占位符 |
| `padding-top=N` | number | — | 上内边距 | 矩形、圆形、占位符 |
| `padding-right=N` | number | — | 右内边距 | 矩形、圆形、占位符 |
| `padding-bottom=N` | number | — | 下内边距 | 矩形、圆形、占位符 |
| `padding-left=N` | number | — | 左内边距 | 矩形、圆形、占位符 |
| `text-decoration=underline\|line-through` | enum | — | 文本装饰(下划线/删除线) | 矩形、圆形、文本、占位符 |
| `style=dashed\|dotted` | enum | — | 线条样式 | 线条 |
| `shadow-x=N` | number | 0 | 阴影X偏移 | 矩形、圆形、文本、图片 |
| `shadow-y=N` | number | 0 | 阴影Y偏移 | 矩形、圆形、文本、图片 |
| `shadow-blur=N` | number | 0 | 阴影模糊 | 矩形、圆形、文本、图片 |
| `shadow-color=#hex` | color | transparent | 阴影颜色 | 矩形、圆形、文本、图片 |

## Line-Specific Attributes

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `c=#hex` | color | #333333 | 线条颜色 |
| `s=N` | number | 1 | 线条宽度 |
| `style=dashed\|dotted` | enum | — | 虚线样式 |
| `text-color=#hex` | color | #333333 | 标签文字颜色 |
| `size=N` | number | 12 | 标签字体大小 |

## Table-Specific Rules

### 表格 `##` 专有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `w=N` | number | 600 | 表格宽度 |
| `h=N` | number | 0(自动) | 表格高度 |
| `border=N` | number | 1 | 外边框宽度 |
| `cellspacing=N` | number | 0 | 单元格间距 |
| `b=#hex` | color | #333333 | 边框颜色 |

### 表格行 `#` 规则

- 表格行**不支持** `note` 属性（renderer会报错）
- 表格行可继承属性给单元格：`bg`, `c`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
- 表格行 `h=N` 设置行高，默认40

### 表格单元格规则

- 单元格**不能**指定 `w` 或 `h` 属性（renderer会报错，尺寸自动计算）
- 单元格**不能**是线条元素（renderer会报错）
- 单元格支持 `colspan=N` 和 `rowspan=N`
- 单元格从表格行继承：`bg`, `c`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`

## Common Mistakes

| 错误 | 正确 | 说明 |
|------|------|------|
| `stroke=#CCC` | `b=#CCC` | 边框颜色用 `b`，不是 `stroke` |
| `strokeWidth=2` | `s=2` | 边框宽度用 `s`，不是 `strokeWidth` |
| `multiline=true` | — | multiline属性不存在 |
| `truncate=true` | — | truncate属性不存在 |
| `# note="""..."""` | 在单元格上加note | 表格行不支持note属性 |
| `[Cell] w=100` | 移除w | 表格单元格不能指定w/h |
| `-- @(50,50)->(100,50)` (表格内) | 使用其他元素 | 表格单元格不能是线条 |
| `bg #FFF` | `bg=#FFF` | 属性必须用=连接 |
| 元素缺少坐标 | 添加 `@(x,y)` | 每个元素应有坐标 |
| Tab缩进 | 空格缩进 | 必须使用空格 |
| `(("头像"))` | `("头像")` | 圆形用单括号 `()`，不是双括号 `(())` |
| `note="内容"` | `note="""内容"""` | note必须用三引号`"""`，不能用单/双引号 |

## Forbidden Attributes

以下属性在旧技能中存在但renderer**不支持**，严禁使用：

| 幻觉属性 | 说明 |
|---------|------|
| `multiline` | 不存在此属性 |
| `truncate` | 不存在此属性 |
| `stroke` | 应使用 `b`（边框颜色） |
| `strokeWidth` | 应使用 `s`（边框宽度） |
| `(())` | 圆形应使用 `("text")`，不是 `(("text"))` |
| `("text")`作圆角矩形 | 圆角矩形应使用 `["text"] r=N`，`("text")`是圆形 |

## Attribute Quick Reference Matrix

### 尺寸与边框

| 属性 | 矩形 `[]` | 圆形 `()` | 文本 `""` | 占位符 `[?]` | 图片 `<>` | 线段 `--` | 表格 `##` | 表格行 `#` | 单元格 |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:---------:|:----------:|:------:|
| `w` | ✅ 100 | ✅ 100 | ✅ 0 | ✅ 100 | ✅ 100 | — | ✅ 600 | — | ❌ |
| `h` | ✅ 40 | ✅ 40 | — | ✅ 40 | ✅ 80 | — | ✅ 0(自动) | ✅ 40 | ❌ |
| `bg` | ✅ #ffffff | ✅ transparent | — | ✅ #f0f0f0 | ✅ #f0f0f0 | — | — | ✅ transparent | ✅ #ffffff |
| `b` | ✅ #333333 | ✅ #333333 | — | ✅ #999999 | ✅ #cccccc | — | ✅ #333333 | ✅(继承) | ✅(继承) |
| `s` | ✅ 1 | ✅ 1 | — | ✅ 1 | ✅ 0 | ✅ 1 | — | ✅(继承) | ✅(继承) |
| `r` | ✅ 0 | — | — | — | — | — | — | — | — |
| `border` | — | — | — | — | — | — | ✅ 1 | — | — |
| `cellspacing` | — | — | — | — | — | — | ✅ 0 | — | — |

### 文本属性

| 属性 | 矩形 `[]` | 圆形 `()` | 文本 `""` | 占位符 `[?]` | 图片 `<>` | 线段 `--` | 表格行 `#` | 单元格 |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:----------:|:------:|
| `c` | ✅ #000000 | ✅ #000000 | ✅ #000000 | ✅ #999999 | ✅ #999999 | — | ✅(继承) | ✅(继承) |
| `size`/`text-size` | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12(标签) | ✅(继承) | ✅(继承) |
| `bold` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(继承) | ✅(继承) |
| `italic` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(继承) | ✅(继承) |
| `align` | ✅ l | ✅ c | ✅ l | ✅ c | — | — | ✅(继承) | ✅(继承) |
| `vertical-align` | ✅ t | ✅ m | — | ✅ m | — | — | ✅(继承) | ✅(继承) |
| `line-height` | ✅ 22 | ✅ 22 | ✅ 22 | ✅ 22 | — | — | ✅(继承) | ✅(继承) |
| `letter-spacing` | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 | — | — | ✅(继承) | ✅(继承) |
| `text-decoration` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(继承) | ✅(继承) |
| `padding-top` | ✅ | ✅ | — | ✅ | — | — | ✅(继承) | ✅(继承) |
| `padding-right` | ✅ | ✅ | — | ✅ | — | — | ✅(继承) | ✅(继承) |
| `padding-bottom` | ✅ | ✅ | — | ✅ | — | — | ✅(继承) | ✅(继承) |
| `padding-left` | ✅ | ✅ | — | ✅ | — | — | ✅(继承) | ✅(继承) |
| `text-color` | — | — | — | — | — | ✅ #333333 | — | — |

### 视觉效果

| 属性 | 矩形 `[]` | 圆形 `()` | 文本 `""` | 占位符 `[?]` | 图片 `<>` | 线段 `--` | 表格 `##` | 表格行 `#` | 单元格 |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:---------:|:----------:|:------:|
| `opacity` | ✅ 1 | ✅ 1 | ✅ 1 | ❌ | ✅ 1 | — | — | — | — |
| `shadow-x` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-y` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-blur` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-color` | ✅ transparent | ✅ transparent | ✅ transparent | ❌ | ✅ transparent | — | — | — | — |
| `style` | — | — | — | — | — | ✅ dashed/dotted | — | — | — |
| `note` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### 结构属性

| 属性 | 表格 `##` | 表格行 `#` | 单元格 |
|------|:---------:|:----------:|:------:|
| `colspan` | — | — | ✅ 1 |
| `rowspan` | — | — | ✅ 1 |

> 表格行属性可继承给单元格：`c`, `bg`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
>
> 单元格不能指定 `w` 或 `h`（尺寸由表格自动计算，指定会导致渲染错误）
>
> 单元格不能是线条元素（会导致渲染错误）

## Rectangle `[]`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | 宽度 |
| `h` | number | 40 | 高度 |
| `bg` | color | #ffffff | 背景色 |
| `c` | color | #000000 | 文字颜色 |
| `b` | color | #333333 | 边框颜色 |
| `s` | number | 1 | 边框宽度 |
| `r` | number | 0 | 圆角半径（r>0时为圆角矩形） |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `bold` | boolean | false | 粗体 |
| `italic` | boolean | false | 斜体 |
| `align` | enum(l/c/r) | l | 水平对齐方式 |
| `vertical-align` | enum(t/m/b) | t | 垂直对齐(居上/居中/居下) |
| `line-height` | number | 22 | 行高 |
| `letter-spacing` | number | 0 | 字间距 |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(下划线/删除线) |
| `padding-top` | number | 8 | 上内边距 |
| `padding-right` | number | 8 | 右内边距 |
| `padding-bottom` | number | 8 | 下内边距 |
| `padding-left` | number | 8 | 左内边距 |
| `opacity` | number(0~1) | 1 | 不透明度 |
| `shadow-x` | number | 0 | 阴影X偏移 |
| `shadow-y` | number | 0 | 阴影Y偏移 |
| `shadow-blur` | number | 0 | 阴影模糊 |
| `shadow-color` | color | transparent | 阴影颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

## Circle `()`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | 宽度(决定圆的水平直径) |
| `h` | number | 40 | 高度(决定圆的垂直直径) |
| `bg` | color | transparent | 背景色 |
| `c` | color | #000000 | 文字颜色 |
| `b` | color | #333333 | 边框颜色 |
| `s` | number | 1 | 边框宽度 |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `bold` | boolean | false | 粗体 |
| `italic` | boolean | false | 斜体 |
| `align` | enum(l/c/r) | c | 水平对齐方式 |
| `vertical-align` | enum(t/m/b) | m | 垂直对齐(居上/居中/居下) |
| `line-height` | number | 22 | 行高 |
| `letter-spacing` | number | 0 | 字间距 |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(下划线/删除线) |
| `padding-top` | number | 4 | 上内边距 |
| `padding-right` | number | 4 | 右内边距 |
| `padding-bottom` | number | 4 | 下内边距 |
| `padding-left` | number | 4 | 左内边距 |
| `opacity` | number(0~1) | 1 | 不透明度 |
| `shadow-x` | number | 0 | 阴影X偏移 |
| `shadow-y` | number | 0 | 阴影Y偏移 |
| `shadow-blur` | number | 0 | 阴影模糊 |
| `shadow-color` | color | transparent | 阴影颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

> 文字区域为内切矩形的 70%（w×0.7 × h×0.7）

## Text `""`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 0 | 宽度(0=自动计算文本宽度) |
| `c` | color | #000000 | 文字颜色 |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `bold` | boolean | false | 粗体 |
| `italic` | boolean | false | 斜体 |
| `align` | enum(l/c/r) | l | 水平对齐方式 |
| `line-height` | number | 22 | 行高 |
| `letter-spacing` | number | 0 | 字间距 |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(下划线/删除线) |
| `opacity` | number(0~1) | 1 | 不透明度 |
| `shadow-x` | number | 0 | 阴影X偏移 |
| `shadow-y` | number | 0 | 阴影Y偏移 |
| `shadow-blur` | number | 0 | 阴影模糊 |
| `shadow-color` | color | transparent | 阴影颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

> 纯文本不支持 `vertical-align`、`padding`、`bg`、`b`、`s`（无边框容器）

## Multi-line Text `"""___"""`

用于显示多行文本内容，如段落、描述等。属性与 Text `""` 完全一致。

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 0 | 宽度(0=自动计算) |
| `c` | color | #000000 | 文字颜色 |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `bold` | boolean | false | 粗体 |
| `italic` | boolean | false | 斜体 |
| `align` | enum(l/c/r) | l | 水平对齐方式 |
| `line-height` | number | 22 | 行高 |
| `letter-spacing` | number | 0 | 字间距 |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(下划线/删除线) |
| `opacity` | number(0~1) | 1 | 不透明度 |
| `shadow-x` | number | 0 | 阴影X偏移 |
| `shadow-y` | number | 0 | 阴影Y偏移 |
| `shadow-blur` | number | 0 | 阴影模糊 |
| `shadow-color` | color | transparent | 阴影颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

**语法：** `"""第一行\n第二行\n第三行""" @(x,y)`

**示例：**
```solarwire
"""用户协议内容...
1. 第一条
2. 第二条
3. 第三条""" @(100,50) w=300 size=12
```

## Placeholder `[?]`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | 宽度 |
| `h` | number | 40 | 高度 |
| `bg` | color | #f0f0f0 | 背景色 |
| `c` | color | #999999 | 文字颜色 |
| `b` | color | #999999 | 边框颜色 |
| `s` | number | 1 | 边框宽度 |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `bold` | boolean | false | 粗体 |
| `italic` | boolean | false | 斜体 |
| `align` | enum(l/c/r) | c | 水平对齐方式 |
| `vertical-align` | enum(t/m/b) | m | 垂直对齐(居上/居中/居下) |
| `line-height` | number | 22 | 行高 |
| `letter-spacing` | number | 0 | 字间距 |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(下划线/删除线) |
| `padding-top` | number | 8 | 上内边距 |
| `padding-right` | number | 8 | 右内边距 |
| `padding-bottom` | number | 8 | 下内边距 |
| `padding-left` | number | 8 | 左内边距 |
| `note` | string | — | 功能描述(支持三引号多行) |

> 占位符不支持 `opacity`、`shadow-*`

## Image `<>`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | 宽度 |
| `h` | number | 80 | 高度 |
| `bg` | color | #f0f0f0 | 背景色(无URL时显示) |
| `c` | color | #999999 | 图标/文字颜色(无URL时显示) |
| `b` | color | #cccccc | 边框颜色 |
| `s` | number | 0 | 边框宽度 |
| `size` | number | 12 | 字体大小 |
| `text-size` | number | — | 字体大小(备选，优先用size) |
| `opacity` | number(0~1) | 1 | 不透明度 |
| `shadow-x` | number | 0 | 阴影X偏移 |
| `shadow-y` | number | 0 | 阴影Y偏移 |
| `shadow-blur` | number | 0 | 阴影模糊 |
| `shadow-color` | color | transparent | 阴影颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

## Line `--`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `c` | color | #333333 | 线条颜色 |
| `s` | number | 1 | 线条宽度 |
| `style` | enum(dashed/dotted) | — | 虚线样式 |
| `size` | number | 12 | 标签字体大小 |
| `text-size` | number | — | 标签字体大小(备选，优先用size) |
| `text-color` | color | #333333 | 标签文字颜色 |
| `note` | string | — | 功能描述(支持三引号多行) |

## Table `##`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 600 | 表格宽度 |
| `h` | number | 0 | 表格高度(0=自动计算) |
| `b` | color | #333333 | 外边框颜色 |
| `border` | number | 1 | 外边框宽度 |
| `cellspacing` | number | 0 | 单元格间距 |
| `note` | string | — | 功能描述(支持三引号多行) |

## Table Row `#`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `bg` | color | transparent | 行背景色 |
| `h` | number | 40 | 行高 |
| `c` | color | — | 文字颜色(继承给单元格) |
| `b` | color | — | 边框颜色(继承给单元格) |
| `s` | number | — | 边框宽度(继承给单元格) |
| `size` | number | — | 字体大小(继承给单元格) |
| `bold` | boolean | — | 粗体(继承给单元格) |
| `italic` | boolean | — | 斜体(继承给单元格) |
| `align` | enum(l/c/r) | — | 水平对齐方式(继承给单元格) |
| `vertical-align` | enum(t/m/b) | — | 垂直对齐(继承给单元格) |
| `line-height` | number | — | 行高(继承给单元格) |
| `letter-spacing` | number | — | 字间距(继承给单元格) |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(继承给单元格) |
| `padding-top` | number | — | 上内边距(继承给单元格) |
| `padding-right` | number | — | 右内边距(继承给单元格) |
| `padding-bottom` | number | — | 下内边距(继承给单元格) |
| `padding-left` | number | — | 左内边距(继承给单元格) |

**注意：** 表格行不支持 `note` 属性，使用会导致渲染错误。

## Table Cell (inside #)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `colspan` | number | 1 | 跨列数 |
| `rowspan` | number | 1 | 跨行数 |
| `bg` | color | #ffffff | 背景色(可从行继承) |
| `c` | color | #000000 | 文字颜色(可从行继承) |
| `b` | color | #333333 | 边框颜色(可从行继承) |
| `s` | number | 1 | 边框宽度(可从行继承) |
| `size` | number | 12 | 字体大小(可从行继承) |
| `bold` | boolean | false | 粗体(可从行继承) |
| `italic` | boolean | false | 斜体(可从行继承) |
| `align` | enum(l/c/r) | l | 水平对齐方式(可从行继承) |
| `vertical-align` | enum(t/m/b) | t | 垂直对齐(可从行继承) |
| `line-height` | number | 22 | 行高(可从行继承) |
| `letter-spacing` | number | 0 | 字间距(可从行继承) |
| `text-decoration` | enum(underline/line-through) | — | 文本装饰(可从行继承) |
| `padding-top` | number | — | 上内边距(可从行继承) |
| `padding-right` | number | — | 右内边距(可从行继承) |
| `padding-bottom` | number | — | 下内边距(可从行继承) |
| `padding-left` | number | — | 左内边距(可从行继承) |

**限制：**
- 单元格不能指定 `w` 或 `h`（尺寸由表格自动计算，指定会导致渲染错误）
- 单元格不能是线条元素（会导致渲染错误）
- 支持的单元格元素类型：文本 `""`、矩形 `[]`（r>0时为圆角矩形）、圆形 `()`、占位符 `[?]`、多行文本 `"""___"""`
