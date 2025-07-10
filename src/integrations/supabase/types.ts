export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      authors: {
        Row: {
          bio: string | null
          books_count: number | null
          created_at: string | null
          followers_count: number | null
          genres: string[] | null
          id: string
          location: string | null
          name: string
          profile_image_url: string | null
          rating: number | null
          social_links: Json | null
          upcoming_events: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          books_count?: number | null
          created_at?: string | null
          followers_count?: number | null
          genres?: string[] | null
          id?: string
          location?: string | null
          name: string
          profile_image_url?: string | null
          rating?: number | null
          social_links?: Json | null
          upcoming_events?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          books_count?: number | null
          created_at?: string | null
          followers_count?: number | null
          genres?: string[] | null
          id?: string
          location?: string | null
          name?: string
          profile_image_url?: string | null
          rating?: number | null
          social_links?: Json | null
          upcoming_events?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      book_audio_summaries: {
        Row: {
          audio_url: string
          book_id: string | null
          created_at: string
          duration_seconds: number
          id: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          book_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          book_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_audio_summaries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_summaries: {
        Row: {
          book_id: string | null
          chapter_number: number | null
          content: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          page_end: number | null
          page_start: number | null
          summary_type: string
          updated_at: string | null
        }
        Insert: {
          book_id?: string | null
          chapter_number?: number | null
          content: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          page_end?: number | null
          page_start?: number | null
          summary_type?: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string | null
          chapter_number?: number | null
          content?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          page_end?: number | null
          page_start?: number | null
          summary_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_summaries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_library"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      books_library: {
        Row: {
          author: string | null
          author_bio: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          isbn: string | null
          language: string | null
          pages: number | null
          pdf_url: string | null
          publication_year: number | null
          title: string
        }
        Insert: {
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          publication_year?: number | null
          title: string
        }
        Update: {
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          publication_year?: number | null
          title?: string
        }
        Relationships: []
      }
      books_test: {
        Row: {
          author: string | null
          author_bio: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          isbn: string | null
          language: string | null
          pages: number | null
          pdf_url: string | null
          publication_year: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          publication_year?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          publication_year?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          comment_text: string
          content_id: string | null
          created_at: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          content_id?: string | null
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          content_id?: string | null
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "user_generated_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_feedback: {
        Row: {
          comment: string | null
          content_id: string | null
          created_at: string
          feedback_type: string
          id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          content_id?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          content_id?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_feedback_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "user_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_votes: {
        Row: {
          content_id: string | null
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_votes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "user_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      detailed_reading_progress: {
        Row: {
          book_id: string | null
          chapter_number: number
          completed_at: string | null
          completion_percentage: number
          created_at: string
          id: string
          pages_read: number
          time_spent_minutes: number
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          chapter_number: number
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          id?: string
          pages_read?: number
          time_spent_minutes?: number
          total_pages: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          chapter_number?: number
          completed_at?: string | null
          completion_percentage?: number
          created_at?: string
          id?: string
          pages_read?: number
          time_spent_minutes?: number
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detailed_reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_training_data: {
        Row: {
          completion: string
          created_at: string
          id: string
          prompt: string
          user_id: string | null
        }
        Insert: {
          completion: string
          created_at?: string
          id?: string
          prompt: string
          user_id?: string | null
        }
        Update: {
          completion?: string
          created_at?: string
          id?: string
          prompt?: string
          user_id?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string
          user_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string
          user_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
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
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          profile_photo_url: string | null
          stories_read_count: number | null
          stories_written_count: number | null
          tags_used: Json | null
          updated_at: string | null
          username: string | null
          writing_frequency: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          profile_photo_url?: string | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          tags_used?: Json | null
          updated_at?: string | null
          username?: string | null
          writing_frequency?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          profile_photo_url?: string | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          tags_used?: Json | null
          updated_at?: string | null
          username?: string | null
          writing_frequency?: string | null
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_title: string
          cover_image_url: string | null
          current_page: number
          id: number
          total_pages: number
          user_id: string | null
        }
        Insert: {
          book_title: string
          cover_image_url?: string | null
          current_page?: number
          id?: number
          total_pages: number
          user_id?: string | null
        }
        Update: {
          book_title?: string
          cover_image_url?: string | null
          current_page?: number
          id?: number
          total_pages?: number
          user_id?: string | null
        }
        Relationships: []
      }
      reading_summaries: {
        Row: {
          book_id: string | null
          chapter_number: number
          created_at: string
          id: string
          summary_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          chapter_number: number
          created_at?: string
          id?: string
          summary_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          chapter_number?: number
          created_at?: string
          id?: string
          summary_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_summaries_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string
          description: string | null
          format: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_books: {
        Row: {
          added_at: string
          book_id: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string
          book_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string
          book_id?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookshelf: {
        Row: {
          added_at: string | null
          book_id: string
          id: string
          notes: string | null
          rating: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          book_id: string
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          book_id?: string
          id?: string
          notes?: string | null
          rating?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookshelf_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_library"
            referencedColumns: ["id"]
          },
        ]
      }
      user_generated_content: {
        Row: {
          book_id: string | null
          content: string
          content_type: string
          created_at: string
          id: string
          is_approved: boolean
          is_published: boolean
          original_chapter_number: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          content: string
          content_type: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_published?: boolean
          original_chapter_number?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_published?: boolean
          original_chapter_number?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_generated_content_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personal_library: {
        Row: {
          added_at: string | null
          book_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          book_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          book_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_personal_library_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_library"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          bio: string | null
          deleted: boolean | null
          dob: string | null
          email: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          joined_at: string | null
          last_updated: string | null
          life_tags: string[] | null
          location: string | null
          name: string | null
          profile_picture_url: string | null
          social_links: Json | null
          stories_read_count: number | null
          stories_written_count: number | null
          username: string | null
          writing_frequency: string | null
        }
        Insert: {
          bio?: string | null
          deleted?: boolean | null
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          joined_at?: string | null
          last_updated?: string | null
          life_tags?: string[] | null
          location?: string | null
          name?: string | null
          profile_picture_url?: string | null
          social_links?: Json | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          username?: string | null
          writing_frequency?: string | null
        }
        Update: {
          bio?: string | null
          deleted?: boolean | null
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          joined_at?: string | null
          last_updated?: string | null
          life_tags?: string[] | null
          location?: string | null
          name?: string | null
          profile_picture_url?: string | null
          social_links?: Json | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          username?: string | null
          writing_frequency?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_unused_books: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_authors_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          bio: string
          profile_image_url: string
          location: string
          website_url: string
          social_links: Json
          genres: string[]
          books_count: number
          followers_count: number
          rating: number
          upcoming_events: number
          created_at: string
          updated_at: string
        }[]
      }
      get_user_bookshelf_stats: {
        Args: { user_uuid: string }
        Returns: {
          total_books: number
          reading_books: number
          completed_books: number
          want_to_read_books: number
        }[]
      }
      update_author_book_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      gender_type: "male" | "female" | "other"
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
      gender_type: ["male", "female", "other"],
    },
  },
} as const
