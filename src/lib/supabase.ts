
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          company: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          role?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          role?: string | null;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      mindmaps: {
        Row: {
          id: string;
          project_id: string;
          data: any;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          data?: any;
          version?: number;
        };
        Update: {
          data?: any;
          version?: number;
          updated_at?: string;
        };
      };
    };
  };
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Mindmap = Database['public']['Tables']['mindmaps']['Row'];
