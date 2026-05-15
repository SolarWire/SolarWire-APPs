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