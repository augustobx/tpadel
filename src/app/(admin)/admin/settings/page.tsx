import { prisma } from "@/lib/prisma";
import { updateSystemSettings } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PushConfig from "@/components/PushConfig";

export default async function SettingsPage() {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: {
                clubName: "PSP Padel", topbarName: "PSP Padel", contactPhone: "", courtPhone: "", apiPhone: "", mpAccessToken: "", reservationFee: 0,
                sportEmoji: "🎾", theme: "light", pwaEnabled: true, autoWhatsapp: false,
                requireDeposit: true, reservationsEnabled: true, whatsappReservations: true,
                splashLogo: "PSP", splashName: "PSP Padel", splashDuration: 1500,
                bubbleActive: false, bubbleText: "¡Bienvenidos!", bubbleDuration: 3000, bubbleColor: "#10b981"
            }
        });
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-500">Administra las preferencias generales, reservas y PWA.</p>
            </div>

            <form action={updateSystemSettings} className="space-y-6" key={settings.updatedAt?.toISOString()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* GENERAL Y APARIENCIA */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>Datos básicos, visuales y teléfonos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clubName">Nombre (Meta/Correos)</Label>
                                        <Input id="clubName" name="clubName" defaultValue={settings.clubName} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="topbarName">Nombre (Barra Superior)</Label>
                                        <Input id="topbarName" name="topbarName" defaultValue={settings.topbarName || ''} placeholder="Ej: PSP Padel" />
                                    </div>
                                </div>

                                {/* LOS 3 TELÉFONOS */}
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Teléfono Público (Contacto general)</Label>
                                    <Input id="contactPhone" name="contactPhone" defaultValue={settings.contactPhone} placeholder="Ej: 549..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="courtPhone">Nº Cancha (Recibe Alertas)</Label>
                                        <Input id="courtPhone" name="courtPhone" defaultValue={settings.courtPhone || ''} placeholder="Ej: 549..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apiPhone">Nº API (Botón Reservas)</Label>
                                        <Input id="apiPhone" name="apiPhone" defaultValue={settings.apiPhone || ''} placeholder="Ej: 549..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="sportEmoji">Emoji del Deporte</Label>
                                        <Input id="sportEmoji" name="sportEmoji" defaultValue={settings.sportEmoji} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="theme">Tema (Color)</Label>
                                        <select id="theme" name="theme" defaultValue={settings.theme} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                                            <option value="light">Claro</option>
                                            <option value="dark">Oscuro</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ESTADO DEL SISTEMA DE RESERVAS */}
                        <Card className="border-red-200">
                            <CardHeader className="bg-red-50/50 rounded-t-lg">
                                <CardTitle>Estado de las Reservas</CardTitle>
                                <CardDescription>Control general de la web y WhatsApp.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="reservationsEnabled">Activar Reservas Web</Label>
                                        <p className="text-xs text-gray-500">Si se apaga, pausará la grilla web.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="reservationsEnabled" name="reservationsEnabled" defaultChecked={settings.reservationsEnabled} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="whatsappReservations">Permitir Reservas por WhatsApp</Label>
                                        <p className="text-xs text-gray-500">Muestra el botón de WhatsApp a los clientes.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="whatsappReservations" name="whatsappReservations" defaultChecked={settings.whatsappReservations} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="tournamentsEnabled">Habilitar Módulo de Torneos</Label>
                                        <p className="text-xs text-gray-500">Muestra la sección de torneos en la PWA.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="tournamentsEnabled" name="tournamentsEnabled" defaultChecked={settings.tournamentsEnabled} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* MÓDULO DE USUARIOS */}
                        <Card className="border-emerald-200">
                            <CardHeader className="bg-emerald-50/50 rounded-t-lg">
                                <CardTitle>Módulo de Usuarios</CardTitle>
                                <CardDescription>Registro de jugadores y beneficios.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="usersModuleEnabled">Activar Módulo de Usuarios</Label>
                                        <p className="text-xs text-gray-500">Permite a los jugadores registrarse e iniciar sesión.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="usersModuleEnabled" name="usersModuleEnabled" defaultChecked={settings.usersModuleEnabled} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="requireDepositForRegistered">Exigir seña a registrados</Label>
                                        <p className="text-xs text-gray-500">Si lo desactivas, los registrados reservan sin pagar seña.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="requireDepositForRegistered" name="requireDepositForRegistered" defaultChecked={settings.requireDepositForRegistered} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SEGURIDAD ADMIN */}
                        <Card className="border-indigo-200">
                            <CardHeader className="bg-indigo-50/50 rounded-t-lg">
                                <CardTitle>Seguridad Panel Admin</CardTitle>
                                <CardDescription>Credenciales para entrar a esta sección.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="adminUser">Usuario</Label>
                                        <Input id="adminUser" name="adminUser" defaultValue={settings.adminUser} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="adminPass">Contraseña</Label>
                                        <Input id="adminPass" name="adminPass" type="password" defaultValue={settings.adminPass} required />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PAGOS, NOTIFICACIONES Y BURBUJA */}
                    <div className="space-y-6">
                        {/* AQUI INSERTAMOS EL NUEVO COMPONENTE PUSHCONFIG QUE ES DE CLIENTE */}
                        <PushConfig />

                        <Card>
                            <CardHeader>
                                <CardTitle>Pagos y API de Meta</CardTitle>
                                <CardDescription>MercadoPago y Notificaciones.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reservationFee">Costo Seña ($)</Label>
                                        <Input id="reservationFee" name="reservationFee" type="number" defaultValue={settings.reservationFee} required />
                                    </div>
                                    <div className="space-y-2 pt-8">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" id="requireDeposit" name="requireDeposit" defaultChecked={settings.requireDeposit} className="w-4 h-4 rounded border-gray-300" />
                                            <span className="text-sm font-medium">Requerir Seña</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mpAccessToken">MercadoPago Access Token</Label>
                                    <Input id="mpAccessToken" name="mpAccessToken" type="password" defaultValue={settings.mpAccessToken} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 mt-2">
                                    <Label htmlFor="autoWhatsapp">Notificaciones Automáticas API Meta</Label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="autoWhatsapp" name="autoWhatsapp" defaultChecked={settings.autoWhatsapp} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 mt-2">
                                    <div>
                                        <Label htmlFor="notifyAdmin">Notificar al Admin de Reservas</Label>
                                        <p className="text-xs text-gray-500">Enviar WhatsApp al Nº de Cancha en cada reserva confirmada.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="notifyAdmin" name="notifyAdmin" defaultChecked={settings.notifyAdmin} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Burbuja de Mensaje</CardTitle>
                                <CardDescription>Aviso flotante para los clientes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label htmlFor="bubbleActive">Activar Burbuja</Label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="bubbleActive" name="bubbleActive" defaultChecked={settings.bubbleActive} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bubbleText">Mensaje a mostrar</Label>
                                    <Input id="bubbleText" name="bubbleText" defaultValue={settings.bubbleText} placeholder="Ej: ¡Hoy torneo!" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bubbleColor">Color del Fondo</Label>
                                        <div className="flex gap-2">
                                            <Input id="bubbleColor" name="bubbleColor" type="color" defaultValue={settings.bubbleColor} className="w-12 p-1 h-10" />
                                            <Input defaultValue={settings.bubbleColor} disabled className="h-10 text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bubbleDuration">Duración (ms)</Label>
                                        <Input id="bubbleDuration" name="bubbleDuration" type="number" defaultValue={settings.bubbleDuration} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PWA Y SPLASH SCREEN */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>PWA & Splash Screen</CardTitle>
                            <CardDescription>Configuración de la aplicación web instalable.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                                <div>
                                    <Label htmlFor="pwaEnabled" className="text-base font-medium">Activar funciones PWA</Label>
                                    <p className="text-sm text-gray-500">Habilita el comportamiento de app.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="pwaEnabled" name="pwaEnabled" defaultChecked={settings.pwaEnabled} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="splashName">Nombre en Splash</Label>
                                    <Input id="splashName" name="splashName" defaultValue={settings.splashName || ''} placeholder="Ej: PSP Padel" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="splashLogo">URL Logo Splash</Label>
                                    <Input id="splashLogo" name="splashLogo" defaultValue={settings.splashLogo || ''} placeholder="/logo.png" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="splashDuration">Duración (ms)</Label>
                                    <Input id="splashDuration" name="splashDuration" type="number" defaultValue={settings.splashDuration} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" size="lg" className="w-full md:w-auto">Guardar Cambios</Button>
                </div>
            </form>
        </div>
    );
}