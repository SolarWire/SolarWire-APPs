# SolarWire PRD to Test Case Generator

## Inlined Syntax Rules (CRITICAL)

- note must use triple quotes: `note="""..."""`, never use `note="..."` or `note='...'`
- SolarWire code blocks use ` ```solarwire ` to start, ` ``` ` to end
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

## Configuration

- **Input**: `.solarwire/[requirement-name]/solarwire-prd.md`
- **Output**: `.solarwire/[requirement-name]/test-cases.xlsx`

---

## Overview

This skill guides AI to read and understand SolarWire PRD documents, then generate **detailed, executable** test cases in Markdown format.

**Core Principle**: Test cases must be:
1. **Executable** - Clear steps that can be followed
2. **Verifiable** - Expected results that can be checked
3. **Specific** - Exact test data, not vague descriptions
4. **Complete** - All necessary information included

**Focus**: Black-box functional testing only

---

## Test Case Quality Standards

### Bad Test Case (Too Vague)

| Field | Content |
|-------|---------|
| Name | Login Button-Click Action |
| Steps | 1. View Login button<br>2. Click button |
| Expected | Validate username and password |

**Problems**:
- "View" is not a specific action
- "Verify" cannot determine pass/fail
- Missing test data

### Good Test Case (Executable)

| Field | Content |
|-------|---------|
| Name | Login Page-Login Button-Normal Login Success |
| Precondition | 1. Registered test account: testuser@example.com / Test@123<br>2. User not logged in<br>3. Login page opened |
| Steps | 1. Enter in username input field: testuser@example.com<br>2. Enter in password input field: Test@123<br>3. Click 'Login' button |
| Test Data | Username: testuser@example.com<br>Password: Test@123 |
| Expected | 1. Login success, page redirects to homepage<br>2. Top navigation bar shows user avatar<br>3. token field exists in localStorage |
| Priority | P0 |

---

## How to Read PRD Document

### PRD Document Structure

```markdown
# Product Requirements Document - [Project Name]

## Document Information
## 1. Product Overview
   ### 1.4 User Stories
## 2. Feature Scope
   ### 2.1 Feature List
## 3. Business Flow
## 4. Page Design
## 5. Page Details (with SolarWire wireframes)
```

### Reading Order for Test Case Generation

1. **Document Information** → Project name, version
2. **User Stories (1.4)** → Acceptance test cases
3. **Feature List (2.1)** → Feature coverage test cases
4. **Business Flows (3.x)** → Flow path test cases
5. **Page Details (5.x)** → Detailed UI test cases from SolarWire notes

---

## Section 1: Reading User Stories

### User Story Format

```markdown
| ID | User Story | Acceptance Criteria | Priority |
| US-001 | As a user, I want to login, so that I can access my account |
  - Given user is on login page, when entering valid credentials, then login succeeds
  - Given user is on login page, when entering invalid credentials, then error shows
```

### How to Generate Detailed Test Cases

**Step 1**: Extract Given-When-Then
**Step 2**: Convert to specific test steps
**Step 3**: Add concrete test data
**Step 4**: Define verifiable expected results

### Example: US-001 Login

**Original Acceptance Criteria:**
```
Given user is on login page, when entering valid credentials, then login succeeds
```

**Generated Test Case:**

| Field | Content |
|-------|---------|
| ID | TC-001 |
| Module | Login Page |
| Name | US-001-User Login-Valid Credentials Login Success |
| Type | Functional Test |
| Precondition | 1. Registered test account: testuser@example.com, password: Test@123<br>2. User not logged in state<br>3. Browser opened, navigated to login page |
| Steps | 1. Enter in username input field: testuser@example.com<br>2. Enter in password input field: Test@123<br>3. Click 'Login' button |
| Test Data | Username: testuser@example.com<br>Password: Test@123 |
| Expected | 1. Page redirects to homepage (URL changes to /home)<br>2. Top navigation bar shows user avatar and username<br>3. auth_token field exists in browser localStorage<br>4. Login button no longer displayed |
| Priority | P0 |
| Related | US-001 |
| Remark | Verify normal login flow |

---

## Section 2: Reading Feature List

### Feature List Format

```markdown
| Module | Feature | Priority | Description |
| User Management | User Login | P0 | Support user login feature |
```

### How to Generate Test Cases

Each feature generates a feature coverage test case with specific verification points.

### Example

| Field | Content |
|-------|---------|
| ID | TC-002 |
| Module | User Management |
| Name | User Login Feature-Feature Verification |
| Type | Functional Test |
| Precondition | 1. System deployed and running normally<br>2. Test account registered |
| Steps | 1. Navigate to login page<br>2. Enter valid username and password<br>3. Click login button<br>4. Verify login success<br>5. Logout<br>6. Enter invalid username and password<br>7. Click login button<br>8. Verify login failure message |
| Test Data | Valid account: testuser@example.com / Test@123<br>Invalid account: invalid@test.com / wrong123 |
| Expected | 1. Valid account login success, redirect to homepage<br>2. Invalid account login failure, show error message<br>3. Error message content is "Invalid username or password" |
| Priority | P0 |
| Related | User Login Feature |

