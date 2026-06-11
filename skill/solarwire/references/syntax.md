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
| `align=l|c|r` | enum| `l` | Rect, Circle | `align=c` |
| `vertical-align=t|m|b` | enum| `t` | Rect, Circle | `vertical-align=m` |
| `opacity=0~1`| num | 1 | Rect, Circle, Text, Img | `opacity=0.5` |
| `note="""..."""`| str | - | Almost ALL | `note="""Button desc"""` |
| `style=dashed|dotted`| enum| - | Line | `style=dashed` |
| `padding-top`/`-right`/`-bottom`/`-left`| num | - | Rect, Circle | `padding-top=8` |
| ... (all other elements have a similar quick-reference) |

## 2. Code Block Directives
- Every SolarWire code block's first line MUST be `!title="页面名称"`, declaring the page name. This is a block-level directive, not an element attribute. It applies to the entire code block.
- Comments within a code block use `//` prefix. Comment lines are ignored by the parser and MUST NOT carry attributes or coordinates.

## 3. Element-Specific Rules
- **Rectangles**: Internal text is optional. Use `[""]` for a container, divider, or spacer with no text. For interactive elements (buttons, inputs, selectable items), use `["text"]` with appropriate visual attributes (`bg`, `b`, etc.).
- **Text**: Use `"text" @(x,y)` for display-only labels, static text, tags, and any non-interactive text content. Text supports ONLY `c`, `size`, `bold`, and `opacity`. Text does NOT support `bg`, `b`, `s`, `r`, `align`, `vertical-align`, `w`, `h`, or `padding-*`. Never attach layout attributes to Text elements.
- **Tables**: A table is declared ONCE with `## @(x,y) w=N` (no indentation). Each data row is a `#` line indented with 2 spaces; row-level attributes (`bg`, `c`, `size`, `align`) go on this `#` line. Each cell is on its own line indented with 4 spaces, as a quoted cell value (e.g. `"代理名称"`) or a Rectangle `["text"]`. Cells inherit attributes from their parent `#` row unless overridden per-cell. Cells MUST NOT carry `w`, `h`, or `@`. A table with N data rows has exactly ONE `##` header and N `#` row lines.
- **Lines**: `c=` is for label color, `b=` is for line color.
- **w and h**: Both MUST be specified as numeric values (e.g. `w=120`, `h=40`). Values like `auto` are NOT valid. Every element with `w`/`h` must have an explicit number.

## 4. Common Mistakes & Forbidden Attributes
- `stroke`/`strokeWidth` -> Use `b`/`s`.
- `multiline`/`truncate` -> Not valid attributes.
- `(())` for circle -> Use `("text")`.
- `note="content"` -> Must use triple quotes `note="""content"""`.
- Simulating tables with Rectangles -> Must use `##` table syntax.
- Table cells with `w`/`h` -> Remove them.
- Multiple `##` declarations for one table (one `##` per row) -> Use exactly ONE `##` header, then `#` rows.
- `["label"]` for non-interactive display text -> Use `"label"` (Text) instead.
- Text with `align`, `bg`, `b`, `s`, `vertical-align`, `w`, or `h` -> Remove these attributes. Text only supports `c`, `size`, `bold`, `opacity`.
- `w=auto` or `h=auto` -> Must use numeric values only.
- Missing `!title="页面名称"` as first line of code block -> Add it. Every code block must declare its page name.