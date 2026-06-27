'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================================
// CREAR CATEGORÍA
// ============================================================
export async function createCategory(tournamentId: string, name: string, level: number | null, format: any) {
  try {
    await prisma.tournamentCategory.create({
      data: { tournamentId, name, level, format }
    });
    revalidatePath(`/admin/torneos/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al crear categoría' };
  }
}

// ============================================================
// ELIMINAR CATEGORÍA
// ============================================================
export async function deleteCategory(categoryId: string) {
  try {
    const cat = await prisma.tournamentCategory.findUnique({ where: { id: categoryId } });
    await prisma.tournamentCategory.delete({ where: { id: categoryId } });
    if (cat) revalidatePath(`/admin/torneos/${cat.tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al eliminar categoría' };
  }
}

// ============================================================
// ELIMINAR EQUIPO
// ============================================================
export async function deleteTeam(teamId: string) {
  try {
    await prisma.tournamentTeam.delete({ where: { id: teamId } });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al eliminar equipo' };
  }
}

// ============================================================
// GENERADOR COMPLETO DE CUADRO ELIMINACIÓN DIRECTA
// ============================================================
export async function generateKnockoutBracket(categoryId: string) {
  try {
    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: { teams: true, matches: true }
    });

    if (!category) return { success: false, error: 'Categoría no encontrada.' };
    if (category.teams.length < 2) return { success: false, error: 'Se necesitan al menos 2 parejas inscriptas.' };

    // Limpiar partidos previos si se re-genera
    if (category.matches.length > 0) {
      await prisma.tournamentMatch.deleteMany({ where: { categoryId } });
    }

    const teams = [...category.teams].sort(() => Math.random() - 0.5); // Shuffle
    const numTeams = teams.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    const byes = bracketSize - numTeams;

    // Ronda 1 — primera ronda con posibles byes
    const round1Matches: string[] = [];
    let teamIdx = 0;
    const roundNames: { [key: number]: string } = {};
    
    // Asignar nombres de ronda
    if (totalRounds === 1) { roundNames[1] = 'Final'; }
    else if (totalRounds === 2) { roundNames[1] = 'Semifinal'; roundNames[2] = 'Final'; }
    else if (totalRounds === 3) { roundNames[1] = 'Cuartos de Final'; roundNames[2] = 'Semifinal'; roundNames[3] = 'Final'; }
    else {
      for (let r = 1; r <= totalRounds; r++) {
        if (r === totalRounds) roundNames[r] = 'Final';
        else if (r === totalRounds - 1) roundNames[r] = 'Semifinal';
        else if (r === totalRounds - 2) roundNames[r] = 'Cuartos de Final';
        else roundNames[r] = `Ronda ${r}`;
      }
    }

    // Crear partidos de Ronda 1
    const matchesPerRound1 = bracketSize / 2;
    for (let i = 0; i < matchesPerRound1; i++) {
      const t1 = teams[teamIdx] || null;
      teamIdx++;
      const t2 = teamIdx < numTeams ? teams[teamIdx] : null; // null = BYE
      teamIdx++;

      const match = await prisma.tournamentMatch.create({
        data: {
          categoryId,
          round: 1,
          matchOrder: i + 1,
          team1Id: t1?.id || null,
          team2Id: t2?.id || null,
          roundName: roundNames[1] || 'Ronda 1',
          // Si hay bye, el que tiene rival avanza automáticamente
          ...(t1 && !t2 ? { winnerId: t1.id, status: 'COMPLETED', scoreTeam1: 'BYE', scoreTeam2: '-' } : {}),
          ...(!t1 && t2 ? { winnerId: t2.id, status: 'COMPLETED', scoreTeam1: '-', scoreTeam2: 'BYE' } : {}),
        }
      });
      round1Matches.push(match.id);
    }

    // Crear rondas siguientes (2, 3, etc.)
    let prevRoundMatchIds = round1Matches;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesThisRound = prevRoundMatchIds.length / 2;
      const newRoundMatchIds: string[] = [];

      for (let i = 0; i < matchesThisRound; i++) {
        const match = await prisma.tournamentMatch.create({
          data: {
            categoryId,
            round,
            matchOrder: i + 1,
            roundName: roundNames[round] || `Ronda ${round}`,
          }
        });
        newRoundMatchIds.push(match.id);

        // Vincular las 2 partidas previas que alimentan este match
        const feeder1Id = prevRoundMatchIds[i * 2];
        const feeder2Id = prevRoundMatchIds[i * 2 + 1];

        await prisma.tournamentMatch.update({
          where: { id: feeder1Id },
          data: { nextMatchId: match.id }
        });
        await prisma.tournamentMatch.update({
          where: { id: feeder2Id },
          data: { nextMatchId: match.id }
        });

        // Si los feeders ya tienen ganador (por BYE), propagar
        const f1 = await prisma.tournamentMatch.findUnique({ where: { id: feeder1Id } });
        const f2 = await prisma.tournamentMatch.findUnique({ where: { id: feeder2Id } });

        if (f1?.winnerId && f2?.winnerId) {
          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { team1Id: f1.winnerId, team2Id: f2.winnerId }
          });
        } else if (f1?.winnerId) {
          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { team1Id: f1.winnerId }
          });
        } else if (f2?.winnerId) {
          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: { team2Id: f2.winnerId }
          });
        }
      }
      prevRoundMatchIds = newRoundMatchIds;
    }

    revalidatePath(`/admin/torneos`);
    return { success: true, message: `Cuadro de ${bracketSize} generado con ${numTeams} equipos (${byes} BYEs).` };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error generando llaves' };
  }
}

