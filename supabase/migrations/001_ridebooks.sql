-- Run once in the SQL Editor of a NEW Supabase project.
-- No user data, keys, credentials or sample maintenance records are included.
begin;

create table public.ridebooks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.ridebooks enable row level security;
alter table public.ridebooks force row level security;
revoke all on public.ridebooks from anon;
revoke all on public.ridebooks from authenticated;
grant select, insert, update on public.ridebooks to authenticated;

create policy "Read own ridebook" on public.ridebooks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own ridebook" on public.ridebooks
  for insert to authenticated with check ((select auth.uid()) = user_id and revision = 1);
create policy "Update own ridebook" on public.ridebooks
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.check_ridebook_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'A ridebook cannot change owner';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception 'Revision must advance by one';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.check_ridebook_update() from public;
create trigger check_ridebook_update before update on public.ridebooks
  for each row execute function public.check_ridebook_update();

commit;
