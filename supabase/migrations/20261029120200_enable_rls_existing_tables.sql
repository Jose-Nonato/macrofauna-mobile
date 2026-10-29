-- Ativa a RLS nas tabelas já usadas pelo app (aplicado em 2026-10-29).
-- Já existiam as políticas de INSERT e SELECT do dono em profiles/samples;
-- aqui entram UPDATE/DELETE do dono, insect/photos e o acesso total do admin.

-- profiles
create policy "dono atualiza perfil" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono remove perfil" on public.profiles
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "admin gerencia perfis" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- samples
create policy "dono atualiza amostra" on public.samples
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dono remove amostra" on public.samples
  for delete to authenticated using (user_id = (select auth.uid()));
create policy "admin gerencia amostras" on public.samples
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- insect (contagens por profundidade) e photos: acesso via dono da amostra
create policy "dono gerencia contagens" on public.insect
  for all to authenticated
  using (exists (select 1 from public.samples s where s.id = insect.sample_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.samples s where s.id = insect.sample_id and s.user_id = (select auth.uid())));
create policy "admin gerencia contagens" on public.insect
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "dono gerencia fotos" on public.photos
  for all to authenticated
  using (exists (select 1 from public.samples s where s.id = photos.sample_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.samples s where s.id = photos.sample_id and s.user_id = (select auth.uid())));
create policy "admin gerencia fotos" on public.photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.profiles enable row level security;
alter table public.samples enable row level security;
alter table public.insect enable row level security;
alter table public.photos enable row level security;
