import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";

// Inputs the matcher hands us for one (need, offer) pair.
export type RerankInput = {
  seeker: {
    name: string;
    company: string | null;
    industry: string | null;
    bio: string | null;
    revenueBand: string | null;
  };
  provider: {
    name: string;
    company: string | null;
    industry: string | null;
    bio: string | null;
    revenueBand: string | null;
  };
  need: {
    title: string;
    description: string;
    category: string;
    budgetMin: number | null;
    budgetMax: number | null;
    urgency: string | null;
  };
  offer: {
    title: string;
    description: string;
    category: string;
    priceMin: number | null;
    priceMax: number | null;
    pricingModel: string | null;
  };
  embeddingScore: number;
};

export type RerankOutput = {
  score: number;
  rationale: string;
  draftIntro: string;
  model: string;
};

// Frozen system prompt — kept byte-stable so the cache_control breakpoint
// can be reused across every match in a batch run. Do not interpolate
// timestamps, IDs, or per-request data into this string.
const SYSTEM_PROMPT = `You are the matching brain inside Loop, a reciprocal marketplace for founders.

Loop's core thesis: founders accelerate fastest when they trade help with peers who can both deliver what they need AND credibly use what they offer. Every match has two sides:
- A SEEKER who posted a NEED (they want something built/done/advised on).
- A PROVIDER who has an OFFER (they can deliver it).

A first-pass embedding similarity score has already filtered the candidate set. Your job is to second-pass each (need, offer) pair as an experienced operator would, then return three things:

1. A SCORE from 0 to 100 expressing how likely this match is to convert into real, satisfying work.
2. A short RATIONALE (1-3 sentences) explaining the score in plain language a founder can read in 4 seconds.
3. A DRAFT INTRO MESSAGE the seeker could send the provider to open the conversation.

== Scoring rubric ==

Score along these axes, then combine into a single 0-100 integer:

A) Capability fit (0-35 points). Does the provider's offer actually map onto the need, not just sound topically similar? "Fractional CMO" vs "I need help running a paid ads campaign" is a partial fit, not a full one. Penalize generic offers paired with very specific needs.

B) Stage/scale fit (0-20 points). Revenue band signals what stage they're operating at. A pre-revenue seeker engaging a $10M+ provider's premium offer is usually a mismatch; same-stage or one-step-up is ideal. If revenue band is unknown for either side, don't penalize — just don't award the bonus.

C) Budget vs price fit (0-15 points). If the need has a budget range and the offer has a price range, do they overlap? If either side is unspecified, neutral.

D) Urgency vs cadence fit (0-10 points). "Now" + "retainer" doesn't fit. "Exploratory" + "fixed engagement" usually does. Reward when urgency matches the engagement shape.

E) Reciprocity potential (0-10 points). Could the provider plausibly have a need that the seeker's other offers could fulfill? Reward bidirectional potential — Loop's whole point is two-way value, not one-way services. Penalize when one side is clearly the perpetual buyer or perpetual seller.

F) Conversation likelihood (0-10 points). Will they actually DM? Reward complementary industries, clear scope, and a need specific enough to write a real intro. Penalize when the offer is too broad to anchor a conversation.

Add the points. Floor 0, ceiling 100, integer only.

Calibration anchors:
- 85-100: rare, high-conviction match. Strong fit on capability + at least one of (stage, budget, reciprocity).
- 65-84: solid candidate. Send the intro.
- 45-64: possible — depends on the seeker being open to a broader scope.
- 25-44: weak. Surface only if the user explicitly wants more matches.
- 0-24: not a real match. Embedding similarity was misleading.

== Rationale guidelines ==

- 1-3 sentences, no preamble.
- Lead with the strongest axis ("Tight capability fit on paid acquisition; budget overlap at the low end.").
- Name the weakest axis if the score is under 75 so the founder knows what to verify in the first message.
- No marketing language. No "synergy", "leverage", "unlock". Plain operator speak.

== Draft intro guidelines ==

- Written FROM the seeker TO the provider, first person.
- Open with one sentence of why they're reaching out (reference the specific offer and the specific need).
- One sentence on what they're hoping to learn or hire for.
- Optionally one sentence proposing a concrete next step (15-min call, async brief, etc.).
- Length: 40-90 words. Conversational, not salesy. No emojis unless the founder's bio is highly informal.
- Sign off with first name only ("— {seeker first name}").
- Do not invent facts. Use only what's in the provided context.

Return strictly the JSON object the schema requires. No prose outside the JSON.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    score: {
      type: "integer",
      description:
        "Integer 0-100 expressing match conviction per the rubric.",
    },
    rationale: {
      type: "string",
      description:
        "1-3 sentence plain-language explanation a founder can read in 4 seconds.",
    },
    draft_intro: {
      type: "string",
      description:
        "40-90 word intro message written from the seeker to the provider, first person, no emojis unless seeker bio is informal.",
    },
  },
  required: ["score", "rationale", "draft_intro"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

function renderUserPrompt(input: RerankInput): string {
  const fmtMoney = (n: number | null) => (n == null ? "unspecified" : `$${n.toLocaleString()}`);
  return `# Seeker
Name: ${input.seeker.name}
Company: ${input.seeker.company ?? "unspecified"}
Industry: ${input.seeker.industry ?? "unspecified"}
Revenue band: ${input.seeker.revenueBand ?? "unspecified"}
Bio: ${input.seeker.bio ?? "unspecified"}

# Provider
Name: ${input.provider.name}
Company: ${input.provider.company ?? "unspecified"}
Industry: ${input.provider.industry ?? "unspecified"}
Revenue band: ${input.provider.revenueBand ?? "unspecified"}
Bio: ${input.provider.bio ?? "unspecified"}

# Seeker's NEED
Title: ${input.need.title}
Category: ${input.need.category}
Urgency: ${input.need.urgency ?? "unspecified"}
Budget: ${fmtMoney(input.need.budgetMin)} – ${fmtMoney(input.need.budgetMax)}
Description:
${input.need.description}

# Provider's OFFER
Title: ${input.offer.title}
Category: ${input.offer.category}
Pricing model: ${input.offer.pricingModel ?? "unspecified"}
Price range: ${fmtMoney(input.offer.priceMin)} – ${fmtMoney(input.offer.priceMax)}
Description:
${input.offer.description}

# First-pass embedding similarity
${(input.embeddingScore * 100).toFixed(1)}% (informational — use as a sanity check, not as your score)

Now score this pair, write the rationale, and draft the intro.`;
}

export async function rerankMatch(input: RerankInput): Promise<RerankOutput | null> {
  try {
    const c = getClient();
    const response = await c.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [{ role: "user", content: renderUserPrompt(input) }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const parsed = JSON.parse(block.text) as {
      score: number;
      rationale: string;
      draft_intro: string;
    };
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      rationale: parsed.rationale,
      draftIntro: parsed.draft_intro,
      model: MODEL,
    };
  } catch (e) {
    console.error("[claude-rerank] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
