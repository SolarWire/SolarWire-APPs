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

| Attribute | Type | Default | Description | Applicable Elements |
|------|------|--------|------|---------|
| `w=N` | number | Element-specific | Width | Rectangle, Circle, Placeholder, Image, Table |
| `h=N` | number | Element-specific | Height | Rectangle, Circle, Placeholder, Image, Table, Table Row |
| `bg=#hex` | color | Element-specific | Background color | Rectangle, Circle, Placeholder, Image, Table Row |
| `c=#hex` | color | #000000 | Text color | Rectangle, Circle, Text, Placeholder, Image, Line |
| `b=#hex` | color | #333333 | Border color / Line color | Rectangle, Circle, Placeholder, Image, Table, Line |
| `s=N` | number | 1 | Border width | Rectangle, Circle, Placeholder, Image, Line |
| `r=N` | number | 0 | Border radius | Rectangle |
| `size=N` | number | 12 | Font size | Rectangle, Circle, Text, Placeholder, Image, Line |
| `text-size=N` | number | — | Font size (alternative, prefer size) | Same as size |
| `bold` | boolean | false | Bold | Rectangle, Circle, Text, Placeholder |
| `italic` | boolean | false | Italic | Rectangle, Circle, Text, Placeholder |
| `align=l\|c\|r` | enum | l | Horizontal alignment | Rectangle, Circle, Text, Placeholder |
| `opacity=0~1` | number | 1 | Opacity | Rectangle, Circle, Text, Image |
| `line-height=N` | number | 22 | Line height | Rectangle, Circle, Text, Placeholder |
| `note="""..."""` | string | — | Functional description (supports triple-quote multiline) | Rectangle, Circle, Text, Placeholder, Image, Line, Table |
| `letter-spacing=N` | number | 0 | Letter spacing | Rectangle, Circle, Text, Placeholder |
| `vertical-align=t\|m\|b` | enum | t | Vertical alignment (top/middle/bottom) | Rectangle, Circle, Placeholder |
| `padding-top=N` | number | — | Top padding | Rectangle, Circle, Placeholder |
| `padding-right=N` | number | — | Right padding | Rectangle, Circle, Placeholder |
| `padding-bottom=N` | number | — | Bottom padding | Rectangle, Circle, Placeholder |
| `padding-left=N` | number | — | Left padding | Rectangle, Circle, Placeholder |
| `text-decoration=underline\|line-through` | enum | — | Text decoration (underline/line-through) | Rectangle, Circle, Text, Placeholder |
| `style=dashed\|dotted` | enum | — | Line style | Line |
| `shadow-x=N` | number | 0 | Shadow X offset | Rectangle, Circle, Text, Image |
| `shadow-y=N` | number | 0 | Shadow Y offset | Rectangle, Circle, Text, Image |
| `shadow-blur=N` | number | 0 | Shadow blur | Rectangle, Circle, Text, Image |
| `shadow-color=#hex` | color | transparent | Shadow color | Rectangle, Circle, Text, Image |

## Line-Specific Attributes

| Attribute | Type | Default | Description |
|------|------|--------|------|
| `b=#hex` | color | #333333 | Line color |
| `c=#hex` | color | #333333 | Label text color |
| `s=N` | number | 1 | Line width |
| `style=dashed\|dotted` | enum | — | Dashed line style |
| `size=N` | number | 12 | Label font size |

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

---

## Complete Attribute Examples

> Each example shows ALL available attributes for that element type with values.
> In practice, most attributes can be omitted — only specify what you need.
> Required attributes are marked with ★.

### Rectangle ★

```solarwire
["Button Text"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF b=#E5E7EB s=1 r=8 size=16 bold align=c vertical-align=m opacity=1 note="""Element description"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| w | ★ | — | Width |
| h | ★ | — | Height |
| bg | | transparent | Background color |
| c | | #333333 | Text color |
| b | | #333333 | Border color |
| s | | 1 | Border width |
| r | | 0 | Border radius |
| size | | 13 | Font size |
| bold | | false | Bold text |
| align | | l | Text horizontal alignment: l/c/r |
| vertical-align | | t | Text vertical alignment: t/m/b |
| opacity | | 1 | Element opacity (0-1) |
| note | | — | Element behavior description |

### Circle

```solarwire
("A") @(100,50) w=60 h=60 bg=#E5E7EB c=#6B7280 b=#D1D5DB s=1 size=16 bold align=c vertical-align=m opacity=1 note="""Avatar"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor (NOT center) |
| w | ★ | — | Diameter (width = height) |
| h | | same as w | Height (usually omitted, equals w) |
| bg | | transparent | Background color |
| c | | #333333 | Text color |
| b | | #333333 | Border color |
| s | | 1 | Border width |
| size | | 13 | Font size |
| bold | | false | Bold text |
| align | | c | Text alignment |
| vertical-align | | m | Text vertical alignment |
| opacity | | 1 | Element opacity |
| note | | — | Element behavior description |

