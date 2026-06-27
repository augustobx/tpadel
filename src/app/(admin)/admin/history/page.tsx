'use client';

import { useState, useEffect } from 'react';
import { getHistoryBookings, getFixedBookings } from '@/actions/history';
import { Calendar as CalendarIcon, Search, Clock, MapPin, User, Phone, CheckCircle2, XCircle, AlertCircle, RefreshCw, Repeat } from 'lucide-react';

export default function HistoryPage() {
  // Default to last 30 days and next 30 days
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 30);
  
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);

  const [startDate, setStartDate] = useState(pastDate.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(futureDate.toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [fixed, setFixed] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    
    const res = await getHistoryBookings(startDate, endDate);
    if (res.success && res.data) {
      const allBookings = res.data;
      setBookings(allBookings);

      // Calcular Abonos Fijos agrupados
      const computedFixedMap = new Map();
      allBookings.filter((b: any) => b.status === 'FIXED').forEach((b: any) => {
        const date = new Date(b.startTime);
        const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const dayOfWeek = date.getDay();
        const key = `${b.courtId}-${b.userId}-${dayOfWeek}-${time}`;
        
        if (!computedFixedMap.has(key)) {
          computedFixedMap.set(key, {
            id: b.id,
            dayOfWeek,
            startTime: time,
            endTime: new Date(b.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            court: b.court,
            user: b.user,
            startDate: b.startTime,
            endDate: b.startTime,
            isActive: true,
          });
        } else {
          const existing = computedFixedMap.get(key);
          if (new Date(b.startTime) < new Date(existing.startDate)) existing.startDate = b.startTime;
          if (new Date(b.startTime) > new Date(existing.endDate)) existing.endDate = b.startTime;
        }
      });

      // Traer los fijos reales de la tabla FixedBooking
      const fixedRes = await getFixedBookings();
      let realFixed: any[] = [];
      if (fixedRes.success && fixedRes.data) {
        realFixed = fixedRes.data;
      }
      
      setFixed([...Array.from(computedFixedMap.values()), ...realFixed]);

      // Bloqueos (pueden ser individuales)
      setBlocks(allBookings.filter((b: any) => b.status === 'BLOCKED'));
    } else {
      setBookings([]);
      setFixed([]);
      setBlocks([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> Cancelado</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"><AlertCircle className="w-3 h-3 mr-1" /> Bloqueado</span>;
      case 'FIXED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><CalendarIcon className="w-3 h-3 mr-1" /> Fijo</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  // Stats Calculation
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b: any) => b.status === 'CONFIRMED').length,
    fixed: fixed.length,
    blocked: blocks.length,
    cancelled: bookings.filter((b: any) => b.status === 'CANCELLED').length,
    pending: bookings.filter((b: any) => b.status === 'PENDING').length,
  };

  const filteredBookings = statusFilter === 'ALL' ? bookings : bookings.filter(b => b.status === statusFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Turnos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Revisá, filtrá y analizá todos los turnos del sistema (Fijos, Bloqueos, Confirmados).
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setStatusFilter('ALL')}>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setStatusFilter('CONFIRMED')}>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.confirmed}</span>
            <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Confirmados</span>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setStatusFilter('FIXED')}>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.fixed}</span>
            <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Fijos</span>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors" onClick={() => setStatusFilter('BLOCKED')}>
            <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{stats.blocked}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bloqueos</span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors" onClick={() => setStatusFilter('PENDING')}>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
            <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">Pendientes</span>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStatusFilter('CANCELLED')}>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.cancelled}</span>
            <span className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wider">Cancelados</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Desde</label>
          <input
            type="date"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hasta</label>
          <input
            type="date"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estado</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="FIXED">Abonos Fijos</option>
            <option value="BLOCKED">Canchas Bloqueadas</option>
            <option value="PENDING">Pendientes de Pago</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
        <div className="w-full md:w-auto flex gap-2">
          <button
            onClick={loadHistory}
            className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center"
          >
            <Search className="w-4 h-4 mr-2" /> Buscar Rango
          </button>
        </div>
      </div>

      {/* Tables based on filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {statusFilter === 'FIXED' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Día y Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vigencia</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {fixed.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay abonos fijos registrados.</td></tr>
                ) : (
                  fixed.map((fb) => {
                    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    return (
                      <tr key={fb.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Repeat className="w-4 h-4 text-blue-500 mr-2" />
                            <span className="font-bold text-slate-900 dark:text-white">Todos los {days[fb.dayOfWeek]}</span>
                            <span className="ml-2 text-slate-500">{fb.startTime} a {fb.endTime} hs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-slate-700 dark:text-slate-300">
                            <MapPin className="w-4 h-4 text-emerald-500 mr-2" />
                            <span className="font-bold">{fb.court?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center">
                              <User className="w-3 h-3 text-slate-400 mr-1" /> {fb.user?.name || 'N/A'}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 mr-1" /> {fb.user?.phone || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(fb.startDate).toLocaleDateString('es-AR')} - {new Date(fb.endDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {fb.isActive ? 
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</span> : 
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><XCircle className="w-3 h-3 mr-1" /> Inactivo</span>
                          }
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : statusFilter === 'BLOCKED' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {blocks.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay bloqueos registrados.</td></tr>
                ) : (
                  blocks.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            {new Date(block.startTime).toLocaleDateString('es-AR')}
                          </span>
                          <span className="ml-2 text-slate-500">
                            {new Date(block.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(block.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-emerald-500 mr-2" />
                          <span className="font-bold">{block.court?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {block.reason || 'Sin motivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge('BLOCKED')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Cargando historial...
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron turnos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.filter((b: any) => b.status !== 'FIXED' && b.status !== 'BLOCKED').map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {new Date(booking.startTime).toLocaleDateString('es-AR')}
                        </span>
                        <span className="ml-2 text-slate-500">
                          {new Date(booking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className="font-bold">{booking.court?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.status !== 'BLOCKED' ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center">
                            <User className="w-3 h-3 text-slate-400 mr-1" /> {booking.user?.name || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 mr-1" /> {booking.user?.phone || 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Cancha Bloqueada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${Number(booking.totalAmount).toLocaleString('es-AR')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
