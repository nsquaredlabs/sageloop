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
      extractions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          criteria: Json
          id: number
          project_id: number | null
          rated_output_count: number
          system_prompt_snapshot: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          criteria: Json
          id?: never
          project_id?: number | null
          rated_output_count?: number
          system_prompt_snapshot: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          criteria?: Json
          id?: never
          project_id?: number | null
          rated_output_count?: number
          system_prompt_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          criteria_breakdown: Json | null
          extraction_id: number | null
          id: number
          project_id: number | null
          snapshot_time: string | null
          success_rate: number | null
        }
        Insert: {
          criteria_breakdown?: Json | null
          extraction_id?: number | null
          id?: never
          project_id?: number | null
          snapshot_time?: string | null
          success_rate?: number | null
        }
        Update: {
          criteria_breakdown?: Json | null
          extraction_id?: number | null
          id?: never
          project_id?: number | null
          snapshot_time?: string | null
          success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outputs: {
        Row: {
          generated_at: string | null
          id: number
          model_snapshot: Json
          output_text: string
          scenario_id: number | null
        }
        Insert: {
          generated_at?: string | null
          id?: never
          model_snapshot: Json
          output_text: string
          scenario_id?: number | null
        }
        Update: {
          generated_at?: string | null
          id?: never
          model_snapshot?: Json
          output_text?: string
          scenario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outputs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          model_config: Json
          name: string
          prompt_version: number | null
          updated_at: string | null
          workbench_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: never
          model_config: Json
          name: string
          prompt_version?: number | null
          updated_at?: string | null
          workbench_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: never
          model_config?: Json
          name?: string
          prompt_version?: number | null
          updated_at?: string | null
          workbench_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_workbench_id_fkey"
            columns: ["workbench_id"]
            isOneToOne: false
            referencedRelation: "workbenches"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_iterations: {
        Row: {
          created_at: string | null
          id: number
          improvement_note: string | null
          parent_version: number | null
          project_id: number | null
          success_rate_after: number | null
          success_rate_before: number | null
          system_prompt: string
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          improvement_note?: string | null
          parent_version?: number | null
          project_id?: number | null
          success_rate_after?: number | null
          success_rate_before?: number | null
          system_prompt: string
          version: number
        }
        Update: {
          created_at?: string | null
          id?: never
          improvement_note?: string | null
          parent_version?: number | null
          project_id?: number | null
          success_rate_after?: number | null
          success_rate_before?: number | null
          system_prompt?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_iterations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          extraction_version: number | null
          feedback_text: string | null
          id: number
          output_id: number | null
          stars: number
          tags: Json | null
        }
        Insert: {
          created_at?: string | null
          extraction_version?: number | null
          feedback_text?: string | null
          id?: never
          output_id?: number | null
          stars: number
          tags?: Json | null
        }
        Update: {
          created_at?: string | null
          extraction_version?: number | null
          feedback_text?: string | null
          id?: never
          output_id?: number | null
          stars?: number
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "outputs"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string | null
          id: number
          input_text: string
          order: number
          project_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          input_text: string
          order: number
          project_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          input_text?: string
          order?: number
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workbenches: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
          workbench_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          workbench_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          workbench_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workbenches_workbench_id_fkey"
            columns: ["workbench_id"]
            isOneToOne: false
            referencedRelation: "workbenches"
            referencedColumns: ["id"]
          },
        ]
      }
      workbenches: {
        Row: {
          created_at: string | null
          encrypted_api_keys: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_api_keys?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_api_keys?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_workbench_api_keys: {
        Args: { workbench_uuid: string }
        Returns: Json
      }
      get_workbench_api_keys: {
        Args: { workbench_uuid: string }
        Returns: Json
      }
      set_workbench_api_keys: {
        Args: { api_keys_json: Json; workbench_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

