/**
 * Guard that ensures Claude Agent SDK uses OAuth authentication
 * (via Claude Code CLI) rather than an API key.
 *
 * When ANTHROPIC_API_KEY is set, the SDK bypasses OAuth and attempts
 * API-key auth — which fails with "Invalid API key" if the key is
 * missing, expired, or belongs to a different account.
 *
 * @throws {Error} if ANTHROPIC_API_KEY is present in the environment
 */
export function assertOAuthAuth(): void {
  if (process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is set — the Claude Agent SDK will use API-key auth instead of OAuth. " +
        "Unset the variable (`unset ANTHROPIC_API_KEY`) so the SDK authenticates via Claude Code CLI's OAuth token.",
    );
  }
}
