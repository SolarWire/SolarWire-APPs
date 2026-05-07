# SolarWire Attribute Reference

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

## Document Declarations

文档声明以 `!` 前缀开头，必须在文件顶部、元素之前。语法：`!key=value`

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
