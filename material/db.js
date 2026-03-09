import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);