// ============================================================
// MESA DE CONTROL: ACTUALIZAR RESULTADO
// ============================================================
export async function updateMatchScore(matchId: string, scoreTeam1: string, scoreTeam2: string, winnerId: string) {
  try {
    const match = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        scoreTeam1,
        scoreTeam2,
        winnerId,
        status: 'COMPLETED'
      }
    });

    // Si hay nextMatchId, avanzar al ganador
    if (match.nextMatchId && winnerId) {
      const nextMatch = await prisma.tournamentMatch.findUnique({ where: { id: match.nextMatchId } });
      if (nextMatch) {
        if (!nextMatch.team1Id) {
          await prisma.tournamentMatch.update({ where: { id: nextMatch.id }, data: { team1Id: winnerId } });
        } else if (!nextMatch.team2Id) {
          await prisma.tournamentMatch.update({ where: { id: nextMatch.id }, data: { team2Id: winnerId } });
        }
      }
    }

    revalidatePath('/admin/torneos');
    revalidatePath('/torneos');
    revalidatePath('/tv');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al actualizar resultado' };
  }
}

// ============================================================
// MARCAR PARTIDO COMO EN PROGRESO
// ============================================================
export async function setMatchInProgress(matchId: string) {
  try {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { status: 'IN_PROGRESS' }
    });
    revalidatePath('/admin/torneos');
    revalidatePath('/tv');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al actualizar estado' };
  }
}

