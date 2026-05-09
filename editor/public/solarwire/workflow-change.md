## Inlined Syntax Rules (CRITICAL)

- note must use triple quotes: `note="""..."""`, never use `note="..."` or `note='...'`
- SolarWire code blocks start with ` ```solarwire ` and end with ` ``` `
- Border color uses `b=`, border width uses `s=`
- Circle uses `("text")`, rounded rectangle uses `["text"] r=N`
- Table cells and rows cannot specify @(x,y), w, h
- Hallucinated attributes forbidden: multiline, truncate, stroke, strokeWidth
- All elements must have coordinates @(x,y)
- Plain text must use text element `"text"`, not rectangle `["text"]` to wrap plain text
- Rectangle element text must have `vertical-align=m` (vertically centered), `align=l` (horizontally left-aligned)
- After generating wireframes must run `node sw-skills/solarwire/validate-sw.js <path>` validation, fix syntax and re-validate if failed
- See [syntax.md](syntax.md) for complete syntax reference
- See [note-guide.md](note-guide.md) for note writing rules
- See [standards.md](standards.md) for color/spacing/scenario standards

# SolarWire Requirement Change Manager

## Configuration

- **Input**: `.solarwire/[requirement-name]/solarwire-prd.md`
- **Output**: Updated `.solarwire/[requirement-name]/solarwire-prd.md` + downstream artifacts

---

## Overview

This skill manages requirement changes for confirmed PRDs, ensuring all downstream artifacts are synchronized.

**Applicable Scenario**: Requirement changes during the same development cycle, after PRD is produced but before development is complete.

**Not Applicable**: New independent requirements (use `solarwire-prd` instead)

---

## Workflow

### Step 1: Clarify Change

**Goal**: Understand what the user wants to change

1. User describes the change content
2. AI confirms the change scope:
   - Which pages are affected?
   - Which features are affected?
   - Is this a new feature, modification, or removal?
   - What is the business reason for the change?

**Output**: Confirmed change description

**Example**:
```
User: "Login page needs to add phone verification code login method"

AI confirms:
- Change type: New feature addition
- Affected page: Login Page
- Affected feature: Login Feature
- Business reason: Improve user experience, support passwordless login
```

---

### Step 2: Impact Analysis

**Goal**: Analyze the full impact of the change before making any modifications

Analyze the following dimensions:

#### 2.1 Affected Pages

| Page | Change Type | Impact Description |
|------|------------|-------------------|
| Login Page | MODIFIED | Added verification code input area and send button |
| Login Page - Verification Code Modal | NEW | Added verification code input modal |

#### 2.2 Affected Features

| Feature | Impact |
|---------|--------|
| User Login | Added verification code login method |
| Login Button | Logic change: Support both password and verification code methods |

#### 2.3 Affected Test Cases

| Test Case ID | Impact |
|-------------|--------|
| TC-001 | Needs update: Login flow added verification code branch |
| TC-010 | Needs update: Click action added method selection |

#### 2.4 Affected Dev Design

| Section | Impact |
|---------|--------|
| Login module architecture | Added verification code service dependency |
| API endpoints | Added send verification code and verification API |

**Output**: Impact Analysis Report

---

### Step 3: Archive Current Version

**Goal**: Preserve the current PRD version before making changes

1. Read current version from PRD Document Information
2. Copy current `solarwire-prd.md` to `archive/solarwire-prd-vX.X.md`
3. Increment version number (e.g., v1.0 → v1.1)

**Archive Directory Structure**:
```
.solarwire/[requirement-name]/
├── solarwire-prd.md              # Current (will be updated)
├── archive/                       # Archive directory
│   ├── solarwire-prd-v1.0.md     # Archived previous version
│   └── solarwire-prd-v1.1.md     # Future archive
├── test-cases.md
└── ...
```

**Version Number Rules**:
- Minor change (add/modify a few fields): Increment minor version (v1.0 → v1.1)
- Major change (add/remove pages, significant flow changes): Increment major version (v1.0 → v2.0)

---

### Step 4: Modify PRD (Base+Delta Mode)

**Goal**: Apply changes to the current PRD with clear visual markers

#### 4.1 Text Changes

- Update affected sections directly in the PRD
- Add change markers in the Changelog section

#### 4.2 Wireframe Changes (Base+Delta Markers)

For SolarWire wireframes, use visual markers to distinguish change types:

**NEW elements**:
```
b=#22C55E bg=#F0FDF4 note prefix [NEW]
```
Example:
```solarwire
["Send Verification Code"] @(100,380) w=280 h=44 bg=#F0FDF4 b=#22C55E c=#111827 note="""[NEW] Send Verification Code Button
1. Click action
   - When clicked, validate phone number format and send verification code to phone"""
```

