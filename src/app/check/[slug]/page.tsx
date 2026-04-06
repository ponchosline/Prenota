import { createClient } from '@/lib/supabase/server'
import CheckInClient from './CheckInClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CheckInPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Get comercio by slug
  const { data: comercio } = await supabase
    .from('comercios')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!comercio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2F2F7] to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Comercio no encontrado</h1>
          <p className="text-[var(--color-label-tertiary)]">El código QR no es válido.</p>
        </div>
      </div>
    )
  }

  // Get today's turnos for this comercio
  const today = new Date().toISOString().split('T')[0]
  const { data: turnos } = await supabase
    .from('turnos')
    .select(`
      *,
      cliente:clientes(*),
      servicio:servicios(*),
      personal:personal(*)
    `)
    .eq('comercio_id', comercio.id)
    .eq('fecha', today)
    .in('estado', ['pendiente', 'confirmado', 'en_progreso', 'completado'])
    .order('hora_inicio')

  // Get active prizes for the reward wheel
  const { data: premios } = await supabase
    .from('premios')
    .select('*')
    .eq('comercio_id', comercio.id)
    .eq('activo', true)

  // Get active promotions
  const { data: promociones } = await supabase
    .from('promociones')
    .select('*, servicio:servicios(nombre)')
    .eq('comercio_id', comercio.id)
    .eq('activo', true)

  return (
    <CheckInClient
      comercio={comercio}
      turnos={turnos || []}
      premios={premios || []}
      promociones={promociones || []}
    />
  )
}
