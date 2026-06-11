# Workflow: Generate SolarWireComponent Library

## Prerequisites

Load core rule files (syntax.md, note-guide.md, standards.md) as specified in SKILL.md before starting. Do not rely solely on summaries in this file.

**Special Note for Component Libraries**: If a component requires a note to describe interactive behavior (e.g., a dropdown menu, a tooltip trigger), you must strictly follow `note-guide.md`. Do not include API endpoints, database field names, or implementation details in component notes.

---

# SolarWire Component Generator

## Configuration

- **Output**: `.swc` files (Markdown-like format)

---

## Overview

This skill generates or modifies .swc format SolarWire component library files.

**Important**: This skill does not define SolarWire syntax rules. Refer to `syntax.md` for syntax.

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
# Component Library Name
id: uuid
$schema: solarwire-component-library-v1
description: Description
version: 1.0.0
author: Author
createdAt: ISO 8601
updatedAt: ISO 8601

## General
id: cat-general
parentId: null

### Primary Button
id: btn-primary
name: Primary Button
description: Highlighted button for primary actions
categoryId: cat-button
createdAt: 2024-01-01T00:00:00.000Z
updatedAt: 2024-01-01T00:00:00.000Z

```solarwire
["Button"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6
```
```

---

## Field Descriptions

**metadata (Required)** - Defined after `# Component Library Name` heading using key: value pairs:
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

**categories (Required)** - Defined using `## Category Name` heading with key: value pairs:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Format: `cat-` prefix + kebab-case |
| name | string | Yes | Display name (from `## ` heading) |
| parentId | string/null | Yes | Parent category id, null for top-level |

**components (Required)** - Defined using `### Component Name` heading with key: value pairs:
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

- Component `code` field MUST follow `syntax.md` rules
- Coordinates are relative to component top-left corner, base point `@(0,0)`
- Use absolute coordinates
- Avoid using image elements `<url>`
- Pure text MUST use text element `"text"`, NOT rectangle `["text"]`
- Rectangle text alignment: `vertical-align=m` always; `align=l` for input/display, `align=c` for buttons
- When generating component code, you must validate it using `node sw-skills/solarwire/validate-sw.js <path>` after creation or modification.

### Avoid Using

| Element | Reason |
|---------|--------|
| Image `<url>` | Component libraries do not include image components |

For all attribute rules and forbidden attributes, refer to [syntax.md](syntax.md).

---

## Component Code Validation

After generating or modifying a component, validate the `code` field:

1. Extract the component's code field content
2. Save to a temporary file (e.g., `temp-code.txt`)
3. Run the validation script:

```bash
node sw-skills/solarwire/validate-sw.js temp-code.txt
```

4. Check exit code: 0 = pass, 1 = fail
5. If failed, fix SolarWire syntax errors and re-validate
6. Delete temporary file after validation

**For .swc files, validate the entire file:**

```bash
node sw-skills/solarwire/validate-sw.js path/to/component-library.swc
```

For common validation fixes, see workflow-prd.md Check 5.

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
2. Write SolarWire code following `syntax.md` rules
3. Validate code using `node sw-skills/solarwire/validate-sw.js <file>`
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
## General
id: cat-general
parentId: null

## Buttons
id: cat-button
parentId: cat-general

## Inputs
id: cat-input
parentId: cat-general

## Containers
id: cat-container
parentId: cat-general

## Text
id: cat-text
parentId: cat-general

## Navigation
id: cat-navigation
parentId: cat-general

## Feedback
id: cat-feedback
parentId: cat-general

## Data Display
id: cat-data-display
parentId: cat-general

## Forms
id: cat-form
parentId: cat-general

## Layout
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
### Primary Button
id: btn-primary
name: Primary Button
description: Highlighted button for primary actions
categoryId: cat-button

```solarwire
["Button"] @(0,0) w=120 h=40 bg=#3B82F6 c=#FFFFFF r=6
```
```

### Secondary Button

```markdown
### Secondary Button
id: btn-secondary
name: Secondary Button
description: Bordered button for secondary actions
categoryId: cat-button

