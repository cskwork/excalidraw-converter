# ADR 0003: Treat uploads and model calls as untrusted and bounded

Status: accepted (commit 77e279b, 2026-03-28, and commit 062385a, 2026-03-31)

## Context

`/api/convert` receives arbitrary text, documents, and images and passes them to an agent that can
use tools. A reviewer report at the time
([production-readiness-report-2026-03-31.md](../production-readiness-report-2026-03-31.md)) flagged
path traversal through the uploaded file name, MIME spoofing, prompt injection, and unbounded LLM
cost.

## Decision

In `src/app/api/convert/route.ts`:

- Check image signatures against the declared MIME type (`src/lib/magic-bytes.ts`) before writing
  anything.
- Name the temp file `upload.<ext>` with the extension taken from the MIME type, inside a fresh
  `mkdtemp` directory that is removed in `finally`.
- Wrap text and document content in `<user_content>` and tell the model it is data, not
  instructions; truncate it at 100,000 characters.
- Run the agent with `maxTurns: 1`, `effort: "low"`, `maxBudgetUsd: 0.25`, `persistSession: false`,
  and `allowedTools` set to `["Read"]` for images and `[]` otherwise.
- Race the call against a 120 s timeout; the client aborts at 130 s; return generic 500s and log
  details with a `requestId` (`src/lib/logger.ts`).

## Consequences

- An uploaded name like `../../x.sh` cannot influence a file path, and a renamed executable is
  rejected as an image.
- Each request has a bounded cost and duration, at the price of a single-shot answer with no
  self-correction turn.
- Prompt injection is mitigated, not prevented; the agent has no write or shell tools to abuse.
- The timeout does not cancel the underlying SDK query; the budget cap is what bounds it.

## Alternatives considered

- Embed the image in the prompt instead of a temp file: not used; the route hands the agent a file
  path and enables only the `Read` tool for that request.
- Requester authentication and rate limiting: not implemented; the app is meant to run locally
  (see ADR 0001).
