---
name: solarwire-prd
description: Use when converting user notes/requirements into structured PRD with SolarWire wireframes, Mermaid diagrams, and SVG exports
---

# SolarWire PRD Generator v2.0

## Configuration

- **Output Directory**: `.solarwire` (modify here if needed)

---

## Overview

This skill generates complete Product Requirements Documents (PRD), including:
1. **Complete PRD Document** (.md format)
2. **Mermaid Flowcharts/Sequence Diagrams**
3. **SolarWire Wireframes** (each page with complete information and element descriptions)
4. **SVG Rendered Images** (with notes and without notes versions)

---

## Workflow

### Phase 0: Exploration & Preparation

**Goal: Understand project context and scope before collecting requirements**

**Step 0: Explore Project Context**
- Check existing code files (if any)
- Check existing documentation (if any)
- Check recent git commits (if any)
- Understand project background and goals

**Step 1: Scope Check**
- Determine if project needs to be decomposed into multiple sub-projects
- If too large, help user decompose and select first sub-project
- Decomposition criteria:
  - >5 independent modules → needs decomposition
  - >10 pages → needs decomposition
  - Multiple independent business flows → needs decomposition

**Step 2: Multiple Approaches Comparison (Optional)**
- Provide 2-3 design approaches
- Each with trade-off analysis
- Recommend one approach

---

### Phase 1: Requirements Collection

**Goal: Confirm user requirements step by step, don't rush to generate**

**Step 3: Product Type Confirmation**
```
What type of application is this?
- 📱 Mobile App
- 💻 Web Client
- ⚙️ Admin Dashboard
- 📺 Other (please describe)

Please select or describe your product type.
```

**Step 4: Core Features Confirmation**
```
What core features/pages does this product need?

For example:
- User Login/Register
- Home Page
- Profile Center
- Product List
- Order Management
...
```

**Step 5: Multi-language Confirmation**
```
Does this project require multi-language support?

If yes:
- Which languages need to be supported?
- Common options: English, 中文, 日本語, 한국어, Deutsch, Français, Español, etc.
- The default language will be set based on your primary language.

If no:
- All notes will be written in default language only.
- No i18n information will be added to any elements.
```

**⚠️ IMPORTANT: Multi-language Rules**

1. **Only when explicitly confirmed**: Add i18n information ONLY when user explicitly confirms multi-language support is needed
2. **Never add i18n if not requested**: If user says no multi-language, absolutely DO NOT add any i18n information
3. **All meaningful elements**: If multi-language is confirmed, ALL meaningful text elements MUST include i18n translations
4. **Default language**: Based on user's primary language (the language they use to communicate)

**Elements requiring i18n (if multi-language is confirmed):**
- Button text
- Label text
- Placeholder text
- Error/Success messages
- Table headers
- Menu items
- Page titles
- Status values

**Elements NOT requiring i18n:**
- User input data (usernames, comments, etc.)
- System generated data (IDs, timestamps, etc.)
- Decorative elements
- Icons

---

### Phase 2: Requirements Validation

**Step 6: Requirements Summary**
```
Here's my understanding of requirements:

**Product Type**: [Type]
**Core Pages**:
1. [Page 1] - [Brief description]
2. [Page 2] - [Brief description]
3. ...

**Multi-language**: [Yes/No + Languages]

**Special Requirements**:
- [Requirement 1]
- [Requirement 2]

Is this understanding correct? Any adjustments or additions needed?
```

**Step 7: Requirements Confirmation Gate**
- User MUST confirm requirements
- If adjustments needed, go back to Phase 1

---

### Phase 3: Generate & Quality

**Step 8: Generate PRD**
- Generate complete PRD document
- Save to `.solarwire/[project-name]/solarwire-prd.md`

**Step 9: Spec Self-Review**

#### Check 1: Placeholder Scan
```
Check items:
- Any "TBD", "To Be Determined", "待定"
- Any "TODO", "待完成"
- Incomplete sections
- Vague requirement descriptions

If found:
- Fix or clarify immediately
- No placeholders allowed
```

#### Check 2: Internal Consistency
```
Check items:
- Product type matches page design
- Core features list matches page details
- Multi-language rules are consistent throughout document
- Color standards are used consistently
- Font standards are used consistently

If contradictions found:
- Priority: Page details > Feature list > Product type
- Unify standards
```

#### Check 3: Scope Check
```
Check items:
- Focused on implementable scope
- Not too many independent subsystems
- Doesn't need decomposition

Criteria:
- If >5 independent modules → needs decomposition
- If >10 pages → needs decomposition
- If multiple independent business flows → needs decomposition

If needs decomposition:
- Go back to Phase 0 Step 1
- Help user decompose and select first sub-project
```

#### Check 4: Ambiguity Check
```
Check items:
- Requirements with two possible interpretations
- Vague business rules (e.g., "appropriate", "reasonable")
- Undefined terms

If ambiguity found:
- Choose one interpretation and make it explicit
- Add term definitions to Appendix
- Clarify business rules (e.g., "appropriate permissions" → "read-only permissions")

**Note: Visual ambiguity is allowed**
- Visual descriptions like "appropriate spacing", "reasonable layout" don't need quantification
- But functional requirements must be clear (e.g., "user can edit" not "user might be able to edit")
```

**Fix Principle:**
- Fix all issues immediately, no need to re-review
- Proceed to Step 10 after fixing

