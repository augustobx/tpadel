import { getDashboardStats, getTodaySnapshot } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, Trophy, MapPin, Clock, ArrowRight, Plus, Calendar as CalendarIcon, CheckCircle2, AlertCircle, XCircle, LayoutGrid } from "lucide-react";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [statsRes, snapshotRes] = await Promise.all([
    getDashboardStats(),
    getTodaySnapshot()
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    todayBookings: 0, activeCourts: 0, pendingRevenue: 0, activeTournaments: 0
  };

  const todayBookings = snapshotRes.success && snapshotRes.data ? snapshotRes.data : [];

  // Formateo de fecha actual
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' };
  const formattedDate = today.toLocaleDateString('es-AR', dateOptions);
  
  // Saludo dinámico
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none"><AlertCircle className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <AutoRefresh intervalMs={30000} />
      
      {/* HEADER & SALUDO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, Admin 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 capitalize">
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/calendar" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-emerald-200 dark:shadow-none flex items-center gap-2 active:scale-95">
            <CalendarIcon className="w-4 h-4" /> Ver Calendario
          </Link>
        </div>
      </div>

      {/* QUICK STATS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* KPI 1 */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-200/50 dark:bg-emerald-800/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Reservas de Hoy</CardTitle>
            <div className="p-2 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-lg">
              <CalendarDays className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-black text-emerald-950 dark:text-emerald-50">{stats.todayBookings}</div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-200/50 dark:bg-blue-800/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-blue-800 dark:text-blue-400">Canchas Activas</CardTitle>
            <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-black text-blue-950 dark:text-blue-50">{stats.activeCourts}</div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/50 dark:bg-amber-800/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-400">Por Cobrar Hoy</CardTitle>
            <div className="p-2 bg-amber-200/50 dark:bg-amber-800/50 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-black text-amber-950 dark:text-amber-50">${Number(stats.pendingRevenue).toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-200/50 dark:bg-purple-800/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-bold text-purple-800 dark:text-purple-400">Torneos Activos</CardTitle>
            <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-lg">
              <Trophy className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-black text-purple-950 dark:text-purple-50">{stats.activeTournaments}</div>
          </CardContent>
        </Card>
      </div>

      {/* AGENDA DEL DÍA */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-500" /> Agenda del Día
          </CardTitle>
          <Link href="/admin/calendar" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 group">
            Ver todas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] font-bold text-slate-500">Horario</TableHead>
                  <TableHead className="font-bold text-slate-500">Cancha</TableHead>
                  <TableHead className="font-bold text-slate-500">Cliente</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayBookings.map((booking) => (
                  <TableRow key={booking.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {booking.startTime.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {booking.court.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                      {booking.user?.name || booking.user?.email || booking.description || 'Cliente de Local'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(booking.status)}
                    </TableCell>
                  </TableRow>
                ))}

                {todayBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="font-medium text-slate-500">No hay reservas programadas para hoy.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}