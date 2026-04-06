import pg from 'pg'

const client = new pg.Client({
  host: 'db.epzxbdjahgawyzoiqhpz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BPcadAmkCF5zD6C4',
  ssl: { rejectUnauthorized: false }
})

try {
  await client.connect()

  // Get comercio IDs
  const { rows: comercios } = await client.query("SELECT id, slug, nombre FROM comercios")
  console.log('Comercios:', comercios.map(c => `${c.slug} (${c.id})`).join(', '))

  for (const c of comercios) {
    // Add premios for each comercio
    const premios = [
      { nombre: '10% OFF', descripcion: '10% de descuento en tu próximo servicio', tipo: 'descuento_porcentaje', valor: 10, prob: 25 },
      { nombre: '20% OFF', descripcion: '20% de descuento en tu próximo servicio', tipo: 'descuento_porcentaje', valor: 20, prob: 10 },
      { nombre: 'Puntos x2', descripcion: 'Doble de puntos en tu próxima visita', tipo: 'puntos_extra', valor: 2, prob: 20 },
      { nombre: 'Servicio GRATIS', descripcion: 'Un servicio básico totalmente gratis', tipo: 'servicio_gratis', valor: 1, prob: 5 },
      { nombre: '$1.000 OFF', descripcion: '$1.000 de descuento en tu próximo turno', tipo: 'descuento_fijo', valor: 1000, prob: 15 },
    ]

    for (const p of premios) {
      await client.query(
        `INSERT INTO premios (comercio_id, nombre, descripcion, tipo, valor, probabilidad) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [c.id, p.nombre, p.descripcion, p.tipo, p.valor, p.prob]
      )
    }
    console.log(`✓ ${c.nombre}: ${premios.length} premios added`)

    // Get first servicio for promo
    const { rows: svcs } = await client.query("SELECT id, nombre FROM servicios WHERE comercio_id=$1 LIMIT 1", [c.id])
    if (svcs.length > 0) {
      await client.query(
        `INSERT INTO promociones (comercio_id, nombre, descripcion, servicio_id, cantidad_requerida, premio_descripcion) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [c.id, 'Promo Fidelización', `Completá ${3} servicios y ganate uno gratis`, svcs[0].id, 3, `4to ${svcs[0].nombre} GRATIS`]
      )
      console.log(`✓ ${c.nombre}: Promo "${svcs[0].nombre} x3 = 4to gratis" created`)
    }

    // Update servicios with categories
    const svcCategories = {
      'estetica-harmony': { facial: ['Limpieza Facial Profunda', 'Microdermoabrasión'], dermatología: ['Consulta Dermatológica'], masajes: ['Masaje Deportivo', 'Masaje Relajante'] },
      'barber-king': { barbería: ['Corte Clásico', 'Corte + Barba', 'Barba Full'], capilar: ['Tratamiento Capilar', 'Color'] },
      'wellness-zen': { bienestar: ['Yoga Individual', 'Meditación Guiada'], masajes: ['Masaje Descontracturante', 'Reflexología'], nutrición: ['Consulta Nutricional'] },
    }
    const cats = svcCategories[c.slug]
    if (cats) {
      for (const [cat, names] of Object.entries(cats)) {
        for (const name of names) {
          await client.query("UPDATE servicios SET categoria=$1 WHERE comercio_id=$2 AND nombre=$3", [cat, c.id, name])
        }
      }
      console.log(`✓ ${c.nombre}: categories assigned`)
    }
  }

  console.log('\n✅ All seed data inserted!')
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await client.end()
}
