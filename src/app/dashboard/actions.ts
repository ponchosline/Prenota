'use server'

import { cookies } from 'next/headers'

export async function setComercioActivo(slug: string) {
  const cookieStore = await cookies()
  cookieStore.set('prenota_comercio', slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
