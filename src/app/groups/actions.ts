"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/embeddings";
import { extractHashtags } from "@/lib/hashtags";
import { logEvent } from "@/lib/platform-events";

export type GroupRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  member_count: number;
  created_at: string;
  is_member: boolean;
  role: "owner" | "moderator" | "member" | null;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function fetchGroups(): Promise<{
  yours: GroupRow[];
  discover: GroupRow[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { yours: [], discover: [] };

  const [{ data: allGroups }, { data: myMembers }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, slug, name, description, visibility, member_count, created_at")
      .order("member_count", { ascending: false })
      .limit(80),
    supabase.from("group_members").select("group_id, role").eq("user_id", user.id),
  ]);

  const memberRoleByGroup = new Map(
    (myMembers ?? []).map((m) => [m.group_id, m.role as "owner" | "moderator" | "member"]),
  );

  const yours: GroupRow[] = [];
  const discover: GroupRow[] = [];

  for (const g of allGroups ?? []) {
    const role = memberRoleByGroup.get(g.id) ?? null;
    const row: GroupRow = {
      id: g.id,
      slug: g.slug,
      name: g.name,
      description: g.description,
      visibility: g.visibility as "public" | "private",
      member_count: g.member_count,
      created_at: g.created_at as string,
      is_member: Boolean(role),
      role,
    };
    if (role) yours.push(row);
    else if (g.visibility === "public") discover.push(row);
  }

  return { yours, discover };
}

export async function fetchGroupBySlug(
  slug: string,
): Promise<{
  group: GroupRow | null;
  members: Array<{ user_id: string; role: string; display_name: string; avatar_url: string | null }>;
  posts: Array<{
    id: string;
    user_id: string;
    body: string;
    hashtags: string[];
    kind: string;
    created_at: string;
    author_display_name: string;
    author_company_name: string | null;
    author_industry: string | null;
    author_avatar_url: string | null;
  }>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { group: null, members: [], posts: [], error: "not signed in" };

  const { data: g } = await supabase
    .from("groups")
    .select(
      "id, slug, name, description, visibility, member_count, created_at, created_by",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!g) return { group: null, members: [], posts: [], error: "not found" };

  const { data: myMember } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", g.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Private group access enforced by RLS, but double-check.
  if (g.visibility === "private" && !myMember) {
    return { group: null, members: [], posts: [], error: "private group" };
  }

  const [{ data: members }, { data: posts }] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id, role, joined_at")
      .eq("group_id", g.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("posts")
      .select("id, user_id, body, hashtags, kind, created_at")
      .eq("group_id", g.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.user_id)));
  const allProfileIds = Array.from(new Set([...memberIds, ...authorIds]));
  const { data: profiles } =
    allProfileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, company_name, industry, avatar_url")
          .in("id", allProfileIds)
      : { data: [] };
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    group: {
      id: g.id,
      slug: g.slug,
      name: g.name,
      description: g.description,
      visibility: g.visibility as "public" | "private",
      member_count: g.member_count,
      created_at: g.created_at as string,
      is_member: Boolean(myMember),
      role: (myMember?.role as "owner" | "moderator" | "member" | null) ?? null,
    },
    members: (members ?? []).map((m) => ({
      user_id: m.user_id,
      role: m.role,
      display_name: pmap.get(m.user_id)?.display_name ?? "Unknown",
      avatar_url: pmap.get(m.user_id)?.avatar_url ?? null,
    })),
    posts: (posts ?? []).map((p) => {
      const pf = pmap.get(p.user_id);
      return {
        id: p.id,
        user_id: p.user_id,
        body: p.body,
        hashtags: p.hashtags,
        kind: p.kind,
        created_at: p.created_at as string,
        author_display_name: pf?.display_name ?? "Unknown",
        author_company_name: pf?.company_name ?? null,
        author_industry: pf?.industry ?? null,
        author_avatar_url: pf?.avatar_url ?? null,
      };
    }),
  };
}

export async function createGroup(input: {
  name: string;
  description?: string;
}): Promise<{ error?: string; slug?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const name = input.name.trim();
  if (name.length < 2) return { error: "Name must be at least 2 characters" };

  const base = slugify(name);
  if (!base) return { error: "Name has no usable letters" };

  // Find a non-conflicting slug.
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data } = await supabase.from("groups").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const { error } = await supabase.from("groups").insert({
    name,
    slug,
    description: input.description?.trim() || null,
    visibility: "public",
    created_by: user.id,
  });
  if (error) return { error: error.message };

  await logEvent("group_created", user.id, { slug });
  revalidatePath("/groups");
  return { slug };
}

export async function joinGroup(slug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: g } = await supabase
    .from("groups")
    .select("id, visibility")
    .eq("slug", slug)
    .maybeSingle();
  if (!g) return { error: "not found" };
  if (g.visibility !== "public") return { error: "private — ask the owner to add you" };

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: g.id, user_id: user.id, role: "member" });
  if (error && !error.message.includes("duplicate")) return { error: error.message };

  await logEvent("group_joined", user.id, { slug });
  revalidatePath(`/g/${slug}`);
  revalidatePath("/groups");
  return {};
}

export async function leaveGroup(slug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: g } = await supabase.from("groups").select("id").eq("slug", slug).maybeSingle();
  if (!g) return { error: "not found" };

  const { data: my } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", g.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (my?.role === "owner") {
    return { error: "Owners can't leave — delete the group or transfer ownership first" };
  }

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", g.id)
    .eq("user_id", user.id);

  revalidatePath(`/g/${slug}`);
  revalidatePath("/groups");
  return {};
}

export async function createGroupPost(input: {
  groupSlug: string;
  body: string;
}): Promise<{ error?: string; postId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const body = input.body.trim();
  if (!body) return { error: "Write something." };
  if (body.length > 600) return { error: "Posts are limited to 600 chars." };

  const { data: g } = await supabase
    .from("groups")
    .select("id, visibility")
    .eq("slug", input.groupSlug)
    .maybeSingle();
  if (!g) return { error: "group not found" };

  const { data: my } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", g.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!my) return { error: "join the group to post in it" };

  const hashtags = extractHashtags(body);

  let embedding: string | null = null;
  try {
    embedding = await embed(body);
  } catch {
    embedding = null;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      body,
      hashtags,
      group_id: g.id,
      kind: "update",
      embedding,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("group_post_created", user.id, {
    group_slug: input.groupSlug,
    post_id: data.id,
  });
  revalidatePath(`/g/${input.groupSlug}`);
  return { postId: data.id };
}

export async function redirectToGroup(slug: string) {
  redirect(`/g/${slug}`);
}
