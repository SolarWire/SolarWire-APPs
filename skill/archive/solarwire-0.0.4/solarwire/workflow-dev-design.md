# Workflow: PRD to Development Design

## Prerequisites

Load core rule files (syntax.md, note-guide.md, standards.md) as specified in SKILL.md before starting. Do not rely solely on summaries in this file.

**Special Note for Technical Design**: When writing or supplementing SolarWire notes in this design document, you must strictly follow `note-guide.md`. In particular, remove all API endpoints, database field names, and other technical implementation details from notes — these belong in the API definition and data model sections, not in wireframe notes.

---

# Technical Design Document Generator

## Configuration

- **Output Directory**: `.solarwire`

---

## Overview

**Core Capability**: Generate technical design documents from confirmed PRD, bridging "what to build" and "how to build it".

### What This Skill Does

1. **Read PRD** - Parse confirmed PRD document, extract all requirements
2. **System Architecture** - Design module structure and dependencies
3. **Business Flow** - Generate detailed flow and swimlane diagrams
4. **Data Model** - Define entities, fields, and relationships
5. **Database Schema** - Design table structures with indexes and constraints
6. **API Definition** - Define all API endpoints with request/response formats
7. **Self-Review** - Validate consistency with PRD
8. **User Confirmation** - Get user sign-off on technical design

## When to Invoke

- User says "generate technical design" or "dev design"
- PRD has been confirmed and user wants to proceed to implementation
- User asks "how should we implement this?"
- User wants to bridge PRD and coding phase

---

## Workflow

### Step 1: Read PRD

**Goal: Extract all requirements from confirmed PRD**

```
1. Read `.solarwire/[requirement-name]/solarwire-prd.md`
2. Extract:
   - User Stories (Section 1.4)
   - Feature List (Section 2.1)
   - Feature Boundary (Section 2.2)
   - Business Flow (Section 3)
   - Page List (Section 4)
   - Page Details (Section 5)
   - Non-functional Requirements (Section 6)
   - API Reference (Section 7.1)
   - Data Models (Section 7.2)
3. Validate PRD completeness:
   - All sections present
   - No [To be confirmed] markers
   - User Stories have acceptance criteria
4. If PRD is incomplete:
   - Report missing sections to user
   - Ask user to complete PRD first
   - Do NOT proceed with incomplete PRD
```

**PRD Extraction Checklist:**

| Section | What to Extract | Why Needed |
|---------|----------------|------------|
| User Stories | Roles, actions, benefits | API permission design |
| Feature List | Modules, features, priorities | Module decomposition |
| Business Flow | Flow steps, decisions | Flow and swimlane diagrams |
| Page Details | UI elements, interactions | API endpoints, data models |
| Non-functional | Performance, security | Architecture constraints |
| API Reference | Existing endpoints | API design baseline |
| Data Models | Existing entities | Database schema baseline |

### Step 2: System Architecture

**Goal: Design module structure and dependencies**

```
1. Decompose system into modules based on Feature List
2. Define module responsibilities (Single Responsibility Principle)
3. Identify module dependencies
4. Determine communication patterns between modules
5. Generate Mermaid architecture diagram
```

**Module Decomposition Rules:**

| PRD Feature Count | Module Strategy |
|-------------------|-----------------|
| 1-3 features | Single module |
| 4-8 features | Group by business domain |
| 9+ features | Layered architecture (presentation, business, data) |

**Architecture Diagram**: Use Mermaid `graph TB` with subgraphs for each layer. Document each module: name, responsibility, dependencies, exposed interfaces, communication pattern (sync/async).

### Step 3: Business Flow & Swimlane

**Goal: Generate detailed flow and swimlane diagrams from PRD**

#### 3.1 Core Business Flow

Generate Mermaid flowchart from PRD Business Flow section. Expand PRD high-level steps into system-level operations (include validation, processing, error paths).

#### 3.2 Swimlane Diagram

Generate Mermaid swimlane diagram showing actor responsibilities (User, Frontend, Backend, Database, External Service). Each step belongs to exactly one actor; use arrows for cross-lane handoff; include error return paths.

### Step 4: Data Model

**Goal: Define entities, fields, and relationships**

For each entity from PRD, define fields with type, required, default, description. Every entity must have `id` (UUID), `created_at`, `updated_at`. Foreign keys named as `[entity]_id`. Status fields: string enum with documented values. Amount fields: decimal with precision.

