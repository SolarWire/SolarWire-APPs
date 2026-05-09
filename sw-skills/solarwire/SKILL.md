---
name: "solarwire"
description: "Use for any SolarWire task including PRD creation, code-to-PRD reverse engineering, test case generation, dev design, requirement changes, or wireframe syntax validation"
---

# SolarWire

SolarWire is an AI-powered software development engineering toolkit that covers the full workflow from requirements to code. All deliverables are in .md format; wireframes use SolarWire code blocks, which can be viewed and fine-tuned by the editor application.

## Intent Router

| User Intent | Trigger Condition | Load File |
|---------|---------|---------|
| Create new PRD/Feature | User wants to write PRD, create requirements, new feature | [workflow-prd.md](workflow-prd.md) |
| Generate PRD from code | User provides code/project, understand existing project | [workflow-code-to-prd.md](workflow-code-to-prd.md) |
| Generate test cases | PRD exists, needs test cases | [workflow-test.md](workflow-test.md) |
| Technical design | PRD confirmed, needs architecture design | [workflow-dev-design.md](workflow-dev-design.md) |
| Requirement change | Modify existing PRD, requirement changes | [workflow-change.md](workflow-change.md) |
| Component library | Create/modify .swc components | [workflow-component.md](workflow-component.md) |
| Syntax reference | Generate/validate SW code, syntax errors | [syntax.md](syntax.md) |
| Note writing | Unsure how to write notes | [note-guide.md](note-guide.md) |
| Color/Spacing/Scene | Unsure about visual standards | [standards.md](standards.md) |

## Three Core Flows

**Flow 1: New Feature Development**
Gather requirements → Clarify requirements → User confirms requirements → Produce PRD (with wireframes) → User confirms PRD → Write test cases → Dev design → Write code → Code review → Execute tests → Test report

**Flow 2: Understand Existing Project**
Analyze frontend/backend code → Understand business logic and UI → Produce PRD (with wireframes) → User confirms understanding

**Flow 3: Requirement Change**
Clarify changes → Impact analysis → Archive current version → Modify PRD (Base+Delta) → User confirms changes → Update downstream artifacts

## Incremental Feature Flow

When a new feature builds on existing requirements: create a new requirement folder, declare Base Requirement in the PRD, and use Base+Delta mode for modified pages. See [workflow-prd.md](workflow-prd.md).

## File Structure Convention

```
.solarwire/
├── [requirement-name]/
│   ├── solarwire-prd.md          # PRD document (always latest version)
│   ├── test-cases.md             # Test cases
│   ├── dev-design.md             # Dev design
│   └── archive/                  # Historical version archive
│       └── solarwire-prd-v1.0.md
```

## Version Management

- Requirement change: modify the current file, move old version to archive/ (Strategy C: single file + archive)
- Incremental feature: create new requirement folder, declare Base Requirement in PRD
- All PRDs contain a Changelog at the top

## Red Lines

1. Never generate SVG (handled by the editor application)
2. Never use hallucinated attributes (multiline, truncate, stroke, strokeWidth)
3. Use `b=` for border color, `s=` for border width
4. Never skip user confirmation gates
5. Never write visual details or technical implementation in notes
6. Never add i18n without user confirmation
7. Notes must use triple quotes `note="""..."""`, never use `note="..."` or `note='...'`
8. SolarWire code blocks must start with ` ```solarwire ` and end with ` ``` `, never use HTML tags like `</solarwire>`
9. Table cells and table rows must never specify @(x,y), w, h
10. Use `("text")` for circles, not `(("text"))`; use `["text"] r=N` for rounded rectangles, not `("text")`
11. After generating wireframes, must validate via renderer: `node sw-skills/solarwire/validate-sw.js <path>`; if validation fails, fix syntax and re-validate; only proceed when all pass
12. Plain text must use the text element `"text"`, never wrap plain text in a rectangle `["text"]`
13. Text in rectangle elements must be vertically centered `vertical-align=m` and horizontally left-aligned `align=l`

## Syntax Quick Reference

| Element | Syntax | Example |
|------|------|------|
| Rectangle | `["Text"] @(x,y)` | `["Button"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| Rounded Rectangle | `["Text"] @(x,y) r=N` | `["Card"] @(50,100) w=300 h=200 r=8` |
| Circle | `("Text") @(x,y)` | `("Avatar") @(300,50) w=60` |
| Text | `"Text" @(x,y)` | `"Title" @(100,50) size=24 bold` |
| Multi-line Text | `"""Line1\nLine2""" @(x,y)` | `"""Line1\nLine2""" @(100,50)` |
| Placeholder | `[?"Text"] @(x,y)` | `[?"Image"] @(200,200) w=150 h=100` |
| Image | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| Line | `-- "Label" -- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) c=#E5E7EB` |
| Table | `## @(x,y)` | `## @(50,50) w=500` |
| Table Row | `  #` (indented) | `  # bg=#F3F4F6` |

## Forbidden Attributes

| Hallucinated Attribute | Description |
|---------|------|
| `multiline` | This attribute does not exist |
| `truncate` | This attribute does not exist |
| `stroke` | Should use `b` (border color) |
| `strokeWidth` | Should use `s` (border width) |
| `(())` | Circles should use `("text")` |
| `("text")` as rounded rectangle | Rounded rectangles should use `["text"] r=N` |

## Base+Delta Change Markers

| Change Type | Border Color | Background | Note Prefix | Opacity |
|---------|--------|--------|----------|---------|
| NEW | `b=#22C55E` | `bg=#F0FDF4` | `[NEW]` | 1.0 |
| MODIFIED | `b=#F59E0B` | `bg=#FFFBEB` | `[MODIFIED]` + change description | 1.0 |
| REMOVED | `b=#EF4444` | `bg=#FEF2F2` | `[REMOVED]` + reason | 0.4 |
| UNCHANGED | As-is | As-is | No marker | 1.0 |

## Supporting Files

| File | Content | When to Load |
|------|------|---------|
| [syntax.md](syntax.md) | Full syntax rules + attribute reference | When needing full attribute list or validation rules |
| [note-guide.md](note-guide.md) | Note writing guide | When writing notes |
| [standards.md](standards.md) | Color/spacing/scene/modal standards | When needing visual standards |
| [workflow-prd.md](workflow-prd.md) | PRD workflow + template | When creating PRD |
| [workflow-code-to-prd.md](workflow-code-to-prd.md) | Reverse engineering workflow | When generating PRD from code |
| [workflow-test.md](workflow-test.md) | Test case workflow + xlsx conversion | When generating test cases |
| [workflow-dev-design.md](workflow-dev-design.md) | Dev design workflow | When doing technical design |
| [workflow-change.md](workflow-change.md) | Requirement change workflow | When modifying PRD |
| [workflow-component.md](workflow-component.md) | Component library workflow | When managing component library |
| [lib/generate-excel.js](lib/generate-excel.js) | Markdown test cases to xlsx converter | When converting test cases to Excel |
