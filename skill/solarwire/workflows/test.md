# Test Case Generation Workflow

## 1. Initialization

Before proceeding, read these reference files completely:

- `references/syntax.md` for SolarWire syntax rules.
- `references/note-guide.md` for note structure and EARS style.
- `references/standards.md` for layout calculation rules (needed when reading wireframes).

## 2. Read the PRD

Read the PRD file at `.solarwire/[requirement-name]/solarwire-prd.md`.

Extract:
- User Stories (section 1.4) → Acceptance test cases.
- Feature List (section 2.1) → Feature coverage test cases.
- Business Flows (sections 3.x) → Flow path test cases.
- Page Details with SolarWire code blocks (section 6.x) → Detailed UI/Functional/Boundary test cases.

## 3. Test Case Quality Standards

Every test case must be executable, verifiable, exhaustive, and complete. Test cases guide testers to perform thorough, objective, quantifiable black-box testing. Each test case requires:
- ID, Module, Name, Type, Precondition, Steps, Test Data, Expected Result, Priority.

**Preconditions**: Must describe all prerequisite states in detail — login status, role permissions, existing data, current page location, system configuration. Never use vague descriptions like "已登录" without specifying the exact role and permissions.

**Test Data**: Must include ALL fields of the form, not only the fields under test. If test data depends on functionality not mentioned in the PRD, inspect the relevant code and derive test data from it.

**Steps**: Every step must be a concrete, executable action. Never use placeholders like "fill in valid data" — specify exact values.

**Expected Results**: Every field and every state must have a corresponding expected result that is observable and verifiable.

Do not trim, abbreviate, or omit content to save space. In engineering testing, brevity creates ambiguity; deliberate, moderate redundancy is correct.

## 4. Generation Rules

Generate test cases by reading SolarWire code blocks and extracting testable behavior from every `note="""..."""` block.

| Note Section | Test Type | What to Generate |
|--------------|-----------|------------------|
| Click action | Functional Test | Steps to perform the click and verify all observable results |
| Success handling | Functional Test | One test per success indicator, verifying each separately |
| Failure handling | Exception Test | One test per failure scenario, verifying the exact error message quoted in the note |
| Input rules | Form Validation + Boundary Test | Length boundaries (min-1, min, max, max+1), format validation (valid/invalid), character rules |
| Validation | Form Validation | Required check, format check, boundary check with exact error messages |
| Disabled conditions | UI Test | For each condition, verify disabled state (gray, no response, prohibited cursor) |
| Visibility conditions | UI Test | Verify both shown and hidden states |
| Data source | Functional Test | Data loading, default sort, field display (including empty states), status values |
| Options | Functional Test | Options list, default value, selection behavior |
| Tooltip content | UI Test | Tooltip appearance on hover, content, position, dismissal |
| i18n | i18n Test | For each language, verify correct text display |

## 5. Output

Write all test cases to `.solarwire/[requirement-name]/test-cases.md` using this structure:

```markdown
# Test Cases - [Project Name]

## Test Cases

### [Module Name]

| ID | Module | Name | Type | Precondition | Steps | Test Data | Expected Result | Priority | Related |
|----|--------|------|------|-------------|-------|-----------|----------------|----------|---------|
| TC-001 | Login Page | ... | Functional Test | ... | ... | ... | ... | P0 | US-001 |

## Statistics
| Item | Count |
|------|-------|
| Total | N |
| P0 | N |
| P1 | N |
| P2 | N |
```

## 6. Incremental Test Cases

When adding test cases for modified PRDs:
- Add a "Regression Notes" section listing potentially affected existing test cases.
- Only write new or changed test cases.

## 7. Priority Rules

- Inherit priority from PRD user stories (P0/P1/P2).
- Default by test type: core flow / form validation = P0, exception / boundary / auxiliary = P1, UI / i18n = P2.

## 8. Naming Convention

`[Element definition from note first line]-[Test scenario]-[Specific condition]`

## 9. Important Reminders

1.  Every step must be a specific action, not a vague description.
2.  Expected results must be observable and checkable.
3.  Use exact test data values, never placeholders like "valid data".
4.  Focus on user-visible behavior only (black-box testing).
5.  Each note item (each dash under a numbered section) generates a separate, fine-grained test case.
6.  Use `!title` from the SolarWire code block as the module name.
7.  Always use `note="""..."""` when referencing SolarWire code.