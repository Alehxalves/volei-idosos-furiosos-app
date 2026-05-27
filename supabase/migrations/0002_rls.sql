-- Row-level security: viewers leem tudo; admins escrevem.
alter table players      enable row level security;
alter table sessions     enable row level security;
alter table attendances  enable row level security;
alter table constraints  enable row level security;
alter table teams        enable row level security;
alter table team_members enable row level security;
alter table matches      enable row level security;
alter table profiles     enable row level security;

-- read-all (anon + auth): página pública precisa
create policy "read players  any" on players      for select using (true);
create policy "read sessions any" on sessions     for select using (true);
create policy "read attend   any" on attendances  for select using (true);
create policy "read constr   any" on constraints  for select using (true);
create policy "read teams    any" on teams        for select using (true);
create policy "read members  any" on team_members for select using (true);
create policy "read matches  any" on matches      for select using (true);

-- profiles: usuário vê o próprio + admin vê todos
create policy "read own profile"   on profiles for select using (auth.uid() = id or is_admin());
create policy "admin update profile" on profiles for update using (is_admin()) with check (is_admin());

-- writes: somente admin
create policy "admin write players"     on players      for all using (is_admin()) with check (is_admin());
create policy "admin write sessions"    on sessions     for all using (is_admin()) with check (is_admin());
create policy "admin write attendances" on attendances  for all using (is_admin()) with check (is_admin());
create policy "admin write constraints" on constraints  for all using (is_admin()) with check (is_admin());
create policy "admin write teams"       on teams        for all using (is_admin()) with check (is_admin());
create policy "admin write team_mem"    on team_members for all using (is_admin()) with check (is_admin());
create policy "admin write matches"     on matches      for all using (is_admin()) with check (is_admin());
