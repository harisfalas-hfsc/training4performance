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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assistant_credits: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_memory: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_usage: {
        Row: {
          cost_eur: number | null
          created_at: string
          id: string
          request_tokens: number | null
          response_tokens: number | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          cost_eur?: number | null
          created_at?: string
          id?: string
          request_tokens?: number | null
          response_tokens?: number | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          cost_eur?: number | null
          created_at?: string
          id?: string
          request_tokens?: number | null
          response_tokens?: number | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_usage_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      player_access: {
        Row: {
          active: boolean
          coach_id: string
          code: string
          created_at: string
          email: string | null
          id: string
          last_login_at: string | null
          password_hash: string | null
          password_salt: string | null
          player_id: string
          player_name: string
          reports: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          coach_id: string
          code: string
          created_at?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          password_hash?: string | null
          password_salt?: string | null
          player_id: string
          player_name: string
          reports?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          coach_id?: string
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          password_hash?: string | null
          password_salt?: string | null
          player_id?: string
          player_name?: string
          reports?: Json
          updated_at?: string
        }
        Relationships: []
      }
      player_wellness: {
        Row: {
          coach_id: string
          created_at: string
          entry_date: string
          fatigue: number
          hydration: number
          id: string
          mood: number
          note: string | null
          player_id: string
          readiness: number
          sleep: number
          sleep_hours: number | null
          soreness: number
          source: string
          stress: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          entry_date?: string
          fatigue?: number
          hydration?: number
          id?: string
          mood?: number
          note?: string | null
          player_id: string
          readiness?: number
          sleep?: number
          sleep_hours?: number | null
          soreness?: number
          source?: string
          stress?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          entry_date?: string
          fatigue?: number
          hydration?: number
          id?: string
          mood?: number
          note?: string | null
          player_id?: string
          readiness?: number
          sleep?: number
          sleep_hours?: number | null
          soreness?: number
          source?: string
          stress?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          club_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          club_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          club_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_teams: {
        Row: {
          created_at: string
          id: string
          name: string
          price_eur: number
          subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price_eur?: number
          subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price_eur?: number
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_teams_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          admin_note: string | null
          complimentary: boolean
          created_at: string
          id: string
          price_eur: number
          season_end: string
          season_start: string
          status: string
          team_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          complimentary?: boolean
          created_at?: string
          id?: string
          price_eur?: number
          season_end?: string
          season_start?: string
          status?: string
          team_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          complimentary?: boolean
          created_at?: string
          id?: string
          price_eur?: number
          season_end?: string
          season_start?: string
          status?: string
          team_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_snapshots: {
        Row: {
          club_name: string | null
          gps_rows: number
          player_names: string[]
          players: number
          sessions: number
          team_name: string | null
          tests: number
          updated_at: string
          user_id: string
        }
        Insert: {
          club_name?: string | null
          gps_rows?: number
          player_names?: string[]
          players?: number
          sessions?: number
          team_name?: string | null
          tests?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          club_name?: string | null
          gps_rows?: number
          player_names?: string[]
          players?: number
          sessions?: number
          team_name?: string | null
          tests?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_data: {
        Row: {
          created_at: string
          gps_blocks: Json
          gps_history: Json
          manual_tests: Json
          medical_events: Json
          players: Json
          rpe_entries: Json
          sessions: Json
          team: Json
          test_records: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gps_blocks?: Json
          gps_history?: Json
          manual_tests?: Json
          medical_events?: Json
          players?: Json
          rpe_entries?: Json
          sessions?: Json
          team?: Json
          test_records?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gps_blocks?: Json
          gps_history?: Json
          manual_tests?: Json
          medical_events?: Json
          players?: Json
          rpe_entries?: Json
          sessions?: Json
          team?: Json
          test_records?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_workspace_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff"
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
      app_role: ["admin", "manager", "staff"],
    },
  },
} as const
