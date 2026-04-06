"use client";

import { useState } from "react";
import StaffModal from "@/components/dashboard/StaffModal";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import type { Personal, Servicio } from "@/types/database";

interface EquipoClientProps {
  personal: Personal[];
  servicios: Servicio[];
  personalServicios: Record<string, string[]>;
  turnoCount: Record<string, number>;
  comercioId: string;
}

export default function EquipoClient({
  personal,
  servicios,
  personalServicios,
  turnoCount,
  comercioId,
}: EquipoClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Personal | null>(null);

  const openCreate = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const openEdit = (staff: Personal) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

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
        <CollapsibleSection
          title="Mi Equipo"
          subtitle={`${personal.length} profesionales activos`}
          headerRight={addButton}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {personal.map((staff) => {
              const initials = staff.nombre.split(" ").map((n) => n[0]).join("").substring(0, 2);
              const tHoy = turnoCount[staff.id] || 0;
              const staffSvcs = personalServicios[staff.id] || [];
              const svcNames = staffSvcs
                .map((sid) => servicios.find((s) => s.id === sid)?.nombre)
                .filter(Boolean);

              return (
                <button
                  key={staff.id}
                  onClick={() => openEdit(staff)}
                  className="bg-white rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] border border-[#3C3C4315] hover:shadow-md hover:border-[var(--color-mint)] transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-mint-dark)] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                      {staff.avatar_url ? (
                        <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-tight truncate">{staff.nombre}</h3>
                        <svg className="w-3.5 h-3.5 text-[var(--color-label-tertiary)] opacity-0 group-hover:opacity-100 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-[12px] text-[var(--color-label-tertiary)]">
                        {staff.especialidad || staff.rol}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-mint-dark)] bg-[var(--color-mint-light)] px-2 py-0.5 rounded-full">
                          {tHoy} turnos hoy
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          staff.rol === "admin" ? "bg-[#AF52DE20] text-[#AF52DE]" : "bg-[#8E8E9320] text-[#8E8E93]"
                        }`}>
                          {staff.rol === "admin" ? "Admin" : "Staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Services this staff performs */}
                  {svcNames.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#3C3C4315]">
                      <div className="flex flex-wrap gap-1">
                        {svcNames.map((name, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#007AFF15] text-[#007AFF]">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {svcNames.length === 0 && (
                    <div className="mt-3 pt-3 border-t border-[#3C3C4315]">
                      <span className="text-[10px] text-[var(--color-label-tertiary)] italic">Sin servicios asignados</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>
      </div>

      {/* Modal */}
      {modalOpen && (
        <StaffModal
          staff={editingStaff}
          servicios={servicios}
          staffServicios={editingStaff ? (personalServicios[editingStaff.id] || []) : []}
          comercioId={comercioId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
