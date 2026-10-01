-- Transactional assertions for a disposable migrated database. No live project data.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000001','admin@example.test','{"name":"Administrator"}'),
 ('00000000-0000-4000-8000-000000000002','owner@example.test','{"name":"Task Owner","role":"admin"}'),
 ('00000000-0000-4000-8000-000000000003','other@example.test','{"name":"Other Member"}'),
 ('00000000-0000-4000-8000-000000000004','inactive@example.test','{"name":"Inactive Member"}');
do $$ begin
 if (select role from public.permission where member_id='00000000-0000-4000-8000-000000000002') <> 'new_user' then raise exception 'Signup role escalation'; end if;
end $$;
update public.permission set role='admin' where member_id='00000000-0000-4000-8000-000000000001';
update public.permission set role='verified_user' where member_id in ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003');
update public.permission set role='admin',status='resigned' where member_id='00000000-0000-4000-8000-000000000004';
insert into public.task(id,title,created_by,assigned_to) values('00000000-0000-4000-8000-000000000010','Original task','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ declare n int; begin
 select count(*) into n from public.task; if n<>0 then raise exception 'Unrelated task disclosed'; end if;
 update public.task set title='Unauthorized change'; get diagnostics n=row_count; if n<>0 then raise exception 'Unrelated task modified'; end if;
 update public.permission set role='admin' where member_id=auth.uid(); get diagnostics n=row_count; if n<>0 then raise exception 'Self role escalation'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ declare n int; begin
 update public.task set completed=true; get diagnostics n=row_count; if n<>1 then raise exception 'Assigned task edit denied'; end if;
 begin
  update public.task set assigned_to='00000000-0000-4000-8000-000000000003';
  raise exception 'Reassignment incorrectly accepted';
 exception when raise_exception then
  if sqlerrm <> 'Reassignment requires staff' then raise; end if;
 end;
 delete from public.task; get diagnostics n=row_count; if n<>0 then raise exception 'Ordinary user deleted task'; end if;
 begin
  insert into public.task(title,created_by,assigned_to) values('Unauthorized creation',auth.uid(),auth.uid());
  raise exception 'Ordinary user created task';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
do $$ declare n int; begin
 select count(*) into n from public.task; if n<>0 then raise exception 'Inactive user read tasks'; end if;
 update public.permission set status='active' where member_id=auth.uid(); get diagnostics n=row_count; if n<>0 then raise exception 'Inactive user reactivated self'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ declare n int; begin
 update public.task set assigned_to='00000000-0000-4000-8000-000000000003'; get diagnostics n=row_count; if n<>1 then raise exception 'Admin reassignment denied'; end if;
 begin
  update public.task set created_by='00000000-0000-4000-8000-000000000003';
  raise exception 'Creator change incorrectly accepted';
 exception when raise_exception then if sqlerrm <> 'Task creator is immutable' then raise; end if;
 end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform * from public.task; raise exception 'Anonymous read allowed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