// ============================================================
// GENERAR ZONAS Y PLAZAS CON HORARIOS
// ============================================================
export async function generateZonesAndSchedule(categoryId: string, config: {
  numZones: number;
  teamsPerZone: number;
  zonesConfig: {
    name: string;
    startTime: string; // ISO string
    intervalMinutes: number;
    courtId: string | null;
  }[];
}) {
  try {
    const category = await prisma.tournamentCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Categoría no encontrada');

    // 1. Obtener o crear Dummy User para Plazas
    let dummyUser = await prisma.user.findFirst({ where: { phone: 'DUMMY_PLAZA' } });
    if (!dummyUser) {
      dummyUser = await prisma.user.create({
        data: {
          name: 'Plaza Libre',
          phone: 'DUMMY_PLAZA',
          role: 'PLAYER'
        }
      });
    }
    const dId = dummyUser.id;

    await prisma.$transaction(async (tx) => {
      // Borrar todos los grupos de esta categoría
      await tx.tournamentGroup.deleteMany({ where: { categoryId } });
      
      // Borrar partidos previos (elimina Knockout y Groups)
      await tx.tournamentMatch.deleteMany({ where: { categoryId } });

      // Borrar todos los equipos placeholder previos
      await tx.tournamentTeam.deleteMany({
        where: { categoryId, player1Id: dId }
      });

      // 2. Crear Zonas y Plazas
      for (let z = 0; z < config.numZones; z++) {
        const zoneConf = config.zonesConfig[z];
        
        // Crear Grupo
        const group = await tx.tournamentGroup.create({
          data: {
            categoryId,
            name: zoneConf.name
          }
        });

        const createdTeams = [];
        // Crear Plazas (Teams)
        for (let p = 1; p <= config.teamsPerZone; p++) {
          const team = await tx.tournamentTeam.create({
            data: {
              categoryId,
              name: `Plaza ${p}`,
              player1Id: dId,
            }
          });
          
          // Vincular equipo al grupo
          await tx.tournamentGroupTeam.create({
            data: {
              groupId: group.id,
              teamId: team.id
            }
          });

          createdTeams.push(team);
        }

        // 3. Algoritmo Round Robin
        const t = [...createdTeams];
        if (t.length % 2 !== 0) {
          t.push(null as any); // BYE
        }

        const matches: { t1: any, t2: any }[] = [];
        const n = t.length;
        for (let round = 0; round < n - 1; round++) {
          for (let i = 0; i < n / 2; i++) {
            const t1 = t[i];
            const t2 = t[n - 1 - i];
            if (t1 && t2) {
              matches.push({ t1, t2 });
            }
          }
          // Rotar array
          t.splice(1, 0, t.pop()!);
        }

        // Generar registros TournamentMatch
        let matchIndex = 0;
        for (const m of matches) {
          const matchStart = new Date(zoneConf.startTime);
          matchStart.setMinutes(matchStart.getMinutes() + matchIndex * zoneConf.intervalMinutes);

          await tx.tournamentMatch.create({
            data: {
              categoryId,
              groupId: group.id,
              round: 1,
              matchOrder: matchIndex + 1,
              team1Id: m.t1.id,
              team2Id: m.t2.id,
              roundName: 'Fase de Grupos',
              startTime: matchStart,
              courtId: zoneConf.courtId || null,
            }
          });
          matchIndex++;
        }
      }
    });

    revalidatePath(`/admin/torneos`);
    return { success: true };
  } catch (error: any) {
    console.error('Error in generateZonesAndSchedule:', error);
    return { success: false, error: 'Error al generar zonas y fixture' };
  }
}

