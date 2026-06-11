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
  - **CRITICAL**: Reverse-engineered output must be a faithful 1:1 representation of the existing code. Do NOT add, remove, rename, restructure, or "improve" any element, field, label, flow, or behavior that is not explicitly requested by the user. Every text, every layout position, every color, every data field in the wireframe/PRD must have a direct corresponding source in the codebase. If the code shows 5 columns, the wireframe shows 5 columns. If the code labels something "代理名称", the wireframe uses exactly "代理名称", not a translated or rephrased version.
  - **i18n Resolution**: When the codebase uses i18n (e.g. `t('key')`, `$t('key')`, `i18n.t('key')`), you MUST locate the corresponding locale/translation file and resolve the key to the actual displayed text. Never use the raw i18n key string in wireframes. If multiple locale files exist, use the project's default/primary locale. The wireframe must show the same text a real user would see on screen.

## 3. Phase 0: Exploration & Preparation

- **Step 0:** Explore project context, codebase, and existing docs.
- **Step 1:** Perform a critical impact analysis on related features.
- **Step 2:** Check scope and decompose if needed.
- **Step 3:** Optionally, compare multiple design approaches.

## 4. Phase 0b: Competitive Analysis

Before confirming the Five Elements, research competitors to inform requirements decisions.
- **Step 4:** Identify 2-5 representative competitors or analogous products for the target domain.
- **Step 5:** Search online for how each competitor handles the relevant feature set, UI patterns, and user flows.
- **Step 6:** Summarize key findings: common patterns, divergent approaches, gaps/opportunities, and anti-patterns to avoid.
- **Step 7:** Use findings to validate or challenge assumptions from Phase 0. Flag any competitive insight that contradicts the current design direction for user confirmation.

## 5. Phase 1: Five Elements Confirmation

Do not move to the next layer until the current one is confirmed.
- **Strategy Layer:** Business goals, target users, success criteria.
- **Terminal Type:** Confirm Mobile/Web/Admin before layout design.
- **Scope Layer:** Define features, changes, and boundaries.
- **Structure Layer:** Page organization and user flow.
- **Framework Layer:** Page layout and interaction patterns.
- **Presentation Layer:** Visual hierarchy and grouping (wireframe attributes, **not** notes).
- **Multi-language:** Confirm i18n needs.
- **Competitive Cross-Reference:** For each layer, compare the team's assumptions against competitive analysis findings. Ask: "How do competitors solve this? Does our approach differentiate or match? Are we solving a real pain or copying a pattern without understanding why?"
*CRITICAL: Five Elements are an internal tool only. NEVER output them as a section in the final PRD document.*

## 6. Phase 2: Requirements Validation

- **Step 11:** Summarize requirements and get user confirmation.
- **Step 12:** Formal confirmation gate.

## 7. Phase 3: Generation, Quality & Error Recovery

- **Step 13:** Generate the full PRD document, then run `validate-sw.js` on it.
- **Step 14:** Perform a Spec Self-Review:
    1.  **Placeholder Scan:** Check for any "TBD" or "TODO".
    2.  **Internal Consistency:** Ensure features, pages, and standards match.
    3.  **Scope Check:** Ensure it's not too large and decomposed correctly.
    4.  **Structure Compliance:** Check that the PRD has exactly 9 sections in order and no "Five Elements" leakage.
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

## 8. PRD Document Structure (Immutable)

The generated PRD must follow this exact structure. All content — including titles, section body text, wireframe labels, element notes, Mermaid diagram labels, and appendix entries — must use the user's communication language. Translate the 9 section names below as appropriate.
1.  **Product Overview**: Background, Target Users, Core Value, User Stories.
2.  **Competitive Analysis**: Competitor list, feature comparison table, key findings (common patterns, divergent approaches, gaps/opportunities), and how these insights inform the product direction.
3.  **Feature Scope**: Feature List, Feature Boundary.
4.  **Expected Outcome**: Success Metrics, User Behavior Changes, Business Impact.
5.  **Business Flow**: Core Flowchart, Sequence Diagram. All flowcharts, swimlane diagrams, and sequence diagrams MUST use Mermaid syntax within ` ```mermaid ` code blocks. ASCII-art diagrams are forbidden.
6.  **Page Design**: Page List.
7.  **Page Details**: One subsection per page, containing only the SolarWire code block. All element behavior descriptions MUST be written in the corresponding element's `note` attribute within the code block. Do NOT write any explanatory prose or behavior descriptions outside the code block.
8.  **Non-functional Requirements**: Performance, Security, Compatibility.
9.  **Appendix**: Glossary, References.