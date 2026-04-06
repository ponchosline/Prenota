import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getComercios } from '@/lib/queries'
import AjustesClient from './AjustesClient'

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

export default async function AjustesPage() {
  const comercio = await getComercioForUser()
  if (!comercio) return <div className="p-8 text-center text-[var(--color-label-tertiary)]">No hay comercios configurados.</div>

  const supabase = await createClient()

  // Get existing premios
  const { data: premios } = await supabase
    .from('premios')
    .select('*')
    .eq('comercio_id', comercio.id)
    .eq('activo', true)
    .order('created_at')

  // Get existing promociones
  const { data: promociones } = await supabase
    .from('promociones')
    .select('*, servicio:servicios(nombre)')
    .eq('comercio_id', comercio.id)
    .eq('activo', true)

  // Get servicios for promo config
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre')
    .eq('comercio_id', comercio.id)
    .eq('activo', true)

  return (
    <AjustesClient
      comercio={comercio}
      premios={premios || []}
      promociones={promociones || []}
      servicios={servicios || []}
    />
  )
}
