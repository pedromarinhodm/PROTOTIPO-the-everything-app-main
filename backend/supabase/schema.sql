create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  codigo text not null unique,
  descricao text not null,
  unidade text not null default '',
  descricao_complementar text not null default '',
  validade text not null default '',
  fornecedor text not null default '',
  numero_processo text not null default '',
  observacoes text not null default '',
  nota_fiscal_id text,
  nota_fiscal_filename text,
  setor text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movements (
  id text primary key default gen_random_uuid()::text,
  produto_id text not null references public.products(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade integer not null check (quantidade > 0),
  data timestamptz not null default now(),
  servidor_almoxarifado text not null,
  setor_responsavel text,
  servidor_retirada text,
  observacoes text,
  setor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formularios_files (
  id text primary key default gen_random_uuid()::text,
  storage_path text unique,
  filename text not null,
  data_inicial date,
  data_final date,
  content_type text not null default 'application/pdf',
  size_bytes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_files (
  id text primary key default gen_random_uuid()::text,
  produto_id text references public.products(id) on delete set null,
  tipo text not null default 'nota_fiscal',
  storage_path text unique,
  filename text not null,
  content_type text not null default 'application/pdf',
  size_bytes integer not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row
execute function public.touch_updated_at();

drop trigger if exists movements_touch_updated_at on public.movements;
create trigger movements_touch_updated_at
before update on public.movements
for each row
execute function public.touch_updated_at();

create index if not exists movements_produto_id_idx on public.movements(produto_id);
create index if not exists movements_tipo_idx on public.movements(tipo);
create index if not exists movements_data_idx on public.movements(data desc);
create index if not exists products_descricao_idx on public.products(descricao);
create index if not exists products_codigo_idx on public.products(codigo);

-- Enable Row Level Security (RLS) on all tables
alter table public.products enable row level security;
alter table public.movements enable row level security;
alter table public.formularios_files enable row level security;
alter table public.product_files enable row level security;

-- Create policies for authenticated access (service_role bypasses RLS)
-- Allow all operations for service_role (backend)
create policy "Allow all for service_role" on public.products
  for all to authenticated using (true) with check (true);

create policy "Allow all for service_role" on public.movements
  for all to authenticated using (true) with check (true);

create policy "Allow all for service_role" on public.formularios_files
  for all to authenticated using (true) with check (true);

create policy "Allow all for service_role" on public.product_files
  for all to authenticated using (true) with check (true);

-- Allow read access for anon (public) if needed
-- create policy "Allow read for anon" on public.products for select to anon using (true);
