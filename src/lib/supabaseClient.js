import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://doukqtogmakrycfozrjp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdWtxdG9nbWFrcnljZm96cmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzQxNjYsImV4cCI6MjA5MzE1MDE2Nn0.UfBWOTp4Uy84YuG1kb947AGR3AjTJtinaAzvmEUTiS4';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
