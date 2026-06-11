# SolarWire Syntax Reference

## Element Syntax Quick Reference

| Element | Syntax | Example |
|------|------|------|
| Rectangle | `["text"] @(x,y)` | `["Button"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| Rounded Rectangle | `["text"] @(x,y) r=N` | `["Card"] @(50,100) w=300 h=200 r=8` |
| Circle | `("text") @(x,y)` | `("Avatar") @(300,50) w=60` |
| Text | `"text" @(x,y)` | `"Title" @(100,50) size=24 bold` |
| Multi-line Text | `"""Line1\nLine2""" @(x,y)` | `"""Line 1\nLine 2""" @(100,50)` |
| Placeholder | `[?"text"] @(x,y)` | `[?"Image"] @(200,200) w=150 h=100` |
| Image | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| Line | `-- @(x1,y1)->(x2,y2)` / `-"label"- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) b=#E5E7EB` |
| Table | `## @(x,y)` | `## @(50,50) w=500` |
| Table Row | `  #` (indented) | `  # bg=#F3F4F6` |

## Document Declarations

Document declarations start with `!` prefix, must be at the top of the file, before any elements. Syntax: `!key=value` (boolean types have no value, e.g. `!bold`)

| Declaration | Type | Example | Description |
|------|------|------|------|
| `!title=value` | string | `!title="User Login Page"` | Page title |
| `!c=value` | color | `!c=#333333` | Default text color |
| `!size=value` | number | `!size=13` | Default font size |
| `!line-height=value` | number | `!line-height=22` | Default line height |
| `!gap=value` | number | `!gap=20` | Default table cell spacing (use only in component libraries, not in PRDs) |
| `!bg=value` | color | `!bg=#FFFFFF` | Default background color |
| `!r=value` | number | `!r=8` | Default border radius for all rectangles (overrides element-level `r`; avoid in PRDs) |
| `!bold` | boolean | `!bold` | Default bold for all text (avoid in PRDs) |

```solarwire
!title="User Login Page"
!c=#333333
!size=13
!line-height=22
!bg=#FFFFFF
```

## Coordinate System

### Absolute Coordinates

```solarwire
["Button"] @(100,50) w=120 h=40
```

### Line Endpoint

```solarwire
-- @(100,50)->(300,50) b=#E5E7EB
```

### Anchor Point Rules

All elements use top-left corner as anchor. `@(x,y)` specifies the element's top-left position.

## Indentation Rules

- Table row `#` must be indented more than table `##` (at least 2 spaces)
- Table cells must be indented more than table row `#` (at least 2 spaces)
- Use spaces for indentation, not tabs

```solarwire
## @(50,50) w=500
  #
    ["Header 1"]
    ["Header 2"]
  #
    ["Cell 1"]
    ["Cell 2"]
```

## Common Attributes

> **注意**：以下 Example 列中的坐标、尺寸和颜色仅为展示属性语法，不代表任何布局或色彩规范。生成实际 wireframe 时，坐标必须使用 standards.md 的公式计算，颜色必须使用 standards.md 的色板。

