export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      execution_plans: {
        Row: {
          created_at: string | null
          estimated_total_hours: number
          id: string
          phases: Json
          project_id: string | null
          total_stories: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_total_hours: number
          id?: string
          phases?: Json
          project_id?: string | null
          total_stories: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_total_hours?: number
          id?: string
          phases?: Json
          project_id?: string | null
          total_stories?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          category: string | null
          complexity: string | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          execution_order: number | null
          id: string
          metadata: Json | null
          order_index: number | null
          parent_id: string | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          execution_order?: number | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          parent_id?: string | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          execution_order?: number | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          parent_id?: string | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_prompts: {
        Row: {
          content: string
          created_at: string | null
          execution_order: number
          id: string
          phase_number: number | null
          platform: string
          project_id: string | null
          prompt_type: string
          title: string
          user_story_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          execution_order: number
          id?: string
          phase_number?: number | null
          platform: string
          project_id?: string | null
          prompt_type: string
          title: string
          user_story_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          execution_order?: number
          id?: string
          phase_number?: number | null
          platform?: string
          project_id?: string | null
          prompt_type?: string
          title?: string
          user_story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_prompts_user_story_id_fkey"
            columns: ["user_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      mindmaps: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          project_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          project_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          project_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mindmaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      prd_sections: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_editable: boolean | null
          prd_id: string | null
          section_name: string
          section_order: number
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_editable?: boolean | null
          prd_id?: string | null
          section_name: string
          section_order: number
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_editable?: boolean | null
          prd_id?: string | null
          section_name?: string
          section_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prd_sections_prd_id_fkey"
            columns: ["prd_id"]
            isOneToOne: false
            referencedRelation: "prds"
            referencedColumns: ["id"]
          },
        ]
      }
      prds: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          sections: Json | null
          template: string
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          sections?: Json | null
          template?: string
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          sections?: Json | null
          template?: string
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          features: Json
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          parent_template_id: string | null
          tags: string[] | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          features?: Json
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          parent_template_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          features?: Json
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          parent_template_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          project_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_completions: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          platform: string
          project_id: string | null
          user_id: string | null
          user_story_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          platform: string
          project_id?: string | null
          user_id?: string | null
          user_story_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          platform?: string
          project_id?: string | null
          user_id?: string | null
          user_story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_completions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_completions_user_story_id_fkey"
            columns: ["user_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_story_id: string
          id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_story_id: string
          id?: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_story_id?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_dependencies_depends_on_story_id_fkey"
            columns: ["depends_on_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_dependencies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_operations: {
        Row: {
          changes: Json | null
          id: string
          operation_type: string
          performed_at: string | null
          performed_by: string | null
          story_ids: string[]
        }
        Insert: {
          changes?: Json | null
          id?: string
          operation_type: string
          performed_at?: string | null
          performed_by?: string | null
          story_ids: string[]
        }
        Update: {
          changes?: Json | null
          id?: string
          operation_type?: string
          performed_at?: string | null
          performed_by?: string | null
          story_ids?: string[]
        }
        Relationships: []
      }
      story_relationships: {
        Row: {
          child_story_id: string | null
          created_at: string | null
          id: string
          parent_story_id: string | null
          relationship_type: string | null
        }
        Insert: {
          child_story_id?: string | null
          created_at?: string | null
          id?: string
          parent_story_id?: string | null
          relationship_type?: string | null
        }
        Update: {
          child_story_id?: string | null
          created_at?: string | null
          id?: string
          parent_story_id?: string | null
          relationship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_relationships_child_story_id_fkey"
            columns: ["child_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_relationships_parent_story_id_fkey"
            columns: ["parent_story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_templates: {
        Row: {
          acceptance_criteria_template: string[] | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_template: string | null
          id: string
          is_public: boolean | null
          name: string
          title_template: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria_template?: string[] | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_template?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          title_template: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria_template?: string[] | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_template?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      template_usage: {
        Row: {
          feedback_rating: number | null
          feedback_text: string | null
          id: string
          project_id: string | null
          template_id: string
          used_at: string | null
          used_by: string
        }
        Insert: {
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          project_id?: string | null
          template_id: string
          used_at?: string | null
          used_by: string
        }
        Update: {
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          project_id?: string | null
          template_id?: string
          used_at?: string | null
          used_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      troubleshooting_guides: {
        Row: {
          content: string
          created_at: string | null
          id: string
          platform: string
          project_id: string | null
          sections: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          platform: string
          project_id?: string | null
          sections?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          platform?: string
          project_id?: string | null
          sections?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "troubleshooting_guides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          acceptance_criteria: string[] | null
          complexity: string | null
          created_at: string | null
          dependencies: Json | null
          description: string | null
          estimated_hours: number | null
          execution_order: number | null
          feature_id: string
          id: string
          priority: string | null
          status: string | null
          story_points: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          complexity?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          estimated_hours?: number | null
          execution_order?: number | null
          feature_id: string
          id?: string
          priority?: string | null
          status?: string | null
          story_points?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          complexity?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          estimated_hours?: number | null
          execution_order?: number | null
          feature_id?: string
          id?: string
          priority?: string | null
          status?: string | null
          story_points?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stories_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
