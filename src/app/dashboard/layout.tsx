import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getComercios } from '@/lib/queries'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: personalRecords } = await supabase
    .from('personal')
    .select('comercio_id')
    .eq('user_id', user.id)

  const comercioIds = personalRecords?.map(p => p.comercio_id) || []
  let comercios = await getComercios()

  if (comercioIds.length > 0) {
    comercios = comercios.filter(c => comercioIds.includes(c.id))
  }

  if (comercios.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center max-w-sm px-4">
          <h2 className="text-xl font-bold mb-2">Sin comercio asociado</h2>
          <p className="text-[var(--color-label-tertiary)] text-sm">
            Tu cuenta ({user.email}) no está vinculada a ningún comercio todavía.
          </p>
        </div>
      </div>
    )
  }

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const activeSlug = cookieStore.get('prenota_comercio')?.value
  const comercioActivo = comercios.find(c => c.slug === activeSlug) || comercios[0]

  return (
    <DashboardShell
      comercioActivo={comercioActivo}
      comercios={comercios}
      userEmail={user.email || ''}
    >
      {children}
    </DashboardShell>
  )
}
