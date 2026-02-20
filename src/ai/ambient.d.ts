/**
 * Ambient module declarations for optional AI provider dependencies.
 *
 * @remarks
 * `\@anthropic-ai/sdk` is an optional dependency — it may not be installed.
 * Declaring an ambient module here allows TypeScript to compile without the
 * package present. The actual module shape is validated at runtime via the
 * `AnthropicSdkModule` local interface in `llm-providers.ts`.
 *
 * @module ai
 */

// Minimal ambient declaration — the actual shape is validated at runtime.
declare module '@anthropic-ai/sdk' {
  const Anthropic: unknown;
  export default Anthropic;
}
