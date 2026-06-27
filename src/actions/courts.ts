'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Obtener todas las canchas
export async function getCourts() {
  try {
    const courts = await prisma.court.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        businessHours: true, // Traemos también los horarios configurados
      }
    });
    return { success: true, data: courts };
  } catch (error) {
    console.error('Error fetching courts:', error);
    return { success: false, error: 'Error al cargar las canchas.' };
  }
}

// Crear una cancha nueva
export async function createCourt(data: { name: string; sport: string; surface: string; isActive: boolean }) {
  try {
    await prisma.court.create({
      data: {
        name: data.name,
        sport: data.sport,
        surface: data.surface,
        isActive: data.isActive,
      },
    });

    revalidatePath('/admin/courts');
    revalidatePath('/reservas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error creating court:', error);
    return { success: false, error: 'Error al crear la cancha.' };
  }
}

// Actualizar una cancha existente
export async function updateCourt(id: string, data: { name: string; sport: string; surface: string; isActive: boolean }) {
  try {
    await prisma.court.update({
      where: { id },
      data: {
        name: data.name,
        sport: data.sport,
        surface: data.surface,
        isActive: data.isActive,
      },
    });

    revalidatePath('/admin/courts');
    revalidatePath('/reservas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating court:', error);
    return { success: false, error: 'Error al actualizar la cancha.' };
  }
}