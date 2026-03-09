import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

export const supa = createClient(SUPABASE_URL, SUPABASE_KEY);