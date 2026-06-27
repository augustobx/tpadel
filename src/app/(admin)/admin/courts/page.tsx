import { getCourts } from "@/actions/courts";
import CourtFormModal from "@/components/CourtFormModal";
import CourtScheduleModal from "@/components/CourtScheduleModal"; // <-- Nuevo import
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CourtsPage() {
  const response = await getCourts();
  const courts = response.success && response.data ? response.data : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestión de Canchas</h1>
        <CourtFormModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canchas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>{court.sport}</TableCell>
                  <TableCell>
                    <Badge variant={court.isActive ? "default" : "destructive"}>
                      {court.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Botón de configuración de horarios */}
                      <CourtScheduleModal court={court} />
                      {/* Botón de edición de datos básicos */}
                      <CourtFormModal court={court} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {courts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                    {response.error || "No hay canchas registradas."}
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