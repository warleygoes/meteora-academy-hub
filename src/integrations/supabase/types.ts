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
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean
          module_id: string
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          module_id: string
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean
          module_id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          sort_order: number
          status: string
          thumbnail_url: string | null
          thumbnail_vertical_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          cheapest_plan: number | null
          client_count: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          main_goals: string | null
          main_problems: string | null
          name: string
          network_type: string | null
          phone: string | null
          role_type: string | null
          tech_knowledge: string | null
        }
        Insert: {
          cheapest_plan?: number | null
          client_count?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          main_goals?: string | null
          main_problems?: string | null
          name: string
          network_type?: string | null
          phone?: string | null
          role_type?: string | null
          tech_knowledge?: string | null
        }
        Update: {
          cheapest_plan?: number | null
          client_count?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          main_goals?: string | null
          main_problems?: string | null
          name?: string
          network_type?: string | null
          phone?: string | null
          role_type?: string | null
          tech_knowledge?: string | null
        }
        Relationships: []
      }
      lesson_contents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lesson_id: string
          sort_order: number
          title: string
          type: Database["public"]["Enums"]["lesson_content_type"]
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          sort_order?: number
          title: string
          type: Database["public"]["Enums"]["lesson_content_type"]
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          sort_order?: number
          title?: string
          type?: Database["public"]["Enums"]["lesson_content_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          course_id: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          course_id: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          course_id?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      network_topologies: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          id: string
          is_default: boolean
          name: string
          package_id: string | null
          price: number
          product_id: string | null
          stripe_price_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          name?: string
          package_id?: string | null
          price?: number
          product_id?: string | null
          stripe_price_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          is_default?: boolean
          name?: string
          package_id?: string | null
          price?: number
          product_id?: string | null
          stripe_price_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      package_products: {
        Row: {
          created_at: string
          id: string
          package_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_products_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          name: string
          payment_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name: string
          payment_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name?: string
          payment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          plan_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          plan_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_courses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_meetings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meeting_date: string
          meeting_link: string
          package_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_date: string
          meeting_link: string
          package_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meeting_date?: string
          meeting_link?: string
          package_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_meetings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_services: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_services_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          duration_days: number | null
          features: string[] | null
          id: string
          name: string
          payment_type: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          features?: string[] | null
          id?: string
          name: string
          payment_type?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          features?: string[] | null
          id?: string
          name?: string
          payment_type?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          course_id: string | null
          created_at: string
          description: string | null
          has_content: boolean
          id: string
          name: string
          payment_type: string
          sort_order: number
          thumbnail_url: string | null
          thumbnail_vertical_url: string | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          has_content?: boolean
          id?: string
          name: string
          payment_type?: string
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          has_content?: boolean
          id?: string
          name?: string
          payment_type?: string
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cheapest_plan_usd: number | null
          client_count: string | null
          company_name: string | null
          country: string | null
          cpf: string | null
          created_at: string
          display_name: string | null
          email: string | null
          gender: string | null
          id: string
          main_desires: string | null
          main_problems: string | null
          network_type: string | null
          observations: string | null
          phone: string | null
          role_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cheapest_plan_usd?: number | null
          client_count?: string | null
          company_name?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          main_desires?: string | null
          main_problems?: string | null
          network_type?: string | null
          observations?: string | null
          phone?: string | null
          role_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cheapest_plan_usd?: number | null
          client_count?: string | null
          company_name?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          main_desires?: string | null
          main_problems?: string | null
          network_type?: string | null
          observations?: string | null
          phone?: string | null
          role_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          payment_type: string
          price: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          payment_type?: string
          price?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          payment_type?: string
          price?: number
          title?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      lesson_content_type: "video" | "text" | "image" | "audio" | "link" | "pdf"
      product_type:
        | "course"
        | "service"
        | "consultation"
        | "implementation"
        | "virtual_event"
        | "in_person_event"
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
      app_role: ["admin", "moderator", "user"],
      lesson_content_type: ["video", "text", "image", "audio", "link", "pdf"],
      product_type: [
        "course",
        "service",
        "consultation",
        "implementation",
        "virtual_event",
        "in_person_event",
      ],
    },
  },
} as const
