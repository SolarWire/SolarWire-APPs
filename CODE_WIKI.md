# SolarWire-APP Code Wiki

> A contributor-facing walkthrough of the SolarWire monorepo. For installation, usage, and feature overview, see [README.md](./README.md).

This document is organized to mirror the way you would explore the code:

1. The **shared core** (parser + SVG renderer) that both editors depend on.
2. The **desktop editor** — an Electron app at `editor/`.
3. The **web editor** — a Vite + Express app at `editor-server/`.
4. The **AI skill packages** at `skill/`.
5. **Cross-cutting concerns** (events, persistence, security).
6. **Build, test, and release** pipelines.

---

## 1. Repository overview

```
SolarWire-APP/
├── editor/                # Electron desktop app (Editor Mode: desktop)
├── editor-server/         # Vite + Express web app (Editor Mode: web)
│   ├── client/            # React + Vite frontend
│   ├── server/            # Express backend (REST API)
│   └── packages/          # Local workspace packages
│       ├── parser/        # @solarwire/parser
│       └── renderer-svg/  # @solarwire/renderer-svg
├── skill/                 # AI assistant skills (skill/solarwire, archive/)
├── README.md
├── CODE_WIKI.md           # this file
├── LICENSE
└── .gitignore
```

### 1.1 Component relationships

```
                          ┌──────────────────────────┐
                          │   @solarwire/parser      │  (PEG.js grammar,
                          │   @solarwire/renderer-svg│   AST types, SVG)
                          └────────────┬─────────────┘
                                       │  linked via
                                       │  file:./packages/*
                  ┌────────────────────┴────────────────────┐
                  │                                         │
        ┌─────────▼────────┐                     ┌─────────▼────────┐
        │     editor/      │                     │  editor-server/  │
        │   (Electron)     │                     │ (Vite + Express) │
        │                  │                     │                  │
        │  Main: Node FS   │                     │  Server: HTTP    │
        │  Renderer: React │                     │  Client: React   │
        │  IPC + preload   │                     │  REST /api/files │
        └──────────────────┘                     └──────────────────┘
                  │                                         │
                  └──────────────┬──────────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │   skill/    │  Progressive-disclosure
                          │  (AI docs)  │  skill packages for
                          └─────────────┘  Claude Code, Cursor, etc.
```

### 1.2 Stack summary

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

## 2. Shared core (`editor-server/packages/`)

Both editor applications consume the same parser and renderer through
local file-based packages.

### 2.1 `@solarwire/parser`

Path: [`editor-server/packages/parser/`](./editor-server/packages/parser)

A PEG.js-generated parser that converts SolarWire source text into a
typed AST (`Document` → `declarations[]` + `elements[]`).

| File | Purpose |
|------|---------|
| `src/grammar.pegjs` | Source grammar definition (PEG.js) |
| `src/index.ts` | Public API: `parse(input: string): Document` |
| `src/types.ts` | AST type definitions (`Document`, `Element`, `CoordinateExpression`, …) |
| `src/preprocessor.js` | Line-level preprocessing (notes, continuations) |
| `generate-parser.js` | Wraps `peggy` to compile `grammar.pegjs` → `parser.js` |

**Build pipeline:**

```bash
cd editor-server/packages/parser
npm run generate   # peggy grammar.pegjs → parser.js
npm run build      # tsc → dist/
```

**Element types** (the discriminated union in `types.ts`):

```
Element
├── RectangleElement       [text] @(x,y) width= height=
├── RoundedRectangleElement (text) @(x,y) width= height= radius=
├── CircleElement          ((text)) @(x,y) radius=
├── TextElement            "text" @(x,y) font-size= …
├── PlaceholderElement     [?text] @(x,y) width= height=
├── ImageElement           <url> @(x,y) width= height=
├── LineElement            -- / -"label"- @(x1,y1)->(x2,y2) color=
├── TableElement           ## @(x,y) width= height= (contains RowElement[])
└── RowElement             #  @(x,y) height= (contains CellElement[])
```

### 2.2 `@solarwire/renderer-svg`

Path: [`editor-server/packages/renderer-svg/`](./editor-server/packages/renderer-svg)

Converts a parsed `Document` into an SVG string.

