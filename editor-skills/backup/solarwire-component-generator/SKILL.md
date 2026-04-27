---
name: solarwire-component-generator
description: Use when generating or modifying .swc component library files, when creating reusable SolarWire components, or when AI needs to produce valid component JSON with correct SolarWire syntax
---

# SolarWire 组件库生成 (solarwire-component-generator)

## Overview

根据用户需求生成或修改 .swc 格式的 SolarWire 组件库文件。

**重要：** 本技能不定义 SolarWire 语法规则，语法请参考 `solarwire-basic`。

## When to Use

**症状和使用场景：**
- 需要生成 .swc 组件库文件
- 需要根据用户需求创建新组件
- 需要修改现有组件库（新增、修改、删除组件）
- 需要将组件代码写入 .swc 文件前验证语法
- 需要确保组件库结构符合规范
- AI 生成的组件代码需要验证可渲染性

## Quick Reference

### .swc 文件结构

```json
{
  "$schema": "solarwire-component-library-v1",
  "metadata": {
    "id": "uuid",
    "name": "组件库名称",
    "description": "描述（可选）",
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

### 字段说明

**metadata（必填）：** id (UUID), name, version, createdAt, updatedAt
**categories（必填）：** id, name, parentId, order
**components（必填）：** id, name, description, categoryId, code

### 语法规则引用

**REQUIRED SKILL:** 使用 `solarwire-basic` 获取 SolarWire 语法规则

- 组件的 `code` 字段必须遵循 solarwire-basic 定义的语法
- 生成组件代码后，必须使用 solarwire-basic 的 validate.js 验证

## Core Pattern

### 组件代码校验流程

生成或修改组件后，必须验证 `code` 字段：

1. 提取组件的 code 字段内容
2. 保存到临时文件（如 `temp-code.txt`）
3. 运行校验脚本：

```bash
cd ../solarwire-basic
node validate.js temp-code.txt --no-svg
```

4. 检查退出码：0 = 通过, 1 = 失败
5. 验证通过后删除临时文件

### 组件代码规范

**允许的语法元素：**
- 矩形 `["文本"]`、圆角矩形 `("文本")`、圆形 `(("文本"))`
- 纯文本 `"文本"`、占位符 `[?"文本"]`
- 线条 `--`、表格 `##` 和表格行 `#`

**避免使用的语法元素：**
- 图片 `<url>` - 组件库不包含图片组件

**坐标系统：**
- 组件内坐标相对于组件左上角
- 组件基准点通常为 `@(0,0)`
- 使用绝对坐标 `@(x,y)`

## Implementation

### 新建组件库流程

1. **确定组件库信息**
   - 名称、描述、生成 UUID、设置版本 "1.0.0"
   - 记录创建时间和更新时间

2. **定义分类结构**
   - 根据组件类型定义分类
   - 设置层级关系（parentId）和排序（order）

3. **生成组件**
   - 理解用户需求，确定组件视觉结构
   - 编写符合 solarwire-basic 语法的 SolarWire 代码
   - 使用 solarwire-basic 的 validate.js 验证代码
   - 设置组件的 id、name、description、categoryId

4. **组装完整结构**
   - 组合 metadata、categories、components
   - 验证所有组件的 categoryId 对应有效分类
   - 验证 JSON 格式正确

5. **输出文件**
   - 保存为 `.swc` 后缀（不是 `.swc.json`）
   - JSON 格式化（缩进 2 空格）

### 修改现有组件库流程

1. 读取现有 .swc 文件，理解结构
2. 理解修改需求（新增/修改/删除组件）
3. 执行修改，验证新增/修改的组件代码
4. 更新 updatedAt 时间
5. 输出更新后的 .swc 文件

### 组件示例

**主按钮：**
```json
{
  "id": "btn-primary",
  "name": "主按钮",
  "description": "用于主要操作的高亮按钮",
  "categoryId": "cat-button",
  "code": "[\"按钮\"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6"
}
```

**输入框：**
```json
{
  "id": "input-default",
  "name": "默认输入框",
  "description": "单行文本输入框",
  "categoryId": "cat-input",
  "code": "[\"请输入...\"] @(0,0) w=200 h=40 bg=#FFFFFF stroke=#D1D5DB r=6"
}
```

**卡片容器：**
```json
{
  "id": "card-default",
  "name": "默认卡片",
  "description": "圆角容器，用于包裹相关内容区块",
  "categoryId": "cat-container",
  "code": "(\"卡片标题\") @(0,0) w=300 h=200 r=8 bg=#FFFFFF stroke=#E5E7EB"
}
```

### 常见组件库类型

**UI 组件库：** 按钮、输入框、选择器、卡片、布局、反馈、导航
**业务组件库：** 表单、列表、详情、统计

### 分类建议

```json
"categories": [
  { "id": "cat-general", "name": "通用", "parentId": null, "order": 1 },
  { "id": "cat-button", "name": "按钮", "parentId": "cat-general", "order": 2 },
  { "id": "cat-input", "name": "输入框", "parentId": "cat-general", "order": 3 },
  { "id": "cat-container", "name": "容器", "parentId": "cat-general", "order": 4 },
  { "id": "cat-text", "name": "文本", "parentId": "cat-general", "order": 5 }
]
```

## Common Mistakes

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 使用 .swc.json 后缀 | 文件后缀错误 | 使用 `.swc` 后缀 |
| 组件代码使用简化语法 | 语法错误 | 使用 solarwire-basic 的 PRD 语法 |
| 缺少 description 字段 | 组件缺少描述 | 每个组件必须有 description |
| 缺少 categoryId 字段 | 组件未关联分类 | 每个组件必须有 categoryId |
| 使用 image 元素 | 组件库不包含图片 | 使用占位符 `[?"图片"]` 代替 |
| 组件代码未验证 | 语法可能错误 | 使用 validate.js 验证 |
| thumbnail 字段存在 | 不需要缩略图 | 移除 thumbnail 字段 |

## Component Library Validation

验证整个 .swc 文件：

1. **必填字段检查** - metadata、categories、components 的所有必填字段
2. **唯一性检查** - 所有分类 id 唯一，所有组件 id 唯一
3. **引用完整性** - 所有组件的 categoryId 都能在 categories 中找到
4. **格式检查** - JSON 格式正确，时间格式为 ISO 8601

## Naming Conventions

- **组件 id：** kebab-case，如 `btn-primary`、`input-default`
- **分类 id：** `cat-` 前缀 + kebab-case，如 `cat-button`
- **组件 name：** 中文或英文，清晰描述用途
- **分类 name：** 简洁的中文名称

## Real-World Impact

通过规范的组件库生成流程：
- 确保 .swc 文件结构 100% 符合规范
- 所有组件代码可正确渲染
- 避免常见语法和结构错误
- 支持组件库的新建和修改操作
