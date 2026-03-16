create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null default '',
    username text not null default 'user',
    plan text not null default 'free' check (plan in ('free', 'solo', 'team')),
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    favorites text[] not null default '{}',
    onboarding_completed boolean not null default false,
    primary_use text not null default '',
    experience_level text not null default '',
    project_type text not null default '',
    team_size text not null default '',
    goals text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null default 'Untitled',
    elements jsonb not null default '[]'::jsonb,
    settings jsonb not null default '{}'::jsonb,
    is_deleted boolean not null default false,
    marked_for_deletion boolean not null default false,
    deletion_scheduled_at timestamptz,
    created_at timestamptz not null default now(),
    last_modified timestamptz not null default now()
);

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    type text not null default 'info',
    title text not null default 'Notification',
    message text not null default '',
    metadata jsonb not null default '{}'::jsonb,
    read boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    subject text not null default 'Untitled ticket',
    status text not null default 'pending' check (status in ('open', 'pending', 'closed')),
    claimed_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.tickets (id) on delete cascade,
    sender_id uuid not null references auth.users (id) on delete cascade,
    message text not null default '',
    attachments jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists projects_user_id_last_modified_idx on public.projects (user_id, last_modified desc);
create index if not exists projects_visibility_idx on public.projects (is_deleted, marked_for_deletion);
create index if not exists projects_settings_gin_idx on public.projects using gin (settings);
create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists tickets_user_id_updated_at_idx on public.tickets (user_id, updated_at desc);
create index if not exists tickets_claimed_by_updated_at_idx on public.tickets (claimed_by, updated_at desc);
create index if not exists ticket_messages_ticket_id_created_at_idx on public.ticket_messages (ticket_id, created_at asc);

grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profiles to authenticated, service_role;
grant all on table public.user_profiles to authenticated, service_role;
grant all on table public.projects to authenticated, service_role;
grant all on table public.notifications to authenticated, service_role;
grant all on table public.tickets to authenticated, service_role;
grant all on table public.ticket_messages to authenticated, service_role;
grant select on table public.projects to anon;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.set_project_last_modified()
returns trigger
language plpgsql
as $$
begin
    new.last_modified = now();
    return new;
end;
$$;

create or replace function public.touch_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
    update public.tickets
    set updated_at = now()
    where id = coalesce(new.ticket_id, old.ticket_id);

    return coalesce(new, old);
end;
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
    select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = coalesce(check_user_id, auth.uid())
          and is_admin = true
    );
$$;

create or replace function public.project_collaborator_role(project_settings jsonb, user_email text)
returns text
language sql
stable
as $$
    with collaborators as (
        select value
        from jsonb_array_elements(coalesce(project_settings -> 'collaborators', '[]'::jsonb))
    )
    select coalesce((
        select case jsonb_typeof(value)
            when 'string' then 'edit'
            when 'object' then lower(coalesce(value ->> 'role', 'edit'))
            else null
        end
        from collaborators
        where lower(case jsonb_typeof(value)
            when 'string' then trim(both '"' from value::text)
            when 'object' then coalesce(value ->> 'email', '')
            else ''
        end) = lower(coalesce(user_email, ''))
        limit 1
    ), 'none');
$$;

create or replace function public.project_can_view(project_owner uuid, project_settings jsonb)
returns boolean
language sql
stable
as $$
    select
        auth.uid() = project_owner
        or public.is_admin_user()
        or public.project_collaborator_role(project_settings, public.current_user_email()) <> 'none'
        or coalesce((project_settings ->> 'is_public')::boolean, false)
        or coalesce((project_settings ->> 'is_community_published')::boolean, false);
$$;

create or replace function public.project_can_edit(project_owner uuid, project_settings jsonb)
returns boolean
language sql
stable
as $$
    select
        auth.uid() = project_owner
        or public.is_admin_user()
        or public.project_collaborator_role(project_settings, public.current_user_email()) not in ('none', 'view', 'comment');
$$;

create or replace function public.user_can_access_ticket(target_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.tickets
        where id = target_ticket_id
          and (
              user_id = auth.uid()
              or claimed_by = auth.uid()
              or public.is_admin_user()
          )
    );
$$;

create or replace function public.storage_ticket_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
    first_segment text;
begin
    first_segment := split_part(coalesce(object_name, ''), '/', 1);
    if first_segment = '' then
        return null;
    end if;

    return first_segment::uuid;
exception
    when others then
        return null;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    next_username text;
    first_admin boolean;
begin
    next_username := left(coalesce(
        nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
        split_part(coalesce(new.email, 'user'), '@', 1),
        'user'
    ), 64);

    first_admin := not exists (select 1 from public.profiles);

    insert into public.profiles (id, email, username, plan, is_admin)
    values (new.id, coalesce(new.email, ''), next_username, 'free', first_admin)
    on conflict (id) do update
    set email = excluded.email,
        username = excluded.username;

    insert into public.user_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

    return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    next_username text;
begin
    next_username := left(coalesce(
        nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
        split_part(coalesce(new.email, 'user'), '@', 1),
        'user'
    ), 64);

    insert into public.profiles (id, email, username, plan, is_admin)
    values (new.id, coalesce(new.email, ''), next_username, 'free', false)
    on conflict (id) do update
    set email = excluded.email,
        username = excluded.username;

    return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_last_modified on public.projects;
create trigger set_projects_last_modified
before update on public.projects
for each row execute function public.set_project_last_modified();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

drop trigger if exists touch_tickets_on_message_change on public.ticket_messages;
create trigger touch_tickets_on_message_change
after insert or update or delete on public.ticket_messages
for each row execute function public.touch_ticket_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_updated();

