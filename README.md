# SolarWire Editor

A complete document workspace for SolarWire with code editing, visual drag-and-drop editing, Markdown editing, real-time preview, batch SVG generation, version management, and Git management.

## Features

- **Code Editing**: SolarWire syntax highlighting with Monaco Editor
- **Visual Editing**: Drag-and-drop elements with real-time preview
- **Markdown Editing**: Full Markdown support with live preview
- **SolarWire Code Blocks**: Render SolarWire code blocks in Markdown as SVG
- **Batch SVG Generation**: Generate multiple SVG files from Markdown
- **Version Management**: Git-based version control with checkout/reset
- **Four View Types**: File, Requirement, SolarWire, and Git views
- **Auto-completion**: Smart code completion for SolarWire
- **Keyboard Shortcuts**: Ctrl+S to save

## Tech Stack

- Electron 27
- React 18
- TypeScript 5
- Monaco Editor
- SVG (renderer-svg)
- Zustand
- simple-git
- marked
- highlight.js

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Open application
2. Navigate files using File view
3. Edit SolarWire files with code or visual editor
4. Edit Markdown files with live preview
5. Manage versions using Git view
6. Generate batch SVGs from Markdown
