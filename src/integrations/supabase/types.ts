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
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          link_label: string | null
          link_target: string | null
          link_url: string | null
          segment_exclude_product_id: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          video_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_target?: string | null
          link_url?: string | null
          segment_exclude_product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          video_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_target?: string | null
          link_url?: string | null
          segment_exclude_product_id?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_segment_exclude_product_id_fkey"
            columns: ["segment_exclude_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
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
          auto_translate: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          auto_translate?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          auto_translate?: boolean
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
          is_private: boolean
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
          is_private?: boolean
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
          is_private?: boolean
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
      diagnostic_answers: {
        Row: {
          answer_value: Json
          created_at: string | null
          diagnostic_id: string | null
          id: string
          question_id: string | null
          score_contribution: number | null
        }
        Insert: {
          answer_value: Json
          created_at?: string | null
          diagnostic_id?: string | null
          id?: string
          question_id?: string | null
          score_contribution?: number | null
        }
        Update: {
          answer_value?: Json
          created_at?: string | null
          diagnostic_id?: string | null
          id?: string
          question_id?: string | null
          score_contribution?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_answers_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_questions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          options: Json | null
          question_text: string
          section: string
          sort_order: number | null
          type: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          options?: Json | null
          question_text: string
          section: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          options?: Json | null
          question_text?: string
          section?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      diagnostic_recommendation_rules: {
        Row: {
          condition_field: string
          condition_operator: string
          condition_value: number
          created_at: string | null
          cta_text: string | null
          description: string | null
          id: string
          priority: number | null
          recommended_product_id: string | null
          title: string | null
        }
        Insert: {
          condition_field: string
          condition_operator: string
          condition_value: number
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          priority?: number | null
          recommended_product_id?: string | null
          title?: string | null
        }
        Update: {
          condition_field?: string
          condition_operator?: string
          condition_value?: number
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          id?: string
          priority?: number | null
          recommended_product_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_recommendation_rules_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          results: Json | null
          role_type: string | null
          scores: Json | null
          status: string | null
          tech_knowledge: string | null
          user_id: string | null
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
          results?: Json | null
          role_type?: string | null
          scores?: Json | null
          status?: string | null
          tech_knowledge?: string | null
          user_id?: string | null
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
          results?: Json | null
          role_type?: string | null
          scores?: Json | null
          status?: string | null
          tech_knowledge?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_comments: {
        Row: {
          comment_type: string
          content: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
          video_timestamp_seconds: number | null
        }
        Insert: {
          comment_type?: string
          content: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
          video_timestamp_seconds?: number | null
        }
        Update: {
          comment_type?: string
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
          video_timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
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
      lesson_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_link_packages: {
        Row: {
          created_at: string
          id: string
          menu_link_id: string
          package_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_link_id: string
          package_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_link_id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_link_packages_menu_link_id_fkey"
            columns: ["menu_link_id"]
            isOneToOne: false
            referencedRelation: "menu_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_link_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_link_products: {
        Row: {
          created_at: string
          id: string
          menu_link_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_link_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_link_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_link_products_menu_link_id_fkey"
            columns: ["menu_link_id"]
            isOneToOne: false
            referencedRelation: "menu_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_link_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_links: {
        Row: {
          active: boolean
          auto_translate: boolean
          created_at: string
          icon: string
          id: string
          open_mode: string
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          auto_translate?: boolean
          created_at?: string
          icon?: string
          id?: string
          open_mode?: string
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          auto_translate?: boolean
          created_at?: string
          icon?: string
          id?: string
          open_mode?: string
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
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
          duration_days: number | null
          duration_type: string
          hotmart_link_active: boolean
          hotmart_url: string | null
          id: string
          is_default: boolean
          name: string
          package_id: string | null
          payment_link_active: boolean
          periodicity: string | null
          price: number
          product_id: string | null
          stripe_link_active: boolean
          stripe_price_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          duration_days?: number | null
          duration_type?: string
          hotmart_link_active?: boolean
          hotmart_url?: string | null
          id?: string
          is_default?: boolean
          name?: string
          package_id?: string | null
          payment_link_active?: boolean
          periodicity?: string | null
          price?: number
          product_id?: string | null
          stripe_link_active?: boolean
          stripe_price_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          duration_days?: number | null
          duration_type?: string
          hotmart_link_active?: boolean
          hotmart_url?: string | null
          id?: string
          is_default?: boolean
          name?: string
          package_id?: string | null
          payment_link_active?: boolean
          periodicity?: string | null
          price?: number
          product_id?: string | null
          stripe_link_active?: boolean
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
      package_product_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          package_id: string
          sort_order: number
          thumbnail_url: string | null
          thumbnail_vertical_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          package_id: string
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          package_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_product_groups_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_products: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          package_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          package_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          package_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_products_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "package_product_groups"
            referencedColumns: ["id"]
          },
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
          duration_days: number | null
          features: string[] | null
          id: string
          is_trail: boolean
          name: string
          payment_type: string
          show_in_showcase: boolean
          thumbnail_url: string | null
          thumbnail_vertical_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: string[] | null
          id?: string
          is_trail?: boolean
          name: string
          payment_type?: string
          show_in_showcase?: boolean
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: string[] | null
          id?: string
          is_trail?: boolean
          name?: string
          payment_type?: string
          show_in_showcase?: boolean
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
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
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sales_pages: {
        Row: {
          active: boolean
          after_points: Json | null
          anchor_comparison_text: string | null
          anchor_items: Json | null
          anchor_total_value: string | null
          before_points: Json | null
          bonuses: Json | null
          core_benefits: Json | null
          countdown_enabled: boolean | null
          created_at: string
          final_cta_button_text: string | null
          final_cta_link: string | null
          final_cta_text: string | null
          final_cta_title: string | null
          guarantee_days: number | null
          guarantee_description: string | null
          guarantee_title: string | null
          guarantee_type: string | null
          hero_background_image: string | null
          hero_badge_text: string | null
          hero_context_line: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_headline: string | null
          hero_social_proof_micro: string | null
          hero_subheadline: string | null
          hero_video_url: string | null
          id: string
          modules: Json | null
          objections: Json | null
          price_currency: string | null
          price_display: string | null
          price_highlight_text: string | null
          price_installments: string | null
          price_original: string | null
          price_stripe_link: string | null
          problem_bullet_points: Json | null
          problem_explanation_text: string | null
          problem_explanation_title: string | null
          problem_title: string | null
          product_id: string
          program_access_time: string | null
          program_duration: string | null
          program_format: string | null
          program_name: string | null
          selected_testimonials: Json | null
          slug: string
          social_micro_badge: string | null
          social_micro_number: string | null
          social_micro_text: string | null
          transformation_title: string | null
          updated_at: string
          urgency_date: string | null
          urgency_spots_remaining: number | null
          urgency_text: string | null
          urgency_type: string | null
        }
        Insert: {
          active?: boolean
          after_points?: Json | null
          anchor_comparison_text?: string | null
          anchor_items?: Json | null
          anchor_total_value?: string | null
          before_points?: Json | null
          bonuses?: Json | null
          core_benefits?: Json | null
          countdown_enabled?: boolean | null
          created_at?: string
          final_cta_button_text?: string | null
          final_cta_link?: string | null
          final_cta_text?: string | null
          final_cta_title?: string | null
          guarantee_days?: number | null
          guarantee_description?: string | null
          guarantee_title?: string | null
          guarantee_type?: string | null
          hero_background_image?: string | null
          hero_badge_text?: string | null
          hero_context_line?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_social_proof_micro?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          id?: string
          modules?: Json | null
          objections?: Json | null
          price_currency?: string | null
          price_display?: string | null
          price_highlight_text?: string | null
          price_installments?: string | null
          price_original?: string | null
          price_stripe_link?: string | null
          problem_bullet_points?: Json | null
          problem_explanation_text?: string | null
          problem_explanation_title?: string | null
          problem_title?: string | null
          product_id: string
          program_access_time?: string | null
          program_duration?: string | null
          program_format?: string | null
          program_name?: string | null
          selected_testimonials?: Json | null
          slug: string
          social_micro_badge?: string | null
          social_micro_number?: string | null
          social_micro_text?: string | null
          transformation_title?: string | null
          updated_at?: string
          urgency_date?: string | null
          urgency_spots_remaining?: number | null
          urgency_text?: string | null
          urgency_type?: string | null
        }
        Update: {
          active?: boolean
          after_points?: Json | null
          anchor_comparison_text?: string | null
          anchor_items?: Json | null
          anchor_total_value?: string | null
          before_points?: Json | null
          bonuses?: Json | null
          core_benefits?: Json | null
          countdown_enabled?: boolean | null
          created_at?: string
          final_cta_button_text?: string | null
          final_cta_link?: string | null
          final_cta_text?: string | null
          final_cta_title?: string | null
          guarantee_days?: number | null
          guarantee_description?: string | null
          guarantee_title?: string | null
          guarantee_type?: string | null
          hero_background_image?: string | null
          hero_badge_text?: string | null
          hero_context_line?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_social_proof_micro?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          id?: string
          modules?: Json | null
          objections?: Json | null
          price_currency?: string | null
          price_display?: string | null
          price_highlight_text?: string | null
          price_installments?: string | null
          price_original?: string | null
          price_stripe_link?: string | null
          problem_bullet_points?: Json | null
          problem_explanation_text?: string | null
          problem_explanation_title?: string | null
          problem_title?: string | null
          product_id?: string
          program_access_time?: string | null
          program_duration?: string | null
          program_format?: string | null
          program_name?: string | null
          selected_testimonials?: Json | null
          slug?: string
          social_micro_badge?: string | null
          social_micro_number?: string | null
          social_micro_text?: string | null
          transformation_title?: string | null
          updated_at?: string
          urgency_date?: string | null
          urgency_spots_remaining?: number | null
          urgency_text?: string | null
          urgency_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_pages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          course_id: string | null
          created_at: string
          description: string | null
          features_list: Json | null
          has_content: boolean
          id: string
          name: string
          payment_type: string
          recurring_type: string | null
          saas_url: string | null
          show_on_home: boolean
          sort_order: number
          thumbnail_url: string | null
          thumbnail_vertical_url: string | null
          trial_days: number | null
          trial_enabled: boolean
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          features_list?: Json | null
          has_content?: boolean
          id?: string
          name: string
          payment_type?: string
          recurring_type?: string | null
          saas_url?: string | null
          show_on_home?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          trial_days?: number | null
          trial_enabled?: boolean
          type: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          features_list?: Json | null
          has_content?: boolean
          id?: string
          name?: string
          payment_type?: string
          recurring_type?: string | null
          saas_url?: string | null
          show_on_home?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          thumbnail_vertical_url?: string | null
          trial_days?: number | null
          trial_enabled?: boolean
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
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          level: string
          performed_by: string | null
          performer_email: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          level?: string
          performed_by?: string | null
          performer_email?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          level?: string
          performed_by?: string | null
          performer_email?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          country: string | null
          created_at: string
          description: string | null
          destinations: string[] | null
          id: string
          isp_size: string | null
          person_name: string
          product_ids: string[] | null
          result_text: string | null
          role: string | null
          sort_order: number
          tags: string[] | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          country?: string | null
          created_at?: string
          description?: string | null
          destinations?: string[] | null
          id?: string
          isp_size?: string | null
          person_name: string
          product_ids?: string[] | null
          result_text?: string | null
          role?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          country?: string | null
          created_at?: string
          description?: string | null
          destinations?: string[] | null
          id?: string
          isp_size?: string | null
          person_name?: string
          product_ids?: string[] | null
          result_text?: string | null
          role?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_lesson_access: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_access_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          offer_id: string | null
          package_id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id?: string | null
          package_id: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id?: string | null
          package_id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
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
          expires_at: string | null
          id: string
          offer_id: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          offer_id?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
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
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_event_types: {
        Row: {
          created_at: string
          enabled: boolean
          event_key: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          event_key: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          event_key?: string
          id?: string
          label?: string
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
        | "saas"
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
        "saas",
      ],
    },
  },
} as const
