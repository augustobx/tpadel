import { prisma } from "@/lib/prisma";
import UsuariosClient from "./UsuariosClient";

export default async function AdminUsuariosPage() {
    const users = await prisma.user.findMany({
        where: { 
            role: "PLAYER",
            password: { not: null } // Solo mostrar usuarios registrados
        },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { bookings: true }
            }
        }
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Usuarios Registrados</h1>
                <p className="text-gray-500">Gestión de jugadores de la comunidad PSP.</p>
            </div>

            <UsuariosClient initialUsers={users} />
        </div>
    );
}
