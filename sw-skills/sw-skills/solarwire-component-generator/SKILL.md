---
name: "solarwire-component-generator"
description: "Use when creating reusable SolarWire components, managing component libraries, or modifying .swc files"
---

# SolarWire Component Generator

## Configuration

- **Output**: `.swc` files (Markdown-like format)

---

## Overview

This skill generates or modifies .swc format SolarWire component library files.

**Important**: This skill does not define SolarWire syntax rules. Refer to `solarwire-syntax` for syntax.

---

## When to Use

- Need to generate .swc component library files
- Need to create new components based on user requirements
- Need to modify existing component libraries (add, modify, delete components)
- Need to validate component code syntax before writing to .swc file
- Need to ensure component library structure conforms to specification

---

## .swc File Structure

```markdown
# 组件库名称
id: uuid
$schema: solarwire-component-library-v1
description: 描述
version: 1.0.0
author: 作者
createdAt: ISO 8601
updatedAt: ISO 8601

## 通用
id: cat-general
parentId: null

### 主按钮
id: btn-primary
name: 主按钮
description: 用于主要操作的高亮按钮
categoryId: cat-button
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-01T00:00:00.000Z

```solarwire
["按钮"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6
```
```

---

## Field Descriptions

**metadata (Required)** - Defined after `# 组件库名称` heading using key: value pairs:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID format |
| $schema | string | No | Schema identifier, default: `solarwire-component-library-v1` |
| name | string | Yes | Component library name (from `# ` heading) |
| description | string | No | Description |
| version | string | Yes | Semantic version (e.g., "1.0.0") |
| author | string | No | Author name |
| createdAt | string | Yes | ISO 8601 format |
| updatedAt | string | Yes | ISO 8601 format |

**categories (Required)** - Defined using `## 分类名称` heading with key: value pairs:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Format: `cat-` prefix + kebab-case |
| name | string | Yes | Display name (from `## ` heading) |
| parentId | string/null | Yes | Parent category id, null for top-level |

**components (Required)** - Defined using `### 组件名称` heading with key: value pairs:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | kebab-case format |
| name | string | Yes | Display name (from `### ` heading) |
| description | string | Yes | Component description |
| categoryId | string | Yes | Must reference valid category id |
| code | string | Yes | SolarWire syntax code (in ```solarwire code block) |

---

## Component Code Specifications

### Syntax Rules

- Component `code` field MUST follow `solarwire-syntax` rules
- Coordinates are relative to component top-left corner, base point `@(0,0)`
- Use absolute coordinates
- Avoid using image elements `<url>`

### Allowed Syntax Elements

| Element | Syntax | Example |
|---------|--------|---------|
| Rectangle | `["文本"]` | `["按钮"] @(0,0) w=120 h=40` |
| Rounded Rectangle | `["文本"] r=N` | `["卡片"] @(0,0) w=300 h=200 r=8` |
| Circle | `("文本")` | `("头像") @(0,0) w=60` |
| Multi-line Text | `"""___"""` | `"""第一行\n第二行""" @(0,0) w=200` |
| Plain Text | `"文本"` | `"标题" @(0,0) size=24 bold` |
| Placeholder | `[?"文本"]` | `[?"图片"] @(0,0) w=150 h=100` |
| Line | `--` | `-- @(0,100)->(400,100) b=#E5E7EB` |
| Table | `##` | `## @(0,0) w=500 border=1` |

### Avoid Using

| Element | Reason |
|---------|--------|
| Image `<url>` | Component libraries do not include image components |

### Attribute Reference

| Attribute | Description | Example |
|-----------|-------------|---------|
| `w` `h` | Width, Height | `w=120 h=40` |
| `bg` | Background color | `bg=#3B82F6` |
| `c` | Text color | `c=#FFFFFF` |
| `b` | Border color | `b=#E5E7EB` |
| `s` | Border width | `s=1` |
| `r` | Border radius | `r=6` |
| `size` | Font size | `size=16` |
| `bold` | Bold text | `bold` |
| `opacity` | Element opacity (0-1) | `opacity=0.5` |

**Important**: Do NOT use the following hallucinated attributes:
- `padding-top=N` - Top text padding (default: 8)
- `padding-right=N` - Right text padding (default: 8)
- `padding-bottom=N` - Bottom text padding (default: 8)
- `padding-left=N` - Left text padding (default: 8)
- ~~`multiline`~~ - Not a valid SolarWire attribute
- ~~`truncate`~~ - Not a valid SolarWire attribute
- ~~`stroke`~~ - Use `b=` for border color instead
- ~~`strokeWidth`~~ - Use `s=` for border width instead

---

## Component Code Validation

After generating or modifying a component, validate the `code` field:

1. Extract the component's code field content
2. Save to a temporary file (e.g., `temp-code.txt`)
3. Run the validation script:

```bash
node validate.js temp-code.txt --no-svg
```

4. Check exit code: 0 = pass, 1 = fail
5. Delete temporary file after validation

---

## New Component Library Workflow

### Step 1: Determine Component Library Information

- Name, description
- Generate UUID
- Set version "1.0.0"
- Record createdAt and updatedAt

### Step 2: Define Category Structure

Based on component types, define categories with hierarchy and sort order.

### Step 3: Generate Components

1. Understand user requirements, determine component visual structure
2. Write SolarWire code following `solarwire-syntax` rules
3. Validate code using validate.js
4. Set component id, name, description, categoryId

### Step 4: Assemble Complete Structure

1. Combine metadata, categories, components
2. Verify all component categoryId references valid categories
3. Verify Markdown-like format is correct

### Step 5: Output File

- Save with `.swc` suffix (not `.swc.json`)
- Markdown-like format with key: value pairs and solarwire code blocks

---

## Modify Existing Component Library Workflow

### Step 1: Read Existing File

1. Read existing .swc file
2. Parse Markdown-like structure
3. Understand current categories and components

### Step 2: Understand Modification Requirements

Identify the type of modification:
- Add new component
- Modify existing component
- Delete component
- Add/modify category

### Step 3: Execute Modification

1. For new components: Generate code, validate, add as `### ` section
2. For modified components: Update code, validate, update in component section
3. For deleted components: Remove the `### ` section
4. For category changes: Update `## ` section, verify references

### Step 4: Update Metadata

- Increment version number
- Update updatedAt timestamp

### Step 5: Output Updated File

- Save with `.swc` suffix
- Markdown-like format with key: value pairs and solarwire code blocks

---

## Category Suggestions

### Standard Categories

```markdown
## 通用
id: cat-general
parentId: null

## 按钮
id: cat-button
parentId: cat-general

## 输入框
id: cat-input
parentId: cat-general

## 容器
id: cat-container
parentId: cat-general

## 文本
id: cat-text
parentId: cat-general

## 导航
id: cat-navigation
parentId: cat-general

## 反馈
id: cat-feedback
parentId: cat-general

## 数据展示
id: cat-data-display
parentId: cat-general

## 表单
id: cat-form
parentId: cat-general

## 布局
id: cat-layout
parentId: cat-general
```

### Common Component Library Types

**UI Component Library**: Buttons, inputs, selectors, cards, layouts, feedback, navigation
**Business Component Library**: Forms, lists, details, statistics

---

## Component Examples

### Primary Button

```markdown
### 主按钮
id: btn-primary
name: 主按钮
description: 用于主要操作的高亮按钮
categoryId: cat-button

```solarwire
["按钮"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6
```
```

### Secondary Button

```markdown
### 次按钮
id: btn-secondary
name: 次按钮
description: 用于次要操作的边框按钮
categoryId: cat-button

```solarwire
["按钮"] @(0,0) w=120 h=40 bg=#FFFFFF c=#111827 b=#E5E7EB s=1 r=6
```
```

### Danger Button

```markdown
### 危险按钮
id: btn-danger
name: 危险按钮
description: 用于危险操作（如删除）的红色按钮
categoryId: cat-button

```solarwire
["按钮"] @(0,0) w=120 h=40 bg=#EF4444 c=#FFFFFF r=6
```
```

### Default Input

```markdown
### 默认输入框
id: input-default
name: 默认输入框
description: 单行文本输入框
categoryId: cat-input

```solarwire
["请输入..."] @(0,0) w=200 h=40 bg=#FFFFFF b=#D1D5DB s=1 r=6
```
```

### Search Input

```markdown
### 搜索输入框
id: input-search
name: 搜索输入框
description: 带搜索图标的输入框
categoryId: cat-input

```solarwire
["搜索..."] @(0,0) w=240 h=40 bg=#FFFFFF b=#E5E7EB s=1 r=6
```
```

### Default Card

```markdown
### 默认卡片
id: card-default
name: 默认卡片
description: 圆角容器，用于包裹相关内容区块
categoryId: cat-container

```solarwire
["卡片标题"] @(0,0) w=300 h=200 r=8 bg=#FFFFFF b=#E5E7EB s=1
```
```

### Avatar

```markdown
### 默认头像
id: avatar-default
name: 默认头像
description: 圆形头像占位
categoryId: cat-data-display

```solarwire
("A") @(0,0) w=40 bg=#E5E7EB c=#6B7280
```
```

### Tag/Badge

```markdown
### 默认标签
id: tag-default
name: 默认标签
description: 用于状态或分类的标签
categoryId: cat-data-display

```solarwire
["标签"] @(0,0) w=60 h=24 bg=#EFF6FF c=#3B82F6 r=4
```
```

### Divider

```markdown
### 分割线
id: divider-default
name: 分割线
description: 水平分割线
categoryId: cat-layout

```solarwire
-- @(0,0)->(300,0) b=#E5E7EB s=1
```
```

### Checkbox

```markdown
### 复选框
id: checkbox-default
name: 复选框
description: 带标签的复选框
categoryId: cat-form

```solarwire
[""] @(0,0) w=16 h=16 bg=#FFFFFF b=#D1D5DB s=1 r=2
```
```

---

## Naming Conventions

| Item | Format | Example |
|------|--------|---------|
| Component id | kebab-case | `btn-primary`, `input-search` |
| Category id | `cat-` prefix + kebab-case | `cat-button`, `cat-input` |
| Component name | Clear Chinese or English name | 主按钮, 默认输入框 |
| Category name | Concise Chinese name | 按钮, 输入框, 容器 |

---

## Component Library Validation

Validate the entire .swc file:

1. **Required Field Check** - All required fields in metadata, categories, components
2. **Uniqueness Check** - All category ids unique, all component ids unique
3. **Referential Integrity** - All component categoryId found in categories
4. **Format Check** - Markdown-like format correct, timestamps in ISO 8601
5. **Code Validation** - Each component's code field passes validate.js

---

## Common Mistakes

| Mistake | Reason | Solution |
|---------|--------|----------|
| Using .swc.json suffix | Wrong file extension | Use `.swc` suffix |
| Component code using simplified syntax | Syntax error | Use solarwire-syntax PRD syntax |
| Missing description field | Component lacks description | Every component must have description |
| Missing categoryId field | Component not linked to category | Every component must have categoryId |
| Using image element | Component libraries don't include images | Use placeholder `[?"图片"]` instead |
| Component code not validated | Syntax may be incorrect | Use validate.js to validate |
| Using `stroke=` attribute | Deprecated attribute | Use `b=` for border color |
| Using `strokeWidth=` attribute | Deprecated attribute | Use `s=` for border width |
| Using `stroke` or `strokeWidth` | Deprecated attributes | Use `b=` for border color, `s=` for border width |
| Using `multiline` attribute | Hallucinated attribute | Remove, not a valid SolarWire attribute |
| Using `truncate` attribute | Hallucinated attribute | Remove, not a valid SolarWire attribute |
| Using `(())` for circle | Deprecated syntax | Use `("text")` for circle |
| Using `("text")` for rounded rectangle | Wrong element type | Use `["text"] r=N` for rounded rectangle |
| thumbnail field exists | Thumbnail not needed | Remove thumbnail field |

---

## Dependencies

```
REQUIRED SUB-SKILL: solarwire-syntax
```