### Text

```solarwire
"Title" @(100,50) c=#111827 size=24 bold opacity=1 note="""Section title"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| c | | #333333 | Text color |
| size | | 13 | Font size |
| bold | | false | Bold text |
| opacity | | 1 | Text opacity |
| note | | — | Element behavior description |

**Note**: Text elements do NOT support bg=, w=, h=, b=, s=, r=, align=, vertical-align=.

### Multi-line Text

```solarwire
"""Line 1
Line 2
Line 3""" @(100,50) w=300 c=#111827 size=13 bold opacity=1 note="""Description text"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| w | | — | Width for text wrapping |
| c | | #333333 | Text color |
| size | | 13 | Font size |
| bold | | false | Bold text |
| opacity | | 1 | Text opacity |
| note | | — | Element behavior description |

### Placeholder

```solarwire
[?"Image"] @(100,50) w=150 h=100 bg=#F3F4F6 c=#9CA3AF b=#D1D5DB s=1 r=4 opacity=1 note="""Image placeholder"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| w | ★ | — | Width |
| h | ★ | — | Height |
| bg | | #F3F4F6 | Background color |
| c | | #9CA3AF | Text color |
| b | | #D1D5DB | Border color |
| s | | 1 | Border width |
| r | | 0 | Border radius |
| opacity | | 1 | Element opacity |
| note | | — | Element behavior description |

### Image

```solarwire
<https://example.com/img.png> @(100,50) w=200 h=150 b=#E5E7EB s=1 r=0 opacity=1 note="""Product image"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| w | ★ | — | Width |
| h | ★ | — | Height |
| b | | #333333 | Border color |
| s | | 1 | Border width |
| r | | 0 | Border radius |
| opacity | | 1 | Image opacity |
| note | | — | Element behavior description |

### Line

```solarwire
-- @(50,200)->(450,200) b=#E5E7EB s=1 c=#6B7280 note="""Section divider"""
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x1,y1)->(x2,y2) | ★ | — | Start and end coordinates |
| b | | #333333 | Line color |
| s | | 1 | Line width |
| c | | #333333 | Label text color |
| style | | — | Line style: dashed/dotted |
| size | | 12 | Label font size |
| note | | — | Element behavior description |

**Important**: Line uses `b=` for line color (same as other elements' border color), `c=` for label text color (same as other elements' text color). Line does NOT support bg=, r=, align=, vertical-align=.

**Labeled Line Example:**

```solarwire
-"连接"- @(50,200)->(450,200) b=#E5E7EB c=#6B7280
```

### Table

```solarwire
## @(50,50) w=500 border=1 b=#E5E7EB s=1 r=0 opacity=1 note="""Data table"""
  # bg=#F9FAFB
    ["Header 1"] bold c=#111827
    ["Header 2"] bold c=#111827
  # bg=#FFFFFF
    ["Value 1"] c=#111827
    ["Value 2"] c=#111827
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| @(x,y) | ★ | — | Top-left anchor |
| w | ★ | — | Width |
| border | | 0 | Show borders (0 or 1) |
| b | | #333333 | Outer border color |
| s | | 1 | Outer border width |
| r | | 0 | Border radius |
| opacity | | 1 | Table opacity |
| note | | — | Element behavior description |

**Table Row** (`#` indented):
| Attribute | Notes |
|-----------|-------|
| bg | Row background color |

**Table Cell** (indented under row):
| Attribute | Notes |
|-----------|-------|
| bold | Bold text |
| c | Text color |
| bg | Cell background color (overrides row) |

**Note**: Table rows and cells do NOT support @(x,y), w, h — their positions and sizes are calculated automatically.

### Page Configuration (!)

```solarwire
!title="Page Title"
!c=#111827
!size=13
!bg=#F9FAFB
```

| Attribute | Required | Default | Notes |
|-----------|----------|---------|-------|
| title | ★ | — | Page title |
| c | | #333333 | Default text color |
| size | | 13 | Default font size |
| bg | | #FFFFFF | Default background color |

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
