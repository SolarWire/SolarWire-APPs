# Workflow: PRD to Implementation Plan

## Inlined Syntax Rules (CRITICAL)

- note must use triple quotes: `note="""..."""`, never use `note="..."` or `note='...'`
- SolarWire code blocks start with ` ```solarwire ` and end with ` ``` `
- Border color uses `b=`, border width uses `s=`
- Circle uses `("text")`, rounded rectangle uses `["text"] r=N`
- Table cells and rows cannot specify @(x,y), w, h
- Table cell content should use `["text"]` (rectangle) instead of `"text"` — rectangles support more text formatting (bold, italic, size, color, alignment, etc.)
- Hallucinated attributes forbidden: multiline, truncate, stroke, strokeWidth
- All elements must have coordinates @(x,y) — top-left corner anchor
- Plain text must use text element `"text"`, not rectangle `["text"]` to wrap plain text
- Rectangle text alignment: `vertical-align=m` always; `align=l` for input/display, `align=c` for buttons
- After generating wireframes must run `node sw-skills/solarwire/validate-sw.js <path>` validation, fix syntax and re-validate if failed
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
- For modified elements: note must describe before→after change (e.g., "Was: [old behavior]. Now: [new behavior]")
- See [note-guide.md](note-guide.md) for complete note writing reference

## Configuration

- **Output Directory**: `.solarwire`
- **Input**: PRD document + Dev Design document

## Overview

This skill generates implementation plans based on confirmed PRD and dev design documents. The implementation plan includes task breakdown, dependency analysis, execution order, effort estimation, and risk identification.

## Prerequisites

- PRD document exists at `.solarwire/[requirement-name]/solarwire-prd.md`
- Dev design document exists at `.solarwire/[requirement-name]/dev-design.md`
- Both documents have been confirmed by user

## Workflow

### Phase 1: Input Analysis

**Step 1: Read PRD**
- Read the PRD document
- Extract feature list, page list, business flows
- Identify all functional requirements

**Step 2: Read Dev Design**
- Read the dev design document
- Extract technical architecture, data models, API design
- Identify technical dependencies

**Step 3: Cross-Reference**
- Map PRD features to dev design components
- Identify any gaps between PRD and dev design
- If gaps found, ask user to clarify

### Phase 2: Task Breakdown

**Step 4: Decompose into Tasks**

For each feature/page from PRD:
- Break into implementation tasks
- Each task should be independently completable
- Task granularity: 1-4 hours of work per task

**Task Types:**

| Type | Description | Example |
|------|-------------|---------|
| Database | Schema creation, migration | Create user table |
| API | Endpoint implementation | Implement login API |
| Frontend-Page | New page implementation | Implement login page |
| Frontend-Component | Reusable component | Implement user avatar component |
| Integration | Connect frontend to backend | Connect login form to API |
| Testing | Write tests | Unit tests for login flow |
| Configuration | Setup/config changes | Configure authentication middleware |

**Step 5: Identify Dependencies**
- Which tasks depend on others?
- Which tasks can run in parallel?
- Critical path identification

**Step 6: Estimate Effort**

| Size | Effort | Criteria |
|------|--------|----------|
| XS | 0.5-1 hour | Simple config, single field change |
| S | 1-2 hours | Single component, simple API |
| M | 2-4 hours | Full page, complex component |
| L | 4-8 hours | Multi-page feature, complex API |
| XL | 8-16 hours | Cross-cutting feature, architecture change |

### Phase 3: Execution Plan

**Step 7: Define Execution Order**
- Group tasks into phases
- Define milestones
- Identify critical path

**Phase Template:**
```
Phase 1: Foundation (Milestone: Data layer ready)
- Task 1.1: Create database schema [S]
- Task 1.2: Setup API framework [S]

Phase 2: Core Features (Milestone: Core flow working)
- Task 2.1: Implement login API [M]
- Task 2.2: Implement login page [M]
- Task 2.3: Connect login flow [S]

Phase 3: Extended Features (Milestone: All features complete)
- Task 3.1: Implement user list [M]
- Task 3.2: Implement user profile [M]

Phase 4: Polish (Milestone: Production ready)
- Task 4.1: Write tests [L]
- Task 4.2: Error handling [M]
- Task 4.3: Performance optimization [S]
```

**Step 8: Identify Risks**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [Risk description] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

### Phase 4: Output

**Step 9: Generate Implementation Plan**
- Save to `.solarwire/[requirement-name]/implementation-plan.md`

**Step 10: User Review Gate**
- Present plan to user
- Wait for confirmation
- If adjustments needed, go back to Step 4

## Implementation Plan Document Structure

```markdown
# Implementation Plan - [Project Name]

## Document Information
| Project Name | [Name] |
| Version | v1.0 |
| Base PRD | .solarwire/[req-name]/solarwire-prd.md |
| Base Dev Design | .solarwire/[req-name]/dev-design.md |
| Created Date | [Date] |

## Change Log
| Version | Date | Changes |
|---------|------|---------|
| v1.0 | [Date] | Initial plan |

---

## 1. Task Summary

| Category | Count | Total Effort |
|----------|-------|-------------|
| Database | N | Xh |
| API | N | Xh |
| Frontend-Page | N | Xh |
| Frontend-Component | N | Xh |
| Integration | N | Xh |
| Testing | N | Xh |
| Configuration | N | Xh |
| **Total** | **N** | **Xh** |

## 2. Dependency Graph

```mermaid
graph TD
    T1[Task 1] --> T2[Task 2]
    T1 --> T3[Task 3]
    T2 --> T4[Task 4]
```

## 3. Execution Plan

### Phase 1: [Phase Name] (Est: Xh)
**Milestone**: [Milestone description]

| Task ID | Task | Type | Size | Dependencies | Description |
|---------|------|------|------|-------------|-------------|
| T1.1 | [Task name] | [Type] | [S/M/L] | - | [Description] |
| T1.2 | [Task name] | [Type] | [S/M/L] | T1.1 | [Description] |

### Phase 2: [Phase Name] (Est: Xh)
...

## 4. Critical Path
T1.1 → T1.2 → T2.1 → T3.1 → T4.1

## 5. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [Risk] | [H/M/L] | [H/M/L] | [Mitigation] |

## 6. Parallel Execution Opportunities

| Parallel Group | Tasks | Can Run Simultaneously |
|---------------|-------|----------------------|
| Group A | T1.1, T1.3 | Yes - no dependencies |
| Group B | T2.1, T2.2 | Yes - no dependencies |
```

## Important Reminders

1. **Read Both Documents** - Must read both PRD and dev design before planning
2. **Cross-Reference** - Every task must trace back to a PRD feature and dev design component
3. **Task Granularity** - Each task should be 1-4 hours, independently completable
4. **Dependency Analysis** - Identify ALL dependencies, not just obvious ones
5. **Critical Path** - Always identify the critical path
6. **Risk Assessment** - Consider technical risks, integration risks, and scope risks
7. **Document Language** - Write in the user's communication language
8. **Realistic Estimates** - Use the effort size guide, don't underestimate
9. **User Confirmation Required** - Must get user approval before considering plan final
