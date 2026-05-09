---
name: "solarwire"
description: "Use for any SolarWire task including PRD creation, code-to-PRD reverse engineering, test case generation, dev design, requirement changes, or wireframe syntax validation"
---

# SolarWire

SolarWire是一套AI化的软件开发工程工具集，覆盖从需求到代码的全流程。所有产出物为.md格式，线框图使用SolarWire代码段，可由编辑器应用查看和微调。

## Intent Router

| 用户意图 | 触发条件 | 读取文件 |
|---------|---------|---------|
| 创建新PRD/新功能 | 用户要写PRD、创建需求、新特性 | [workflow-prd.md](workflow-prd.md) |
| 从代码生成PRD | 用户提供代码/项目、理解现有项目 | [workflow-code-to-prd.md](workflow-code-to-prd.md) |
| 生成测试用例 | PRD已存在，需要测试用例 | [workflow-test.md](workflow-test.md) |
| 技术设计 | PRD已确认，需要架构设计 | [workflow-dev-design.md](workflow-dev-design.md) |
| 需求变更 | 修改已有PRD、需求变更 | [workflow-change.md](workflow-change.md) |
| 组件库 | 创建/修改.swc组件 | [workflow-component.md](workflow-component.md) |
| 语法参考 | 生成/验证SW代码、语法错误 | [syntax.md](syntax.md) |
| Note编写 | 不确定note怎么写 | [note-guide.md](note-guide.md) |
| 颜色/间距/场景 | 不确定视觉标准 | [standards.md](standards.md) |

## Three Core Flows

**Flow 1: New Feature Development**
收集需求 → 澄清需求 → 用户确认需求 → 产出PRD(含线框图) → 用户确认PRD → 编写测试用例 → 开发设计 → 编写代码 → 代码审查 → 执行测试 → 测试报告

**Flow 2: Understand Existing Project**
分析前后端代码 → 理解业务逻辑和UI → 产出PRD(含线框图) → 用户确认理解

**Flow 3: Requirement Change**
澄清变更 → 影响分析 → 归档当前版本 → 修改PRD(Base+Delta) → 用户确认变更 → 更新下游产物

## Incremental Feature Flow

当新特性基于已有需求时：创建新需求文件夹，PRD中声明Base Requirement，Modified页面使用Base+Delta模式。详见 [workflow-prd.md](workflow-prd.md)。

## File Structure Convention

```
.solarwire/
├── [requirement-name]/
│   ├── solarwire-prd.md          # PRD文档（始终是最新版）
│   ├── test-cases.md             # 测试用例
│   ├── dev-design.md             # 开发设计
│   └── archive/                  # 历史版本归档
│       └── solarwire-prd-v1.0.md
```

## Version Management

- 需求变更：修改当前文件，旧版移入archive/（策略C：单文件+归档）
- 增量特性：新建需求文件夹，PRD中声明Base Requirement
- 所有PRD顶部含Changelog

## Red Lines

1. 绝不生成SVG（由editor应用处理）
2. 绝不使用幻觉属性（multiline, truncate, stroke, strokeWidth）
3. 边框颜色用b=，边框宽度用s=
4. 绝不跳过用户确认门控
5. 绝不在note中写视觉细节或技术实现
6. 绝不在用户未确认时添加i18n
7. note必须用三引号 `note="""..."""`，绝不使用 `note="..."` 或 `note='...'`
8. SolarWire代码块必须用 ` ```solarwire ` 开头和 ` ``` ` 结尾，绝不使用 `</solarwire>` 等HTML标签
9. 表格单元格和表格行绝不指定 @(x,y)、w、h
10. 圆形用 `("text")`，不用 `(("text"))`；圆角矩形用 `["text"] r=N`，不用 `("text")`

## Syntax Quick Reference

| 元素 | 语法 | 示例 |
|------|------|------|
| 矩形 | `["文本"] @(x,y)` | `["按钮"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| 圆角矩形 | `["文本"] @(x,y) r=N` | `["卡片"] @(50,100) w=300 h=200 r=8` |
| 圆形 | `("文本") @(x,y)` | `("头像") @(300,50) w=60` |
| 文本 | `"文本" @(x,y)` | `"标题" @(100,50) size=24 bold` |
| 多行文本 | `"""Line1\nLine2""" @(x,y)` | `"""第一行\n第二行""" @(100,50)` |
| 占位符 | `[?"文本"] @(x,y)` | `[?"图片"] @(200,200) w=150 h=100` |
| 图片 | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| 线条 | `-- "标签" -- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) c=#E5E7EB` |
| 表格 | `## @(x,y)` | `## @(50,50) w=500` |
| 表格行 | `  #` (缩进) | `  # bg=#F3F4F6` |

## Forbidden Attributes

| 幻觉属性 | 说明 |
|---------|------|
| `multiline` | 不存在此属性 |
| `truncate` | 不存在此属性 |
| `stroke` | 应使用 `b`（边框颜色） |
| `strokeWidth` | 应使用 `s`（边框宽度） |
| `(())` | 圆形应使用 `("text")` |
| `("text")`作圆角矩形 | 圆角矩形应使用 `["text"] r=N` |

## Base+Delta Change Markers

| 变更类型 | 边框色 | 背景色 | note前缀 | opacity |
|---------|--------|--------|----------|---------|
| NEW | `b=#22C55E` | `bg=#F0FDF4` | `[NEW]` | 1 |
| MODIFIED | `b=#F59E0B` | `bg=#FFFBEB` | `[MODIFIED]` + 变更说明 | 1 |
| REMOVED | `b=#EF4444` | `bg=#FEF2F2` | `[REMOVED]` + 原因 | 0.4 |
| UNCHANGED | 原样 | 原样 | 无标记 | 1 |

## Supporting Files

| 文件 | 内容 | 何时读取 |
|------|------|---------|
| [syntax.md](syntax.md) | 完整语法规则+属性参考 | 需要完整属性列表或校验规则时 |
| [note-guide.md](note-guide.md) | note编写指南 | 编写note时 |
| [standards.md](standards.md) | 颜色/间距/场景/模态框标准 | 需要视觉标准时 |
| [workflow-prd.md](workflow-prd.md) | PRD工作流+模板 | 创建PRD时 |
| [workflow-code-to-prd.md](workflow-code-to-prd.md) | 逆向工程工作流 | 从代码生成PRD时 |
| [workflow-test.md](workflow-test.md) | 测试用例工作流 | 生成测试用例时 |
| [workflow-dev-design.md](workflow-dev-design.md) | 开发设计工作流 | 技术设计时 |
| [workflow-change.md](workflow-change.md) | 需求变更工作流 | 修改PRD时 |
| [workflow-component.md](workflow-component.md) | 组件库工作流 | 管理组件库时 |