**Step 10: User Review Gate**
```
✅ PRD generated and passed self-review

**File Location:** `.solarwire/[project-name]/solarwire-prd.md`

**Includes:**
- Product Overview (1.1-1.4)
- Feature Scope (2.1-2.2)
- Business Flow (3.1-3.2)
- Page Design (4.1-5.x)
- Non-functional Requirements (6.1-6.3)
- Appendix (7.1-7.2)

**Please review:**
1. Completeness - Any missing features?
2. Accuracy - Any misunderstandings?
3. Page Design - Matches expectations?
4. Business Logic - Correct?

**Review Method:**
- Edit directly in file
- Or tell me what needs adjustment

**After review approval, I will:**
- Generate SVGs for all pages (with notes and without notes)
- Complete entire PRD generation process

Please start reviewing, let me know if you have any questions.
```

**User Review Gate Rules:**
- MUST wait for user to explicitly confirm "ok" or "no problem"
- If user requests changes, go back to Step 8 to regenerate PRD
- If user only needs minor adjustments, can fix before Step 11

---

### Phase 4: Output

**Step 11: Generate SVG**
- Run `node generate-svg.js .solarwire/[project-name]/solarwire-prd.md`
- Generate SVGs with notes and without notes

---

## Complete Checklist

You MUST complete each step in order:

**Phase 0: Exploration & Preparation**
1. [ ] Explore project context (code, docs, commits)
2. [ ] Scope check (needs decomposition?)
3. [ ] Multiple approaches comparison (optional)

**Phase 1: Requirements Collection**
4. [ ] Product type confirmation
5. [ ] Core features confirmation
6. [ ] Multi-language confirmation

**Phase 2: Requirements Validation**
7. [ ] Requirements summary
8. [ ] Requirements confirmation gate (user MUST confirm)

**Phase 3: Generate & Quality**
9. [ ] Generate PRD
10. [ ] Spec self-review (4 checks)
11. [ ] User review gate (user MUST review)

**Phase 4: Output**
12. [ ] Generate SVG

---

## Output File Structure

**All requirements are organized under the `.solarwire` directory, each in its own folder:**

```
.solarwire/                              # Root directory for all PRD outputs
├── [requirement-name-1]/                # Folder for requirement 1
│   ├── solarwire-prd.md                 # PRD document (fixed name)
│   ├── [page-name]-with-notes.svg       # Wireframe with notes
│   ├── [page-name]-without-notes.svg    # Wireframe without notes
│   └── ...                              # More SVGs for this requirement
│
├── [requirement-name-2]/                # Folder for requirement 2
│   ├── solarwire-prd.md
│   └── ...
│
└── ...                                  # More requirement folders
```

**Naming Convention:**
- Root directory: `.solarwire` (at project root)
- Requirement folder: Based on requirement/project name (e.g., `user-login-system/`, `order-management/`)
- PRD file: Always named `solarwire-prd.md`
- SVG files: Based on the `!title` attribute in each solarwire code block
  - Format: `[title-value]-with-notes.svg` and `[title-value]-without-notes.svg`
  - Title is converted to lowercase kebab-case (e.g., `!title="User Login"` → `user-login-with-notes.svg`)

---

## SVG Generation

This skill is **fully portable**. All dependencies are bundled in the `lib` directory.

After generating the PRD markdown file, run the SVG generation script:

```bash
node generate-svg.js .solarwire/[requirement-name]/solarwire-prd.md
```

**The script will:**
- Extract all `solarwire` code blocks from the markdown file
- Generate two SVG files for each block:
  - `[page-name]-with-notes.svg` - Includes note annotations
  - `[page-name]-without-notes.svg` - Clean wireframe only
- Save files to the same directory as the markdown file (the requirement folder)

**Updating Dependencies:**

If you need to update the bundled dependencies:

```bash
# Build the latest parser and renderer
cd SolarWire/packages/core/parser && npm run build
cd SolarWire/packages/core/renderer-svg && npm run build

# Copy to skill lib directory
cp -r SolarWire/packages/core/parser/dist/* solarwire-prd/lib/parser/
cp -r SolarWire/packages/core/renderer-svg/dist/* solarwire-prd/lib/renderer-svg/
```

---

## Red Flags

| Thought | Reality |
|---------|---------|
| "语法差不多就行" | 必须用 validate.js 验证所有 SolarWire 代码 |
| "这个页面太简单，不需要详细说明" | 每个页面必须有完整的功能和字段说明 |
| "用户没说要什么平台" | 必须确认平台场景，参考 SCENARIO-SPEC.md |
| "PRD 生成时已经检查过了" | 生成和评审是两个独立环节，必须单独评审 |
| "测试用例可以后面再补" | PRD 完成后必须立即生成测试用例，保证可追溯 |

## Reference Files

| 文件 | 内容 |
|------|------|
| `REFERENCE.md` | 完整 PRD 文档结构、SolarWire 线框图规范、SVG 输出规范 |
| `NOTE-WRITING.md` | 页面笔记编写规范（何时写、怎么写、常见错误） |
| `SCENARIO-SPEC.md` | 场景规格（Mobile/Web/Admin 的容器尺寸、元素尺寸、特有字段和规则） |
| `EXAMPLES.md` | 完整笔记示例（按钮、表单、表格、状态处理等） |
