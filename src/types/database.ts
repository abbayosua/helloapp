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
          phone: string | null
          display_name: string | null
          avatar_url: string | null
          about: string
          status: string
          last_seen: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          display_name?: string | null
          avatar_url?: string | null
          about?: string
          status?: string
          last_seen?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          display_name?: string | null
          avatar_url?: string | null
          about?: string
          status?: string
          last_seen?: string | null
          created_at?: string
          updated_at?: string
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
          type: string  // 'direct' or 'group'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: string  // 'direct' or 'group'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
          last_read_at: string | null
          muted: boolean
          pinned: boolean
          archived: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          archived?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          archived?: boolean
          joined_at?: string
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
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          created_by: string | null
          invite_link: string | null
          only_admins_send: boolean
          created_at: string
        }
        Insert: {
          id: string  // Same as conversation id
          name: string
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          invite_link?: string | null
          only_admins_send?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          created_by?: string | null
          invite_link?: string | null
          only_admins_send?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          }
        ]
      }
      group_admins: {
        Row: {
          group_id: string
          user_id: string
          role: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_admins_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_admins_user_id_fkey'
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
          conversation_id: string
          sender_id: string | null
          content: string | null
          message_type: string
          media_url: string | null
          media_metadata: Json | null
          reply_to: string | null
          forwarded: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_for: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id?: string | null
          content?: string | null
          message_type?: string
          media_url?: string | null
          media_metadata?: Json | null
          reply_to?: string | null
          forwarded?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_for?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string | null
          content?: string | null
          message_type?: string
          media_url?: string | null
          media_metadata?: Json | null
          reply_to?: string | null
          forwarded?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_for?: string | null
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
      message_status: {
        Row: {
          id: string
          message_id: string
          user_id: string
          delivered_at: string | null
          read_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          delivered_at?: string | null
          read_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          delivered_at?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'message_status_message_id_fkey'
            columns: ['message_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_status_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          phone: string
          name: string | null
          is_blocked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          phone: string
          name?: string | null
          is_blocked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          phone?: string
          name?: string | null
          is_blocked?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_reactions_message_id_fkey'
            columns: ['message_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
export type MessageReaction = Database['public']['Tables']['message_reactions']['Row']
export type MessageStatus = Database['public']['Tables']['message_status']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupAdmin = Database['public']['Tables']['group_admins']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']

// Insert types
export type NewProfile = Database['public']['Tables']['profiles']['Insert']
export type NewConversation = Database['public']['Tables']['conversations']['Insert']
export type NewConversationParticipant = Database['public']['Tables']['conversation_participants']['Insert']
export type NewMessage = Database['public']['Tables']['messages']['Insert']
export type NewMessageReaction = Database['public']['Tables']['message_reactions']['Insert']
export type NewMessageStatus = Database['public']['Tables']['message_status']['Insert']
export type NewGroup = Database['public']['Tables']['groups']['Insert']
export type NewGroupAdmin = Database['public']['Tables']['group_admins']['Insert']
export type NewContact = Database['public']['Tables']['contacts']['Insert']

// Update types
export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateConversation = Database['public']['Tables']['conversations']['Update']
export type UpdateMessage = Database['public']['Tables']['messages']['Update']
export type UpdateMessageReaction = Database['public']['Tables']['message_reactions']['Update']
export type UpdateMessageStatus = Database['public']['Tables']['message_status']['Update']
export type UpdateGroup = Database['public']['Tables']['groups']['Update']
export type UpdateGroupAdmin = Database['public']['Tables']['group_admins']['Update']
export type UpdateContact = Database['public']['Tables']['contacts']['Update']

// Message with related data for API responses
export interface MessageWithSender extends Message {
  sender: Profile | null
  reactions: MessageReaction[]
}

// API response types
export interface PaginatedMessagesResponse {
  messages: MessageWithSender[]
  next_cursor: string | null
  has_more: boolean
}
