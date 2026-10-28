# ADR 0001: Use the Claude Code OAuth session instead of an API key

Status: accepted (guard added in commit 062385a, 2026-03-31; hosted fallback in ef5f820, 2026-09-24)

## Context

The app needs an LLM that can read an uploaded image and return structured JSON. The Claude Agent
SDK (`@anthropic-ai/claude-agent-sdk`) can authenticate either with `ANTHROPIC_API_KEY` or with the
OAuth login of a local Claude Code CLI. When the environment variable is present the SDK silently
prefers it, and a stale or wrong key fails with "Invalid API key".

## Decision

Authenticate only through the Claude Code OAuth session. `src/lib/assert-oauth-auth.ts` throws
before every conversion if `ANTHROPIC_API_KEY` is set, and `src/app/api/convert/route.ts` calls it
inside its error handler, so the request fails with a generic 500 and the reason goes to the
server log.

## Consequences

- No API key exists in the repository, the deployment, or the browser bundle; there is nothing to
  leak and no per-key billing to protect.
- Conversion only works where a signed-in Claude Code CLI runs next to the server, i.e. locally.
- The Vercel deployment cannot convert. `src/lib/convert-client.ts` maps the generic 5xx to an
  "engine isn't reachable" message, and `src/lib/sample-diagram.ts` gives visitors a diagram to edit
  without any server call.

## Alternatives considered

- Server-side `ANTHROPIC_API_KEY` in Vercel env vars: would make the hosted demo work, but needs
  requester auth and rate limiting first (the route has neither) to avoid paying for anonymous use.
- Key entered by the user in the browser: the key would travel through the client; not done.
