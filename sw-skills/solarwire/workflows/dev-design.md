

---

## workflows/dev-design.md

```markdown
# Technical Design Workflow

## 1. Initialization

Before proceeding, read these reference files completely:

- `references/note-guide.md` for note writing rules (especially the prohibition on API endpoints and technical details in notes).

## 2. Read the PRD

Read the confirmed PRD at `.solarwire/[requirement-name]/solarwire-prd.md`. Extract all requirements including user stories, features, business flows, page details, and non-functional requirements. Validate that the PRD is complete before starting.

## 3. System Architecture

- Decompose the system into modules based on the Feature List.
- Define each module's responsibility, dependencies, interfaces, and communication patterns.
- Generate a Mermaid architecture diagram using `graph TB` with subgraphs for layers.

## 4. Business Flow & Swimlane

- **Core Business Flow**: Expand PRD high-level steps into system-level operations using a Mermaid flowchart. Include all validation, processing, and error paths.
- **Swimlane Diagram**: Generate a Mermaid flowchart with subgraphs showing actor responsibilities (User, Frontend, Backend, Database, External Service).

## 5. Data Model

Define all entities, fields, types, and relationships. Every entity must have `id` (UUID), `created_at`, `updated_at`. Foreign keys use the `[entity]_id` convention. Generate a Mermaid ER diagram.

## 6. Database Schema

Design complete table structures with:
- Fields (name, type, nullable, default, constraint).
- Indexes (fields, type, purpose).
- Constraints (CHECK, FOREIGN KEY, UNIQUE).
- Use VARCHAR(36) for UUID PKs, `deleted_at` for soft deletes, snake_case naming.

## 7. API Definition

Define every API endpoint:
- Method, path (`/api/v1/...`), description, auth requirement.
- Request body and response schemas (use `string, required, 3-50 chars` format).
- All possible error codes and messages.
- RESTful conventions. List endpoints support pagination (`page`, `page_size`, `sort`, `order`) and field-based filtering.

Derive APIs from PRD pages: List/Table → GET list, Create Form → POST, Edit Form → GET detail + PUT, Delete → DELETE, etc.

## 8. Self-Review

Before presenting to the user, check:

1.  **PRD Coverage**: Every user story, feature, page, and business flow step has corresponding API endpoints and data models.
2.  **Data Model Consistency**: All API fields exist in data models. All foreign keys reference real tables. All status fields have CHECK constraints.
3.  **API Consistency**: All endpoints have full request/response schemas and documented error codes. No duplicates.
4.  **Architecture Consistency**: No circular module dependencies. All communication is documented.

## 9. Output & User Confirmation

Save to `.solarwire/[requirement-name]/dev-design.md`. Present for user review and do not proceed without explicit approval.

## 10. Incremental Development Design

When designing on top of an existing system, mark all changes with `[New]`, `[Modified]`, or `[Unchanged]`. Only document the changed parts; include a reference to the base design.

## 11. Important Reminders

- Never start without a confirmed PRD.
- Design architecture first, then data model, then API.
- Wireframe notes in this design must NOT contain API endpoints, database field names, or component library names (per `references/note-guide.md` Section 5).
```

---

## workflows/implementation.md

