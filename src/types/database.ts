export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          status: string | null
          is_online: boolean
          last_seen: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          status?: string | null
          is_online?: boolean
          last_seen?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          status?: string | null
          is_online?: boolean
          last_seen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          is_group: boolean
          name: string | null
          avatar_url: string | null
          created_by: string
          last_message_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          is_group?: boolean
          name?: string | null
          avatar_url?: string | null
          created_by: string
          last_message_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          is_group?: boolean
          name?: string | null
          avatar_url?: string | null
          created_by?: string
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string | null
          role: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_id: string
          content: string | null
          message_type: string
          media_url: string | null
          reply_to: string | null
          is_deleted: boolean
          is_edited: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          message_type?: string
          media_url?: string | null
          reply_to?: string | null
          is_deleted?: boolean
          is_edited?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          message_type?: string
          media_url?: string | null
          reply_to?: string | null
          is_deleted?: boolean
          is_edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_reply_to_fkey'
            columns: ['reply_to']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types for table rows
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// Insert types
export type NewProfile = Database['public']['Tables']['profiles']['Insert']
export type NewConversation = Database['public']['Tables']['conversations']['Insert']
export type NewConversationParticipant = Database['public']['Tables']['conversation_participants']['Insert']
export type NewMessage = Database['public']['Tables']['messages']['Insert']

// Update types
export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateConversation = Database['public']['Tables']['conversations']['Update']
export type UpdateMessage = Database['public']['Tables']['messages']['Update']
