'use server';

import { prisma } from '@/lib/prisma';
import { normalizePhoneForWhatsApp } from '@/lib/whatsapp/notifications';

export async function getPublicCourts() {
    try {
        const courts = await prisma.court.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: courts };
    } catch (error) {
        return { success: false, error: 'Error al cargar canchas' };
    }
}

export async function getAvailableSlots(courtId: string, dateStr: string) {
    try {
        // AUTO-CANCELAR RESERVAS PENDIENTES EXPIRADAS (>5 min)
        try {
            const cutoff = new Date(Date.now() - 5 * 60 * 1000);
            await prisma.booking.updateMany({
                where: { status: 'PENDING', createdAt: { lt: cutoff } },
                data: { status: 'CANCELLED' }
            });
        } catch(e) { console.error("Error auto-canceling pending bookings:", e); }

        const [year, month, day] = dateStr.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

        // 1. Buscar horario de negocio para esta cancha y día
        const businessHour = await prisma.businessHour.findFirst({
            where: { courtId, dayOfWeek },
        });

        if (!businessHour) {
            return { success: true, data: [] }; // No abre este día
        }

        // 2. Buscar reservas existentes del día (no canceladas)
        const startOfDay = new Date(`${dateStr}T00:00:00-03:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999-03:00`);
        endOfDay.setDate(endOfDay.getDate() + 1); // Allow slots crossing midnight up to the next day

        const existingBookings = await prisma.booking.findMany({
            where: {
                courtId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
            },
        });

        // 3. Buscar abonos fijos activos para este día de la semana
        const fixedBookings = await prisma.fixedBooking.findMany({
            where: {
                courtId,
                dayOfWeek,
                isActive: true,
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay },
            },
        });

        // 4. Buscar bloqueos de cancha vigentes
        const courtBlocks = await prisma.courtBlock.findMany({
            where: {
                courtId,
                startTime: { lte: endOfDay },
                endTime: { gte: startOfDay },
            },
        });

        // 5. Generar grilla dinámica desde BusinessHour
        const [openHour, openMin] = businessHour.openTime.split(':').map(Number);
        const [closeHour, closeMin] = businessHour.closeTime.split(':').map(Number);
        const duration = businessHour.slotDuration;

        let currentMinutes = openHour * 60 + openMin;
        let endMinutes = closeHour * 60 + closeMin;
        if (endMinutes <= currentMinutes) {
            endMinutes += 24 * 60;
        }
        const now = new Date();

        const slotsData: { time: string; status: string }[] = [];

        while (currentMinutes + duration <= endMinutes) {
            const formatTimeAndDate = (minsTotal: number, baseDateStr: string) => {
                const daysToAdd = Math.floor(minsTotal / (24 * 60));
                const minsInDay = minsTotal % (24 * 60);
                const h = Math.floor(minsInDay / 60).toString().padStart(2, '0');
                const m = (minsInDay % 60).toString().padStart(2, '0');
                
                let finalDateStr = baseDateStr;
                if (daysToAdd > 0) {
                   const d = new Date(`${baseDateStr}T00:00:00-03:00`);
                   d.setDate(d.getDate() + daysToAdd);
                   finalDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
                return { timeStr: `${h}:${m}`, dateStr: finalDateStr };
            };

            const startInfo = formatTimeAndDate(currentMinutes, dateStr);
            const endInfo = formatTimeAndDate(currentMinutes + duration, dateStr);

            const timeStr = startInfo.timeStr;

            const slotStartTime = new Date(`${startInfo.dateStr}T${startInfo.timeStr}:00-03:00`);
            const slotEndTime = new Date(`${endInfo.dateStr}T${endInfo.timeStr}:00-03:00`);
            const slotEndMinutes = currentMinutes + duration;

            // ¿El slot ya pasó? (solo para hoy)
            if (slotStartTime <= now) {
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene una reserva que se solapa? (OVERLAP real)
            const occupyingBooking = existingBookings.find(b => {
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                return slotStartTime.getTime() < bEnd && slotEndTime.getTime() > bStart;
            });

            if (occupyingBooking) {
                slotsData.push({ time: timeStr, status: occupyingBooking.status });
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene un abono fijo que se solapa?
            const isFixedOccupied = fixedBookings.some(fb => {
                const [fbStartH, fbStartM] = fb.startTime.split(':').map(Number);
                const [fbEndH, fbEndM] = fb.endTime.split(':').map(Number);
                const fbStartMin = fbStartH * 60 + fbStartM;
                let fbEndMin = fbEndH * 60 + fbEndM;
                if (fbEndMin <= fbStartMin) fbEndMin += 24 * 60;
                return currentMinutes < fbEndMin && slotEndMinutes > fbStartMin;
            });

            if (isFixedOccupied) {
                slotsData.push({ time: timeStr, status: 'FIXED' });
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene un bloqueo de cancha?
            const isBlocked = courtBlocks.some(block => {
                const blockStart = new Date(block.startTime).getTime();
                const blockEnd = new Date(block.endTime).getTime();
                return slotStartTime.getTime() < blockEnd && slotEndTime.getTime() > blockStart;
            });

            if (isBlocked) {
                slotsData.push({ time: timeStr, status: 'BLOCKED' });
                currentMinutes += duration;
                continue;
            }

            // ✅ Slot disponible
            slotsData.push({ time: timeStr, status: 'AVAILABLE' });
            currentMinutes += duration;
        }


        return { success: true, data: slotsData };
    } catch (error) {
        console.error('Error calculating available slots:', error);
        return { success: false, error: 'Error al consultar disponibilidad' };
    }
}

export async function getBookingsByPhone(phone: string) {
    try {
        const normalizedPhone = normalizePhoneForWhatsApp(phone);
        
        // Buscamos al usuario por su teléfono
        const user = await prisma.user.findFirst({
            where: { phone: normalizedPhone }
        });

        if (!user) {
            return { success: true, data: [] }; // No se encontraron reservas
        }

        // Buscamos sus reservas, de los últimos 30 días y futuras
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const bookings = await prisma.booking.findMany({
            where: {
                userId: user.id,
                startTime: { gte: thirtyDaysAgo }
            },
            include: {
                court: true
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        // Formateamos las reservas para devolver lo necesario al frontend
        const now = new Date();
        const data = bookings.map(b => ({
            id: b.id,
            courtName: b.court?.name || 'Cancha',
            date: b.startTime.toLocaleDateString('es-AR'),
            time: b.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            status: b.status,
            totalAmount: b.totalAmount.toNumber(),
            isPast: b.endTime < now
        }));

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching bookings by phone:', error);
        return { success: false, error: 'Error al buscar los turnos' };
    }
}