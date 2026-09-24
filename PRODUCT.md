# Product

<!-- impeccable:product-schema 1 -->

> Written 2026-09-24 during an unattended redesign run. The owner approved the run ("proceed as recommended") but no interview took place. Facts marked *(inferred)* come from the repository and the live site, not from the owner, and should be confirmed.

## Platform

web

## Users

- Developers, technical writers and engineering leads who need a diagram of something they can already describe in words: an architecture, a flow, a process, a data file. *(inferred from README use cases)*
- Visitors of the hosted demo at excalidraw-converter.vercel.app who arrive from the GitHub repo or a portfolio and want to see what the tool produces before cloning it. *(inferred)*

## Product Purpose

Excalidraw Converter turns text, text files (Markdown, CSV, JSON, HTML, XML, TXT) and images (PNG, JPEG, GIF, WebP) into a fully editable Excalidraw diagram. Success is a diagram that lands on the canvas, is readable without rework, and can be edited or exported with the normal Excalidraw tools.

## Positioning

The output is not a picture: it is native Excalidraw elements (shapes, bound text, arrows with bindings) auto-laid out and dropped into a real Excalidraw editor, so the result stays hand-drawn in character and editable.

## Operating Context

- Single-screen tool: an input panel (Text / File / Image modes) beside a full Excalidraw canvas.
- Conversion runs through the Claude Agent SDK and authenticates with the local Claude Code CLI OAuth session. It works when the app runs locally on a machine with Claude Code signed in. The hosted Vercel deployment has no such session, and its `/api/convert` returns HTTP 500 (observed 2026-09-24). The hosted site is therefore a demo of the interface and the editor, not a working converter.
- Work persists in localStorage (canvas elements, text draft, input mode, theme).

## Capabilities and Constraints

- Inputs: text up to 100,000 characters, files and images up to 10 MB. Images are checked by magic bytes on the server.
- Server timeout 120 s, client timeout 130 s.
- Light and dark themes, following the system preference on first visit.
- No accounts, no analytics, no database.
- MIT licensed, open source on GitHub (cskwork/excalidraw-converter).

## Brand Commitments

- Name: "Excalidraw Converter". Tagline in use: "Turn anything into editable diagrams".
- The product lives next to Excalidraw's own editor and must not fight its UI. It is not affiliated with Excalidraw and must not imply that.

## Evidence on Hand

- README feature table and use cases.
- No demo GIF, testimonials, user counts or benchmarks exist. Do not invent any.

## Product Principles

1. The canvas is the product; the input panel serves it.
2. Be honest about where conversion works (locally with Claude Code) and where it does not (the hosted demo).
3. Every output stays editable Excalidraw, never a flattened image.
4. Keep the path from input to diagram to one action.

## Accessibility & Inclusion

No product-specific requirement established. Target WCAG 2.2 AA for the input panel: keyboard access to every control, visible focus, sufficient contrast in both themes. *(inferred default)*
