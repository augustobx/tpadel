'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCourtSchedules(courtId: string) {
    try {
        const schedules = await prisma.businessHour.findMany({
            where: { courtId },
            orderBy: { dayOfWeek: 'asc' },
        });
        return { success: true, data: schedules };
    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        return { success: false, error: 'Error al cargar los horarios de la cancha.' };
    }
}

interface ScheduleInput {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotDuration: number;
}

export async function saveCourtSchedules(courtId: string, schedules: ScheduleInput[]) {
    try {
        // Usamos una transacción: borramos la grilla anterior de esta cancha y grabamos la nueva.
        // Esto evita colisiones o turnos fantasma si desactivás un día.
        await prisma.$transaction([
            prisma.businessHour.deleteMany({
                where: { courtId },
            }),
            prisma.businessHour.createMany({
                data: schedules.map((s) => ({
                    courtId,
                    dayOfWeek: s.dayOfWeek,
                    openTime: s.openTime,
                    closeTime: s.closeTime,
                    slotDuration: s.slotDuration,
                })),
            }),
        ]);

        revalidatePath('/admin/courts');
        revalidatePath('/reservas');

        return { success: true };
    } catch (error) {
        console.error('Error guardando horarios:', error);
        return { success: false, error: 'Ocurrió un error al guardar la configuración.' };
    }
}