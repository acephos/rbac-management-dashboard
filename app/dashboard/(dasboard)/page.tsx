import { requirePageActor } from "@/lib/actor";
import { readUserSession } from '@/lib/actions';
import React from 'react';
import { createSupabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  await requirePageActor();

    return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '90%' }}>
			<h1 style={{ fontSize: '2.5em' }}>Your One Stop RBAC Dashboard!</h1>
			<div>
			</div>
		</div>
    );
}