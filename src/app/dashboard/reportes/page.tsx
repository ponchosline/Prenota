import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios } from '@/lib/queries'
import ReportesClient from '@/components/dashboard/ReportesClient'

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

export default async function ReportesPage() {
  const comercio = await getComercioForUser()
  if (!comercio) return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>

  const supabase = await createClient()

  // Get all turnos for the last 90 days (max period)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
  const { data: turnos } = await supabase
    .from('turnos')
    .select('id, fecha, hora_inicio, hora_fin, estado, precio_cobrado, cliente:clientes(nombre, telefono), servicio:servicios(nombre, precio), personal:personal(nombre)')
    .eq('comercio_id', comercio.id)
    .gte('fecha', ninetyDaysAgo)
    .neq('notas', '__sistema: cliente creado manualmente__')
    .order('fecha', { ascending: false })

  return (
    <ReportesClient
      comercioId={comercio.id}
      comercioNombre={comercio.nombre}
      comercioDireccion={comercio.direccion}
      turnos={(turnos || []) as any}
    />
  )
}
