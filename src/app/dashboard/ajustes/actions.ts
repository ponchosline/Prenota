'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPremio(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const tipo = formData.get('tipo') as string
  const valor = parseFloat(formData.get('valor') as string)
  const probabilidad = parseInt(formData.get('probabilidad') as string, 10)

  const { error } = await supabase.from('premios').insert({
    comercio_id: comercioId,
    nombre,
    descripcion: descripcion || null,
    tipo,
    valor,
    probabilidad: Math.min(Math.max(probabilidad, 1), 100),
    activo: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/ajustes')
  return { success: true }
}

export async function eliminarPremio(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('premios')
    .update({ activo: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/ajustes')
  return { success: true }
}

export async function crearPromocion(formData: FormData) {
  const supabase = await createClient()
  const comercioId = formData.get('comercio_id') as string
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string
  const servicioId = formData.get('servicio_id') as string
  const cantidadRequerida = parseInt(formData.get('cantidad_requerida') as string, 10)
  const premioDescripcion = formData.get('premio_descripcion') as string

  const { error } = await supabase.from('promociones').insert({
    comercio_id: comercioId,
    nombre,
    descripcion: descripcion || null,
    servicio_id: servicioId || null,
    cantidad_requerida: cantidadRequerida,
    premio_descripcion: premioDescripcion,
    activo: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/ajustes')
  return { success: true }
}

export async function eliminarPromocion(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('promociones')
    .update({ activo: false })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/ajustes')
  return { success: true }
}