| File | Purpose |
|------|---------|
| `src/index.ts` | Public `render(ast, options?)` |
| `src/renderer.ts` | Top-level dispatch + element iteration |
| `src/context.ts` | `RenderContext` — coordinate system, default styles |
| `src/elements/rectangle.ts` | Rectangle, RoundedRectangle, Placeholder |
| `src/elements/lineAndContainer.ts` | Line + Table/Row traversal |
| `src/elements/otherElements.ts` | Circle, Text, Image |

`RenderContext` carries inherited state (default font, primary color, viewBox)
as the renderer recurses through the AST. Child contexts are created with
`createChildContext()` so nested tables can override defaults locally.

### 2.3 Consumption pattern

In both `editor/` and `editor-server/client/`, these packages are
referenced via `file:` protocol in `package.json`:

```json
"@solarwire/parser":      "file:../packages/parser",
"@solarwire/renderer-svg": "file:../packages/renderer-svg"
```

`editor/` references them as `file:../../SolarWire/packages/core/...` in its
own `package.json`. When you change parser or renderer source, rebuild
inside the package directory first; downstream consumers will pick up the
`dist/` output on their next build.

---

## 3. Desktop editor (`editor/`)

Electron 27 app with three TS compile targets (renderer, main, preload).
The same React component layer is also used by `editor-server/client/`.

### 3.1 Process model

