# SolarWire Note Writing Guide

> This guide defines how to write notes in SolarWire wireframes.
> Notes are the core mechanism for describing element functionality and business logic within wireframes.

---

## Table of Contents

1. [When to Write Notes / When to Skip](#1-when-to-write-notes--when-to-skip)
2. [Note Structure Format](#2-note-structure-format)
3. [First Line: Element Definition](#3-first-line-element-definition)
4. [Content Requirements by Element Type](#4-content-requirements-by-element-type)
5. [Note Writing Principles](#5-note-writing-principles)
6. [Required Content Quick Reference by Element Type](#6-required-content-quick-reference-by-element-type)
7. [Common Mistakes](#7-common-mistakes)
8. [Data Format Specifications](#8-data-format-specifications)
9. [Content Forbidden in Notes](#9-content-forbidden-in-notes)
10. [i18n Support Rules](#10-i18n-support-rules)
11. [Good vs Bad Note Examples](#11-good-vs-bad-note-examples)

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

## 4. Content Requirements by Element Type

### Interactive/Operational Elements

Must include:
- What happens on click/operation
- Success/failure handling
- Disabled conditions
- Special handling (debounce, throttle, etc.)

**Example:**
```solarwire
["Delete"] @(100,50) w=80 h=36 note="""Delete button
1. Permission control
   - Visible: Users with 'delete_permission' role
   - Hidden: Users without permission (not just disabled)
   - Disabled: When item status is 'locked' or 'archived'
2. Click action
   - Show confirmation modal: 'Are you sure you want to delete?'
   - Execute delete on confirmation
3. Success handling
   - Display Toast: 'Deleted successfully'
   - Refresh list data
   - Update related statistics
4. Failure handling
   - Permission denied: 'You do not have permission to delete'
   - Item locked: 'This item is locked and cannot be deleted'
   - Network error: 'Network error, please try again'
   - Server error: 'Operation failed, please contact support'
5. Loading state
   - Show loading spinner while deleting
   - Disable button during operation
   - Prevent double-click"""
```

---

### Elements with Logic

Must include:
- Show/hide conditions
- Calculation rules
- Validation rules
- State transitions

---

### Data Display Elements

Must include ALL of the following sections:

| Section | Required | Description |
|---------|----------|-------------|
| **1. Data source** | Required | Where data comes from, filtering conditions, sorting rules |
| **2. Display rules** | Required | Field meanings, formats, empty value handling |
| **3. Business rules** | Optional | Status mappings, conditional display, calculations |
| **4. Sorting/Filtering** | Optional | If applicable, describe sorting and filtering behavior |

**Example:**
```solarwire
## @(100,50) w=600 border=1 note="""Customer list table
1. Data source
   - Customer data from Customer Management module
   - Filter: Current user's customers (based on data permission)
   - Default sort: Last follow-up time descending
2. Display rules
   - Customer name: Company name, required field
   - Contact: Primary contact name, show '-' if not set
   - Phone: Format as '138****8000' (mask middle 4 digits)
   - Status: Show as tag with color (Active=green, Frozen=red, Public Pool=gray)
   - Created: Format as YYYY-MM-DD, show relative time within 7 days
   - Empty state: Show 'No data' with illustration when list is empty
3. Business rules
   - Status mapping: 1=Active, 2=Frozen, 3=Public Pool
   - VIP customers: Show gold star icon before name
   - Overdue follow-up: Highlight row in yellow if >7 days since last follow-up
4. Sorting
   - Support sorting by: Created time, Last follow-up time, Customer level
   - Click column header to toggle ascending/descending"""
```

---

### Input Fields

Must include:
- Input rules (format, length, allowed characters)
- Validation (required, format check, error messages)
- Business rules (unique check, duplicate check)

**Example:**
```solarwire
["Enter phone number"] @(100,50) w=280 h=40 note="""Phone number input
1. Input rules
   - Format: 11-digit mobile number
   - Allowed characters: Digits only
   - Max length: 11 characters
2. Validation
   - Required: Cannot be empty
   - Format check: Must start with 1, second digit 3-9
   - Error message: 'Please enter a valid phone number'
   - Validate on: Blur (not on every keystroke)
3. Business rules
   - Unique: Phone number must not already exist in system
   - Duplicate check: On blur, show 'Phone number already exists' if duplicate"""
```

---

### Dropdowns/Selects

Must include:
- Data source (options source, static or dynamic)
- Display rules (default, selected, options list)
- Business rules (required, default value, dependencies)

**Example:**
```solarwire
["Select customer level"] @(100,50) w=200 h=36 note="""Customer level dropdown
1. Data source
   - Options from system dictionary 'customer_level'
   - Values: VIP, Important, Normal
2. Display rules
   - Default: Show placeholder 'Select customer level'
   - Selected: Show selected option text
   - Options list: Show all options with icons (VIP=star, Important=dot, Normal=circle)
3. Business rules
   - Required field: Must select one option
   - Default value for new customer: Normal
   - VIP level requires manager approval to assign"""
```

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

---

## 6. Required Content Quick Reference by Element Type

### Buttons/Actions
- Permission control
- Click action
- Success handling
- Failure handling (all error types)
- Optional: Disabled conditions, Loading state

### Input Fields
- Input rules (format, length, allowed characters)
- Validation (required, format check, error messages)
- Optional: Display rules, Business rules

### Data Tables
- Data source (module, filters, default sort)
- Display rules (field formats, empty handling, status colors)
- Actions column (available actions, visibility, permissions)
- Optional: Sorting/Filtering, Pagination, Row behavior

### Search/Filter
- Input rules
- Search behavior (debounce, trigger, clear)
- Search scope (fields, match type)
- No results handling

### Dropdowns/Selects
- Data source (options source)
- Display rules (default, selected, options list)
- Optional: Business rules, Loading behavior

### Forms
- Pre-submission validation
- Submission state (loading, disabled, double-click protection)
- Success handling
- Failure handling (all error types)
- Optional: Retry mechanism

---

## 7. Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing Permission Control | No visibility/disabled rules | Add who can see/use element |
| Incomplete Error Handling | Only generic "show error" | List all error types: validation, network, server, timeout, permission |
| Missing Data Source Details | Just "User data" | Add module, filters, sort, permission |
| Wrong First Line | "[Primary Button]" | Use functional description: "Login button" |
| Visual Details in Note | "Blue background, 14px font" | Remove, these are shown in wireframe |
| Technical Implementation | "API: POST /api/login" | Remove, this is technical detail |
| Over-documenting | Notes on every element | Skip notes for visual/static elements |

---

## 8. Data Format Specifications

When describing data display, always specify format rules:

### Date/Time Formats

| Type | Format | Example |
|------|--------|---------|
| Date only | YYYY-MM-DD | 2024-01-25 |
| Date with time | YYYY-MM-DD HH:mm | 2024-01-25 14:30 |
| Full datetime | YYYY-MM-DD HH:mm:ss | 2024-01-25 14:30:45 |
| Relative time | Within X days show relative | "3 days ago", "Just now" |
| Time only | HH:mm | 14:30 |

### Number Formats

| Type | Format | Example |
|------|--------|---------|
| Integer | With thousand separators | 1,234 |
| Decimal | 2 decimal places | 1,234.56 |
| Currency | With symbol and separators | ¥1,234.56 |
| Percentage | With % symbol | 68.5% |
| Large numbers | Abbreviated | 1.23万, 1.5M |

### Text Formats

| Type | Handling | Example |
|------|----------|---------|
| Long text | Truncate with ellipsis | "Long text content..." |
| Phone | Mask sensitive digits | 138****8000 |
| Email | Show full or truncate | zhang@example.com |
| ID | Partial mask | 110***********1234 |

### Status/Tag Display

Always describe status values with their visual representation:

```solarwire
"Following" @(100,50) note="""Lead status
1. Display rules
   - Status values with visual style:
     - Unassigned: Gray tag (#D1D5DB background)
     - Following: Blue tag (#3B82F6 background)
     - Converted: Green tag (#22C55E background)
     - Invalid: Red tag (#EF4444 background)
   - All tags: White text, rounded corners"""
```

---

## 9. Content Forbidden in Notes

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

## 10. i18n Support Rules

**CRITICAL: Only add i18n when user explicitly confirms multi-language support is needed**

### If user does NOT need multi-language:
- Do NOT add any i18n information to any element
- Write notes in the user's primary language only

### If user confirms multi-language support:
- ALL meaningful text elements MUST include i18n translations
- Use full language names (e.g., "English", "中文", "日本語") instead of language codes
- Default language is based on user's primary language

### i18n Format for Single Text Element

```solarwire
["Login"] @(100,50) w=100 h=40 note="""Login button
1. Click action
   - Validate username and password
2. i18n: English=Login, 中文=登录, 日本語=ログイン"""
```

**Format:** `i18n: Language1=Text1, Language2=Text2, Language3=Text3`

**Important:** Use single quotes `'` for text values inside i18n if they contain special characters.
- Correct: `i18n: English=Login, 中文='登录', 日本語='ログイン'`
- Incorrect: `i18n: English=Login, 中文="登录", 日本語="ログイン"`

### i18n Format for Table with Multiple Fields

Use compact format with language names declared once:

```solarwire
## @(100,50) w=600 border=1 note="""User list table
1. Data source
   - User list data from User Management module
2. Fields (i18n: English/中文/日本語)
   - ID: Unique user identifier [ID/ID/ID]
   - Name: User display name [Name/用户名/ユーザー名]
   - Status: 1=Active, 0=Disabled [Status/状态/ステータス]
     - Values: Active/正常/有効, Disabled/禁用/無効
   - Created: Account creation time [Created/创建时间/作成日時]
   - Actions: View and edit operations [Actions/操作/操作]
3. Buttons (i18n: English/中文/日本語)
   - View [View/查看/表示]
   - Edit [Edit/编辑/編集]
   - Delete [Delete/删除/削除]"""
```

**Format for table fields:**
- Declare languages once: `Fields (i18n: Language1/Language2/Language3)`
- Each field: `- FieldName: Description [Text1/Text2/Text3]`
- Status values: `Values: Value1/Lang1/Lang2, Value2/Lang1/Lang2`

### i18n Format for Dropdown Options

```solarwire
["Select status"] @(100,50) w=200 h=36 note="""Status dropdown
1. Options (i18n: English/中文/日本語)
   - All [All/全部/すべて]
   - Active [Active/正常/有効]
   - Disabled [Disabled/禁用/無効]
2. Default: All"""
```

### i18n Format for Error/Success Messages

```solarwire
["Submit"] @(100,50) w=100 h=40 note="""Submit button
1. Click action
   - Validate and submit form data
2. Success message
   - i18n: English=Submitted successfully, 中文=提交成功, 日本語=送信成功
3. Error messages
   - Network error: i18n: English=Network error, please try again, 中文=网络错误，请重试, 日本語=ネットワークエラー、再試行してください
   - Validation error: i18n: English=Please check your input, 中文=请检查您的输入, 日本語=入力内容を確認してください"""
```

---

## 11. Good vs Bad Note Examples

### Bad Note (Visual details + element type label)

```solarwire
["Login"] @(100,50) w=100 h=40 note="""[Primary Button]
- Blue background, white text
- Border radius 8px
- API: POST /api/auth/login"""
```

**Problems:**
- First line is element type, not functional description
- Contains visual details (color, border radius)
- Contains technical implementation (API endpoint)

### Good Note (Functional behavior)

```solarwire
["Login"] @(100,50) w=100 h=40 note="""Login button
1. Click action
   - Validate username and password
2. Success handling
   - Save login state
   - Redirect to homepage
3. Failure handling
   - Display error: 'Invalid credentials'
4. Disabled conditions
   - Disabled when username or password is empty"""
```

**Strengths:**
- First line is functional description
- Describes behavior, not appearance
- Covers all interaction scenarios
- No technical implementation details

### No Note Needed (Visual element)

```solarwire
-- @(0,100)->(400,100) b=#E5E7EB
```

**Why no note:** Divider line is a pure visual element with no functional behavior.

### Bad Data Table Note

```solarwire
## @(100,50) w=600 border=1 note="""User list table
1. Data source
   - User data
2. Display rules
   - Name: User name
   - Status: User status"""
```

**Problems:**
- Vague data source
- No filter, sort, or permission info
- No field format details
- No empty state handling

### Good Data Table Note

```solarwire
## @(100,50) w=600 border=1 note="""User list table
1. Data source
   - User data from User Management module
   - Filter: Active users only (status=1)
   - Default sort: Created time descending
   - Permission: Current user's department users
2. Display rules
   - Name: Full name, required, click to view detail
   - Status: 1=Active (green), 0=Disabled (red)
   - Phone: Format as 138****8000
   - Created: YYYY-MM-DD HH:mm
   - Empty: Show 'No data' with illustration
3. Actions column
   - View: Always visible
   - Edit: Visible for Active status
   - Disable: Visible for Active status, requires permission
4. Sorting
   - Support: Name, Created time, Status
   - Click header to toggle sort"""
```

### Bad Input Field Note

```solarwire
["Enter email"] @(100,50) w=280 h=40 note="""Email input
1. Input rules
   - Enter email"""
```

**Problems:**
- No validation rules
- No error messages
- No format requirements

### Good Input Field Note

```solarwire
["Enter email"] @(100,50) w=280 h=40 note="""Email input
1. Input rules
   - Format: Standard email format
   - Max length: 100 characters
   - Auto-trim leading/trailing spaces
2. Validation
   - Required: Cannot be empty
   - Format check: Must match email pattern
   - Error message: 'Please enter a valid email address'
   - Validate on: Blur
3. Business rules
   - Unique: Email must not already exist in system
   - Duplicate check: On blur, show 'Email already registered' if duplicate"""
```
