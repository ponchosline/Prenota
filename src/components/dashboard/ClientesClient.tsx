"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import ClienteModal from "@/components/dashboard/ClienteModal";
import ClienteDetailDrawer from "@/components/dashboard/ClienteDetailDrawer";
import { crearCliente } from "@/app/dashboard/crud-actions";

interface ClienteData {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  notas?: string | null;
  puntos_fidelizacion: number;
}

interface ClientesClientProps {
  comercioId: string;
  clientes: ClienteData[];
  rewardMap: Record<string, number>;
  lastVisitMap: Record<string, string>;
  turnoCountMap: Record<string, number>;
}

function getTier(points: number) {
  if (points >= 200) return { label: "💎 Diamante", color: "text-[#5856D6]", bg: "bg-[#5856D620]" };
  if (points >= 100) return { label: "🥇 Oro", color: "text-[#FF9500]", bg: "bg-[#FF950020]" };
  if (points >= 50) return { label: "🥈 Plata", color: "text-[#8E8E93]", bg: "bg-[#8E8E9320]" };
  return { label: "🥉 Bronce", color: "text-[#AC8E68]", bg: "bg-[#AC8E6820]" };
}

export default function ClientesClient({ comercioId, clientes, rewardMap, lastVisitMap, turnoCountMap }: ClientesClientProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<ClienteData | null>(null);
  const [search, setSearch] = useState("");

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  );

  const totalPoints = Object.values(rewardMap).reduce((s, p) => s + p, 0);

  const handleCreate = async (fd: FormData) => {
    await crearCliente(fd);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-[#FF950008] to-[#FF950015] border border-[#FF950030] rounded-[var(--radius-lg)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Total Clientes</div>
          <div className="text-[22px] sm:text-[28px] font-bold mt-1">{clientes.length}</div>
        </div>
        <div className="bg-gradient-to-br from-[#AF52DE08] to-[#AF52DE15] border border-[#AF52DE30] rounded-[var(--radius-lg)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Puntos Totales</div>
          <div className="text-[22px] sm:text-[28px] font-bold mt-1 text-[#AF52DE]">{totalPoints}</div>
        </div>
        <div className="bg-gradient-to-br from-[#34C75908] to-[#34C75915] border border-[#34C75930] rounded-[var(--radius-lg)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Diamante</div>
          <div className="text-[22px] sm:text-[28px] font-bold mt-1 text-[#5856D6]">
            {clientes.filter(c => (rewardMap[c.id] || 0) >= 200).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#007AFF08] to-[#007AFF15] border border-[#007AFF30] rounded-[var(--radius-lg)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Prom. Visitas</div>
          <div className="text-[22px] sm:text-[28px] font-bold mt-1 text-[#007AFF]">
            {clientes.length > 0 ? Math.round(Object.values(turnoCountMap).reduce((s, v) => s + v, 0) / clientes.length) : 0}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar clientes..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#3C3C4330] rounded-[var(--radius-md)] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
        />
      </div>

      {/* Client list */}
      <CollapsibleSection
        title="Clientes"
        subtitle={`${filtered.length} registrados`}
        headerRight={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-mint)] text-white text-[13px] font-semibold hover:bg-[var(--color-mint-dark)] transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>
        }
      >
        <div className="space-y-2">
          {filtered.map((cliente) => {
            const initials = cliente.nombre.split(" ").map(n => n[0]).join("").substring(0, 2);
            const points = rewardMap[cliente.id] || 0;
            const tier = getTier(points);
            const lastVisit = lastVisitMap[cliente.id];
            const visitCount = turnoCountMap[cliente.id] || 0;

            return (
              <div
                key={cliente.id}
                onClick={() => setDetailClient(cliente)}
                className="bg-white rounded-[var(--radius-md)] p-3 sm:p-4 shadow-[var(--shadow-card)] border border-[#3C3C4315] hover:shadow-md hover:border-[var(--color-mint)] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#FF9500] to-[#FF2D55] flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] sm:text-[15px] font-semibold tracking-tight truncate">{cliente.nombre}</h3>
                      <span className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.color} shrink-0`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[var(--color-label-tertiary)] mt-0.5">
                      {cliente.telefono && <span>{cliente.telefono}</span>}
                      {cliente.email && <span className="hidden sm:inline">· {cliente.email}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-[14px] font-bold text-[var(--color-mint-dark)]">{points} pts</div>
                    <div className="text-[11px] text-[var(--color-label-tertiary)]">{visitCount} visitas</div>
                  </div>
                  <div className="sm:hidden text-right shrink-0">
                    <div className="text-[13px] font-bold text-[var(--color-mint-dark)]">{points}</div>
                    <div className="text-[10px] text-[var(--color-label-tertiary)]">pts</div>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-label-tertiary)] opacity-0 group-hover:opacity-100 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="hidden sm:flex items-center gap-4 mt-2 pt-2 border-t border-[#3C3C4315] text-[11px] text-[var(--color-label-tertiary)]">
                  <span>Última visita: {lastVisit ? new Date(lastVisit).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "Sin visitas"}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--color-label-tertiary)]">
              {search ? "No se encontraron clientes con ese criterio." : "No hay clientes registrados."}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Create modal (only for new clients) */}
      <ClienteModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        comercioId={comercioId}
        cliente={null}
        onSave={handleCreate}
      />

      {/* Detail drawer */}
      {detailClient && (
        <ClienteDetailDrawer
          isOpen={!!detailClient}
          onClose={() => setDetailClient(null)}
          comercioId={comercioId}
          cliente={detailClient}
        />
      )}
    </div>
  );
}
