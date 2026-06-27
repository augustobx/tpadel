'use server';

import { prisma } from '@/lib/prisma';

export async function getMonthlyStats(year: number, month: number) {
  try {
    // month is 1-indexed (1 = Jan, 12 = Dec)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' }
      },
      select: {
        startTime: true,
      }
    });

    // Group by day (YYYY-MM-DD)
    const stats: Record<string, number> = {};
    bookings.forEach(b => {
      // Ajustar zona horaria si es necesario. Para simplicidad, extraemos YYYY-MM-DD usando métodos locales
      const dateStr = `${b.startTime.getFullYear()}-${String(b.startTime.getMonth() + 1).padStart(2, '0')}-${String(b.startTime.getDate()).padStart(2, '0')}`;
      stats[dateStr] = (stats[dateStr] || 0) + 1;
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return { success: false, error: 'Error al cargar estadísticas mensuales.' };
  }
}
