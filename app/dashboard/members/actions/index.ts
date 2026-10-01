"use server";
import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supabase";
import { requireActor } from "@/lib/actor";
import { actionError, AuthorizationError, idSchema, memberSchema, nameSchema, permissionSchema } from "@/lib/authorization";
import { revalidatePath, unstable_noStore } from "next/cache";
import { z } from "zod";

export async function readMembers() {
  unstable_noStore(); await requireActor(); const client = await createSupabaseServerClient(); return client.from("permission").select("*,member(*)");
}
export async function createMember(data: z.input<typeof memberSchema>) {
  try {
    await requireActor(["admin"]); const input = memberSchema.parse(data); const admin = await createSupabaseAdmin();
    const created = await admin.auth.admin.createUser({ email: input.email, password: input.password, email_confirm: true, user_metadata: { name: input.name } });
    if (created.error || !created.data.user) return JSON.stringify(created);
    const id = created.data.user.id;
    const profile = await admin.from("member").upsert({ id, name: input.name, email: input.email });
    if (profile.error) { await admin.auth.admin.deleteUser(id); return JSON.stringify(profile); }
    const permission = await admin.from("permission").upsert({ member_id: id, role: input.role, status: input.status }, { onConflict: "member_id" });
    if (permission.error) await admin.auth.admin.deleteUser(id);
    revalidatePath("/dashboard/members"); return JSON.stringify(permission);
  } catch (error) { return actionError(error); }
}
export async function updateMemberBasicById(id: string, data: { name: string }) {
  try {
    const actor = await requireActor(); const memberId = idSchema.parse(id);
    if (actor.role !== "admin" && actor.id !== memberId) throw new AuthorizationError("Only an administrator or the account owner can edit this profile");
    const client = await createSupabaseServerClient();
    const result = await client.from("member").update(nameSchema.parse(data)).eq("id", memberId);
    revalidatePath("/dashboard/members"); return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}
export async function updateMemberAdvanceById(permission_id: string, user_id: string, data: z.input<typeof permissionSchema>) {
  try {
    await requireActor(["admin"]); const client = await createSupabaseServerClient();
    const result = await client.from("permission").update(permissionSchema.parse(data)).eq("id", idSchema.parse(permission_id)).eq("member_id", idSchema.parse(user_id));
    revalidatePath("/dashboard/members"); return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}
export async function updateMemberAccountById(user_id: string, data: { email: string; password?: string; confirm?: string }) {
  try {
    await requireActor(["admin"]);
    const input = z.object({ email: z.string().email(), password: z.string().min(8).max(128).optional(), confirm: z.string().optional() }).refine(x => !x.password || x.password === x.confirm, { message: "Passwords do not match" }).parse(data);
    const admin = await createSupabaseAdmin(); const id = idSchema.parse(user_id);
    const result = await admin.auth.admin.updateUserById(id, { email: input.email, ...(input.password ? { password: input.password } : {}) });
    if (result.error) return JSON.stringify(result);
    const profile = await admin.from("member").update({ email: input.email }).eq("id", id);
    revalidatePath("/dashboard/members"); return JSON.stringify(profile);
  } catch (error) { return actionError(error); }
}
export async function deleteMemberById(user_id: string) {
  try {
    const actor = await requireActor(["admin"]); const id = idSchema.parse(user_id);
    if (id === actor.id) throw new AuthorizationError("You cannot delete your own administrator account");
    const admin = await createSupabaseAdmin(); const result = await admin.auth.admin.deleteUser(id);
    revalidatePath("/dashboard/members"); return JSON.stringify(result);
  } catch (error) { return actionError(error); }
}
