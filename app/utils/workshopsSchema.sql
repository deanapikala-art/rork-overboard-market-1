-- =====================================================================
--  OVERBOARD MARKET • WORKSHOPS SYSTEM (In-Person + Online)
-- =====================================================================

-- Enums for workshop system
do $$
begin
  perform 1 from pg_type where typname = 'workshop_type';
  if not found then
    create type workshop_type as enum ('in_person', 'online');
  end if;

  perform 1 from pg_type where typname = 'workshop_status';
  if not found then
    create type workshop_status as enum ('draft', 'published', 'full', 'completed', 'canceled');
  end if;

  perform 1 from pg_type where typname = 'workshop_payment_status';
  if not found then
    create type workshop_payment_status as enum ('pending', 'paid', 'canceled');
  end if;

  perform 1 from pg_type where typname = 'workshop_attendance_status';
  if not found then
    create type workshop_attendance_status as enum ('registered', 'attended', 'no_show');
  end if;
end$$;

-- =====================================================================
-- Workshops Table
-- =====================================================================
create table if not exists public.workshops (
  id               uuid primary key default gen_random_uuid(),
  vendor_id        uuid not null,
  title            text not null,
  description      text,
  image_url        text,
  type             workshop_type not null default 'in_person',
  date             date not null,
  start_time       time not null,
  end_time         time not null,
  location         text,
  geo_lat          numeric(10,6),
  geo_lon          numeric(10,6),
  meeting_link     text,
  meeting_password text,
  max_attendees    int not null,
  current_attendees int not null default 0,
  price_cents      int not null default 0,
  payment_link     text,
  materials        text,
  status           workshop_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  
  constraint workshops_vendor_fk 
    foreign key (vendor_id) 
    references public.vendor_profiles(id) 
    on delete cascade,
  
  constraint workshops_capacity_check 
    check (max_attendees > 0),
  
  constraint workshops_current_attendees_check 
    check (current_attendees >= 0 and current_attendees <= max_attendees),
  
  constraint workshops_time_check 
    check (end_time > start_time),
  
  constraint workshops_in_person_location_check 
    check (type != 'in_person' or location is not null),
  
  constraint workshops_online_link_check 
    check (type != 'online' or meeting_link is not null)
);

create index if not exists idx_workshops_vendor on public.workshops(vendor_id);
create index if not exists idx_workshops_date on public.workshops(date);
create index if not exists idx_workshops_status on public.workshops(status);
create index if not exists idx_workshops_type on public.workshops(type);

-- =====================================================================
-- Workshop Registrations Table
-- =====================================================================
create table if not exists public.workshop_registrations (
  id                uuid primary key default gen_random_uuid(),
  workshop_id       uuid not null,
  user_id           uuid not null,
  registered_at     timestamptz not null default now(),
  payment_status    workshop_payment_status not null default 'pending',
  attendance_status workshop_attendance_status not null default 'registered',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  
  constraint workshop_registrations_workshop_fk 
    foreign key (workshop_id) 
    references public.workshops(id) 
    on delete cascade,
  
  constraint workshop_registrations_user_fk 
    foreign key (user_id) 
    references public.user_profile(id) 
    on delete cascade,
  
  constraint workshop_registrations_unique 
    unique (workshop_id, user_id)
);

create index if not exists idx_workshop_registrations_workshop on public.workshop_registrations(workshop_id);
create index if not exists idx_workshop_registrations_user on public.workshop_registrations(user_id);
create index if not exists idx_workshop_registrations_payment on public.workshop_registrations(payment_status);

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================
alter table public.workshops enable row level security;
alter table public.workshop_registrations enable row level security;

