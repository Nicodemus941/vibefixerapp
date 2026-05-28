export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cold_dm_quota: {
        Row: {
          limit_count: number;
          month_year: string;
          updated_at: string | null;
          used: number | null;
          user_id: string;
        };
        Insert: {
          limit_count?: number;
          month_year: string;
          updated_at?: string | null;
          used?: number | null;
          user_id: string;
        };
        Update: {
          limit_count?: number;
          month_year?: string;
          updated_at?: string | null;
          used?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string | null;
          id: string;
          last_message_at: string | null;
          match_id: string | null;
          origin: string;
          participant_a: string;
          participant_b: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          match_id?: string | null;
          origin: string;
          participant_a: string;
          participant_b: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          match_id?: string | null;
          origin?: string;
          participant_a?: string;
          participant_b?: string;
        };
        Relationships: [];
      };
      engagements: {
        Row: {
          amount: number;
          completed_at: string | null;
          created_at: string | null;
          delivery_due_at: string | null;
          escrow_status: string | null;
          id: string;
          match_id: string | null;
          platform_fee: number;
          provider_id: string;
          seeker_id: string;
          stripe_payment_intent: string | null;
        };
        Insert: {
          amount: number;
          completed_at?: string | null;
          created_at?: string | null;
          delivery_due_at?: string | null;
          escrow_status?: string | null;
          id?: string;
          match_id?: string | null;
          platform_fee: number;
          provider_id: string;
          seeker_id: string;
          stripe_payment_intent?: string | null;
        };
        Update: {
          amount?: number;
          completed_at?: string | null;
          created_at?: string | null;
          delivery_due_at?: string | null;
          escrow_status?: string | null;
          id?: string;
          match_id?: string | null;
          platform_fee?: number;
          provider_id?: string;
          seeker_id?: string;
          stripe_payment_intent?: string | null;
        };
        Relationships: [];
      };
      feed_events: {
        Row: {
          amount: number | null;
          created_at: string | null;
          event_type: string;
          headline: string;
          id: string;
          primary_user_id: string | null;
          related_engagement: string | null;
          related_need: string | null;
          secondary_user_id: string | null;
          visibility: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          event_type: string;
          headline: string;
          id?: string;
          primary_user_id?: string | null;
          related_engagement?: string | null;
          related_need?: string | null;
          secondary_user_id?: string | null;
          visibility?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          event_type?: string;
          headline?: string;
          id?: string;
          primary_user_id?: string | null;
          related_engagement?: string | null;
          related_need?: string | null;
          secondary_user_id?: string | null;
          visibility?: string | null;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          ai_intro_draft: string | null;
          created_at: string | null;
          id: string;
          match_score: number;
          need_id: string;
          offer_id: string;
          provider_id: string;
          provider_status: string | null;
          seeker_id: string;
          seeker_status: string | null;
        };
        Insert: {
          ai_intro_draft?: string | null;
          created_at?: string | null;
          id?: string;
          match_score: number;
          need_id: string;
          offer_id: string;
          provider_id: string;
          provider_status?: string | null;
          seeker_id: string;
          seeker_status?: string | null;
        };
        Update: {
          ai_intro_draft?: string | null;
          created_at?: string | null;
          id?: string;
          match_score?: number;
          need_id?: string;
          offer_id?: string;
          provider_id?: string;
          provider_status?: string | null;
          seeker_id?: string;
          seeker_status?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          attachment_url: string | null;
          body: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          is_ai_drafted: boolean | null;
          sender_id: string;
        };
        Insert: {
          attachment_url?: string | null;
          body: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          is_ai_drafted?: boolean | null;
          sender_id: string;
        };
        Update: {
          attachment_url?: string | null;
          body?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          is_ai_drafted?: boolean | null;
          sender_id?: string;
        };
        Relationships: [];
      };
      needs: {
        Row: {
          budget_max: number | null;
          budget_min: number | null;
          category: string;
          created_at: string | null;
          description: string;
          embedding: string | null;
          id: string;
          status: string | null;
          title: string;
          urgency: string | null;
          user_id: string;
        };
        Insert: {
          budget_max?: number | null;
          budget_min?: number | null;
          category: string;
          created_at?: string | null;
          description: string;
          embedding?: string | null;
          id?: string;
          status?: string | null;
          title: string;
          urgency?: string | null;
          user_id: string;
        };
        Update: {
          budget_max?: number | null;
          budget_min?: number | null;
          category?: string;
          created_at?: string | null;
          description?: string;
          embedding?: string | null;
          id?: string;
          status?: string | null;
          title?: string;
          urgency?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          category: string;
          created_at: string | null;
          description: string;
          embedding: string | null;
          id: string;
          is_active: boolean | null;
          price_max: number | null;
          price_min: number | null;
          pricing_model: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description: string;
          embedding?: string | null;
          id?: string;
          is_active?: boolean | null;
          price_max?: number | null;
          price_min?: number | null;
          pricing_model?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string;
          embedding?: string | null;
          id?: string;
          is_active?: boolean | null;
          price_max?: number | null;
          price_min?: number | null;
          pricing_model?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          body: string;
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      post_reactions: {
        Row: {
          created_at: string | null;
          kind: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          kind?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          kind?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string | null;
          id: string;
          kind: string;
          payload: Json | null;
          read_at: string | null;
          related_conversation_id: string | null;
          related_match_id: string | null;
          related_post_id: string | null;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string | null;
          id?: string;
          kind: string;
          payload?: Json | null;
          read_at?: string | null;
          related_conversation_id?: string | null;
          related_match_id?: string | null;
          related_post_id?: string | null;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string | null;
          id?: string;
          kind?: string;
          payload?: Json | null;
          read_at?: string | null;
          related_conversation_id?: string | null;
          related_match_id?: string | null;
          related_post_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          body: string;
          created_at: string | null;
          embedding: string | null;
          hashtags: string[];
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          embedding?: string | null;
          hashtags?: string[];
          id?: string;
          kind?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          embedding?: string | null;
          hashtags?: string[];
          id?: string;
          kind?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      platform_events: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          payload: Json | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          payload?: Json | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          payload?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          bio: string | null;
          company_name: string | null;
          company_url: string | null;
          created_at: string | null;
          display_name: string;
          id: string;
          industry: string | null;
          last_need_posted_at: string | null;
          onboarding_complete: boolean | null;
          reciprocity_status: string | null;
          reputation_score: number | null;
          revenue_band: string | null;
          role: string;
          tier: string;
          updated_at: string | null;
        };
        Insert: {
          bio?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          created_at?: string | null;
          display_name: string;
          id: string;
          industry?: string | null;
          last_need_posted_at?: string | null;
          onboarding_complete?: boolean | null;
          reciprocity_status?: string | null;
          reputation_score?: number | null;
          revenue_band?: string | null;
          role?: string;
          tier?: string;
          updated_at?: string | null;
        };
        Update: {
          bio?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          industry?: string | null;
          last_need_posted_at?: string | null;
          onboarding_complete?: boolean | null;
          reciprocity_status?: string | null;
          reputation_score?: number | null;
          revenue_band?: string | null;
          role?: string;
          tier?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      reputation_events: {
        Row: {
          created_at: string | null;
          delta: number;
          event_type: string;
          id: string;
          notes: string | null;
          related_engagement: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          delta: number;
          event_type: string;
          id?: string;
          notes?: string | null;
          related_engagement?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          delta?: number;
          event_type?: string;
          id?: string;
          notes?: string | null;
          related_engagement?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      enforce_reciprocity: { Args: Record<string, never>; Returns: undefined };
      feed_for_user: {
        Args: { viewer_id: string; tag_filter?: string | null; limit_count?: number };
        Returns: Array<{
          id: string;
          user_id: string;
          body: string;
          hashtags: string[];
          kind: string;
          created_at: string;
          similarity: number | null;
          author_display_name: string;
          author_company_name: string | null;
          author_industry: string | null;
        }>;
      };
      trending_hashtags: {
        Args: { since_hours?: number; limit_count?: number };
        Returns: Array<{ tag: string; count: number }>;
      };
      start_or_get_dm: {
        Args: { other_user_id: string; conv_origin?: string };
        Returns: string;
      };
      run_daily_matcher: {
        Args: Record<string, never>;
        Returns: number;
      };
      search_loop: {
        Args: { q: string; limit_per?: number };
        Returns: Array<{
          kind: "post" | "person";
          rank: number;
          post_id: string | null;
          post_body: string | null;
          post_hashtags: string[] | null;
          post_kind: string | null;
          post_created_at: string | null;
          post_user_id: string | null;
          person_id: string | null;
          person_display_name: string | null;
          person_company_name: string | null;
          person_industry: string | null;
          person_role: string | null;
        }>;
      };
      pending_matches_for: {
        Args: { viewer_id: string };
        Returns: Array<{
          id: string;
          role: "seeker" | "provider";
          match_score: number;
          created_at: string;
          counterparty_id: string;
          counterparty_name: string;
          counterparty_company: string | null;
          counterparty_industry: string | null;
          need_id: string;
          need_title: string;
          need_urgency: string | null;
          offer_id: string;
          offer_title: string;
          offer_category: string;
          seeker_status: string | null;
          provider_status: string | null;
        }>;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
