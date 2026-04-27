---
name: solarwire-code-to-prd
description: Use when converting existing frontend code (HTML/JSX/Vue) into PRD documents with SolarWire wireframes
---

# SolarWire 代码转 PRD (solarwire-code-to-prd)

## Overview

将已有前端代码（HTML/JSX/Vue）反向工程为包含 SolarWire 线框图的 PRD 文档。

**重要：** 语法规则由 `solarwire: solarwire-syntax` 定义，不在本技能中重复。

## When to Use

**症状和使用场景：**
- 需要将已有代码文档化为 PRD
- 需要为遗留系统生成可视化文档
- 需要代码评审前的结构分析
- 需要前后端对齐的可视化参考

**反模式（不应使用本技能）：**
- 从零开始设计 → 使用 `solarwire: solarwire-prd`
- 仅需语法规则 → 使用 `solarwire: solarwire-syntax`

## Workflow

### Step 1: 分析代码结构
- 识别页面组件层级
- 提取布局结构（Flex/Grid/绝对定位）
- 识别交互元素（按钮、表单、链接）

### Step 2: 转换为 SolarWire
- 按照 `solarwire: solarwire-syntax` 的规则转换
- 保持原有布局比例和层级关系

### Step 3: 生成 PRD
- 使用 `solarwire: solarwire-prd` 的模板
- 补充字段说明和交互逻辑

### Step 4: 验证
- 调用 `solarwire: solarwire-syntax` 验证语法
- 对比原始代码确保功能完整

## Reference Files

| 文件 | 内容 |
|------|------|
| `EXAMPLES.md` | 代码转换示例 |

## Red Flags

| Thought | Reality |
|---------|---------|
| "直接复制 HTML 结构就行" | 需要理解业务逻辑，不只是视觉结构 |
| "代码转 PRD 不需要验证语法" | 产生的 SolarWire 代码必须验证 |