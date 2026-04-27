---
name: solarwire-prd-to-testcase
description: Use when generating test case Excel files from completed SolarWire PRD documents
---

# SolarWire PRD 转测试用例 (solarwire-prd-to-testcase)

## Overview

从已完成的 SolarWire PRD 文档生成测试用例 Excel 文件，包含测试场景、步骤、预期结果。

**重要：** 本技能依赖 `solarwire-prd` 的输出，不独立使用。

## When to Use

**症状和使用场景：**
- PRD 已完成，需要生成测试用例
- 需要创建功能测试覆盖矩阵
- 需要为 QA 团队提供结构化测试文档
- 需要追踪需求到测试的覆盖情况

**反模式（不应使用本技能）：**
- PRD 还未完成 → 先使用 `solarwire: solarwire-prd`
- 需要编写 PRD 的测试策略章节 → 在 `solarwire-prd` 中完成

## Workflow

### Step 1: 读取 PRD
- 解析 PRD 文档结构
- 提取所有页面、字段、交互逻辑

### Step 2: 生成测试用例
- 每个页面生成基础功能测试
- 每个字段生成校验测试
- 每个交互生成流程测试

### Step 3: 输出 Excel
- 使用 `lib/generate-excel.js` 生成 Excel 文件
- 测试用例包含：用例编号、模块、场景、步骤、预期结果

## Excel 格式

| 列 | 说明 |
|---|------|
| 用例编号 | TC-001, TC-002... |
| 所属模块 | 页面或功能模块名称 |
| 测试场景 | 场景描述 |
| 前置条件 | 执行测试的前提条件 |
| 测试步骤 | 步骤 1 → 步骤 2 → 步骤 3 |
| 预期结果 | 期望的系统响应 |
| 优先级 | P0/P1/P2 |

## Red Flags

| Thought | Reality |
|---------|---------|
| "测试用例可以后期再补" | PRD 完成后必须立即生成，保证需求可追踪 |
| "简单的功能不需要测试用例" | 所有功能都必须有测试覆盖 |
| "Excel 格式可以随便定" | 必须遵循标准格式：用例编号、模块、场景、步骤、预期结果、优先级 |