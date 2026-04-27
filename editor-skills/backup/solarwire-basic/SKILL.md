---
name: solarwire-basic
description: Use when generating or validating SolarWire wireframe code, when AI produces syntax errors, parse failures, rendering issues, or incorrect element positioning in SolarWire diagrams
---

# SolarWire 语法规则 (solarwire-basic)

## Overview

确保 AI 生成的 SolarWire 代码 100% 可渲染的完整语法规则和自动校验工具。

**核心原则：** 始终使用绝对坐标，每个元素独立一行，生成后必须使用 validate.js 验证。

## When to Use

**症状和使用场景：**
- AI 生成 SolarWire 代码时出现语法错误
- 解析器报错 "Expected '@'" 或 "Found 'w'"
- 渲染失败或元素位置错误
- 需要使用表格但缩进不正确
- 不确定属性格式（w=, h=, bg= 等）
- 需要将组件代码写入 .swc 文件前验证语法

## Quick Reference

### 元素语法

| 元素 | 语法 | 示例 |
|------|------|------|
| 矩形 | `["文本"] @(x,y) w=宽 h=高` | `["按钮"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| 圆角矩形 | `("文本") @(x,y) w=宽 h=高 r=半径` | `("卡片") @(50,100) w=300 h=200 r=8` |
| 圆形 | `(("文本")) @(x,y) w=直径` | `(("头像")) @(300,50) w=60` |
| 文本 | `"文本" @(x,y) size=大小` | `"标题" @(100,50) size=24 bold` |
| 占位符 | `[?"文本"] @(x,y) w=宽 h=高` | `[?"图片"] @(200,200) w=150 h=100` |
| 图片 | `<URL> @(x,y) w=宽 h=高` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| 线条 | `-- "标签" -- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) stroke=#CCC` |
| 表格 | `## @(x,y) w=宽` | `## @(50,50) w=500 bg=#FFF` |
| 表格行 | `  # @(x,y)` (缩进) | `  # @(50,50) w=500 h=40 bg=#F3F4F6` |

### 常用属性

`w`, `h`, `bg`, `c`, `size`, `bold`, `align`, `r`, `stroke`, `strokeWidth`, `padding`, `multiline`, `truncate`, `note`

### 坐标规则

- **使用绝对坐标** `@(x,y)` - 始终推荐
- **避免边缘引用坐标** `@(L+10,T+5)` - 容易出错
- 线条支持相对终点 `@(100,50)->(+200,+0)`

### 缩进规则

- 表格行必须比表格多缩进（至少 2 空格）
- 表格单元格必须比表格行多缩进（至少 2 空格）
- 使用空格，不使用 Tab

## Core Pattern

### 校验流程

生成 SolarWire 代码后，**必须**使用 validate.js 验证：

```bash
# 方法 1：验证文件
node validate.js code.txt --output .

# 方法 2：内联代码
node validate.js --code '["按钮"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF' --output .

# 方法 3：标准输入
echo '["按钮"] @(100,50) w=120 h=40' | node validate.js --stdin --output .
```

**退出码：** 0 = 通过, 1 = 失败, 2 = 参数错误

**编程方式：**
```javascript
const { validateCode } = require('./validate.js');
const result = validateCode(code, { generateSvg: false });
if (result.valid) { /* 代码正确 */ }
```

### 校验脚本位置

```
editor-skills/solarwire-basic/
├── SKILL.md
├── validate.js          # 校验脚本
└── lib/
    ├── parser/          # 解析器
    └── renderer-svg/    # SVG 渲染器
```

## Implementation

### Note 元素（多行注释）

使用**三引号** `"""内容"""` 定义多行文本，支持换行：

```solarwire
"""这是一个登录按钮
用于用户登录操作
点击后跳转到登录页面""" @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF
```

**注意：** 必须使用三引号 `"""`，不能使用双引号 `"`。

### 声明语法

```solarwire
!title="用户登录页面"
!primaryColor=#3B82F6
!canvasWidth=800
!canvasHeight=600
```

### 注释语法

```solarwire
// 这是页面标题
"欢迎使用" @(100,50) size=24 bold
```

### 完整示例

```solarwire
!title="用户登录"
!primaryColor=#3B82F6

// 页面标题
"用户登录" @(300,50) size=24 bold

// 登录表单卡片
("登录表单") @(200,100) w=400 h=300 r=8 bg=#FFFFFF stroke=#E5E7EB

// 用户名输入
"用户名" @(220,120) size=14
["请输入用户名"] @(220,150) w=360 h=40 bg=#FFFFFF stroke=#D1D5DB r=6

// 密码输入
"密码" @(220,210) size=14
["请输入密码"] @(220,240) w=360 h=40 bg=#FFFFFF stroke=#D1D5DB r=6

// 登录按钮
["登录"] @(220,300) w=360 h=44 bg=#3B82F6 c=#FFFFFF r=6

// 注册链接
"还没有账号？ 立即注册" @(280,360) size=12 c=#3B82F6
```

## Common Mistakes

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 缺少坐标 | 忘记写 `@(x,y)` | 每个元素必须有坐标 |
| 属性格式错误 | 写成 `bg #3B82F6` | 必须是 `bg=#3B82F6` |
| 多元素同行 | 一行写多个元素 | 每个元素独立一行 |
| 表格缩进不足 | 表格行没缩进 | 表格行至少缩进 2 空格 |
| 使用边缘坐标 | `@(L+10,T+5)` | 使用绝对坐标 `@(100,50)` |
| Note 用双引号 | `"注释"` | 使用三引号 `"""注释"""` |
| Tab 缩进 | 使用 Tab | 使用空格缩进 |

## Common Error Messages

- `Expected "@"` - 元素缺少坐标声明
- `Found "w"` - 属性写在坐标前面（应先写坐标）
- `Table-row element must be indented` - 表格行缩进不足
- `Multiple elements on the same line` - 一行有多个元素
- `Unknown element type` - 元素类型拼写错误

## Real-World Impact

通过 validate.js 自动校验，确保 AI 生成的 SolarWire 代码：
- 解析成功率 100%
- 渲染成功率 100%
- 避免常见语法错误
- 提供详细错误位置信息
