import { getActor } from "@/lib/actor";
import React from "react";
import { readUserSession } from "@/lib/actions";
import { redirect } from "next/navigation";
import LoginForm from "./components/login/LoginForm";
import { createSupabaseAdmin } from "@/lib/supabase";


export default async function page() {
  const actor = await getActor();
  if (actor) redirect(actor.status === "active" ? "/dashboard" : "/inactive");
	return (
		<div className="flex items-center justify-center h-screen" suppressHydrationWarning>
			<LoginForm />
		</div>
	);
}
