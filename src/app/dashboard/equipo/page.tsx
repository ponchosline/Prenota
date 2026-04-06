import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios, getPersonalByComercio, getServiciosByComercio, getTurnosHoy } from '@/lib/queries'
import EquipoClient from '@/components/dashboard/EquipoClient'

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

export default async function EquipoPage() {
  const comercio = await getComercioForUser()
  if (!comercio) return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>

  const supabase = await createClient()

  const [personal, servicios, turnos] = await Promise.all([
    getPersonalByComercio(comercio.id),
    getServiciosByComercio(comercio.id),
    getTurnosHoy(comercio.id),
  ])

  // Get personal_servicios links
  const personalIds = personal.map(p => p.id)
  let personalServicios: Record<string, string[]> = {}
  if (personalIds.length > 0) {
    const { data: links } = await supabase
      .from('personal_servicios')
      .select('personal_id, servicio_id')
      .in('personal_id', personalIds)
    if (links) {
      for (const link of links) {
        if (!personalServicios[link.personal_id]) personalServicios[link.personal_id] = []
        personalServicios[link.personal_id].push(link.servicio_id)
      }
    }
  }

  // Count turnos per staff
  const turnoCount: Record<string, number> = {}
  for (const t of turnos) {
    turnoCount[t.personal_id] = (turnoCount[t.personal_id] || 0) + 1
  }

  return (
    <EquipoClient
      personal={personal}
      servicios={servicios}
      personalServicios={personalServicios}
      turnoCount={turnoCount}
      comercioId={comercio.id}
    />
  )
}
