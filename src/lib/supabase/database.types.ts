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
      education: {
        Row: {
          created_at: string | null;
          degree: string | null;
          description: string | null;
          end_year: number | null;
          field_of_study: string | null;
          id: string;
          school_name: string;
          start_year: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          degree?: string | null;
          description?: string | null;
          end_year?: number | null;
          field_of_study?: string | null;
          id?: string;
          school_name: string;
          start_year?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          degree?: string | null;
          description?: string | null;
          end_year?: number | null;
          field_of_study?: string | null;
          id?: string;
          school_name?: string;
          start_year?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          created_at: string | null;
          credential_id: string | null;
          credential_url: string | null;
          description: string | null;
          expires_date: string | null;
          id: string;
          issued_date: string | null;
          issuer: string | null;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          credential_id?: string | null;
          credential_url?: string | null;
          description?: string | null;
          expires_date?: string | null;
          id?: string;
          issued_date?: string | null;
          issuer?: string | null;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          credential_id?: string | null;
          credential_url?: string | null;
          description?: string | null;
          expires_date?: string | null;
          id?: string;
          issued_date?: string | null;
          issuer?: string | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      job_listings: {
        Row: {
          application_email: string | null;
          application_url: string | null;
          compensation_max: number | null;
          compensation_min: number | null;
          compensation_period: string | null;
          created_at: string | null;
          currency: string;
          description: string;
          embedding: string | null;
          employment_type: string;
          expires_at: string | null;
          id: string;
          location: string | null;
          organization_id: string | null;
          poster_id: string;
          remote_policy: string;
          status: string;
          title: string;
        };
        Insert: {
          application_email?: string | null;
          application_url?: string | null;
          compensation_max?: number | null;
          compensation_min?: number | null;
          compensation_period?: string | null;
          created_at?: string | null;
          currency?: string;
          description: string;
          embedding?: string | null;
          employment_type: string;
          expires_at?: string | null;
          id?: string;
          location?: string | null;
          organization_id?: string | null;
          poster_id: string;
          remote_policy: string;
          status?: string;
          title: string;
        };
        Update: {
          application_email?: string | null;
          application_url?: string | null;
          compensation_max?: number | null;
          compensation_min?: number | null;
          compensation_period?: string | null;
          created_at?: string | null;
          currency?: string;
          description?: string;
          embedding?: string | null;
          employment_type?: string;
          expires_at?: string | null;
          id?: string;
          location?: string | null;
          organization_id?: string | null;
          poster_id?: string;
          remote_policy?: string;
          status?: string;
          title?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          headquarters: string | null;
          id: string;
          industry: string | null;
          logo_url: string | null;
          member_count: number;
          name: string;
          size_band: string | null;
          slug: string;
          updated_at: string | null;
          verified: boolean;
          website: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          headquarters?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          member_count?: number;
          name: string;
          size_band?: string | null;
          slug: string;
          updated_at?: string | null;
          verified?: boolean;
          website?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          headquarters?: string | null;
          id?: string;
          industry?: string | null;
          logo_url?: string | null;
          member_count?: number;
          name?: string;
          size_band?: string | null;
          slug?: string;
          updated_at?: string | null;
          verified?: boolean;
          website?: string | null;
        };
        Relationships: [];
      };
      positions: {
        Row: {
          created_at: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          is_current: boolean;
          organization_id: string | null;
          organization_name: string | null;
          start_date: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean;
          organization_id?: string | null;
          organization_name?: string | null;
          start_date: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean;
          organization_id?: string | null;
          organization_name?: string | null;
          start_date?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      advertisements: {
        Row: {
          body: string;
          budget_spent_cents: number;
          budget_total_cents: number;
          clicks: number;
          cost_per_impression_cents: number;
          created_at: string | null;
          creative_url: string | null;
          cta_label: string;
          ends_at: string | null;
          headline: string;
          id: string;
          impressions: number;
          organization_id: string | null;
          sponsor_id: string;
          starts_at: string | null;
          status: string;
          target_industries: string[] | null;
          target_revenue_bands: string[] | null;
          target_url: string;
          updated_at: string | null;
        };
        Insert: {
          body: string;
          budget_spent_cents?: number;
          budget_total_cents: number;
          clicks?: number;
          cost_per_impression_cents?: number;
          created_at?: string | null;
          creative_url?: string | null;
          cta_label?: string;
          ends_at?: string | null;
          headline: string;
          id?: string;
          impressions?: number;
          organization_id?: string | null;
          sponsor_id: string;
          starts_at?: string | null;
          status?: string;
          target_industries?: string[] | null;
          target_revenue_bands?: string[] | null;
          target_url: string;
          updated_at?: string | null;
        };
        Update: {
          body?: string;
          budget_spent_cents?: number;
          budget_total_cents?: number;
          clicks?: number;
          cost_per_impression_cents?: number;
          created_at?: string | null;
          creative_url?: string | null;
          cta_label?: string;
          ends_at?: string | null;
          headline?: string;
          id?: string;
          impressions?: number;
          organization_id?: string | null;
          sponsor_id?: string;
          starts_at?: string | null;
          status?: string;
          target_industries?: string[] | null;
          target_revenue_bands?: string[] | null;
          target_url?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ad_events: {
        Row: {
          ad_id: string;
          created_at: string | null;
          event_type: string;
          id: string;
          viewer_id: string | null;
        };
        Insert: {
          ad_id: string;
          created_at?: string | null;
          event_type: string;
          id?: string;
          viewer_id?: string | null;
        };
        Update: {
          ad_id?: string;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          viewer_id?: string | null;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string | null;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string | null;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          reviewed_at: string | null;
          reviewer_id: string | null;
          status: string;
          target_id: string;
          target_kind: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: string;
          target_id: string;
          target_kind: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          status?: string;
          target_id?: string;
          target_kind?: string;
        };
        Relationships: [];
      };
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
      disputes: {
        Row: {
          created_at: string | null;
          engagement_id: string;
          id: string;
          opener_id: string;
          reason: string;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          engagement_id: string;
          id?: string;
          opener_id: string;
          reason: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string | null;
          engagement_id?: string;
          id?: string;
          opener_id?: string;
          reason?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          body_text: string;
          conversation_id: string;
          counterparty_id: string;
          created_at: string | null;
          creator_id: string;
          fields: Json | null;
          file_url: string | null;
          id: string;
          kind: string;
          parent_document_id: string | null;
          signed_at: string | null;
          status: string;
          title: string;
          voided_at: string | null;
        };
        Insert: {
          body_text: string;
          conversation_id: string;
          counterparty_id: string;
          created_at?: string | null;
          creator_id: string;
          fields?: Json | null;
          file_url?: string | null;
          id?: string;
          kind: string;
          parent_document_id?: string | null;
          signed_at?: string | null;
          status?: string;
          title: string;
          voided_at?: string | null;
        };
        Update: {
          body_text?: string;
          conversation_id?: string;
          counterparty_id?: string;
          created_at?: string | null;
          creator_id?: string;
          fields?: Json | null;
          file_url?: string | null;
          id?: string;
          kind?: string;
          parent_document_id?: string | null;
          signed_at?: string | null;
          status?: string;
          title?: string;
          voided_at?: string | null;
        };
        Relationships: [];
      };
      document_signatures: {
        Row: {
          document_id: string;
          id: string;
          signed_at: string | null;
          signed_name: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          document_id: string;
          id?: string;
          signed_at?: string | null;
          signed_name: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          document_id?: string;
          id?: string;
          signed_at?: string | null;
          signed_name?: string;
          user_agent?: string | null;
          user_id?: string;
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
          payment_method: string;
          platform_fee: number;
          provider_id: string;
          seeker_id: string;
          stripe_charge_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_refund_id: string | null;
          stripe_transfer_id: string | null;
        };
        Insert: {
          amount: number;
          completed_at?: string | null;
          created_at?: string | null;
          delivery_due_at?: string | null;
          escrow_status?: string | null;
          id?: string;
          match_id?: string | null;
          payment_method?: string;
          platform_fee: number;
          provider_id: string;
          seeker_id: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_refund_id?: string | null;
          stripe_transfer_id?: string | null;
        };
        Update: {
          amount?: number;
          completed_at?: string | null;
          created_at?: string | null;
          delivery_due_at?: string | null;
          escrow_status?: string | null;
          id?: string;
          match_id?: string | null;
          payment_method?: string;
          platform_fee?: number;
          provider_id?: string;
          seeker_id?: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_refund_id?: string | null;
          stripe_transfer_id?: string | null;
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
          ai_model: string | null;
          ai_rationale: string | null;
          ai_reranked_at: string | null;
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
          ai_model?: string | null;
          ai_rationale?: string | null;
          ai_reranked_at?: string | null;
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
          ai_model?: string | null;
          ai_rationale?: string | null;
          ai_reranked_at?: string | null;
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
      groups: {
        Row: {
          created_at: string | null;
          created_by: string;
          description: string | null;
          id: string;
          member_count: number;
          name: string;
          slug: string;
          visibility: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          id?: string;
          member_count?: number;
          name: string;
          slug: string;
          visibility?: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          id?: string;
          member_count?: number;
          name?: string;
          slug?: string;
          visibility?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string | null;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string | null;
          role?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string | null;
          role?: string;
          user_id?: string;
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
          related_document_id: string | null;
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
          related_document_id?: string | null;
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
          related_document_id?: string | null;
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
          group_id: string | null;
          hashtags: string[];
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          embedding?: string | null;
          group_id?: string | null;
          hashtags?: string[];
          id?: string;
          kind?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          embedding?: string | null;
          group_id?: string | null;
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
          avatar_url: string | null;
          bio: string | null;
          company_name: string | null;
          company_url: string | null;
          created_at: string | null;
          display_name: string;
          id: string;
          industry: string | null;
          last_need_posted_at: string | null;
          notification_prefs: Json;
          onboarding_complete: boolean | null;
          reciprocity_status: string | null;
          reputation_score: number | null;
          revenue_band: string | null;
          role: string;
          stripe_account_id: string | null;
          stripe_account_status: string;
          tier: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          created_at?: string | null;
          display_name: string;
          id: string;
          industry?: string | null;
          last_need_posted_at?: string | null;
          notification_prefs?: Json;
          onboarding_complete?: boolean | null;
          reciprocity_status?: string | null;
          reputation_score?: number | null;
          revenue_band?: string | null;
          role?: string;
          stripe_account_id?: string | null;
          stripe_account_status?: string;
          tier?: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          company_url?: string | null;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          industry?: string | null;
          last_need_posted_at?: string | null;
          notification_prefs?: Json;
          onboarding_complete?: boolean | null;
          reciprocity_status?: string | null;
          reputation_score?: number | null;
          revenue_band?: string | null;
          role?: string;
          stripe_account_id?: string | null;
          stripe_account_status?: string;
          tier?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      review_media: {
        Row: {
          created_at: string | null;
          height: number | null;
          id: string;
          kind: string;
          position: number;
          review_id: string;
          uploader_id: string;
          url: string;
          width: number | null;
        };
        Insert: {
          created_at?: string | null;
          height?: number | null;
          id?: string;
          kind: string;
          position?: number;
          review_id: string;
          uploader_id: string;
          url: string;
          width?: number | null;
        };
        Update: {
          created_at?: string | null;
          height?: number | null;
          id?: string;
          kind?: string;
          position?: number;
          review_id?: string;
          uploader_id?: string;
          url?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          body: string;
          created_at: string | null;
          engagement_id: string;
          id: string;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
          reviewer_role: string;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          engagement_id: string;
          id?: string;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
          reviewer_role: string;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          engagement_id?: string;
          id?: string;
          rating?: number;
          reviewee_id?: string;
          reviewer_id?: string;
          reviewer_role?: string;
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
        Args: { viewer_id: string; tag_filter?: string | null; limit_count?: number; view_mode?: "personalized" | "recent" };
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
          author_avatar_url: string | null;
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
      start_engagement_for_dm: {
        Args: {
          other_user_id: string;
          amount: number;
          delivery_due_at?: string | null;
          as_provider?: boolean;
        };
        Returns: string;
      };
      run_daily_matcher: {
        Args: Record<string, never>;
        Returns: number;
      };
      leaderboard_top_closers: {
        Args: { since_days?: number; limit_count?: number };
        Returns: Array<{
          user_id: string;
          display_name: string;
          company_name: string | null;
          avatar_url: string | null;
          deals_shipped: number;
          total_amount: number;
        }>;
      };
      leaderboard_top_earners: {
        Args: { since_days?: number; limit_count?: number };
        Returns: Array<{
          user_id: string;
          display_name: string;
          company_name: string | null;
          avatar_url: string | null;
          earned: number;
          deals: number;
        }>;
      };
      leaderboard_top_rated: {
        Args: { limit_count?: number };
        Returns: Array<{
          user_id: string;
          display_name: string;
          company_name: string | null;
          avatar_url: string | null;
          reputation_score: number;
          review_count: number;
        }>;
      };
      profile_social_counts: {
        Args: { target_user: string };
        Returns: Array<{ followers: number; following: number; connections: number }>;
      };
      viewer_connections_at_org: {
        Args: { viewer_id: string; target_org: string };
        Returns: number;
      };
      pick_ad_for_viewer: {
        Args: { viewer_id: string };
        Returns: Array<{
          id: string;
          sponsor_id: string;
          organization_id: string | null;
          organization_slug: string | null;
          organization_name: string | null;
          organization_logo_url: string | null;
          headline: string;
          body: string;
          creative_url: string | null;
          cta_label: string;
          target_url: string;
        }>;
      };
      match_jobs_for_user: {
        Args: { viewer_id: string; limit_count?: number };
        Returns: Array<{
          id: string;
          poster_id: string;
          organization_id: string | null;
          organization_slug: string | null;
          organization_name: string | null;
          organization_logo_url: string | null;
          title: string;
          description: string;
          employment_type: string;
          remote_policy: string;
          location: string | null;
          compensation_min: number | null;
          compensation_max: number | null;
          compensation_period: string | null;
          currency: string;
          application_url: string | null;
          application_email: string | null;
          created_at: string;
          similarity: number | null;
        }>;
      };
      search_organizations: {
        Args: { query: string; limit_count?: number };
        Returns: Array<{
          id: string;
          slug: string;
          name: string;
          industry: string | null;
          logo_url: string | null;
          member_count: number;
        }>;
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
