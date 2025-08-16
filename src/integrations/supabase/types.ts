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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      author_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      author_events: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string
          event_url: string | null
          id: string
          image_url: string | null
          is_published: boolean
          location: string | null
          max_attendees: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      author_followers: {
        Row: {
          author_id: string
          followed_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          followed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          followed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_followers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      author_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "author_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "author_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      author_post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "author_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      author_posts: {
        Row: {
          allow_comments: boolean
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          post_type: string
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          allow_comments?: boolean
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          post_type?: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          allow_comments?: boolean
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          post_type?: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "author_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      author_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          author_id: string
          created_at: string
          id: string
          is_answered: boolean
          is_published: boolean
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          author_id: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_published?: boolean
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          author_id?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_published?: boolean
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          verification_type: string | null
          verified: boolean
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
          verification_type?: string | null
          verified?: boolean
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
          verification_type?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
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
      book_ratings: {
        Row: {
          book_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      book_ratings_agg: {
        Row: {
          avg_rating: number
          book_id: string
          rating_count: number
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          book_id: string
          rating_count?: number
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          book_id?: string
          rating_count?: number
          updated_at?: string
        }
        Relationships: []
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
          author_id: string | null
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
          author_id?: string | null
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
          author_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "books_library_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
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
      chat_participants: {
        Row: {
          chat_room_id: string
          id: string
          is_admin: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          name: string | null
          photo_url: string | null
          type: Database["public"]["Enums"]["chat_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          name?: string | null
          photo_url?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          name?: string | null
          photo_url?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
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
      discovered_friends: {
        Row: {
          common_interests: string[] | null
          discovered_at: string | null
          id: string
          is_invited: boolean | null
          mutual_connections: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_friend_avatar: string | null
          platform_friend_id: string
          platform_friend_name: string | null
          user_id: string
        }
        Insert: {
          common_interests?: string[] | null
          discovered_at?: string | null
          id?: string
          is_invited?: boolean | null
          mutual_connections?: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_friend_avatar?: string | null
          platform_friend_id: string
          platform_friend_name?: string | null
          user_id: string
        }
        Update: {
          common_interests?: string[] | null
          discovered_at?: string | null
          id?: string
          is_invited?: boolean | null
          mutual_connections?: number | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_friend_avatar?: string | null
          platform_friend_id?: string
          platform_friend_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
        }
        Relationships: []
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
      group_chat_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_encrypted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_encrypted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          encrypted_content: string | null
          group_id: string | null
          id: string
          message_type: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          encrypted_content?: string | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          encrypted_content?: string | null
          group_id?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_encrypted: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_room_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_room_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          user_id: string
          verification_code: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          user_id: string
          verification_code: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          user_id?: string
          verification_code?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          content: string
          created_at: string | null
          encrypted_content: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          encrypted_content?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          encrypted_content?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          last_seen: string | null
          location_lat: number | null
          location_lng: number | null
          location_sharing: boolean | null
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
          last_seen?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_sharing?: boolean | null
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
          last_seen?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_sharing?: boolean | null
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
      readers: {
        Row: {
          book: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          book: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          book?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          updated_at?: string
          user_id?: string | null
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
      social_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          id: string
          last_synced_at: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id: string
          platform_username: string | null
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id: string
          platform_username?: string | null
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_user_id?: string
          platform_username?: string | null
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_avatars: {
        Row: {
          avatar_img_url: string | null
          avatar_json: Json | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_img_url?: string | null
          avatar_json?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_img_url?: string | null
          avatar_json?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
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
      user_books_location: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_bookshelf: {
        Row: {
          added_at: string | null
          book_id: string
          id: string
          location_sharing: boolean | null
          notes: string | null
          rating: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          book_id: string
          id?: string
          location_sharing?: boolean | null
          notes?: string | null
          rating?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          book_id?: string
          id?: string
          location_sharing?: boolean | null
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
      user_locations: {
        Row: {
          id: string
          is_active: boolean | null
          last_updated: string | null
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: []
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
          allow_whatsapp_discovery: boolean | null
          bio: string | null
          deleted: boolean | null
          dob: string | null
          email: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          hide_phone_number: boolean | null
          id: string
          joined_at: string | null
          last_updated: string | null
          life_tags: string[] | null
          location: string | null
          name: string | null
          phone_number: string | null
          phone_verification_code: string | null
          phone_verification_expires_at: string | null
          phone_verified: boolean | null
          profile_picture_url: string | null
          social_links: Json | null
          stories_read_count: number | null
          stories_written_count: number | null
          username: string | null
          whatsapp_invite_message: string | null
          writing_frequency: string | null
        }
        Insert: {
          allow_whatsapp_discovery?: boolean | null
          bio?: string | null
          deleted?: boolean | null
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hide_phone_number?: boolean | null
          id?: string
          joined_at?: string | null
          last_updated?: string | null
          life_tags?: string[] | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verified?: boolean | null
          profile_picture_url?: string | null
          social_links?: Json | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          username?: string | null
          whatsapp_invite_message?: string | null
          writing_frequency?: string | null
        }
        Update: {
          allow_whatsapp_discovery?: boolean | null
          bio?: string | null
          deleted?: boolean | null
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hide_phone_number?: boolean | null
          id?: string
          joined_at?: string | null
          last_updated?: string | null
          life_tags?: string[] | null
          location?: string | null
          name?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verification_expires_at?: string | null
          phone_verified?: boolean | null
          profile_picture_url?: string | null
          social_links?: Json | null
          stories_read_count?: number | null
          stories_written_count?: number | null
          username?: string | null
          whatsapp_invite_message?: string | null
          writing_frequency?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      website_visits: {
        Row: {
          country_code: string | null
          id: number
          ip_address: string | null
          page_url: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          country_code?: string | null
          id?: number
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          country_code?: string | null
          id?: number
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          contact_name: string | null
          contact_phone: string
          created_at: string | null
          id: string
          is_on_platform: boolean | null
          last_synced_at: string | null
          platform_user_id: string | null
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone: string
          created_at?: string | null
          id?: string
          is_on_platform?: boolean | null
          last_synced_at?: string | null
          platform_user_id?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string
          created_at?: string | null
          id?: string
          is_on_platform?: boolean | null
          last_synced_at?: string | null
          platform_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_invitations: {
        Row: {
          clicked: boolean | null
          clicked_at: string | null
          id: string
          invitation_message: string | null
          recipient_name: string | null
          recipient_phone: string
          registered: boolean | null
          registered_at: string | null
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          clicked?: boolean | null
          clicked_at?: string | null
          id?: string
          invitation_message?: string | null
          recipient_name?: string | null
          recipient_phone: string
          registered?: boolean | null
          registered_at?: string | null
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          clicked?: boolean | null
          clicked_at?: string | null
          id?: string
          invitation_message?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          registered?: boolean | null
          registered_at?: string | null
          sender_id?: string
          sent_at?: string | null
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
          bio: string
          books_count: number
          created_at: string
          followers_count: number
          genres: string[]
          id: string
          location: string
          name: string
          profile_image_url: string
          rating: number
          social_links: Json
          upcoming_events: number
          updated_at: string
          website_url: string
        }[]
      }
      get_authors_with_books: {
        Args: Record<PropertyKey, never>
        Returns: {
          actual_books_count: number
          bio: string
          books_count: number
          created_at: string
          followers_count: number
          genres: string[]
          id: string
          location: string
          name: string
          profile_image_url: string
          rating: number
          social_links: Json
          upcoming_events: number
          updated_at: string
          website_url: string
        }[]
      }
      get_contact_messages_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }[]
      }
      get_friend_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_name: string
          id: string
          location_lat: number
          location_lng: number
        }[]
      }
      get_public_profiles_for_search: {
        Args: { search_term?: string }
        Returns: {
          bio: string
          full_name: string
          id: string
          profile_photo_url: string
          username: string
        }[]
      }
      get_user_bookshelf_stats: {
        Args: { user_uuid: string }
        Returns: {
          completed_books: number
          reading_books: number
          total_books: number
          want_to_read_books: number
        }[]
      }
      get_visit_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_visits: number
          unique_countries: number
          visits_this_week: number
          visits_today: number
        }[]
      }
      get_website_visit_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_books_to_authors: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      normalize_name: {
        Args: { name: string }
        Returns: string
      }
      notify_author_followers: {
        Args: {
          author_uuid: string
          notification_message: string
          notification_title: string
          notification_type: string
        }
        Returns: undefined
      }
      record_website_visit: {
        Args:
          | {
              country_code?: string
              ip_addr?: unknown
              page?: string
              user_agent_string?: string
            }
          | { ip_addr?: string; page?: string; user_agent_string?: string }
        Returns: undefined
      }
      refresh_book_ratings_agg: {
        Args: { target_book: string }
        Returns: undefined
      }
      update_author_book_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      chat_type: "individual" | "group"
      friendship_status: "pending" | "accepted" | "blocked"
      gender_type: "male" | "female" | "other"
      message_type: "text" | "image" | "file" | "emoji"
      social_platform:
        | "facebook"
        | "instagram"
        | "snapchat"
        | "telegram"
        | "whatsapp"
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
      chat_type: ["individual", "group"],
      friendship_status: ["pending", "accepted", "blocked"],
      gender_type: ["male", "female", "other"],
      message_type: ["text", "image", "file", "emoji"],
      social_platform: [
        "facebook",
        "instagram",
        "snapchat",
        "telegram",
        "whatsapp",
      ],
    },
  },
} as const
