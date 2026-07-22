-- has_role helper
create or replace function has_role(user_id uuid, role_name text)
returns boolean
language sql stable
as $$
  select coalesce(
    (select raw_user_meta_data->>'role' = role_name
     from auth.users where id = user_id),
    false
  );
$$;

-- blog_posts
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  cover_image_url text,
  author_name text not null default 'Mercorama Team',
  status text not null default 'draft',
  category text,
  tags text[],
  featured boolean default false,
  design_blocks jsonb,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blog_posts enable row level security;

create policy "public_read_published" on blog_posts
  for select using (status = 'published');

create policy "admin_all" on blog_posts
  for all using (has_role(auth.uid(), 'admin'));

-- marketing_pages
create table if not exists marketing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  updated_at timestamptz default now()
);

alter table marketing_pages enable row level security;

create policy "public_read_pages" on marketing_pages for select using (true);
create policy "admin_all_pages" on marketing_pages for all using (has_role(auth.uid(), 'admin'));

-- marketing_blocks
create table if not exists marketing_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references marketing_pages(id) on delete cascade,
  type text not null,
  data jsonb not null default '{}',
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table marketing_blocks enable row level security;

create policy "public_read_blocks" on marketing_blocks for select using (true);
create policy "admin_all_blocks" on marketing_blocks for all using (has_role(auth.uid(), 'admin'));

-- seed pages
insert into marketing_pages (slug, title) values
  ('home', 'Home Page'),
  ('pricing', 'Pricing Page')
on conflict (slug) do nothing;
