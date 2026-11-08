-- ============================================================
-- یادچه (Yadche) — اسکیمای اولیه
-- Local-first: هر جدول آینه‌ای از جدول Dexie در کلاینت است.
-- RLS: هر کاربر فقط ردیف‌های خودش را می‌بیند.
-- همگام‌سازی: LWW بر اساس updated_at (روی سرور ست می‌شود).
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- تریگر به‌روزرسانی خودکار updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- پروفایل (رکورد هر کاربر)
-- ------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  avatar_url    text,
  locale        text not null default 'fa',
  theme         text not null default 'dark',
  lock_enabled  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- پوشه‌ها
-- ------------------------------------------------------------
create table public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  icon       text,
  parent_id  uuid references public.folders (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index folders_user_idx on public.folders (user_id, deleted_at);

create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- تگ‌ها
-- ------------------------------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, name)
);

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- یادداشت‌ها
-- ------------------------------------------------------------
create type public.note_type as enum (
  'text',       -- متن ساده / ریچ‌تکست
  'checklist',  -- چک‌لیست
  'table',      -- جدول
  'code',       -- کد
  'image',      -- تصویر
  'audio',      -- ضبط صدا
  'drawing'     -- نقاشی دستی
);

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  folder_id   uuid references public.folders (id) on delete set null,
  type        public.note_type not null default 'text',
  title       text not null default '',
  content     jsonb,
  plain_text  text not null default '',
  color       text,
  is_pinned   boolean not null default false,
  is_archived boolean not null default false,
  is_deleted  boolean not null default false,
  reminder_at timestamptz,
  position    integer not null default 0,
  version     integer not null default 1,
  device_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index notes_user_updated_idx on public.notes (user_id, updated_at);
create index notes_user_live_idx on public.notes (user_id, is_deleted, is_archived, is_pinned);
create index notes_title_trgm_idx on public.notes using gin (title gin_trgm_ops);
create index notes_plain_trgm_idx on public.notes using gin (plain_text gin_trgm_ops);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- تاریخچه‌ی نسخه‌های یادداشت
-- ------------------------------------------------------------
create table public.note_versions (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  version    integer not null,
  title      text not null default '',
  content    jsonb,
  created_at timestamptz not null default now(),
  unique (note_id, version)
);

create index note_versions_user_idx on public.note_versions (user_id, created_at);

-- ------------------------------------------------------------
-- ارتباط یادداشت ↔ تگ
-- ------------------------------------------------------------
create table public.note_tags (
  user_id    uuid not null references auth.users (id) on delete cascade,
  note_id    uuid not null references public.notes (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, tag_id)
);

create index note_tags_tag_idx on public.note_tags (tag_id);

-- ------------------------------------------------------------
-- پیوست‌ها (فایل در Storage)
-- ------------------------------------------------------------
create table public.attachments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  note_id      uuid references public.notes (id) on delete cascade,
  kind         text not null check (kind in ('image', 'audio', 'file')),
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

create index attachments_note_idx on public.attachments (note_id);

-- ------------------------------------------------------------
-- لیست کارها (ماژول مستقل)
-- ------------------------------------------------------------
create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  note_id    uuid references public.notes (id) on delete cascade,
  list_name  text not null default 'default',
  title      text not null,
  done       boolean not null default false,
  priority   smallint not null default 0 check (priority between 0 and 3),
  due_at     timestamptz,
  position   integer not null default 0,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index tasks_user_idx on public.tasks (user_id, done, deleted_at);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- کانبان: تابلو، ستون، کارت
-- ------------------------------------------------------------
create table public.boards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null default 'تابلوی من',
  position   integer not null default 0,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

create table public.board_columns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  board_id   uuid not null references public.boards (id) on delete cascade,
  name       text not null,
  color      text,
  position   integer not null default 0,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index board_columns_board_idx on public.board_columns (board_id, position);

create trigger board_columns_set_updated_at
  before update on public.board_columns
  for each row execute function public.set_updated_at();

create table public.board_cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  column_id  uuid not null references public.board_columns (id) on delete cascade,
  title      text not null,
  body       text,
  due_at     timestamptz,
  position   integer not null default 0,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index board_cards_column_idx on public.board_cards (column_id, position);

create trigger board_cards_set_updated_at
  before update on public.board_cards
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- ردیاب عادت
-- ------------------------------------------------------------
create table public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  icon       text,
  frequency  text not null default 'daily'
             check (frequency in ('daily', 'weekly', 'weekdays', 'custom')),
  target     integer not null default 1,
  archived   boolean not null default false,
  position   integer not null default 0,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create table public.habit_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  entry_date date not null,
  value      numeric not null default 1,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (habit_id, entry_date)
);

create index habit_entries_user_date_idx on public.habit_entries (user_id, entry_date);

create trigger habit_entries_set_updated_at
  before update on public.habit_entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- خاطرات روزانه + حال‌وهوا
-- ------------------------------------------------------------
create table public.journal_days (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  mood       smallint check (mood between 1 and 5),
  weather    text check (weather in ('sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy')),
  text       text not null default '',
  note_id    uuid references public.notes (id) on delete set null,
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, day)
);

create trigger journal_days_set_updated_at
  before update on public.journal_days
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- هزینه‌ها
-- ------------------------------------------------------------
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric(14, 2) not null check (amount >= 0),
  currency    text not null default 'IRR',
  category    text,
  description text,
  paid_at     date not null default current_date,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index expenses_user_date_idx on public.expenses (user_id, paid_at);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- پومودورو
-- ------------------------------------------------------------
create table public.pomodoro_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  mode         text not null default 'focus'
               check (mode in ('focus', 'short_break', 'long_break')),
  duration_min integer not null default 25,
  started_at   timestamptz not null default now(),
  completed    boolean not null default false,
  note_id      uuid references public.notes (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index pomodoro_user_idx on public.pomodoro_sessions (user_id, started_at);

-- ============================================================
-- RLS — هر کاربر فقط داده‌ی خودش
-- ============================================================
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.tags enable row level security;
alter table public.notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.note_tags enable row level security;
alter table public.attachments enable row level security;
alter table public.tasks enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.board_cards enable row level security;
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
alter table public.journal_days enable row level security;
alter table public.expenses enable row level security;
alter table public.pomodoro_sessions enable row level security;

-- پروفایل: فقط خودِ کاربر
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- بقیه‌ی جدول‌ها: user_id = auth.uid()
do $$
declare
  t text;
begin
  foreach t in array array[
    'folders', 'tags', 'notes', 'note_versions', 'note_tags', 'attachments',
    'tasks', 'boards', 'board_columns', 'board_cards',
    'habits', 'habit_entries', 'journal_days', 'expenses', 'pomodoro_sessions'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      'own_rows_' || t,
      t
    );
  end loop;
end $$;

-- ============================================================
-- Storage: باکت پیوست‌ها + RLS مسیر بر اساس uid
-- ============================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_own_all" on storage.objects
  for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Realtime برای یادداشت/پوشه/تگ/کار (زنده بین دستگاه‌ها)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['notes', 'folders', 'tags', 'tasks']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;
