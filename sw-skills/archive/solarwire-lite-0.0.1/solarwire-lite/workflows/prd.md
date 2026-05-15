# PRD Workflow

## 1. Initialization

Before proceeding, read these reference files completely. Do not rely on memory or the SKILL.md quick reference.

- `references/syntax.md` for all grammatical rules.
- `references/note-guide.md` for all rules on writing element notes.
- `references/standards.md` for all layout, color, and spacing regulations.

## 2. Scenario Detection

Determine if this is a new requirement or code reverse engineering. Ask the user if unclear.
- **Scenario A (New)**: Conduct full Five Elements discovery.
- **Scenario B (Code Reverse)**: Follow Phase C1-C5 to extract requirements from code.

## 3. Phase 0: Exploration & Preparation

- **Step 0:** Explore project context, codebase, and existing docs.
- **Step 1:** Perform a critical impact analysis on related features.
- **Step 2:** Check scope and decompose if needed.
- **Step 3:** Optionally, compare multiple design approaches.

## 4. Phase 1: Five Elements Confirmation

Do not move to the next layer until the current one is confirmed.
- **Strategy Layer:** Business goals, target users, success criteria.
- **Terminal Type:** Confirm Mobile/Web/Admin before layout design.
- **Scope Layer:** Define features, changes, and boundaries.
- **Structure Layer:** Page organization and user flow.
- **Framework Layer:** Page layout and interaction patterns.
- **Presentation Layer:** Visual hierarchy and grouping (wireframe attributes, **not** notes).
- **Multi-language:** Confirm i18n needs.
*CRITICAL: Five Elements are an internal tool only. NEVER output them as a section in the final PRD document.*

## 5. Phase 2: Requirements Validation

- **Step 11:** Summarize requirements and get user confirmation.
- **Step 12:** Formal confirmation gate.

## 6. Phase 3: Generation, Quality & Error Recovery

- **Step 13:** Generate the full PRD document, then run `validate-sw.js` on it.
- **Step 14:** Perform a Spec Self-Review:
    1.  **Placeholder Scan:** Check for any "TBD" or "TODO".
    2.  **Internal Consistency:** Ensure features, pages, and standards match.
    3.  **Scope Check:** Ensure it's not too large and decomposed correctly.
    4.  **Structure Compliance:** Check that the PRD has exactly 8 sections in order and no "Five Elements" leakage.
    5.  **Ambiguity Check:** Clarify any vague rules or terms.
- **Step 15:** Present the final PRD for user review. Handle change requests according to the Error Recovery Map.

**Error Recovery Map**
| Issue Type | Recovery Action |
|-----------|-----------------|
| User rejects business direction | Return to the relevant Five Elements layer. |
| User rejects terminal type | Return to Terminal Type confirmation. All layout decisions must be re-validated. |
| User rejects scope/pages/structure | Return to the relevant layer and re-define. |
| User rejects layout/visual style | Return to the relevant layer and re-design. |
| Contradictory requirements | Ask user to clarify; do not proceed. |
| Scope too large (>5 modules / >10 pages) | Decompose the project into sub-requirements. |
| PRD structure violations | Fix sections immediately and re-run Structure Compliance check. |
| SolarWire syntax errors | Fix with standard fixes or regenerate if validation fails >2 times. |

## 7. PRD Document Structure (Immutable)

The generated PRD must follow this exact structure. Translate all titles into the user's language.
1.  **Product Overview**: Background, Target Users, Core Value, User Stories.
2.  **Feature Scope**: Feature List, Feature Boundary.
3.  **Expected Outcome**: Success Metrics, User Behavior Changes, Business Impact.
4.  **Business Flow**: Core Flowchart, Sequence Diagram.
5.  **Page Design**: Page List.
6.  **Page Details**: One subsection per page with wireframes and notes.
7.  **Non-functional Requirements**: Performance, Security, Compatibility.
8.  **Appendix**: Glossary, References.