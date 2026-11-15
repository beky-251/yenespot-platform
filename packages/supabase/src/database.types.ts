export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      business_categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean;
          name: string;
          name_am: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          name_am?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          name_am?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_hours: {
        Row: {
          business_id: string;
          closes_at: string | null;
          created_at: string;
          day_of_week: number;
          id: string;
          is_closed: boolean;
          opens_at: string | null;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          closes_at?: string | null;
          created_at?: string;
          day_of_week: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          closes_at?: string | null;
          created_at?: string;
          day_of_week?: number;
          id?: string;
          is_closed?: boolean;
          opens_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_owner_applications: {
        Row: {
          address: string | null;
          business_id: string | null;
          business_name: string;
          category_id: string;
          city: string;
          created_at: string;
          description: string | null;
          email: string | null;
          id: string;
          neighborhood: string | null;
          phone: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          business_id?: string | null;
          business_name: string;
          category_id: string;
          city?: string;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          neighborhood?: string | null;
          phone: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          business_id?: string | null;
          business_name?: string;
          category_id?: string;
          city?: string;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          neighborhood?: string | null;
          phone?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_owner_applications_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_owner_applications_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "business_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      business_photos: {
        Row: {
          business_id: string;
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string;
          is_cover: boolean;
          sort_order: number;
          storage_path: string | null;
        };
        Insert: {
          business_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          is_cover?: boolean;
          sort_order?: number;
          storage_path?: string | null;
        };
        Update: {
          business_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          is_cover?: boolean;
          sort_order?: number;
          storage_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_photos_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_services: {
        Row: {
          business_id: string;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          is_available: boolean;
          name: string;
          price: number | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name: string;
          price?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name?: string;
          price?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string | null;
          approved_at: string | null;
          approved_by: string | null;
          average_rating: number;
          category_id: string | null;
          city: string;
          created_at: string;
          description: string | null;
          email: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          neighborhood: string | null;
          owner_id: string;
          phone: string | null;
          review_count: number;
          slug: string;
          status: string;
          updated_at: string;
          verified: boolean;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          average_rating?: number;
          category_id?: string | null;
          city?: string;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          neighborhood?: string | null;
          owner_id: string;
          phone?: string | null;
          review_count?: number;
          slug: string;
          status?: string;
          updated_at?: string;
          verified?: boolean;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          average_rating?: number;
          category_id?: string | null;
          city?: string;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          neighborhood?: string | null;
          owner_id?: string;
          phone?: string | null;
          review_count?: number;
          slug?: string;
          status?: string;
          updated_at?: string;
          verified?: boolean;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "business_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_language: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_language?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          preferred_language?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          read_at: string | null;
          review_id: string | null;
          title: string;
          type: "review_received" | "review_response_received";
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          read_at?: string | null;
          review_id?: string | null;
          title: string;
          type: "review_received" | "review_response_received";
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          read_at?: string | null;
          review_id?: string | null;
          title?: string;
          type?: "review_received" | "review_response_received";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      review_responses: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          response: string;
          review_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          response: string;
          review_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          response?: string;
          review_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_responses_review_id_business_id_fkey";
            columns: ["review_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };      reviews: {
        Row: {
          business_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          details: Json;
          entity_id: string | null;
          entity_type: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          details?: Json;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_public_reviewers: {
        Args: { p_business_id: string };
        Returns: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }[];
      };
      approve_business_owner_application: {
        Args: { p_application_id: string };
        Returns: string;
      };
      manage_administrator_role: {
        Args: { target_user_id: string; new_role: string };
        Returns: Json;
      };
      has_role: { Args: { required_role: string }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      owns_business: { Args: { target_business_id: string }; Returns: boolean };
      reject_business_owner_application: {
        Args: { p_application_id: string; p_reason: string };
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
