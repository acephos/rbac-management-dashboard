import React from "react";
import TaskTable from "./components/TaskTable";
import CreateTask from "./components/create/CreateTask";
import { requirePageActor } from "@/lib/actor";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase";
import { readUserSession } from "@/lib/actions";

export default async function Task() {
  const user = await requirePageActor();
  if (user.role === "new_user") redirect("/dashboard/members");
	const isAdmin = user.role === "admin";
	const isManager = user.role === "manager";
	return (
		<div className="space-y-5 w-full overflow-y-auto px-3" suppressHydrationWarning>
			<h1 className="text-3xl font-bold">Tasks</h1>
			{(isAdmin || isManager) && (<div className="flex gap-2">
				<CreateTask isAdmin={isAdmin} isManager={isManager} user_id={user.id} />
			</div>
			)}
			<TaskTable />
		</div>
	);
}
