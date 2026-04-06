// =============================================
// Prenota — Tipos TypeScript de la Base de Datos
// =============================================

export type Plan = 'basico' | 'pro' | 'vip'
export type PlanStatus = 'active' | 'trialing' | 'past_due' | 'cancelled'
export type RolPersonal = 'admin' | 'staff'
export type EstadoTurno = 'pendiente' | 'confirmado' | 'en_progreso' | 'completado' | 'cancelado' | 'no_show'
export type TipoReward = 'ganar' | 'canjear'
export type ProveedorPago = 'stripe' | 'mercadopago'

export interface Comercio {
  id: string
  nombre: string
  slug: string
  email: string | null
  telefono: string | null
  direccion: string | null
  logo_url: string | null
  timezone: string
  plan: Plan
  plan_status: PlanStatus
  created_at: string
  updated_at: string
}

export interface HorarioComercio {
  id: string
  comercio_id: string
  dia_semana: number // 0=Dom, 6=Sáb
  hora_apertura: string
  hora_cierre: string
  cerrado: boolean
}

export interface Personal {
  id: string
  comercio_id: string
  user_id: string | null
  nombre: string
  email: string | null
  telefono: string | null
  avatar_url: string | null
  especialidad: string | null
  rol: RolPersonal
  activo: boolean
  created_at: string
}

export interface HorarioPersonal {
  id: string
  personal_id: string
  dia_semana: number
  hora_entrada: string
  hora_salida: string
  descanso_inicio: string | null
  descanso_fin: string | null
  trabaja: boolean
}

export interface Servicio {
  id: string
  comercio_id: string
  nombre: string
  descripcion: string | null
  duracion_minutos: number
  precio: number
  moneda: string
  activo: boolean
  orden: number
  created_at: string
}

export interface PersonalServicio {
  id: string
  personal_id: string
  servicio_id: string
}

export interface Cliente {
  id: string
  user_id: string | null
  nombre: string
  email: string | null
  telefono: string | null
  avatar_url: string | null
  puntos_fidelizacion: number
  created_at: string
}

export interface Turno {
  id: string
  comercio_id: string
  cliente_id: string | null
  servicio_id: string
  personal_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoTurno
  notas: string | null
  precio_cobrado: number | null
  created_at: string
  updated_at: string
}

export interface Suscripcion {
  id: string
  comercio_id: string
  plan: Plan
  status: PlanStatus
  proveedor_pago: ProveedorPago | null
  external_id: string | null
  periodo_inicio: string | null
  periodo_fin: string | null
  created_at: string
}

export interface RewardTransaccion {
  id: string
  cliente_id: string
  turno_id: string | null
  comercio_id: string
  puntos: number
  tipo: TipoReward
  descripcion: string | null
  created_at: string
}

// Tipos extendidos para joins comunes
export interface TurnoConDetalles extends Turno {
  cliente?: Cliente
  servicio?: Servicio
  personal?: Personal
}

export interface PersonalConServicios extends Personal {
  servicios?: Servicio[]
}
