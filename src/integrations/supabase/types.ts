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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      current_affairs: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_demo: boolean
          mains_relevance: string | null
          prelims_relevance: string | null
          published: boolean
          published_date: string
          source_url: string | null
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_demo?: boolean
          mains_relevance?: string | null
          prelims_relevance?: string | null
          published?: boolean
          published_date?: string
          source_url?: string | null
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          mains_relevance?: string | null
          prelims_relevance?: string | null
          published?: boolean
          published_date?: string
          source_url?: string | null
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      current_affairs_topics: {
        Row: {
          created_at: string
          current_affairs_id: string
          id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          current_affairs_id: string
          id?: string
          topic_id: string
        }
        Update: {
          created_at?: string
          current_affairs_id?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_affairs_topics_current_affairs_id_fkey"
            columns: ["current_affairs_id"]
            isOneToOne: false
            referencedRelation: "current_affairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_affairs_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mains_questions: {
        Row: {
          created_at: string
          difficulty: string
          evaluation_criteria: string[]
          id: string
          marks: number
          paper: string
          published: boolean
          question_text: string
          subject_id: string | null
          topic_id: string | null
          updated_at: string
          word_limit: number
        }
        Insert: {
          created_at?: string
          difficulty?: string
          evaluation_criteria?: string[]
          id?: string
          marks?: number
          paper: string
          published?: boolean
          question_text: string
          subject_id?: string | null
          topic_id?: string | null
          updated_at?: string
          word_limit?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          evaluation_criteria?: string[]
          id?: string
          marks?: number
          paper?: string
          published?: boolean
          question_text?: string
          subject_id?: string | null
          topic_id?: string | null
          updated_at?: string
          word_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "mains_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mains_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mains_submissions: {
        Row: {
          ai_feedback: Json | null
          answer_text: string
          id: string
          question_id: string
          submitted_at: string
          time_spent: number
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          ai_feedback?: Json | null
          answer_text: string
          id?: string
          question_id: string
          submitted_at?: string
          time_spent?: number
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          ai_feedback?: Json | null
          answer_text?: string
          id?: string
          question_id?: string
          submitted_at?: string
          time_spent?: number
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "mains_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mains_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal_minutes: number
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          onboarding_completed: boolean
          optional_subject: string | null
          preferred_areas: string[]
          preparation_stage: string | null
          target_attempt: string | null
          target_year: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          onboarding_completed?: boolean
          optional_subject?: string | null
          preferred_areas?: string[]
          preparation_stage?: string | null
          target_attempt?: string | null
          target_year?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal_minutes?: number
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          onboarding_completed?: boolean
          optional_subject?: string | null
          preferred_areas?: string[]
          preparation_stage?: string | null
          target_attempt?: string | null
          target_year?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: string
          created_at: string
          difficulty: string
          explanation: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published: boolean
          question_text: string
          question_type: string
          source: string | null
          source_year: number | null
          subject_id: string | null
          tags: string[]
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          published?: boolean
          question_text: string
          question_type?: string
          source?: string | null
          source_year?: number | null
          subject_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          published?: boolean
          question_text?: string
          question_type?: string
          source?: string | null
          source_year?: number | null
          subject_id?: string | null
          tags?: string[]
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          published: boolean
          published_date: string | null
          resource_type: string
          subject_id: string | null
          thumbnail_url: string | null
          title: string
          topic_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          published_date?: string | null
          resource_type: string
          subject_id?: string | null
          thumbnail_url?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          published?: boolean
          published_date?: string | null
          resource_type?: string
          subject_id?: string | null
          thumbnail_url?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          studied_on: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          studied_on?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          studied_on?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          priority: string
          status: string
          task_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          priority?: string
          status?: string
          task_date?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          priority?: string
          status?: string
          task_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          exam_type: string
          id: string
          name: string
          paper: string | null
          slug: string
          sort_order: number
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          exam_type?: string
          id?: string
          name: string
          paper?: string | null
          slug: string
          sort_order?: number
          stage: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          exam_type?: string
          id?: string
          name?: string
          paper?: string | null
          slug?: string
          sort_order?: number
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      syllabus_topics: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          parent_id: string | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          parent_id?: string | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          parent_id?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string | null
          time_spent: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option?: string | null
          time_spent?: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string | null
          time_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          accuracy: number
          completed_at: string | null
          correct_answers: number
          id: string
          incorrect_answers: number
          score: number
          started_at: string
          test_id: string | null
          time_spent: number
          total_questions: number
          unanswered: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          completed_at?: string | null
          correct_answers?: number
          id?: string
          incorrect_answers?: number
          score?: number
          started_at?: string
          test_id?: string | null
          time_spent?: number
          total_questions?: number
          unanswered?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          completed_at?: string | null
          correct_answers?: number
          id?: string
          incorrect_answers?: number
          score?: number
          started_at?: string
          test_id?: string | null
          time_spent?: number
          total_questions?: number
          unanswered?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          question_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          question_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          published: boolean
          subject_id: string | null
          test_type: string
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          published?: boolean
          subject_id?: string | null
          test_type?: string
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          published?: boolean
          subject_id?: string | null
          test_type?: string
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          completed_at: string | null
          id: string
          progress_percentage: number
          status: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          progress_percentage?: number
          status?: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          progress_percentage?: number
          status?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          sort_order: number
          subject_id: string
          title: string
        }
        Insert: {
          id?: string
          sort_order?: number
          subject_id: string
          title: string
        }
        Update: {
          id?: string
          sort_order?: number
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          duration: number
          id: string
          metadata: Json
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration?: number
          id?: string
          metadata?: Json
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration?: number
          id?: string
          metadata?: Json
          reference_id?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
