# SolarWire Full Syntax Reference

> Coordinates `@(x,y)`, sizes, and colors in examples are for syntax demonstration ONLY and not prescriptive or defaults.

## 1. All Attributes
| Attribute | Type | Default | Applies To | Example |
|-----------|------|---------|------------|---------|
| `@(x, y)` | pos | REQ | ALL | `@(x,y)` |
| `w=N` | num | varies | Rect, Circle, Img, Table | `w=120` |
| `h=N` | num | varies | Rect, Circle, Img, Table | `h=40` |
| `bg=#hex` | color| varies | Rect, Circle, Img, Table | `bg=#3B82F6` |
| `c=#hex` | color| #333 | Rect, Circle, Text, Img, Line | `c=#FFFFFF` |
| `b=#hex` | color| #333 | Rect, Circle, Img, Table, Line | `b=#E5E7EB` |
| `s=N` | num | 1 | Rect, Circle, Img, Line | `s=1` |
| `r=N` | num | 0 | Rect | `r=8` |
| `size=N` | num | 13 | Rect, Circle, Text, Img, Line | `size=16` |
| `bold` | bool| false| Rect, Circle, Text | `bold` |
| `align=l|c|r` | enum| `l` | Rect, Circle, Text | `align=c` |
| `vertical-align=t|m|b` | enum| `t` | Rect, Circle | `vertical-align=m` |
| `opacity=0~1`| num | 1 | Rect, Circle, Text, Img | `opacity=0.5` |
| `note="""..."""`| str | - | Almost ALL | `note="""Button desc"""` |
| `style=dashed|dotted`| enum| - | Line | `style=dashed` |
| `padding-top`/`-right`/`-bottom`/`-left`| num | - | Rect, Circle | `padding-top=8` |
| ... (all other elements have a similar quick-reference) |

## 2. Element-Specific Rules
- **Tables**: A table is declared ONCE with `## @(x,y) w=N`. Each data row is ONE `#` line containing ALL cells separated by spaces. Each `#` line is a complete row, NOT a single cell. Within a row, each cell is a plain string or a Rectangle `["text"]`. Cells inherit `bg`/`c`/`size`/`align` from the row's `#` attributes unless overridden per-cell. Cells MUST NOT carry `w`, `h`, or `@`. A table with N data rows has exactly ONE `##` header and N `#` row lines.
- **Lines**: `c=` is for label color, `b=` is for line color.
- **Text**: Does NOT support `bg`, `b`, `s`, or `vertical-align`. Use `"text"` for any label that is display-only (not clickable, not editable). Only use `["text"]` (Rectangle) when the element is interactive (button, input, selectable item) or visually needs a distinct background/border to separate it from surrounding content. Misusing Rectangles for plain labels causes layout clutter and incorrect element hierarchy.

## 3. Common Mistakes & Forbidden Attributes
- `stroke`/`strokeWidth` -> Use `b`/`s`.
- `multiline`/`truncate` -> Not valid attributes.
- `(())` for circle -> Use `("text")`.
- `note="content"` -> Must use triple quotes `note="""content"""`.
- Simulating tables with Rectangles -> Must use `##` table syntax.
- Table cells with `w`/`h` -> Remove them.
- One `#` per cell (e.g. `# "col1"` then `# "col2"`) -> Merge into ONE `# "col1" "col2"` per row.
- Multiple `##` declarations for one table (one `##` per row) -> Use exactly ONE `##` header, then `#` rows.
- `["label"]` for non-interactive display text -> Use `"label"` (Text). Rectangles are only for interactive/container elements.