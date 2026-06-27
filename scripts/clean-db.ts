import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function cleanDatabase() {
    console.log('Iniciando limpieza profunda de la base de datos...');
    try {
        console.log('- Borrando datos de Torneos...');
        await prisma.tournamentMatch.deleteMany();
        await prisma.tournamentGroupTeam.deleteMany();
        await prisma.tournamentGroup.deleteMany();
        await prisma.tournamentTeam.deleteMany();
        await prisma.tournamentCategory.deleteMany();
        await prisma.tournament.deleteMany();

        console.log('- Borrando Reservas y Bloqueos...');
        await prisma.booking.deleteMany();
        await prisma.fixedBooking.deleteMany();
        await prisma.courtBlock.deleteMany();

        console.log('- Borrando Gastos...');
        await prisma.expense.deleteMany();

        console.log('- Borrando Usuarios (manteniendo Administradores)...');
        await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });

        console.log('- Limpiando Canchas duplicadas (sin horarios comerciales)...');
        // Las canchas creadas por error en la migración anterior no tienen BusinessHour
        const invalidCourts = await prisma.court.findMany({
            where: {
                businessHours: {
                    none: {}
                }
            }
        });
        
        for (const court of invalidCourts) {
            await prisma.court.delete({ where: { id: court.id } });
        }
        console.log(`  Se eliminaron ${invalidCourts.length} canchas duplicadas.`);

        console.log('✅ Limpieza completada exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