**MODIFIED elements**:
```
b=#F59E0B bg=#FFFBEB note prefix [MODIFIED] + change description
```
Example:
```solarwire
["Login"] @(100,320) w=280 h=44 bg=#FFFBEB b=#F59E0B c=#111827 note="""[MODIFIED] Login button
Change description: Support both password and verification code login methods
1. Click action
   - When clicked, validate inputs based on selected login method and submit login request
2. Success handling
   - When login succeeds, save token to localStorage and redirect to homepage
3. Failure handling
   - If login fails, show error toast based on login method
4. Disabled conditions
   - While required fields are empty, disable button"""
```

**REMOVED elements**:
```
b=#EF4444 bg=#FEF2F2 opacity=0.4 note prefix [REMOVED] + reason
```
Example:
```solarwire
["Remember Me"] @(100,400) w=16 h=16 bg=#FEF2F2 b=#EF4444 opacity=0.4 note="""[REMOVED] Remember me checkbox
Removal reason: Verification code login does not need remember password feature"""
```

**UNCHANGED elements**:
- Keep as-is, no markers needed

#### 4.3 Update Changelog

Add a new entry to the PRD Changelog section:

```markdown
## Change Log
| Version | Date | Changes |
|---------|------|---------|
| v1.1 | 2025-01-15 | Added phone verification code login method; Modified login button logic; Removed remember password feature |
| v1.0 | 2025-01-10 | Initial PRD |
```

#### 4.4 Base+Delta Marker Summary

| Change Type | Border Color | Background | Opacity | Note Prefix | Note Content |
|------------|-------------|-----------|---------|-------------|-------------|
| NEW | `b=#22C55E` | `bg=#F0FDF4` | 1.0 | `[NEW]` | Element definition + details |
| MODIFIED | `b=#F59E0B` | `bg=#FFFBEB` | 1.0 | `[MODIFIED]` | Change description + updated details |
| REMOVED | `b=#EF4444` | `bg=#FEF2F2` | 0.4 | `[REMOVED]` | Removal reason |
| UNCHANGED | Original | Original | 1.0 | None | Original |

---

### Step 4.5: Renderer Validation (CRITICAL)

**Goal: Ensure all modified wireframes can be correctly parsed and rendered**

```
Run: node sw-skills/solarwire/validate-sw.js .solarwire/[requirement-name]/

If errors found:
- Fix SolarWire syntax errors in the PRD
- Re-run validation until all blocks pass
- Common fixes:
  - note="..." → note="""...""" (triple quotes)
  - </solarwire> → ``` (proper closing)
  - @(x,y) on table cells → remove coordinates
  - Missing @(x,y) on elements → add coordinates
  - stroke/strokeWidth → b=/s=
  - (("text")) → ("text")
  - ("text") as rounded rect → ["text"] r=N
  - Pure text in ["text"] → "text"
  - Rectangle without vertical-align=m → add vertical-align=m

MUST pass validation before proceeding to Step 5
```

---

### Step 5: User Confirmation

**Goal**: Get user approval before updating downstream artifacts

Present the following to the user:

```
✅ PRD has been updated with Base+Delta markers

**File Location:** `.solarwire/[requirement-name]/solarwire-prd.md`
**Previous Version:** `archive/solarwire-prd-v1.0.md`

**Changes Summary:**
- NEW: Send Verification Code Button, Verification Code Input Modal
- MODIFIED: Login Button (supports dual-method login)
- REMOVED: Remember Me checkbox

**Impact Analysis:**
- 2 pages affected
- 2 features modified
- 3 test cases need update
- 1 dev design section affected

**Please review the changes:**
1. Are the Base+Delta markers correct?
2. Is the impact analysis complete?
3. Any adjustments needed?

After confirmation, I will update downstream artifacts:
- test-cases.md
- dev-design.md (if architecture changes)
```

**Confirmation Rules**:
- MUST wait for user to explicitly confirm
- If user requests changes, go back to Step 4
- Only proceed to Step 6 after explicit approval

---

### Step 6: Update Downstream Artifacts

**Goal**: Synchronize all downstream artifacts with the PRD changes

#### 6.1 Update Test Cases (test-cases.md)

1. Read existing `test-cases.md`
2. Identify affected test cases from impact analysis
3. For each affected test case:
   - Mark as [MODIFIED] or [REMOVED] in the test case
   - Update test steps, expected results, test data
4. Generate new test cases for NEW elements
5. Add Regression Notes section
6. Update Statistics

**Test Case Update Format**:
```markdown
### [Module Name]

| ID | Module | Name | Type | Precondition | Steps | Test Data | Expected Result | Priority | Related | Boundary | Exception | Remark |
|----|--------|------|------|-------------|-------|-----------|----------------|----------|---------|----------|-----------|--------|
| TC-001 | Login Page | Login Button - Click Action - Normal Login Success | Functional Test | 1. Registered account... [MODIFIED: Added verification code login precondition] | 1. Select login method [NEW] ... | ... | ... | P0 | US-001 | | | Needs regression verification |
| TC-100 | Login Page | Send Verification Code Button - Click Action - Send Success [NEW] | Functional Test | ... | ... | ... | ... | P0 | US-010 | | | New test case |
```

#### 6.2 Update Dev Design (dev-design.md)

Only if the change involves architecture changes:
1. Read existing `dev-design.md` (if exists)
2. Update affected sections
3. Add new architecture components
4. Mark changes with [MODIFIED] / [NEW] / [REMOVED]

#### 6.3 Subsequent Steps (Manual)

After downstream artifacts are updated, the following steps are typically manual:
1. Update code → Code review
2. Execute tests → Update test report
3. Close change request

---

## Impact Analysis Report Template

```markdown
## Impact Analysis Report

