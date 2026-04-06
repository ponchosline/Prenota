import { createClient } from '@/lib/supabase/server'
import ReservarClient from './ReservarClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ReservarPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id, nombre, slug, direccion, logo_url')
    .eq('slug', slug)
    .single()

  if (!comercio) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2F2F7] to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Comercio no encontrado</h1>
          <p className="text-[var(--color-label-tertiary)]">El link no es válido.</p>
        </div>
      </div>
    )
  }

  const [serviciosRes, personalRes, turnosRes] = await Promise.all([
    supabase.from('servicios').select('id, nombre, duracion_minutos, precio, moneda').eq('comercio_id', comercio.id).eq('activo', true).order('orden'),
    supabase.from('personal').select('id, nombre, especialidad').eq('comercio_id', comercio.id).eq('activo', true).order('nombre'),
    supabase.from('turnos').select('personal_id, fecha, hora_inicio, hora_fin')
      .eq('comercio_id', comercio.id)
      .gte('fecha', new Date().toISOString().split('T')[0])
      .in('estado', ['pendiente', 'confirmado', 'en_progreso']),
  ])

  return (
    <ReservarClient
      comercio={comercio}
      servicios={(serviciosRes.data || []) as any}
      personal={(personalRes.data || []) as any}
      turnosExistentes={(turnosRes.data || []) as any}
    />
  )
}
