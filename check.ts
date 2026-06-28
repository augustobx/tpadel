import { prisma } from './src/lib/prisma';

async function main() {
    const bookings = await prisma.booking.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(bookings.map((b: any) => ({
        id: b.id,
        phone: b.user.phone,
        name: b.user.name,
        status: b.status,
        courtId: b.courtId,
        start: b.startTime
    })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
