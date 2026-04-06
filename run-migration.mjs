import pg from 'pg'

const client = new pg.Client({
  host: 'db.epzxbdjahgawyzoiqhpz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BPcadAmkCF5zD6C4',
  ssl: { rejectUnauthorized: false }
})

const statements = [
  // Client notes table for timeline tracking
  `CREATE TABLE IF NOT EXISTS cliente_notas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    contenido text NOT NULL,
    tipo text CHECK (tipo IN ('nota', 'auto')) DEFAULT 'nota',
    created_at timestamptz DEFAULT now() NOT NULL
  )`,
  
  // RLS policies
  `ALTER TABLE cliente_notas ENABLE ROW LEVEL SECURITY`,
  `CREATE POLICY "cliente_notas_select" ON cliente_notas FOR SELECT USING (true)`,
  `CREATE POLICY "cliente_notas_insert" ON cliente_notas FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY "cliente_notas_delete" ON cliente_notas FOR DELETE USING (true)`,
]

try {
  await client.connect()
  console.log('Connected')
  for (const stmt of statements) {
    try {
      await client.query(stmt)
      console.log('✓', stmt.substring(0, 70))
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⏭', stmt.substring(0, 70))
      } else {
        console.log('✗', err.message.substring(0, 100))
      }
    }
  }
  console.log('\n✅ Done!')
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await client.end()
}
