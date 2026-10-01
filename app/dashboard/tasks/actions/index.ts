"use server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireActor } from "@/lib/actor";
import { actionError, authorizeTask, idSchema, taskSchema, AuthorizationError } from "@/lib/authorization";
import { revalidatePath, unstable_noStore } from "next/cache";

export async function readMemberNameID() {
  unstable_noStore(); await requireActor(["admin", "manager"]);
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from("member").select("id,name"); if (error) throw error; return data;
}
export async function readMemberNameByID(member_id: string) {
  unstable_noStore(); await requireActor(["admin", "manager", "verified_user"]);
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from("member").select("name").eq("id", idSchema.parse(member_id)); if (error) throw error; return data;
}
export async function createTask(data: { title: string; completed: boolean; created_by?: string; assigned_to: string }) {
  try {
    const actor = await requireActor(["admin", "manager"]);
    const payload = taskSchema.parse(data); const assigned_to = idSchema.parse(data.assigned_to);
    const client = await createSupabaseServerClient();
    const { data: assignee } = await client.from("permission").select("role,status").eq("member_id", assigned_to).single();
    if (!assignee || assignee.status !== "active" || assignee.role === "new_user") throw new AuthorizationError("Assignee must be an active verified member");
    const result = await client.from("task").insert({ ...payload, assigned_to, created_by: actor.id });
    revalidatePath("/dashboard/tasks"); return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}
async function update(data: { title: string; completed: boolean; task_id: string; assigned_to?: string }, elevated: boolean) {
  const actor = await requireActor(elevated ? ["admin", "manager"] : ["admin", "manager", "verified_user"]);
  const payload = taskSchema.parse(data); const taskId = idSchema.parse(data.task_id);
  const client = await createSupabaseServerClient();
  const { data: task, error } = await client.from("task").select("created_by,assigned_to").eq("id", taskId).single();
  if (error || !task) throw new AuthorizationError("Task not found or unavailable");
  authorizeTask(actor, task, elevated);
  let assigned_to: string | undefined;
  if (elevated) {
    assigned_to = idSchema.parse(data.assigned_to);
    const { data: assignee } = await client.from("permission").select("role,status").eq("member_id", assigned_to).single();
    if (!assignee || assignee.status !== "active" || assignee.role === "new_user") throw new AuthorizationError("Assignee must be an active verified member");
  }
  const result = await client.from("task").update({ ...payload, ...(assigned_to ? { assigned_to } : {}) }).eq("id", taskId);
  revalidatePath("/dashboard/tasks"); return JSON.stringify(result);
}
export async function updateTaskById(data: { title: string; completed: boolean; task_id: string }) {
  try { return await update(data, false); } catch (error) { return actionError(error); }
}
export async function updateTaskByIdElevated(data: { title: string; completed: boolean; assigned_to: string; task_id: string }) {
  try { return await update(data, true); } catch (error) { return actionError(error); }
}
export async function deleteTaskById(task_id: string) {
  try {
    await requireActor(["admin", "manager"]);
    const client = await createSupabaseServerClient();
    const result = await client.from("task").delete().eq("id", idSchema.parse(task_id));
    revalidatePath("/dashboard/tasks"); return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}
export async function readTasks() {
  unstable_noStore(); await requireActor(["admin", "manager", "verified_user"]);
  const client = await createSupabaseServerClient(); return client.from("task").select("*");
}
