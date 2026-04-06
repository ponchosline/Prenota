import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios, getClientesByComercio } from '@/lib/queries'
import ClientesClient from '@/components/dashboard/ClientesClient'

export const dynamic = 'force-dynamic'

async function getComercioForUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: personalRecords } = await supabase
    .from('personal')
    .select('comercio_id')
    .eq('user_id', user.id)
  const comercioIds = personalRecords?.map(p => p.comercio_id) || []
  let comercios = await getComercios()
  if (comercioIds.length > 0) {
    comercios = comercios.filter(c => comercioIds.includes(c.id))
  }
  if (comercios.length === 0) return null
  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('prenota_comercio')?.value
  return comercios.find(c => c.slug === activeSlug) || comercios[0]
}

export default async function ClientesPage() {
  const comercio = await getComercioForUser()
  if (!comercio) return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>

  const supabase = await createClient()
  const clientes = await getClientesByComercio(comercio.id)

  const clienteIds = clientes.map(c => c.id)
  const rewardMap: Record<string, number> = {}
  const lastVisitMap: Record<string, string> = {}
  const turnoCountMap: Record<string, number> = {}

  if (clienteIds.length > 0) {
    // Use puntos_fidelizacion from clientes directly
    for (const c of clientes) {
      rewardMap[c.id] = c.puntos_fidelizacion || 0
    }

    // Last visit
    const { data: lastVisits } = await supabase
      .from('turnos')
      .select('cliente_id, fecha')
      .eq('comercio_id', comercio.id)
      .in('cliente_id', clienteIds)
      .neq('notas', '__sistema: cliente creado manualmente__')
      .order('fecha', { ascending: false })
    if (lastVisits) {
      for (const v of lastVisits) {
        if (v.cliente_id && !lastVisitMap[v.cliente_id]) {
          lastVisitMap[v.cliente_id] = v.fecha
        }
      }
    }

    // Turno count
    const { data: turnoCounts } = await supabase
      .from('turnos')
      .select('cliente_id')
      .eq('comercio_id', comercio.id)
      .in('cliente_id', clienteIds)
      .neq('notas', '__sistema: cliente creado manualmente__')
    if (turnoCounts) {
      for (const t of turnoCounts) {
        if (t.cliente_id) {
          turnoCountMap[t.cliente_id] = (turnoCountMap[t.cliente_id] || 0) + 1
        }
      }
    }
  }

  return (
    <ClientesClient
      comercioId={comercio.id}
      clientes={clientes}
      rewardMap={rewardMap}
      lastVisitMap={lastVisitMap}
      turnoCountMap={turnoCountMap}
    />
  )
}
