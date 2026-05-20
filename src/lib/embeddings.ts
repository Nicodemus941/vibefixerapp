import "server-only";
import OpenAI from "openai";

// Embedding model: OpenAI text-embedding-3-small (1536 dims, matches VECTOR(1536)).
const MODEL = "text-embedding-3-small";

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export async function embed(text: string): Promise<string> {
  const res = await getClient().embeddings.create({
    model: MODEL,
    input: text,
  });
  // pgvector accepts the bracketed-array text format: "[0.1, 0.2, ...]"
  return `[${res.data[0].embedding.join(",")}]`;
}

export async function embedBatch(texts: string[]): Promise<string[]> {
  const res = await getClient().embeddings.create({
    model: MODEL,
    input: texts,
  });
  return res.data.map((d) => `[${d.embedding.join(",")}]`);
}
