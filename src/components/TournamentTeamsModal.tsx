'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerTeam } from '@/actions/public-tournaments';
import { deleteTeam } from '@/actions/tournament-engine';
import { useRouter } from 'next/navigation';
import { Users, Trash2 } from 'lucide-react';

export default function TournamentTeamsModal({ category, tournamentId }: { category: any; tournamentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    teamName: '',
    player1Name: '',
    player1Phone: '',
    player2Name: '',
    player2Phone: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.player1Name || !formData.player1Phone || !formData.player2Name || !formData.player2Phone) return;
    setLoading(true);
    await registerTeam(tournamentId, category.id, formData);
    setFormData({ teamName: '', player1Name: '', player1Phone: '', player2Name: '', player2Phone: '' });
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('¿Eliminar esta pareja?')) return;
    setLoading(true);
    await deleteTeam(teamId);
    setLoading(false);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* @ts-expect-error - asChild type issue */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-1" /> Inscriptos ({category.teams?.length || 0})
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscriptos — {category.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* LISTA */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left font-medium">Pareja</th>
                  <th className="p-2 text-left font-medium">Jugador 1</th>
                  <th className="p-2 text-left font-medium">Jugador 2</th>
                  <th className="p-2 text-center font-medium">Pagó</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {category.teams?.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 font-medium">{t.name || '-'}</td>
                    <td className="p-2">{t.player1?.name || t.phone1 || '-'}</td>
                    <td className="p-2">{t.player2?.name || t.phone2 || '-'}</td>
                    <td className="p-2 text-center">{t.isPaid ? '✅' : '❌'}</td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!category.teams?.length && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-500">No hay inscriptos aún</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FORMULARIO MANUAL */}
          <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm">Agregar Pareja Manualmente</h3>

            <div>
              <Label className="text-xs">Nombre de la Pareja</Label>
              <Input value={formData.teamName} onChange={e => setFormData({ ...formData, teamName: e.target.value })} placeholder="Ej: González / Pérez" className="h-9 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre Jugador 1</Label>
                <Input required value={formData.player1Name} onChange={e => setFormData({ ...formData, player1Name: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Teléfono J1</Label>
                <Input required type="tel" value={formData.player1Phone} onChange={e => setFormData({ ...formData, player1Phone: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre Jugador 2</Label>
                <Input required value={formData.player2Name} onChange={e => setFormData({ ...formData, player2Name: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Teléfono J2</Label>
                <Input required type="tel" value={formData.player2Phone} onChange={e => setFormData({ ...formData, player2Phone: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>

            <Button type="submit" disabled={loading} size="sm" className="w-full">
              {loading ? 'Guardando...' : 'Agregar Pareja'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
