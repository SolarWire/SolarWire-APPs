# SolarWire

> A complete workspace for the [SolarWire](https://github.com/SolarWire) document format — code editing, visual drag-and-drop editing, Markdown editing, real-time preview, batch SVG generation, and AI-assisted software development.

SolarWire is a human-readable markup language for describing visual documents. A single `.sw` file can express rectangles, text, lines, tables, images, and placeholders with explicit coordinates, sizes, and styles. The same source feeds the code editor, the visual canvas, and the SVG renderer — so **what you edit is exactly what gets rendered**.

```solarwire
!title=Sample Document

[Rectangle]          @(100, 100) width=200 height=100 color=blue
(Rounded Rectangle)  @(400, 100) width=200 height=100 color=green
((Circle))           @(700, 100) radius=50 color=red
"Hello SolarWire"    @(400, 300) font-size=24 bold
-"Connect"-          @(200, 200)->(400, 200) color=black

## @(100, 400) width=800 height=300
  #
    [Header 1]
    [Header 2]
    [Header 3]
  #
    [Cell 1]
    [Cell 2]
    [Cell 3]
```

---

## What is in this repository

This monorepo hosts **three independently usable products** that share the same SolarWire parser and SVG renderer:

| Product | Path | Description |
|---------|------|-------------|
| **SolarWire Editor (Desktop)** | [`editor/`](./editor) | Cross-platform Electron desktop application. Full-featured visual + code editing with Git integration and direct local file-system access. |
| **SolarWire Editor (Web)** | [`editor-server/`](./editor-server) | Browser-based editor backed by a Node.js + Express server. Runs locally or in Docker — no install required for end users. |
| **SolarWire AI Skills** | [`skill/`](./skill) | Progressive-disclosure skill packages for AI coding assistants (Claude Code, Cursor, etc.) that produce SolarWire wireframes, PRDs, test cases, and implementation plans. |

For an in-depth walkthrough of the codebase, see [CODE_WIKI.md](./CODE_WIKI.md).

---

## Choosing between Desktop and Web

| Concern | `editor/` (Desktop) | `editor-server/` (Web) |
|---------|---------------------|------------------------|
| Install | Per-OS installer | Browser, or single Docker container |
| File access | Native FS, fast for large files | HTTP API, works over the network |
| Git integration | Built-in (checkout, diff, reset) | None |
| Distribution | Per-platform installers | Docker image or static server |
| Best for | Daily driver on a workstation | Shared team server, demos, CI previews |

Both share the same React component layer, so the editing experience is consistent across platforms.

---

## Quick start

### Desktop editor

```bash
cd editor
npm install
npm run dev          # Vite + Electron with HMR
npm run build        # TypeScript + Vite + electron-builder
```

See [`editor/README.md`](./editor/README.md) for the full command list
(type-check, lint, test, package).

### Web editor

```bash
cd editor-server
npm run install:all  # root + client + server
npm run dev          # Concurrent client (Vite) and server (Express)
```

Or with Docker:

```bash
cd editor-server
npm run docker:build
docker run -p 3000:3000 \
  -v "$(pwd)/editor-server/workspace:/app/workspace" \
  solarwire-server
```

Then open <http://localhost:5173> (dev) or <http://localhost:3000> (Docker).

### AI skills

Copy the contents of `skill/solarwire/` into the assistant's skill directory
(for Claude Code, that's `~/.claude/skills/solarwire/`). The skill is
progressive — start with [`SKILL.md`](./skill/solarwire/SKILL.md), then
follow its intent router to the appropriate workflow.

---

## Repository layout

```
SolarWire-APP/
├── editor/                # Electron desktop application
│   ├── src/
│   │   ├── app/           # Renderer process (React)
│   │   ├── main/          # Main process (Node, IPC handlers)
│   │   ├── preload/       # Context bridge
│   │   ├── lib/           # parser, renderer
│   │   └── shared/        # types, utils, hooks
│   ├── public/            # Static assets (Monaco Editor bundle, logos)
│   ├── build/             # electron-builder assets
│   ├── electron-builder.yml
│   └── package.json
│
├── editor-server/         # Web application
│   ├── client/            # React + Vite frontend
│   ├── server/            # Express backend
│   ├── packages/          # Shared libraries
│   │   ├── parser/        # SolarWire parser (PEG.js)
│   │   └── renderer-svg/  # SVG renderer
│   ├── workspace/         # Default working directory (user files)
│   ├── Dockerfile
│   └── package.json
│
├── skill/                 # AI assistant skill packages
│   ├── solarwire/         # Current SolarWire skill
│   └── archive/           # Historical versions (kept for reference)
│
├── README.md              # This file
├── CODE_WIKI.md           # Codebase walkthrough (for contributors)
├── LICENSE                # Apache-2.0
└── .gitignore
```

---

## Tech stack

| Layer | Technology | Version |
|-------|------------|---------|
| Desktop shell | Electron | 27 |
| Frontend | React + TypeScript | 19 / 5 |
| Build tooling | Vite | 5 |
| State management | Zustand | 4 |
| Code editor | Monaco Editor | 0.55 |
| Rendering | SVG via `@solarwire/renderer-svg` | 1.x |
| Parser | PEG.js (via `@solarwire/parser`) | 4 / 1.6 |
| Backend (web) | Node.js + Express | 20 / 4 |
| Container | Docker (Alpine, multi-stage) | — |
| Testing | Vitest + Playwright | 1 / 4 |

---

## SolarWire language reference

### Document declarations

Lines beginning with `!` set document properties:

```solarwire
!title=Document Title
!author=Author Name
```

### Simple elements

| Element | Syntax | Example |
|---------|--------|---------|
| Rectangle | `[text]` | `[Rectangle] @(100, 100) width=200 height=100` |
| Rounded rectangle | `(text)` | `(Rounded) @(100, 100) width=200 height=100` |
| Circle | `((text))` | `((Circle)) @(700, 100) radius=50` |
| Text | `"text"` | `"Hello" @(400, 300) font-size=20` |
| Placeholder | `[?text]` | `[?Placeholder] @(100, 100) width=200 height=100` |
| Image | `<url>` | `<https://example.com/x.png> @(100, 100) width=200` |
| Line | `--` / `-"label"-` | `-"Connect"- @(200, 200)->(400, 200)` |

### Container elements

| Element | Syntax |
|---------|--------|
| Table | `## @(x, y) width=W height=H` |
| Row | `#  @(x, y) height=H` |

### Common attributes

- **Position:** `@(x, y)`
- **Size:** `width=200 height=100`
- **Style:** `color=blue font-size=20 bold italic`
- **Note:** `note="""Single line note"""` or multi-line via raw newlines inside `"""…"""`
- **Boolean flags:** a bare key is treated as `key=true` (e.g. `bold`)

### Value types

- **Double-quoted string:** `"content"` — supports `\n` and `\"`
- **Triple-quoted string:** `"""content"""` — supports multi-line content
- **Simple value:** any string without spaces or `=` (e.g. `red`, `200`)

### Comments

Single-line comments use `//`:

```solarwire
// This is a comment
[Rectangle] @(100, 100) width=200 height=100
```

---

## Development workflow

### Code style

Both editor and editor-server use ESLint (TypeScript) and Stylelint
(CSS modules). Run the linters before opening a pull request:

```bash
# editor/
cd editor && npm run lint:all

# editor-server/client/
cd editor-server/client && npm run lint
```

### Type-checking

```bash
# editor/
cd editor && npm run typecheck:all
```

### Testing

```bash
# editor/ (unit + E2E)
cd editor && npm run test:all

# editor-server/packages/parser/
cd editor-server/packages/parser && npm test
```

### Branching model

- `main` — always releasable
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `docs/<name>` — documentation only

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository and create a topic branch.
2. Run `npm run lint:all` and the test suite in the affected subproject.
3. Keep commits focused; use [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
4. Open a pull request describing the change and its motivation.

Bug reports and feature requests go through
[GitHub Issues](../../issues).

---

## License

Copyright 2026 SolarWire Contributors.

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for
the full text.
