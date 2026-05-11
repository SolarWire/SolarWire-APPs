## Inlined Syntax Rules (CRITICAL)

- note must use triple quotes: `note="""..."""`, never use `note="..."` or `note='...'`
- SolarWire code blocks use ` ```solarwire ` to open, ` ``` ` to close
- Border color uses `b=`, border width uses `s=`
- Circle uses `("text")`, rounded rectangle uses `["text"] r=N`
- Table cells and rows cannot specify @(x,y), w, h
- Table cell content should use `["text"]` (rectangle) instead of `"text"` — rectangles support more text formatting (bold, italic, size, color, alignment, etc.)
- Hallucinated attributes forbidden: multiline, truncate, stroke, strokeWidth
- All elements must have coordinates @(x,y)
- Plain text must use text element `"text"`, NOT rectangle `["text"]` to wrap plain text
- Rectangle element text must have `vertical-align=m` (vertically centered), `align=l` (horizontally left-aligned)
- After generating component code must run `node sw-skills/solarwire/validate-sw.js <path>` validation, fix syntax and re-validate if failed
- See [syntax.md](syntax.md) for complete syntax reference
- See [note-guide.md](note-guide.md) for note writing rules
- See [standards.md](standards.md) for color/spacing/scenario standards

## Inlined Note Writing Rules (CRITICAL)

- Note first line: functional description (e.g., "Login button"), NOT element type (e.g., "[Primary Button]")
- Note structure: First line = element definition; First level = numbered (1. 2. 3.); Second level = dash (-); Third level = double dash (--)
- EARS description style: Use condition-action patterns
  - Always [behavior] - for always-true behaviors
  - When [event], [behavior] - for event-triggered behaviors
  - While [condition], [behavior] - for state-dependent behaviors
  - If [condition], [behavior] - for exception/boundary handling
- Avoid bare enumerations (BAD: "Status: 1=Active"; GOOD: "While status is Active, show green tag 'Active'")
- Error messages MUST be quoted exactly as user sees them
- Forbidden in notes: visual details, technical implementation, API endpoints, CSS properties
- For modified elements: note must describe before→after change
- See [note-guide.md](note-guide.md) for complete note writing reference

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

- Component `code` field MUST follow `solarwire-syntax` rules
- Coordinates are relative to component top-left corner, base point `@(0,0)`
- Use absolute coordinates
- Avoid using image elements `<url>`
- Pure text MUST use text element `"text"`, NOT rectangle `["text"]`
- Rectangle elements MUST have `vertical-align=m` (vertically centered) and `align=l` (horizontally left-aligned)

### Allowed Syntax Elements

| Element | Syntax | Example |
|---------|--------|---------|
| Rectangle | `["Text"]` | `["Button"] @(0,0) w=120 h=40` |
| Rounded Rectangle | `["Text"] r=N` | `["Card"] @(0,0) w=300 h=200 r=8` |
| Circle | `("Text")` | `("Avatar") @(0,0) w=60` |
| Multi-line Text | `"""___"""` | `"""Line 1\nLine 2""" @(0,0) w=200` |
| Plain Text | `"Text"` | `"Title" @(0,0) size=24 bold` |
| Placeholder | `[?"Text"]` | `[?"Image"] @(0,0) w=150 h=100` |
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
- ~~`multiline`~~ - Not a valid SolarWire attribute
- ~~`truncate`~~ - Not a valid SolarWire attribute
- ~~`stroke`~~ - Use `b=` for border color instead
- ~~`strokeWidth`~~ - Use `s=` for border width instead

**Note**: `padding-top`, `padding-right`, `padding-bottom`, `padding-left` are valid attributes (default: 8). Only use them when you need to override the default padding.

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

**Common validation fixes:**
- `note="..."` → `note="""..."""` (triple quotes)
- `stroke`/`strokeWidth` → `b=`/`s=`
- `(("text"))` → `("text")` (circle)
- `("text")` as rounded rect → `["text"] r=N`
- Pure text in `["text"]` → `"text"`
- Rectangle without `vertical-align=m` → add `vertical-align=m`

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
-- @(0,0)->(300,0) b=#E5E7EB s=1
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
| Component code using simplified syntax | Syntax error | Use solarwire-syntax PRD syntax |
| Missing description field | Component lacks description | Every component must have description |
| Missing categoryId field | Component not linked to category | Every component must have categoryId |
| Using image element | Component libraries don't include images | Use placeholder `[?"Image"]` instead |
| Component code not validated | Syntax may be incorrect | Use `node sw-skills/solarwire/validate-sw.js` to validate |
| Using `stroke` or `strokeWidth` | Deprecated attributes | Use `b=` for border color, `s=` for border width |
| Using `multiline` attribute | Hallucinated attribute | Remove, not a valid SolarWire attribute |
| Using `truncate` attribute | Hallucinated attribute | Remove, not a valid SolarWire attribute |
| Using `(())` for circle | Deprecated syntax | Use `("text")` for circle |
| Using `("text")` for rounded rectangle | Wrong element type | Use `["text"] r=N` for rounded rectangle |
| thumbnail field exists | Thumbnail not needed | Remove thumbnail field |

---

## Important Reminders

1. **Component Code Must Be Validated** - Always run `node sw-skills/solarwire/validate-sw.js` after generating or modifying component code
2. **No Image Elements** - Component libraries do not include image components; use placeholder `[?"Image"]` instead
3. **No Hallucinated Attributes** - Never use `multiline`, `truncate`, `stroke`, or `strokeWidth`
4. **Document Language** - Write documents in the user's communication language. If unsure, ask the user.