// ============================================================
// GENERADOR DE CUADRO INTELIGENTE DESDE ZONAS
// ============================================================
export async function generateKnockoutFromZones(categoryId: string) {
  try {
    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        matches: { where: { groupId: null } },
        groups: {
          include: {
            teams: { include: { team: true }, orderBy: { points: 'desc' } }
          }
        }
      }
    });

    if (!category) return { success: false, error: 'Categoría no encontrada.' };
    const groups = category.groups;

    if (category.matches.length > 0) {
      await prisma.tournamentMatch.deleteMany({ where: { categoryId, groupId: null } });
    }

    const qualifiedTeams: any[] = [];
    const firsts = groups.map(g => g.teams[0]?.team).filter(Boolean);
    const seconds = groups.map(g => g.teams[1]?.team).filter(Boolean);

    if (groups.length === 2) {
      qualifiedTeams.push(firsts[0], seconds[1]); 
      qualifiedTeams.push(firsts[1], seconds[0]); 
    } else if (groups.length === 4) {
      qualifiedTeams.push(firsts[0], seconds[1]); 
      qualifiedTeams.push(firsts[2], seconds[3]); 
      qualifiedTeams.push(firsts[1], seconds[0]); 
      qualifiedTeams.push(firsts[3], seconds[2]); 
    } else {
      let i = 0;
      while(i < firsts.length || i < seconds.length) {
        if (firsts[i]) qualifiedTeams.push(firsts[i]);
        if (seconds[firsts.length - 1 - i]) qualifiedTeams.push(seconds[firsts.length - 1 - i]);
        i++;
      }
    }

    const numTeams = qualifiedTeams.length;
    let bracketSize = 2;
    while (bracketSize < numTeams) bracketSize *= 2;
    if (bracketSize < 4) bracketSize = 4; // Mínimo Semifinales
    
    while(qualifiedTeams.length < bracketSize) {
      qualifiedTeams.push(null);
    }

    const totalRounds = Math.ceil(Math.log2(bracketSize));
    const round1Matches: string[] = [];
    let teamIdx = 0;
    const roundNames: { [key: number]: string } = {};
    
    if (totalRounds === 1) { roundNames[1] = 'Final'; }
    else if (totalRounds === 2) { roundNames[1] = 'Semifinal'; roundNames[2] = 'Final'; }
    else if (totalRounds === 3) { roundNames[1] = 'Cuartos de Final'; roundNames[2] = 'Semifinal'; roundNames[3] = 'Final'; }
    else {
      for (let r = 1; r <= totalRounds; r++) {
        if (r === totalRounds) roundNames[r] = 'Final';
        else if (r === totalRounds - 1) roundNames[r] = 'Semifinal';
        else if (r === totalRounds - 2) roundNames[r] = 'Cuartos de Final';
        else roundNames[r] = `Ronda ${r}`;
      }
    }

    const matchesPerRound1 = bracketSize / 2;
    for (let i = 0; i < matchesPerRound1; i++) {
      const t1 = qualifiedTeams[teamIdx] || null;
      teamIdx++;
      const t2 = qualifiedTeams[teamIdx] || null;
      teamIdx++;

      const match = await prisma.tournamentMatch.create({
        data: {
          categoryId,
          round: 1,
          matchOrder: i + 1,
          team1Id: t1?.id || null,
          team2Id: t2?.id || null,
          roundName: roundNames[1] || 'Ronda 1',
        }
      });
      round1Matches.push(match.id);
    }

    let prevRoundMatchIds = round1Matches;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesThisRound = prevRoundMatchIds.length / 2;
      const newRoundMatchIds: string[] = [];

      for (let i = 0; i < matchesThisRound; i++) {
        const match = await prisma.tournamentMatch.create({
          data: {
            categoryId,
            round,
            matchOrder: i + 1,
            roundName: roundNames[round] || `Ronda ${round}`,
          }
        });
        newRoundMatchIds.push(match.id);

        await prisma.tournamentMatch.update({
          where: { id: prevRoundMatchIds[i * 2] },
          data: { nextMatchId: match.id }
        });
        await prisma.tournamentMatch.update({
          where: { id: prevRoundMatchIds[i * 2 + 1] },
          data: { nextMatchId: match.id }
        });
      }
      prevRoundMatchIds = newRoundMatchIds;
    }

    revalidatePath(`/admin/torneos`);
    return { success: true, message: `Cuadro generado inteligentemente desde zonas.` };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error generando llaves desde zonas' };
  }
}

// ============================================================
// ASIGNACIÓN MANUAL DE EQUIPO EN EL CUADRO
// ============================================================
export async function updateMatchTeam(matchId: string, slot: 'team1Id' | 'team2Id', teamId: string | null) {
  try {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { [slot]: teamId }
    });
    revalidatePath(`/admin/torneos`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al cambiar equipo' };
  }
}
