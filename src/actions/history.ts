'use server';

import { prisma } from '@/lib/prisma';

export async function getHistoryBookings(startDateStr?: string, endDateStr?: string) {
  try {
    let whereClause: any = {};

    if (startDateStr && endDateStr) {
      const startOfDay = new Date(`${startDateStr}T00:00:00-03:00`);
      const endOfDay = new Date(`${endDateStr}T23:59:59.999-03:00`);
      
      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        court: true,
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching history bookings:', error);
    return { success: false, error: 'Error al cargar el historial de reservas.' };
  }
}

export async function getFixedBookings() {
  try {
    const fixedBookings = await prisma.fixedBooking.findMany({
      include: {
        court: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: fixedBookings };
  } catch (error) {
    console.error('Error fetching fixed bookings:', error);
    return { success: false, error: 'Error al cargar los abonos fijos.' };
  }
}

export async function getCourtBlocks() {
  try {
    const courtBlocks = await prisma.courtBlock.findMany({
      include: {
        court: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
    return { success: true, data: courtBlocks };
  } catch (error) {
    console.error('Error fetching court blocks:', error);
    return { success: false, error: 'Error al cargar los bloqueos.' };
  }
}