---

## Section 3: Reading Business Flows

### Mermaid Flowchart Format

```mermaid
flowchart TD
    A[Navigate to login page] --> B[Enter username and password]
    B --> C{Validate format}
    C -->|Format correct| D[Click login]
    C -->|Format error| E[Show format error]
    D --> F{Validate account}
    F -->|Account correct| G[Login success]
    F -->|Account error| H[Show account error]
    G --> I[Redirect to homepage]
```

### How to Generate Test Cases

**Identify all paths** and generate one test case per path.

### Path Analysis Example

| Path | Test Scenario | Key Verification Points |
|------|--------------|------------------------|
| Happy Path | A→B→C(correct)→D→F(correct)→G→I | Normal login complete flow |
| Format Error | A→B→C(error)→E | Format validation |
| Account Error | A→B→C(correct)→D→F(error)→H | Account verification failed |

### Generated Test Case: Happy Path

| Field | Content |
|-------|---------|
| ID | TC-003 |
| Module | Business Flow Test |
| Name | Login Flow-Normal Login Complete Flow |
| Type | Functional Test |
| Precondition | 1. Registered account: flowtest@example.com / Flow@123<br>2. Browser opened |
| Steps | 1. Enter login page URL in browser address bar<br>2. Verify page loaded, login form displayed<br>3. Enter in username input field: flowtest@example.com<br>4. Enter in password input field: Flow@123<br>5. Verify login button is clickable (not disabled)<br>6. Click login button<br>7. Wait for page redirect (max 3 seconds)<br>8. Verify current URL is homepage URL |
| Test Data | Username: flowtest@example.com<br>Password: Flow@123 |
| Expected | 1. Step 2: Login form displays normally, contains username, password input fields and login button<br>2. Step 5: Login button is clickable, background color is theme color<br>3. Step 7: Redirect completed within 3 seconds<br>4. Step 8: URL changes to /home or configured homepage path |
| Priority | P0 |
| Remark | Verify complete login flow, including page load, input, click, redirect steps |

---

## Section 4: Reading SolarWire Wireframes

### SolarWire Code Block Structure

```solarwire
!title="Login Page"
!c=#333333
!size=13
!bg=#F2F2F2

[] @(0,0) w=1440 h=900 bg=#FFFFFF

"Login" @(720,50) c=#333333 size=24 bold

["Enter phone or email"] @(100,200) w=280 h=40 bg=#FFFFFF b=#F2F2F2 note="""Username input
1. Input rules
   - Supports phone number or email
   - Automatically trim spaces
   - Max length: 50 characters
2. Validation
   - Format: 11-digit phone or email format
   - Error: 'Please enter valid phone or email'"""

["Enter password"] @(100,260) w=280 h=40 bg=#FFFFFF b=#F2F2F2 note="""Password input
1. Input rules
   - Display as dots
   - Min 6 chars, max 32 chars
   - Must contain letters and numbers
2. Interaction
   - Eye icon to toggle visibility
   - Validate on blur
   - Error: 'Invalid password format'"""

["Login"] @(100,320) w=280 h=44 bg=#1890FF c=#FFFFFF note="""Login button
1. Click action
   - Validate all inputs
   - Submit login request
2. Success handling
   - Save token to localStorage
   - Redirect to homepage
3. Failure handling
   - Show error toast: 'Invalid credentials'
   - Clear password field
   - Shake button animation
4. Disabled conditions
   - Disabled when any input is empty
   - Disabled when format validation fails"""
```

### How to Read Page Title

```
!title="Login Page"  →  Module = Login Page
```

### How to Read Element Content

```
["Enter phone or email"]  →  Input field placeholder = "Enter phone or email"
["Login"]                 →  Button text = "Login"
```

---

## Section 5: Reading Notes (KEY FOR TEST CASES)

### Note Structure

```
note="""[Element Definition]
1. [Section Name]
   - [Detail 1]
   - [Detail 2]
2. [Section Name]
   - [Detail 1]"""
```

### First Line: Element Definition

The first line defines what this element IS. Use it as test case name prefix.

---

## Detailed Test Case Generation Rules

### Rule 1: Click Action / Click

**Test Type**: Functional Test

**Generation Steps**:
1. Identify the click trigger
2. List all preconditions for clicking
3. Define exact click action
4. List all observable results

**Example Note:**
```
1. Click action
   - Validate username and password
   - Submit login request
```

**Generated Test Case:**

