# Component Library Workflow

## 1. Initialization

Before proceeding, read these reference files completely:

- `references/syntax.md` for all syntax rules and attribute constraints.
- `references/note-guide.md` for note writing rules (required if a component needs a behavioral note).

## 2. .swc File Structure

A `.swc` file is a Markdown-like format. It contains:
- **Metadata**: `id`, `version`, `description`, `author`, `createdAt`, `updatedAt`.
- **Categories**: `## Category Name` with `id` (format `cat-` prefix + kebab-case) and `parentId`.
- **Components**: `### Component Name` with `id` (kebab-case), `name`, `description`, `categoryId`, and a ` ```solarwire ` code block.

## 3. Component Code Rules

- Code must be valid SolarWire syntax per `references/syntax.md`.
- Coordinates are relative to the component's top-left corner; base point is `@(0,0)`.
- Avoid `<url>` image elements; use `[?"Image"]` placeholders instead.
- Text for labels must use `"text"` (not `["text"]`).
- For inputs/displays: `align=l vertical-align=m`.
- For buttons: `align=c vertical-align=m`.

## 4. Validation

After generating or modifying a component, validate its code:

```bash
node sw-skills/solarwire/validate-sw.js temp-code.txt
# or for the entire library
node sw-skills/solarwire/validate-sw.js path/to/library.swc
```

Fix syntax errors (e.g., `stroke`→`b`, `note="..."`→`note="""..."""`) and re-validate until clean.

## 5. Workflow for New Component Libraries

1.  Collect metadata (name, description, UUID).
2.  Define a category hierarchy.
3.  For each component, design its visual structure, write valid SolarWire code, validate it, and assign it an ID and category.
4.  Assemble the complete `.swc` structure.
5.  Save with the `.swc` extension.

## 6. Workflow for Modifying Existing Libraries

1.  Read and parse the existing `.swc` file.
2.  Add, modify, or delete components/categories as needed.
3.  Validate all changed code.
4.  Update version and `updatedAt` metadata.
5.  Save the updated `.swc` file.

## 7. Standard Category Suggestions

`cat-general` (parent: null) → `cat-button`, `cat-input`, `cat-container`, `cat-text`, `cat-navigation`, `cat-feedback`, `cat-data-display`, `cat-form`, `cat-layout`.

## 8. Important Reminders

- Validate after every change.
- No image elements.
- If a component includes a note, it must follow `references/note-guide.md`, especially the prohibition on implementation details.