```markdown
# Implementation Plan Workflow

## 1. Initialization

Before proceeding, read these reference files completely:

- `references/syntax.md` for syntax rules.
- `references/note-guide.md` for note writing rules.
- `references/standards.md` for layout/spacing/color rules.

## 2. Read Source Documents

Read both the PRD (`.solarwire/[requirement-name]/solarwire-prd.md`) and the dev design (`.solarwire/[requirement-name]/dev-design.md`).

## 3. Task Breakdown

Transform every feature and page from the PRD into concrete, independently completable tasks (1-4 hours each). Use these task types:
- Database, API, Frontend-Page, Frontend-Component, Integration, Testing, Configuration.

## 4. Dependency Analysis

Identify all dependencies between tasks. Determine which tasks can run in parallel and identify the critical path.

## 5. Effort Estimation

| Size | Effort | Criteria |
|------|--------|----------|
| XS | 0.5-1 hr | Simple config, single field change |
| S | 1-2 hrs | Single component, simple API |
| M | 2-4 hrs | Full page, complex component |
| L | 4-8 hrs | Multi-page feature, complex API |
| XL | 8-16 hrs | Cross-cutting feature, architecture change |

## 6. Execution Plan Structure

Group tasks into phases with clear milestones. Example:
- Phase 1: Foundation (Data layer ready)
- Phase 2: Core Features (Core flow working)
- Phase 3: Extended Features (All features complete)
- Phase 4: Polish (Production ready)

## 7. Risk Assessment

Identify technical, integration, and scope risks. For each risk, define impact (High/Medium/Low), likelihood, and mitigation strategy.

## 8. Output

Save to `.solarwire/[requirement-name]/implementation-plan.md`. The document must include a task summary, dependency graph (Mermaid), phased execution plan, critical path, risk assessment, and parallel execution opportunities.

## 9. User Confirmation Gate

Present the complete plan to the user and wait for explicit approval. Do not proceed without confirmation.

## 10. Important Reminders

- Every task must trace back to a PRD feature and a dev design component.
- Identify ALL dependencies, including non-obvious ones.
- Always identify the critical path.
- Use realistic estimates; do not underestimate unknown factors.
```

---

## workflows/component.md

```markdown
# Component Library Workflow

## 1. Initialization

Before proceeding, read these reference files completely:

- `references/syntax.md` for all syntax rules and attribute constraints.
- `references/note-guide.md` for note writing rules (required if a component needs a behavioral note).

## 2. .swc File Structure

A `.swc` file is a Markdown-like format. It contains:
- **Metadata**: `id`, `version`, `description`, `author`, `createdAt`, `updatedAt`.
- **Categories**: `## Category Name` with `id` (format `cat-` prefix + kebab-case) and `parentId`.
- **Components**: `### Component Name` with `id` (kebab-case), `name`, `description`, `categoryId`, and a ` ```solarwire ` code block.

## 3. Component Code Rules

- Code must be valid SolarWire syntax per `references/syntax.md`.
- Coordinates are relative to the component's top-left corner; base point is `@(0,0)`.
- Avoid `<url>` image elements; use `[?"Image"]` placeholders instead.
- Text for labels must use `"text"` (not `["text"]`).
- For inputs/displays: `align=l vertical-align=m`.
- For buttons: `align=c vertical-align=m`.

## 4. Validation

After generating or modifying a component, validate its code:

```bash
node sw-skills/solarwire/validate-sw.js temp-code.txt
# or for the entire library
node sw-skills/solarwire/validate-sw.js path/to/library.swc
```

Fix syntax errors (e.g., `stroke`→`b`, `note="..."`→`note="""..."""`) and re-validate until clean.

## 5. Workflow for New Component Libraries

1.  Collect metadata (name, description, UUID).
2.  Define a category hierarchy.
3.  For each component, design its visual structure, write valid SolarWire code, validate it, and assign it an ID and category.
4.  Assemble the complete `.swc` structure.
5.  Save with the `.swc` extension.

## 6. Workflow for Modifying Existing Libraries

1.  Read and parse the existing `.swc` file.
2.  Add, modify, or delete components/categories as needed.
3.  Validate all changed code.
4.  Update version and `updatedAt` metadata.
5.  Save the updated `.swc` file.

## 7. Standard Category Suggestions

`cat-general` (parent: null) → `cat-button`, `cat-input`, `cat-container`, `cat-text`, `cat-navigation`, `cat-feedback`, `cat-data-display`, `cat-form`, `cat-layout`.

## 8. Important Reminders

- Validate after every change.
- No image elements.
- If a component includes a note, it must follow `references/note-guide.md`, especially the prohibition on implementation details.
```

---