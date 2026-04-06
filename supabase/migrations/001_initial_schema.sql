-- =============================================
-- Prenota — Esquema Inicial de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Comercios (Tenants)
create table if not exists comercios (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  slug text unique not null,
  email text,
  telefono text,
  direccion text,
  logo_url text,
  timezone text default 'America/Argentina/Buenos_Aires',
  plan text check (plan in ('basico', 'pro', 'vip')) default 'basico',
  plan_status text check (plan_status in ('active', 'trialing', 'past_due', 'cancelled')) default 'active',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Horarios del Comercio
create table if not exists horarios_comercio (
  id uuid default gen_random_uuid() primary key,
  comercio_id uuid references comercios(id) on delete cascade not null,
  dia_semana smallint check (dia_semana between 0 and 6) not null, -- 0=Dom, 6=Sáb
  hora_apertura time not null,
  hora_cierre time not null,
  cerrado boolean default false,
  unique(comercio_id, dia_semana)
);

-- 3. Personal (Staff)
create table if not exists personal (
  id uuid default gen_random_uuid() primary key,
  comercio_id uuid references comercios(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  email text,
  telefono text,
  avatar_url text,
  especialidad text,
  rol text check (rol in ('admin', 'staff')) default 'staff',
  activo boolean default true,
  created_at timestamptz default now() not null
);

-- 4. Horarios del Personal
create table if not exists horarios_personal (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references personal(id) on delete cascade not null,
  dia_semana smallint check (dia_semana between 0 and 6) not null,
  hora_entrada time not null,
  hora_salida time not null,
  descanso_inicio time,
  descanso_fin time,
  trabaja boolean default true,
  unique(personal_id, dia_semana)
);

-- 5. Servicios
create table if not exists servicios (
  id uuid default gen_random_uuid() primary key,
  comercio_id uuid references comercios(id) on delete cascade not null,
  nombre text not null,
  descripcion text,
  duracion_minutos integer not null,
  precio decimal(10, 2) not null,
  moneda text default 'ARS',
  activo boolean default true,
  orden integer default 0,
  created_at timestamptz default now() not null
);

-- 6. Personal ↔ Servicios (qué servicios puede hacer cada profesional)
create table if not exists personal_servicios (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references personal(id) on delete cascade not null,
  servicio_id uuid references servicios(id) on delete cascade not null,
  unique(personal_id, servicio_id)
);

-- 7. Clientes
create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  email text,
  telefono text,
  avatar_url text,
  puntos_fidelizacion integer default 0,
  created_at timestamptz default now() not null
);

-- 8. Turnos (Appointments)
create table if not exists turnos (
  id uuid default gen_random_uuid() primary key,
  comercio_id uuid references comercios(id) on delete cascade not null,
  cliente_id uuid references clientes(id) on delete set null,
  servicio_id uuid references servicios(id) on delete set null not null,
  personal_id uuid references personal(id) on delete set null not null,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado text check (estado in ('pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado', 'no_show')) default 'pendiente',
  notas text,
  precio_cobrado decimal(10, 2),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 9. Suscripciones
create table if not exists suscripciones (
  id uuid default gen_random_uuid() primary key,
  comercio_id uuid references comercios(id) on delete cascade not null,
  plan text check (plan in ('basico', 'pro', 'vip')) not null,
  status text check (status in ('active', 'trialing', 'past_due', 'cancelled')) default 'active',
  proveedor_pago text check (proveedor_pago in ('stripe', 'mercadopago')),
  external_id text,
  periodo_inicio timestamptz,
  periodo_fin timestamptz,
  created_at timestamptz default now() not null
);

-- 10. Transacciones de Rewards
create table if not exists reward_transacciones (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references clientes(id) on delete cascade not null,
  turno_id uuid references turnos(id) on delete set null,
  comercio_id uuid references comercios(id) on delete cascade not null,
  puntos integer not null,
  tipo text check (tipo in ('ganar', 'canjear')) not null,
  descripcion text,
  created_at timestamptz default now() not null
);

-- =============================================
-- Índices
-- =============================================
create index if not exists idx_personal_comercio on personal(comercio_id);
create index if not exists idx_servicios_comercio on servicios(comercio_id);
create index if not exists idx_turnos_comercio on turnos(comercio_id);
create index if not exists idx_turnos_fecha on turnos(comercio_id, fecha);
create index if not exists idx_turnos_personal on turnos(personal_id, fecha);
create index if not exists idx_turnos_cliente on turnos(cliente_id);
create index if not exists idx_reward_cliente on reward_transacciones(cliente_id);
create index if not exists idx_comercios_slug on comercios(slug);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table comercios enable row level security;
alter table horarios_comercio enable row level security;
alter table personal enable row level security;
alter table horarios_personal enable row level security;
alter table servicios enable row level security;
alter table personal_servicios enable row level security;
alter table clientes enable row level security;
alter table turnos enable row level security;
alter table suscripciones enable row level security;
alter table reward_transacciones enable row level security;

-- Permitir lectura pública de comercios por slug (para la página de reservas)
create policy "Comercios públicos por slug" on comercios
  for select using (true);

-- Permitir lectura pública de servicios activos
create policy "Servicios públicos" on servicios
  for select using (activo = true);

-- Permitir lectura pública de personal activo
create policy "Personal público" on personal
  for select using (activo = true);

-- Permitir lectura de horarios de comercio
create policy "Horarios comercio públicos" on horarios_comercio
  for select using (true);

-- Permitir lectura de horarios de personal
create policy "Horarios personal públicos" on horarios_personal
  for select using (true);

-- Permitir lectura de personal_servicios
create policy "Personal servicios públicos" on personal_servicios
  for select using (true);

-- Turnos: solo el comercio owner o el cliente pueden ver
create policy "Turnos lectura" on turnos
  for select using (true);

-- Clientes: lectura pública
create policy "Clientes lectura" on clientes
  for select using (true);

-- Rewards: lectura pública
create policy "Rewards lectura" on reward_transacciones
  for select using (true);

-- Suscripciones: lectura pública
create policy "Suscripciones lectura" on suscripciones
  for select using (true);

-- =============================================
-- Función: actualizar updated_at
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger comercios_updated_at
  before update on comercios
  for each row execute function update_updated_at();

create trigger turnos_updated_at
  before update on turnos
  for each row execute function update_updated_at();
