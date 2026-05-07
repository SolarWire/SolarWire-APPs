---
name: "using-solarwire"
description: "Use at the start of any conversation involving SolarWire skills, PRD creation, or code-to-documentation workflows"
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If the user's task involves SolarWire in any way, you MUST invoke the relevant sub-skill before taking any action.

This is not negotiable. This is not optional.
</EXTREMELY-IMPORTANT>

## Overview

SolarWire技能包是一套AI化的软件开发工程工具集，覆盖从需求到代码的全流程。本技能是路由/发现机制，职责是告诉AI何时调用哪个子技能。

## Skill Routing Table

| 场景 | 触发条件 | 激活技能 |
|------|---------|---------|
| 生成或验证SolarWire代码 | 任何需要写solarwire代码时 | solarwire-syntax |
| 创建新PRD | 用户要创建新功能需求、新特性 | solarwire-prd |
| 逆向工程 | 用户要从代码生成PRD、理解项目 | solarwire-code-to-prd |
| 生成测试用例 | PRD确认后需要测试用例 | solarwire-prd-to-testcase |
| 开发设计 | PRD确认后需要技术设计 | solarwire-dev-design |
| 需求变更 | 用户要修改已有PRD | solarwire-requirement-change |
| 组件库 | 用户要创建/修改.swc组件 | solarwire-component-generator |

## Three Core Flows

### Flow 1: New Feature Development (正向工程)

```
收集需求 → 澄清需求 → 用户确认需求 → 产出PRD(含线框图) → 用户确认PRD
→ 编写测试用例 → 开发设计 → 编写代码 → 代码审查 → 执行测试 → 测试报告
```

激活技能顺序：solarwire-syntax → solarwire-prd → solarwire-prd-to-testcase → solarwire-dev-design

### Flow 2: Understand Existing Project (逆向工程)

```
分析前后端代码 → 理解业务逻辑和UI → 产出PRD(含线框图) → 用户确认理解
```

激活技能顺序：solarwire-syntax → solarwire-code-to-prd

### Flow 3: Requirement Change (需求变更)

```
澄清变更 → 影响分析 → 修改PRD(含线框图) → 用户确认变更
→ 更新测试用例 → 更新开发设计(如需要) → 更新代码 → 代码审查 → 执行测试 → 更新测试报告
```

激活技能顺序：solarwire-syntax → solarwire-requirement-change → (下游技能按需激活)

## Incremental Feature Flow

当新特性基于已有需求时：

- 创建新的需求文件夹（如 user-login-social-login/）
- PRD中声明 Base Requirement
- Modified页面使用Base+Delta模式
- 激活技能：solarwire-prd（增量模式）

## Skill Dependencies

```
solarwire-syntax (基础，无依赖)
├── solarwire-prd (依赖 syntax)
│   ├── solarwire-prd-to-testcase (依赖 syntax)
│   ├── solarwire-dev-design (依赖 prd)
│   └── solarwire-requirement-change (依赖 prd + syntax)
├── solarwire-code-to-prd (依赖 syntax + prd)
└── solarwire-component-generator (依赖 syntax)
```

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

- 需求变更：策略C（单文件+归档），修改当前文件，旧版移入archive/
- 增量特性：新建需求文件夹，PRD中声明Base Requirement
- 所有PRD顶部含Changelog

## Red Lines

- 绝不生成SVG（由editor应用处理）
- 绝不使用幻觉属性（multiline, truncate, stroke, strokeWidth）
- 边框颜色用b=，边框宽度用s=
- 绝不跳过用户确认门控
- 绝不在note中写视觉细节或技术实现
- 绝不在用户未确认时添加i18n
