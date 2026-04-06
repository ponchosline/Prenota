const { createClient } = require('@supabase/supabase-js');

async function createDemoUsers() {
  // Admin client with service_role for creating users
  const supabase = createClient(
    'https://epzxbdjahgawyzoiqhpz.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    { email: 'admin@esteticaharmony.com', businessSlug: 'estetica-harmony', staffName: 'Dra. Sofía Martínez' },
    { email: 'admin@barberking.com', businessSlug: 'barberking', staffName: 'Matías Gómez' },
    { email: 'admin@wellnesszen.com', businessSlug: 'wellness-zen', staffName: 'Lucía Fernández' },
  ];

  for (const u of users) {
    console.log(`\nCreating user: ${u.email}...`);
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'demo123456',
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error(`  Error creating auth user: ${authError.message}`);
      continue;
    }

    const userId = authData.user.id;
    console.log(`  ✅ Auth user created: ${userId}`);

    // Find the corresponding business
    const { data: comercio } = await supabase
      .from('comercios')
      .select('id, nombre')
      .eq('slug', u.businessSlug)
      .single();

    if (!comercio) {
      console.error(`  ❌ Business ${u.businessSlug} not found`);
      continue;
    }

    // Find the staff record by name and link to user
    const { data: staff, error: staffError } = await supabase
      .from('personal')
      .update({ user_id: userId })
      .eq('comercio_id', comercio.id)
      .eq('nombre', u.staffName)
      .select()
      .single();

    if (staffError) {
      console.error(`  ❌ Error linking staff: ${staffError.message}`);
    } else {
      console.log(`  ✅ Linked to ${comercio.nombre} as ${staff.nombre} (${staff.rol})`);
    }
  }

  // Also create a superadmin that can see all businesses
  console.log(`\nCreating superadmin...`);
  const { data: superAdmin, error: superError } = await supabase.auth.admin.createUser({
    email: 'admin@prenota.com',
    password: 'demo123456',
    email_confirm: true,
  });

  if (superError) {
    console.error(`  Error: ${superError.message}`);
  } else {
    console.log(`  ✅ Superadmin created: admin@prenota.com (can see all businesses)`);
  }

  console.log('\n========================================');
  console.log('DEMO ACCOUNTS READY');
  console.log('========================================');
  console.log('');
  console.log('  admin@esteticaharmony.com  → Estética Harmony (VIP)');
  console.log('  admin@barberking.com       → BarberKing (PRO)');
  console.log('  admin@wellnesszen.com      → Wellness Zen (Básico)');
  console.log('  admin@prenota.com          → Superadmin (ve todo)');
  console.log('');
  console.log('  Password para todas: demo123456');
}

createDemoUsers().catch(console.error);
