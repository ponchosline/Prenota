"use client";

import { useState } from "react";
import ServiceModal from "@/components/dashboard/ServiceModal";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import type { Servicio } from "@/types/database";

interface ServiciosClientProps {
  servicios: Servicio[];
  comercioId: string;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  facial: { bg: "bg-[#FF2D5520]", text: "text-[#FF2D55]" },
  corporal: { bg: "bg-[#FF950020]", text: "text-[#FF9500]" },
  capilar: { bg: "bg-[#AF52DE20]", text: "text-[#AF52DE]" },
  masajes: { bg: "bg-[#007AFF20]", text: "text-[#007AFF]" },
  dermatología: { bg: "bg-[#5856D620]", text: "text-[#5856D6]" },
  barbería: { bg: "bg-[#8E8E9320]", text: "text-[#636366]" },
  bienestar: { bg: "bg-[#34C75920]", text: "text-[#34C759]" },
  yoga: { bg: "bg-[#34C75920]", text: "text-[#34C759]" },
};

function getCategoryStyle(cat: string) {
  const lower = cat.toLowerCase();
  for (const [key, value] of Object.entries(categoryColors)) {
    if (lower.includes(key)) return value;
  }
  return { bg: "bg-[#8E8E9320]", text: "text-[#8E8E93]" };
}

export default function ServiciosClient({ servicios, comercioId }: ServiciosClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

  const openCreate = () => {
    setEditingServicio(null);
    setModalOpen(true);
  };

  const openEdit = (s: Servicio) => {
    setEditingServicio(s);
    setModalOpen(true);
  };

  // Group by category
  const categories: Record<string, Servicio[]> = {};
  for (const s of servicios) {
    const cat = (s as Record<string, unknown>).categoria as string || "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  }

  const totalServicios = servicios.length;
  const avgPrice = servicios.length > 0
    ? Math.round(servicios.reduce((sum, s) => sum + Number(s.precio), 0) / servicios.length)
    : 0;

  const addButton = (
    <button
      onClick={openCreate}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-mint)] text-white text-[13px] font-semibold hover:bg-[var(--color-mint-dark)] transition shadow-sm active:scale-95"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="hidden sm:inline">Agregar</span>
    </button>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-[#007AFF08] to-[#007AFF15] border border-[#007AFF30] rounded-[var(--radius-lg)] p-3 sm:p-4">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Total</div>
            <div className="text-[22px] sm:text-[28px] font-bold mt-1">{totalServicios}</div>
            <div className="text-[11px] text-[var(--color-label-tertiary)]">servicios activos</div>
          </div>
          <div className="bg-gradient-to-br from-[#34C75908] to-[#34C75915] border border-[#34C75930] rounded-[var(--radius-lg)] p-3 sm:p-4">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Precio Prom.</div>
            <div className="text-[22px] sm:text-[28px] font-bold mt-1 text-[var(--color-mint-dark)]">{formatCurrency(avgPrice)}</div>
            <div className="text-[11px] text-[var(--color-label-tertiary)]">promedio</div>
          </div>
          <div className="hidden sm:block bg-gradient-to-br from-[#AF52DE08] to-[#AF52DE15] border border-[#AF52DE30] rounded-[var(--radius-lg)] p-3 sm:p-4">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Categorías</div>
            <div className="text-[22px] sm:text-[28px] font-bold mt-1 text-[#AF52DE]">{Object.keys(categories).length}</div>
            <div className="text-[11px] text-[var(--color-label-tertiary)]">tipos de servicio</div>
          </div>
        </div>

        {/* Services by category */}
        {Object.entries(categories).map(([cat, services]) => {
          const catStyle = getCategoryStyle(cat);
          return (
            <CollapsibleSection key={cat} title={cat} subtitle={`${services.length} servicios`} headerRight={addButton}>
              <div className="space-y-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s)}
                    className="w-full bg-white rounded-[var(--radius-md)] p-3 sm:p-4 shadow-[var(--shadow-card)] border border-[#3C3C4315] flex items-center gap-3 hover:shadow-md hover:border-[var(--color-mint)] transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-[var(--radius-sm)] ${catStyle.bg} flex items-center justify-center shrink-0`}>
                      <svg className={`w-5 h-5 ${catStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] sm:text-[15px] font-semibold tracking-tight truncate">{s.nombre}</div>
                        <svg className="w-3.5 h-3.5 text-[var(--color-label-tertiary)] opacity-0 group-hover:opacity-100 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div className="text-[11px] sm:text-[12px] text-[var(--color-label-tertiary)]">
                        {formatDuration(s.duracion_minutos)} · Hasta {Math.round(Number(s.precio) / 500)} pts
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[15px] sm:text-[17px] font-bold text-[var(--color-label-primary)]">
                        {formatCurrency(Number(s.precio))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          );
        })}
      </div>

      {modalOpen && (
        <ServiceModal
          servicio={editingServicio}
          comercioId={comercioId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
