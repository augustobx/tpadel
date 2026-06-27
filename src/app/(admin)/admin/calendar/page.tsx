import { getCourts } from "@/actions/courts";
import AdminCalendar from "@/components/AdminCalendar";

export default async function CalendarPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string, highlight?: string }>
}) {
    const params = await searchParams;
    const response = await getCourts();

    // Filtramos solo las canchas operativas para la gestión del calendario
    const activeCourts = response.success && response.data
        ? response.data.filter(court => court.isActive)
        : [];

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Calendario Operativo
                    </h1>
                    <p className="text-slate-500 font-medium">Gestión de turnos y visualización de espacios libres.</p>
                </div>
            </div>

            {activeCourts.length > 0 ? (
                <AdminCalendar courts={activeCourts} initialDate={params.date} highlightBookingId={params.highlight} />
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border-2 border-dashed rounded-3xl">
                    <p className="text-slate-500 font-bold text-lg">No hay canchas activas configuradas.</p>
                </div>
            )}
        </div>
    );
}