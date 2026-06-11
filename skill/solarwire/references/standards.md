# SolarWire Wireframe Standards

> These rules are always in effect. For full syntax, see `references/syntax.md`.

## 1. Element Selection
- Use `[" "]` for interactive elements (buttons, inputs, selectable items, containers).
- Use `" "` for display-only labels, static text, tags, and any non-interactive text content. Text elements support ONLY `c`, `size`, `bold`, `opacity`; do not attach layout attributes (`bg`, `b`, `align`, etc.) to them.
- Use `[""]` (empty rectangle) for containers, dividers, and spacers that need no internal text.
- Never simulate tables with Rectangles; always use `##`.

## 2. Code Block Header
- Every SolarWire code block's first line MUST be `!title="页面名称"`, declaring the page name.
- The title must match the page/sub-page name used in the PRD's Page Details section.
- The title text must be in the user's communication language.

## 3. Container Rules
- Every page starts with `[] @(0,0) w=... h=... bg=#FFFFFF b=#FFFFFF`.
- Container must not have shadows or round corners.

## 4. Page Completeness
- Every wireframe must be a complete page frame, including top bar, sidebar, etc. These global elements need no detailed notes.
- Every wireframe must include complete navigation context: how the user arrived at this page (menu highlighting, breadcrumb, tab selection) and how they leave (back button, close button, breadcrumb link). A page without entry and exit navigation is incomplete.
- All element-level behavior descriptions MUST be written in the element's `note` attribute, inside the SolarWire code block. Do NOT write descriptions as separate prose outside the code block. The PRD's Page Details section should contain only SolarWire code blocks.

## 5. Incremental Pages
- Redraw the **complete** page with ALL existing elements first, exactly as they appear in the current UI/code. Only then mark changes.
- Mark new/modified/removed elements with `[NEW]`/`[MODIFIED]`/`[REMOVED]` prefix on their label text.
- **Notes on incremental pages**: Only write notes for `[NEW]` and `[MODIFIED]` elements. Do NOT re-describe unchanged elements that already exist in the original page. If an element has no `[NEW]`/`[MODIFIED]` tag, it needs no note.
- The reader must be able to see both the complete page context AND exactly what changed, without wading through descriptions of unchanged parts.

## 6. Wireframe Coverage
- Any visually separate UI (tabs, modals, drawers, popovers, dropdowns) must have its own wireframe.
- Tooltips and toasts are described in the trigger element's note.

## 7. Color & Spacing (Fallback)
- Use project code values first. Fallback: Tailwind color palette. Font 13px, line height 22px.

## 8. High-Fidelity Rendering
- Wireframes must approximate the actual visual density and proportion of the target UI, not abstract placeholders.
- Derive element sizes from real UI conventions: a typical table row is 48-56px tall, a form label is 80-120px wide, a primary button is 88-120px wide by 32-40px tall.
- Use actual brand/product colors extracted from the codebase. Never default to generic grays when the project has a defined palette.
- Replicate the real visual hierarchy: card shadows, section dividers, status badges with proper background/text color pairs, icon placeholders at realistic sizes.
- Group related elements with proper spacing and alignment; the wireframe should look like a monochrome/styled screenshot of the finished page, not a wireframe sketch.
- When code is available, derive every color, size, and layout from it. Only fall back to standards when no code reference exists.

## 9. Scenario Dimensions (See `references/syntax.md` for container formulas)
- **Mobile:** w=390 h=844. Touch targets 44px+. Bottom nav.
- **Web:** w=1440 h=900. Top nav.
- **Admin:** w=1440 h=900. Sidebar 200-280px + Main.

## 10. Layout Calculation Formulas
- `Container Width` (Mobile: 390, Web: 1440, Admin: 1440)
- `Content Width = Container Width - 2*padding`
- `Element Y = Previous_Element_Y + Previous_Element_H + gap`
- `gap`: label-to-input 4-8px, group-to-group 12-16px, section-to-section 24-32px.
- **Modals:** Centered box w=400-800, backdrop bg=#000000 opacity=0.5.
- **Reference Strategy:** Extract layout from code first, use these formulas only as fallback.

## 11. Element Layout Integrity
- Strictly check that no elements overlap or stack on top of each other. Every element must have a unique, non-colliding position.
- During self-review, visually verify element coordinates and dimensions. Two elements overlap if their bounding rectangles intersect.
- Pay special attention to dynamically positioned elements (modals, dropdowns, tooltips) which must not obscure underlying static elements.