### Change Description
[Change Description]

### Change Type
- [ ] New Feature
- [ ] Feature Modification
- [ ] Feature Removal
- [ ] UI Change
- [ ] Business Logic Change
- [ ] Flow Change

### Affected Pages
| Page | Change Type | Impact Description |
|------|------------|-------------------|
| [Page Name] | NEW/MODIFIED/REMOVED | [Description] |

### Affected Features
| Feature | Impact |
|---------|--------|
| [Feature Name] | [Description of impact] |

### Affected Test Cases
| Test Case ID | Module | Impact | Action Required |
|-------------|--------|--------|----------------|
| TC-XXX | [Module] | MODIFIED/REMOVED/REGRESSION | [Description] |

### Affected Dev Design
| Section | Impact |
|---------|--------|
| [Section Name] | [Description of impact] |

### Risk Assessment
| Risk | Level | Mitigation |
|------|-------|------------|
| [Risk Description] | High/Medium/Low | [Mitigation plan] |

### Estimated Effort
| Artifact | Effort |
|----------|--------|
| PRD Update | [Hours] |
| Test Case Update | [Hours] |
| Dev Design Update | [Hours] |
| Code Change | [Hours] |
```

---

## Complete Workflow Checklist

1. [ ] Step 1: Clarify Change - User describes change, AI confirms scope
2. [ ] Step 2: Impact Analysis - Analyze pages, features, test cases, dev design
3. [ ] Step 3: Archive Current Version - Copy to archive, increment version
4. [ ] Step 4: Modify PRD - Apply Base+Delta markers, update Changelog
5. [ ] Step 4.5: Renderer Validation - `node sw-skills/solarwire/validate-sw.js .solarwire/[requirement-name]/` (MUST pass)
6. [ ] Step 5: User Confirmation - Get explicit approval
7. [ ] Step 6: Update Downstream Artifacts - Test cases, dev design

---

## Common Scenarios

### Scenario 1: Add New Field to Existing Page

1. Clarify: Which page, which form, what field
2. Impact: Page wireframe, form validation, test cases for that form
3. Archive: Current PRD version
4. Modify: Add NEW element to wireframe with `b=#22C55E bg=#F0FDF4` and `[NEW]` prefix
5. Confirm: Show changes to user
6. Update: Add test cases for new field validation

### Scenario 2: Modify Business Flow

1. Clarify: Which flow, what changes
2. Impact: Flow diagram, multiple pages, multiple test cases
3. Archive: Current PRD version
4. Modify: Update Mermaid diagram, mark affected pages with `[MODIFIED]`
5. Confirm: Show changes to user
6. Update: Update flow test cases, add regression notes

### Scenario 3: Remove Feature

1. Clarify: Which feature, reason for removal
2. Impact: Pages containing the feature, test cases for the feature
3. Archive: Current PRD version
4. Modify: Mark removed elements with `b=#EF4444 bg=#FEF2F2 opacity=0.4` and `[REMOVED]` prefix
5. Confirm: Show changes to user
6. Update: Mark test cases as [REMOVED], add regression notes for affected areas

---

## Important Rules

1. **Always Archive First** - Never modify PRD without archiving the current version
2. **Base+Delta Only** - Use visual markers for all changes, never silently modify
3. **Impact Analysis Required** - Always analyze impact before making changes
4. **User Confirmation Required** - Never update downstream artifacts without user approval
5. **Version Number Must Increment** - Every change must update the version number
6. **Changelog Must Be Updated** - Every change must have a Changelog entry
7. **Downstream Sync** - All affected artifacts must be updated, not just the PRD
8. **No Silent Changes** - Every change must be visible through markers or Changelog
9. **NOTE MUST USE TRIPLE QUOTES** - Always use `note="""..."""`, NEVER use `note="..."` or `note='...'`. Single/double quotes for notes will cause parsing errors
10. **Pure Text Uses Text Element** - Labels, headings, descriptions and other pure text MUST use `"text"`, NOT `["text"]` rectangle. Only buttons, inputs, cards and other interactive/container elements use `["text"]`
11. **Rectangle Text Alignment** - Rectangle elements MUST have `vertical-align=m` (vertically centered) and `align=l` (horizontally left-aligned). Default vertical-align is top (t), must explicitly set to middle (m)
12. **Renderer Validation Required** - After modifying wireframes, MUST run `node sw-skills/solarwire/validate-sw.js .solarwire/[requirement-name]/` and fix all errors before user confirmation
