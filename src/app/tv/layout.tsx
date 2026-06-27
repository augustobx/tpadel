export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-950 min-h-screen text-white overflow-hidden">
      {children}
    </div>
  );
}
