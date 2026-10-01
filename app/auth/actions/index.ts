"use server";
import { credentialsSchema, loginSchema, nameSchema, actionError } from "@/lib/authorization";

import { createSupabaseServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginWithEmailAndPassword(data: {
  email: string;
  password: string;
}) {
  try {
    const input = loginSchema.parse(data);
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signInWithPassword(input);
    return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function signUp(data: { name: string; email: string; password: string; confirm: string }) {
  try {
    const input = credentialsSchema.parse(data);
    const name = nameSchema.parse({ name: data.name }).name;
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signUp({ email: input.email, password: input.password, options: { data: { name } } });
    revalidatePath("/auth");
    return JSON.stringify({ error: result.error });
  } catch (error) { return actionError(error); }
}