```solarwire
["Button"] @(0,0) w=120 h=40 bg=#FFFFFF c=#111827 b=#E5E7EB s=1 r=6
```
```

### Danger Button

```markdown
### Danger Button
id: btn-danger
name: Danger Button
description: Red button for dangerous actions (e.g., delete)
categoryId: cat-button

```solarwire
["Button"] @(0,0) w=120 h=40 bg=#EF4444 c=#FFFFFF r=6
```
```

### Default Input

```markdown
### Default Input
id: input-default
name: Default Input
description: Single-line text input
categoryId: cat-input

```solarwire
["Enter..."] @(0,0) w=200 h=40 bg=#FFFFFF b=#D1D5DB s=1 r=6
```
```

### Search Input

```markdown
### Search Input
id: input-search
name: Search Input
description: Input with search icon
categoryId: cat-input

```solarwire
["Search..."] @(0,0) w=240 h=40 bg=#FFFFFF b=#E5E7EB s=1 r=6
```
```

### Default Card

```markdown
### Default Card
id: card-default
name: Default Card
description: Rounded container for wrapping related content blocks
categoryId: cat-container

```solarwire
["Card Title"] @(0,0) w=300 h=200 r=8 bg=#FFFFFF b=#E5E7EB s=1
```
```

### Avatar

```markdown
### Default Avatar
id: avatar-default
name: Default Avatar
description: Circular avatar placeholder
categoryId: cat-data-display

```solarwire
("A") @(0,0) w=40 bg=#E5E7EB c=#6B7280
```
```

### Tag/Badge

```markdown
### Default Tag
id: tag-default
name: Default Tag
description: Tag for status or classification
categoryId: cat-data-display

```solarwire
["Tag"] @(0,0) w=60 h=24 bg=#EFF6FF c=#3B82F6 r=4
```
```

### Divider

```markdown
### Divider
id: divider-default
name: Divider
description: Horizontal divider
categoryId: cat-layout

```solarwire
!title="Divider Component"
!c=#111827
!size=13
!bg=#F9FAFB

[] @(0,0) w=300 h=20 bg=#FFFFFF b=#FFFFFF
[] @(0,10) w=300 h=1 bg=#E5E7EB note="""Horizontal divider line
1. Appearance
   - Always displayed as a 1px solid line"""
```
```

### Checkbox

```markdown
### Checkbox
id: checkbox-default
name: Checkbox
description: Checkbox with label
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
| Component name | Clear name | Primary Button, Default Input |
| Category name | Concise name | Buttons, Inputs, Containers |

---

## Component Library Validation

Validate the entire .swc file:

1. **Required Field Check** - All required fields in metadata, categories, components
2. **Uniqueness Check** - All category ids unique, all component ids unique
3. **Referential Integrity** - All component categoryId found in categories
4. **Format Check** - Markdown-like format correct, timestamps in ISO 8601
5. **Code Validation** - Each component's code field passes `node sw-skills/solarwire/validate-sw.js`

---

## Common Mistakes

| Mistake | Reason | Solution |
|---------|--------|----------|
| Using .swc.json suffix | Wrong file extension | Use `.swc` suffix |
| Missing description field | Component lacks description | Every component must have description |
| Missing categoryId field | Component not linked to category | Every component must have categoryId |
| Using image element | Component libraries don't include images | Use placeholder `[?"Image"]` instead |
| Component code not validated | Syntax may be incorrect | Use `node sw-skills/solarwire/validate-sw.js` to validate |
| thumbnail field exists | Thumbnail not needed | Remove thumbnail field |

For SolarWire syntax mistakes (stroke, multiline, circle syntax, etc.), see [syntax.md](syntax.md) Common Mistakes section.

---

## Important Reminders

1. **Component Code Must Be Validated** - Always run `node sw-skills/solarwire/validate-sw.js` after generating or modifying component code
2. **No Image Elements** - Component libraries do not include image components; use placeholder `[?"Image"]` instead
3. **Component Notes Follow note-guide.md** - If a component includes a note, it must adhere to `note-guide.md`, especially the forbidden content rules.

> For common rules (document language, forbidden attributes, etc.), follow SKILL.md Red Lines and syntax.md.