-- =============================================
-- Prenota — QR Check-in & Gamification System
-- =============================================

-- Premios configurables por comercio
CREATE TABLE IF NOT EXISTS premios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text CHECK (tipo IN ('descuento_porcentaje', 'descuento_fijo', 'servicio_gratis', 'puntos_extra', 'producto')) NOT NULL,
  valor numeric, -- porcentaje, monto fijo, multiplicador, etc.
  probabilidad integer DEFAULT 10, -- probabilidad en la ruleta (1-100)
  activo boolean DEFAULT true,
  imagen_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Premios ganados por clientes
CREATE TABLE IF NOT EXISTS premios_ganados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  premio_id uuid REFERENCES premios(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  turno_id uuid REFERENCES turnos(id) ON DELETE SET NULL,
  nombre_premio text NOT NULL,
  canjeado boolean DEFAULT false,
  fecha_canjeado timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Promociones progresivas (ej: 3 cortes = 1 gratis)
CREATE TABLE IF NOT EXISTS promociones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  servicio_id uuid REFERENCES servicios(id) ON DELETE SET NULL,
  cantidad_requerida integer NOT NULL DEFAULT 3, -- cuantos servicios necesita
  premio_descripcion text NOT NULL, -- "4to corte gratis"
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Progreso del cliente en promociones
CREATE TABLE IF NOT EXISTS progreso_promociones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  promocion_id uuid REFERENCES promociones(id) ON DELETE CASCADE NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  cantidad_actual integer DEFAULT 0,
  completada boolean DEFAULT false,
  fecha_completada timestamptz,
  UNIQUE(promocion_id, cliente_id)
);

-- Tokens de check-in (para seguridad del QR)
CREATE TABLE IF NOT EXISTS checkin_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  turno_id uuid REFERENCES turnos(id) ON DELETE CASCADE NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL,
  tipo text CHECK (tipo IN ('checkin', 'checkout')) NOT NULL,
  usado boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL
);
