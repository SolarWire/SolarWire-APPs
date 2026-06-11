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

## 4. UML Class Diagram

Generate a Mermaid `classDiagram` showing all domain classes, their key attributes, method signatures, and relationships (inheritance, composition, aggregation, association). Every class must include its essential fields and operations.

## 5. Business Flow & Swimlane

- **Core Business Flow**: Expand PRD high-level steps into system-level operations using a Mermaid flowchart. Include all validation, processing, and error paths.
- **Swimlane Diagram**: Generate a Mermaid flowchart with subgraphs showing actor responsibilities (User, Frontend, Backend, Database, External Service).

## 6. Data Model

Define all entities, fields, types, and relationships. Every entity must have `id` (UUID), `created_at`, `updated_at`. Foreign keys use the `[entity]_id` convention. Generate a Mermaid ER diagram.

## 7. Database Schema

Design complete table structures with:
- Fields (name, type, nullable, default, constraint).
- Indexes (fields, type, purpose).
- Constraints (CHECK, FOREIGN KEY, UNIQUE).
- Use VARCHAR(36) for UUID PKs, `deleted_at` for soft deletes, snake_case naming.

## 8. API Definition

Define every API endpoint:
- Method, path (`/api/v1/...`), description, auth requirement.
- Request body and response schemas (use `string, required, 3-50 chars` format).
- All possible error codes and messages.
- RESTful conventions. List endpoints support pagination (`page`, `page_size`, `sort`, `order`) and field-based filtering.

Derive APIs from PRD pages: List/Table → GET list, Create Form → POST, Edit Form → GET detail + PUT, Delete → DELETE, etc.

## 9. Self-Review

Before presenting to the user, check:

1.  **PRD Coverage**: Every user story, feature, page, and business flow step has corresponding API endpoints and data models.
2.  **Data Model Consistency**: All API fields exist in data models. All foreign keys reference real tables. All status fields have CHECK constraints.
3.  **API Consistency**: All endpoints have full request/response schemas and documented error codes. No duplicates.
4.  **Architecture Consistency**: No circular module dependencies. All communication is documented.

## 10. Output & User Confirmation

Save to `.solarwire/[requirement-name]/dev-design.md`. Present for user review and do not proceed without explicit approval.

## 11. Incremental Development Design

When designing on top of an existing system, mark all changes with `[New]`, `[Modified]`, or `[Unchanged]`. Only document the changed parts; include a reference to the base design.

## 12. Important Reminders

- Never start without a confirmed PRD.
- Design architecture first, then data model, then API.
- Wireframe notes in this design must NOT contain API endpoints, database field names, or component library names (per `references/note-guide.md` Section 5).