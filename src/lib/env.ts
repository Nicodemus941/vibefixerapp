function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  anthropicAuditModel: () => optional("ANTHROPIC_MODEL_AUDIT") ?? "claude-sonnet-4-6",
  anthropicClassifyModel: () => optional("ANTHROPIC_MODEL_CLASSIFY") ?? "claude-haiku-4-5-20251001",
  firecrawlApiKey: () => required("FIRECRAWL_API_KEY"),
  appUrl: () => optional("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  appName: () => optional("NEXT_PUBLIC_APP_NAME") ?? "Rebuild Engine",
};
