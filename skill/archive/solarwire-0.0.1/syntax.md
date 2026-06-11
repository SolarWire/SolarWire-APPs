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
| Line | `-- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) c=#E5E7EB` |
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
| `!gap=value` | number | `!gap=20` | Default gap |
| `!bg=value` | color | `!bg=#FFFFFF` | Default background color |
| `!r=value` | number | `!r=8` | Default border radius |
| `!bold` | boolean | `!bold` | Default bold (no value) |

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
-- "Label" -- @(100,50)->(300,50)
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
| `c=#hex` | color | #000000 | Text color | Rectangle, Circle, Text, Placeholder, Image |
| `b=#hex` | color | #333333 | Border color | Rectangle, Circle, Placeholder, Image, Table |
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
| `c=#hex` | color | #333333 | Line color |
| `s=N` | number | 1 | Line width |
| `style=dashed\|dotted` | enum | — | Dashed line style |
| `text-color=#hex` | color | #333333 | Label text color |
| `size=N` | number | 12 | Label font size |

## Table-Specific Rules

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

## Common Mistakes

| Wrong | Correct | Description |
|------|------|------|
| `stroke=#CCC` | `b=#CCC` | Border color uses `b`, not `stroke` |
| `strokeWidth=2` | `s=2` | Border width uses `s`, not `strokeWidth` |
| `multiline=true` | — | multiline attribute does not exist |
| `truncate=true` | — | truncate attribute does not exist |
| `# note="""..."""` | Add note on cell instead | Table rows do not support note attribute |
| `[Cell] w=100` | Remove w | Table cells cannot specify w/h |
| `-- @(50,50)->(100,50)` (in table) | Use other elements | Table cells cannot be lines |
| `bg #FFF` | `bg=#FFF` | Attributes must use = to connect |
| Element missing coordinates | Add `@(x,y)` | Every element should have coordinates |
| Tab indentation | Space indentation | Must use spaces |
| `(("Avatar"))` | `("Avatar")` | Circle uses single brackets `()`, not double brackets `(())` |
| `note="content"` | `note="""content"""` | note must use triple quotes `"""`, cannot use single/double quotes |

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

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `--` | Table `##` | Table Row `#` | Cell |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:---------:|:----------:|:------:|
| `w` | ✅ 100 | ✅ 100 | ✅ 0 | ✅ 100 | ✅ 100 | — | ✅ 600 | — | ❌ |
| `h` | ✅ 40 | ✅ 40 | — | ✅ 40 | ✅ 80 | — | ✅ 0(auto) | ✅ 40 | ❌ |
| `bg` | ✅ #ffffff | ✅ transparent | — | ✅ #f0f0f0 | ✅ #f0f0f0 | — | — | ✅ transparent | ✅ #ffffff |
| `b` | ✅ #333333 | ✅ #333333 | — | ✅ #999999 | ✅ #cccccc | — | ✅ #333333 | ✅(inherited) | ✅(inherited) |
| `s` | ✅ 1 | ✅ 1 | — | ✅ 1 | ✅ 0 | ✅ 1 | — | ✅(inherited) | ✅(inherited) |
| `r` | ✅ 0 | — | — | — | — | — | — | — | — |
| `border` | — | — | — | — | — | — | ✅ 1 | — | — |
| `cellspacing` | — | — | — | — | — | — | ✅ 0 | — | — |

### Text Attributes

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `--` | Table Row `#` | Cell |
|------|:---------:|:---------:|:---------:|:------------:|:---------:|:---------:|:----------:|:------:|
| `c` | ✅ #000000 | ✅ #000000 | ✅ #000000 | ✅ #999999 | ✅ #999999 | — | ✅(inherited) | ✅(inherited) |
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
| `text-color` | — | — | — | — | — | ✅ #333333 | — | — |

### Visual Effects

| Attribute | Rectangle `[]` | Circle `()` | Text `""` | Placeholder `[?]` | Image `<>` | Line `--` | Table `##` | Table Row `#` | Cell |
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

