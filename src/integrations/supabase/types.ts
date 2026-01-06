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
      document_relations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          relation_type: Database["public"]["Enums"]["document_relation_type"]
          source_document_id: string
          target_document_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          relation_type: Database["public"]["Enums"]["document_relation_type"]
          source_document_id: string
          target_document_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          relation_type?: Database["public"]["Enums"]["document_relation_type"]
          source_document_id?: string
          target_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          document_id: string
          id: string
          tag_id: string
        }
        Insert: {
          document_id: string
          id?: string
          tag_id: string
        }
        Update: {
          document_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience: string[] | null
          created_at: string
          description: string | null
          downloads: number | null
          file_path: string
          file_size: string | null
          group_id: string | null
          id: string
          is_cached: boolean | null
          rating: number | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          uploaded_by: string | null
          version: string | null
          visibility_scope:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string[] | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          file_path: string
          file_size?: string | null
          group_id?: string | null
          id?: string
          is_cached?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
          visibility_scope?:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience?: string[] | null
          created_at?: string
          description?: string | null
          downloads?: number | null
          file_path?: string
          file_size?: string | null
          group_id?: string | null
          id?: string
          is_cached?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
          visibility_scope?:
            | Database["public"]["Enums"]["visibility_scope"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_answers: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          is_accepted: boolean
          question_id: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          question_id: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          question_id?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "forum_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_question_tags: {
        Row: {
          id: string
          question_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          question_id: string
          tag_id: string
        }
        Update: {
          id?: string
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_question_tags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "forum_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_questions: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          group_id: string | null
          id: string
          is_hot: boolean
          is_resolved: boolean
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_hot?: boolean
          is_resolved?: boolean
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_hot?: boolean
          is_resolved?: boolean
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_global: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          department_enum: Database["public"]["Enums"]["user_department"] | null
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          department_enum?:
            | Database["public"]["Enums"]["user_department"]
            | null
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          department_enum?:
            | Database["public"]["Enums"]["user_department"]
            | null
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_groups: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_document: {
        Args: { _doc_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "champion" | "administrator"
      document_relation_type:
        | "extends"
        | "references"
        | "supersedes"
        | "depends_on"
        | "implements"
        | "explains"
        | "related_to"
      document_status: "pending" | "approved" | "best-practice" | "rejected"
      document_type:
        | "pdf"
        | "excel"
        | "presentation"
        | "flowchart"
        | "drawing"
        | "image"
        | "other"
      user_department: "office" | "manager" | "craftsman"
      visibility_scope: "company_only" | "all_companies"
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
      app_role: ["employee", "champion", "administrator"],
      document_relation_type: [
        "extends",
        "references",
        "supersedes",
        "depends_on",
        "implements",
        "explains",
        "related_to",
      ],
      document_status: ["pending", "approved", "best-practice", "rejected"],
      document_type: [
        "pdf",
        "excel",
        "presentation",
        "flowchart",
        "drawing",
        "image",
        "other",
      ],
      user_department: ["office", "manager", "craftsman"],
      visibility_scope: ["company_only", "all_companies"],
    },
  },
} as const
