import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          El Mejor Lugar para <span className="text-blue-600">Jugar</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Reserva tu cancha en segundos, únete a nuestros torneos y gestiona tus pagos de forma rápida y segura.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/reservas" className={buttonVariants({ size: "lg", className: "text-lg px-8" })}>
            Reservar Cancha
          </Link>
          <Link href="/admin/dashboard" className={buttonVariants({ variant: "outline", size: "lg", className: "text-lg px-8" })}>
            Acceso Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
