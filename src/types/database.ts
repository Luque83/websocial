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
          full_name: string | null
          organization: string | null
          role: string | null
          tier: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          organization?: string | null
          role?: string | null
          tier?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          organization?: string | null
          role?: string | null
          tier?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_tools: {
        Row: {
          id: string
          project_id: string
          tool_slug: string
          data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          tool_slug: string
          data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          tool_slug?: string
          data?: Json
          updated_at?: string
        }
      }
    }
  }
}
