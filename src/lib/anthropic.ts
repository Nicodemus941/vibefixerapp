import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: env.anthropicApiKey() });
  return _client;
}

// Approx per-million-token prices (USD cents). Used to enforce per-audit cost ceiling.
// Update when pricing changes; treat as approximate budgeting only.
const PRICING_CENTS_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7": { input: 1500, output: 7500 },
  "claude-sonnet-4-6": { input: 300, output: 1500 },
  "claude-haiku-4-5-20251001": { input: 80, output: 400 },
};

export function estimateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING_CENTS_PER_MTOK[model] ?? PRICING_CENTS_PER_MTOK["claude-sonnet-4-6"];
  const inputCost = (inputTokens / 1_000_000) * p.input;
  const outputCost = (outputTokens / 1_000_000) * p.output;
  return Math.ceil(inputCost + outputCost);
}

export type ClaudeJsonResult<T> = {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
};

/**
 * Call Claude expecting a JSON object back. Uses tool-use to enforce schema:
 * the model must call `emit_result` with the structured payload.
 */
export async function callClaudeJson<T>(opts: {
  model: string;
  system: string;
  user: string;
  schema: object;
  maxTokens?: number;
  cacheSystem?: boolean;
}): Promise<ClaudeJsonResult<T>> {
  const a = client();
  const systemBlocks = opts.cacheSystem
    ? [{ type: "text" as const, text: opts.system, cache_control: { type: "ephemeral" as const } }]
    : [{ type: "text" as const, text: opts.system }];

  const res = await a.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks,
    tools: [
      {
        name: "emit_result",
        description: "Return the structured result.",
        input_schema: opts.schema as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "emit_result" },
    messages: [{ role: "user", content: opts.user }],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  return {
    data: toolUse.input as T,
    model: res.model,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    costCents: estimateCostCents(res.model, res.usage.input_tokens, res.usage.output_tokens),
  };
}
