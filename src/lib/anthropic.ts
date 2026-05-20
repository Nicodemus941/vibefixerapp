import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic() {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

// Default model for Loop reasoning (matching re-ranking, intro drafts).
export const CLAUDE_MODEL = "claude-sonnet-4-6";
