---
name: "solarwire"
description: "Use for any SolarWire task including PRD creation, code reverse engineering, test case generation, dev design, implementation planning, or wireframe syntax validation"
---

# SolarWire

SolarWire is an AI-powered software development engineering toolkit that covers the full workflow from requirements to code. All deliverables are in .md format; wireframes use SolarWire code blocks, which can be viewed and fine-tuned by the editor application.

## Core Rule Files (Always Load First)

The following three files must be fully read and strictly followed at the start of **any** SolarWire task, regardless of the triggered intent:

- `standards.md` — Colors, spacing, scenarios, page organization, modal and overlay rules, layout calculation rules
- `syntax.md` — Full syntax reference, attribute rules, forbidden attributes list
- `note-guide.md` — Note writing rules, EARS description style, forbidden content

Before generating any SolarWire code or notes, confirm you have read these three files. Do NOT rely solely on workflow-specific summaries.

**Attention Protection Protocol**

These three files are lengthy. When reading them:
1. Create a mental index from the table of contents first.
2. Read "forbidden items", "mandatory rules", and "calculation formulas" with full attention.
3. Treat all examples in these files as structural references only. Coordinates, sizes, and colors in examples are placeholders, not defaults.
4. Before generating any output, return to the relevant rule section to verify compliance.
5. If any rule is unclear after reading, re-read the specific section before proceeding.

## Intent Router

| User Intent | Trigger Condition | Load File | Also Load |
|---------|---------|---------|---------|
| Create new PRD/Feature | User wants to write PRD, create requirements, new feature, modify existing features | [workflow-prd.md](workflow-prd.md) | standards.md, syntax.md, note-guide.md |
| Modify existing PRD | User wants to extend or change an existing PRD | [workflow-prd.md](workflow-prd.md) (incremental mode) | standards.md, syntax.md, note-guide.md |
| Generate PRD from code | User provides code/project, understand existing project | [workflow-prd.md](workflow-prd.md) (Scenario B) | standards.md, syntax.md, note-guide.md |
| Generate test cases | PRD exists, needs test cases | [workflow-test.md](workflow-test.md) | standards.md, syntax.md, note-guide.md |
| Technical design | PRD confirmed, needs architecture design | [workflow-dev-design.md](workflow-dev-design.md) | standards.md, syntax.md, note-guide.md |
| Implementation plan | PRD + dev design confirmed, needs implementation plan | [workflow-implementation.md](workflow-implementation.md) | standards.md, syntax.md, note-guide.md |
| Component library | Create/modify .swc components | [workflow-component.md](workflow-component.md) | standards.md, syntax.md, note-guide.md |
| Syntax reference | Generate/validate SW code, syntax errors | [syntax.md](syntax.md) | — |
| Note writing | Unsure how to write notes | [note-guide.md](note-guide.md) | — |
| Color/Spacing/Scene | Unsure about visual standards | [standards.md](standards.md) | — |

## Core Flows

**Flow 1: New Feature Development**
Explore context → Related feature impact analysis (scan codebase & existing PRDs) → Five Elements confirmation (Strategy→Scope→Structure→Framework→Presentation) → Terminal type confirmation → Produce PRD (with wireframes, including related feature modifications) → User confirms PRD → Write test cases → Dev design → Implementation plan → *(Code generation: not yet implemented)*

**Flow 2: Understand Existing Project**
Analyze codebase → Extract Five Elements from code (reverse: Presentation→Strategy) → Produce PRD (with wireframes) → User confirms understanding

**Flow 3: Modify Existing PRD**
Load existing PRD from `.solarwire/` → Related feature impact analysis → Ancestor page structure from code or existing PRD → Delta page wireframes with complete containers → Proceed as incremental feature

## File Structure Convention

```
.solarwire/
├── [parent-module-name]/                # If split into sub-requirements
│   ├── [sub-requirement-1]/
│   │   ├── solarwire-prd.md
│   │   ├── dev-design.md
│   │   ├── implementation-plan.md
│   │   ├── test-cases.xlsx
│   │   └── archive/
│   ├── [sub-requirement-2]/
│   │   └── ...
│   └── ...
├── [single-requirement]/                # Single, non-split requirement
│   ├── solarwire-prd.md
│   ├── test-cases.xlsx
│   ├── dev-design.md
│   └── archive/
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
5. Modified pages must be redrawn completely based on existing code or known PRD, with changes marked
6. Derive wireframe layouts and colors from project frontend code first; use standards.md defaults only when no code exists
7. Any frontend presentation requiring coding MUST have a wireframe; visually separate panels MUST be separate wireframes (tooltips/toasts go in notes)

## Syntax & Attribute Reference

For complete syntax rules, attribute definitions, and forbidden attributes list, see [syntax.md](syntax.md).

## Supporting Files

See Intent Router above for which files to load per intent. All workflow files reference syntax.md, note-guide.md, and standards.md as prerequisites.


