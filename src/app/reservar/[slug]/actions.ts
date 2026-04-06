'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearReservaPublica(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const servicioId = formData.get('servicio_id') as string
  const personalId = formData.get('personal_id') as string
  const fecha = formData.get('fecha') as string
  const horaInicio = formData.get('hora_inicio') as string
  const horaFin = formData.get('hora_fin') as string
  const clienteNombre = formData.get('cliente_nombre') as string
  const clienteTelefono = formData.get('cliente_telefono') as string
  const clienteEmail = formData.get('cliente_email') as string
  const clienteDni = formData.get('cliente_dni') as string

  // Find or create client by phone
  let clienteId: string | null = null

  if (clienteTelefono) {
    const { data: existing } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', clienteTelefono)
      .limit(1)
      .single()

    if (existing) {
      clienteId = existing.id
      // Update name/email if provided
      await supabase.from('clientes').update({
        nombre: clienteNombre,
        ...(clienteEmail ? { email: clienteEmail } : {}),
        ...(clienteDni ? { dni: clienteDni } : {}),
      }).eq('id', clienteId)
    }
  }

  if (!clienteId) {
    const { data: newCliente } = await supabase
      .from('clientes')
      .insert({
        nombre: clienteNombre,
        telefono: clienteTelefono || null,
        email: clienteEmail || null,
        dni: clienteDni || null,
        puntos_fidelizacion: 0,
      })
      .select('id')
      .single()
    clienteId = newCliente?.id || null
  }

  // Create turno
  const { data: turno, error } = await supabase
    .from('turnos')
    .insert({
      comercio_id: comercioId,
      cliente_id: clienteId,
      servicio_id: servicioId,
      personal_id: personalId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'pendiente',
      precio_cobrado: null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Add loyalty points
  if (clienteId) {
    await supabase.from('reward_transacciones').insert({
      cliente_id: clienteId,
      turno_id: turno.id,
      comercio_id: comercioId,
      puntos: 10,
      tipo: 'ganar',
      descripcion: 'Reserva online',
    })
    await supabase.rpc('increment_puntos', { cliente_id_input: clienteId, amount: 10 }).catch(() => {
      // RPC might not exist, try manual update
      supabase.from('clientes').update({
        puntos_fidelizacion: 10
      }).eq('id', clienteId)
    })
  }

  revalidatePath('/dashboard')
  return { success: true, turnoId: turno.id }
}
