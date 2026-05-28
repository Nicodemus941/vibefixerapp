"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchPost = {
  kind: "post";
  rank: number;
  id: string;
  body: string;
  hashtags: string[];
  post_kind: string;
  created_at: string;
  user_id: string;
};

export type SearchPerson = {
  kind: "person";
  rank: number;
  id: string;
  display_name: string;
  company_name: string | null;
  industry: string | null;
  role: string;
};

export async function runSearch(
  q: string,
): Promise<{ posts: SearchPost[]; people: SearchPerson[] }> {
  const query = q.trim();
  if (query.length < 2) return { posts: [], people: [] };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_loop", {
    q: query,
    limit_per: 12,
  });
  if (error || !data) return { posts: [], people: [] };

  const posts: SearchPost[] = [];
  const people: SearchPerson[] = [];

  for (const row of data) {
    if (row.kind === "post" && row.post_id) {
      posts.push({
        kind: "post",
        rank: Number(row.rank ?? 0),
        id: row.post_id,
        body: row.post_body ?? "",
        hashtags: row.post_hashtags ?? [],
        post_kind: row.post_kind ?? "update",
        created_at: row.post_created_at as string,
        user_id: row.post_user_id ?? "",
      });
    } else if (row.kind === "person" && row.person_id) {
      people.push({
        kind: "person",
        rank: Number(row.rank ?? 0),
        id: row.person_id,
        display_name: row.person_display_name ?? "Unknown",
        company_name: row.person_company_name,
        industry: row.person_industry,
        role: row.person_role ?? "user",
      });
    }
  }

  return { posts, people };
}