-- Workshops: public can read published, vendors manage their own, admins see all
drop policy if exists workshops_select on public.workshops;
create policy workshops_select on public.workshops
for select using (
  status = 'published'
  or public.is_admin()
  or vendor_id in (
    select v.id from public.vendor_profiles v
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

drop policy if exists workshops_insert on public.workshops;
create policy workshops_insert on public.workshops
for insert with check (
  public.is_admin()
  or vendor_id in (
    select v.id from public.vendor_profiles v
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

drop policy if exists workshops_update on public.workshops;
create policy workshops_update on public.workshops
for update using (
  public.is_admin()
  or vendor_id in (
    select v.id from public.vendor_profiles v
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
) with check (
  public.is_admin()
  or vendor_id in (
    select v.id from public.vendor_profiles v
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

drop policy if exists workshops_delete on public.workshops;
create policy workshops_delete on public.workshops
for delete using (
  public.is_admin()
  or vendor_id in (
    select v.id from public.vendor_profiles v
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

-- Registrations: users see their own, vendors see their workshop registrations, admins see all
drop policy if exists workshop_registrations_select on public.workshop_registrations;
create policy workshop_registrations_select on public.workshop_registrations
for select using (
  public.is_admin()
  or user_id in (select id from public.user_profile where auth_user_id = auth.uid())
  or workshop_id in (
    select w.id from public.workshops w
    join public.vendor_profiles v on v.id = w.vendor_id
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

drop policy if exists workshop_registrations_insert on public.workshop_registrations;
create policy workshop_registrations_insert on public.workshop_registrations
for insert with check (
  user_id in (select id from public.user_profile where auth_user_id = auth.uid())
);

drop policy if exists workshop_registrations_update on public.workshop_registrations;
create policy workshop_registrations_update on public.workshop_registrations
for update using (
  public.is_admin()
  or user_id in (select id from public.user_profile where auth_user_id = auth.uid())
  or workshop_id in (
    select w.id from public.workshops w
    join public.vendor_profiles v on v.id = w.vendor_id
    join public.user_profile u on u.id = v.owner_user_id
    where u.auth_user_id = auth.uid()
  )
);

drop policy if exists workshop_registrations_delete on public.workshop_registrations;
create policy workshop_registrations_delete on public.workshop_registrations
for delete using (
  public.is_admin()
  or user_id in (select id from public.user_profile where auth_user_id = auth.uid())
);

-- =====================================================================
-- Helper Functions & Triggers
-- =====================================================================

-- Increment current_attendees when registration is created
create or replace function public.increment_workshop_attendees()
returns trigger language plpgsql security definer as $$
begin
  update public.workshops
  set current_attendees = current_attendees + 1,
      status = case 
        when current_attendees + 1 >= max_attendees then 'full'::workshop_status
        else status
      end,
      updated_at = now()
  where id = new.workshop_id;
  return new;
end; $$;

drop trigger if exists trg_increment_workshop_attendees on public.workshop_registrations;
create trigger trg_increment_workshop_attendees
after insert on public.workshop_registrations
for each row execute function public.increment_workshop_attendees();

-- Decrement current_attendees when registration is deleted
create or replace function public.decrement_workshop_attendees()
returns trigger language plpgsql security definer as $$
begin
  update public.workshops
  set current_attendees = greatest(0, current_attendees - 1),
      status = case 
        when status = 'full' and current_attendees - 1 < max_attendees then 'published'::workshop_status
        else status
      end,
      updated_at = now()
  where id = old.workshop_id;
  return old;
end; $$;

drop trigger if exists trg_decrement_workshop_attendees on public.workshop_registrations;
create trigger trg_decrement_workshop_attendees
after delete on public.workshop_registrations
for each row execute function public.decrement_workshop_attendees();

-- Update updated_at timestamp on workshops
create or replace function public.update_workshop_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_update_workshop_timestamp on public.workshops;
create trigger trg_update_workshop_timestamp
before update on public.workshops
for each row execute function public.update_workshop_timestamp();

-- Update updated_at timestamp on registrations
drop trigger if exists trg_update_registration_timestamp on public.workshop_registrations;
create trigger trg_update_registration_timestamp
before update on public.workshop_registrations
for each row execute function public.update_workshop_timestamp();

-- Function to check if workshop conflicts with live market events
create or replace function public.check_workshop_event_conflict(
  p_vendor_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time
)
returns boolean language plpgsql security definer as $$
declare
  v_conflict_exists boolean;
begin
  -- Check if vendor has a live market event on the same date/time
  -- This assumes you have a vendor_live table tracking live market sessions
  -- Adjust table/column names to match your actual schema
  select exists(
    select 1 from public.vendor_live
    where vendor_id = p_vendor_id
    and date_trunc('day', started_at) = p_date
    and (
      (started_at::time >= p_start_time and started_at::time < p_end_time)
      or (ended_at::time > p_start_time and ended_at::time <= p_end_time)
      or (started_at::time <= p_start_time and ended_at::time >= p_end_time)
    )
  ) into v_conflict_exists;
  
  return v_conflict_exists;
end; $$;

-- =====================================================================
-- Comments (for documentation)
-- =====================================================================
comment on table public.workshops is 'Vendor-hosted workshops (in-person and online)';
comment on table public.workshop_registrations is 'User registrations for workshops';
comment on column public.workshops.type is 'Workshop format: in_person or online';
comment on column public.workshops.status is 'Current state: draft, published, full, completed, canceled';
comment on column public.workshops.meeting_link is 'Online meeting link (Zoom, Google Meet, etc.)';
comment on column public.workshops.meeting_password is 'Optional password for online meeting';
comment on column public.workshops.location is 'Physical address for in-person workshops';
comment on column public.workshops.max_attendees is 'Capacity limit for the workshop';
comment on column public.workshops.current_attendees is 'Current number of registered attendees';
