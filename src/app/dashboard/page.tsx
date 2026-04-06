import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios, getDashboardStats, getPersonalByComercio, getTurnosHoy } from '@/lib/queries'
import StatCard from '@/components/dashboard/StatCard'
import AgendaGrid from '@/components/dashboard/AgendaGrid'
import CollapsibleSection from '@/components/dashboard/CollapsibleSection'

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
  const comercio = comercios.find(c => c.slug === activeSlug) || comercios[0]

  return comercio
}

export default async function DashboardPage() {
  const comercio = await getComercioForUser()

  if (!comercio) {
    return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>
  }

  const [stats, personal, turnos] = await Promise.all([
    getDashboardStats(comercio.id),
    getPersonalByComercio(comercio.id),
    getTurnosHoy(comercio.id),
  ])

  const diffTurnos = stats.turnosHoy - stats.turnosAyer
  const diffLabel =
    diffTurnos > 0
      ? `↑ ${diffTurnos} más que ayer`
      : diffTurnos < 0
      ? `↓ ${Math.abs(diffTurnos)} menos que ayer`
      : 'Igual que ayer'

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <CollapsibleSection title="Resumen del Día">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            label="Turnos Hoy"
            value={String(stats.turnosHoy)}
            delta={diffLabel}
            deltaType={diffTurnos >= 0 ? 'up' : 'neutral'}
            accent="mint"
          />
          <StatCard
            label="Facturación"
            value={formatCurrency(stats.facturacionHoy)}
            delta={`${formatCurrency(stats.facturacionSemana)} esta semana`}
            deltaType="up"
            accent="blue"
          />
          <StatCard
            label="Clientes Nuevos"
            value={String(stats.clientesNuevosMes)}
            delta="este mes"
            deltaType="neutral"
            accent="orange"
          />
          <StatCard
            label="Puntos Otorgados"
            value={String(stats.puntosOtorgados)}
            delta={`promedio ${Math.round(stats.puntosOtorgados / Math.max(stats.turnosHoy, 1))}/turno`}
            deltaType="neutral"
            tinted
            accent="purple"
          />
        </div>
      </CollapsibleSection>

      {/* Agenda */}
      <AgendaGrid personal={personal} turnos={turnos} />
    </div>
  )
}
