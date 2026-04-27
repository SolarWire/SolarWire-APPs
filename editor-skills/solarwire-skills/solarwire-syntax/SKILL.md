---
name: solarwire-syntax
description: Use when parsing, writing, or validating SolarWire text syntax; when generating SVG from SolarWire code; or when verifying syntax correctness
---

# SolarWire 语法规则 (solarwire-syntax)

## Overview

SolarWire 语法是一套用于描述页面线框图的结构化文本规则。

**核心原则：**
- 语法正确性是其他一切的基础
- 坐标系统以左上角为原点，向右向下为正
- 元素之间用空格分隔
- 每个元素必须有正确的定位

## When to Use

**必须调用本技能的场景：**
- 需要编写或解析 SolarWire 文本语法
- 需要验证 SolarWire 代码语法正确性
- 需要将 SolarWire 代码渲染为 SVG 图片
- 其他技能需要语法规则引用时
- 在 `solarwire: solarwire-prd`、`solarwire: solarwire-code-to-prd`、`solarwire: solarwire-component-generator` 中编写元素代码时

## Shared Library

Parser 和 renderer 代码位于共享目录，避免重复：

```
editor-skills/solarwire-skills/shared/
├── parser/          # SolarWire 文本语法解析器
└── renderer-svg/    # SVG 渲染引擎
```

## Validation Process

编写任何 SolarWire 代码后，必须验证语法：

1. 将代码保存到临时文件（如 `temp-code.txt`）
2. 运行校验脚本：
   ```bash
   node validate.js temp-code.txt
   ```
3. 检查退出码：`0` = 通过, `1` = 失败
4. 失败时查看 SVG 输出中的错误信息
5. 验证通过后删除临时文件

## Core Syntax

### 基本元素

| 类型 | 语法 | 说明 |
|------|------|------|
| 矩形 | `["文本"]` | 默认矩形框 |
| 圆角矩形 | `("文本")` | 圆角矩形框 |
| 圆形 | `(("文本"))` | 圆形/椭圆 |
| 纯文本 | `"文本"` | 无边框文本 |
| 占位符 | `[?"文本"]` | 图片/图标占位 |
| 图片 | `<URL>` | 图片元素 |
| 线条 | `--` | 连接线 |
| 表格 | `##` | 表头行 |
| 表格行 | `#` | 数据行 |

### 定位语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `@(x,y)` | 绝对坐标 | `@(100,200)` |

### 属性语法

**所有属性必须使用以下定义的名称和格式，不可自创：**

| 属性 | 说明 | 示例 | 渲染器属性名 |
|------|------|------|-------------|
| `w=` / `h=` | 宽高 | `w=200 h=100` | w / h |
| `bg=` | 背景色 | `bg=#F5F5F5` 或 `bg=transparent` | bg |
| `b=` | 边框色 | `b=#CCCCCC` | b |
| `s=` | 边框宽度 | `s=2` | s |
| `c=` | 文字颜色 | `c=#333333` | c |
| `r=` | 圆角半径 | `r=8` | r |
| `size=` | 字体大小 | `size=14` | size / text-size |
| `bold` | 粗体 | 布尔属性，写 `bold` 即可 | bold |
| `italic` | 斜体 | 布尔属性，写 `italic` 即可 | italic |
| `align=` | 文字对齐 | `align=l` (左) `align=c` (中) `align=r` (右) | align |
| `opacity=` | 透明度 | `opacity=0.8` (0-1) | opacity |
| `line-height=` | 行高 | `line-height=22` | line-height |
| `note=` | 备注提示 | `note=悬停显示此文本` | note (SVG title) |
| `colspan=` | 表格列合并 | `colspan=2` | colspan (仅表格) |
| `rowspan=` | 表格行合并 | `rowspan=2` | rowspan (仅表格) |

### 全局声明

在代码开头使用 `!` 前缀声明全局默认值，影响后续所有元素：

| 声明 | 说明 | 示例 |
|------|------|------|
| `!size=` | 全局默认字号 | `!size=14` |
| `!bold` | 全局默认粗体 | `!bold` |
| `!line-height=` | 全局默认行高 | `!line-height=24` |
| `!gap=` | 全局默认间距 | `!gap=10` |
| `!r=` | 全局默认圆角 | `!r=6` |

### 图片元素

```
<https://example.com/image.jpg> @(100,200) w=200 h=150
```

### 连接线

```
["开始"] @(100,100) w=100 h=40
  -- arrow -->
["结束"] @(300,100) w=100 h=40
```

支持类型：`arrow`、`dashed`、`solid`、`flow`、`orthogonal`

### 多行文本

```
["多行文本1 | 多行文本2 | 多行文本3"] @(100,100)
```

使用 `|` 分隔行，`<br>` 作为 HTML 换行符。

### 表格

```
## 表头单元格1 | 表头单元格2
   # 数据1 | 数据2
   # 数据3 | 数据4
```

表格行可继承属性到单元格：
```
## [粗体表头] @(0,0) w=100 h=30 bold bg=#F0F0F0
   # 数据1 | 数据2
```

## Common Mistakes

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 使用 `stroke=` | 渲染器不支持，应使用 `b=` | 改为 `b=#CCCCCC` |
| 使用 `sw=` | 渲染器不支持，应使用 `s=` | 改为 `s=2` |
| 使用 `fs=` | 渲染器不支持，应使用 `size=` | 改为 `size=14` |
| 使用 `align=left` | 渲染器仅支持 `l`/`c`/`r` | 改为 `align=l` |
| 使用 `#` 开头注释 | SolarWire 不支持注释 | 移除所有注释 |
| 元素缺少定位 | 渲染位置错误 | 每个元素必须有 `@()` |
| 表格结构错误 | `#` 前缺少 `##` | 先定义表头 `##`，再写数据行 `#` |
| 表格单元格指定 `w`/`h` | 单元格尺寸自动计算 | 移除单元格上的 `w`/`h` |
| 表格行使用 `note` | 行不支持 note，仅单元格支持 | 移除行上的 `note` |
| 颜色格式错误 | 不支持 rgb() | 使用 `#RRGGBB` 格式 |

## Red Flags

| Thought | Reality |
|---------|---------|
| "这个语法应该能工作" | 必须用 validate.js 验证，不要假设 |
| "坐标差不多就行" | 坐标必须精确，否则渲染会错位 |
| "其他技能会验证语法" | 每个技能都必须验证自己产生的 SolarWire 代码 |
| "属性名可以随便写" | 必须严格使用文档中定义的属性名，渲染器只认特定属性 |

## Real-World Impact

通过严格的语法规则和验证流程：
- 确保 100% 的 SolarWire 代码可正确渲染
- 避免因语法错误导致的用户信任问题
- 支持其他技能可靠地引用和生成代码