| Field | Content |
|-------|---------|
| ID | TC-010 |
| Module | Login Page |
| Name | Login Button-Click Action-Validate and Submit Login |
| Type | Functional Test |
| Precondition | 1. Login page opened<br>2. Registered test account: logintest@example.com / Login@123<br>3. User not logged in |
| Steps | 1. Enter in username input field: logintest@example.com<br>2. Enter in password input field: Login@123<br>3. Observe login button state (should be clickable)<br>4. Click 'Login' button<br>5. Observe page changes |
| Test Data | Username: logintest@example.com<br>Password: Login@123 |
| Expected | 1. Step 3: Login button background is #1890FF, shows pointer cursor on hover<br>2. Step 5: Button shows loading state (optional)<br>3. Step 5: Sends login request to backend<br>4. Step 5: Request parameters include username and password fields |
| Priority | P0 |
| Remark | Verify validation and submission logic triggered by clicking login button |

---

### Rule 2: Success Handling / Success

**Test Type**: Functional Test

**Generation Steps**:
1. Define success state
2. List all observable success indicators
3. Verify each indicator separately

**Example Note:**
```
2. Success handling
   - Save token to localStorage
   - Redirect to homepage
```

**Generated Test Cases:**

**TC-011: Token Save Verification**

| Field | Content |
|-------|---------|
| ID | TC-011 |
| Module | Login Page |
| Name | Login Button-Success Handling-Token Save Verification |
| Type | Functional Test |
| Precondition | 1. Login page opened<br>2. Registered account: tokentest@example.com / Token@123<br>3. Browser developer tools opened (Application > Local Storage) |
| Steps | 1. Enter valid username: tokentest@example.com<br>2. Enter valid password: Token@123<br>3. Click login button<br>4. Open browser developer tools > Application > Local Storage<br>5. View storage content for current domain |
| Test Data | Username: tokentest@example.com<br>Password: Token@123 |
| Expected | 1. auth_token or token field exists in Local Storage<br>2. Token value is non-empty string (typically JWT format)<br>3. Token validity matches system design (e.g., 24 hours) |
| Priority | P0 |

**TC-012: Page Redirect Verification**

| Field | Content |
|-------|---------|
| ID | TC-012 |
| Module | Login Page |
| Name | Login Button-Success Handling-Page Redirect Verification |
| Type | Functional Test |
| Precondition | 1. Login page opened<br>2. Registered account: redirecttest@example.com / Redirect@123 |
| Steps | 1. Record current page URL<br>2. Enter valid username: redirecttest@example.com<br>3. Enter valid password: Redirect@123<br>4. Click login button<br>5. Wait for page redirect (max 5 seconds)<br>6. Check current page URL |
| Test Data | Username: redirecttest@example.com<br>Password: Redirect@123 |
| Expected | 1. Step 5: Page redirect completed within 5 seconds<br>2. Step 6: URL changes to homepage path (e.g., /home or /dashboard)<br>3. Top navigation bar shows user avatar and username<br>4. Page does not show login/register buttons |
| Priority | P0 |

---

### Rule 3: Failure Handling / Failure

**Test Type**: Exception Test

**Generation Steps**:
1. Identify failure scenarios
2. Define how to trigger each failure
3. List all error indicators
4. Verify error message content

**Example Note:**
```
3. Failure handling
   - Show error toast: 'Invalid credentials'
   - Clear password field
   - Shake button animation
```

**Generated Test Cases:**

**TC-013: Error Message Verification**

| Field | Content |
|-------|---------|
| ID | TC-013 |
| Module | Login Page |
| Name | Login Button-Failure Handling-Error Message Display |
| Type | Exception Test |
| Precondition | 1. Login page opened<br>2. Prepare invalid account data |
| Steps | 1. Enter in username field: wronguser@example.com<br>2. Enter in password field: WrongPassword@123<br>3. Click login button<br>4. Observe page response |
| Test Data | Username: wronguser@example.com (unregistered)<br>Password: WrongPassword@123 |
| Expected | 1. Page shows error message (toast or below form)<br>2. Error message content is "Invalid credentials"<br>3. Error message uses red text or red background<br>4. Error message auto-dismisses after 3 seconds (or requires manual close) |
| Priority | P1 |
| Exception | Login with unregistered account |

**TC-014: Password Clear Verification**

| Field | Content |
|-------|---------|
| ID | TC-014 |
| Module | Login Page |
| Name | Login Button-Failure Handling-Password Field Clear |
| Type | Exception Test |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: testuser@example.com<br>2. Enter in password field: WrongPassword@123<br>3. Click login button<br>4. Observe password input field state |
| Test Data | Username: testuser@example.com (registered)<br>Password: WrongPassword@123 (wrong password) |
| Expected | 1. After login failure, password input field content is cleared<br>2. Password input field is blank<br>3. Username input field keeps original value<br>4. Cursor focus returns to password input field |
| Priority | P1 |
| Exception | Login with correct username but wrong password |

---

### Rule 4: Input Rules / Input Rules

**Test Type**: Form Validation + Boundary Test

**Generation Steps**:
1. Extract length constraints → Generate boundary tests (min-1, min, max, max+1)
2. Extract format rules → Generate valid/invalid format tests
3. Extract character rules → Generate character validation tests
4. Extract display rules → Generate UI display tests

