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
          amazon_url: string | null
          author: string | null
          author_bio: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          google_books_url: string | null
          id: string
          internet_archive_url: string | null
          isbn: string | null
          language: string | null
          pages: number | null
          pdf_url: string | null
          price: number | null
          publication_year: number | null
          title: string
        }
        Insert: {
          amazon_url?: string | null
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          google_books_url?: string | null
          id?: string
          internet_archive_url?: string | null
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          price?: number | null
          publication_year?: number | null
          title: string
        }
        Update: {
          amazon_url?: string | null
          author?: string | null
          author_bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          google_books_url?: string | null
          id?: string
          internet_archive_url?: string | null
          isbn?: string | null
          language?: string | null
          pages?: number | null
          pdf_url?: string | null
          price?: number | null
          publication_year?: number | null
          title?: string
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
      [_ in never]: never
    }
    Enums: {
      gender_type: "male" | "female" | "other"
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
    Enums: {
      gender_type: ["male", "female", "other"],
    },
  },
} as const
