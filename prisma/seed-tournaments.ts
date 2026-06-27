/**
 * SEED DE TORNEOS — Ejecutar con: npx tsx prisma/seed-tournaments.ts
 * 
 * Crea datos de prueba completos:
 * - 2 Torneos (uno en inscripciones, otro en curso)
 * - Categorías por torneo
 * - Parejas inscriptas con jugadores reales
 * - Cuadros generados con partidos (algunos con resultado ya cargado)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos de torneos anteriores...');
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentGroupTeam.deleteMany();
  await prisma.tournamentGroup.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.tournamentCategory.deleteMany();
  await prisma.tournament.deleteMany();

  // ============================================================
  // JUGADORES
  // ============================================================
  console.log('👥 Creando jugadores...');
  const players = await Promise.all([
    upsertPlayer('Martín García', '5491155001001'),
    upsertPlayer('Lucas Rodríguez', '5491155001002'),
    upsertPlayer('Diego López', '5491155001003'),
    upsertPlayer('Pablo Fernández', '5491155001004'),
    upsertPlayer('Franco Sánchez', '5491155001005'),
    upsertPlayer('Matías González', '5491155001006'),
    upsertPlayer('Nicolás Pérez', '5491155001007'),
    upsertPlayer('Sebastián Torres', '5491155001008'),
    upsertPlayer('Federico Díaz', '5491155001009'),
    upsertPlayer('Andrés Martínez', '5491155001010'),
    upsertPlayer('Tomás Romero', '5491155001011'),
    upsertPlayer('Juan Cruz Álvarez', '5491155001012'),
    upsertPlayer('Agustín Ruiz', '5491155001013'),
    upsertPlayer('Santiago Moreno', '5491155001014'),
    upsertPlayer('Leandro Giménez', '5491155001015'),
    upsertPlayer('Ramiro Acosta', '5491155001016'),
    upsertPlayer('Damián Herrera', '5491155001017'),
    upsertPlayer('Gonzalo Molina', '5491155001018'),
    upsertPlayer('Ezequiel Flores', '5491155001019'),
    upsertPlayer('Iván Medina', '5491155001020'),
  ]);

  // ============================================================
  // TORNEO 1: En Inscripciones (REGISTRATION)
  // ============================================================
  console.log('🏆 Creando Torneo 1: Copa Apertura 2026...');
  const torneo1 = await prisma.tournament.create({
    data: {
      name: 'Copa Apertura 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status: 'REGISTRATION',
      entryFee: 15000,
      isPublished: true,
      requireDeposit: true,
      depositAmount: 5000,
      format: 'KNOCKOUT',
      maxTeams: 16,
    }
  });

  // Categorías Torneo 1
  const cat1a = await prisma.tournamentCategory.create({
    data: { tournamentId: torneo1.id, name: '5ta Masculina', format: 'KNOCKOUT' }
  });
  const cat1b = await prisma.tournamentCategory.create({
    data: { tournamentId: torneo1.id, name: '7ma Masculina', format: 'KNOCKOUT' }
  });

  // Inscriptos en 5ta
  console.log('📝 Inscribiendo parejas en 5ta...');
  await createTeam(cat1a.id, 'García / Rodríguez', players[0].id, players[1].id, '5491155001001', '5491155001002', true);
  await createTeam(cat1a.id, 'López / Fernández', players[2].id, players[3].id, '5491155001003', '5491155001004', true);
  await createTeam(cat1a.id, 'Sánchez / González', players[4].id, players[5].id, '5491155001005', '5491155001006', false);
  await createTeam(cat1a.id, 'Pérez / Torres', players[6].id, players[7].id, '5491155001007', '5491155001008', true);
  await createTeam(cat1a.id, 'Díaz / Martínez', players[8].id, players[9].id, '5491155001009', '5491155001010', false);

  // Inscriptos en 7ma
  console.log('📝 Inscribiendo parejas en 7ma...');
  await createTeam(cat1b.id, 'Romero / Álvarez', players[10].id, players[11].id, '5491155001011', '5491155001012', true);
  await createTeam(cat1b.id, 'Ruiz / Moreno', players[12].id, players[13].id, '5491155001013', '5491155001014', true);
  await createTeam(cat1b.id, 'Giménez / Acosta', players[14].id, players[15].id, '5491155001015', '5491155001016', true);

  // ============================================================
  // TORNEO 2: En Curso (ONGOING) — Con cuadros y resultados
  // ============================================================
  console.log('🏆 Creando Torneo 2: Master Nocturno...');
  const torneo2 = await prisma.tournament.create({
    data: {
      name: 'Master Nocturno PSP',
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-05-20'),
      status: 'ONGOING',
      entryFee: 10000,
      isPublished: true,
      requireDeposit: false,
      depositAmount: 0,
      format: 'KNOCKOUT',
      maxTeams: 8,
    }
  });

  const cat2 = await prisma.tournamentCategory.create({
    data: { tournamentId: torneo2.id, name: '6ta Libre', format: 'KNOCKOUT' }
  });

  // 8 parejas
  console.log('📝 Inscribiendo 8 parejas en Master Nocturno...');
  const t2teams = await Promise.all([
    createTeam(cat2.id, 'García / Rodríguez', players[0].id, players[1].id, '5491155001001', '5491155001002', true),
    createTeam(cat2.id, 'López / Fernández', players[2].id, players[3].id, '5491155001003', '5491155001004', true),
    createTeam(cat2.id, 'Sánchez / González', players[4].id, players[5].id, '5491155001005', '5491155001006', true),
    createTeam(cat2.id, 'Pérez / Torres', players[6].id, players[7].id, '5491155001007', '5491155001008', true),
    createTeam(cat2.id, 'Díaz / Martínez', players[8].id, players[9].id, '5491155001009', '5491155001010', true),
    createTeam(cat2.id, 'Romero / Álvarez', players[10].id, players[11].id, '5491155001011', '5491155001012', true),
    createTeam(cat2.id, 'Ruiz / Moreno', players[12].id, players[13].id, '5491155001013', '5491155001014', true),
    createTeam(cat2.id, 'Herrera / Molina', players[16].id, players[17].id, '5491155001017', '5491155001018', true),
  ]);

  // GENERAR CUADRO de 8 — Cuartos, Semis, Final
  console.log('📊 Generando cuadro de 8 parejas...');

  // Cuartos de Final
  const qf1 = await createMatch(cat2.id, 1, 1, 'Cuartos de Final', t2teams[0].id, t2teams[1].id);
  const qf2 = await createMatch(cat2.id, 1, 2, 'Cuartos de Final', t2teams[2].id, t2teams[3].id);
  const qf3 = await createMatch(cat2.id, 1, 3, 'Cuartos de Final', t2teams[4].id, t2teams[5].id);
  const qf4 = await createMatch(cat2.id, 1, 4, 'Cuartos de Final', t2teams[6].id, t2teams[7].id);

  // Semis (vacías, se llenan con ganadores)
  const sf1 = await createMatch(cat2.id, 2, 1, 'Semifinal', null, null);
  const sf2 = await createMatch(cat2.id, 2, 2, 'Semifinal', null, null);

  // Final
  const fin = await createMatch(cat2.id, 3, 1, 'Final', null, null);

  // Vincular nextMatch
  await prisma.tournamentMatch.update({ where: { id: qf1.id }, data: { nextMatchId: sf1.id } });
  await prisma.tournamentMatch.update({ where: { id: qf2.id }, data: { nextMatchId: sf1.id } });
  await prisma.tournamentMatch.update({ where: { id: qf3.id }, data: { nextMatchId: sf2.id } });
  await prisma.tournamentMatch.update({ where: { id: qf4.id }, data: { nextMatchId: sf2.id } });
  await prisma.tournamentMatch.update({ where: { id: sf1.id }, data: { nextMatchId: fin.id } });
  await prisma.tournamentMatch.update({ where: { id: sf2.id }, data: { nextMatchId: fin.id } });

  // Cargar resultados de cuartos (2 terminados, 1 en vivo, 1 programado)
  console.log('📝 Cargando resultados de cuartos...');

  // QF1: García/Rodríguez gana 6-4 / 6-3
  await prisma.tournamentMatch.update({
    where: { id: qf1.id },
    data: { scoreTeam1: '6-4 / 6-3', scoreTeam2: '4-6 / 3-6', winnerId: t2teams[0].id, status: 'COMPLETED' }
  });

  // QF2: Pérez/Torres gana 7-5 / 6-4
  await prisma.tournamentMatch.update({
    where: { id: qf2.id },
    data: { scoreTeam1: '5-7 / 4-6', scoreTeam2: '7-5 / 6-4', winnerId: t2teams[3].id, status: 'COMPLETED' }
  });

  // Propagar a SF1
  await prisma.tournamentMatch.update({
    where: { id: sf1.id },
    data: { team1Id: t2teams[0].id, team2Id: t2teams[3].id }
  });

  // QF3: En vivo (IN_PROGRESS) — Díaz/Martínez vs Romero/Álvarez
  await prisma.tournamentMatch.update({
    where: { id: qf3.id },
    data: { scoreTeam1: '6-4 / 3-', scoreTeam2: '4-6 / 3-', status: 'IN_PROGRESS' }
  });

  // QF4: Pendiente (SCHEDULED)
  // Ya queda como está

  console.log('✅ Seed completado!');
  console.log(`   Torneo 1: ${torneo1.name} (${torneo1.id}) — REGISTRATION`);
  console.log(`   Torneo 2: ${torneo2.name} (${torneo2.id}) — ONGOING`);
  console.log(`   Jugadores: ${players.length}`);
  console.log(`   Parejas T1: 8 | Parejas T2: 8`);
  console.log(`   Partidos T2: 7 (2 finalizados, 1 en vivo, 4 pendientes)`);
}

// ============================================================
// HELPERS
// ============================================================

async function upsertPlayer(name: string, phone: string) {
  const existing = await prisma.user.findFirst({ where: { phone } });
  if (existing) return existing;
  return prisma.user.create({
    data: { name, phone, email: `${phone}@psp.seed`, role: 'PLAYER' }
  });
}

async function createTeam(categoryId: string, name: string, p1Id: string, p2Id: string, phone1: string, phone2: string, isPaid: boolean) {
  return prisma.tournamentTeam.create({
    data: { categoryId, name, player1Id: p1Id, player2Id: p2Id, phone1, phone2, isPaid }
  });
}

async function createMatch(categoryId: string, round: number, matchOrder: number, roundName: string, team1Id: string | null, team2Id: string | null) {
  return prisma.tournamentMatch.create({
    data: { categoryId, round, matchOrder, roundName, team1Id, team2Id }
  });
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
