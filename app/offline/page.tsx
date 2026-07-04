export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b2740] px-6 text-white">
      <section className="max-w-md rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-amber-300">Modo offline</p>
        <h1 className="text-3xl font-semibold">Sem conexão no momento</h1>
        <p className="mt-4 text-sm leading-6 text-white/75">
          O aplicativo foi instalado como PWA, mas esta tela ainda depende de uma conexão para carregar os dados.
        </p>
      </section>
    </main>
  );
}