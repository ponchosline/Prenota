const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected! Seeding database...\n');

  // ==========================================
  // COMERCIO 1: Estética Harmony (Spa & Dermatología)
  // Plan VIP — 3 profesionales, 5 servicios
  // ==========================================
  const { rows: [comercio1] } = await client.query(`
    INSERT INTO comercios (nombre, slug, email, telefono, direccion, plan, plan_status)
    VALUES ('Estética Harmony', 'estetica-harmony', 'contacto@esteticaharmony.com', '+54 11 4555-1234', 'Av. Santa Fe 2450, CABA', 'vip', 'active')
    RETURNING id
  `);
  console.log(`✅ Comercio 1: Estética Harmony (VIP) — ID: ${comercio1.id}`);

  // Horarios Comercio 1 (Lun-Sáb 9:00-20:00, Dom cerrado)
  for (let d = 1; d <= 6; d++) {
    await client.query(`
      INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
      VALUES ($1, $2, '09:00', '20:00', false)
    `, [comercio1.id, d]);
  }
  await client.query(`
    INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
    VALUES ($1, 0, '09:00', '20:00', true)
  `, [comercio1.id]);

  // Personal Comercio 1
  const { rows: [sofia] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Dra. Sofía Martínez', 'sofia@esteticaharmony.com', 'Dermatóloga', 'admin', true)
    RETURNING id
  `, [comercio1.id]);

  const { rows: [juan] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Juan Pérez', 'juan@esteticaharmony.com', 'Kinesiólogo', 'staff', true)
    RETURNING id
  `, [comercio1.id]);

  const { rows: [ana] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Ana López', 'ana@esteticaharmony.com', 'Cosmetóloga', 'staff', true)
    RETURNING id
  `, [comercio1.id]);

  // Horarios Personal Comercio 1 (Lun-Vie)
  for (const pid of [sofia.id, juan.id, ana.id]) {
    for (let d = 1; d <= 5; d++) {
      await client.query(`
        INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, descanso_inicio, descanso_fin, trabaja)
        VALUES ($1, $2, '09:00', '18:00', '13:00', '14:00', true)
      `, [pid, d]);
    }
    // Sábado medio día
    await client.query(`
      INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, trabaja)
      VALUES ($1, 6, '09:00', '13:00', true)
    `, [pid]);
  }

  // Servicios Comercio 1
  const servicios1 = [
    { nombre: 'Limpieza Facial Profunda', desc: 'Limpieza completa con extracción y máscara', duracion: 90, precio: 8500 },
    { nombre: 'Consulta Dermatológica', desc: 'Evaluación y diagnóstico de piel', duracion: 45, precio: 12000 },
    { nombre: 'Masaje Deportivo', desc: 'Masaje profundo para recuperación muscular', duracion: 60, precio: 7000 },
    { nombre: 'Masaje Relajante', desc: 'Masaje suave con aceites esenciales', duracion: 50, precio: 6500 },
    { nombre: 'Microdermoabrasión', desc: 'Exfoliación mecánica para rejuvenecimiento', duracion: 40, precio: 9500 },
  ];
  const svcIds1 = [];
  for (const s of servicios1) {
    const { rows: [svc] } = await client.query(`
      INSERT INTO servicios (comercio_id, nombre, descripcion, duracion_minutos, precio)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [comercio1.id, s.nombre, s.desc, s.duracion, s.precio]);
    svcIds1.push(svc.id);
  }

  // Asignar servicios al personal
  // Sofía: Limpieza, Consulta, Microdermoabrasión
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [sofia.id, svcIds1[0]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [sofia.id, svcIds1[1]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [sofia.id, svcIds1[4]]);
  // Juan: Masaje Deportivo, Masaje Relajante
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [juan.id, svcIds1[2]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [juan.id, svcIds1[3]]);
  // Ana: Limpieza, Microdermoabrasión
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [ana.id, svcIds1[0]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [ana.id, svcIds1[4]]);

  console.log(`   → 3 profesionales, 5 servicios, horarios Lun-Sáb`);

  // ==========================================
  // COMERCIO 2: BarberKing (Barbería)
  // Plan Pro — 2 profesionales, 4 servicios
  // ==========================================
  const { rows: [comercio2] } = await client.query(`
    INSERT INTO comercios (nombre, slug, email, telefono, direccion, plan, plan_status)
    VALUES ('BarberKing', 'barberking', 'info@barberking.com.ar', '+54 11 4888-5678', 'Av. Corrientes 3200, CABA', 'pro', 'active')
    RETURNING id
  `);
  console.log(`\n✅ Comercio 2: BarberKing (Pro) — ID: ${comercio2.id}`);

  // Horarios Comercio 2 (Mar-Sáb 10:00-21:00, Dom-Lun cerrado)
  for (const d of [0, 1]) {
    await client.query(`
      INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
      VALUES ($1, $2, '10:00', '21:00', true)
    `, [comercio2.id, d]);
  }
  for (let d = 2; d <= 6; d++) {
    await client.query(`
      INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
      VALUES ($1, $2, '10:00', '21:00', false)
    `, [comercio2.id, d]);
  }

  // Personal Comercio 2
  const { rows: [matias] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Matías Gómez', 'matias@barberking.com.ar', 'Barbero Senior', 'admin', true)
    RETURNING id
  `, [comercio2.id]);

  const { rows: [nico] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Nicolás Romero', 'nico@barberking.com.ar', 'Barbero', 'staff', true)
    RETURNING id
  `, [comercio2.id]);

  // Horarios Personal Comercio 2 (Mar-Sáb, sin descanso)
  for (const pid of [matias.id, nico.id]) {
    for (let d = 2; d <= 6; d++) {
      await client.query(`
        INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, trabaja)
        VALUES ($1, $2, '10:00', '21:00', true)
      `, [pid, d]);
    }
  }

  // Servicios Comercio 2
  const servicios2 = [
    { nombre: 'Corte de Pelo', desc: 'Corte clásico o moderno', duracion: 30, precio: 4500 },
    { nombre: 'Barba Completa', desc: 'Recorte, delineado y hot towel', duracion: 25, precio: 3500 },
    { nombre: 'Corte + Barba', desc: 'Combo completo', duracion: 50, precio: 7000 },
    { nombre: 'Tratamiento Capilar', desc: 'Keratina y nutrición', duracion: 60, precio: 12000 },
  ];
  const svcIds2 = [];
  for (const s of servicios2) {
    const { rows: [svc] } = await client.query(`
      INSERT INTO servicios (comercio_id, nombre, descripcion, duracion_minutos, precio)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [comercio2.id, s.nombre, s.desc, s.duracion, s.precio]);
    svcIds2.push(svc.id);
  }

  // Ambos barberos hacen todos los servicios
  for (const pid of [matias.id, nico.id]) {
    for (const sid of svcIds2) {
      await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [pid, sid]);
    }
  }
  console.log(`   → 2 profesionales, 4 servicios, horarios Mar-Sáb`);

  // ==========================================
  // COMERCIO 3: Wellness Studio Zen (Yoga & Pilates)
  // Plan Básico — 4 profesionales, 6 servicios
  // ==========================================
  const { rows: [comercio3] } = await client.query(`
    INSERT INTO comercios (nombre, slug, email, telefono, direccion, plan, plan_status)
    VALUES ('Wellness Studio Zen', 'wellness-zen', 'hola@wellnesszen.com', '+54 11 5777-9012', 'Calle Gorriti 4500, Palermo', 'basico', 'active')
    RETURNING id
  `);
  console.log(`\n✅ Comercio 3: Wellness Studio Zen (Básico) — ID: ${comercio3.id}`);

  // Horarios Comercio 3 (Lun-Dom 7:00-22:00, abierto todos los días)
  for (let d = 0; d <= 6; d++) {
    await client.query(`
      INSERT INTO horarios_comercio (comercio_id, dia_semana, hora_apertura, hora_cierre, cerrado)
      VALUES ($1, $2, '07:00', '22:00', false)
    `, [comercio3.id, d]);
  }

  // Personal Comercio 3
  const { rows: [lucia] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Lucía Fernández', 'lucia@wellnesszen.com', 'Instructora Yoga', 'admin', true)
    RETURNING id
  `, [comercio3.id]);

  const { rows: [martin] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Martín Díaz', 'martin@wellnesszen.com', 'Instructor Pilates', 'staff', true)
    RETURNING id
  `, [comercio3.id]);

  const { rows: [camila] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Camila Sosa', 'camila@wellnesszen.com', 'Nutricionista', 'staff', true)
    RETURNING id
  `, [comercio3.id]);

  const { rows: [diego] } = await client.query(`
    INSERT INTO personal (comercio_id, nombre, email, especialidad, rol, activo)
    VALUES ($1, 'Diego Ruiz', 'diego@wellnesszen.com', 'Masajista Terapéutico', 'staff', true)
    RETURNING id
  `, [comercio3.id]);

  // Horarios variados para Comercio 3
  // Lucía: Lun-Vie mañana (7-13)
  for (let d = 1; d <= 5; d++) {
    await client.query(`INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, trabaja) VALUES ($1, $2, '07:00', '13:00', true)`, [lucia.id, d]);
  }
  // Martín: Lun-Vie tarde (14-22)
  for (let d = 1; d <= 5; d++) {
    await client.query(`INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, trabaja) VALUES ($1, $2, '14:00', '22:00', true)`, [martin.id, d]);
  }
  // Camila: Lun, Mie, Vie (10-18)
  for (const d of [1, 3, 5]) {
    await client.query(`INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, descanso_inicio, descanso_fin, trabaja) VALUES ($1, $2, '10:00', '18:00', '13:00', '14:00', true)`, [camila.id, d]);
  }
  // Diego: Sáb-Dom (9-18)
  for (const d of [0, 6]) {
    await client.query(`INSERT INTO horarios_personal (personal_id, dia_semana, hora_entrada, hora_salida, trabaja) VALUES ($1, $2, '09:00', '18:00', true)`, [diego.id, d]);
  }

  // Servicios Comercio 3
  const servicios3 = [
    { nombre: 'Clase de Yoga', desc: 'Hatha yoga grupal', duracion: 60, precio: 3000 },
    { nombre: 'Yoga Privado', desc: 'Clase personalizada 1 a 1', duracion: 75, precio: 8000 },
    { nombre: 'Pilates Reformer', desc: 'Clase en reformer', duracion: 50, precio: 5000 },
    { nombre: 'Pilates Mat', desc: 'Pilates en colchoneta', duracion: 45, precio: 3500 },
    { nombre: 'Consulta Nutricional', desc: 'Plan alimentario personalizado', duracion: 40, precio: 6000 },
    { nombre: 'Masaje Terapéutico', desc: 'Masaje para aliviar contracturas', duracion: 60, precio: 7500 },
  ];
  const svcIds3 = [];
  for (const s of servicios3) {
    const { rows: [svc] } = await client.query(`
      INSERT INTO servicios (comercio_id, nombre, descripcion, duracion_minutos, precio)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [comercio3.id, s.nombre, s.desc, s.duracion, s.precio]);
    svcIds3.push(svc.id);
  }

  // Lucía: Yoga y Yoga Privado
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [lucia.id, svcIds3[0]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [lucia.id, svcIds3[1]]);
  // Martín: Pilates
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [martin.id, svcIds3[2]]);
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [martin.id, svcIds3[3]]);
  // Camila: Nutrición
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [camila.id, svcIds3[4]]);
  // Diego: Masaje
  await client.query(`INSERT INTO personal_servicios (personal_id, servicio_id) VALUES ($1, $2)`, [diego.id, svcIds3[5]]);

  console.log(`   → 4 profesionales, 6 servicios, horarios variados`);

  // ==========================================
  // CLIENTES (compartidos entre comercios)
  // ==========================================
  console.log('\n--- Creando clientes ---');
  const clientes = [
    { nombre: 'María García', email: 'maria.garcia@gmail.com', telefono: '+54 11 6001-0001', puntos: 120 },
    { nombre: 'Carlos Rodríguez', email: 'carlos.r@gmail.com', telefono: '+54 11 6001-0002', puntos: 85 },
    { nombre: 'Laura Méndez', email: 'laura.mendez@hotmail.com', telefono: '+54 11 6001-0003', puntos: 200 },
    { nombre: 'Pedro Álvarez', email: 'pedro.alvarez@gmail.com', telefono: '+54 11 6001-0004', puntos: 45 },
    { nombre: 'Ana Belén Sosa', email: 'anabelen@gmail.com', telefono: '+54 11 6001-0005', puntos: 310 },
    { nombre: 'Diego Fernández', email: 'diego.f@outlook.com', telefono: '+54 11 6001-0006', puntos: 60 },
    { nombre: 'Valentina Torres', email: 'vale.torres@gmail.com', telefono: '+54 11 6001-0007', puntos: 175 },
    { nombre: 'Camila Herrera', email: 'cami.herrera@gmail.com', telefono: '+54 11 6001-0008', puntos: 95 },
  ];

  const clienteIds = [];
  for (const c of clientes) {
    const { rows: [cli] } = await client.query(`
      INSERT INTO clientes (nombre, email, telefono, puntos_fidelizacion)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [c.nombre, c.email, c.telefono, c.puntos]);
    clienteIds.push(cli.id);
  }
  console.log(`✅ ${clientes.length} clientes creados`);

  // ==========================================
  // TURNOS de ejemplo (hoy y próximos días)
  // ==========================================
  console.log('\n--- Creando turnos ---');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Turnos Comercio 1 (Estética Harmony) — hoy
  const turnos1 = [
    { cli: 0, svc: 0, per: sofia.id, fecha: today, inicio: '09:00', fin: '10:30', estado: 'confirmado' },
    { cli: 2, svc: 1, per: sofia.id, fecha: today, inicio: '11:00', fin: '11:45', estado: 'pendiente' },
    { cli: 3, svc: 0, per: sofia.id, fecha: today, inicio: '12:30', fin: '14:00', estado: 'confirmado' },
    { cli: 1, svc: 2, per: juan.id, fecha: today, inicio: '09:00', fin: '10:00', estado: 'completado' },
    { cli: 4, svc: 3, per: juan.id, fecha: today, inicio: '11:00', fin: '11:50', estado: 'en_progreso' },
    { cli: 5, svc: 2, per: juan.id, fecha: today, inicio: '14:00', fin: '15:00', estado: 'confirmado' },
    { cli: 6, svc: 4, per: ana.id, fecha: today, inicio: '09:00', fin: '09:40', estado: 'completado' },
    { cli: 7, svc: 0, per: ana.id, fecha: today, inicio: '14:00', fin: '15:30', estado: 'pendiente' },
  ];
  for (const t of turnos1) {
    await client.query(`
      INSERT INTO turnos (comercio_id, cliente_id, servicio_id, personal_id, fecha, hora_inicio, hora_fin, estado, precio_cobrado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [comercio1.id, clienteIds[t.cli], svcIds1[t.svc], t.per, t.fecha, t.inicio, t.fin, t.estado, servicios1[t.svc].precio]);
  }
  console.log(`✅ ${turnos1.length} turnos para Estética Harmony (hoy)`);

  // Turnos Comercio 2 (BarberKing) — hoy
  const turnos2 = [
    { cli: 1, svc: 2, per: matias.id, fecha: today, inicio: '10:00', fin: '10:50', estado: 'completado' },
    { cli: 3, svc: 0, per: matias.id, fecha: today, inicio: '11:00', fin: '11:30', estado: 'confirmado' },
    { cli: 5, svc: 1, per: nico.id, fecha: today, inicio: '10:00', fin: '10:25', estado: 'completado' },
    { cli: 0, svc: 2, per: nico.id, fecha: today, inicio: '11:00', fin: '11:50', estado: 'en_progreso' },
    { cli: 4, svc: 3, per: matias.id, fecha: today, inicio: '14:00', fin: '15:00', estado: 'pendiente' },
  ];
  for (const t of turnos2) {
    await client.query(`
      INSERT INTO turnos (comercio_id, cliente_id, servicio_id, personal_id, fecha, hora_inicio, hora_fin, estado, precio_cobrado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [comercio2.id, clienteIds[t.cli], svcIds2[t.svc], t.per, t.fecha, t.inicio, t.fin, t.estado, servicios2[t.svc].precio]);
  }
  console.log(`✅ ${turnos2.length} turnos para BarberKing (hoy)`);

  // Turnos Comercio 3 (Wellness Zen) — hoy y mañana
  const turnos3 = [
    { cli: 6, svc: 0, per: lucia.id, fecha: today, inicio: '07:00', fin: '08:00', estado: 'completado' },
    { cli: 7, svc: 1, per: lucia.id, fecha: today, inicio: '09:00', fin: '10:15', estado: 'confirmado' },
    { cli: 2, svc: 2, per: martin.id, fecha: today, inicio: '14:00', fin: '14:50', estado: 'confirmado' },
    { cli: 4, svc: 4, per: camila.id, fecha: today, inicio: '10:00', fin: '10:40', estado: 'pendiente' },
    { cli: 0, svc: 0, per: lucia.id, fecha: tomorrow, inicio: '07:00', fin: '08:00', estado: 'pendiente' },
    { cli: 1, svc: 2, per: martin.id, fecha: tomorrow, inicio: '15:00', fin: '15:50', estado: 'pendiente' },
  ];
  for (const t of turnos3) {
    await client.query(`
      INSERT INTO turnos (comercio_id, cliente_id, servicio_id, personal_id, fecha, hora_inicio, hora_fin, estado, precio_cobrado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [comercio3.id, clienteIds[t.cli], svcIds3[t.svc], t.per, t.fecha, t.inicio, t.fin, t.estado, servicios3[t.svc].precio]);
  }
  console.log(`✅ ${turnos3.length} turnos para Wellness Zen (hoy + mañana)`);

  // ==========================================
  // REWARD TRANSACTIONS (para turnos completados)
  // ==========================================
  console.log('\n--- Creando transacciones de rewards ---');
  // Buscar turnos completados y generar rewards
  const { rows: completados } = await client.query(`
    SELECT t.id, t.cliente_id, t.comercio_id FROM turnos t WHERE t.estado = 'completado'
  `);
  for (const t of completados) {
    await client.query(`
      INSERT INTO reward_transacciones (cliente_id, turno_id, comercio_id, puntos, tipo, descripcion)
      VALUES ($1, $2, $3, 10, 'ganar', 'Puntos por turno completado')
    `, [t.cliente_id, t.id, t.comercio_id]);
  }
  console.log(`✅ ${completados.length} transacciones de rewards creadas`);

  // ==========================================
  // SUSCRIPCIONES
  // ==========================================
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  await client.query(`INSERT INTO suscripciones (comercio_id, plan, status, periodo_inicio, periodo_fin) VALUES ($1, 'vip', 'active', $2, $3)`, [comercio1.id, now.toISOString(), nextMonth.toISOString()]);
  await client.query(`INSERT INTO suscripciones (comercio_id, plan, status, periodo_inicio, periodo_fin) VALUES ($1, 'pro', 'active', $2, $3)`, [comercio2.id, now.toISOString(), nextMonth.toISOString()]);
  await client.query(`INSERT INTO suscripciones (comercio_id, plan, status, periodo_inicio, periodo_fin) VALUES ($1, 'basico', 'active', $2, $3)`, [comercio3.id, now.toISOString(), nextMonth.toISOString()]);
  console.log(`✅ 3 suscripciones creadas`);

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log('\n========================================');
  console.log('SEED COMPLETADO');
  console.log('========================================');
  
  const counts = await client.query(`
    SELECT 
      (SELECT count(*) FROM comercios) as comercios,
      (SELECT count(*) FROM personal) as personal,
      (SELECT count(*) FROM servicios) as servicios,
      (SELECT count(*) FROM clientes) as clientes,
      (SELECT count(*) FROM turnos) as turnos,
      (SELECT count(*) FROM reward_transacciones) as rewards
  `);
  const c = counts.rows[0];
  console.log(`Comercios: ${c.comercios}`);
  console.log(`Personal:  ${c.personal}`);
  console.log(`Servicios: ${c.servicios}`);
  console.log(`Clientes:  ${c.clientes}`);
  console.log(`Turnos:    ${c.turnos}`);
  console.log(`Rewards:   ${c.rewards}`);

  await client.end();
}

seed().catch(console.error);