| Attribute | Type | Default | Description | Applicable Elements | Example |
|------|------|--------|------|---------|---------|
| `w=N` | number | Element-specific | Width | Rectangle, Circle, Placeholder, Image, Table | `["Btn"] @(100,50) w=120` |
| `h=N` | number | Element-specific | Height | Rectangle, Circle, Placeholder, Image, Table, Table Row | `["Btn"] @(100,50) h=40` |
| `bg=#hex` | color | Element-specific | Background color | Rectangle, Circle, Placeholder, Image, Table Row | `["Btn"] @(100,50) bg=#3B82F6` |
| `c=#hex` | color | #000000 | Text color | Rectangle, Circle, Text, Placeholder, Image, Line | `["Btn"] @(100,50) c=#FFFFFF` |
| `b=#hex` | color | #333333 | Border color / Line color | Rectangle, Circle, Placeholder, Image, Table, Line | `["Btn"] @(100,50) b=#E5E7EB` |
| `s=N` | number | 1 | Border width | Rectangle, Circle, Placeholder, Image, Line | `["Btn"] @(100,50) s=1` |
| `r=N` | number | 0 | Border radius | Rectangle | `["Btn"] @(100,50) r=8` |
| `size=N` | number | 12 | Font size | Rectangle, Circle, Text, Placeholder, Image, Line | `"Title" @(100,50) size=24` |
| `text-size=N` | number | — | Font size (alternative, prefer size) | Same as size | |
| `bold` | boolean | false | Bold | Rectangle, Circle, Text, Placeholder | `"Title" @(100,50) bold` |
| `italic` | boolean | false | Italic | Rectangle, Circle, Text, Placeholder | `"Text" @(100,50) italic` |
| `align=l\|c\|r` | enum | l | Horizontal alignment | Rectangle, Circle, Text, Placeholder | `["Btn"] @(100,50) align=c` |
| `opacity=0~1` | number | 1 | Opacity | Rectangle, Circle, Text, Image | `[] @(100,50) opacity=0.5` |
| `line-height=N` | number | 22 | Line height | Rectangle, Circle, Text, Placeholder | `"Text" @(100,50) line-height=22` |
| `note="""..."""` | string | — | Functional description (supports triple-quote multiline) | Rectangle, Circle, Text, Placeholder, Image, Line, Table | `["Btn"] @(100,50) note="""desc"""` |
| `letter-spacing=N` | number | 0 | Letter spacing | Rectangle, Circle, Text, Placeholder | `"Text" @(100,50) letter-spacing=1` |
| `vertical-align=t\|m\|b` | enum | t | Vertical alignment (top/middle/bottom) | Rectangle, Circle, Placeholder | `["Btn"] @(100,50) vertical-align=m` |
| `padding-top=N` | number | — | Top padding | Rectangle, Circle, Placeholder | `["Btn"] @(100,50) padding-top=8` |
| `padding-right=N` | number | — | Right padding | Rectangle, Circle, Placeholder | |
| `padding-bottom=N` | number | — | Bottom padding | Rectangle, Circle, Placeholder | |
| `padding-left=N` | number | — | Left padding | Rectangle, Circle, Placeholder | |
| `text-decoration=underline\|line-through` | enum | — | Text decoration (underline/line-through) | Rectangle, Circle, Text, Placeholder | `"Text" @(100,50) text-decoration=underline` |
| `style=dashed\|dotted` | enum | — | Line style | Line | `-- @(100,50)->(300,50) style=dashed` |
| `shadow-x=N` | number | 0 | Shadow X offset | Rectangle, Circle, Text, Image | `["Card"] @(100,50) shadow-x=2` |
| `shadow-y=N` | number | 0 | Shadow Y offset | Rectangle, Circle, Text, Image | |
| `shadow-blur=N` | number | 0 | Shadow blur | Rectangle, Circle, Text, Image | |
| `shadow-color=#hex` | color | transparent | Shadow color | Rectangle, Circle, Text, Image | |

## Line-Specific Notes

Line uses `b=` for line stroke color and `c=` for label text color (when using `-"label"-` syntax). Line does NOT support `bg=`, `r=`, `align=`, `vertical-align=`.

## Table-Specific Rules

**Mandatory**: When displaying multi-column or multi-row structured data, you must use the `##` table syntax. Do not simulate tables by aligning multiple Rectangles or Text elements side by side.

### Table `##` Specific Attributes

| Attribute | Type | Default | Description |
|------|------|--------|------|
| `w=N` | number | 600 | Table width |
| `h=N` | number | 0(auto) | Table height (0=auto-calculate) |
| `border=N` | number | 1 | Outer border width |
| `cellspacing=N` | number | 0 | Cell spacing |
| `b=#hex` | color | #333333 | Outer border color |

### Table Row `#` Rules

- Table rows do NOT support the `note` attribute (renderer will error)
- Table rows can inherit attributes to cells: `bg`, `c`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
- Table row `h=N` sets row height, default 40

### Table Cell Rules

- Cells CANNOT specify `w` or `h` attributes (renderer will error, size is auto-calculated)
- Cells CANNOT be line elements (renderer will error)
- Cells support `colspan=N` and `rowspan=N`
- Cells inherit from table row: `bg`, `c`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
- **Recommendation**: Use `["Text"]` (Rectangle) for cell content instead of `"Text"` — rectangles support more text formatting options (bold, italic, size, color, alignment, padding, etc.)

## Common Mistakes

| Wrong | Correct | Description |
|------|------|------|
| `stroke=#CCC` | `b=#CCC` | Border color uses `b`, not `stroke` |
| `strokeWidth=2` | `s=2` | Border width uses `s`, not `strokeWidth` |
| `multiline=true` | — | multiline attribute does not exist |
| `truncate=true` | — | truncate attribute does not exist |
| `# note="""..."""` | Add note on cell instead | Table rows do not support note attribute |
| `[Cell] w=100` | Remove w | Table cells cannot specify w/h |
| `- @(50,50)->(100,50)` (in table) | Use other elements | Table cells cannot be lines |
| `bg #FFF` | `bg=#FFF` | Attributes must use = to connect |
| Element missing coordinates | Add `@(x,y)` | Every element should have coordinates |
| Tab indentation | Space indentation | Must use spaces |
| `(("Avatar"))` | `("Avatar")` | Circle uses single brackets `()`, not double brackets `(())` |
| `note="content"` | `note="""content"""` | note must use triple quotes `"""`, cannot use single/double quotes |
| Simulating a table with multiple Rectangles | Use `##` table syntax | Structured data must use table element |

## Forbidden Attributes

The following attributes existed in old skills but are NOT supported by the renderer. NEVER use them:

| Hallucinated Attribute | Description |
|---------|------|
| `multiline` | Attribute does not exist |
| `truncate` | Attribute does not exist |
| `stroke` | Should use `b` (border color) |
| `strokeWidth` | Should use `s` (border width) |
| `(())` | Circle should use `("text")`, not `(("text"))` |
| `("text")` as rounded rectangle | Rounded rectangle should use `["text"] r=N`, `("text")` is circle

