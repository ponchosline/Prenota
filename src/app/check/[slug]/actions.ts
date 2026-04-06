'use server'

import { createClient } from '@/lib/supabase/server'

export async function checkInTurno(turnoId: string, comercioId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('turnos')
    .update({ estado: 'en_progreso', updated_at: new Date().toISOString() })
    .eq('id', turnoId)
    .eq('comercio_id', comercioId)
    .in('estado', ['pendiente', 'confirmado'])

  if (error) return { error: 'No se pudo realizar el check-in. Intentá de nuevo.' }
  return { success: true }
}

export async function checkOutTurno(turnoId: string, comercioId: string, clienteId: string) {
  const supabase = await createClient()

  const { data: turno } = await supabase
    .from('turnos')
    .select('*, servicio:servicios(*)')
    .eq('id', turnoId)
    .single()

  if (!turno) return { error: 'Turno no encontrado.' }

  // Mark turno as completado
  const { error: updateError } = await supabase
    .from('turnos')
    .update({ estado: 'completado', updated_at: new Date().toISOString() })
    .eq('id', turnoId)
    .eq('comercio_id', comercioId)

  if (updateError) return { error: 'No se pudo completar el turno.' }

  // Calculate points
  const precio = Number(turno.precio_cobrado || turno.servicio?.precio || 0)
  const puntos = Math.max(Math.round(precio / 500), 5)

  // Add reward transaction (this table exists in 001 schema)
  await supabase.from('reward_transacciones').insert({
    cliente_id: clienteId,
    turno_id: turnoId,
    comercio_id: comercioId,
    puntos,
    tipo: 'ganar',
    descripcion: `Check-out: ${turno.servicio?.nombre || 'Servicio'}`,
  })

  // Update cliente points directly (puntos_fidelizacion column on clientes table)
  const { data: cliente } = await supabase
    .from('clientes')
    .select('puntos_fidelizacion')
    .eq('id', clienteId)
    .single()

  if (cliente) {
    await supabase
      .from('clientes')
      .update({ puntos_fidelizacion: (cliente.puntos_fidelizacion || 0) + puntos })
      .eq('id', clienteId)
  }

  // Update progreso_promociones
  const { data: promociones } = await supabase
    .from('promociones')
    .select('*')
    .eq('comercio_id', comercioId)
    .eq('activo', true)

  if (promociones) {
    for (const promo of promociones) {
      if (promo.servicio_id && promo.servicio_id !== turno.servicio_id) continue

      const { data: progreso } = await supabase
        .from('progreso_promociones')
        .select('*')
        .eq('promocion_id', promo.id)
        .eq('cliente_id', clienteId)
        .single()

      if (progreso) {
        const newCount = progreso.cantidad_actual + 1
        const completed = newCount >= promo.cantidad_requerida
        await supabase
          .from('progreso_promociones')
          .update({
            cantidad_actual: completed ? 0 : newCount,
            completada: completed,
            fecha_completada: completed ? new Date().toISOString() : null,
          })
          .eq('id', progreso.id)
      } else {
        await supabase.from('progreso_promociones').insert({
          promocion_id: promo.id,
          cliente_id: clienteId,
          comercio_id: comercioId,
          cantidad_actual: 1,
          completada: false,
        })
      }
    }
  }

  return { success: true, puntos }
}

export async function registrarPremioGanado(
  premioId: string,
  clienteId: string,
  comercioId: string,
  turnoId: string,
  nombrePremio: string
) {
  const supabase = await createClient()

  await supabase.from('premios_ganados').insert({
    premio_id: premioId,
    cliente_id: clienteId,
    comercio_id: comercioId,
    turno_id: turnoId,
    nombre_premio: nombrePremio,
    canjeado: false,
  })

  return { success: true }
}
