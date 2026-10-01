import {it} from "vitest";
import {PGlite} from "@electric-sql/pglite";
import {readFile} from "node:fs/promises";
it("enforces RLS against anonymous, inactive, unrelated, assigned, and staff identities",async()=>{
 const db=new PGlite();
 try {
  // Disposable Auth stand-in. The real migration and policy assertions run in PostgreSQL.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to authenticated,anon;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  await db.exec(await readFile("supabase/migrations/202610010001_authorization.sql","utf8"));
  await db.exec(await readFile("supabase/tests/authorization.sql","utf8"));
 } finally {await db.close();}
},30000);
