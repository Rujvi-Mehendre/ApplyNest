-- ApplyNest Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- APPLICANT PROFILES
-- =============================================
create table if not exists applicant_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null default '',
  email text not null default '',
  phone text,
  gpa numeric(3,2),
  gre_verbal integer,
  gre_quant integer,
  gre_writing numeric(2,1),
  gmat_score integer,
  toefl_score integer,
  ielts_score numeric(3,1),
  undergrad_institution text,
  undergrad_major text,
  undergrad_gpa numeric(3,2),
  work_experience_years integer default 0,
  research_experience text,
  skills text[] default '{}',
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- RESUMES
-- =============================================
create table if not exists resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_url text,
  raw_text text,
  parsed_json jsonb,
  is_primary boolean default false,
  created_at timestamptz default now() not null
);

-- =============================================
-- PROGRAMS (master catalog)
-- =============================================
create table if not exists programs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  university text not null,
  department text,
  degree_type text not null check (degree_type in ('MS', 'PhD', 'MBA', 'MFA', 'MEng', 'MPH', 'Other')),
  location text,
  website text,
  description text,
  created_at timestamptz default now() not null
);

-- =============================================
-- SAVED PROGRAMS (user's application list)
-- =============================================
create table if not exists saved_programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  program_id uuid references programs(id) on delete cascade not null,
  category text not null check (category in ('Reach', 'Target', 'Safer')) default 'Target',
  status text not null check (status in ('planning', 'in_progress', 'submitted', 'accepted', 'rejected', 'withdrawn')) default 'planning',
  deadline date,
  notes text,
  portal_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- PROGRAM REQUIREMENTS
-- =============================================
create table if not exists program_requirements (
  id uuid primary key default uuid_generate_v4(),
  saved_program_id uuid references saved_programs(id) on delete cascade not null,
  requirement_type text not null check (requirement_type in ('transcript', 'test_score', 'lor', 'sop', 'resume', 'portfolio', 'other')) default 'other',
  title text not null,
  description text,
  status text not null check (status in ('not_started', 'needed', 'requested', 'uploaded', 'verified', 'submitted', 'waived', 'not_applicable')) default 'not_started',
  deadline date,
  source_url text,
  source_excerpt text,
  source_type text not null check (source_type in ('official', 'user_entered', 'portal_only', 'scraped')) default 'user_entered',
  confidence_score numeric(3,2) default 1.0 check (confidence_score >= 0 and confidence_score <= 1),
  user_verified boolean default false,
  portal_only boolean default false,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- ESSAY REQUIREMENTS
-- =============================================
create table if not exists essay_requirements (
  id uuid primary key default uuid_generate_v4(),
  saved_program_id uuid references saved_programs(id) on delete cascade not null,
  prompt_text text,
  essay_type text not null check (essay_type in ('sop', 'personal_statement', 'diversity', 'why_school', 'short_answer', 'other')) default 'sop',
  word_limit integer,
  character_limit integer,
  page_limit integer,
  deadline date,
  status text not null check (status in ('not_started', 'outline', 'draft_1', 'revised', 'final', 'submitted')) default 'not_started',
  source_url text,
  source_excerpt text,
  source_type text not null check (source_type in ('official', 'user_entered', 'portal_only', 'scraped')) default 'user_entered',
  confidence_score numeric(3,2) default 1.0,
  user_verified boolean default false,
  portal_only boolean default false,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- ESSAY DRAFTS
-- =============================================
create table if not exists essay_drafts (
  id uuid primary key default uuid_generate_v4(),
  essay_requirement_id uuid references essay_requirements(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null default '',
  word_count integer default 0,
  version_label text not null default 'Draft 1',
  is_current boolean default true,
  created_at timestamptz default now() not null
);

-- =============================================
-- ESSAY DRAFT VERSIONS (history)
-- =============================================
create table if not exists essay_draft_versions (
  id uuid primary key default uuid_generate_v4(),
  essay_draft_id uuid references essay_drafts(id) on delete cascade not null,
  content text not null,
  word_count integer default 0,
  created_at timestamptz default now() not null
);

-- =============================================
-- RECOMMENDATION REQUESTS
-- =============================================
create table if not exists recommendation_requests (
  id uuid primary key default uuid_generate_v4(),
  saved_program_id uuid references saved_programs(id) on delete cascade not null,
  recommender_name text not null,
  recommender_email text,
  recommender_title text,
  institution text,
  relationship text,
  status text not null check (status in ('not_asked', 'asked', 'confirmed', 'submitted', 'waived')) default 'not_asked',
  deadline date,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- APPLICATION TASKS
-- =============================================
create table if not exists application_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  saved_program_id uuid references saved_programs(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- PROGRAM FIT SCORES (mock AI output)
-- =============================================
create table if not exists program_fit_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  saved_program_id uuid references saved_programs(id) on delete cascade not null unique,
  overall_score integer not null,
  gpa_fit integer not null,
  test_score_fit integer not null,
  research_fit integer not null,
  experience_fit integer not null,
  reasoning text,
  generated_at timestamptz default now() not null
);

-- =============================================
-- USER NOTES
-- =============================================
create table if not exists user_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  saved_program_id uuid references saved_programs(id) on delete set null,
  content text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table applicant_profiles enable row level security;
alter table resumes enable row level security;
alter table programs enable row level security;
alter table saved_programs enable row level security;
alter table program_requirements enable row level security;
alter table essay_requirements enable row level security;
alter table essay_drafts enable row level security;
alter table essay_draft_versions enable row level security;
alter table recommendation_requests enable row level security;
alter table application_tasks enable row level security;
alter table program_fit_scores enable row level security;
alter table user_notes enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage their own profile" on applicant_profiles for all using (auth.uid() = user_id);
create policy "Users can manage their own resumes" on resumes for all using (auth.uid() = user_id);
create policy "Programs are readable by all" on programs for select using (true);
create policy "Authenticated users can insert programs" on programs for insert with check (auth.uid() is not null);
create policy "Users can manage their saved programs" on saved_programs for all using (auth.uid() = user_id);

create policy "Users can manage requirements for their programs" on program_requirements for all
  using (exists (select 1 from saved_programs sp where sp.id = saved_program_id and sp.user_id = auth.uid()));

create policy "Users can manage essay requirements for their programs" on essay_requirements for all
  using (exists (select 1 from saved_programs sp where sp.id = saved_program_id and sp.user_id = auth.uid()));

create policy "Users can manage their essay drafts" on essay_drafts for all using (auth.uid() = user_id);

create policy "Users can manage draft versions" on essay_draft_versions for all
  using (exists (select 1 from essay_drafts d where d.id = essay_draft_id and d.user_id = auth.uid()));

create policy "Users can manage rec requests for their programs" on recommendation_requests for all
  using (exists (select 1 from saved_programs sp where sp.id = saved_program_id and sp.user_id = auth.uid()));

create policy "Users can manage their own tasks" on application_tasks for all using (auth.uid() = user_id);
create policy "Users can manage their own fit scores" on program_fit_scores for all using (auth.uid() = user_id);
create policy "Users can manage their own notes" on user_notes for all using (auth.uid() = user_id);

-- =============================================
-- AUTO-UPDATE TIMESTAMPS
-- =============================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on applicant_profiles for each row execute function handle_updated_at();
create trigger set_updated_at before update on saved_programs for each row execute function handle_updated_at();
create trigger set_updated_at before update on program_requirements for each row execute function handle_updated_at();
create trigger set_updated_at before update on essay_requirements for each row execute function handle_updated_at();
create trigger set_updated_at before update on recommendation_requests for each row execute function handle_updated_at();
create trigger set_updated_at before update on application_tasks for each row execute function handle_updated_at();
create trigger set_updated_at before update on user_notes for each row execute function handle_updated_at();

-- =============================================
-- SEED DATA (8 programs)
-- =============================================
insert into programs (id, name, university, department, degree_type, location, website, description) values
  ('a1b2c3d4-0001-0000-0000-000000000001', 'EECS PhD', 'MIT', 'Electrical Engineering & Computer Science', 'PhD', 'Cambridge, MA', 'https://www.eecs.mit.edu/', 'MIT EECS doctoral program — world-leading AI/ML research environment.'),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'Computer Science MS', 'Stanford University', 'Computer Science', 'MS', 'Stanford, CA', 'https://cs.stanford.edu/', 'Stanford CS MS with strengths in AI, systems, and theory.'),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'MCDS', 'Carnegie Mellon University', 'School of Computer Science', 'MS', 'Pittsburgh, PA', 'https://mcds.cs.cmu.edu/', 'Master of Computational Data Science — rigorous ML and data engineering.'),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'MIDS', 'UC Berkeley', 'School of Information', 'MS', 'Berkeley, CA', 'https://ischool.berkeley.edu/programs/mids', 'Master of Information and Data Science — interdisciplinary data program.'),
  ('a1b2c3d4-0005-0000-0000-000000000005', 'MS Computer Science (OMS)', 'Georgia Tech', 'College of Computing', 'MS', 'Atlanta, GA (Online)', 'https://omscs.gatech.edu/', 'Online MS CS — flexible, affordable, highly respected.'),
  ('a1b2c3d4-0006-0000-0000-000000000006', 'MS in Applied Data Science', 'University of Michigan', 'School of Information', 'MS', 'Ann Arbor, MI', 'https://www.si.umich.edu/programs/master-applied-data-science', 'Michigan MADS — applied program with industry partnerships.'),
  ('a1b2c3d4-0007-0000-0000-000000000007', 'MS Align Computer Science', 'Northeastern University', 'Khoury College of Computer Sciences', 'MS', 'Boston, MA', 'https://www.khoury.northeastern.edu/', 'Khoury MS — strong co-op network and industry ties in Boston.'),
  ('a1b2c3d4-0008-0000-0000-000000000008', 'MS in Data Science', 'Boston University', 'Faculty of Computing & Data Sciences', 'MS', 'Boston, MA', 'https://www.bu.edu/cds-faculty/', 'BU DS MS — interdisciplinary with strong connections to biotech and finance.')
on conflict (id) do nothing;
