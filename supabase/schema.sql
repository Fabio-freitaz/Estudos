create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null,
    email text not null,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.materials (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null,
    file_name text not null,
    storage_path text not null,
    pdf_size bigint not null default 0,
    extracted_text text,
    summary text,
    status text not null default 'uploaded',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    question_count integer not null default 10
);

create table if not exists public.topics (
    id uuid primary key default uuid_generate_v4 (),
    material_id uuid not null references public.materials (id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.questions (
    id uuid primary key default uuid_generate_v4 (),
    material_id uuid not null references public.materials (id) on delete cascade,
    question text not null,
    type text not null default 'multiple_choice',
    options jsonb,
    correct_answer text,
    explanation text,
    created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references auth.users (id) on delete cascade,
    material_id uuid not null references public.materials (id) on delete cascade,
    total_questions integer not null default 0,
    correct_answers integer not null default 0,
    score numeric(5, 2) not null default 0,
    completed_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
    id uuid primary key default uuid_generate_v4 (),
    attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
    question_id uuid not null references public.questions (id) on delete cascade,
    selected_answer text,
    correct_answer text,
    is_correct boolean not null default false,
    explanation text,
    created_at timestamptz not null default now()
);

create table if not exists public.daily_usage (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references auth.users (id) on delete cascade,
    usage_date date not null,
    analyses_used integer not null default 0,
    created_at timestamptz not null default now(),
    unique (user_id, usage_date)
);

create index if not exists idx_materials_user_id on public.materials (user_id);

create index if not exists idx_questions_material_id on public.questions (material_id);

create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts (user_id);

create index if not exists idx_quiz_attempts_material_id on public.quiz_attempts (material_id);

create index if not exists idx_daily_usage_user_id on public.daily_usage (user_id);

alter table public.profiles enable row level security;

alter table public.materials enable row level security;

alter table public.topics enable row level security;

alter table public.questions enable row level security;

alter table public.quiz_attempts enable row level security;

alter table public.quiz_answers enable row level security;

alter table public.daily_usage enable row level security;

create policy "Profiles are viewable by owner" on public.profiles for
select using (auth.uid () = id);

create policy "Users can insert their own profile" on public.profiles for
insert
with
    check (auth.uid () = id);

create policy "Users can update their own profile" on public.profiles for
update using (auth.uid () = id)
with
    check (auth.uid () = id);

create policy "Users can view their own materials" on public.materials for
select using (auth.uid () = user_id);

create policy "Users can insert their own materials" on public.materials for
insert
with
    check (auth.uid () = user_id);

create policy "Users can update their own materials" on public.materials for
update using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

create policy "Users can delete their own materials" on public.materials for delete using (auth.uid () = user_id);

create policy "Users can view topics of their own materials" on public.topics for
select using (
        exists (
            select 1
            from public.materials m
            where
                m.id = topics.material_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Users can insert topics for their own materials" on public.topics for
insert
with
    check (
        exists (
            select 1
            from public.materials m
            where
                m.id = topics.material_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Users can view their own questions" on public.questions for
select using (
        exists (
            select 1
            from public.materials m
            where
                m.id = questions.material_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Users can insert questions for their own materials" on public.questions for
insert
with
    check (
        exists (
            select 1
            from public.materials m
            where
                m.id = questions.material_id
                and m.user_id = auth.uid ()
        )
    );

create policy "Users can view their own quiz attempts" on public.quiz_attempts for
select using (auth.uid () = user_id);

create policy "Users can insert their own quiz attempts" on public.quiz_attempts for
insert
with
    check (auth.uid () = user_id);

create policy "Users can view their own quiz answers" on public.quiz_answers for
select using (
        exists (
            select 1
            from public.quiz_attempts a
            where
                a.id = quiz_answers.attempt_id
                and a.user_id = auth.uid ()
        )
    );

create policy "Users can insert their own quiz answers" on public.quiz_answers for
insert
with
    check (
        exists (
            select 1
            from public.quiz_attempts a
            where
                a.id = quiz_answers.attempt_id
                and a.user_id = auth.uid ()
        )
    );

create policy "Users can view their own daily analysis usage" on public.daily_usage for
select using (auth.uid () = user_id);

create policy "Users can insert their own daily usage" on public.daily_usage for
insert
with
    check (auth.uid () = user_id);

create policy "Users can update their own daily usage" on public.daily_usage for
update using (auth.uid () = user_id)
with
    check (auth.uid () = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();