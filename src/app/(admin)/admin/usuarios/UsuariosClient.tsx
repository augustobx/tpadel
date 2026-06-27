'use client';

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User as UserIcon, Edit, ShieldBan, CheckCircle2, Search, ArrowLeft, CalendarDays, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateUserAdmin } from "@/actions/admin-users";

type UserData = {
    id: string;
    name: string | null;
    lastName: string | null;
    dni: string | null;
    phone: string | null;
    email: string | null;
    category: string | null;
    isActive: boolean;
    createdAt: Date;
    _count: { bookings: number };
};

export default function UsuariosClient({ initialUsers }: { initialUsers: UserData[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Form state for editing
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        phone: "",
        category: "",
        isActive: true,
        password: ""
    });

    const openUserDetail = (user: UserData) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            category: user.category || "",
            isActive: user.isActive,
            password: ""
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsLoading(true);

        const res = await updateUserAdmin(selectedUser.id, formData);
        
        if (res.success) {
            alert("Usuario actualizado correctamente");
            setUsers(users.map(u => u.id === selectedUser.id ? { 
                ...u, 
                name: formData.name, 
                lastName: formData.lastName, 
                phone: formData.phone,
                category: formData.category,
                isActive: formData.isActive
            } : u));
            
            // Actualizar vista detalle si sigue abierta
            setSelectedUser(prev => prev ? {
                ...prev,
                name: formData.name, 
                lastName: formData.lastName, 
                phone: formData.phone,
                category: formData.category,
                isActive: formData.isActive
            } : null);

            setFormData(prev => ({ ...prev, password: "" })); // Clear password field
        } else {
            alert(res.error || "Error al actualizar");
        }
        
        setIsLoading(false);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                (user.name && user.name.toLowerCase().includes(searchLower)) ||
                (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
                (user.dni && user.dni.includes(searchLower)) ||
                (user.phone && user.phone.includes(searchLower));

            const matchesCategory = categoryFilter === "ALL" || user.category === categoryFilter;
            
            let matchesStatus = true;
            if (statusFilter === "ACTIVE") matchesStatus = user.isActive === true;
            if (statusFilter === "BLOCKED") matchesStatus = user.isActive === false;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [users, searchTerm, categoryFilter, statusFilter]);

    if (selectedUser) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedUser(null)} 
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {selectedUser.name} {selectedUser.lastName}
                            {selectedUser.isActive ? 
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</Badge> : 
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none"><ShieldBan className="w-3 h-3 mr-1" /> Bloqueado</Badge>
                            }
                        </h2>
                        <p className="text-slate-500">Gestión de cuenta y permisos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Estadísticas Rápidas */}
                    <Card className="md:col-span-1 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-emerald-800 dark:text-emerald-400">Total Reservas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-emerald-950 dark:text-emerald-50">{selectedUser._count.bookings}</div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-blue-800 dark:text-blue-400">Miembro desde</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-blue-950 dark:text-blue-50">
                                {new Date(selectedUser.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-purple-800 dark:text-purple-400">Categoría Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-purple-950 dark:text-purple-50">
                                {selectedUser.category || 'N/A'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Formulario Principal */}
                    <Card className="md:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-blue-500" /> Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="user-form" onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre</label>
                                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Apellido</label>
                                        <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">DNI (Solo Lectura)</label>
                                        <input disabled value={selectedUser.dni || ''} className="w-full px-4 py-2 border bg-slate-50 dark:bg-slate-900 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Teléfono</label>
                                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email (Solo Lectura)</label>
                                        <input disabled value={selectedUser.email || ''} className="w-full px-4 py-2 border bg-slate-50 dark:bg-slate-900 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Categoría de Juego</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white dark:bg-slate-900">
                                            <option value="">Sin Categoría</option>
                                            <option value="8va">8va</option>
                                            <option value="7ma">7ma</option>
                                            <option value="6ta">6ta</option>
                                            <option value="5ta">5ta</option>
                                            <option value="4ta">4ta</option>
                                            <option value="3ra">3ra</option>
                                            <option value="2da">2da</option>
                                            <option value="1ra">1ra</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Formulario Seguridad */}
                    <Card className="md:col-span-1 shadow-sm border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-red-500" /> Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Forzar Cambio de Contraseña</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Dejar en blanco para no cambiar" className="w-full px-4 py-2 border rounded-xl" />
                                <p className="text-xs text-slate-500">Si escribes algo aquí, la contraseña antigua dejará de funcionar.</p>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                <div>
                                    <p className="font-bold text-sm">Estado de la Cuenta</p>
                                    <p className="text-xs text-slate-500 mt-1">{formData.isActive ? 'El usuario tiene acceso normal al sistema.' : 'El usuario está bloqueado y no puede entrar.'}</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                                    className={`w-full py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${formData.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                                >
                                    {formData.isActive ? <><ShieldBan className="w-4 h-4"/> Bloquear Acceso</> : <><CheckCircle2 className="w-4 h-4"/> Activar Acceso</>}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={() => setSelectedUser(null)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                        Volver a la Lista
                    </button>
                    <button form="user-form" type="submit" disabled={isLoading} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-sm transition-all disabled:opacity-50">
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-emerald-500" /> 
                        Lista de Jugadores
                    </div>
                    <Badge variant="outline" className="text-sm font-normal">
                        Total: {filteredUsers.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                
                {/* FILTROS */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            placeholder="Buscar por nombre, DNI o teléfono..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                            <option value="ALL">Todas las Categorías</option>
                            <option value="8va">8va</option>
                            <option value="7ma">7ma</option>
                            <option value="6ta">6ta</option>
                            <option value="5ta">5ta</option>
                            <option value="4ta">4ta</option>
                            <option value="3ra">3ra</option>
                            <option value="2da">2da</option>
                            <option value="1ra">1ra</option>
                        </select>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                            <option value="ALL">Todos los Estados</option>
                            <option value="ACTIVE">Activos</option>
                            <option value="BLOCKED">Bloqueados</option>
                        </select>
                    </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold">Jugador</TableHead>
                                <TableHead className="font-bold">Contacto</TableHead>
                                <TableHead className="font-bold text-center">Nivel</TableHead>
                                <TableHead className="font-bold text-center">Reservas</TableHead>
                                <TableHead className="font-bold text-center">Estado</TableHead>
                                <TableHead className="text-right font-bold">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <Search className="w-8 h-8 text-slate-300" />
                                            <p className="font-medium text-slate-500">No se encontraron usuarios con esos filtros.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map(user => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => openUserDetail(user)}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">{user.name} {user.lastName}</span>
                                                <span className="text-xs text-slate-500">DNI: {user.dni || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{user.phone || '-'}</span>
                                                <span className="text-xs text-slate-500">{user.email || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.category ? (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-bold">
                                                    {user.category}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-bold">
                                                {user._count.bookings}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.isActive ? 
                                                <div className="flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div> : 
                                                <div className="flex items-center justify-center text-red-600"><ShieldBan className="w-4 h-4" /></div>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openUserDetail(user); }} 
                                                className="px-4 py-2 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-semibold rounded-lg transition-colors text-sm"
                                            >
                                                Ver Perfil
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
