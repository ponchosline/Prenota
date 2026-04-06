import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-[var(--color-label-primary)] mb-4">
          Prenota
        </h1>
        <p className="text-xl text-[var(--color-label-tertiary)] mb-8">
          Gestión moderna de turnos, agendas y fidelización de clientes para tu negocio.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[var(--color-mint)] text-white font-semibold text-base px-8 py-4 rounded-full shadow-sm hover:bg-[var(--color-mint-dark)] hover:shadow-md transition-all duration-200 active:scale-95"
        >
          Ir al Panel de Control →
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
        {[
          { title: "Agenda Multipista", desc: "Visualizá la ocupación de todo tu equipo en tiempo real." },
          { title: "Reservas Online", desc: "Tus clientes reservan desde su celular, 24/7." },
          { title: "Fidelización", desc: "Sistema de puntos que hace que tus clientes vuelvan." },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-transform"
          >
            <h3 className="text-lg font-semibold text-[var(--color-label-primary)] mb-2">{f.title}</h3>
            <p className="text-sm text-[var(--color-label-tertiary)]">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
