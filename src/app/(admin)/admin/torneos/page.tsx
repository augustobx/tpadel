import { getTournaments, deleteTournament } from "@/actions/tournaments";
import TournamentFormModal from "@/components/TournamentFormModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TournamentsPage() {
  const response = await getTournaments();
  const tournaments = response.success && response.data ? response.data : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestión de Torneos</h1>
        <TournamentFormModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Torneos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {format(new Date(t.startDate), "d MMM yyyy", { locale: es })}
                    {' - '}
                    {format(new Date(t.endDate), "d MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'DRAFT' ? 'secondary' : t.status === 'ONGOING' ? 'default' : 'outline'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isPublished ? "default" : "secondary"} className={t.isPublished ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                      {t.isPublished ? "Publicado" : "Oculto"}
                    </Badge>
                  </TableCell>
                  <TableCell>{t._count.categories}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <TournamentFormModal tournament={t} />
                      <Link href={`/admin/torneos/${t.id}`}>
                        <Button variant="outline" size="sm">Gestionar</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tournaments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    {response.error || "No hay torneos registrados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
