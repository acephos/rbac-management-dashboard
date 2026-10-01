import { z } from "zod";

export const roles = ["admin", "manager", "verified_user", "new_user"] as const;
export type Role = typeof roles[number];
export interface Actor { id: string; role: Role; status: "active" | "resigned"; }
export class AuthorizationError extends Error {}
export function authorize(actor: Actor | null, allowed: readonly Role[] = roles): asserts actor is Actor {
  if (!actor || actor.status !== "active" || !allowed.includes(actor.role)) throw new AuthorizationError("You don't have permission to perform this action");
}
export function authorizeTask(actor: Actor | null, task: { created_by: string; assigned_to: string }, elevated = false) {
  authorize(actor, ["admin", "manager", "verified_user"]);
  if (actor.role === "admin" || actor.role === "manager") return;
  if (elevated || (task.created_by !== actor.id && task.assigned_to !== actor.id)) throw new AuthorizationError("You don't have permission to modify this task");
}
export const idSchema = z.string().uuid();
export const nameSchema = z.object({ name: z.string().trim().min(2).max(100) });
export const permissionSchema = z.object({ role: z.enum(roles), status: z.enum(["active", "resigned"]) });
export const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
export const credentialsSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(128), confirm: z.string() }).refine(x => x.password === x.confirm, { message: "Passwords do not match" });
export const memberSchema = z.object({ name: z.string().trim().min(2).max(100), role: z.enum(roles), status: z.enum(["active", "resigned"]), email: z.string().trim().email(), password: z.string().min(8).max(128), confirm: z.string() }).refine(x => x.password === x.confirm, { message: "Passwords do not match" });
export const taskSchema = z.object({ title: z.string().trim().min(6).max(500), completed: z.boolean() });
export function actionError(error: unknown) {
  return JSON.stringify({ error: { message: error instanceof AuthorizationError || error instanceof z.ZodError ? error.message : "The request could not be completed" } });
}
