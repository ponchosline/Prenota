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
  `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dni text`,
]

try {
  await client.connect()
  console.log('Connected')
  for (const stmt of statements) {
    try {
      await client.query(stmt)
      console.log('✓', stmt.substring(0, 80))
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⏭', stmt.substring(0, 80))
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
