import { getCourts } from "@/actions/courts";
import AdminMonthlyCalendar from "@/components/AdminMonthlyCalendar";

export default async function MonthlyCalendarPage() {
    const response = await getCourts();
    const activeCourts = response.success && response.data
        ? response.data.filter(court => court.isActive)
        : [];

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Mes Completo
                    </h1>
                    <p className="text-slate-500 font-medium">Vista mensual de turnos. Toca un día para ver sus detalles.</p>
                </div>
            </div>

            <AdminMonthlyCalendar courts={activeCourts} />
        </div>
    );
}
