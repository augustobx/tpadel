'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, User, Phone, Info } from 'lucide-react';
import { getAdminCalendarData } from '@/actions/admin-calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminCalendar({ courts }: { courts: any[] }) {
    const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!selectedCourt) return;
        setLoading(true);
        const res = await getAdminCalendarData(selectedCourt, format(currentDate, 'yyyy-MM-dd'));
        if (res.success) setData(res.data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [selectedCourt, currentDate]);

    const changeDay = (days: number) => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + days);
        setCurrentDate(next);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* TOOLBAR SUPERIOR RESPONSIVA */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => changeDay(-1)} className="rounded-full">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-3 font-black text-xl min-w-[240px] justify-center text-slate-800 dark:text-white">
                        <CalendarIcon className="h-6 w-6 text-emerald-500" />
                        {format(currentDate, "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => changeDay(1)} className="rounded-full">
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex items-center w-full lg:w-auto gap-2">
                    <select
                        value={selectedCourt}
                        onChange={(e) => setSelectedCourt(e.target.value)}
                        className="w-full lg:min-w-[300px] p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all text-slate-700 dark:text-slate-200"
                    >
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.surface}</option>)}
                    </select>
                </div>
            </div>

            {/* LISTADO DE SLOTS (LÍNEA DE TIEMPO) */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Sincronizando agenda...</p>
                </div>
            ) : data?.slots ? (
                <div className="grid grid-cols-1 gap-4">
                    {data.slots.map((slot: any, idx: number) => {
                        const isFree = slot.status === 'FREE';
                        return (
                            <div
                                key={idx}
                                className={`group flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 ${isFree
                                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-95'
                                    }`}
                            >
                                {/* BLOQUE HORA */}
                                <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 min-w-[100px]">
                                    <span className={`text-2xl font-black ${isFree ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                                        {slot.time}
                                    </span>
                                    <span className="text-[11px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        Fin {slot.endTime}
                                    </span>
                                </div>

                                {/* BLOQUE CONTENIDO */}
                                <div className="flex-1 w-full">
                                    {isFree ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                ESPACIO DISPONIBLE
                                            </div>
                                            <Button size="sm" className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                                <Plus className="h-4 w-4 mr-2" /> Reservar Manual
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                                            <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                                                <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                                                    <User className="h-4 w-4 text-emerald-500" />
                                                </div>
                                                <span className="truncate">{slot.booking?.user?.name || 'Cliente Local'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                                                <Phone className="h-4 w-4" />
                                                {slot.booking?.user?.phone || 'Sin teléfono'}
                                            </div>
                                            <div className="flex justify-start md:justify-end">
                                                <Badge className={`font-black uppercase text-[10px] px-4 py-1.5 rounded-full shadow-sm ${slot.status === 'CONFIRMED'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}>
                                                    {slot.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente Pago'}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Info className="h-16 w-12 mb-6 text-slate-300" />
                    <p className="text-slate-500 font-black text-xl">No hay horarios de atención hoy</p>
                    <p className="text-slate-400 font-medium">Configurá los horarios en la sección "Canchas".</p>
                </div>
            )}
        </div>
    );
}