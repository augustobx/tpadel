import { getSettings } from "@/actions/settings";
import PublicNavbar from "@/components/PublicNavbar";
import MisTurnosClient from "./MisTurnosClient";

export default async function MisTurnosPage() {
    const settings = await getSettings();
    const theme = settings?.theme || 'light';

    return (
        <div className={`${theme} min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:items-center md:py-8`}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen md:min-h-0 md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
                <PublicNavbar sysSettings={settings} />
                <MisTurnosClient />
            </div>
        </div>
    );
}
