-- Vôlei IDOSOS & FURIOSOS — initial schema
create extension if not exists "pgcrypto";

-- enums
create type player_role     as enum ('levantador','passador','atacante','defensor');
create type session_status  as enum ('draft','drawn','playing','done');
create type team_label      as enum ('A','B','C');
create type constraint_type as enum ('lock','avoid');
create type profile_role    as enum ('admin','viewer');

-- players
create table players (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  stars           int  not null default 3 check (stars between 1 and 5),
  elo             int  not null default 1000,
  roles           player_role[] not null default '{}',
  active          boolean not null default true,
  pending_review  boolean not null default false,
  created_at      timestamptz not null default now()
);
create index on players (active);
create index on players (slug);

-- sessions
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  title       text,
  location    text,
  status      session_status not null default 'draft',
  slug        text not null unique,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on sessions (date desc);

-- attendances (jogadores confirmados na sessão)
create table attendances (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  player_id   uuid not null references players(id)  on delete cascade,
  slot        int,
  confirmed   boolean not null default true,
  is_reserve  boolean not null default false,
  unique (session_id, player_id)
);
create index on attendances (session_id);

-- constraints (lock/avoid)
create table constraints (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  type        constraint_type not null,
  player_a    uuid not null references players(id) on delete cascade,
  player_b    uuid not null references players(id) on delete cascade,
  check (player_a <> player_b)
);
create index on constraints (session_id);

-- teams + members
create table teams (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  label       team_label not null,
  color       text,
  unique (session_id, label)
);

create table team_members (
  team_id    uuid not null references teams(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  primary key (team_id, player_id)
);
create index on team_members (player_id);

-- matches (partidas jogadas)
create table matches (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  team_home    uuid not null references teams(id) on delete cascade,
  team_away    uuid not null references teams(id) on delete cascade,
  score_home   int  not null default 0,
  score_away   int  not null default 0,
  winner       uuid references teams(id) on delete set null,
  played_at    timestamptz not null default now(),
  check (team_home <> team_away)
);
create index on matches (session_id);

-- profiles (role per auth user)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          profile_role not null default 'viewer',
  display_name  text
);

-- helper: is current user admin?
create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
