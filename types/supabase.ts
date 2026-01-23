export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      extractions: {
        Row: {
          confidence_score: number | null;
          created_at: string | null;
          criteria: Json;
          dimensions: Json | null;
          id: number;
          project_id: number | null;
          rated_output_count: number;
          system_prompt_snapshot: string;
        };
        Insert: {
          confidence_score?: number | null;
          created_at?: string | null;
          criteria: Json;
          dimensions?: Json | null;
          id?: never;
          project_id?: number | null;
          rated_output_count?: number;
          system_prompt_snapshot: string;
        };
        Update: {
          confidence_score?: number | null;
          created_at?: string | null;
          criteria?: Json;
          dimensions?: Json | null;
          id?: never;
          project_id?: number | null;
          rated_output_count?: number;
          system_prompt_snapshot?: string;
        };
        Relationships: [
          {
            foreignKeyName: "extractions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      metrics: {
        Row: {
          criteria_breakdown: Json | null;
          extraction_id: number | null;
          id: number;
          project_id: number | null;
          snapshot_time: string | null;
          success_rate: number | null;
        };
        Insert: {
          criteria_breakdown?: Json | null;
          extraction_id?: number | null;
          id?: never;
          project_id?: number | null;
          snapshot_time?: string | null;
          success_rate?: number | null;
        };
        Update: {
          criteria_breakdown?: Json | null;
          extraction_id?: number | null;
          id?: never;
          project_id?: number | null;
          snapshot_time?: string | null;
          success_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "metrics_extraction_id_fkey";
            columns: ["extraction_id"];
            isOneToOne: false;
            referencedRelation: "extractions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metrics_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      outputs: {
        Row: {
          generated_at: string | null;
          id: number;
          model_snapshot: Json;
          output_text: string;
          scenario_id: number | null;
        };
        Insert: {
          generated_at?: string | null;
          id?: never;
          model_snapshot: Json;
          output_text: string;
          scenario_id?: number | null;
        };
        Update: {
          generated_at?: string | null;
          id?: never;
          model_snapshot?: Json;
          output_text?: string;
          scenario_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "outputs_scenario_id_fkey";
            columns: ["scenario_id"];
            isOneToOne: false;
            referencedRelation: "scenarios";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          created_via_onboarding: boolean | null;
          description: string | null;
          id: number;
          is_onboarding_project: boolean | null;
          model_config: Json;
          name: string;
          prompt_version: number | null;
          updated_at: string | null;
          workbench_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          created_via_onboarding?: boolean | null;
          description?: string | null;
          id?: never;
          is_onboarding_project?: boolean | null;
          model_config: Json;
          name: string;
          prompt_version?: number | null;
          updated_at?: string | null;
          workbench_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          created_via_onboarding?: boolean | null;
          description?: string | null;
          id?: never;
          is_onboarding_project?: boolean | null;
          model_config?: Json;
          name?: string;
          prompt_version?: number | null;
          updated_at?: string | null;
          workbench_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workbench_id_fkey";
            columns: ["workbench_id"];
            isOneToOne: false;
            referencedRelation: "workbenches";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_iterations: {
        Row: {
          created_at: string | null;
          id: number;
          improvement_note: string | null;
          parent_version: number | null;
          project_id: number | null;
          success_rate_after: number | null;
          success_rate_before: number | null;
          system_prompt: string;
          version: number;
        };
        Insert: {
          created_at?: string | null;
          id?: never;
          improvement_note?: string | null;
          parent_version?: number | null;
          project_id?: number | null;
          success_rate_after?: number | null;
          success_rate_before?: number | null;
          system_prompt: string;
          version: number;
        };
        Update: {
          created_at?: string | null;
          id?: never;
          improvement_note?: string | null;
          parent_version?: number | null;
          project_id?: number | null;
          success_rate_after?: number | null;
          success_rate_before?: number | null;
          system_prompt?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_iterations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      ratings: {
        Row: {
          created_at: string | null;
          extraction_version: number | null;
          feedback_text: string | null;
          id: number;
          metadata: Json | null;
          output_id: number | null;
          stars: number;
          tags: Json | null;
        };
        Insert: {
          created_at?: string | null;
          extraction_version?: number | null;
          feedback_text?: string | null;
          id?: never;
          metadata?: Json | null;
          output_id?: number | null;
          stars: number;
          tags?: Json | null;
        };
        Update: {
          created_at?: string | null;
          extraction_version?: number | null;
          feedback_text?: string | null;
          id?: never;
          metadata?: Json | null;
          output_id?: number | null;
          stars?: number;
          tags?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_output_id_fkey";
            columns: ["output_id"];
            isOneToOne: false;
            referencedRelation: "outputs";
            referencedColumns: ["id"];
          },
        ];
      };
      scenarios: {
        Row: {
          created_at: string | null;
          id: number;
          input_text: string;
          order: number;
          project_id: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: never;
          input_text: string;
          order: number;
          project_id?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: never;
          input_text?: string;
          order?: number;
          project_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "scenarios_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      security_audit_logs: {
        Row: {
          created_at: string;
          event_type: string;
          id: number;
          ip_address: string | null;
          metadata: Json | null;
          provider: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: number;
          ip_address?: string | null;
          metadata?: Json | null;
          provider?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: number;
          ip_address?: string | null;
          metadata?: Json | null;
          provider?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          allow_premium_models: boolean;
          allow_team_collaboration: boolean;
          created_at: string | null;
          description: string | null;
          display_name: string;
          features: Json | null;
          id: string;
          is_available: boolean;
          name: string;
          premium_outputs_limit: number;
          price_monthly_cents: number;
          sort_order: number;
          standard_outputs_limit: number;
        };
        Insert: {
          allow_premium_models?: boolean;
          allow_team_collaboration?: boolean;
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          features?: Json | null;
          id: string;
          is_available?: boolean;
          name: string;
          premium_outputs_limit?: number;
          price_monthly_cents?: number;
          sort_order?: number;
          standard_outputs_limit?: number;
        };
        Update: {
          allow_premium_models?: boolean;
          allow_team_collaboration?: boolean;
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          features?: Json | null;
          id?: string;
          is_available?: boolean;
          name?: string;
          premium_outputs_limit?: number;
          price_monthly_cents?: number;
          sort_order?: number;
          standard_outputs_limit?: number;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string;
          current_period_start: string;
          id: string;
          last_usage_reset: string | null;
          plan_id: string;
          premium_outputs_used: number;
          standard_outputs_used: number;
          status: string;
          updated_at: string | null;
          workbench_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_period_end: string;
          current_period_start?: string;
          id?: string;
          last_usage_reset?: string | null;
          plan_id: string;
          premium_outputs_used?: number;
          standard_outputs_used?: number;
          status?: string;
          updated_at?: string | null;
          workbench_id: string;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string;
          current_period_start?: string;
          id?: string;
          last_usage_reset?: string | null;
          plan_id?: string;
          premium_outputs_used?: number;
          standard_outputs_used?: number;
          status?: string;
          updated_at?: string | null;
          workbench_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_workbench_id_fkey";
            columns: ["workbench_id"];
            isOneToOne: true;
            referencedRelation: "workbenches";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_events: {
        Row: {
          created_at: string | null;
          id: string;
          input_tokens: number | null;
          model_name: string;
          model_tier: string;
          output_count: number;
          output_tokens: number | null;
          project_id: number | null;
          subscription_id: string | null;
          total_tokens: number | null;
          workbench_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_name: string;
          model_tier: string;
          output_count?: number;
          output_tokens?: number | null;
          project_id?: number | null;
          subscription_id?: string | null;
          total_tokens?: number | null;
          workbench_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_name?: string;
          model_tier?: string;
          output_count?: number;
          output_tokens?: number | null;
          project_id?: number | null;
          subscription_id?: string | null;
          total_tokens?: number | null;
          workbench_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_workbench_id_fkey";
            columns: ["workbench_id"];
            isOneToOne: false;
            referencedRelation: "workbenches";
            referencedColumns: ["id"];
          },
        ];
      };
      user_workbenches: {
        Row: {
          created_at: string | null;
          id: string;
          role: string;
          user_id: string | null;
          workbench_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role?: string;
          user_id?: string | null;
          workbench_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: string;
          user_id?: string | null;
          workbench_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_workbenches_workbench_id_fkey";
            columns: ["workbench_id"];
            isOneToOne: false;
            referencedRelation: "workbenches";
            referencedColumns: ["id"];
          },
        ];
      };
      workbenches: {
        Row: {
          created_at: string | null;
          encrypted_api_keys: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          encrypted_api_keys?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          encrypted_api_keys?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_next_period_end: { Args: never; Returns: string };
      check_quota_available: {
        Args: { count?: number; model_tier: string; workbench_uuid: string };
        Returns: boolean;
      };
      check_workbench_api_keys: {
        Args: { workbench_uuid: string };
        Returns: Json;
      };
      cleanup_old_audit_logs: { Args: never; Returns: undefined };
      get_workbench_api_keys: {
        Args: { workbench_uuid: string };
        Returns: Json;
      };
      get_workbench_subscription: {
        Args: { workbench_uuid: string };
        Returns: {
          allow_premium_models: boolean;
          current_period_end: string;
          id: string;
          plan_id: string;
          plan_name: string;
          premium_outputs_limit: number;
          premium_outputs_used: number;
          standard_outputs_limit: number;
          standard_outputs_used: number;
          status: string;
        }[];
      };
      increment_usage: {
        Args: {
          count?: number;
          input_tokens?: number;
          model_name: string;
          model_tier: string;
          output_tokens?: number;
          project_id?: number;
          workbench_uuid: string;
        };
        Returns: undefined;
      };
      reset_all_monthly_usage: { Args: never; Returns: undefined };
      reset_monthly_usage: {
        Args: { workbench_uuid: string };
        Returns: undefined;
      };
      set_workbench_api_keys: {
        Args: { api_keys_json: Json; workbench_uuid: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
