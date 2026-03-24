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
      message_reactions: {
        Row: {
          id: string
          created_at: string
          message_id: string
          user_id: string
          reaction: string
        }
        Insert: {
          id?: string
          created_at?: string
          message_id: string
          user_id: string
          reaction: string
        }
        Update: {
          id?: string
          created_at?: string
          message_id?: string
          user_id?: string
          reaction?: string
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
      message_status: {
        Row: {
          id: string
          message_id: string
          user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          status?: string
          updated_at?: string
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
      groups: {
        Row: {
          id: string
          conversation_id: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          }
        ]
      }
      group_admins: {
        Row: {
          id: string
          group_id: string
          user_id: string
          added_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          added_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          added_at?: string
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
      contacts: {
        Row: {
          id: string
          user_id: string
          contact_user_id: string
          phone_number: string
          display_name: string | null
          is_blocked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_user_id: string
          phone_number: string
          display_name?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_user_id?: string
          phone_number?: string
          display_name?: string | null
          is_blocked?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contacts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contacts_contact_user_id_fkey'
            columns: ['contact_user_id']
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
  reply_to_message: Message | null
  reactions: MessageReaction[]
}

// API response types
export interface PaginatedMessagesResponse {
  messages: MessageWithSender[]
  next_cursor: string | null
  has_more: boolean
}
