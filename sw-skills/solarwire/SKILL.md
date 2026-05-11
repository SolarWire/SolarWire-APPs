---
name: "solarwire"
description: "Use for any SolarWire task including PRD creation, code reverse engineering, test case generation, dev design, implementation planning, or wireframe syntax validation"
---

# SolarWire

SolarWire is an AI-powered software development engineering toolkit that covers the full workflow from requirements to code. All deliverables are in .md format; wireframes use SolarWire code blocks, which can be viewed and fine-tuned by the editor application.

## Intent Router

| User Intent | Trigger Condition | Load File | Also Load |
|---------|---------|---------|---------|
| Create new PRD/Feature | User wants to write PRD, create requirements, new feature, modify existing features | [workflow-prd.md](workflow-prd.md) | [standards.md](standards.md) |
| Generate PRD from code | User provides code/project, understand existing project | [workflow-prd.md](workflow-prd.md) (Scenario B) | [standards.md](standards.md) |
| Generate test cases | PRD exists, needs test cases | [workflow-test.md](workflow-test.md) | — |
| Technical design | PRD confirmed, needs architecture design | [workflow-dev-design.md](workflow-dev-design.md) | — |
| Implementation plan | PRD + dev design confirmed, needs implementation plan | [workflow-implementation.md](workflow-implementation.md) | — |
| Component library | Create/modify .swc components | [workflow-component.md](workflow-component.md) | [syntax.md](syntax.md) |
| Syntax reference | Generate/validate SW code, syntax errors | [syntax.md](syntax.md) | — |
| Note writing | Unsure how to write notes | [note-guide.md](note-guide.md) | — |
| Color/Spacing/Scene | Unsure about visual standards | [standards.md](standards.md) | — |

## Core Flows

**Flow 1: New Feature Development**
Explore context → Related feature impact analysis (scan codebase & existing PRDs) → Five Elements confirmation (Strategy→Scope→Structure→Framework→Presentation) → Produce PRD (with wireframes, including related feature modifications) → User confirms PRD → Write test cases → Dev design → Implementation plan → Write code → Code review → Execute tests → Test report

**Flow 2: Understand Existing Project**
Analyze codebase → Extract Five Elements from code → Produce PRD (with wireframes) → User confirms understanding

## File Structure Convention

```
.solarwire/
├── [requirement-name]/
│   ├── solarwire-prd.md          # PRD document (always latest version)
│   ├── test-cases.xlsx            # Test cases
│   ├── dev-design.md             # Dev design
│   └── archive/                  # Historical version archive
│       └── solarwire-prd-v1.0.md
```

## Version Management

- All changes (new or modification) are handled as new requirements
- When modifying existing features: only describe changed parts, notes show before→after
- Existing page structure inferred from code when available
- All PRDs contain a Changelog at the top

## Red Lines

1. Never generate SVG (handled by the editor application)
2. Never skip user confirmation gates
3. Never add i18n without user confirmation
4. Document language follows user's communication language; if unsure, ask the user
5. Modified pages only describe changes — do not copy or re-describe unchanged parts from old PRDs

## Syntax Quick Reference

| Element | Syntax | Example |
|------|------|------|
| Rectangle | `["Text"] @(x,y)` | `["Button"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF align=c vertical-align=m` |
| Rounded Rectangle | `["Text"] @(x,y) r=N` | `["Card"] @(50,100) w=300 h=200 r=8` |
| Circle | `("Text") @(x,y)` | `("Avatar") @(300,50) w=60` |
| Text | `"Text" @(x,y)` | `"Title" @(100,50) size=24 bold` |
| Multi-line Text | `"""Line1\nLine2""" @(x,y)` | `"""Line1\nLine2""" @(100,50)` |
| Placeholder | `[?"Text"] @(x,y)` | `[?"Image"] @(200,200) w=150 h=100` |
| Image | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| Line | `-- "Label" -- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) c=#E5E7EB` |
| Table | `## @(x,y)` | `## @(50,50) w=500` |
| Table Row | `  #` (indented) | `  # bg=#F3F4F6` |
| Table Cell | `  ["Text"]` (recommended) | `  ["Value"] bold c=#111827` |

## Forbidden Attributes

| Hallucinated Attribute | Description |
|---------|------|
| `multiline` | This attribute does not exist |
| `truncate` | This attribute does not exist |
| `stroke` | Should use `b` (border color) |
| `strokeWidth` | Should use `s` (border width) |
| `(())` | Circles should use `("text")` |
| `("text")` as rounded rectangle | Rounded rectangles should use `["text"] r=N` |

## Supporting Files

| File | Content | When to Load |
|------|------|---------|
| [syntax.md](syntax.md) | Full syntax rules + attribute reference | When needing full attribute list or validation rules |
| [note-guide.md](note-guide.md) | Note writing guide | When writing notes |
| [standards.md](standards.md) | Color/spacing/scene/modal standards | When needing visual standards |
| [workflow-prd.md](workflow-prd.md) | PRD workflow (new feature + code reverse engineering + modifications) | When creating PRD or generating PRD from code; also load standards.md |
| [workflow-test.md](workflow-test.md) | Test case workflow + xlsx conversion | When generating test cases |
| [workflow-dev-design.md](workflow-dev-design.md) | Dev design workflow | When doing technical design |
| [workflow-implementation.md](workflow-implementation.md) | Implementation plan workflow | When creating implementation plan |
| [workflow-component.md](workflow-component.md) | Component library workflow | When managing component library |
| [lib/generate-excel.js](lib/generate-excel.js) | Markdown test cases to xlsx converter | When converting test cases to Excel |
