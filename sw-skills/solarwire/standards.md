# SolarWire Wireframe Standards

> This document defines the standards for creating SolarWire wireframes in PRD documents.
> For note writing rules, see [note-guide.md](note-guide.md).
> For syntax validation, refer to the solarwire-syntax skill.

---

## Table of Contents

1. [Syntax Rules](#1-syntax-rules)
2. [Element Selection Principles](#2-element-selection-principles)
3. [Coordinate System](#3-coordinate-system)
4. [Page Organization Rules](#4-page-organization-rules)
5. [Container Rectangle Requirements](#5-container-rectangle-requirements)
6. [Page Presentation Rules](#6-page-presentation-rules)
7. [Field Presentation Rules](#7-field-presentation-rules)
8. [Color Standards](#8-color-standards)
9. [Spacing Standards](#9-spacing-standards)
10. [Scenario Specifications](#10-scenario-specifications)
11. [Modal Presentation Rules](#11-modal-presentation-rules)
12. [Delta Only Rules for Modified Pages](#12-delta-only-rules-for-modified-pages)

---

## 1. Syntax Rules

Key syntax rules (see [syntax.md](syntax.md) for complete reference):

1. All elements must have coordinates `@(x,y)`
2. NOTE must use triple quotes: `note="""..."""` (never single/double quotes)
3. Border color: `b=`, border width: `s=` (NOT `stroke`/`strokeWidth`)
4. Forbidden attributes: `multiline`, `truncate`, `stroke`, `strokeWidth`
5. Table cells/rows cannot specify `@(x,y)`, `w`, `h`

---

## 2. Element Selection Principles

Choose appropriate element types based on actual UI components:

| Scenario | Recommended Element | Example |
|----------|---------------------|---------|
| Primary Buttons | Rectangle `[]` with background color | `["Login"] @(100,50) w=100 h=40 bg=#3B82F6 c=#FFFFFF` |
| Secondary Buttons | Rectangle `[]` with border | `["Cancel"] @(220,50) w=80 h=40 bg=#FFFFFF b=#E5E7EB` |
| Cards/Containers | Rectangle with `r` attribute | `["User Info Card"] @(100,50) w=300 h=200 r=8` |
| Avatars | Circle with placeholder | `("A") @(100,50) w=40 bg=#E5E7EB c=#6B7280` |
| Icon Buttons | Circle with icon text | `("?") @(100,50) w=32 h=32 bg=#E5E7EB` |
| Labels/Text | Plain Text `""` | `"Username" @(100,50)` |
| Input Fields | Rectangle with placeholder | `["Enter username..."] @(100,50) w=280 h=40 bg=#FFFFFF b=#E5E7EB c=#9CA3AF` |
| Dividers | Line `--` | `-- @(0,100)->(400,100) b=#E5E7EB` |
| Data Tables | Table `##` | `## @(100,50) w=500 border=1` |

**Common Mistakes to Avoid:**
- Using placeholder `[?]` for buttons (use `["Button Text"]` instead)
- Using rectangle `[]` for plain labels (use `"Label"` instead)
- Overcrowding elements - use 10px spacing

---

## 3. Coordinate System

### Anchor Point Rule

All elements use the **top-left corner** as the coordinate anchor point `@(x,y)`.

```
     (x,y) ← anchor point
       ┌─────────────────┐
       │                 │
       │    Element      │ h (height)
       │                 │
       └─────────────────┘
              w (width)
```

### Text Alignment Calculation

When aligning text with other elements (like labels inside buttons), the text Y coordinate is NOT the center of the target element.

| Standard | Value |
|----------|-------|
| Default font size | 13px |
| Default line height | 22px |
| Text baseline offset | ~7px from top |

**Alignment Formula:**
```
Text Y = Target_Y + (Target_Height - Line_Height) / 2 + Baseline_Adjustment
```

**Examples:**

```solarwire
["Submit"] @(100,100) w=100 h=40 bg=#3B82F6 c=#FFFFFF

"Username" @(100,175)
["Enter username"] @(100,200) w=280 h=40 bg=#FFFFFF b=#E5E7EB

"Submit" @(120,109) c=#FFFFFF
```

### Circle Anchor Point Calculation

Since all elements use top-left corner as anchor, to place a circle's center at a specific point:

```
Circle center: (cx, cy)
Circle diameter: d (width = height = d)
Radius: r = d / 2

Top-left anchor: (cx - r, cy - r)
```

**Example:**
```
// Want circle center at (80, 280) with diameter 8
// Radius = 4
// Anchor = (80-4, 280-4) = (76, 276)
() @(76,276) w=8 h=8 bg=#3B82F6
```

---

## 4. Page Organization Rules

**Each SolarWire code block handles only one independent view:**

| Situation | Handling Method | Example |
|-----------|-----------------|---------|
| Modals/Dialogs | Separate SolarWire fragment | `### 5.2 Login Failed Modal` + independent code block |
| Different Page States | Separate fragment for each state | `### 5.3 Login Page - Loading State`, `### 5.4 Login Page - Error State` |
| Tab Switching | Separate fragment for each tab | `### 5.5 Settings Page - Basic Info Tab`, `### 5.6 Settings Page - Security Tab` |

**Do not mix multiple view states in one code block.**

---

## 5. Container Rectangle Requirements

**Every page must have a container rectangle:**

```solarwire
!title="Page Name"
!c=#111827
!size=13
!bg=#F9FAFB

[] @(0,0) w=375 h=812 bg=#FFFFFF

// Page content...
```

**Container Rectangle Specifications:**
- Place at the beginning of the code block
- Use `[]` rectangle (don't display text content)
- `bg=#FFFFFF` white background
- Dimensions by scenario:
  - Mobile: `w=375 h=812` (iPhone X) or `w=390 h=844` (iPhone 12+)
  - Web: `w=1440 h=900` or as needed
  - Admin Dashboard: `w=1920 h=1080`

**Container Size Principle: Container must contain all child elements**

**Forbidden: Child elements extending beyond parent container boundaries.**

---

## 6. Page Presentation Rules

| Scenario | Handling |
|-----------|----------|
| New page | Draw all elements completely, including navigation, menu, etc. |
| Redesign page | Redraw completely |
| Modified page (incremental) | Only describe changed elements (Delta Only, see Section 12) |
| Minor changes to existing page | Mark only changed parts on original wireframe; existing parts not modified or explained |
| New content on existing page | Add new elements to original wireframe |

**Completeness Requirements:**
- Pages must show all elements completely, including navigation, menu and common parts
- Within the same requirement, common parts already explained in other pages do not need to be repeated
- Ensure developers have a clear concept of relative element positions on each page

---

## 7. Field Presentation Rules

| Rule | Description |
|------|-------------|
| Field grouping | Group fields when there are many, for better user understanding |
| Field naming | Use common, user-friendly language; self-explanatory |
| Auxiliary explanation | When field name cannot be self-explanatory, explain via Tooltip, etc. |

---

## 8. Color Standards

**All colors follow Tailwind CSS design system for modern, consistent UI.**

### Core Colors

| Purpose | Tailwind | Hex | Usage |
|---------|----------|-----|-------|
| Primary text | gray-900 | `#111827` | Labels, headings, content |
| Secondary text | gray-500 | `#6B7280` | Descriptions, helper text |
| Tertiary text | gray-400 | `#9CA3AF` | Placeholder, timestamps |
| Page background | gray-50 | `#F9FAFB` | Page background |
| Card background | white | `#FFFFFF` | Cards, panels |
| Alternating row | gray-50 | `#F9FAFB` | Table alternating rows |
| Borders/Lines | gray-200 | `#E5E7EB` | Dividers, borders |

### Semantic Colors

| Purpose | Tailwind | Hex | Usage |
|---------|----------|-----|-------|
| Primary action | blue-500 | `#3B82F6` | Primary buttons, links |
| Primary light | blue-50 | `#EFF6FF` | Hover, selected background |
| Success | green-500 | `#22C55E` | Success states, positive |
| Success light | green-50 | `#F0FDF4` | Success background |
| Warning | amber-500 | `#F59E0B` | Warnings, attention |
| Warning light | amber-50 | `#FFFBEB` | Warning background |
| Error | red-500 | `#EF4444` | Errors, destructive |
| Error light | red-50 | `#FEF2F2` | Error background |
| Info | sky-500 | `#0EA5E9` | Information, tips |
| Info light | sky-50 | `#F0F9FF` | Info background |

### Extended Colors

| Purpose | Tailwind | Hex |
|---------|----------|-----|
| Secondary | purple-500 | `#A855F7` |
| Secondary light | purple-50 | `#FAF5FF` |
| Neutral | gray-400 | `#9CA3AF` |
| Neutral light | gray-100 | `#F3F4F6` |

### Chart Color Palette

| Purpose | Tailwind | Hex |
|---------|----------|-----|
| Primary | blue-500 | `#3B82F6` |
| Success | green-500 | `#22C55E` |
| Warning | amber-500 | `#F59E0B` |
| Error | red-500 | `#EF4444` |
| Info | sky-500 | `#0EA5E9` |
| Secondary | purple-500 | `#A855F7` |
| Neutral | gray-400 | `#9CA3AF` |

### Timeline Status Colors

| Status | Tailwind | Hex |
|--------|----------|-----|
| Completed | green-500 | `#22C55E` |
| In Progress | blue-500 | `#3B82F6` |
| Pending | gray-300 | `#D1D5DB` |
| Error | red-500 | `#EF4444` |
| Warning | amber-500 | `#F59E0B` |

---

## 9. Spacing Standards

| Rule | Value |
|------|-------|
| Element spacing | 10px (unified) |
| Font size | 13px |
| Line height | 22px |

### SolarWire Default Configuration

```solarwire
!title="Page Title"
!c=#111827
!size=13
!bg=#F9FAFB
```

### Other Rules

| Rule | Description |
|------|-------------|
| Images/Icons | Use sparingly in client pages to avoid affecting UI design |
| Shadows | Use sparingly |
| Layout | Clear structure, distinct functional areas |

---

## 10. Scenario Specifications

### Mobile App

**Characteristics:**
- Narrow canvas (375-430px)
- Vertical layout, bottom navigation
- Touch-friendly large buttons (min 44x44px)

**Container Size:** `w=375 h=812` (iPhone X) or `w=390 h=844` (iPhone 12+)

**Element Sizes:**
- Button height: 44-56px
- Input field height: 44-52px
- Text size: 13px (default), 18-22px (titles)
- Element spacing: 10px (unified), Page margins: 16-24px

**Common Patterns:**
- Login: Logo + Title + Form + Button (full width)
- List: Search bar + List items + Pull to refresh
- Detail: Back button + Title + Content + Bottom action

**Mobile-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| deviceToken | string | Device push token |
| deviceId | string | Device unique identifier |
| osType | string | iOS/Android |
| appVersion | string | App version |

**Mobile-specific Rules:**
- Support one-tap login, third-party login (WeChat, Apple ID)
- Token validity: 7 days
- Push notifications can be disabled

---

### Web Client

**Characteristics:**
- Wide canvas (1200-1440px)
- Horizontal layout, top navigation
- Moderate button/input sizes

**Container Size:** `w=1440 h=900`

**Element Sizes:**
- Button height: 36-48px, width: min 80px
- Input field height: 36-44px, width: 200-400px
- Text size: 13px (default), 18-24px (titles)
- Element spacing: 10px (unified), Page margins: 24-48px

**Common Patterns:**
- Login: Centered layout, Logo + Form + Button
- List: Search/filter bar + Data table + Pagination
- Detail: Breadcrumb + Title + Content cards + Actions

**Web-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Session ID |
| userAgent | string | Browser info |
| referrer | string | Source page |

**Web-specific Rules:**
- Support password, QR code, third-party login
- Session validity: 30 min inactivity auto-expire
- Browsers: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+

---

### Admin Dashboard

**Characteristics:**
- Very wide canvas (1440-1920px)
- Fixed left sidebar (200-280px)
- Data-intensive (tables, charts, cards)
- Many action buttons

**Container Size:** `w=1920 h=1080`

**Element Sizes:**
- Button height: 32-40px
- Input field height: 32-36px
- Table row height: 40-48px
- Sidebar width: 200-280px
- Text size: 13px (default), 16-20px (titles)
- Element spacing: 10px (unified), Page margins: 24-32px

**Common Patterns:**
- List: Search/filter + Batch actions + Table + Pagination
- Statistics: Multiple stat cards + Charts + Time selector
- Form: Breadcrumb + Multi-column form + Save/Cancel

**Admin-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| operatorId | string | Operator ID |
| operateTime | datetime | Operation time |
| operateType | string | Add/Edit/Delete/Export |
| ipAddress | string | Operation IP |

**Admin-specific Rules:**
- Super Admin: Full permissions
- Admin: View/Edit, no Delete
- Operator: View/Export only
- Pagination: 20 items/page, max 10000 export
- Sensitive operations require confirmation
- Login timeout: 30 min inactivity

---

## 11. Modal Presentation Rules

**All modals MUST have a separate SolarWire wireframe, not just a simple description in a note.**

### Modal Types

| Type | Description |
|------|-------------|
| Confirmation modal | Delete confirmation, operation confirmation, etc. |
| Form modal | Create, edit, etc. |
| Information modal | Detail view, etc. |
| Alert modal | Success, failure, warning, etc. |

### Modal vs Tooltip/Toast

| Type | Handling | Description |
|------|----------|-------------|
| Modal | Separate SolarWire wireframe | Complete UI, interactions, action buttons |
| Tooltip | Describe directly in note | Simple text hint, no interaction |
| Toast | Describe directly in note | Simple message, auto-dismiss |

### Modal Wireframe Structure

```solarwire
!title="[Page Name] - [Modal Name] Modal"
!c=#111827
!size=13
!bg=#F9FAFB

[] @(0,0) w=1440 h=900 bg=#000000 opacity=0.5

[] @(320,200) w=800 h=500 bg=#FFFFFF r=8 note="""[Modal description]
1. Trigger condition
   - [When this modal appears]
2. Close behavior
   - Click X button: Close without action
   - Click overlay: Close without action
   - Press ESC: Close without action"""

// Modal header
"[Modal Title]" @(360,230) size=18 bold
["X"] @(1080,230) w=32 h=32 bg=#FFFFFF note="""Close button
1. Click action
   - Close modal without action"""

// Modal content
// ... form fields, information, etc.

// Modal footer
["Cancel"] @(720,640) w=80 h=36 bg=#FFFFFF b=#E5E7EB note="""Cancel button
1. Click action
   - Close modal without saving"""
["Confirm"] @(820,640) w=80 h=36 bg=#3B82F6 c=#FFFFFF note="""Confirm button
1. Click action
   - Execute [action]
2. Success handling
   - Close modal
   - Refresh parent page
3. Failure handling
   - Show error message in modal"""
```

---

## 12. Delta Only Rules for Modified Pages

**Used for incremental feature PRDs when modifying existing pages. Only describe changed elements — do not copy or re-describe unchanged parts from old PRDs.**

### Change Type Markers

| Change Type | Note Prefix | Description |
|-------------|-------------|-------------|
| NEW | `[NEW]` | Brand new element added to the page |
| MODIFIED | `[MODIFIED]` + change description | Existing element with changes |
| REMOVED | `[REMOVED]` + reason | Element removed from the page |

### How to Apply Delta Only

1. For modified pages, only draw the changed elements in the wireframe
2. For NEW elements: Add with `[NEW]` note prefix
3. For MODIFIED elements: Add with `[MODIFIED]` note prefix and describe what changed (before→after)
4. For REMOVED elements: List in note only, do not draw
5. Do NOT copy unchanged elements from old PRDs

### Complete Example

```solarwire
!title="User Profile - Changes"
!c=#111827
!size=13
!bg=#F9FAFB

[] @(0,0) w=1440 h=900 bg=#FFFFFF

// Only changed elements are drawn below

["WeChat Login"] @(100,500) w=300 h=44 note="""[NEW] WeChat login button
1. Click action
   - When clicked, initiate WeChat authorization login
2. Success handling
   - When WeChat authorization succeeds, bind WeChat account and redirect to homepage"""

["Login"] @(100,450) w=300 h=48 note="""[MODIFIED] Login button
1. NEW: Loading state
   - While login is in progress, show loading spinner and disable button to prevent double-click
2. Existing behavior unchanged
   - When clicked, validate username and password
   - When login succeeds, save login state and redirect to homepage"""

// REMOVED elements are listed in note only, not drawn
```

### Modified Page Annotation in PRD

```markdown
### 5.x [Page Name] (Modified)

**Page Overview**: [One sentence description of what changed]
**Changes**: Only changed elements are shown below. Unchanged elements are not repeated.
```

### Change Summary Table

```markdown
## Change Summary
### Affected Pages
| Page | Change Type | Description |
|------|-------------|-------------|
| [Page 1] | Modified | [Brief description of what changed] |
| [Page 2] | New | [Brief description] |
```
