-- Apply to a staging Supabase database first. This migration replaces legacy permissive policies.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.member (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null
);
create table if not exists public.permission (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.member(id) on delete cascade,
  role text not null default 'new_user' check (role in ('admin','manager','verified_user','new_user')),
  status text not null default 'active' check (status in ('active','resigned'))
);
create table if not exists public.task (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 6 and 500),
  completed boolean not null default false,
  created_by uuid not null references public.member(id),
  assigned_to uuid not null references public.member(id)
);
create unique index if not exists permission_member_unique on public.permission(member_id);

-- Definer lookup avoids recursive permission RLS; the schema is not exposed through the Data API.
create or replace function private.has_role(allowed text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.permission p where p.member_id = auth.uid() and p.status = 'active' and p.role = any(allowed));
$$;
revoke all on function private.has_role(text[]) from public;
grant execute on function private.has_role(text[]) to authenticated;

alter table public.member enable row level security;
alter table public.permission enable row level security;
alter table public.task enable row level security;
do $$ declare p record; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('member','permission','task') loop
    execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
end $$;
revoke all on public.member,public.permission,public.task from anon,authenticated;
grant select on public.member,public.permission to authenticated;
grant update(name) on public.member to authenticated;
grant insert,update,delete on public.permission to authenticated;
grant select,insert,update,delete on public.task to authenticated;
grant all on public.member,public.permission,public.task to service_role;

create policy member_read on public.member for select to authenticated using (
  id=auth.uid() or private.has_role(array['admin','manager','verified_user','new_user'])
);
create policy member_edit_name on public.member for update to authenticated
  using (private.has_role(array['admin']) or (id=auth.uid() and private.has_role(array['manager','verified_user','new_user'])))
  with check (private.has_role(array['admin']) or (id=auth.uid() and private.has_role(array['manager','verified_user','new_user'])));
create policy permission_read on public.permission for select to authenticated using (
  member_id=auth.uid() or private.has_role(array['admin','manager','verified_user','new_user'])
);
create policy permission_admin on public.permission for all to authenticated
  using (private.has_role(array['admin'])) with check (private.has_role(array['admin']));
create policy task_read on public.task for select to authenticated using (
  private.has_role(array['admin','manager']) or (private.has_role(array['verified_user']) and (created_by=auth.uid() or assigned_to=auth.uid()))
);
create policy task_create on public.task for insert to authenticated with check (
  private.has_role(array['admin','manager']) and created_by=auth.uid()
  and exists(select 1 from public.permission p where p.member_id=assigned_to and p.status='active' and p.role in ('admin','manager','verified_user'))
);
create policy task_update on public.task for update to authenticated
  using (private.has_role(array['admin','manager']) or (private.has_role(array['verified_user']) and (created_by=auth.uid() or assigned_to=auth.uid())))
  with check (private.has_role(array['admin','manager']) or (private.has_role(array['verified_user']) and (created_by=auth.uid() or assigned_to=auth.uid())));
create policy task_delete on public.task for delete to authenticated using (private.has_role(array['admin','manager']));

create or replace function private.guard_task_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated','anon') then
    if new.created_by is distinct from old.created_by then raise exception 'Task creator is immutable'; end if;
    if new.assigned_to is distinct from old.assigned_to then
      if not private.has_role(array['admin','manager']) then raise exception 'Reassignment requires staff'; end if;
      if not exists(select 1 from public.permission p where p.member_id=new.assigned_to and p.status='active' and p.role in ('admin','manager','verified_user')) then raise exception 'Assignee must be active and verified'; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_task_identity on public.task;
create trigger guard_task_identity before update on public.task for each row execute function private.guard_task_identity();

-- Public signup always gets the least-privileged role, independent of caller metadata.
create or replace function private.create_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.member(id,name,email) values (new.id,left(coalesce(nullif(new.raw_user_meta_data->>'name',''),'New member'),100),coalesce(new.email,'')) on conflict(id) do nothing;
  insert into public.permission(member_id,role,status) values(new.id,'new_user','active') on conflict(member_id) do nothing;
  return new;
end $$;
revoke all on function private.create_member() from public;
drop trigger if exists create_rbac_member on auth.users;
create trigger create_rbac_member after insert on auth.users for each row execute function private.create_member();
commit;