```
┌──────────────────────────────────────────────────────────────┐
│  Main Process (Node)                                          │
│  src/main/index.ts  → creates BrowserWindow, waits for Vite  │
│  src/main/ipc/*     → registers IPC channels                  │
│  src/main/file-manager.ts → Node fs wrappers                  │
│  src/main/workers/excel-parser-worker.ts → worker_threads     │
└───────────────────────┬──────────────────────────────────────┘
                        │  ipcMain.handle / contextBridge
┌───────────────────────▼──────────────────────────────────────┐
│  Preload (Context Bridge)                                     │
│  src/preload/index.ts → window.api = { readFile, writeFile,  │
│      getFileTree, … }                                         │
└───────────────────────┬──────────────────────────────────────┘
                        │  contextIsolation: true
┌───────────────────────▼──────────────────────────────────────┐
│  Renderer Process (React)                                     │
│  src/app/main.tsx → App → AppLayout → editor-modes/*          │
│  src/app/services/* (Zustand stores + EventBus)              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Main process

`src/main/index.ts` does three jobs:

1. **Window creation** — `createWindow()` configures a hardened
   `BrowserWindow` (`contextIsolation: true`, `sandbox: true`,
   `nodeIntegration: false`) and waits for the Vite dev server.
2. **Port discovery** — `findVitePort()` probes ports 3000–3010 via
   `electron.net.request` so concurrent Vite runs don’t conflict.
3. **CLI passthrough** — `extractPathFromArgv()` opens a file or
   directory passed on the command line (e.g. `solarwire .`).

**IPC handlers** (`src/main/ipc/`):

| File | Channel prefixes | Notes |
|------|------------------|-------|
| `index.ts` | — | Centralized registration |
| `file-handlers.ts` | `file:*` | 25+ channels: read/write/list/tree/rename/delete/exists, image base64, table parse/save (Excel + CSV via `papaparse` + `xlsx`), SolarWire snippet collection |
| `dialog-handlers.ts` | `dialog:*` | Native open/save dialogs |
| `system-handlers.ts` | `system:*` | OS-level integration |
| `test-handlers.ts` | `test:*` | Test-only channel |

### 3.3 Preload bridge

`src/preload/index.ts` exposes a typed `window.api` (mirrored in
`src/types/electron-api.d.ts`) with one method per IPC channel. The
`testAPI` is additionally attached when `NODE_ENV=test`.

### 3.4 Renderer process

```
src/app/
├── main.tsx                 # ReactDOM root, attaches global styles
├── App.tsx                  # Loads settings/i18n, mounts <AppLayout/>
├── components/
│   ├── layout/              # AppLayout, LeftPanel, MainContent, RightPanel, status bar
│   ├── editor/              # MonacoEditor, SolarWireVisualEditor, SolarWirePreview,
│   │                          PropertyPanel, ElementLibrary, LayerPanel, …
│   ├── editor-modes/        # BlankMode, SolarWireMode, MarkdownMode, library modes
│   ├── toolbar/             # SolarWireToolbar
│   ├── feedback/            # ToastLayer, NotificationLayer, ConfirmDialog
│   ├── ui/                  # ColorPicker, ConfirmModal, ResizableDivider, Scrollbar, …
│   └── views/               # FileView, ViewTabs, ComponentLibraryManagerView
├── hooks/                   # useImageDrop, useSelection, useTranslation
├── i18n/                    # locales/{en,zh}.ts, runtime loader
├── services/                # Cross-cutting services (see §3.5)
├── stores/                  # Zustand stores (see §3.6)
└── styles/global.css
```

The `editor-modes/` directory implements the four documented editing
modes; `MainContent` selects one based on file extension or user
context.

### 3.5 Services

`src/app/services/` holds cross-cutting business logic. Notable entries:

| Service | Responsibility |
|---------|----------------|
| `ComponentLibraryManager` | CRUD over component libraries; **singleton with `withLock()`** for atomic updates |
| `IndexedDBService` | Implements `IComponentLibraryStorage` — keeps component libraries persistent in IndexedDB |
| `IComponentLibraryStorage` | Storage abstraction; `ComponentLibraryManager` depends on this interface (DIP), not on `IndexedDBService` directly |
| `file-system-service.ts` | Wraps `window.api` for typed, renderer-side FS access |
| `monaco-service.ts` | Singleton that owns the active Monaco editor instance |
| `syntax-error-service.ts` | Cross-component syntax error reporting |
| `clipboard/` | Clipboard store, copy/paste service, types |
| `renderers/` | Coordinator + per-renderer adapters (`SolarWireRenderer`, `MarkdownRenderer`, `MermaidRenderer`, `GraphvizRenderer`) |

### 3.6 Zustand stores

`src/app/stores/`:

| Store | Responsibility |
|-------|----------------|
| `appStore` | Current view, theme, settings modal state |
| `editorStore` | Active content, edit mode, `isModified`, undo stack |
| `fileStore` | File tree, open/save, directory navigation, 30 s auto-refresh |
| `solarWireStore` | Selection, tool, pan mode, show notes, zoom |
| `previewStore` | Canvas viewport, drag/box-select state, snap guides |
| `selectionStore` | Cross-view selection |
| `componentLibraryStore` | Active library, CRUD operations |
| `settingsStore` | Primary color, favorites, selection tool, grid settings |
| `i18nStore` | Active language |
| `statusStore` | Status bar info |
| `previewStore` | Preview canvas state |
| `feedbackStore` | Toast / notification queue |

Stores communicate via the `EventBus` in `src/shared/utils/EventBus.ts`,
which exposes a typed `EditorEvents` enum:

```
CONTENT_CHANGED    MODE_CHANGED    FILE_OPENED
FILE_SAVED         SELECTION_CHANGED
SETTINGS_CHANGED   COMPONENT_LIBRARY_CHANGED
```

Example: `fileStore.openFileAtPath()` emits `CONTENT_CHANGED` +
`MODE_CHANGED`; `editorStore` subscribes and switches modes
accordingly.

### 3.7 Shared types & utils

`src/shared/`:

- `types/` — `app.ts`, `editor.ts`, `file.ts`, `component.ts`, `feedback.ts`, `index.ts`
- `utils/` — `EventBus`, coordinate converters, element alignment,
  element bounds detection, attribute updater, file utils, etc.
- `hooks/` — `useCoordinateSystem`, `useDragCoordinate`, `useTableEditor`

### 3.8 Build pipeline

```bash
cd editor
npm run build
```

1. `tsc -p tsconfig.main.json`     → `dist/main/`
2. `tsc -p tsconfig.preload.json`  → `dist/preload/`
3. `tsc -p tsconfig.app.json`      → renderer types checked
4. `vite build`                    → renderer bundle
5. `electron-builder`              → installers (NSIS / dmg / AppImage)

`electron-builder.yml` declares the per-platform targets. The
`build/installer.nsh` script customizes the Windows installer.

---

## 4. Web editor (`editor-server/`)

Browser-only editor that talks to a Node.js + Express backend over
HTTP. Designed to run either locally or in Docker.

### 4.1 Layout

```
editor-server/
├── client/                 # React + Vite SPA
├── server/                 # Express API
├── packages/               # @solarwire/parser, @solarwire/renderer-svg
├── workspace/              # Default working dir (mounted as a Docker volume)
├── Dockerfile              # Multi-stage Alpine build
└── package.json            # Root orchestrator (install:all, dev, build)
```

### 4.2 Server (`editor-server/server/`)

| Path | Purpose |
|------|---------|
| `src/index.ts` | Express bootstrap, CORS, static-serves `client/dist/app/`, mounts `/api/files` |
| `src/routes/files.ts` | File CRUD: `GET /tree`, `GET /read`, `POST /write`, `POST /mkdir`, `POST /rename`, `DELETE /file`, `DELETE /directory`, `POST /upload` (multer) |
| `src/middleware/security.ts` | `resolveSafePath()` + `workspaceGuard` — every path is normalized and confirmed to be inside `WORKSPACE_ROOT` to defeat path traversal |

**`/api/files` endpoints** (all paths relative to `workspace/`):

| Method | Path | Body / Query | Effect |
|--------|------|--------------|--------|
| `GET`  | `/tree?path=…` | – | Returns nested directory tree (excludes dot-files and `node_modules`) |
| `GET`  | `/read?path=…` | – | Reads file as text |
| `POST` | `/write` | `{ path, content }` | Writes text file |
| `POST` | `/mkdir` | `{ path }` | Creates a directory |
| `POST` | `/rename` | `{ oldPath, newPath }` | Renames file or directory |
| `DELETE` | `/file` | `{ path }` | Deletes a file |
| `DELETE` | `/directory` | `{ path }` | Recursively deletes a directory |
| `POST` | `/upload` | `multipart/form-data` | Stores upload in memory (10 MB cap) |

The server **does not** implement authentication. It is intended for
trusted local or VPN-bound deployments. See
[§6 Security](#6-security-model) for the threat model.

### 4.3 Client (`editor-server/client/`)

A near-mirror of `editor/src/app/` minus Electron-specific code:

- `src/app/main.tsx` — mounts React, then calls `createWebElectronAPI()`
  from `services/web-api-service.ts` to install a **drop-in replacement
  for `window.api`** that goes through HTTP instead of IPC.
- `src/app/services/web-api-service.ts` — implements the same
  `ElectronAPI` shape (`readFile`, `writeFile`, `openFileDialog`, …)
  against the HTTP API; `openFileDialog` falls back to an
  `<input type="file" webkitdirectory>` DOM picker.
- `src/shared/utils/api-client.ts` — typed HTTP client used by the
  service above.

The same `EventBus` and `EditorEvents` enum from `editor/src/shared/`
are reused, so the store layer is byte-for-byte compatible.

### 4.4 Docker

`editor-server/Dockerfile` is a four-stage Alpine build:

1. **packages-build** — installs and builds `@solarwire/parser` and
   `@solarwire/renderer-svg`.
2. **client-build** — `npm install` + `vite build` with the built
   packages in place.
3. **server-build** — installs Express, tsc-builds the server.
4. **runtime** — copies `server/dist`, `client/dist`, server
   `node_modules`, and seeds an empty `/app/workspace`.

`tini` is used as PID 1 to forward signals correctly. Mount
`./editor-server/workspace` to `/app/workspace` for persistence.

### 4.5 npm scripts

| Command | Effect |
|---------|--------|
| `npm run install:all` | Install root, client, server, and packages |
| `npm run dev`         | Run client (Vite, :5173) and server (tsx watch, :3000) concurrently |
| `npm run dev:client`  | Client only |
| `npm run dev:server`  | Server only |
| `npm run build`       | Build client (Vite) then server (tsc) |
| `npm run docker:build`| Build the production Docker image |
| `npm run docker:run`  | Run the image, mounting `./workspace` |

---

## 5. AI skill packages (`skill/`)

A self-contained set of skills for AI coding assistants (Claude Code,
Cursor, etc.). They consume the same SolarWire syntax as the editors,
but generate documents **about** SolarWire wireframes (PRDs, test
cases, dev designs).

### 5.1 Layout

```
skill/
├── solarwire/                 # Current version
│   ├── SKILL.md               # Entry point, intent router
│   ├── references/            # syntax.md, standards.md, note-guide.md
│   ├── workflows/             # prd.md, test.md, dev-design.md, implementation.md, component.md
│   └── scripts/               # lib/parser, validate-sw.js, generate-excel.js
└── archive/                   # Historical versions, kept for reference
    ├── solarwire-0.0.1 … solarwire-0.0.4
    └── solarwire-lite-0.0.1, solarwire-lite-0.0.2