Generate Mermaid ER diagram showing all entities and relationships (1:1, 1:N, N:M).

### Step 5: Database Schema

**Goal: Design complete table structures with indexes and constraints**

For each entity, define: table name, fields (name, type, nullable, default, constraint), indexes (fields, type, purpose), and constraints (CHECK, FK, UNIQUE). Rules: UUID PK as VARCHAR(36), FK as `[table]_id`, all tables have `created_at`/`updated_at`, soft delete via `deleted_at`, snake_case naming.

### Step 6: API Definition

**Goal: Define all API endpoints with request/response formats**

Define each endpoint: method, path, description, auth requirement, request body schema, response schema, error codes. RESTful with `/api/v1/` prefix; all endpoints require auth unless explicitly public; list endpoints support pagination and filters.

**API-Page Mapping** (derive APIs from PRD pages):

| Page Element | API Requirement |
|-------------|-----------------|
| List/Table | GET list API with pagination |
| Create Form | POST create API |
| Edit Form | GET detail API + PUT update API |
| Delete Button | DELETE API |
| Search/Filter | GET list API with query params |
| Dropdown options | GET options API or embedded in list |
| Statistics | GET statistics/aggregation API |
| File Upload | POST upload API |
| Export | GET export API |

### Step 7: Self-Review

**Goal: Validate technical design consistency with PRD**

#### Check 1: PRD Coverage

```
Check items:
- Every User Story has corresponding API endpoints
- Every Feature has corresponding module and data model
- Every Page has corresponding API endpoints
- Every Business Flow step is covered in flow diagrams
- Every UI interaction has API support

If missing:
- Add missing APIs, data models, or flow steps
- Document why certain PRD items are deferred (if any)
```

#### Check 2: Data Model Consistency

```
Check items:
- All API request/response fields exist in data models
- All foreign keys reference existing tables
- All status values have CHECK constraints
- All required fields are NOT NULL
- No orphan tables (every table is used by at least one API)

If inconsistent:
- Add missing fields to data models
- Add missing tables
- Fix foreign key references
```

#### Check 3: API Consistency

```
Check items:
- All API endpoints have request/response schemas
- All error codes are documented
- All auth requirements are specified
- No duplicate endpoints
- All page interactions are supported by APIs

If inconsistent:
- Add missing schemas
- Document missing error codes
- Remove or merge duplicate endpoints
```

#### Check 4: Architecture Consistency

```
Check items:
- All modules have clear responsibilities
- No circular dependencies between modules
- All module communication is documented
- Architecture supports non-functional requirements

If inconsistent:
- Refactor module boundaries
- Break circular dependencies
- Add missing communication patterns
```

**Fix Principle:**
- Fix all issues immediately, no need to re-review
- Proceed to Step 8 after fixing

### Step 8: User Confirmation

**Goal: Get user sign-off on technical design**

```
Technical design document generated and passed self-review.

File Location: .solarwire/[requirement-name]/dev-design.md

Includes:
- System Architecture (Section 1)
- Business Flow & Swimlane (Section 2)
- Data Model (Section 3)
- Database Schema (Section 4)
- API Definition (Section 5)

Please review:
1. Architecture - Is the module decomposition reasonable?
2. Data Model - Are entities and relationships correct?
3. Database Schema - Are indexes and constraints sufficient?
4. API Design - Are endpoints and schemas complete?
5. Business Flow - Are all paths covered?

Review Method:
- Edit directly in file
- Or tell me what needs adjustment

After review approval, this document will serve as the technical blueprint for implementation.

Please start reviewing, let me know if you have any questions.
```

**User Confirmation Rules:**
- MUST wait for user to explicitly confirm "ok" or "no problem"
- If user requests changes, go back to relevant step to update
- If user only needs minor adjustments, can fix inline

---

## Output Document Structure