**Example Note:**
```
1. Input rules
   - Supports phone number or email
   - Automatically trim spaces
   - Max length: 50 characters
```

**Generated Test Cases:**

**TC-020: Phone Format-Valid**

| Field | Content |
|-------|---------|
| ID | TC-020 |
| Module | Login Page |
| Name | Username Input-Input Rules-Phone Format Valid |
| Type | Form Validation |
| Precondition | 1. Login page opened<br>2. Username input field is empty |
| Steps | 1. Enter in username field: 13812345678<br>2. Observe input field state<br>3. Click password field (trigger blur)<br>4. Observe whether error message is displayed |
| Test Data | Phone: 13812345678 |
| Expected | 1. Input field normally displays entered content<br>2. No format error message displayed<br>3. Input field border keeps default color (not red) |
| Priority | P0 |

**TC-021: Email Format-Valid**

| Field | Content |
|-------|---------|
| ID | TC-021 |
| Module | Login Page |
| Name | Username Input-Input Rules-Email Format Valid |
| Type | Form Validation |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: test@example.com<br>2. Click password field to trigger validation<br>3. Observe whether error message is displayed |
| Test Data | Email: test@example.com |
| Expected | 1. No format error message displayed<br>2. Input field border keeps default color |
| Priority | P0 |

**TC-022: Invalid Format**

| Field | Content |
|-------|---------|
| ID | TC-022 |
| Module | Login Page |
| Name | Username Input-Input Rules-Invalid Format Validation |
| Type | Form Validation |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: abc123<br>2. Click password field to trigger validation<br>3. Observe error message |
| Test Data | Invalid format: abc123 |
| Expected | 1. Shows error message: "Please enter valid phone or email"<br>2. Input field border turns red<br>3. Error message displays below input field |
| Priority | P0 |

**TC-023: Auto Trim Spaces**

| Field | Content |
|-------|---------|
| ID | TC-023 |
| Module | Login Page |
| Name | Username Input-Input Rules-Auto Trim Spaces |
| Type | Functional Test |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: ' test@example.com ' (with leading/trailing spaces)<br>2. Click password field to trigger blur<br>3. Observe input field content change |
| Test Data | Email with spaces: ' test@example.com ' |
| Expected | 1. Input field content auto-changes to: test@example.com (no leading/trailing spaces)<br>2. No format error message displayed |
| Priority | P1 |

**TC-024: Max Length Limit**

| Field | Content |
|-------|---------|
| ID | TC-024 |
| Module | Login Page |
| Name | Username Input-Input Rules-Max Length Limit |
| Type | Boundary Test |
| Precondition | 1. Login page opened |
| Steps | 1. Prepare a 51-character string<br>2. Attempt to enter the string in username field<br>3. Observe actual number of characters entered |
| Test Data | 51-char email: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@test.com |
| Expected | 1. Input field only accepts first 50 characters<br>2. 51st character cannot be entered<br>3. No error message displayed (silent limit) |
| Priority | P1 |
| Boundary | 49 characters (valid), 50 characters (boundary), 51 characters (exceeded) |

---

### Rule 5: Validation / Validation

**Test Type**: Form Validation

**Example Note:**
```
2. Validation
   - Format: 11-digit phone number or email format
   - Error message: 'Please enter a valid phone number or email'
```

**Generated Test Cases:**

**TC-025: Phone Format Validation-Valid**

| Field | Content |
|-------|---------|
| ID | TC-025 |
| Module | Login Page |
| Name | Username Input-Format Validation-11-Digit Phone Valid |
| Type | Form Validation |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: 13812345678<br>2. Click other area to trigger blur<br>3. Observe validation result |
| Test Data | Phone: 13812345678 |
| Expected | 1. No error message displayed<br>2. Input field border is default color |
| Priority | P0 |

**TC-026: Phone Format Validation-Insufficient Digits**

| Field | Content |
|-------|---------|
| ID | TC-026 |
| Module | Login Page |
| Name | Username Input-Format Validation-Phone Insufficient Digits |
| Type | Form Validation |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: 1381234567 (10 digits)<br>2. Click other area to trigger blur<br>3. Observe validation result |
| Test Data | Phone: 1381234567 (10 digits) |
| Expected | 1. Shows error message: "Please enter a valid phone number or email"<br>2. Input field border turns red |
| Priority | P0 |

---

### Rule 6: Disabled Conditions / Disabled Conditions

**Test Type**: UI Test

**Example Note:**
```
4. Disabled conditions
   - Disabled when any input is empty
   - Disabled when format validation fails
```

**Generated Test Cases:**

**TC-030: Button Disabled When Username Empty**

