export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          affiliation: string | null
          audience_size: number | null
          bio: string
          content_language: string | null
          created_at: string
          credibility_url: string | null
          desired_role: Database["public"]["Enums"]["application_role"]
          desired_role_other: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          job_title: string | null
          last_name: string | null
          org_mission: string | null
          org_name: string | null
          org_size: string | null
          platform_url: string | null
          primary_platform: string | null
          publication_name: string | null
          publication_url: string | null
          referral_source: string | null
          reporting_beat: string | null
          reviewed_at: string | null
          sample_work_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          website_url: string | null
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          affiliation?: string | null
          audience_size?: number | null
          bio: string
          content_language?: string | null
          created_at?: string
          credibility_url?: string | null
          desired_role: Database["public"]["Enums"]["application_role"]
          desired_role_other?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          org_mission?: string | null
          org_name?: string | null
          org_size?: string | null
          platform_url?: string | null
          primary_platform?: string | null
          publication_name?: string | null
          publication_url?: string | null
          referral_source?: string | null
          reporting_beat?: string | null
          reviewed_at?: string | null
          sample_work_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          website_url?: string | null
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          affiliation?: string | null
          audience_size?: number | null
          bio?: string
          content_language?: string | null
          created_at?: string
          credibility_url?: string | null
          desired_role?: Database["public"]["Enums"]["application_role"]
          desired_role_other?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          org_mission?: string | null
          org_name?: string | null
          org_size?: string | null
          platform_url?: string | null
          primary_platform?: string | null
          publication_name?: string | null
          publication_url?: string | null
          referral_source?: string | null
          reporting_beat?: string | null
          reviewed_at?: string | null
          sample_work_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          website_url?: string | null
        }
        Relationships: []
      }
      brief_contributions: {
        Row: {
          body: string | null
          brief_id: string
          contested_point_id: string | null
          created_at: string
          id: string
          section_id: string | null
          section_version: number | null
          status: Database["public"]["Enums"]["brief_contribution_status"]
          type: Database["public"]["Enums"]["brief_contribution_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          brief_id: string
          contested_point_id?: string | null
          created_at?: string
          id?: string
          section_id?: string | null
          section_version?: number | null
          status?: Database["public"]["Enums"]["brief_contribution_status"]
          type: Database["public"]["Enums"]["brief_contribution_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          brief_id?: string
          contested_point_id?: string | null
          created_at?: string
          id?: string
          section_id?: string | null
          section_version?: number | null
          status?: Database["public"]["Enums"]["brief_contribution_status"]
          type?: Database["public"]["Enums"]["brief_contribution_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_contributions_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_contributions_contested_point_id_fkey"
            columns: ["contested_point_id"]
            isOneToOne: false
            referencedRelation: "contested_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_contributions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "brief_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_correction_proposals: {
        Row: {
          brief_id: string
          contribution_text: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          brief_id: string
          contribution_text: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          brief_id?: string
          contribution_text?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_correction_proposals_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_correction_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_faq_answers: {
        Row: {
          author_user_id: string
          body: string
          brief_id: string
          created_at: string
          id: string
          question: string
          status: string
        }
        Insert: {
          author_user_id: string
          body: string
          brief_id: string
          created_at?: string
          id?: string
          question: string
          status?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          brief_id?: string
          created_at?: string
          id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_faq_answers_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_faq_answers_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_proposals: {
        Row: {
          created_at: string
          from_brief_title: string | null
          id: string
          status: string
          submitter_email: string
          submitter_name: string
          topic_title: string
          user_id: string | null
          why_it_matters: string
        }
        Insert: {
          created_at?: string
          from_brief_title?: string | null
          id?: string
          status?: string
          submitter_email: string
          submitter_name: string
          topic_title: string
          user_id?: string | null
          why_it_matters: string
        }
        Update: {
          created_at?: string
          from_brief_title?: string | null
          id?: string
          status?: string
          submitter_email?: string
          submitter_name?: string
          topic_title?: string
          user_id?: string | null
          why_it_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_sections: {
        Row: {
          brief_id: string
          content: string
          content_version: number
          display_order: number
          id: string
          section_type: Database["public"]["Enums"]["brief_section_type"]
          title: string | null
          updated_at: string
        }
        Insert: {
          brief_id: string
          content: string
          content_version?: number
          display_order: number
          id?: string
          section_type: Database["public"]["Enums"]["brief_section_type"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          brief_id?: string
          content?: string
          content_version?: number
          display_order?: number
          id?: string
          section_type?: Database["public"]["Enums"]["brief_section_type"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_sections_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          created_at: string
          id: string
          last_reviewed_at: string | null
          pinned_media_post_id: string | null
          slug: string
          subtitle: string | null
          title: string
          topic_tag: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["brief_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          pinned_media_post_id?: string | null
          slug: string
          subtitle?: string | null
          title: string
          topic_tag?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["brief_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          pinned_media_post_id?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          topic_tag?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["brief_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "briefs_pinned_media_post_id_fkey"
            columns: ["pinned_media_post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          post_type: Database["public"]["Enums"]["post_type"]
          title: string
          topic_tags: string[]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          post_type: Database["public"]["Enums"]["post_type"]
          title: string
          topic_tags?: string[]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          post_type?: Database["public"]["Enums"]["post_type"]
          title?: string
          topic_tags?: string[]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contested_points: {
        Row: {
          brief_id: string
          created_at: string
          display_order: number
          id: string
          question: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          display_order: number
          id?: string
          question: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          display_order?: number
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "contested_points_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          replied_at: string | null
          sender_id: string
          sender_role: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          replied_at?: string | null
          sender_id: string
          sender_role: string
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          replied_at?: string | null
          sender_id?: string
          sender_role?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_text: string | null
          brief_id: string
          created_at: string
          id: string
          question_text: string
          status: string
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          brief_id: string
          created_at?: string
          id?: string
          question_text: string
          status?: string
          user_id: string
        }
        Update: {
          answer_text?: string | null
          brief_id?: string
          created_at?: string
          id?: string
          question_text?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          is_machine_translated: boolean
          language: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_name: string
          id?: string
          is_machine_translated?: boolean
          language: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: string
          is_machine_translated?: boolean
          language?: string
          translated_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_affiliations: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          job_title_override: string | null
          organisation_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          job_title_override?: string | null
          organisation_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          job_title_override?: string | null
          organisation_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_affiliations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_affiliations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          affiliation: string | null
          areas_of_focus: string[] | null
          audience_size: number | null
          availability: Database["public"]["Enums"]["availability_status"]
          avatar_url: string | null
          bio: string | null
          content_language: string | null
          created_at: string
          credibility_url: string | null
          display_name: string
          email: string
          full_name: string
          id: string
          job_title: string | null
          org_mission: string | null
          org_name: string | null
          org_size: Database["public"]["Enums"]["org_size"] | null
          platform_url: string | null
          preferred_language: string
          primary_platform:
            | Database["public"]["Enums"]["primary_platform"]
            | null
          publication_name: string | null
          publication_url: string | null
          reporting_beat: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliation?: string | null
          areas_of_focus?: string[] | null
          audience_size?: number | null
          availability?: Database["public"]["Enums"]["availability_status"]
          avatar_url?: string | null
          bio?: string | null
          content_language?: string | null
          created_at?: string
          credibility_url?: string | null
          display_name: string
          email: string
          full_name: string
          id: string
          job_title?: string | null
          org_mission?: string | null
          org_name?: string | null
          org_size?: Database["public"]["Enums"]["org_size"] | null
          platform_url?: string | null
          preferred_language?: string
          primary_platform?:
            | Database["public"]["Enums"]["primary_platform"]
            | null
          publication_name?: string | null
          publication_url?: string | null
          reporting_beat?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliation?: string | null
          areas_of_focus?: string[] | null
          audience_size?: number | null
          availability?: Database["public"]["Enums"]["availability_status"]
          avatar_url?: string | null
          bio?: string | null
          content_language?: string | null
          created_at?: string
          credibility_url?: string | null
          display_name?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          org_mission?: string | null
          org_name?: string | null
          org_size?: Database["public"]["Enums"]["org_size"] | null
          platform_url?: string | null
          preferred_language?: string
          primary_platform?:
            | Database["public"]["Enums"]["primary_platform"]
            | null
          publication_name?: string | null
          publication_url?: string | null
          reporting_beat?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      application_role:
        | "creator"
        | "expert"
        | "organisation"
        | "journalist"
        | "other"
      application_status: "pending" | "approved" | "rejected"
      availability_status: "open" | "limited" | "unavailable"
      brief_contribution_status: "pending" | "published" | "archived"
      brief_contribution_type: "review" | "endorsement" | "take" | "comment"
      brief_section_type:
        | "tldr"
        | "use_this"
        | "featured_news"
        | "explainer"
        | "where_experts_stand"
        | "going_deeper"
        | "faq"
      brief_visibility: "public" | "members_only"
      message_status: "pending" | "accepted" | "declined"
      org_size: "small" | "medium" | "large"
      post_type: "video" | "article" | "paper" | "quote" | "resource"
      primary_platform: "youtube" | "podcast" | "instagram" | "tiktok" | "other"
      user_role: "creator" | "expert" | "organisation" | "journalist" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_role: [
        "creator",
        "expert",
        "organisation",
        "journalist",
        "other",
      ],
      application_status: ["pending", "approved", "rejected"],
      availability_status: ["open", "limited", "unavailable"],
      brief_contribution_status: ["pending", "published", "archived"],
      brief_contribution_type: ["review", "endorsement", "take", "comment"],
      brief_section_type: [
        "tldr",
        "use_this",
        "featured_news",
        "explainer",
        "where_experts_stand",
        "going_deeper",
        "faq",
      ],
      brief_visibility: ["public", "members_only"],
      message_status: ["pending", "accepted", "declined"],
      org_size: ["small", "medium", "large"],
      post_type: ["video", "article", "paper", "quote", "resource"],
      primary_platform: ["youtube", "podcast", "instagram", "tiktok", "other"],
      user_role: ["creator", "expert", "organisation", "journalist", "admin"],
    },
  },
} as const