```markdown
# Technical Design Document - [Project Name]

## Document Information
| Project Name | [Name] |
| Version | v1.0 |
| Base PRD | .solarwire/[req-name]/solarwire-prd.md |
| Created Date | [Date] |

## Change Log
| Version | Date | Changes |
|---------|------|---------|
| v1.0 | [Date] | Initial design |

---

## 1. System Architecture

### 1.1 Architecture Overview
[Mermaid diagram]

### 1.2 Module Description
[Module table for each module]

### 1.3 Module Dependencies
[Dependency description]

---

## 2. Business Flow

### 2.1 Core Business Flow
[Mermaid flowchart]

### 2.2 Swimlane Diagram
[Mermaid flowchart with subgraph]

---

## 3. Data Model

### 3.1 Entity Relationship
[Mermaid ER diagram]

### 3.2 Entity Definitions
[Entity field tables]

### 3.3 Entity Relationships
[Relationship table]

---

## 4. Database Schema

### 4.1 Table Structures
[Table schema tables]

### 4.2 Indexes
[Index tables]

### 4.3 Constraints
[Constraint tables]

---

## 5. API Definition

### 5.1 API Overview
[API summary table]

### 5.2 API Details
[Detailed request/response schemas for each endpoint]

---
```

---

## Incremental Feature Development Design

When designing for an incremental feature on top of an existing system:

### Marking Convention

| Mark | Meaning | Description |
|------|---------|-------------|
| **[New]** | New addition | Brand new module, table, API, or field |
| **[Modified]** | Changed from base | Existing item with changes |
| **[Unchanged]** | No change | Existing item referenced but not changed |

### Modified API/Table Rules

- Only write the **changed parts**, not the entire definition
- Include reference to base design
- Document what changed and why

**Example - Modified Table:**

```markdown
### users [Modified]

Changes from base design:
- Added field: `last_login_at` DATETIME NULL [New]
- Added field: `login_count` INT NOT NULL DEFAULT 0 [New]
- Modified constraint: `status` CHECK now includes 'suspended'

| Table | Field | Type | Nullable | Default | Constraint | Description |
|-------|-------|------|----------|---------|------------|-------------|
| users | last_login_at | DATETIME | YES | NULL | - | Last login time [New] |
| users | login_count | INT | NO | 0 | - | Total login count [New] |
```

**Example - Modified API:**

```markdown
### GET /api/v1/users [Modified]

Changes from base design:
- Added query param: `role` (filter by role) [New]
- Added query param: `login_after` (filter by last login time) [New]
- Response: Added `last_login_at`, `login_count` fields [New]
```

### Base PRD Reference

Always include reference to the base PRD:

```markdown
## Document Information
| Project Name | [Name] |
| Version | v1.1 |
| Base PRD | .solarwire/[req-name]/solarwire-prd.md |
| Base Dev Design | .solarwire/[req-name]/dev-design.md |
| Created Date | [Date] |
| Change Type | Incremental Feature |
```

---

## Output File Structure

```
.solarwire/                              # Root directory for all outputs
├── [requirement-name]/                  # Folder for requirement
│   ├── solarwire-prd.md                 # PRD document
│   └── dev-design.md                    # Technical design document
│
├── [requirement-name-2]/                # Folder for requirement 2
│   ├── solarwire-prd.md
│   └── dev-design.md
│
└── ...                                  # More requirement folders
```

**Naming Convention:**
- Root directory: `.solarwire` (at project root)
- Requirement folder: Based on the requirement/project name
- Dev design file: Always named `dev-design.md`

---

## Mermaid Diagram Standards

Use Mermaid for all diagrams. Follow standard Mermaid syntax for flowcharts, sequence diagrams, and ER diagrams.

---

## Design Decision Records

For important design decisions, document the rationale:

```markdown
### Decision: [Decision Title]

**Context**: [Why this decision is needed]

**Options Considered**:
1. [Option A] - Pros: [...], Cons: [...]
2. [Option B] - Pros: [...], Cons: [...]
3. [Option C] - Pros: [...], Cons: [...]

**Decision**: [Chosen option]

**Rationale**: [Why this option was chosen]

**Consequences**: [Impact of this decision]
```

---

## Important Reminders

1. **PRD Must Be Confirmed** - Never start dev design without confirmed PRD
2. **Architecture First** - Design architecture before data model and API
3. **Data Model Before API** - Define entities before endpoints
4. **Consistency Check** - Self-review against PRD after design
5. **User Confirmation Required** - Must get user sign-off before implementation
6. **No Placeholders** - All sections must be complete, no TBD or TODO
7. **Notes in Design Must Follow note-guide.md** - Wireframe notes must NOT include API endpoints, database field names, or component library names (per note-guide.md Section 8)

> For common rules (document language, Mermaid format, incremental marking, UUID keys, soft delete, audit fields, pagination, etc.), follow the rules defined in each workflow step and SKILL.md Red Lines.
