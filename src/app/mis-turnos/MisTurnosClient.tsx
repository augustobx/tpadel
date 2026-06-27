'use client';

import { useState } from 'react';
import { getBookingsByPhone } from '@/actions/public-bookings';
import { Search, Loader2, ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function MisTurnosClient() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || phone.trim().length < 8) {
            setError('Ingresa un número de teléfono válido.');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const result = await getBookingsByPhone(phone);
            if (result.success && result.data) {
                setBookings(result.data);
            } else {
                setError(result.error || 'Ocurrió un error al buscar los turnos.');
                setBookings([]);
            }
        } catch (err) {
            setError('Ocurrió un error al buscar los turnos.');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-6 flex items-center gap-3">
                <Link href="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Turnos</h1>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                    Ingresa el número de teléfono con el que realizaste tus reservas.
                </p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="tel"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ej: 11 1234 5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>

            {searched && !loading && bookings.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center text-center py-10 opacity-70">
                    <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No se encontraron reservas para este número en los últimos 30 días.</p>
                </div>
            )}

            {bookings.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Tus Reservas</h2>
                    {bookings.map((booking) => {
                        const isPlayed = booking.isPast && booking.status === 'CONFIRMED';
                        return (
                        <div key={booking.id} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm relative overflow-hidden ${isPlayed ? 'opacity-70' : ''}`}>
                            {booking.status === 'CONFIRMED' && !isPlayed && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}
                            {isPlayed && <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>}
                            {booking.status === 'PENDING' && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
                            {booking.status === 'CANCELLED' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                            
                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className={`w-4 h-4 ${isPlayed ? 'text-slate-400' : 'text-blue-500'}`} />
                                    <span className={`font-bold ${isPlayed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{booking.courtName}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    isPlayed ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {isPlayed ? 'YA JUGADO' :
                                     booking.status === 'CONFIRMED' ? 'CONFIRMADO' :
                                     booking.status === 'PENDING' ? 'PENDIENTE' : 'CANCELADO'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pl-2 text-sm text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>{booking.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{booking.time}</span>
                                </div>
                            </div>
                            
                            {booking.totalAmount > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 pl-2">
                                    <p className="text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Total: </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">${booking.totalAmount}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
