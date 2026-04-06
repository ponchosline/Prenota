import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios, getPersonalByComercio } from '@/lib/queries'
import CalendarioClient from '@/components/dashboard/CalendarioClient'

export const dynamic = 'force-dynamic'

async function getComercioForUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: personalRecords } = await supabase.from('personal').select('comercio_id').eq('user_id', user.id)
  const comercioIds = personalRecords?.map(p => p.comercio_id) || []
  let comercios = await getComercios()
  if (comercioIds.length > 0) comercios = comercios.filter(c => comercioIds.includes(c.id))
  if (comercios.length === 0) return null
  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('prenota_comercio')?.value
  return comercios.find(c => c.slug === activeSlug) || comercios[0]
}

export default async function CalendarioPage() {
  const comercio = await getComercioForUser()
  if (!comercio) return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>

  const supabase = await createClient()
  const personal = await getPersonalByComercio(comercio.id)

  // Get turnos for a wide range (current month ± 1 month)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0]

  const { data: turnos } = await supabase
    .from('turnos')
    .select('id, fecha, hora_inicio, hora_fin, estado, precio_cobrado, cliente:clientes(nombre), servicio:servicios(nombre, duracion_minutos), personal:personal(id, nombre)')
    .eq('comercio_id', comercio.id)
    .gte('fecha', start)
    .lte('fecha', end)
    .neq('notas', '__sistema: cliente creado manualmente__')
    .order('hora_inicio')

  return (
    <CalendarioClient
      comercioId={comercio.id}
      turnos={(turnos || []) as any}
      personal={personal.map(p => ({ id: p.id, nombre: p.nombre }))}
    />
  )
}
