begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama varchar(100) not null check (char_length(trim(nama)) >= 3),
  foto_profil text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kategori (
  id_kategori uuid primary key default gen_random_uuid(),
  id_user uuid not null references public.profiles(id) on delete cascade,
  nama_kategori varchar(100) not null check (trim(nama_kategori) <> ''),
  jenis varchar(20) not null check (jenis in ('pemasukan', 'pengeluaran')),
  target_anggaran numeric(14, 2) not null default 0 check (target_anggaran >= 0),
  warna varchar(7) not null default '#087B68',
  ikon varchar(50),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index kategori_user_nama_jenis_unique
  on public.kategori (id_user, jenis, lower(nama_kategori));

create table public.pemasukan (
  id_pemasukan uuid primary key default gen_random_uuid(),
  id_user uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null default current_date,
  total_pemasukan numeric(14, 2) not null default 0 check (total_pemasukan >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.detail_pemasukan (
  id_detail_masuk uuid primary key default gen_random_uuid(),
  id_pemasukan uuid not null references public.pemasukan(id_pemasukan) on delete cascade,
  id_kategori uuid references public.kategori(id_kategori) on delete set null,
  sumber varchar(150) not null check (trim(sumber) <> ''),
  nominal numeric(14, 2) not null check (nominal > 0),
  catatan text,
  created_at timestamptz not null default now()
);

create table public.pengeluaran (
  id_pengeluaran uuid primary key default gen_random_uuid(),
  id_user uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null default current_date,
  total_pengeluaran numeric(14, 2) not null default 0 check (total_pengeluaran >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.detail_pengeluaran (
  id_detail_keluar uuid primary key default gen_random_uuid(),
  id_pengeluaran uuid not null references public.pengeluaran(id_pengeluaran) on delete cascade,
  id_kategori uuid not null references public.kategori(id_kategori) on delete restrict,
  nominal numeric(14, 2) not null check (nominal > 0),
  deskripsi text,
  created_at timestamptz not null default now()
);

create index kategori_id_user_idx on public.kategori (id_user);
create index pemasukan_user_tanggal_idx on public.pemasukan (id_user, tanggal desc);
create index detail_pemasukan_parent_idx on public.detail_pemasukan (id_pemasukan);
create index pengeluaran_user_tanggal_idx on public.pengeluaran (id_user, tanggal desc);
create index detail_pengeluaran_parent_idx on public.detail_pengeluaran (id_pengeluaran);
create index detail_pengeluaran_kategori_idx on public.detail_pengeluaran (id_kategori);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger kategori_set_updated_at
before update on public.kategori
for each row execute function public.set_updated_at();

create trigger pemasukan_set_updated_at
before update on public.pemasukan
for each row execute function public.set_updated_at();

create trigger pengeluaran_set_updated_at
before update on public.pengeluaran
for each row execute function public.set_updated_at();

create or replace function public.sync_total_pemasukan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_parent uuid;
begin
  current_parent := case when tg_op = 'DELETE' then old.id_pemasukan else new.id_pemasukan end;

  update public.pemasukan
  set total_pemasukan = coalesce((
    select sum(nominal)
    from public.detail_pemasukan
    where id_pemasukan = current_parent
  ), 0)
  where id_pemasukan = current_parent;

  if tg_op = 'UPDATE' and old.id_pemasukan is distinct from new.id_pemasukan then
    update public.pemasukan
    set total_pemasukan = coalesce((
      select sum(nominal)
      from public.detail_pemasukan
      where id_pemasukan = old.id_pemasukan
    ), 0)
    where id_pemasukan = old.id_pemasukan;
  end if;

  return null;
end;
$$;

create trigger detail_pemasukan_sync_total
after insert or update or delete on public.detail_pemasukan
for each row execute function public.sync_total_pemasukan();

create or replace function public.sync_total_pengeluaran()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_parent uuid;
begin
  current_parent := case when tg_op = 'DELETE' then old.id_pengeluaran else new.id_pengeluaran end;

  update public.pengeluaran
  set total_pengeluaran = coalesce((
    select sum(nominal)
    from public.detail_pengeluaran
    where id_pengeluaran = current_parent
  ), 0)
  where id_pengeluaran = current_parent;

  if tg_op = 'UPDATE' and old.id_pengeluaran is distinct from new.id_pengeluaran then
    update public.pengeluaran
    set total_pengeluaran = coalesce((
      select sum(nominal)
      from public.detail_pengeluaran
      where id_pengeluaran = old.id_pengeluaran
    ), 0)
    where id_pengeluaran = old.id_pengeluaran;
  end if;

  return null;
end;
$$;

create trigger detail_pengeluaran_sync_total
after insert or update or delete on public.detail_pengeluaran
for each row execute function public.sync_total_pengeluaran();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Pengguna DuiTrack')
  );

  insert into public.kategori (id_user, nama_kategori, jenis, warna, ikon)
  values
    (new.id, 'Gaji', 'pemasukan', '#087B68', 'briefcase-business'),
    (new.id, 'Bonus', 'pemasukan', '#D99A2B', 'gift'),
    (new.id, 'Lainnya', 'pemasukan', '#5377A6', 'circle-plus'),
    (new.id, 'Makanan', 'pengeluaran', '#D76459', 'utensils'),
    (new.id, 'Transportasi', 'pengeluaran', '#5377A6', 'bus-front'),
    (new.id, 'Tagihan', 'pengeluaran', '#D99A2B', 'receipt-text'),
    (new.id, 'Belanja', 'pengeluaran', '#9A6DB0', 'shopping-bag'),
    (new.id, 'Kesehatan', 'pengeluaran', '#2D8C86', 'heart-pulse'),
    (new.id, 'Hiburan', 'pengeluaran', '#B16A8D', 'gamepad-2'),
    (new.id, 'Lainnya', 'pengeluaran', '#73817E', 'ellipsis');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.kategori enable row level security;
alter table public.pemasukan enable row level security;
alter table public.detail_pemasukan enable row level security;
alter table public.pengeluaran enable row level security;
alter table public.detail_pengeluaran enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "kategori_manage_own"
on public.kategori for all
to authenticated
using (id_user = auth.uid())
with check (id_user = auth.uid());

create policy "pemasukan_manage_own"
on public.pemasukan for all
to authenticated
using (id_user = auth.uid())
with check (id_user = auth.uid());

create policy "detail_pemasukan_manage_own"
on public.detail_pemasukan for all
to authenticated
using (
  exists (
    select 1 from public.pemasukan
    where pemasukan.id_pemasukan = detail_pemasukan.id_pemasukan
      and pemasukan.id_user = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.pemasukan
    where pemasukan.id_pemasukan = detail_pemasukan.id_pemasukan
      and pemasukan.id_user = auth.uid()
  )
);

create policy "pengeluaran_manage_own"
on public.pengeluaran for all
to authenticated
using (id_user = auth.uid())
with check (id_user = auth.uid());

create policy "detail_pengeluaran_manage_own"
on public.detail_pengeluaran for all
to authenticated
using (
  exists (
    select 1 from public.pengeluaran
    where pengeluaran.id_pengeluaran = detail_pengeluaran.id_pengeluaran
      and pengeluaran.id_user = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.pengeluaran
    where pengeluaran.id_pengeluaran = detail_pengeluaran.id_pengeluaran
      and pengeluaran.id_user = auth.uid()
  )
);

create or replace view public.ringkasan_bulanan
with (security_invoker = true)
as
select
  id_user,
  periode,
  sum(total_pemasukan)::numeric(14, 2) as total_pemasukan,
  sum(total_pengeluaran)::numeric(14, 2) as total_pengeluaran,
  (sum(total_pemasukan) - sum(total_pengeluaran))::numeric(14, 2) as saldo
from (
  select
    id_user,
    date_trunc('month', tanggal)::date as periode,
    total_pemasukan,
    0::numeric as total_pengeluaran
  from public.pemasukan
  union all
  select
    id_user,
    date_trunc('month', tanggal)::date as periode,
    0::numeric as total_pemasukan,
    total_pengeluaran
  from public.pengeluaran
) as transaksi_bulanan
group by id_user, periode;

revoke all on public.profiles from anon;
revoke all on public.kategori from anon;
revoke all on public.pemasukan from anon;
revoke all on public.detail_pemasukan from anon;
revoke all on public.pengeluaran from anon;
revoke all on public.detail_pengeluaran from anon;
revoke all on public.ringkasan_bulanan from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.kategori to authenticated;
grant select, insert, update, delete on public.pemasukan to authenticated;
grant select, insert, update, delete on public.detail_pemasukan to authenticated;
grant select, insert, update, delete on public.pengeluaran to authenticated;
grant select, insert, update, delete on public.detail_pengeluaran to authenticated;
grant select on public.ringkasan_bulanan to authenticated;

commit;
