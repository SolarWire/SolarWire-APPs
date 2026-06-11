# SolarWire Wireframe Standards

> This document defines the standards for creating SolarWire wireframes in PRD documents.
> These rules are always in effect for any SolarWire task.
> For note writing rules, see [note-guide.md](note-guide.md).
> For syntax validation, refer to [syntax.md](syntax.md).

---

## Table of Contents

- [SolarWire Wireframe Standards](#solarwire-wireframe-standards)
  - [Table of Contents](#table-of-contents)
  - [1. Element Selection Principles](#1-element-selection-principles)
  - [2. Coordinate System](#2-coordinate-system)
    - [Anchor Point Rule](#anchor-point-rule)
    - [Text Alignment Calculation](#text-alignment-calculation)
    - [Circle Anchor Point Calculation](#circle-anchor-point-calculation)
  - [3. Page Organization Rules](#3-page-organization-rules)
  - [4. Container Rectangle Requirements](#4-container-rectangle-requirements)
  - [5. Page Presentation Rules](#5-page-presentation-rules)
  - [6. Field Presentation Rules](#6-field-presentation-rules)
  - [7. Color Standards](#7-color-standards)
    - [Core Colors](#core-colors)
    - [Semantic Colors](#semantic-colors)
    - [Timeline Status Colors](#timeline-status-colors)
  - [8. Scenario Specifications](#8-scenario-specifications)
    - [Mobile App](#mobile-app)
    - [Web Client](#web-client)
    - [Admin Dashboard](#admin-dashboard)
  - [9. Modal and Overlay Presentation Rules](#9-modal-and-overlay-presentation-rules)
    - [Overlay Types](#overlay-types)
    - [Modal vs Tooltip/Toast](#modal-vs-tooltiptoast)
  - [10. Incremental Page Wireframe Rules](#10-incremental-page-wireframe-rules)
    - [Core Principle](#core-principle)
    - [Change Type Markers](#change-type-markers)
    - [How to Draw Incremental Pages](#how-to-draw-incremental-pages)
    - [Drawing Guidelines](#drawing-guidelines)
    - [Modified Page Annotation in PRD](#modified-page-annotation-in-prd)
    - [Change Summary Table](#change-summary-table)
  - [11. Layout Calculation Rules](#11-layout-calculation-rules)
    - [Page Structure](#page-structure)
    - [Global UI Elements](#global-ui-elements)
    - [Vertical Spacing](#vertical-spacing)
    - [Common Element Dimensions](#common-element-dimensions)
    - [Multi-column Layout](#multi-column-layout)
    - [Modal Layout](#modal-layout)
    - [Coordinate Calculation Formulas](#coordinate-calculation-formulas)
    - [Layout Reference Strategy](#layout-reference-strategy)

---

## 1. Element Selection Principles

Choose appropriate element types based on actual UI components:

| Scenario | Recommended Element | Example |
|----------|---------------------|---------|
| Primary Buttons | Rectangle `[]` with background color | `["Login"] @(100,50) w=100 h=40 bg=#3B82F6 c=#FFFFFF align=c vertical-align=m` |
| Secondary Buttons | Rectangle `[]` with border | `["Cancel"] @(220,50) w=80 h=40 bg=#FFFFFF b=#E5E7EB align=c vertical-align=m` |
| Cards/Containers | Rectangle with `r` attribute | `["User Info Card"] @(100,50) w=300 h=200 r=8` |
| Avatars | Circle with placeholder | `("A") @(100,50) w=40 bg=#E5E7EB c=#6B7280` |
| Icon Buttons | Circle with icon text | `("?") @(100,50) w=32 h=32 bg=#E5E7EB` |
| Labels/Text | Plain Text `""` | `"Username" @(100,50)` |
| Input Fields | Rectangle with placeholder | `["Enter username..."] @(100,50) w=280 h=40 bg=#FFFFFF b=#E5E7EB c=#9CA3AF align=l vertical-align=m` |
| Dividers | Line `--` / `-"label"-` | `-- @(0,100)->(400,100) b=#E5E7EB` |
| Data Tables | Table `##` | `## @(100,50) w=500 border=1` |

**Common Mistakes to Avoid:**
- Using placeholder `[?]` for buttons (use `["Button Text"]` instead)
- Using rectangle `[]` for plain labels (use `"Label"` instead)
- Overcrowding elements - use 10px spacing
- Simulating tables with multiple Rectangles — always use `##` table syntax

**Rectangle Alignment Rules:**
- Input/Display rectangles: `align=l vertical-align=m` (text left-aligned, vertically centered)
- Button rectangles: `align=c vertical-align=m` (text center-aligned, vertically centered)
- Container rectangles (no text): alignment not needed

**Component Reuse:**
- When generating wireframes, if existing frontend code has suitable components, use those components to draw the corresponding wireframe elements
- In the wireframe note, document the component reference: `Component: [ComponentName] from [path]`
- If no existing component matches, design new elements as usual

---

## 2. Coordinate System

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

## 3. Page Organization Rules

**Each SolarWire code block handles only one independent view:**

| Situation | Handling Method | Example |
|-----------|-----------------|---------|
| Modals/Dialogs | Separate SolarWire fragment | `### 5.2 Login Failed Modal` + independent code block |
| Different Page States | Separate fragment for each state | `### 5.3 Login Page - Loading State`, `### 5.4 Login Page - Error State` |
| Tab Switching | Separate fragment for each tab | `### 5.5 Settings Page - Basic Info Tab`, `### 5.6 Settings Page - Security Tab` |
| Popover/Hover Cards | Separate SolarWire fragment | `### 5.7 User Detail Popover` + independent code block |
| Dropdown Menus | Separate SolarWire fragment | `### 5.8 Status Filter Dropdown Menu` + independent code block |
| Drawers/Slide Panels | Separate SolarWire fragment | `### 5.9 Order Detail Drawer` + independent code block |

**Do not mix multiple view states in one code block.**

---

## 4. Container Rectangle Requirements

**Every page must have a container rectangle:**

```solarwire
!title="Page Name"
!c=#111827
!size=13
!bg=#F9FAFB

[] @(0,0) w=375 h=812 bg=#FFFFFF b=#FFFFFF

// Page content...
```

**Container Rectangle Specifications:**
- Place at the beginning of the code block
- Use `[]` rectangle (don't display text content)
- `bg=#FFFFFF` white background
- **Must set `b=#FFFFFF` or `s=0`** to avoid unwanted black border (Rectangle default border is `#333333` with width 1)
- **Container must NOT use shadows (`shadow-*`) or border radius (`r` must be 0 or omitted)** — wireframes are functional guides, not visual designs. The only exception is when the container represents an overlay layer (e.g., modal backdrop), where `opacity=0.5` is allowed without shadows or rounded corners.
- Dimensions by scenario:
  - Mobile: `w=390 h=844` or as needed
  - Web: `w=1440 h=900` or as needed
  - Admin Dashboard: `w=1440 h=900` or as needed

**Container Size Principle: Container must contain all child elements**

**Forbidden: Child elements extending beyond parent container boundaries.**

---

## 5. Page Presentation Rules

| Scenario | Handling |
|-----------|----------|
| New page | Draw all elements completely, including navigation, menu, top bar, sidebar, bottom bar, breadcrumbs, and other global UI elements. These global elements only need to show position and size, no detailed notes required, but must be present in the wireframe. |
| Redesign page | Redraw completely |
| Modified page (incremental) | Must draw the **complete page** with all global UI elements. Page layout and unchanged elements are derived from existing frontend code or known PRD wireframes. Changed elements marked with `[NEW]`/`[MODIFIED]`/`[REMOVED]`, unchanged elements kept but without detailed note. |
| New content on existing page | Same as modified page — draw complete page, mark new elements |

**Completeness Requirements:**
- Every page wireframe must include the full page framework appropriate for its scenario: top navigation bar, sidebar (Admin), bottom navigation bar (Mobile), background container, header, footer.
- Global elements and common components need only position and size; detailed notes are not required, but they must appear in the wireframe.
- Within the same requirement, common parts already explained in other pages do not need to be repeated.
- Ensure developers have a clear concept of relative element positions on each page.

---

## 6. Field Presentation Rules

| Rule | Description |
|------|-------------|
| Field grouping | Group fields when there are many, for better user understanding |
| Field naming | Use common, user-friendly language; self-explanatory |
| Auxiliary explanation | When field name cannot be self-explanatory, explain via Tooltip, etc. |

---

## 7. Color Standards

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

### Timeline Status Colors

| Status | Tailwind | Hex |
|--------|----------|-----|
| Completed | green-500 | `#22C55E` |
| In Progress | blue-500 | `#3B82F6` |
| Pending | gray-300 | `#D1D5DB` |
| Error | red-500 | `#EF4444` |
| Warning | amber-500 | `#F59E0B` |

---

## 8. Scenario Specifications

### Mobile App

**Characteristics:**
- Narrow canvas (375-430px)
- Vertical layout, bottom navigation
- Touch-friendly large buttons (min 44x44px)

**Container Size:** `w=390 h=844`

**Element Sizes:**
- Button height: 44-56px
- Input field height: 44-52px
- Text size: 13px (default), 18-22px (titles)
- Element spacing: 10px (unified), Page margins: 16-24px

**Mobile-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| deviceToken | string | Device push token |
| deviceId | string | Device unique identifier |
| osType | string | iOS/Android |
| appVersion | string | App version |

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

**Web-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| sessionId | string | Session ID |
| userAgent | string | Browser info |
| referrer | string | Source page |

---

### Admin Dashboard

**Characteristics:**
- Very wide canvas (1440-1920px)
- Fixed left sidebar (200-280px)
- Data-intensive (tables, charts, cards)
- Many action buttons

**Container Size:** `w=1440 h=900`

**Element Sizes:**
- Button height: 32-40px
- Input field height: 32-36px
- Table row height: 40-48px
- Sidebar width: 200-280px
- Text size: 13px (default), 16-20px (titles)
- Element spacing: 10px (unified), Page margins: 24-32px

**Admin-specific Fields:**

| Field | Type | Description |
|-------|------|-------------|
| operatorId | string | Operator ID |
| operateTime | datetime | Operation time |
| operateType | string | Add/Edit/Delete/Export |
| ipAddress | string | Operation IP |

**Admin-specific Rules:**
- Pagination: 20 items/page, max 10000 export
- Sensitive operations require confirmation

---

## 9. Modal and Overlay Presentation Rules

**All modals, popovers, dropdowns, drawers, and other independent interactive overlays MUST have a separate SolarWire wireframe — not just a simple description in a note.**

### Overlay Types

| Type | Description |
|------|-------------|
| Confirmation modal | Delete confirmation, operation confirmation, etc. |
| Form modal | Create, edit, etc. |
| Information modal | Detail view, etc. |
| Alert modal | Success, failure, warning, etc. |
| Popover / Hover Card | Quick detail view triggered by hover or click on an element |
| Dropdown Menu | Expandable list of options triggered by click on a button or input |
| Drawer / Slide Panel | Side panel that slides in from left/right for detail or form |

### Modal vs Tooltip/Toast

| Type | Handling | Description |
|------|----------|-------------|
| Modal | Separate SolarWire wireframe | Complete UI, interactions, action buttons |
| Popover / Hover Card | Separate SolarWire wireframe | Complete UI with content |
| Dropdown Menu | Separate SolarWire wireframe | Complete list of options |
| Drawer / Slide Panel | Separate SolarWire wireframe | Complete panel with content |
| Tooltip | Describe directly in note | Simple text hint, no interaction |
| Toast | Describe directly in note | Simple message, auto-dismiss |

---

## 10. Incremental Page Wireframe Rules

**Used for incremental feature PRDs when modifying existing pages.**

### Core Principle

**Even when only a single element is changed, the wireframe must show the complete page with all global UI elements (navigation, sidebar, etc.).** The page layout and unchanged elements are sourced from:
1. **Existing frontend code** (parse component structure to derive page layout)
2. **Known PRD wireframes** (extract from `.solarwire/` directory)
3. **Context inference** (only when above sources are unavailable, create a baseline layout based on terminal type)

### Change Type Markers

| Change Type | Note Prefix | Description |
|-------------|-------------|-------------|
| NEW | `[NEW]` | Brand new element added to the page |
| MODIFIED | `[MODIFIED]` + change description | Existing element with changes |
| REMOVED | `[REMOVED]` + reason | Element removed from the page |
| UNCHANGED | `[UNCHANGED]` (optional) | Element kept as-is from existing page; no detailed note needed |

### How to Draw Incremental Pages

1. Extract the full page layout from existing code or known PRD
2. Draw the **complete page container** with all global UI elements (navigation bar, sidebar, bottom bar, breadcrumbs)
3. Include all unchanged elements in their correct positions — they may be simplified or grayed out, but must be present
4. Changed elements: draw fully with complete notes and `[NEW]`/`[MODIFIED]`/`[REMOVED]` markers
5. Unchanged elements: keep in wireframe, no detailed notes needed (may note `[UNCHANGED]`)
6. For REMOVED elements: mark them on the wireframe with a strikethrough or note, but do not remove them from the visual layout entirely (to show what was there)

### Drawing Guidelines

When drawing incremental pages:
- Derive page layout from the project's actual frontend code
- Apply Layout Calculation Rules (Section 13) for coordinate calculations
- Use standards.md color and spacing values, not values from any example

### Modified Page Annotation in PRD

```markdown
### 5.x [Page Name] (Modified)

**Page Overview**: [One sentence description of what changed]
**Page Layout Source**: [Existing code from path] / [Existing PRD from .solarwire/]
**Changes**: Complete page wireframe below. Changed elements are marked; unchanged elements are kept for context.
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

---

## 11. Layout Calculation Rules

> These rules provide coordinate calculation guidance for generating wireframes.
> AI should use these rules as a baseline and adapt to the project's actual design system by reading frontend code.
> Do NOT copy specific coordinate values from examples — calculate coordinates based on these rules and the actual business requirements.

### Page Structure

| Scenario | Container Width | Content Padding | Content X | Content Width |
|----------|----------------|-----------------|-----------|---------------|
| Mobile | 390 | 16 each side | 16 | 358 |
| Web | 1440 | 24 each side | 24 | 1392 |
| Admin Dashboard | 1440 | 24 each side | 24 | 1392 |

### Global UI Elements

| Element | Height | Position | Notes |
|---------|--------|----------|-------|
| Top Navigation Bar | 56-64 | y=0, full width | bg=#FFFFFF, bottom border b=#E5E7EB |
| Bottom Navigation Bar (Mobile) | 49-56 | Bottom of page | bg=#FFFFFF, top border b=#E5E7EB |
| Sidebar (Admin) | Full height | x=0, left side | w=200-280, bg=#FFFFFF, right border b=#E5E7EB |
| Breadcrumbs | 24-32 | Below navigation bar | |

### Vertical Spacing

| Spacing Type | Value | Calculation |
|-------------|-------|-------------|
| Nav bar to page title | 24-32px | title_y = nav_h + 24~32 |
| Page title to first content | 24-32px | content_y = title_y + title_h + 24~32 |
| Label to its input | 4-8px | input_y = label_y + label_h + 4~8 |
| Between input groups | 12-16px | next_label_y = prev_input_y + prev_input_h + 12~16 |
| Between sections | 24-32px | section_y = prev_section_bottom + 24~32 |
| Last form element to button | 16-24px | button_y = last_input_y + last_input_h + 16~24 |

### Common Element Dimensions

| Element | Height | Width | Notes |
|---------|--------|-------|-------|
| Small button | 32 | 60-80 | Secondary actions |
| Default button | 36-40 | 80-120 | Standard actions |
| Large button | 44-48 | 120-300 | Primary actions |
| Full-width button (Mobile) | 44-48 | content_w | Mobile primary action |
| Input field | 36-44 | 200-400 (Desktop), content_w (Mobile) | |
| Table row | 40-48 | container width | |
| Card | variable | variable | r=8 |
| Tag/Badge | 22-28 | auto | r=4 |

### Multi-column Layout

| Layout Type | Calculation | Example (Desktop, content_w=1392) |
|-------------|------------|-----------------------------------|
| Sidebar + Main | sidebar_w=240, gap=24, main_w=content_w-sidebar_w-gap | main_w=1392-240-24=1128 |
| Two equal columns | each_w=(content_w-gap)/2, gap=16~24 | each_w=(1392-24)/2=684 |
| Three equal columns | each_w=(content_w-2*gap)/3, gap=16~24 | each_w=(1392-48)/3=448 |
| Card grid (N columns) | each_w=(content_w-(N-1)*gap)/N, gap=16~24 | |

### Modal Layout

| Element | Specification |
|---------|--------------|
| Backdrop | Full page size, bg=#000000, opacity=0.5 |
| Content box | Centered horizontally, w=400-800, r=8, bg=#FFFFFF, b=#E5E7EB |
| Header | h=48-56, title left-aligned, close button right-aligned |
| Footer | h=48-56, buttons right-aligned |
| Content padding | 16-24px |

### Coordinate Calculation Formulas

```
First element below nav:    y = nav_h + page_padding
Element below previous:     y = prev_y + prev_h + gap
Left-aligned element:       x = page_padding
Centered element:           x = (page_w - element_w) / 2
Right-aligned element:      x = page_w - page_padding - element_w
Sidebar start:              x = 0
Main content start:         x = sidebar_w + gap
```

### Layout Reference Strategy

Before generating wireframes, read the project's frontend code to understand existing layout patterns:

1. Locate page components (typically src/pages/ or src/views/)
2. Read 1-2 pages most similar to the current requirement
3. Extract layout patterns:
   - Page padding values
   - Common element sizes (button height, input height, card width)
   - Spacing between element groups
   - Navigation/header dimensions
   - Sidebar dimensions (if applicable)
4. Apply extracted patterns to SolarWire coordinates

For new projects without existing code, use the rules above as defaults.