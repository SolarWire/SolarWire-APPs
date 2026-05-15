# SolarWire Wireframe Standards

> These rules are always in effect. For full syntax, see `references/syntax.md`.

## 1. Element Selection
- Use `[" "]` for buttons/inputs. Use `" "` for plain labels.
- Never simulate tables with Rectangles; always use `##`.

## 2. Container Rules
- Every page starts with `[] @(0,0) w=... h=... bg=#FFFFFF b=#FFFFFF`.
- Container must not have shadows or round corners.

## 3. Page Completeness
- Every wireframe must be a complete page frame, including top bar, sidebar, etc. These global elements need no detailed notes.

## 4. Incremental Pages
- Redraw the complete page. Mark new/modified/removed elements with `[NEW]`/`[MODIFIED]`/`[REMOVED]`.

## 5. Wireframe Coverage
- Any visually separate UI (modals, drawers, popovers, dropdowns) must have its own wireframe.
- Tooltips and toasts are described in the trigger element's note.

## 6. Color & Spacing (Fallback)
- Use project code values first. Fallback: Tailwind color palette. Font 13px, line height 22px.

## 7. Scenario Dimensions (See `references/syntax.md` for container formulas)
- **Mobile:** w=390 h=844. Touch targets 44px+. Bottom nav.
- **Web:** w=1440 h=900. Top nav.
- **Admin:** w=1440 h=900. Sidebar 200-280px + Main.

## 8. Layout Calculation Formulas
- `Container Width` (Mobile: 390, Web: 1440, Admin: 1440)
- `Content Width = Container Width - 2*padding`
- `Element Y = Previous_Element_Y + Previous_Element_H + gap`
- `gap`: label-to-input 4-8px, group-to-group 12-16px, section-to-section 24-32px.
- **Modals:** Centered box w=400-800, backdrop bg=#000000 opacity=0.5.
- **Reference Strategy:** Extract layout from code first, use these formulas only as fallback.