export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-[#17182b]" />
        <p className="text-sm font-semibold text-slate-700">Carregando...</p>
      </div>
    </div>
  );
}
