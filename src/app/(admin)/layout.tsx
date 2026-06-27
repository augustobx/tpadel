import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* El Sidebar maneja su propia lógica responsiva (Menu hamburguesa en mobile) */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* 
          overflow-y-auto permite que esta sección scrollee independientemente del sidebar en PC.
          w-full asegura que no se desborde horizontalmente en celulares.
        */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}