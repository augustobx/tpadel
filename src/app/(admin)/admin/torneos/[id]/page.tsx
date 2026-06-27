import { getTournamentFull } from "@/actions/tournaments";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TournamentManager from "@/components/TournamentManager";

export default async function TournamentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getTournamentFull(params.id);
  const tournament = res.success ? res.data : null;

  if (!tournament) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Torneo no encontrado</h1>
        <Link href="/admin/torneos" className="text-blue-500 hover:underline mt-4 inline-block">Volver a Torneos</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/torneos" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{tournament.name}</h1>
        <Badge variant={tournament.isPublished ? "default" : "secondary"} className={tournament.isPublished ? "bg-green-500 text-white ml-auto" : "ml-auto"}>
          {tournament.isPublished ? "Publicado" : "Oculto"}
        </Badge>
      </div>

      <TournamentManager tournament={JSON.parse(JSON.stringify(tournament))} />
    </div>
  );
}
