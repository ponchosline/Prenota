'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========== PERSONAL ==========

export async function crearPersonal(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const especialidad = formData.get('especialidad') as string
  const rol = formData.get('rol') as string
  const avatarUrl = formData.get('avatar_url') as string
  const servicioIds = formData.getAll('servicio_ids') as string[]

  const { data: staff, error } = await supabase
    .from('personal')
    .insert({
      comercio_id: comercioId,
      nombre,
      email: email || null,
      telefono: telefono || null,
      especialidad: especialidad || null,
      rol: rol || 'staff',
      avatar_url: avatarUrl || null,
      activo: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Link services
  if (servicioIds.length > 0 && staff) {
    const links = servicioIds.map(sid => ({
      personal_id: staff.id,
      servicio_id: sid,
    }))
    await supabase.from('personal_servicios').insert(links)
  }

  revalidatePath('/dashboard/equipo')
  return { success: true }
}

export async function editarPersonal(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const especialidad = formData.get('especialidad') as string
  const rol = formData.get('rol') as string
  const avatarUrl = formData.get('avatar_url') as string
  const servicioIds = formData.getAll('servicio_ids') as string[]

  const { error } = await supabase
    .from('personal')
    .update({
      nombre,
      email: email || null,
      telefono: telefono || null,
      especialidad: especialidad || null,
      rol: rol || 'staff',
      avatar_url: avatarUrl || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Update service links: delete all, re-insert
  await supabase.from('personal_servicios').delete().eq('personal_id', id)
  if (servicioIds.length > 0) {
    const links = servicioIds.map(sid => ({
      personal_id: id,
      servicio_id: sid,
    }))
    await supabase.from('personal_servicios').insert(links)
  }

  revalidatePath('/dashboard/equipo')
  return { success: true }
}

export async function eliminarPersonal(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personal')
    .update({ activo: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/equipo')
  return { success: true }
}

// ========== SERVICIOS ==========

export async function crearServicio(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const duracion = parseInt(formData.get('duracion_minutos') as string, 10)
  const precio = parseFloat(formData.get('precio') as string)
  const categoria = formData.get('categoria') as string

  const { error } = await supabase
    .from('servicios')
    .insert({
      comercio_id: comercioId,
      nombre,
      descripcion: descripcion || null,
      duracion_minutos: duracion,
      precio,
      categoria: categoria || null,
      activo: true,
    })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicios')
  return { success: true }
}

export async function editarServicio(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const duracion = parseInt(formData.get('duracion_minutos') as string, 10)
  const precio = parseFloat(formData.get('precio') as string)
  const categoria = formData.get('categoria') as string

  const { error } = await supabase
    .from('servicios')
    .update({
      nombre,
      descripcion: descripcion || null,
      duracion_minutos: duracion,
      precio,
      categoria: categoria || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicios')
  return { success: true }
}

export async function eliminarServicio(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('servicios')
    .update({ activo: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicios')
  return { success: true }
}

// ========== CLIENTES ==========

export async function crearCliente(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const dni = formData.get('dni') as string
  const notas = formData.get('notas') as string

  // Create the client
  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      nombre,
      email: email || null,
      telefono: telefono || null,
      dni: dni || null,
      notas: notas || null,
      puntos_fidelizacion: 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Create a placeholder turno to link client to comercio (invisible, cancelled)
  // This is how we associate clients to comercios
  if (cliente) {
    const { data: servicio } = await supabase
      .from('servicios')
      .select('id')
      .eq('comercio_id', comercioId)
      .limit(1)
      .single()

    const { data: personal } = await supabase
      .from('personal')
      .select('id')
      .eq('comercio_id', comercioId)
      .limit(1)
      .single()

    if (servicio && personal) {
      await supabase.from('turnos').insert({
        comercio_id: comercioId,
        cliente_id: cliente.id,
        servicio_id: servicio.id,
        personal_id: personal.id,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '00:00',
        hora_fin: '00:00',
        estado: 'cancelado',
        notas: '__sistema: cliente creado manualmente__',
        precio_cobrado: 0,
      })
    }
  }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function editarCliente(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const telefono = formData.get('telefono') as string
  const dni = formData.get('dni') as string
  const notas = formData.get('notas') as string
  const puntosStr = formData.get('puntos_fidelizacion') as string
  const puntos = puntosStr ? parseInt(puntosStr, 10) : undefined

  const updateData: Record<string, unknown> = {
    nombre,
    email: email || null,
    telefono: telefono || null,
    dni: dni || null,
    notas: notas || null,
  }
  if (puntos !== undefined) updateData.puntos_fidelizacion = puntos

  const { error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function eliminarCliente(id: string) {
  const supabase = await createClient()
  // Delete all turnos for this client first
  await supabase.from('turnos').delete().eq('cliente_id', id)
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// ========== TURNOS ==========

export async function crearTurno(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const clienteId = formData.get('cliente_id') as string
  const servicioId = formData.get('servicio_id') as string
  const personalId = formData.get('personal_id') as string
  const fecha = formData.get('fecha') as string
  const horaInicio = formData.get('hora_inicio') as string
  const notas = formData.get('notas') as string

  // Calculate hora_fin based on service duration
  const { data: servicio } = await supabase
    .from('servicios')
    .select('duracion_minutos, precio')
    .eq('id', servicioId)
    .single()

  let horaFin = horaInicio
  let precio = 0
  if (servicio) {
    precio = servicio.precio
    const [h, m] = horaInicio.split(':').map(Number)
    const totalMin = h * 60 + m + servicio.duracion_minutos
    horaFin = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  }

  // Handle new client creation inline
  let finalClienteId = clienteId
  const newClienteName = formData.get('new_cliente_name') as string
  const newClientePhone = formData.get('new_cliente_phone') as string
  if (!clienteId && newClienteName) {
    const { data: newCliente } = await supabase
      .from('clientes')
      .insert({
        nombre: newClienteName,
        telefono: newClientePhone || null,
        puntos_fidelizacion: 0,
      })
      .select()
      .single()
    if (newCliente) finalClienteId = newCliente.id
  }

  const { error } = await supabase.from('turnos').insert({
    comercio_id: comercioId,
    cliente_id: finalClienteId || null,
    servicio_id: servicioId,
    personal_id: personalId,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    estado: 'confirmado',
    notas: notas || null,
    precio_cobrado: precio,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function cambiarEstadoTurno(turnoId: string, nuevoEstado: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('turnos')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', turnoId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function eliminarTurno(turnoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('turnos').delete().eq('id', turnoId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
