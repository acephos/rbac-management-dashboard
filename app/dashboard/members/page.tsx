import React from "react";
import MemberTable from "./components/MemberTable";
import CreateMember from "./components/create/CreateMember";
import { requirePageActor } from "@/lib/actor";
import { readUserSession } from "@/lib/actions";
import { createSupabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function Members() {
  const user = await requirePageActor();
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  return (
    <div className="space-y-5 w-full overflow-y-auto px-3" suppressHydrationWarning>
      <h1 className="text-3xl font-bold">Members</h1>
      { (isAdmin || isManager) && (
        <div className="flex gap-2">
          {isAdmin && <CreateMember />}
        </div>
      )}
      <MemberTable />
    </div>
  );
}