## Rectangle `[]`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | Width |
| `h` | number | 40 | Height |
| `bg` | color | #ffffff | Background color |
| `c` | color | #000000 | Text color |
| `b` | color | #333333 | Border color |
| `s` | number | 1 | Border width |
| `r` | number | 0 | Border radius (rounded rectangle when r>0) |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `bold` | boolean | false | Bold |
| `italic` | boolean | false | Italic |
| `align` | enum(l/c/r) | l | Horizontal alignment |
| `vertical-align` | enum(t/m/b) | t | Vertical alignment (top/middle/bottom) |
| `line-height` | number | 22 | Line height |
| `letter-spacing` | number | 0 | Letter spacing |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (underline/line-through) |
| `padding-top` | number | 8 | Top padding |
| `padding-right` | number | 8 | Right padding |
| `padding-bottom` | number | 8 | Bottom padding |
| `padding-left` | number | 8 | Left padding |
| `opacity` | number(0~1) | 1 | Opacity |
| `shadow-x` | number | 0 | Shadow X offset |
| `shadow-y` | number | 0 | Shadow Y offset |
| `shadow-blur` | number | 0 | Shadow blur |
| `shadow-color` | color | transparent | Shadow color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

## Circle `()`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | Width (determines circle's horizontal diameter) |
| `h` | number | 40 | Height (determines circle's vertical diameter) |
| `bg` | color | transparent | Background color |
| `c` | color | #000000 | Text color |
| `b` | color | #333333 | Border color |
| `s` | number | 1 | Border width |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `bold` | boolean | false | Bold |
| `italic` | boolean | false | Italic |
| `align` | enum(l/c/r) | c | Horizontal alignment |
| `vertical-align` | enum(t/m/b) | m | Vertical alignment (top/middle/bottom) |
| `line-height` | number | 22 | Line height |
| `letter-spacing` | number | 0 | Letter spacing |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (underline/line-through) |
| `padding-top` | number | 4 | Top padding |
| `padding-right` | number | 4 | Right padding |
| `padding-bottom` | number | 4 | Bottom padding |
| `padding-left` | number | 4 | Left padding |
| `opacity` | number(0~1) | 1 | Opacity |
| `shadow-x` | number | 0 | Shadow X offset |
| `shadow-y` | number | 0 | Shadow Y offset |
| `shadow-blur` | number | 0 | Shadow blur |
| `shadow-color` | color | transparent | Shadow color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

> Text area is 70% of the inscribed rectangle (w×0.7 × h×0.7)

## Text `""`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 0 | Width (0=auto-calculate text width) |
| `c` | color | #000000 | Text color |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `bold` | boolean | false | Bold |
| `italic` | boolean | false | Italic |
| `align` | enum(l/c/r) | l | Horizontal alignment |
| `line-height` | number | 22 | Line height |
| `letter-spacing` | number | 0 | Letter spacing |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (underline/line-through) |
| `opacity` | number(0~1) | 1 | Opacity |
| `shadow-x` | number | 0 | Shadow X offset |
| `shadow-y` | number | 0 | Shadow Y offset |
| `shadow-blur` | number | 0 | Shadow blur |
| `shadow-color` | color | transparent | Shadow color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

> Plain text does not support `vertical-align`, `padding`, `bg`, `b`, `s` (no border container)

## Multi-line Text `"""___"""`

Used for displaying multi-line text content, such as paragraphs, descriptions, etc. Attributes are identical to Text `""`.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 0 | Width (0=auto-calculate) |
| `c` | color | #000000 | Text color |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `bold` | boolean | false | Bold |
| `italic` | boolean | false | Italic |
| `align` | enum(l/c/r) | l | Horizontal alignment |
| `line-height` | number | 22 | Line height |
| `letter-spacing` | number | 0 | Letter spacing |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (underline/line-through) |
| `opacity` | number(0~1) | 1 | Opacity |
| `shadow-x` | number | 0 | Shadow X offset |
| `shadow-y` | number | 0 | Shadow Y offset |
| `shadow-blur` | number | 0 | Shadow blur |
| `shadow-color` | color | transparent | Shadow color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

**Syntax:** `"""Line 1\nLine 2\nLine 3""" @(x,y)`

**Example:**
```solarwire
"""User agreement content...
1. Article 1
2. Article 2
3. Article 3""" @(100,50) w=300 size=12
```

## Placeholder `[?]`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | Width |
| `h` | number | 40 | Height |
| `bg` | color | #f0f0f0 | Background color |
| `c` | color | #999999 | Text color |
| `b` | color | #999999 | Border color |
| `s` | number | 1 | Border width |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `bold` | boolean | false | Bold |
| `italic` | boolean | false | Italic |
| `align` | enum(l/c/r) | c | Horizontal alignment |
| `vertical-align` | enum(t/m/b) | m | Vertical alignment (top/middle/bottom) |
| `line-height` | number | 22 | Line height |
| `letter-spacing` | number | 0 | Letter spacing |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (underline/line-through) |
| `padding-top` | number | 8 | Top padding |
| `padding-right` | number | 8 | Right padding |
| `padding-bottom` | number | 8 | Bottom padding |
| `padding-left` | number | 8 | Left padding |
| `note` | string | — | Functional description (supports triple-quote multiline) |

> Placeholder does not support `opacity`, `shadow-*`

## Image `<>`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 100 | Width |
| `h` | number | 80 | Height |
| `bg` | color | #f0f0f0 | Background color (shown when no URL) |
| `c` | color | #999999 | Icon/text color (shown when no URL) |
| `b` | color | #cccccc | Border color |
| `s` | number | 0 | Border width |
| `size` | number | 12 | Font size |
| `text-size` | number | — | Font size (alternative, prefer size) |
| `opacity` | number(0~1) | 1 | Opacity |
| `shadow-x` | number | 0 | Shadow X offset |
| `shadow-y` | number | 0 | Shadow Y offset |
| `shadow-blur` | number | 0 | Shadow blur |
| `shadow-color` | color | transparent | Shadow color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

## Line `--`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `c` | color | #333333 | Line color |
| `s` | number | 1 | Line width |
| `style` | enum(dashed/dotted) | — | Dashed line style |
| `size` | number | 12 | Label font size |
| `text-size` | number | — | Label font size (alternative, prefer size) |
| `text-color` | color | #333333 | Label text color |
| `note` | string | — | Functional description (supports triple-quote multiline) |

## Table `##`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `w` | number | 600 | Table width |
| `h` | number | 0 | Table height (0=auto-calculate) |
| `b` | color | #333333 | Outer border color |
| `border` | number | 1 | Outer border width |
| `cellspacing` | number | 0 | Cell spacing |
| `note` | string | — | Functional description (supports triple-quote multiline) |

## Table Row `#`

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `bg` | color | transparent | Row background color |
| `h` | number | 40 | Row height |
| `c` | color | — | Text color (inherited by cells) |
| `b` | color | — | Border color (inherited by cells) |
| `s` | number | — | Border width (inherited by cells) |
| `size` | number | — | Font size (inherited by cells) |
| `bold` | boolean | — | Bold (inherited by cells) |
| `italic` | boolean | — | Italic (inherited by cells) |
| `align` | enum(l/c/r) | — | Horizontal alignment (inherited by cells) |
| `vertical-align` | enum(t/m/b) | — | Vertical alignment (inherited by cells) |
| `line-height` | number | — | Line height (inherited by cells) |
| `letter-spacing` | number | — | Letter spacing (inherited by cells) |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (inherited by cells) |
| `padding-top` | number | — | Top padding (inherited by cells) |
| `padding-right` | number | — | Right padding (inherited by cells) |
| `padding-bottom` | number | — | Bottom padding (inherited by cells) |
| `padding-left` | number | — | Left padding (inherited by cells) |

**Note:** Table rows do not support the `note` attribute; using it causes render errors.

## Table Cell (inside #)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `colspan` | number | 1 | Column span count |
| `rowspan` | number | 1 | Row span count |
| `bg` | color | #ffffff | Background color (inheritable from row) |
| `c` | color | #000000 | Text color (inheritable from row) |
| `b` | color | #333333 | Border color (inheritable from row) |
| `s` | number | 1 | Border width (inheritable from row) |
| `size` | number | 12 | Font size (inheritable from row) |
| `bold` | boolean | false | Bold (inheritable from row) |
| `italic` | boolean | false | Italic (inheritable from row) |
| `align` | enum(l/c/r) | l | Horizontal alignment (inheritable from row) |
| `vertical-align` | enum(t/m/b) | t | Vertical alignment (inheritable from row) |
| `line-height` | number | 22 | Line height (inheritable from row) |
| `letter-spacing` | number | 0 | Letter spacing (inheritable from row) |
| `text-decoration` | enum(underline/line-through) | — | Text decoration (inheritable from row) |
| `padding-top` | number | — | Top padding (inheritable from row) |
| `padding-right` | number | — | Right padding (inheritable from row) |
| `padding-bottom` | number | — | Bottom padding (inheritable from row) |
| `padding-left` | number | — | Left padding (inheritable from row) |

**Restrictions:**
- Cells cannot specify `w` or `h` (size is auto-calculated by table; specifying causes render errors)
- Cells cannot be line elements (causes render errors)
- Supported cell element types: Text `""`, Rectangle `[]` (rounded rectangle when r>0), Circle `()`, Placeholder `[?]`, Multi-line Text `"""___"""`
- **Recommended**: Use Rectangle `[""]` for cell content instead of Text `""` — rectangles support more text formatting options (bold, italic, size, color, alignment, padding, etc.)
