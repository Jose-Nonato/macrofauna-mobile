-- Fase 0: fundação do painel administrativo (somente acrescenta estrutura).

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists active boolean not null default true;

-- Verdadeiro quando o usuário logado é um admin ativo.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and active
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Impede que um usuário comum altere o próprio papel ou status.
-- Conexões internas (postgres/service_role) continuam livres.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.role := 'user';
      new.active := true;
    else
      new.role := old.role;
      new.active := old.active;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Registro de ações administrativas.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null default auth.uid(),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "admin le auditoria" on public.audit_log
  for select to authenticated using (public.is_admin());
create policy "admin grava auditoria" on public.audit_log
  for insert to authenticated with check (public.is_admin() and actor_id = auth.uid());
