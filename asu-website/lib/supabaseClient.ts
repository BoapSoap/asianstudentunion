import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Shared client for public read-only use. We disable session persistence
// to avoid writing to storage in the browser for anonymous reads.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// Auth-enabled browser client for App Router client components
export const createSupabaseClient = (): SupabaseClient =>
  createClientComponentClient();
