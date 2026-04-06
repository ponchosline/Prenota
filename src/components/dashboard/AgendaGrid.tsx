"use client";

import { useState } from "react";
import AppointmentCard from "./AppointmentCard";
import CollapsibleSection from "./CollapsibleSection";
import type { Personal, Turno, Cliente, Servicio } from "@/types/database";

type TurnoConDetalles = Turno & { cliente: Cliente; servicio: Servicio; personal: Personal };

interface AgendaGridProps {
  personal: Personal[];
  turnos: TurnoConDetalles[];
}

function mapEstadoToStatus(estado: string): "confirmed" | "pending" | "progress" {
  switch (estado) {
    case "confirmado":
    case "completado":
      return "confirmed";
    case "en_progreso":
      return "progress";
    default:
      return "pending";
  }
}

function calcPoints(precio: number): string {
  const pts = Math.round(precio / 500);
  return `+${Math.max(pts, 5)} pts`;
}

// Compact mobile card for staff
function MobileStaffCard({
  staff,
  staffTurnos,
}: {
  staff: Personal;
  staffTurnos: TurnoConDetalles[];
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = staff.nombre.split(" ").map((n) => n[0]).join("").substring(0, 2);
  const nextTurno = staffTurnos[0];

  return (
    <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-mint-dark)] flex items-center justify-center text-white font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold tracking-tight truncate">
            {staff.nombre}
          </div>
          <div className="text-[11px] text-[var(--color-label-tertiary)] truncate">
            {nextTurno
              ? `Próx: ${nextTurno.hora_inicio.slice(0, 5)} · ${nextTurno.servicio?.nombre || "Servicio"}`
              : staff.especialidad || staff.rol}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-[var(--color-mint-dark)] bg-[var(--color-mint-light)] px-2 py-0.5 rounded-full">
            {staffTurnos.length}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-[var(--color-label-tertiary)] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded appointments */}
      <div
        className={`transition-all duration-300 ease-out overflow-hidden ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3.5 pb-3.5 flex flex-col gap-2 border-t border-[#3C3C4318] pt-2.5">
          {staffTurnos.length === 0 ? (
            <div className="text-center py-4 text-[12px] text-[var(--color-label-tertiary)]">
              Sin turnos agendados
            </div>
          ) : (
            staffTurnos.map((turno) => (
              <AppointmentCard
                key={turno.id}
                time={`${turno.hora_inicio.slice(0, 5)} – ${turno.hora_fin.slice(0, 5)}`}
                client={turno.cliente?.nombre || "Sin asignar"}
                service={turno.servicio?.nombre || "Servicio"}
                points={calcPoints(Number(turno.precio_cobrado || turno.servicio?.precio || 0))}
                status={mapEstadoToStatus(turno.estado)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Full desktop card for staff
function DesktopStaffCard({
  staff,
  staffTurnos,
  idx,
}: {
  staff: Personal;
  staffTurnos: TurnoConDetalles[];
  idx: number;
}) {
  const initials = staff.nombre.split(" ").map((n) => n[0]).join("").substring(0, 2);

  return (
    <div
      className="bg-white rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-card)] animate-fade-in-up"
      style={{ animationDelay: `${idx * 0.07}s` }}
    >
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-[#3C3C4333]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-mint-dark)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {initials}
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight">{staff.nombre}</div>
            <div className="text-[12px] text-[var(--color-label-tertiary)]">
              {staff.especialidad || staff.rol}
            </div>
          </div>
        </div>
        <span className="text-[12px] font-semibold text-[var(--color-mint-dark)] bg-[var(--color-mint-light)] px-2.5 py-1 rounded-full">
          {staffTurnos.length} {staffTurnos.length === 1 ? "turno" : "turnos"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {staffTurnos.length === 0 ? (
          <div className="text-center py-6 text-[13px] text-[var(--color-label-tertiary)]">
            Sin turnos agendados
          </div>
        ) : (
          staffTurnos.map((turno) => (
            <AppointmentCard
              key={turno.id}
              time={`${turno.hora_inicio.slice(0, 5)} – ${turno.hora_fin.slice(0, 5)}`}
              client={turno.cliente?.nombre || "Sin asignar"}
              service={turno.servicio?.nombre || "Servicio"}
              points={calcPoints(Number(turno.precio_cobrado || turno.servicio?.precio || 0))}
              status={mapEstadoToStatus(turno.estado)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function AgendaGrid({ personal, turnos }: AgendaGridProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const turnosByPersonal: Record<string, TurnoConDetalles[]> = {};
  for (const turno of turnos) {
    if (!turnosByPersonal[turno.personal_id]) turnosByPersonal[turno.personal_id] = [];
    turnosByPersonal[turno.personal_id].push(turno);
  }

  const datePicker = (
    <div className="inline-flex items-center bg-[#78788028] rounded-lg p-0.5 gap-px">
      <button className="p-1.5 px-2.5 sm:px-3 rounded-[7px] hover:bg-white/30 transition text-[var(--color-label-primary)]">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="px-3 sm:px-4 py-1.5 rounded-[7px] bg-white shadow-sm text-[12px] sm:text-[13px] font-medium text-[var(--color-label-primary)]">
        Hoy
      </button>
      <button className="p-1.5 px-2.5 sm:px-3 rounded-[7px] hover:bg-white/30 transition text-[var(--color-label-primary)]">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  if (personal.length === 0) {
    return (
      <CollapsibleSection title="Agenda Diaria" subtitle={formattedDate} headerRight={datePicker}>
        <div className="text-center py-12 text-[var(--color-label-tertiary)]">
          No hay profesionales configurados para este comercio.
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Agenda Diaria" subtitle={formattedDate} headerRight={datePicker}>
      {/* Mobile: compact expandable cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {personal.map((staff) => (
          <MobileStaffCard
            key={staff.id}
            staff={staff}
            staffTurnos={turnosByPersonal[staff.id] || []}
          />
        ))}
      </div>

      {/* Desktop: full grid cards */}
      <div
        className={`hidden md:grid gap-4 ${
          personal.length === 1
            ? "grid-cols-1 max-w-lg"
            : personal.length === 2
            ? "grid-cols-2"
            : personal.length === 3
            ? "grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {personal.map((staff, idx) => (
          <DesktopStaffCard
            key={staff.id}
            staff={staff}
            staffTurnos={turnosByPersonal[staff.id] || []}
            idx={idx}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
