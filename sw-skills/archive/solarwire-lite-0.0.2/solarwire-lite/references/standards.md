# SolarWire Wireframe Standards

> These rules are always in effect. For full syntax, see `references/syntax.md`.

## 1. Element Selection
- Use `[" "]` for interactive elements only (buttons, inputs, selectable items, containers).
- Use `" "` for display-only labels, static text, tags, and any non-interactive text content.
- Never wrap plain display text in Rectangles; this creates false interactive affordances and clutters layout.
- Never simulate tables with Rectangles; always use `##`.

## 2. Container Rules
- Every page starts with `[] @(0,0) w=... h=... bg=#FFFFFF b=#FFFFFF`.
- Container must not have shadows or round corners.

## 3. Page Completeness
- Every wireframe must be a complete page frame, including top bar, sidebar, etc. These global elements need no detailed notes.

## 4. Incremental Pages
- Redraw the **complete** page with ALL existing elements first, exactly as they appear in the current UI/code. Only then mark changes.
- Mark new/modified/removed elements with `[NEW]`/`[MODIFIED]`/`[REMOVED]` prefix on their label text.
- **Notes on incremental pages**: Only write notes for `[NEW]` and `[MODIFIED]` elements. Do NOT re-describe unchanged elements that already exist in the original page. If an element has no `[NEW]`/`[MODIFIED]` tag, it needs no note.
- The reader must be able to see both the complete page context AND exactly what changed, without wading through descriptions of unchanged parts.

## 5. Wireframe Coverage
- Any visually separate UI (modals, drawers, popovers, dropdowns) must have its own wireframe.
- Tooltips and toasts are described in the trigger element's note.

## 6. Color & Spacing (Fallback)
- Use project code values first. Fallback: Tailwind color palette. Font 13px, line height 22px.

## 7. High-Fidelity Rendering
- Wireframes must approximate the actual visual density and proportion of the target UI, not abstract placeholders.
- Derive element sizes from real UI conventions: a typical table row is 48-56px tall, a form label is 80-120px wide, a primary button is 88-120px wide by 32-40px tall.
- Use actual brand/product colors extracted from the codebase. Never default to generic grays when the project has a defined palette.
- Replicate the real visual hierarchy: card shadows, section dividers, status badges with proper background/text color pairs, icon placeholders at realistic sizes.
- Group related elements with proper spacing and alignment; the wireframe should look like a monochrome/styled screenshot of the finished page, not a wireframe sketch.
- When code is available, derive every color, size, and layout from it. Only fall back to standards when no code reference exists.

## 8. Scenario Dimensions (See `references/syntax.md` for container formulas)
- **Mobile:** w=390 h=844. Touch targets 44px+. Bottom nav.
- **Web:** w=1440 h=900. Top nav.
- **Admin:** w=1440 h=900. Sidebar 200-280px + Main.

## 9. Layout Calculation Formulas
- `Container Width` (Mobile: 390, Web: 1440, Admin: 1440)
- `Content Width = Container Width - 2*padding`
- `Element Y = Previous_Element_Y + Previous_Element_H + gap`
- `gap`: label-to-input 4-8px, group-to-group 12-16px, section-to-section 24-32px.
- **Modals:** Centered box w=400-800, backdrop bg=#000000 opacity=0.5.
- **Reference Strategy:** Extract layout from code first, use these formulas only as fallback.