import { getUserSession, logoutUser } from "@/actions/user-auth";
import { getSettings } from "@/actions/settings";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicNavbar from "@/components/PublicNavbar";
import { Trophy, CalendarDays, User, LogOut, Medal, CalendarClock } from "lucide-react";
import Link from "next/link";

export default async function PerfilPage() {
    const session = await getUserSession();
    if (!session) {
        redirect("/login-usuario");
    }

    const settings = await getSettings();
    const theme = settings?.theme || 'light';

    const bookings = await prisma.booking.findMany({
        where: { user: { dni: session.dni } },
        orderBy: { startTime: 'desc' },
        include: { court: true }
    });

    const teams = await prisma.tournamentTeam.findMany({
        where: { 
            OR: [
                { player1: { dni: session.dni } },
                { player2: { dni: session.dni } }
            ]
        },
        include: {
            category: { include: { tournament: true } }
        }
    });

    const teamIds = teams.map(t => t.id);
    const tournamentMatches = await prisma.tournamentMatch.findMany({
        where: {
            OR: [
                { team1Id: { in: teamIds } },
                { team2Id: { in: teamIds } }
            ],
            startTime: { not: null }
        },
        include: {
            team1: true,
            team2: true,
            category: { include: { tournament: true } }
        },
        orderBy: { startTime: 'asc' }
    });

    return (
        <div className={`${theme} min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:items-center md:py-8`}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen md:min-h-0 md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
                <PublicNavbar sysSettings={settings} />
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mi Perfil</h1>
                        <form action={logoutUser}>
                            <button type="submit" className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl transition-colors">
                                <LogOut className="w-4 h-4" /> Salir
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0">
                            <User className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                {session.name} {session.lastName}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{session.email || session.phone}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <Medal className="w-3 h-3" /> Categoría: {session.category || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                            <Trophy className="w-5 h-5 text-amber-500" /> Mis Torneos
                        </h3>
                        {teams.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                Aún no has participado en torneos.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {teams.map(team => (
                                    <Link key={team.id} href={`/torneos/${team.category.tournamentId}`} className="block bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl hover:scale-[1.02] transition-transform border border-slate-100 dark:border-slate-700">
                                        <h4 className="font-bold text-slate-800 dark:text-white">{team.category.tournament.name}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Categoría {team.category.name}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                            <CalendarClock className="w-5 h-5 text-emerald-500" /> Mis Horarios de Partidos
                        </h3>
                        {tournamentMatches.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                No tienes partidos programados con horario.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {tournamentMatches.map((m: any) => (
                                    <div key={m.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{m.category.tournament.name}</h4>
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                {m.roundName || 'Fase de Grupos'}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium mb-2 dark:text-slate-300">
                                            {m.team1?.name || 'TBD'} <span className="text-slate-400 font-normal">vs</span> {m.team2?.name || 'TBD'}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <CalendarClock className="w-4 h-4" />
                                            {new Date(m.startTime).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} • 
                                            {new Date(m.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                            <CalendarDays className="w-5 h-5 text-blue-500" /> Mi Historial de Turnos
                        </h3>
                        {bookings.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                No tienes turnos registrados.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{booking.court.name}</h4>
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {booking.startTime.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} • 
                                            {booking.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
