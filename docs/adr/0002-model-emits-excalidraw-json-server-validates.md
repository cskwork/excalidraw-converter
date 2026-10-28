# ADR 0002: The model emits Excalidraw element JSON; the server validates and lays it out

Status: accepted (since the first commit 52b26a8, 2026-03-28)

## Context

The output must be editable Excalidraw elements, not a picture. LLM replies are unreliable: they
may wrap JSON in prose or code fences, repeat ids, omit style fields, or stack shapes on top of
each other.

## Decision

- `src/lib/excalidraw-prompt.ts` gives the model the exact element schema (shapes, text, arrows,
  bindings), spacing rules, and a strategy for each input type, and asks for a bare JSON array of
  3 to 50 elements.
- `src/app/api/convert/route.ts` (`extractJsonArray`) takes a fenced ```json block if present,
  otherwise the outermost `[...]`, and rejects replies that don't parse or are empty (502).
- `src/lib/element-helpers.ts` keeps only elements with a supported type, a string id, and numeric
  x/y (`validateElements`), renames duplicate ids, fills default style fields, and, if any shapes
  overlap, re-places shapes on a grid and moves their bound text (`autoLayout`).

## Consequences

- The editor never receives malformed elements, and the client stays simple: it places whatever the
  route returns.
- The layout fallback is coarse: it ignores the model's layout once any overlap exists, and does not
  move arrows.
- Validation is permissive: extra fields the model adds are passed through unchanged.

## Alternatives considered

- Ask for Mermaid or another DSL and convert it: fewer tokens, but loses free positioning and
  colours, and image recreation would not fit a graph DSL.
- Use Excalidraw's `convertToExcalidrawElements` skeleton API on the model output: used for the
  built-in sample (`src/lib/sample-diagram.ts`), but the API route returns full elements and does not
  depend on the Excalidraw package on the server.
