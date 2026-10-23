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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agreements: {
        Row: {
          accepted_at: string | null
          booking_id: string
          created_at: string
          id: string
          listing_id: string
          owner_id: string
          renter_id: string
          shared_at: string | null
          status: string
          terms: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          booking_id: string
          created_at?: string
          id?: string
          listing_id: string
          owner_id: string
          renter_id: string
          shared_at?: string | null
          status?: string
          terms: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          owner_id?: string
          renter_id?: string
          shared_at?: string | null
          status?: string
          terms?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          end_date: string
          id: string
          kind: string
          listing_id: string
          message: string
          owner_id: string | null
          owner_note: string
          phone: string
          renter_id: string
          renter_name: string
          start_date: string
          status: string
          total: number
          units: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          kind?: string
          listing_id: string
          message?: string
          owner_id?: string | null
          owner_note?: string
          phone?: string
          renter_id: string
          renter_name?: string
          start_date: string
          status?: string
          total?: number
          units?: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          kind?: string
          listing_id?: string
          message?: string
          owner_id?: string | null
          owner_note?: string
          phone?: string
          renter_id?: string
          renter_name?: string
          start_date?: string
          status?: string
          total?: number
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          blurb: string
          id: string
          kind: string
          label: string
          sort: number
        }
        Insert: {
          active?: boolean
          blurb?: string
          id: string
          kind: string
          label: string
          sort?: number
        }
        Update: {
          active?: boolean
          blurb?: string
          id?: string
          kind?: string
          label?: string
          sort?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          amenities: string[]
          available: boolean
          bathrooms: number
          bedrooms: number
          category: string
          city: string
          condition: string | null
          contact_phone: string | null
          created_at: string
          deposit: string | null
          description: string
          fuel: string | null
          furnishing: string | null
          id: string
          images: string[]
          kind: string
          make: string | null
          min_term: number
          model: string | null
          neighborhood: string
          owner_id: string | null
          owner_name: string
          owner_verified: boolean
          premium: boolean
          price: number
          price_unit: string
          rejection_reason: string | null
          seats: number | null
          size_sqm: number | null
          status: string
          title: string
          transmission: string | null
          views: number
          with_operator: boolean
          year: number | null
        }
        Insert: {
          amenities?: string[]
          available?: boolean
          bathrooms?: number
          bedrooms?: number
          category: string
          city?: string
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          deposit?: string | null
          description?: string
          fuel?: string | null
          furnishing?: string | null
          id?: string
          images?: string[]
          kind?: string
          make?: string | null
          min_term?: number
          model?: string | null
          neighborhood?: string
          owner_id?: string | null
          owner_name?: string
          owner_verified?: boolean
          premium?: boolean
          price: number
          price_unit?: string
          rejection_reason?: string | null
          seats?: number | null
          size_sqm?: number | null
          status?: string
          title: string
          transmission?: string | null
          views?: number
          with_operator?: boolean
          year?: number | null
        }
        Update: {
          amenities?: string[]
          available?: boolean
          bathrooms?: number
          bedrooms?: number
          category?: string
          city?: string
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          deposit?: string | null
          description?: string
          fuel?: string | null
          furnishing?: string | null
          id?: string
          images?: string[]
          kind?: string
          make?: string | null
          min_term?: number
          model?: string | null
          neighborhood?: string
          owner_id?: string | null
          owner_name?: string
          owner_verified?: boolean
          premium?: boolean
          price?: number
          price_unit?: string
          rejection_reason?: string | null
          seats?: number | null
          size_sqm?: number | null
          status?: string
          title?: string
          transmission?: string | null
          views?: number
          with_operator?: boolean
          year?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          method: string
          owner_id: string
          recorded_by: string | null
          reference: string
          renter_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          method?: string
          owner_id: string
          recorded_by?: string | null
          reference?: string
          renter_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          method?: string
          owner_id?: string
          recorded_by?: string | null
          reference?: string
          renter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          commission_rate: number
          id: number
          premium_fee: number
          support_email: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          id?: number
          premium_fee?: number
          support_email?: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          id?: number
          premium_fee?: number
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          business_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_business: boolean
          phone: string | null
          verification_status: string
          verified: boolean
        }
        Insert: {
          account_status?: string
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_business?: boolean
          phone?: string | null
          verification_status?: string
          verified?: boolean
        }
        Update: {
          account_status?: string
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_business?: boolean
          phone?: string | null
          verification_status?: string
          verified?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string
          booking_id: string | null
          created_at: string
          details: string
          id: string
          kind: string
          listing_id: string | null
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          booking_id?: string | null
          created_at?: string
          details?: string
          id?: string
          kind?: string
          listing_id?: string | null
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          booking_id?: string | null
          created_at?: string
          details?: string
          id?: string
          kind?: string
          listing_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          hidden: boolean
          id: string
          listing_id: string
          rating: number
          reviewer_id: string
          reviewer_name: string
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          hidden?: boolean
          id?: string
          listing_id: string
          rating: number
          reviewer_id: string
          reviewer_name?: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          hidden?: boolean
          id?: string
          listing_id?: string
          rating?: number
          reviewer_id?: string
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          notes: string
          owner_id: string
          plan: string
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string
          owner_id: string
          plan: string
          starts_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          notes?: string
          owner_id?: string
          plan?: string
          starts_at?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      admin_set_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _details: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
      notify: {
        Args: { _body: string; _link: string; _title: string; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "renter"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "owner", "renter"],
    },
  },
} as const