## Attribute Quick Reference Matrix

### Size & Border

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `-` | Table `##` | Table Row `#` | Cell |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:---------:|:----------:|:------:|
| `w` | ✅ 100 | ✅ 100 | ✅ 0 | ✅ 100 | ✅ 100 | — | ✅ 600 | — | ❌ |
| `h` | ✅ 40 | ✅ 40 | — | ✅ 40 | ✅ 80 | — | ✅ 0(auto) | ✅ 40 | ❌ |
| `bg` | ✅ #ffffff | ✅ transparent | — | ✅ #f0f0f0 | ✅ #f0f0f0 | — | — | ✅ transparent | ✅ #ffffff |
| `b` | ✅ #333333 | ✅ #333333 | — | ✅ #999999 | ✅ #cccccc | ✅ #333333 | ✅ #333333 | ✅(inherited) | ✅(inherited) |
| `s` | ✅ 1 | ✅ 1 | — | ✅ 1 | ✅ 0 | ✅ 1 | — | ✅(inherited) | ✅(inherited) |
| `r` | ✅ 0 | — | — | — | — | — | — | — | — |
| `border` | — | — | — | — | — | — | ✅ 1 | — | — |
| `cellspacing` | — | — | — | — | — | — | ✅ 0 | — | — |

### Text Attributes

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `--` | Table Row `#` | Cell |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:----------:|:------:|
| `c` | ✅ #000000 | ✅ #000000 | ✅ #000000 | ✅ #999999 | ✅ #999999 | ✅ #333333 | ✅(inherited) | ✅(inherited) |
| `size`/`text-size` | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12(label) | ✅(inherited) | ✅(inherited) |
| `bold` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `italic` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `align` | ✅ l | ✅ c | ✅ l | ✅ c | — | — | ✅(inherited) | ✅(inherited) |
| `vertical-align` | ✅ t | ✅ m | — | ✅ m | — | — | ✅(inherited) | ✅(inherited) |
| `line-height` | ✅ 22 | ✅ 22 | ✅ 22 | ✅ 22 | — | — | ✅(inherited) | ✅(inherited) |
| `letter-spacing` | ✅ 0 | ✅ 0 | ✅ 0 | ✅ 0 | — | — | ✅(inherited) | ✅(inherited) |
| `text-decoration` | ✅ | ✅ | ✅ | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `padding-top` | ✅ | ✅ | — | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `padding-right` | ✅ | ✅ | — | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `padding-bottom` | ✅ | ✅ | — | ✅ | — | — | ✅(inherited) | ✅(inherited) |
| `padding-left` | ✅ | ✅ | — | ✅ | — | — | ✅(inherited) | ✅(inherited) |

### Visual Effects

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `-` | Table `##` | Table Row `#` | Cell |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:---------:|:----------:|:------:|
| `opacity` | ✅ 1 | ✅ 1 | ✅ 1 | ❌ | ✅ 1 | — | — | — | — |
| `shadow-x` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-y` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-blur` | ✅ 0 | ✅ 0 | ✅ 0 | ❌ | ✅ 0 | — | — | — | — |
| `shadow-color` | ✅ transparent | ✅ transparent | ✅ transparent | ❌ | ✅ transparent | — | — | — | — |
| `style` | — | — | — | — | — | ✅ dashed/dotted | — | — | — |
| `note` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### Structural Attributes

| Attribute | Table `##` | Table Row `#` | Cell |
|------|:---------:|:----------:|:------:|
| `colspan` | — | — | ✅ 1 |
| `rowspan` | — | — | ✅ 1 |

> Table row attributes can be inherited by cells: `c`, `bg`, `b`, `s`, `size`, `bold`, `italic`, `align`, `line-height`, `letter-spacing`, `vertical-align`, `text-decoration`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
>
> Cells cannot specify `w` or `h` (size is auto-calculated by table; specifying causes render errors)
>
> Cells cannot be line elements (causes render errors)

## Element-Specific Notes

- **Circle**: Text area is 70% of the inscribed rectangle (w×0.7 × h×0.7)
- **Text**: Does NOT support `bg`, `b`, `s`, `r`, `vertical-align`, `padding-*` (no border container)
- **Multi-line Text**: Attributes identical to Text `""`; syntax: `"""Line 1\nLine 2\nLine 3""" @(x,y)`
- **Placeholder**: Does NOT support `opacity`, `shadow-*`
- **Line**: Uses `b=` for line color (same as other elements' border color), `c=` for label text color (same as other elements' text color); does NOT support `bg`, `r`, `align`, `vertical-align`
- **Table Row**: Does NOT support `note` attribute (causes render errors)
- **Table Cell**: Cannot specify `w` or `h` (auto-calculated); cannot be line elements; use Rectangle `[""]` for cell content (more formatting options than bare Text `""`)