```

### 5.2 Progressive disclosure

Each skill follows a three-layer loading strategy (described in
`SKILL.md`):

1. **Always active** — `SKILL.md` and the inline syntax quick reference.
2. **Task-specific** — a single `workflows/<name>.md` is loaded based
   on the assistant’s intent router.
3. **Deep dive** — workflow loads only the `references/*.md` it needs.

### 5.3 Workflows

| Workflow | Input | Output |
|----------|-------|--------|
| `prd.md`             | Discovery (Five Elements) | PRD with embedded SolarWire wireframes |
| `test.md`            | Confirmed PRD | Test cases in Given-When-Then form |
| `dev-design.md`      | Confirmed PRD  | Architecture / technical design |
| `implementation.md`  | PRD + dev design | Step-by-step implementation plan |
| `component.md`       | Intent to manage `.swc` files | Edit / add / remove component definitions |

### 5.4 Local scripts

`scripts/validate-sw.js` runs the local PEG parser to validate
SolarWire code blocks; `scripts/generate-excel.js` produces Excel
artifacts from table snippets. The `lib/parser/` directory is an
inlined, standalone copy of the parser so the skill can validate
without the editor running.

### 5.5 File-structure convention

Generated outputs land under `.solarwire/[requirement-name]/` in the
user's working directory. The requirement-name folder uses the format
`日期【系统-模块】需求` (e.g. `2025-01-15【ERP-财务】应收款-2`), in the
user's communication language.

---

## 6. Cross-cutting concerns

### 6.1 Event bus

`src/shared/utils/EventBus.ts` is the in-process pub/sub used by every
store. The `EditorEvents` enum is the canonical list of channels:

| Event | When emitted |
|-------|--------------|
| `CONTENT_CHANGED` | Editor content updated |
| `MODE_CHANGED` | Active editor mode flipped |
| `FILE_OPENED` | A file finished loading |
| `FILE_SAVED` | A file finished saving |
| `SELECTION_CHANGED` | Selection set changed |
| `SETTINGS_CHANGED` | A user setting was mutated |
| `COMPONENT_LIBRARY_CHANGED` | Component library mutated |

Listeners are typed; a mistyped event name is a compile error.

### 6.2 Persistence

| Concern | Where it lives |
|---------|----------------|
| Component libraries (desktop) | IndexedDB via `IndexedDBService` |
| Component libraries (web)     | `localStorage` (key: `solarwire-component-libraries`) |
| User settings / theme         | `localStorage` (`solarwire-theme`, etc.) |
| File contents                 | Disk, through the FS abstraction (`window.api` in both modes) |

`ComponentLibraryManager` depends on the `IComponentLibraryStorage`
interface, so the same business code runs in both desktop and web.

### 6.3 Security model

**Desktop (`editor/`):**

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- Renderer only sees the typed `window.api` exposed in
  `src/preload/index.ts`.
- File access is restricted to the project root and any directory
  the user explicitly opens via the directory dialog (see
  `setAllowedRoot`).

**Web (`editor-server/server/`):**

- Every request that carries a path is funneled through
  `resolveSafePath()` in `src/middleware/security.ts`. The function
  normalizes the input, joins it with `WORKSPACE_ROOT`, and rejects
  the request with a 403 if the result escapes the workspace.
- Uploads are capped at 10 MB via multer's `limits.fileSize`.
- **There is no authentication.** The server assumes a trusted
  network. Do not expose it to the public Internet without adding
  auth and TLS.

### 6.4 Coordinate systems

The visual editor uses two coordinate spaces:

- **Document coordinates** — what the user wrote in the `.sw` file.
- **Canvas coordinates** — what the user sees on screen, after
  pan/zoom.

Conversion lives in `src/shared/hooks/useCoordinateSystem.ts` and
`useDragCoordinate.ts`. The `src/shared/utils/coordinate-utils.ts` and
`line-coordinate-utils.ts` modules provide pure-function conversions
used by the property panel and snap engine.

### 6.5 Rendering pipeline

For a SolarWire document, the rendering pipeline is:

```
.sw source
   │  parse(input)            @solarwire/parser
   ▼
Document AST
   │  render(ast, options)    @solarwire/renderer-svg
   ▼
SVG string
   │  setInnerHTML / dangerouslySetInnerHTML
   ▼
DOM <svg> in the preview canvas
```

The `renderers/RenderCoordinator` (`editor/src/app/services/renderers/`)
plugs additional adapters for Mermaid, Graphviz, and Markdown
rendering; each produces its own DOM subtree that is composited into
the same preview surface.

---

## 7. Build, test, and release

### 7.1 Build matrix

| Project | Command | Output |
|---------|---------|--------|
| `editor-server/packages/parser` | `npm run build` | `dist/index.js`, `dist/index.d.ts` |
| `editor-server/packages/renderer-svg` | `npm run build` | `dist/` |
| `editor-server/client` | `npm run build` | `dist/app/` (consumed by the server) |
| `editor-server/server` | `npm run build` | `dist/index.js` |
| `editor` | `npm run build` | `dist/main/`, `dist/preload/`, renderer bundle, then electron-builder installer |
| `editor-server` (Docker) | `npm run docker:build` | `solarwire-server` image |

### 7.2 Tests

| Project | Framework | Command |
|---------|-----------|---------|
| `editor` (unit)             | Vitest    | `npm run test` |
| `editor` (E2E)              | Playwright | `npm run test:e2e` |
| `editor` (everything)       | Vitest + Playwright | `npm run test:all` |
| `editor-server/packages/parser` | Jest | `npm test` |

The Playwright spec at `editor/__tests__/e2e/monaco-editor.spec.ts`
exercises the Monaco code editor; unit tests cover the parser,
attribute updater, table utilities, and renderer context.

### 7.3 Linting and types

| Project | Lint | Type-check |
|---------|------|------------|
| `editor` (TS) | `npm run lint` | `npm run typecheck` |
| `editor` (CSS) | `npm run lint:styles` | – |
| `editor` (all) | `npm run lint:all` | `npm run typecheck:all` |
| `editor-server/client` | `npm run lint` | `tsc -p tsconfig.app.json --noEmit` |

### 7.4 Release flow

- Desktop: `npm run build` in `editor/` produces per-platform
  installers via `electron-builder.yml`.
- Web: build the Docker image and push to your registry.
- Skill: ship `skill/solarwire/` as-is; users drop it into their
  assistant's skills directory.

---

## 8. SolarWire language specification

The authoritative reference lives in [`README.md`](./README.md#solarwire-language-reference).
The parser enforces the rules below; the renderer realizes them.

### 8.1 Tokens

| Token | Pattern |
|-------|---------|
| Identifier | `[A-Za-z_][A-Za-z0-9_-]*` |
| Number | `[0-9]+(\.[0-9]+)?` |
| Coordinate | `@(NUMBER, NUMBER)` |
| Attribute | `IDENT (= STRING \| NUMBER \| true \| false)?` |
| Declaration | `!IDENT (= STRING \| NUMBER)?` |
| Comment | `// …` until end of line |
| Whitespace | Ignored except as a row/cell separator |

### 8.2 Element syntax

| Element | Bracket shape |
|---------|---------------|
| Rectangle | `[text]` |
| Rounded rectangle | `(text)` |
| Circle | `((text))` |
| Text | `"text"` (double-quoted) |
| Multiline text | `"""text"""` (triple-quoted) |
| Placeholder | `[?text]` |
| Image | `<url>` |
| Line | `--` (no label) / `-"label"-` (with label) |
| Table | `## @(x,y) w=… h=…` |
| Row | `# @(x,y) h=…` (2-space indent under a table) |
| Cell | One cell per line, 4-space indent under a row |

### 8.3 Reserved / forbidden attributes

`skill/solarwire/references/standards.md` enumerates the full
allow-list. The following **hallucinated** attribute names must never
appear in user output (they will not render):

| Hallucinated | Correct |
|-------------|---------|
| `multiline` | (use triple-quoted strings) |
| `truncate`  | (no equivalent — emit a shorter string) |
| `stroke`    | `b` (border color) |
| `strokeWidth` | `s` (border width) |

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **SolarWire** | The document format and the project name |
| **Snippet** | A SolarWire code block embedded in a Markdown file |
| **SWC** | SolarWire Component library file (Markdown-with-code-blocks format) |
| **Mode** | One of `blank`, `solarwire`, `markdown`, `componentLibraryManager` |
| **Workspace** | The directory the web editor reads from and writes to |
| **Renderer** | The React-renderer process of Electron, **not** the SVG renderer |
| **Render engine** | `@solarwire/renderer-svg` (AST → SVG) |
| **Skill** | A directory of prompts/workflows the AI assistant can load on demand |

---

*Last updated: 2026-06-11.*
