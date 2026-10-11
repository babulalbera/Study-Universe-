import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Bina login wala client, sirf public (RLS se allowed) data ke liye. Isse result cache ho sakta hai.
export const createPublicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
