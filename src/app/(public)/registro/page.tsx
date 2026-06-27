'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/actions/user-auth';
import { User, Phone, Mail, IdCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await registerUser(formData);

        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Error al registrar.');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Únete a la Comunidad</h1>
                    <p className="text-sm font-medium text-slate-500 mt-2">Crea tu cuenta para llevar tu historial</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre</label>
                            <input type="text" name="name" required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Apellido</label>
                            <input type="text" name="lastName" required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <IdCard className="w-4 h-4 text-slate-400" /> DNI
                        </label>
                        <input type="text" name="dni" required placeholder="Sin puntos ni espacios" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" /> Teléfono
                        </label>
                        <input type="tel" name="phone" required placeholder="Ej: 341..." className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" /> Email <span className="text-slate-400 font-normal">(Opcional)</span>
                        </label>
                        <input type="email" name="email" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" /> Contraseña
                        </label>
                        <input type="password" name="password" required placeholder="Crea una contraseña" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center mt-4"
                    >
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</> : 'Registrarme'}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login-usuario" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                Iniciar Sesión
                            </Link>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            <Link href="/" className="font-medium hover:underline text-slate-400">
                                Volver al Inicio
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
