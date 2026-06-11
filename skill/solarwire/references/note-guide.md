# SolarWire Note Writing Guide
> These rules are always in effect. For element examples, see the bottom of this file.

## 1. Note Structure
- **First line:** Functional description (e.g., `Login button`), NOT element type (e.g., `[Primary Button]`).
- **Hierarchy:** Numbered list (1,2,3) -> dash (-) -> double dash (--).
- **Language:** All note content must be in the user's communication language.
- **Completeness over brevity:** Notes must describe behavior exhaustively. Do not trim or omit details to reduce output length. A note that is too short is worse than one that is slightly redundant.
- **Incremental pages:** Only write notes for elements marked `[NEW]` or `[MODIFIED]`. Elements without these tags are unchanged and need no notes. Do not re-describe existing behavior of unchanged elements.

## 2. EARS Writing Style
Every behavior must follow a condition-action pair. Use these patterns:
- **Always/Habitual**: `Always [behavior]`
- **When (Event)**: `When [event], [behavior]`
- **While (State)**: `While [state], [behavior]`
- **If (Exception)**: `If [condition], [behavior]`

## 3. Note Content by Element Type
- **Buttons**: Permission, Click action, Success/Failure handling, Disabled state.
- **Inputs**: Input rules, Validation, Business rules.
- **Tables**: Data source (business scope, filters, sort), Display rules, Actions column.
- **Dropdowns**: Options source, Default value, Selection behavior.
- **Tooltips/Toasts**: Describe directly in the triggering element's note; no separate wireframe is needed.

## 4. Data Format in Notes
- Always specify formats for dates, numbers, and empty states.
- When statuses are involved, describe them with conditions: `While status is 'Active', show green tag 'Active'`.

## 5. FORBIDDEN Content in Notes (Strictly Enforced)
**NEVER** include visual details (colors, fonts, sizes, spacing, animations) or technical details (API endpoints, "Postgres", db fields, "Use Ant Design Table").
**Exception**: Error messages that naturally contain numbers (e.g., 'Min. 6 characters') must be quoted verbatim.

## 6. i18n Rules (Conditional)
Only add i18n if explicitly confirmed by the user.
Format: `"i18n: English=Login, 中文=登录, 日本語=ログイン"`

## 7. Core Example
**BAD:**
```solarwire
["Login"] @(100,50) note="""[Button]
- Blue bg, API: /login"""
```
**GOOD:**
```solarwire
["Login"] @(x,y) w=100 h=40 note="""Login button
1. When clicked, validate credentials and submit
2. If successful, redirect to home
3. If fails, show toast 'Invalid credentials'"""
```