| Field | Content |
|-------|---------|
| ID | TC-030 |
| Module | Login Page |
| Name | Login Button-Disabled State-Username Empty |
| Type | UI Test |
| Precondition | 1. Login page opened<br>2. All input fields are empty |
| Steps | 1. Keep username input field empty<br>2. Enter in password field: Test@123<br>3. Observe login button state |
| Test Data | Password: Test@123 |
| Expected | 1. Login button is in disabled state<br>2. Button background is gray (e.g., #AAAAAA or #CCCCCC)<br>3. Shows prohibited cursor on hover<br>4. Clicking button has no response |
| Priority | P1 |

**TC-031: Button Disabled When Password Empty**

| Field | Content |
|-------|---------|
| ID | TC-031 |
| Module | Login Page |
| Name | Login Button-Disabled State-Password Empty |
| Type | UI Test |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: test@example.com<br>2. Keep password input field empty<br>3. Observe login button state |
| Test Data | Username: test@example.com |
| Expected | 1. Login button is in disabled state<br>2. Button background is gray<br>3. Clicking button has no response |
| Priority | P1 |

**TC-032: Button Disabled When Format Validation Fails**

| Field | Content |
|-------|---------|
| ID | TC-032 |
| Module | Login Page |
| Name | Login Button-Disabled State-Format Validation Failed |
| Type | UI Test |
| Precondition | 1. Login page opened |
| Steps | 1. Enter in username field: invalid-format<br>2. Click password field to trigger validation<br>3. Enter in password field: Test@123<br>4. Observe login button state |
| Test Data | Username: invalid-format<br>Password: Test@123 |
| Expected | 1. Username shows format error message<br>2. Login button is in disabled state<br>3. Button background is gray |
| Priority | P1 |

---

### Rule 7: Visibility Conditions / Visibility Conditions

**Test Type**: UI Test

**Example Note:**
```
1. Visibility conditions
   - Show when >= 1 items selected
   - Hide when no items selected
```

**Generated Test Cases:**

**TC-040: Shown After Item Selected**

| Field | Content |
|-------|---------|
| ID | TC-040 |
| Module | User List Page |
| Name | Batch Delete Button-Visibility-Shown After Selection |
| Type | UI Test |
| Precondition | 1. Logged into system<br>2. User list page opened<br>3. At least 3 data records in list |
| Steps | 1. Observe batch delete button initial state<br>2. Click checkbox of first row data<br>3. Observe batch delete button state change |
| Test Data | None |
| Expected | 1. Step 1: Batch delete button hidden or invisible<br>2. Step 3: Batch delete button appears<br>3. Button located in toolbar area above table |
| Priority | P1 |

**TC-041: Hidden After Deselection**

| Field | Content |
|-------|---------|
| ID | TC-041 |
| Module | User List Page |
| Name | Batch Delete Button-Visibility-Hidden After Deselection |
| Type | UI Test |
| Precondition | 1. Logged into system<br>2. User list page opened<br>3. 1 item selected, batch delete button visible |
| Steps | 1. Click checkbox of selected row (deselect)<br>2. Observe batch delete button state change |
| Test Data | None |
| Expected | 1. Batch delete button hidden or disappears<br>2. Button no longer displayed in toolbar area |
| Priority | P1 |

---

### Rule 8: Data Source / Data Source

**Test Type**: Functional Test

**Example Note:**
```
1. Data source
   - User list data from User Management module
   - Default sort: creation time descending
2. Field descriptions
   - ID: Unique user identifier
   - Name: User display name, show 'Not set' if empty
   - Status: 1='Active', 0='Disabled', disabled shown in red
   - Created: Format as YYYY-MM-DD HH:mm
```

**Generated Test Cases:**

**TC-050: Data Loading Verification**

| Field | Content |
|-------|---------|
| ID | TC-050 |
| Module | User List Page |
| Name | User List Table-Data Source-Data Loading Verification |
| Type | Functional Test |
| Precondition | 1. Logged in as admin account<br>2. Test data exists in User Management module |
| Steps | 1. Open user list page<br>2. Wait for data loading to complete<br>3. Check table data row count |
| Test Data | None |
| Expected | 1. Table displays user data from User Management module<br>2. Show loading state while data is loading<br>3. Table shows data rows after loading completes |
| Priority | P1 |

**TC-051: Default Sort Verification**

| Field | Content |
|-------|---------|
| ID | TC-051 |
| Module | User List Page |
| Name | User List Table-Data Source-Default Sort Verification |
| Type | Functional Test |
| Precondition | 1. Logged in as admin account<br>2. Multiple user records with different creation times exist |
| Steps | 1. Open user list page<br>2. Record creation time of first and second rows<br>3. Compare the two timestamps |
| Test Data | None |
| Expected | 1. First row creation time >= second row creation time<br>2. Data sorted by creation time descending (newest first) |
| Priority | P1 |

**TC-052: Field Display-Name Empty**

| Field | Content |
|-------|---------|
| ID | TC-052 |
| Module | User List Page |
| Name | User List Table-Field Display-Name Empty Display |
| Type | Functional Test |
| Precondition | 1. Logged in as admin account<br>2. User record with empty Name field exists |
| Steps | 1. Open user list page<br>2. Find the row with empty Name<br>3. Observe Name column display content |
| Test Data | User record with empty Name |
| Expected | 1. Name column displays text "Not set"<br>2. Text color may be gray indicating unset state |
| Priority | P2 |

**TC-053: Field Display-Status Values**

| Field | Content |
|-------|---------|
| ID | TC-053 |
| Module | User List Page |
| Name | User List Table-Field Display-Status Value Display |
| Type | Functional Test |
| Precondition | 1. Logged in as admin account<br>2. Users with Active and Disabled status exist |
| Steps | 1. Open user list page<br>2. Find row with Status=1, observe display<br>3. Find row with Status=0, observe display |
| Test Data | User records with Status=1 and Status=0 |
| Expected | 1. Row with Status=1 displays "Active"<br>2. Row with Status=0 displays "Disabled"<br>3. Disabled status text displays in red |
| Priority | P1 |

---

### Rule 9: Options / Options

**Test Type**: Functional Test

**Example Note:**
```
1. Options (i18n: English/中文/日本語)
   - All [All/全部/すべて]
   - Active [Active/正常/有効]
   - Disabled [Disabled/禁用/無効]
2. Default: All
```

**Generated Test Cases:**

**TC-060: Options List Display**

| Field | Content |
|-------|---------|
| ID | TC-060 |
| Module | User List Page |
| Name | Status Filter Dropdown-Options List Display |
| Type | Functional Test |
| Precondition | 1. Logged into system<br>2. User list page opened |
| Steps | 1. Find status filter dropdown<br>2. Click dropdown to expand options list<br>3. Check displayed options |
| Test Data | None |
| Expected | 1. Dropdown expands showing 3 options<br>2. Options are: All, Active, Disabled<br>3. Each option is clickable |
| Priority | P0 |

**TC-061: Default Value Verification**

| Field | Content |
|-------|---------|
| ID | TC-061 |
| Module | User List Page |
| Name | Status Filter Dropdown-Default Value Verification |
| Type | Functional Test |
| Precondition | 1. Logged into system<br>2. First time opening user list page |
| Steps | 1. Observe default display value of status filter dropdown |
| Test Data | None |
| Expected | 1. Dropdown default displays "All"<br>2. List displays user data of all statuses |
| Priority | P1 |

**TC-062: Option Selection Function**

| Field | Content |
|-------|---------|
| ID | TC-062 |
| Module | User List Page |
| Name | Status Filter Dropdown-Option Selection Function |
| Type | Functional Test |
| Precondition | 1. Logged into system<br>2. User list page opened |
| Steps | 1. Click status filter dropdown<br>2. Select "Active" option<br>3. Observe dropdown display value change<br>4. Observe list data change |
| Test Data | None |
| Expected | 1. Dropdown display value changes to "Active"<br>2. List only shows users with Status=Active<br>3. Dropdown auto-collapses |
| Priority | P0 |

---

### Rule 10: Tooltip / Tooltip

**Test Type**: UI Test

**Example Note:**
```
1. Tooltip content
   - Hover to show: 'Supports phone number or email login'
```

**Generated Test Cases:**

**TC-070: Tooltip Content Display**

| Field | Content |
|-------|---------|
| ID | TC-070 |
| Module | Login Page |
| Name | Help Icon-Tooltip Content Display |
| Type | UI Test |
| Precondition | 1. Login page opened<br>2. Help icon (?) exists next to username input |
| Steps | 1. Find help icon next to username input<br>2. Hover mouse over help icon<br>3. Wait for tooltip to appear<br>4. Observe tooltip content |
| Test Data | None |
| Expected | 1. Tooltip appears after hovering ~0.5 seconds<br>2. Tooltip content is: "Supports phone number or email login"<br>3. Tooltip displays near icon (above or to the right)<br>4. Tooltip disappears after mouse moves away |
| Priority | P2 |

---

### Rule 11: i18n / i18n

**Test Type**: i18n Test

**Example Note:**
```
2. i18n: English=Login, 中文=登录, 日本語=ログイン
```

**Generated Test Cases:**

**TC-080: English Language Display**

| Field | Content |
|-------|---------|
| ID | TC-080 |
| Module | Login Page |
| Name | Login Button-i18n-English Display |
| Type | i18n Test |
| Precondition | 1. Login page opened<br>2. System language set to English |
| Steps | 1. Refresh page to ensure language setting takes effect<br>2. Check login button text |
| Test Data | None |
| Expected | 1. Login button displays text "Login"<br>2. Other UI elements also display in English |
| Priority | P2 |

**TC-081: Chinese Language Display**

| Field | Content |
|-------|---------|
| ID | TC-081 |
| Module | Login Page |
| Name | Login Button-i18n-Chinese Display |
| Type | i18n Test |
| Precondition | 1. Login page opened<br>2. System language set to Chinese |
| Steps | 1. Switch system language to Chinese<br>2. Refresh page<br>3. Check login button text |
| Test Data | None |
| Expected | 1. Login button displays text "登录"<br>2. Other UI elements also display in Chinese |
| Priority | P2 |

---

## Section 6: Reading Table Elements

### Table Syntax

```solarwire
## @(100,50) w=500 border=1 note="""User list table
1. Data source
   - User list data from User Management module
2. Field descriptions
   - ID: Unique user identifier
   - Name: User display name
   - Status: 1=Active, 0=Disabled
3. Sorting rules
   - Support sorting by name and created time"""
  # bg=#F2F2F2
    "ID"
    "Name"
    "Status"
    "Actions"
  # bg=#FAFAFA
    "1"
    "John Doe"
    "Active"
    "View | Edit"
```

### Generated Test Cases for Tables

**TC-090: Column Header Display**

| Field | Content |
|-------|---------|
| ID | TC-090 |
| Module | User List Page |
| Name | User List Table-Column Header Display Verification |
| Type | UI Test |
| Precondition | 1. Logged into system<br>2. User list page opened |
| Steps | 1. Check table first row (header row)<br>2. Record column names |
| Test Data | None |
| Expected | 1. Header row background color is #F2F2F2<br>2. Column names in order: ID, Name, Status, Actions<br>3. Column name text displayed in bold |
| Priority | P2 |

**TC-091: Sort Function-Sort by Name**

| Field | Content |
|-------|---------|
| ID | TC-091 |
| Module | User List Page |
| Name | User List Table-Sort Function-Sort by Name |
| Type | Functional Test |
| Precondition | 1. Logged into system<br>2. User list page opened<br>3. Multiple data records exist in list |
| Steps | 1. Click Name column header<br>2. Observe sort indicator change<br>3. Record Name values of first and last rows<br>4. Click Name column header again<br>5. Observe sort order change |
| Test Data | None |
| Expected | 1. After click, Name column header shows sort arrow (ascending)<br>2. Data sorted by Name ascending (A-Z)<br>3. After clicking again, changes to descending (Z-A)<br>4. Arrow direction changes accordingly |
| Priority | P1 |

---

## Test Case Output Format

### Step 1: Generate Markdown Test Cases

First, write all test cases to `.solarwire/[requirement-name]/test-cases.md` in the following Markdown format:

```markdown
# Test Cases - [Project Name]

## Document Information
| Project Name | [Name] |
| Version | v1.0 |
| Base PRD | .solarwire/[req-name]/solarwire-prd.md |
| Created Date | [Date] |

## Change Log
| Version | Date | Changes |
|---------|------|---------|
| v1.0 | [Date] | Initial test cases generated |

## Test Cases

### [Module Name]

| ID | Module | Name | Type | Precondition | Steps | Test Data | Expected Result | Priority | Related | Boundary | Exception | Remark |
|----|--------|------|------|-------------|-------|-----------|----------------|----------|---------|----------|-----------|--------|
| TC-001 | Login Page | Login Button-Click Action-Normal Login Success | Functional Test | 1. Registered account... | 1. Enter username... | Username: test@example.com | 1. Login success... | P0 | US-001 | | | |
| TC-002 | Login Page | Login Button-Success Handling-Token Save Verification | Functional Test | 1. Login page opened... | 1. Enter valid username... | Username: test@example.com | 1. token field exists in Local Storage... | P0 | US-001 | | | |

### [Another Module Name]

| ID | Module | Name | Type | Precondition | Steps | Test Data | Expected Result | Priority | Related | Boundary | Exception | Remark |
|----|--------|------|------|-------------|-------|-----------|----------------|----------|---------|----------|-----------|--------|
| TC-050 | User List Page | User List Table-Data Source-Data Loading Verification | Functional Test | 1. Logged in as admin account... | 1. Open user list page... | None | 1. Table displays user data... | P1 | | | | |

## Statistics
| Item | Count |
|------|-------|
| Total | N |
| P0 | N |
| P1 | N |
| P2 | N |
| Functional Test | N |
| Form Validation | N |
| Boundary Test | N |
| Exception Test | N |
| UI Test | N |
| i18n Test | N |
```

### Step 2: Convert Markdown to Excel

After generating the Markdown file, convert it to xlsx using the generate-excel script:

```bash
node sw-skills/solarwire/lib/generate-excel.js from-md \
  --input .solarwire/[requirement-name]/test-cases.md \
  --output .solarwire/[requirement-name]/test-cases.xlsx
```

**Excel Output Structure**:
- **Test Cases** sheet: All test cases in a flat table with styled headers (blue) and priority color-coding (P0=red, P1=amber)
- **By Module** sheet: Test cases grouped by module with module headers
- **Statistics** sheet: Summary counts by priority, type, and module

**Alternative: Batch Mode** (for large PRDs, to avoid context overflow):

```bash
# Initialize
node sw-skills/solarwire/lib/generate-excel.js create --output .solarwire/[req-name]/test-cases.xlsx

# Append each module's test cases as they are generated
node sw-skills/solarwire/lib/generate-excel.js append-batch \
  --file .solarwire/[req-name]/test-cases.xlsx \
  --json-file .solarwire/[req-name]/batch-tc.json

# Finalize (generates xlsx from accumulated data)
node sw-skills/solarwire/lib/generate-excel.js finalize --file .solarwire/[req-name]/test-cases.xlsx
```

For batch mode, write each batch of test cases to `.solarwire/[req-name]/batch-tc.json` as a JSON array:
```json
[
  {"id":"TC-001","module":"Login Page","name":"Login Success","type":"Functional Test","precondition":"...","steps":"...","test_data":"...","expected":"...","priority":"P0"}
]
```

---

## Incremental Feature Test Cases

When adding test cases for incremental features (PRD already has existing test cases):

1. Add a **Regression Notes** section after Statistics
2. List potentially affected existing test cases
3. Only write new/changed test cases

### Regression Notes Template

```markdown
## Regression Notes

### Affected Existing Test Cases
| Test Case ID | Module | Impact | Action Required |
|-------------|--------|--------|----------------|
| TC-001 | Login Page | Login flow changed | Needs re-verification |

### New Test Cases
[Only new/changed test cases in standard format]
```

---

## Priority Rules

### Inherited Priority

| Source | Test Case Priority |
|--------|-------------------|
| User Story P0 | P0 |
| User Story P1 | P1 |
| User Story P2 | P2 |
| Feature P0 | P0 |
| Feature P1 | P1 |

### Default Priority by Test Type

| Test Type | Default Priority |
|-----------|-----------------|
| Functional Test - Core flow | P0 |
| Functional Test - Auxiliary function | P1 |
| Form Validation | P0 |
| Boundary Test | P1 |
| Exception Test | P1 |
| UI Test | P2 |
| i18n Test | P2 |

---

## Test Case Naming Convention

### Format

```
[Element definition]-[Test scenario]-[Specific condition/data]
```

### Examples

| Name | Description |
|------|-------------|
| Login Button-Click Action-Validate and Submit Login | Click login button functional test |
| Login Button-Success Handling-Token Save Verification | Token save verification after login success |
| Username Input-Input Rules-Phone Format Valid | Phone format validation |
| Username Input-Format Validation-Insufficient Digits | Phone insufficient digits validation |
| Login Button-Disabled State-Username Empty | Button disabled when username empty |
| User List Table-Field Display-Status Value Display | Table status field display verification |

---

## Workflow

### Step 1: Read PRD File

Read the PRD file at: `.solarwire/[requirement-name]/solarwire-prd.md`

### Step 2: Parse Document Structure

1. Extract document information (project name, version)
2. Extract user stories with Given-When-Then
3. Extract feature list
4. Extract business flow diagrams
5. Extract all SolarWire code blocks with notes

### Step 3: Generate Detailed Test Cases

For each section:
1. **User Stories** → Generate acceptance test cases with specific test data
2. **Features** → Generate feature coverage test cases
3. **Business Flows** → Generate flow path test cases
4. **SolarWire Notes** → Generate detailed UI/Functional/Boundary test cases

### Step 4: Add Specific Details

For each test case, ensure:
- **Precondition**: Specific, verifiable conditions
- **Steps**: Numbered, executable actions
- **Test Data**: Exact values to input
- **Expected Result**: Observable, verifiable outcomes

### Step 5: Output Test Cases

Write all test cases to `.solarwire/[requirement-name]/test-cases.md` in the Markdown format defined above.

**IMPORTANT**: To avoid context overflow, generate test cases in batches. Write each module's test cases as they are generated, then append the next module.

### Step 6: Convert to Excel

After all test cases are written to the .md file, run the conversion script:

```bash
node sw-skills/solarwire/lib/generate-excel.js from-md \
  --input .solarwire/[requirement-name]/test-cases.md \
  --output .solarwire/[requirement-name]/test-cases.xlsx
```

Verify the xlsx file was generated successfully.

### Step 7: Generate Statistics

After all test cases are generated, calculate and append the Statistics section.

---

## Important Reminders

1. **Executable Steps** - Each step must be a specific action, not vague description
2. **Verifiable Results** - Expected results must be checkable
3. **Specific Data** - Use exact test data values, not descriptions
4. **Complete Information** - All necessary context included in each test case
5. **Black-Box Only** - Focus on user-visible behavior
6. **Fine-Grained** - Each note item generates separate, detailed test cases
7. **Page-Based Modules** - Use `!title` as module name
8. **English Output** - Use English for field names and test case content (unless PRD is in another language)
9. **Excel Output** - Final output is .xlsx (generate .md first, then convert using `node sw-skills/solarwire/lib/generate-excel.js from-md`)
10. **NOTE MUST USE TRIPLE QUOTES** - When referencing SolarWire code in test cases, always use `note="""..."""`, NEVER use `note="..."` or `note='...'`
