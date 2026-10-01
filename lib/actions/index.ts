"use server";
import { createSupabaseServerClient } from "../supabase";

/** Compatibility shape for callers, populated only from verified Auth user data. */
export async function readUserSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { data: { session: error || !user ? null : { user } }, error };
}
