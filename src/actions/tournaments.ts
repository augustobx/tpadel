'use server';

import { prisma } from '@/lib/prisma';
import { tournamentSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function getTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { categories: true }
        }
      }
    });
    return { success: true, data: tournaments };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return { success: false, error: 'Error al cargar torneos' };
  }
}

export async function getTournamentFull(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            teams: {
              include: { player1: true, player2: true }
            },
            matches: {
              include: { team1: true, team2: true, winner: true, group: true },
              orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }]
            },
            groups: {
              include: {
                teams: { include: { team: true }, orderBy: { points: 'desc' } },
                matches: { include: { team1: true, team2: true } }
              }
            }
          }
        }
      }
    });
    return { success: true, data: tournament };
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return { success: false, error: 'Error al cargar torneo' };
  }
}

export async function createTournament(data: unknown) {
  const result = tournamentSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { name, startDate, endDate, entryFee, isPublished, requireDeposit, depositAmount, format, maxTeams } = result.data;

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate,
        endDate,
        entryFee,
        status: 'DRAFT',
        isPublished,
        requireDeposit,
        depositAmount,
        format,
        maxTeams,
      }
    });

    revalidatePath('/admin/torneos');
    
    return { success: true, tournament };
  } catch (error) {
    console.error('Error creando torneo:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function updateTournament(id: string, data: unknown) {
  const result = tournamentSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { name, startDate, endDate, entryFee, isPublished, requireDeposit, depositAmount, format, maxTeams } = result.data;

  try {
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name,
        startDate,
        endDate,
        entryFee,
        isPublished,
        requireDeposit,
        depositAmount,
        format,
        maxTeams,
      }
    });

    revalidatePath('/admin/torneos');
    revalidatePath(`/admin/torneos/${id}`);
    
    return { success: true, tournament };
  } catch (error) {
    console.error('Error actualizando torneo:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Acción dedicada para cambiar el status (sin pasar por el schema completo)
export async function updateTournamentStatus(id: string, status: string) {
  try {
    await prisma.tournament.update({
      where: { id },
      data: { status: status as any }
    });
    revalidatePath('/admin/torneos');
    revalidatePath(`/admin/torneos/${id}`);
    revalidatePath('/torneos');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return { success: false, error: 'Error al cambiar estado' };
  }
}

export async function deleteTournament(id: string) {
  try {
    await prisma.tournament.delete({
      where: { id }
    });
    revalidatePath('/admin/torneos');
    return { success: true };
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return { success: false, error: 'Error al eliminar torneo' };
  }
}