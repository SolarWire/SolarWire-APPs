# SolarWire Note Writing Guide

> This guide defines how to write notes in SolarWire wireframes.
> Notes are the core mechanism for describing element functionality and business logic within wireframes.
> **核心示例**：Section 10 保留了两对核心 Good/Bad 对比（Button 和 Data Table）。所有其他元素类型遵循相同的 EARS 格式和禁止内容规则。

---

## Table of Contents

1. [When to Write Notes / When to Skip](#1-when-to-write-notes--when-to-skip)
2. [Note Structure Format](#2-note-structure-format)
3. [First Line: Element Definition](#3-first-line-element-definition)
4. [Universal Note Template](#4-universal-note-template)
5. [Note Writing Principles](#5-note-writing-principles)
6. [Common Mistakes](#6-common-mistakes)
7. [Data Format Specifications](#7-data-format-specifications)
8. [Content Forbidden in Notes](#8-content-forbidden-in-notes)
9. [i18n Support Rules](#9-i18n-support-rules)
10. [Good vs Bad Note Examples](#10-good-vs-bad-note-examples)

---

## 1. When to Write Notes / When to Skip

### Write notes for:
- Interactive elements (buttons, links, etc.)
- Input elements with validation or logic
- Dropdowns (selection behavior, options source)
- Data display elements with complex rules (tables, lists)
- Elements with business logic (calculations, conditions)
- Complex concepts requiring additional explanation

### Skip notes for:
- Pure visual elements (dividers, containers, decorative icons)
- Static labels and titles

### Common Sense Exemption (no note needed unless special behavior):
- Back button (standard behavior: return to previous page)
- Close button
- Page selector
- Number stepper/incrementer

**Important:** If exempted elements have special validation or interaction, they MUST be documented.

---

## 2. Note Structure Format

**Format Rules:**
```
First line: Element definition (what this element is, NOT element type)
First level: Numbered (1. 2. 3.)
Second level: - (dash)
Third level: -- (double dash)
```

**Example:**
```solarwire
["Enter password"] @(100,100) w=280 h=40 note="""Password input
1. Input rules
   - Password displayed as dots
   - Minimum 6 characters, maximum 32 characters
   - Must contain both letters and numbers
2. Interaction
   - Show/hide toggle icon on right
   - Validate format on blur
   - Display error on format failure: 'Invalid password format'
3. Special notes
   - Lock account for 15 minutes after 5 consecutive errors"""
```

---

## 3. First Line: Element Definition

The first line of a note MUST define what this element is (functional description, NOT element type).

| Correct | Incorrect |
|---------|-----------|
| `Password input` | `[Password Field]` |
| `Username input` | `[Input Field]` |
| `User data table` | `[Data Table]` |
| `Submit form button` | `[Primary Button]` |
| `Customer level dropdown` | `[Select Component]` |
| `Order total amount` | `[Calculated Field]` |

---

## 4. Universal Note Template

All notes follow the same structure. Use applicable sections based on element type.

```
[Element functional description]
1. [Primary behavior section]
   - Condition-action pairs (When/While/If/Always)
2. [Secondary behavior section]
   - Condition-action pairs
3. [Additional sections as needed]
```

### Section Selection by Element Type

| Element Type | Required Sections |
|-------------|-------------------|
| Button/Action | Permission control, Click action, Success handling, Failure handling, Disabled conditions |
| Input Field | Input rules, Validation, Business rules |
| Data Table | Data source, Display rules, Actions column, Sorting/Filtering |
| Dropdown/Select | Data source (options), Display rules, Business rules |
| Search/Filter | Input rules, Search behavior, Search scope, No results handling |
| Form | Pre-submission validation, Submission state, Success/Failure handling |
| Tooltip/Toast | Describe in triggering element's note (no separate wireframe) |

// See Section 10 for core Good/Bad examples; follow same pattern.

**Important**: When displaying multi-column structured data, always use the `##` table syntax. Do not simulate tables with aligned Rectangles.

---

### Empty State Handling

| Data Type | Empty Display | Example |
|-----------|---------------|---------|
| Text | '-' or 'Not set' | "Contact: -" |
| Number | '0' or '--' | "Amount: ¥ --" |
| Date | '-' or 'Not specified' | "Last login: -" |
| Status | Default status | "Status: Pending" |
| List/Table | Empty state message | "No data available" |

---

### Tooltip/Toast

Describe directly in note, no separate wireframe needed.

**Tooltip Example:**
```solarwire
["?"] @(100,50) w=16 h=16 note="""Help icon
1. Tooltip content
   - Hover to show: 'Supports phone number or email login'
   - Position: Top of icon
   - Max width: 200px, wrap text if needed"""
```

**Toast Example (describe in button note):**
```solarwire
["Save"] @(100,50) w=80 h=36 note="""Save button
1. Click action
   - Validate and save form data
2. Success handling
   - Toast: 'Saved successfully' (auto-dismiss after 3s)
3. Failure handling
   - Toast: 'Save failed, please retry' (manual dismiss)"""
```

---

## 5. Note Writing Principles

| Principle | Description |
|-----------|-------------|
| **Necessity** | Only write for meaningful elements, avoid over-documentation |
| **Completeness** | Fully describe element, cover all aspects |
| **Single Responsibility** | Only describe current element; affected elements document in their own notes |
| **Organization** | Use standard format, clear hierarchy |
| **Self-explanatory** | Element definition should be clear, no need for secondary explanation |
| **Business-focused** | Describe business logic, avoid technical implementation details |
| **Action-oriented** | Describe behavior with condition-action pairs, not just state enumeration |

### EARS Description Style

Use condition-action patterns to describe element behavior. This makes notes unambiguous and directly understandable by developers.

**Pattern Templates:**

| Pattern | Template | When to Use |
|---------|----------|-------------|
| **Always** | Always [behavior] | Behavior that always applies |
| **When** | When [event/trigger], [behavior] | User action or event triggers behavior |
| **While** | While [condition], [behavior] | Behavior applies during a specific state |
| **If** | If [condition], [behavior] | Exception or boundary condition handling |

**Key Rules:**
- Every behavior MUST have a trigger condition (When/While/If) or be always true (Always)
- Avoid bare enumerations like "Status: 1=Active" — describe what happens in each state
- Error messages MUST be quoted exactly as the user sees them
- Conditions MUST be specific, not vague ("If format is invalid" not "If error")

---

## 6. Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing Permission Control | No visibility/disabled rules | Add who can see/use element |
| Incomplete Error Handling | Only generic "show error" | List all error types: validation, network, server, timeout, permission |
| Missing Data Source Details | Just "User data" | Add business scope, filters, sort, permission |
| Wrong First Line | "[Primary Button]" | Use functional description: "Login button" |
| Visual Details in Note | "Blue background, 14px font" | Remove, these are shown in wireframe |
| Technical Implementation | "API: POST /api/login" | Remove, this is technical detail |
| Over-documenting | Notes on every element | Skip notes for visual/static elements |
| Simulating tables with Rectangles | Multiple `[""]` aligned as columns | Use `##` table syntax instead |

---

## 7. Data Format Specifications

When describing data display, specify format rules for:

- **Dates**: Always specify format (e.g., YYYY-MM-DD, YYYY-MM-DD HH:mm, relative time within X days)
- **Numbers**: Specify decimal places, thousand separators, currency symbol, percentage format
- **Sensitive text**: Specify masking rules (e.g., phone: 138****8000, ID: 110***********1234)
- **Long text**: Specify truncation rule (e.g., truncate with ellipsis beyond 50 chars)
- **Empty values**: Specify display for each field type (text: '-', number: '0' or '--', date: '-', list: 'No data')

---

## 8. Content Forbidden in Notes

**NEVER include:**

| Forbidden | Example (Don't Write) |
|-----------|----------------------|
| Colors | "Button is blue", "Text color #333" |
| Fonts | "Font size 14px", "Bold text" |
| Sizes | "Width 100px", "Height 40px" |
| Spacing | "Margin 16px", "Padding 8px" |
| Border | "Border radius 8px" |
| Shadows | "Box shadow 0.2px 4px" |
| Animations | "Fade in 0.3s" |
| Technical details | "API: /api/login", "Database: user_id" |
| CSS properties | "display: flex", "position: absolute" |
| Component names | "Use Ant Design Table", "React Component" |

**Why?** These are:
- Already shown visually in wireframe
- Design decisions to be made later
- Subject to change during implementation
- Technical implementation details, not business requirements

---

## 9. i18n Support Rules

**CRITICAL: Only add i18n when user explicitly confirms multi-language support is needed**

### If user does NOT need multi-language:
- Do NOT add any i18n information to any element
- Write notes in the user's primary language only

### If user confirms multi-language support:
- ALL meaningful text elements MUST include i18n translations
- Use full language names (e.g., "English", "中文", "日本語") instead of language codes
- Default language is based on user's primary language

### i18n Format

**Single element:** `i18n: Language1=Text1, Language2=Text2`

```solarwire
["Login"] @(100,50) w=100 h=40 note="""Login button
1. Click action
   - When clicked, validate username and password
2. i18n: English=Login, 中文=登录, 日本語=ログイン"""
```

**Table/dropdown with multiple fields:** Declare languages once, use `[Text1/Text2/Text3]` per field.

```solarwire
## @(100,50) w=600 border=1 note="""User list table
1. Fields (i18n: English/中文/日本語)
   - Name: User display name [Name/用户名/ユーザー名]
   - Status: While 1, show 'Active'; While 0, show 'Disabled' [Status/状态/ステータス]
     - Values: Active/正常/有効, Disabled/禁用/無効"""
```

---

## 10. Good vs Bad Note Examples

### Bad Note (Visual details + element type label + technical implementation)

```solarwire
["Login"] @(100,50) w=100 h=40 note="""[Primary Button]
- Blue background, white text
- Border radius 8px
- API: POST /api/auth/login"""
```

**Problems**: First line is element type; contains visual details and technical implementation.

### Good Note (Functional behavior with EARS style)

```solarwire
["Login"] @(100,50) w=100 h=40 align=c vertical-align=m note="""Login button
1. Click action
   - When clicked, validate username and password
2. Success handling
   - When login succeeds, save login state and redirect to homepage
3. Failure handling
   - If credentials are invalid, display error 'Invalid credentials'
   - If network error, display toast 'Network error, please try again'
4. Disabled conditions
   - While username or password is empty, button is disabled"""
```

### Bad Note (Data Table — state enumeration + visual details + missing data source)

```solarwire
## @(100,50) w=600 border=1 note="""[Data Table]
- Columns: Name, Status, Phone, Created
- Status: 1=Active, 0=Disabled
- Alternating row colors: #F9FAFB / #FFFFFF
- Border: 1px solid #E5E7EB"""
```

**Problems**: First line is element type; state enumeration instead of condition-action; visual details; no data source, no actions, no sorting.

### Good Note (Data Table — condition-action with EARS style)

```solarwire
## @(100,50) w=600 border=1 note="""User list table
1. Data source
   - Always shows users from User Management module
   - Always filters by current user's department (data permission)
   - Default sort: Created time descending
2. Display rules
   - When Name is not set, display '-' as placeholder
   - While status is Active, show green tag with text 'Active'
   - While status is Disabled, show red tag with text 'Disabled'
   - Always format phone as 138****8000
   - Always format created time as YYYY-MM-DD HH:mm
   - If no data, show 'No data' with illustration
3. Actions column
   - View: Always visible
   - Edit: Visible while status is Active
4. Sorting
   - When clicking column header, toggle ascending/descending sort"""
```