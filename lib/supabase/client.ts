import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Browser (Client Components) ke liye. Sirf anon key — wo public hoti hai, RLS usse bachati hai.
export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
