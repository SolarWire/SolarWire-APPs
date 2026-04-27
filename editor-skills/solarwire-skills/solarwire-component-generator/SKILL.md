---
name: solarwire-component-generator
description: Use when generating or modifying .swc component library files, or when creating reusable SolarWire components
---

# SolarWire 组件库生成 (solarwire-component-generator)

## Overview

根据用户需求生成或修改 .swc 格式的 SolarWire 组件库文件。

**重要：** 语法规则由 `solarwire: solarwire-syntax` 定义，组件验证使用该技能的 validate.js。

## When to Use

**症状和使用场景：**
- 需要生成 .swc 组件库文件
- 需要创建可复用的 UI 组件
- 需要维护组件库（新增/修改/删除）
- 需要确保组件代码符合 SolarWire 语法

**反模式（不应使用本技能）：**
- 仅需编写 SolarWire 代码 → 使用 `solarwire: solarwire-syntax`
- 需要生成 PRD → 使用 `solarwire: solarwire-prd`

## .swc 文件结构

```json
{
  "$schema": "solarwire-component-library-v1",
  "metadata": {
    "id": "uuid",
    "name": "组件库名称",
    "description": "描述",
    "version": "1.0.0",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  },
  "categories": [
    { "id": "cat-general", "name": "通用", "parentId": null, "order": 1 }
  ],
  "components": [
    {
      "id": "btn-primary",
      "name": "主按钮",
      "description": "用于主要操作的高亮按钮",
      "categoryId": "cat-button",
      "code": "[\"按钮\"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6"
    }
  ]
}
```

## Workflow

### 新建组件库
1. 确定组件库信息（名称、UUID、版本）
2. 定义分类结构
3. 使用 `solarwire: solarwire-syntax` 编写组件代码
4. 调用 validate.js 验证每个组件
5. 组装完整 JSON 结构
6. 保存为 `.swc` 后缀

### 修改现有组件库
1. 读取现有 .swc 文件
2. 执行修改（新增/修改/删除）
3. 验证新增/修改的组件代码
4. 更新 updatedAt 时间
5. 输出更新后的文件

## Naming Conventions

| 字段 | 规范 | 示例 |
|------|------|------|
| 组件 id | kebab-case | `btn-primary` |
| 分类 id | `cat-` 前缀 | `cat-button` |
| 组件 name | 清晰描述 | `主按钮` |
| 分类 name | 简洁中文 | `按钮` |

## Common Mistakes

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 使用 `.swc.json` 后缀 | 文件后缀错误 | 使用 `.swc` |
| 组件代码未验证 | 语法可能错误 | 使用 validate.js 验证 |
| 缺少 description | 组件缺少描述 | 每个组件必须有 description |
| 缺少 categoryId | 组件未关联分类 | 每个组件必须有 categoryId |

## Red Flags

| Thought | Reality |
|---------|---------|
| "组件代码很简单，不需要验证" | 必须用 validate.js 确保语法正确 |
| "分类结构后面再补" | 组件和分类必须同时完成 |
| "组件库名称可以用中文" | name 可以用中文，但 id 必须用 kebab-case 英文 |