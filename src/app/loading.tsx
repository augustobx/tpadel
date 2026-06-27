export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center justify-center p-8">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  )
}
