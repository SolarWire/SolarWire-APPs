---
name: "solarwire"
description: "SolarWire is an AI-powered toolkit for software development, covering PRD creation, code reverse engineering, test case generation, dev design, implementation planning, and wireframe syntax validation. All wireframes use SolarWire code blocks."
---

# SolarWire AI Toolkit

SolarWire is a fully integrated software development engineering toolkit, bridging the gap from product requirements to implementation. It produces structured PRD documents with embedded SolarWire wireframes, which serve as a functional blueprint for development.

## How This Skill Works

This skill employs **progressive disclosure**, loading information in three layers:
1.  **Always Active**: This guide and the inline Syntax Quick Reference.
2.  **Task-Specific**: A workflow file loaded based on your intent.
3.  **Deep Dive**: Detailed reference files loaded by the workflow when generating a specific output.

## Intent Router

Your request will be matched to the correct workflow.

| User Intent | Trigger Condition | Load Workflow |
|-------------|-------------------|---------------|
| Create/Modify PRD | Write PRD, create requirements, new feature, modify existing features, understand existing code | `workflows/prd.md` |
| Generate Test Cases | A finalized PRD exists and needs test cases | `workflows/test.md` |
| Create Technical Design | A confirmed PRD exists and needs an architecture/dev design | `workflows/dev-design.md` |
| Create Implementation Plan | A confirmed PRD and dev design both exist | `workflows/implementation.md` |
| Manage Component Library | Create or modify `.swc` component files | `workflows/component.md` |

## Inline Syntax Quick Reference

This is a quick lookup. Complete attribute references and rules are in `references/syntax.md`.

| Element | Syntax | Example |
|---------|--------|---------|
| Rectangle | `["text"] @(x,y)` | `["Button"] @(100,50) w=120 h=40 bg=#3B82F6 c=#FFFFFF` |
| Rounded Rect| `["text"] @(x,y) r=N` | `["Card"] @(50,100) w=300 h=200 r=8` |
| Circle | `("text") @(x,y)` | `("Avatar") @(300,50) w=60` |
| Text | `"text" @(x,y)` | `"Title" @(100,50) size=24 bold` |
| Multi-line Text | `"""Line1\nLine2""" @(x,y)` | `"""Line 1\nLine 2""" @(100,50)` |
| Placeholder | `[?"text"] @(x,y)` | `[?"Image"] @(200,200) w=150 h=100` |
| Image | `<URL> @(x,y)` | `<https://example.com/logo.png> @(50,50) w=100 h=100` |
| Line | `-- @(x1,y1)->(x2,y2)` | `-- @(50,200)->(450,200) c=#E5E7EB` |
| Table | `## @(x,y)` | `## @(50,50) w=500` |
| Table Row | `  #` (2-space indent) | `  # bg=#F3F4F6` |
| Table Cell | `    "value"` (4-space indent) | `    "代理名称"` (one cell per line) |
| Comment | `// text` | `// This is a comment` |
| Title Directive | `!title="name"` (line 1) | `!title="用户列表页"` |

## Forbidden Attributes (NEVER use)

| Hallucinated Attribute | Correct Replacement |
|------------------------|----------------------|
| `multiline` | Not a valid attribute |
| `truncate` | Not a valid attribute |
| `stroke` | `b` for border color |
| `strokeWidth` | `s` for border width |

## Red Lines (Always Enforced)

1.  All output is for real production environments, real companies, and real workflows. Every piece of logic, information, and content must meet production-grade authenticity. Do not simplify, abbreviate, or omit any valid information to save tokens, reduce complexity, or increase speed. If something is inherently complex, it must remain complex — reducing complexity at the cost of correctness is forbidden. All output must contain complete, valid information covering every logical path, every data point, and every relevant detail without omission.
2.  Never skip a user confirmation gate.
3.  All document content, wireframe text, element notes, and Mermaid diagrams must use the user's communication language, unless the user explicitly specifies another language. Never add i18n without explicit user confirmation.
4.  Derive wireframe layouts/colors from project code first; use standards as fallback.
5.  Wireframes must be high-fidelity: realistic proportions, actual brand colors, proper visual hierarchy. They should resemble a styled screenshot, not abstract boxes.
6.  Code reverse engineering output must be a 1:1 representation of the existing code. No additions, removals, renames, or "improvements" beyond what the user explicitly requests. When the code uses i18n keys, resolve them to the actual displayed text from locale files — never use raw i18n keys in wireframes.

## Standard Operating Procedure

After a workflow is loaded, it will guide you. Here is the general outline:

1.  **Initialization**: The loaded workflow will instruct you to read required `references/` files.
2.  **Discovery & Confirmation**: You will be guided through a "Five Elements" confirmation process (Strategy, Scope, Structure, Framework, Presentation) and other critical checks.
3.  **Execution**: You will generate the requested document, embedding SolarWire code blocks.
4.  **Self-Review & Validation**: You will perform a structured self-review against a checklist and run a validation script on the output.
5.  **Hand-off**: The finalized document is presented for user review.

## File Structure Convention

Outputs MUST be saved under `.solarwire/[requirement-name]/`, NOT directly in `.solarwire/`. The requirement-name folder uses the format `日期【系统-模块】需求` (e.g. `2022-02-02【ERP-财务】应收款-2`), in the user's communication language.