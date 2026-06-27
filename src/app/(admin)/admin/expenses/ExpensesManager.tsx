'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, DollarSign, Wallet, TrendingDown, Receipt, X } from 'lucide-react';
import { createExpense, deleteExpense } from '@/actions/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['MANTENIMIENTO', 'SERVICIOS', 'SUELDOS', 'COMPRAS', 'OTROS'];

export default function ExpensesManager({ initialExpenses, initialTotal }: { initialExpenses: any[], initialTotal: number }) {
    const [expenses, setExpenses] = useState(initialExpenses);
    const [total, setTotal] = useState(initialTotal);

    // Modal y Formulario
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'MANTENIMIENTO',
        dateStr: format(new Date(), 'yyyy-MM-dd')
    });

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'MANTENIMIENTO': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'SERVICIOS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'SUELDOS': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'COMPRAS': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const res = await createExpense({
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
            dateStr: formData.dateStr
        });

        if (res.success) {
            setModalOpen(false);
            setFormData({ description: '', amount: '', category: 'MANTENIMIENTO', dateStr: format(new Date(), 'yyyy-MM-dd') });
            window.location.reload(); // Recarga simple para traer los datos nuevos
        } else {
            alert(res.error);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este gasto?')) {
            const res = await deleteExpense(id);
            if (res.success) window.location.reload();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* TARJETAS DE RESUMEN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-medium mb-1">Total Gastos (Este Mes)</p>
                        <h2 className="text-4xl font-black">${total.toLocaleString('es-AR')}</h2>
                    </div>
                    <TrendingDown className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-600 opacity-50" />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Registro de Salidas</h3>
                        <p className="text-slate-500 text-sm mt-1">Añadí facturas, compras o pagos diarios.</p>
                    </div>
                    <Button onClick={() => setModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 shadow-md">
                        <Plus className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Nuevo Gasto</span>
                    </Button>
                </div>
            </div>

            {/* TABLA RESPONSIVA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Receipt className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-bold text-lg">No hay gastos registrados este mes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full hide-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="p-5 font-bold">Fecha</th>
                                    <th className="p-5 font-bold">Descripción</th>
                                    <th className="p-5 font-bold">Categoría</th>
                                    <th className="p-5 font-bold text-right">Monto</th>
                                    <th className="p-5 font-bold text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                                            {format(new Date(expense.date), "dd/MM/yyyy")}
                                        </td>
                                        <td className="p-5 text-slate-900 dark:text-white font-bold">
                                            {expense.description}
                                        </td>
                                        <td className="p-5">
                                            <Badge variant="secondary" className={`font-black text-[10px] uppercase px-3 py-1 ${getCategoryColor(expense.category)}`}>
                                                {expense.category}
                                            </Badge>
                                        </td>
                                        <td className="p-5 text-right font-black text-lg text-slate-900 dark:text-white">
                                            ${expense.amount.toLocaleString('es-AR')}
                                        </td>
                                        <td className="p-5 text-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL NUEVO GASTO */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">

                        <div className="bg-slate-100 dark:bg-slate-800 p-5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm"><Wallet className="w-5 h-5" /></div>
                                <h3 className="font-black text-lg text-slate-900 dark:text-white">Registrar Gasto</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Input id="description" required placeholder="Ej: Compra de pelotas" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="rounded-xl bg-slate-50 dark:bg-slate-800 h-12" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                        <Input id="amount" type="number" required placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 h-12 font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateStr">Fecha</Label>
                                    <Input id="dateStr" type="date" required value={formData.dateStr} onChange={e => setFormData({ ...formData, dateStr: e.target.value })} className="rounded-xl bg-slate-50 dark:bg-slate-800 h-12" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <Button type="submit" disabled={submitting} className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl shadow-lg mt-4 transition-all">
                                {submitting ? 'Guardando...' : 'Confirmar Gasto'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* CSS para scrollbar invisible si no la tenías ya */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
}