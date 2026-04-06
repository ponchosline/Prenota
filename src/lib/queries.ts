import { createClient } from '@/lib/supabase/server'
import type { Comercio, Personal, Servicio, Turno, Cliente } from '@/types/database'

// ==========================================
// Comercios
// ==========================================
export async function getComercios() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comercios')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data as Comercio[]
}

export async function getComercioBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comercios')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data as Comercio
}

export async function getComercioById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comercios')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Comercio
}

// ==========================================
// Personal
// ==========================================
export async function getPersonalByComercio(comercioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personal')
    .select('*')
    .eq('comercio_id', comercioId)
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data as Personal[]
}

// ==========================================
// Servicios
// ==========================================
export async function getServiciosByComercio(comercioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('comercio_id', comercioId)
    .eq('activo', true)
    .order('orden')
  if (error) throw error
  return data as Servicio[]
}

// ==========================================
// Turnos
// ==========================================
export async function getTurnosHoy(comercioId: string) {
  const today = new Date().toISOString().split('T')[0]
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('turnos')
    .select(`
      *,
      cliente:clientes(*),
      servicio:servicios(*),
      personal:personal(*)
    `)
    .eq('comercio_id', comercioId)
    .eq('fecha', today)
    .order('hora_inicio')
  if (error) throw error
  return data as (Turno & { cliente: Cliente; servicio: Servicio; personal: Personal })[]
}

export async function getTurnosByPersonalHoy(comercioId: string) {
  const turnos = await getTurnosHoy(comercioId)
  // Agrupar por personal_id
  const grouped: Record<string, typeof turnos> = {}
  for (const turno of turnos) {
    if (!grouped[turno.personal_id]) grouped[turno.personal_id] = []
    grouped[turno.personal_id].push(turno)
  }
  return grouped
}

// ==========================================
// Stats del Dashboard
// ==========================================
export async function getDashboardStats(comercioId: string) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const supabase = await createClient()

  // Turnos hoy
  const { count: turnosHoy } = await supabase
    .from('turnos')
    .select('*', { count: 'exact', head: true })
    .eq('comercio_id', comercioId)
    .eq('fecha', today)

  // Turnos ayer
  const { count: turnosAyer } = await supabase
    .from('turnos')
    .select('*', { count: 'exact', head: true })
    .eq('comercio_id', comercioId)
    .eq('fecha', yesterday)

  // Facturación hoy (turnos completados + confirmados)
  const { data: turnosConPrecio } = await supabase
    .from('turnos')
    .select('precio_cobrado')
    .eq('comercio_id', comercioId)
    .eq('fecha', today)
    .in('estado', ['completado', 'confirmado', 'en_progreso'])

  const facturacionHoy = turnosConPrecio?.reduce((sum, t) => sum + (Number(t.precio_cobrado) || 0), 0) || 0

  // Facturación semana pasada (para comparación)
  const { data: turnosSemana } = await supabase
    .from('turnos')
    .select('precio_cobrado')
    .eq('comercio_id', comercioId)
    .gte('fecha', weekAgo)
    .lte('fecha', today)
    .in('estado', ['completado', 'confirmado', 'en_progreso'])

  const facturacionSemana = turnosSemana?.reduce((sum, t) => sum + (Number(t.precio_cobrado) || 0), 0) || 0

  // Clientes nuevos este mes (contamos turnos únicos por cliente)
  const { data: clientesMes } = await supabase
    .from('turnos')
    .select('cliente_id')
    .eq('comercio_id', comercioId)
    .gte('fecha', monthStart)

  const clientesUnicos = new Set(clientesMes?.map(t => t.cliente_id).filter(Boolean)).size

  // Puntos otorgados hoy
  const { data: rewardsHoy } = await supabase
    .from('reward_transacciones')
    .select('puntos')
    .eq('comercio_id', comercioId)
    .eq('tipo', 'ganar')

  const puntosTotal = rewardsHoy?.reduce((sum, r) => sum + r.puntos, 0) || 0

  return {
    turnosHoy: turnosHoy || 0,
    turnosAyer: turnosAyer || 0,
    facturacionHoy,
    facturacionSemana,
    clientesNuevosMes: clientesUnicos,
    puntosOtorgados: puntosTotal,
  }
}

// ==========================================
// Clientes
// ==========================================
export async function getClientesByComercio(comercioId: string) {
  const supabase = await createClient()
  // Obtener clientes que tienen turnos en este comercio
  const { data: turnos } = await supabase
    .from('turnos')
    .select('cliente_id')
    .eq('comercio_id', comercioId)

  const clienteIds = [...new Set(turnos?.map(t => t.cliente_id).filter(Boolean))]
  if (clienteIds.length === 0) return []

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .in('id', clienteIds)
    .order('nombre')
  if (error) throw error
  return data as Cliente[]
}
