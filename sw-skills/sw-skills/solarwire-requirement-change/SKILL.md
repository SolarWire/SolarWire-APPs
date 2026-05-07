---
name: "solarwire-requirement-change"
description: "Use when user wants to modify an existing confirmed PRD or change requirements during development"
---

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
User: "登录页面需要增加手机验证码登录方式"

AI confirms:
- Change type: New feature addition
- Affected page: 登录页面
- Affected feature: 登录功能
- Business reason: 提升用户体验，支持免密码登录
```

---

### Step 2: Impact Analysis

**Goal**: Analyze the full impact of the change before making any modifications

Analyze the following dimensions:

#### 2.1 Affected Pages

| Page | Change Type | Impact Description |
|------|------------|-------------------|
| 登录页面 | MODIFIED | 新增验证码输入区域和发送按钮 |
| 登录页面-验证码弹窗 | NEW | 新增验证码输入弹窗 |

#### 2.2 Affected Features

| Feature | Impact |
|---------|--------|
| 用户登录 | 新增验证码登录方式 |
| 登录按钮 | 逻辑变更：支持密码和验证码两种方式 |

#### 2.3 Affected Test Cases

| Test Case ID | Impact |
|-------------|--------|
| TC-001 | 需更新：登录流程增加验证码分支 |
| TC-010 | 需更新：点击操作增加方式选择 |

#### 2.4 Affected Dev Design

| Section | Impact |
|---------|--------|
| 登录模块架构 | 新增验证码服务依赖 |
| API接口 | 新增发送验证码和验证接口 |

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
b=#22C55E bg=#F0FDF4 note前缀[NEW]
```
Example:
```solarwire
["发送验证码"] @(100,380) w=280 h=44 bg=#F0FDF4 b=#22C55E c=#111827 note="""[NEW] 发送验证码按钮
1. Click action
   - Validate phone number format
   - Send verification code to phone"""
```

**MODIFIED elements**:
```
b=#F59E0B bg=#FFFBEB note前缀[MODIFIED] + 变更说明
```
Example:
```solarwire
["Login"] @(100,320) w=280 h=44 bg=#FFFBEB b=#F59E0B c=#111827 note="""[MODIFIED] Login button
变更说明：支持密码和验证码两种登录方式
1. Click action
   - Validate inputs based on selected login method
   - Submit login request
2. Success handling
   - Save token to localStorage
   - Redirect to homepage
3. Failure handling
   - Show error toast based on login method
4. Disabled conditions
   - Disabled when required fields are empty"""
```

**REMOVED elements**:
```
b=#EF4444 bg=#FEF2F2 opacity=0.4 note前缀[REMOVED] + 原因
```
Example:
```solarwire
["Remember Me"] @(100,400) w=16 h=16 bg=#FEF2F2 b=#EF4444 opacity=0.4 note="""[REMOVED] Remember me checkbox
移除原因：验证码登录不需要记住密码功能"""
```

**UNCHANGED elements**:
- Keep as-is, no markers needed

#### 4.3 Update Changelog

Add a new entry to the PRD Changelog section:

```markdown
## Change Log
| Version | Date | Changes |
|---------|------|---------|
| v1.1 | 2025-01-15 | 新增手机验证码登录方式；修改登录按钮逻辑；移除记住密码功能 |
| v1.0 | 2025-01-10 | Initial PRD |
```

#### 4.4 Base+Delta Marker Summary

| Change Type | Border Color | Background | Opacity | Note Prefix | Note Content |
|------------|-------------|-----------|---------|-------------|-------------|
| NEW | `b=#22C55E` | `bg=#F0FDF4` | 1.0 | `[NEW]` | Element definition + details |
| MODIFIED | `b=#F59E0B` | `bg=#FFFBEB` | 1.0 | `[MODIFIED]` | 变更说明 + updated details |
| REMOVED | `b=#EF4444` | `bg=#FEF2F2` | 0.4 | `[REMOVED]` | 移除原因 |
| UNCHANGED | Original | Original | 1.0 | None | Original |

---

### Step 5: User Confirmation

**Goal**: Get user approval before updating downstream artifacts

Present the following to the user:

```
✅ PRD has been updated with Base+Delta markers

**File Location:** `.solarwire/[requirement-name]/solarwire-prd.md`
**Previous Version:** `archive/solarwire-prd-v1.0.md`

**Changes Summary:**
- NEW: 发送验证码按钮, 验证码输入弹窗
- MODIFIED: Login按钮 (支持双方式登录)
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
| TC-001 | 登录页面 | Login按钮-点击操作-正常登录成功 | 功能测试 | 1. 已注册账号... [MODIFIED: 新增验证码登录前置条件] | 1. 选择登录方式 [NEW] ... | ... | ... | P0 | US-001 | | | 需回归验证 |
| TC-100 | 登录页面 | 发送验证码按钮-点击操作-发送成功 [NEW] | 功能测试 | ... | ... | ... | ... | P0 | US-010 | | | 新增用例 |
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
[变更描述]

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
5. [ ] Step 5: User Confirmation - Get explicit approval
6. [ ] Step 6: Update Downstream Artifacts - Test cases, dev design

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

---

## Dependencies

```
REQUIRED SUB-SKILL: solarwire-syntax
REQUIRED SUB-SKILL: solarwire-prd
```
