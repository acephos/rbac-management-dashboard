import { createSupabaseServerClient } from "./supabase";
import { authorize, type Actor, type Role, roles } from "./authorization";
import { redirect } from "next/navigation";

/** Auth verifies identity; only the protected database row supplies authority. */
export async function getActor(): Promise<Actor | null> {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const { data, error: permissionError } = await client.from("permission").select("role,status").eq("member_id", user.id).single();
  if (permissionError || !data || !roles.includes(data.role) || !["active", "resigned"].includes(data.status)) return null;
  return { id: user.id, role: data.role, status: data.status };
}
export async function requireActor(allowed?: readonly Role[]): Promise<Actor> {
  const actor = await getActor(); authorize(actor, allowed); return actor;
}
export async function requirePageActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/auth");
  if (actor.status !== "active") redirect("/inactive");
  return actor;
}
