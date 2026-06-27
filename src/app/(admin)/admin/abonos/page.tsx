'use client';

import { useState, useEffect } from 'react';
import { Trash2, Clock, Calendar, MapPin, User, Loader2, Search, Edit2, X } from 'lucide-react';
import { getFixedBookings, deleteFixedBooking, updateFixedBooking } from '@/actions/fixed-bookings';
import { getCourts } from '@/actions/courts';

interface FixedBooking {
  id: string;
  courtId: string;
  court: { id: string, name: string };
  userId: string;
  user: { name: string, phone: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  _count: { bookings: number };
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AbonosPage() {
  const [abonos, setAbonos] = useState<FixedBooking[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterCourt, setFilterCourt] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ACTIVE');

  // Edición
  const [editingAbono, setEditingAbono] = useState<FixedBooking | null>(null);
  const [editForm, setEditForm] = useState({
    courtId: '',
    dayOfWeek: 0,
    startTimeStr: '',
    endTimeStr: '',
    clientName: '',
    clientPhone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAbonos();
    fetchCourts();
  }, []);

  const fetchAbonos = async () => {
    setLoading(true);
    const res = await getFixedBookings();
    if (res.success && res.data) {
      setAbonos(res.data as any);
    }
    setLoading(false);
  };

  const fetchCourts = async () => {
    const res = await getCourts();
    if (res.success && res.data) {
      setCourts(res.data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de cancelar este abono fijo? Se liberarán todos los turnos futuros asociados a él.')) return;
    
    setDeletingId(id);
    const res = await deleteFixedBooking(id);
    if (res.success) {
      setAbonos(abonos.filter(a => a.id !== id));
      fetchAbonos(); // Refrescar cuenta de turnos
    } else {
      alert(res.error || 'Error al eliminar');
    }
    setDeletingId(null);
  };

  const openEdit = (abono: FixedBooking) => {
    setEditingAbono(abono);
    setEditForm({
      courtId: abono.courtId || abono.court?.id || '',
      dayOfWeek: abono.dayOfWeek,
      startTimeStr: abono.startTime,
      endTimeStr: abono.endTime,
      clientName: abono.user.name || '',
      clientPhone: abono.user.phone || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAbono) return;
    setSaving(true);
    const res = await updateFixedBooking(editingAbono.id, editForm);
    if (res.success) {
      setEditingAbono(null);
      fetchAbonos();
    } else {
      alert(res.error || 'Error al actualizar el abono');
    }
    setSaving(false);
  };

  if (loading && abonos.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Gestión de Abonos Fijos</h1>
        <p className="text-slate-500 font-medium">Administra, edita y cancela las reservas recurrentes de tus clientes.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <select
            value={filterCourt}
            onChange={(e) => setFilterCourt(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white whitespace-nowrap min-w-[150px]"
          >
            <option value="ALL">Todas las Canchas</option>
            {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white whitespace-nowrap"
          >
            <option value="ALL">Todos los Días</option>
            {DAYS.map((day, idx) => (
              <option key={idx} value={idx.toString()}>{day}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white whitespace-nowrap"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Abonos */}
      {(() => {
        const filtered = abonos.filter(a => {
          const matchSearch = (a.user.name || '').toLowerCase().includes(search.toLowerCase()) || (a.user.phone || '').includes(search);
          const matchCourt = filterCourt === 'ALL' || a.courtId === filterCourt;
          const matchDay = filterDay === 'ALL' || a.dayOfWeek.toString() === filterDay;
          const matchStatus = filterStatus === 'ALL' ? true : (filterStatus === 'ACTIVE' ? a.isActive : !a.isActive);
          return matchSearch && matchCourt && matchDay && matchStatus;
        });

        if (filtered.length === 0) {
          return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-500 font-medium">No se encontraron abonos fijos con los filtros actuales.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((abono) => (
              <div key={abono.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${!abono.isActive ? 'opacity-50 border-red-200' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Calendar className="w-5 h-5" />
                      <span>{DAYS[abono.dayOfWeek]}</span>
                    </div>
                    <div className="flex space-x-2">
                      {abono.isActive && (
                        <button onClick={() => openEdit(abono)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {!abono.isActive && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">CANCELADO</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.startTime} - {abono.endTime} hs
                    </div>
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.court.name}
                    </div>
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.user.name || 'Sin Nombre'} ({abono.user.phone})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500">
                      Vigencia original: {new Date(abono.startDate).toLocaleDateString('es-AR')} al {new Date(abono.endDate).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      Turnos generados vivos: {abono._count.bookings}
                    </p>
                  </div>
                </div>

                {abono.isActive && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleDelete(abono.id)}
                      disabled={deletingId === abono.id}
                      className="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                    >
                      {deletingId === abono.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Cancelar Abono
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Modal de Edición */}
      {editingAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg dark:text-white">Editar Abono Fijo</h3>
              <button onClick={() => setEditingAbono(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm mb-2">
                <span className="font-bold">Aviso:</span> Modificar el horario o la cancha cancelará los turnos futuros vigentes y generará nuevos turnos de forma automática.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cancha</label>
                <select
                  value={editForm.courtId}
                  onChange={e => setEditForm({ ...editForm, courtId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  required
                >
                  <option value="">Seleccione Cancha...</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Día de la semana</label>
                <select
                  value={editForm.dayOfWeek}
                  onChange={e => setEditForm({ ...editForm, dayOfWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                >
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={editForm.startTimeStr}
                    onChange={e => setEditForm({ ...editForm, startTimeStr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={editForm.endTimeStr}
                    onChange={e => setEditForm({ ...editForm, endTimeStr: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={editForm.clientName}
                  onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editForm.clientPhone}
                  onChange={e => setEditForm({ ...editForm, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAbono(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
