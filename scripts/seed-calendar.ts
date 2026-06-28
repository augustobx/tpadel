import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const court1Id = '417bb319-b4ff-4bea-bae7-95f6449293a9';
  const court2Id = 'b31f84ff-9aed-42cc-a2c1-5a2ce126baf8';
  const courts = [court1Id, court2Id];

  // 1. Inyectar horarios de 8 a 23 hs cada 90 min (08:00 a 23:00) para todos los días (0-6)
  for (const courtId of courts) {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      await prisma.businessHour.upsert({
        where: { courtId_dayOfWeek: { courtId, dayOfWeek } },
        update: { openTime: '08:00', closeTime: '23:00', slotDuration: 90 },
        create: { courtId, dayOfWeek, openTime: '08:00', closeTime: '23:00', slotDuration: 90 }
      });
    }
  }

  // Helper para generar una fecha de hoy/mañana formateada YYYY-MM-DD
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPlus2 = new Date(today);
  tomorrowPlus2.setDate(tomorrowPlus2.getDate() + 2);

  const formatDate = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);
  const nextStr = formatDate(tomorrowPlus2);

  // Crear un usuario de prueba si no existe
  let demoUser = await prisma.user.findFirst({ where: { email: 'juan@tpadel.com' } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: 'juan@tpadel.com',
        name: 'Juan',
        lastName: 'Pérez',
        phone: '1122334455',
        role: 'PLAYER'
      }
    });
  }

  // 2. Insertar algunos turnos comunes
  await prisma.booking.createMany({
    skipDuplicates: true,
    data: [
      { date: todayStr, startTime: '17:00', endTime: '18:30', courtId: court1Id, userId: demoUser.id, status: 'CONFIRMED', paymentStatus: 'paid', depositAmount: 5000, totalAmount: 15000 },
      { date: todayStr, startTime: '20:00', endTime: '21:30', courtId: court2Id, userId: demoUser.id, status: 'PENDING', paymentStatus: 'pending', depositAmount: 0, totalAmount: 15000 },
      { date: tomorrowStr, startTime: '18:30', endTime: '20:00', courtId: court1Id, userId: demoUser.id, status: 'CONFIRMED', paymentStatus: 'paid', depositAmount: 5000, totalAmount: 15000 }
    ]
  });

  // 3. Insertar bloqueos (Mantenimiento, etc)
  await prisma.courtBlock.createMany({
    skipDuplicates: true,
    data: [
      { date: todayStr, startTime: '08:00', endTime: '09:30', courtId: court1Id, reason: 'Mantenimiento' },
      { date: nextStr, startTime: '09:30', endTime: '11:00', courtId: court2Id, reason: 'Clase particular' }
    ]
  });

  // 4. Insertar abonos fijos (Ej: Todos los jueves a las 20:00)
  // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves
  await prisma.fixedBooking.createMany({
    skipDuplicates: true,
    data: [
      { dayOfWeek: 2, startTime: '18:30', endTime: '20:00', courtId: court2Id, userId: demoUser.id, isActive: true }, // Martes
      { dayOfWeek: 4, startTime: '21:30', endTime: '23:00', courtId: court1Id, userId: demoUser.id, isActive: true }  // Jueves
    ]
  });

  console.log("Horarios, reservas, bloqueos y fijos generados correctamente.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