alter table public.profiles enable row level security;
alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

drop policy if exists "profiles are readable to authenticated users" on public.profiles;
create policy "profiles are readable to authenticated users"
on public.profiles for select to authenticated
using (true);

drop policy if exists "profiles are editable by owner or admin" on public.profiles;
create policy "profiles are editable by owner or admin"
on public.profiles for update to authenticated
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());

drop policy if exists "user_profiles are owned by the signed in user" on public.user_profiles;
create policy "user_profiles are owned by the signed in user"
on public.user_profiles for all to authenticated
using (auth.uid() = user_id or public.is_admin_user())
with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "public projects are visible to guests" on public.projects;
create policy "public projects are visible to guests"
on public.projects for select to anon
using (
    coalesce((settings ->> 'is_public')::boolean, false)
    or coalesce((settings ->> 'is_community_published')::boolean, false)
);

drop policy if exists "authenticated users can read visible projects" on public.projects;
create policy "authenticated users can read visible projects"
on public.projects for select to authenticated
using (public.project_can_view(user_id, settings));

drop policy if exists "project owners can insert projects" on public.projects;
create policy "project owners can insert projects"
on public.projects for insert to authenticated
with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "project editors can update projects" on public.projects;
create policy "project editors can update projects"
on public.projects for update to authenticated
using (public.project_can_edit(user_id, settings))
with check (public.project_can_edit(user_id, settings));

drop policy if exists "project owners can delete projects" on public.projects;
create policy "project owners can delete projects"
on public.projects for delete to authenticated
using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "notifications are readable by recipient or admin" on public.notifications;
create policy "notifications are readable by recipient or admin"
on public.notifications for select to authenticated
using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "notifications are editable by recipient or admin" on public.notifications;
create policy "notifications are editable by recipient or admin"
on public.notifications for update to authenticated
using (auth.uid() = user_id or public.is_admin_user())
with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "notifications are deletable by recipient or admin" on public.notifications;
create policy "notifications are deletable by recipient or admin"
on public.notifications for delete to authenticated
using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "authenticated users can insert notifications" on public.notifications;
create policy "authenticated users can insert notifications"
on public.notifications for insert to authenticated
with check (auth.uid() is not null);

drop policy if exists "tickets are readable by owner assignee or admin" on public.tickets;
create policy "tickets are readable by owner assignee or admin"
on public.tickets for select to authenticated
using (auth.uid() = user_id or auth.uid() = claimed_by or public.is_admin_user());

drop policy if exists "authenticated users can create their own tickets" on public.tickets;
create policy "authenticated users can create their own tickets"
on public.tickets for insert to authenticated
with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "ticket managers can update tickets" on public.tickets;
create policy "ticket managers can update tickets"
on public.tickets for update to authenticated
using (auth.uid() = claimed_by or public.is_admin_user())
with check (auth.uid() = claimed_by or public.is_admin_user());

drop policy if exists "ticket managers can delete tickets" on public.tickets;
create policy "ticket managers can delete tickets"
on public.tickets for delete to authenticated
using (public.is_admin_user());

drop policy if exists "ticket messages are readable by ticket participants" on public.ticket_messages;
create policy "ticket messages are readable by ticket participants"
on public.ticket_messages for select to authenticated
using (public.user_can_access_ticket(ticket_id));

drop policy if exists "ticket participants can insert messages" on public.ticket_messages;
create policy "ticket participants can insert messages"
on public.ticket_messages for insert to authenticated
with check (sender_id = auth.uid() and public.user_can_access_ticket(ticket_id));

drop policy if exists "message senders or admins can update messages" on public.ticket_messages;
create policy "message senders or admins can update messages"
on public.ticket_messages for update to authenticated
using (sender_id = auth.uid() or public.is_admin_user())
with check (sender_id = auth.uid() or public.is_admin_user());

drop policy if exists "message senders or admins can delete messages" on public.ticket_messages;
create policy "message senders or admins can delete messages"
on public.ticket_messages for delete to authenticated
using (sender_id = auth.uid() or public.is_admin_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'ticket-files',
    'ticket-files',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ticket files are readable by ticket participants" on storage.objects;
create policy "ticket files are readable by ticket participants"
on storage.objects for select to authenticated
using (
    bucket_id = 'ticket-files'
    and public.user_can_access_ticket(public.storage_ticket_id(name))
);

drop policy if exists "ticket files are uploadable by ticket participants" on storage.objects;
create policy "ticket files are uploadable by ticket participants"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'ticket-files'
    and public.user_can_access_ticket(public.storage_ticket_id(name))
);

drop policy if exists "ticket files are mutable by ticket participants" on storage.objects;
create policy "ticket files are mutable by ticket participants"
on storage.objects for update to authenticated
using (
    bucket_id = 'ticket-files'
    and public.user_can_access_ticket(public.storage_ticket_id(name))
)
with check (
    bucket_id = 'ticket-files'
    and public.user_can_access_ticket(public.storage_ticket_id(name))
);

drop policy if exists "ticket files are deletable by ticket participants" on storage.objects;
create policy "ticket files are deletable by ticket participants"
on storage.objects for delete to authenticated
using (
    bucket_id = 'ticket-files'
    and public.user_can_access_ticket(public.storage_ticket_id(name))
);

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'notifications'
        ) then
            alter publication supabase_realtime add table public.notifications;
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'tickets'
        ) then
            alter publication supabase_realtime add table public.tickets;
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'ticket_messages'
        ) then
            alter publication supabase_realtime add table public.ticket_messages;
        end if;
    end if;
end
$$;
