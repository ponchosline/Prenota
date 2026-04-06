"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface TurnoData {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  precio_cobrado: number | null;
  cliente: { nombre: string } | null;
  servicio: { nombre: string; duracion_minutos: number } | null;
  personal: { id: string; nombre: string } | null;
}

interface PersonalData {
  id: string;
  nombre: string;
}

interface Props {
  comercioId: string;
  turnos: TurnoData[];
  personal: PersonalData[];
}

type View = "semana" | "mes";

const estadoColors: Record<string, string> = {
  confirmado: "bg-[#34C759] text-white",
  en_progreso: "bg-[#007AFF] text-white",
  pendiente: "bg-[#FF9500] text-white",
  completado: "bg-[#8E8E93] text-white",
  cancelado: "bg-[#FF3B30]/20 text-[#FF3B30]",
  no_show: "bg-[#FF3B30]/10 text-[#FF3B30]",
};

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const dayNamesFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const days: Date[] = [];
  for (let i = -firstDay; i < 42 - firstDay; i++) {
    days.push(new Date(year, month, 1 + i));
  }
  return days;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function timeToRow(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 7) * 4 + Math.floor(m / 15);
}

export default function CalendarioClient({ comercioId, turnos: initialTurnos, personal }: Props) {
  const [view, setView] = useState<View>("semana");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [turnos, setTurnos] = useState(initialTurnos);
  const [dragTurno, setDragTurno] = useState<TurnoData | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dragRef = useRef<{ startY: number; turnoId: string } | null>(null);

  const today = formatDateKey(new Date());
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

  const turnosByDate = useMemo(() => {
    const map: Record<string, TurnoData[]> = {};
    turnos.forEach(t => {
      if (!map[t.fecha]) map[t.fecha] = [];
      map[t.fecha].push(t);
    });
    return map;
  }, [turnos]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "semana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const getSupabase = useCallback(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const handleDrop = async (turnoId: string, newFecha: string, newHora?: string) => {
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const update: Record<string, string> = { fecha: newFecha };
    if (newHora) {
      const duracion = turno.servicio?.duracion_minutos || 60;
      const [h, m] = newHora.split(":").map(Number);
      const endMinutes = h * 60 + m + duracion;
      update.hora_inicio = newHora;
      update.hora_fin = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    }

    setTurnos(prev => prev.map(t => t.id === turnoId ? { ...t, fecha: newFecha, ...(newHora ? { hora_inicio: update.hora_inicio, hora_fin: update.hora_fin } : {}) } : t));
    await getSupabase().from("turnos").update(update).eq("id", turnoId);
  };

  const monthLabel = currentDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const weekLabel = `${weekDays[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight capitalize">
            {view === "semana" ? weekLabel : monthLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#78788014] rounded-[10px] p-1 flex">
            <button onClick={() => setView("semana")} className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${view === "semana" ? "bg-white shadow-sm" : "text-[var(--color-label-tertiary)]"}`}>Semana</button>
            <button onClick={() => setView("mes")} className={`px-3 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${view === "mes" ? "bg-white shadow-sm" : "text-[var(--color-label-tertiary)]"}`}>Mes</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-[var(--radius-sm)] bg-white border border-[#3C3C4318] flex items-center justify-center hover:bg-[#F8F8F8] transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goToday} className="px-3 h-8 rounded-[var(--radius-sm)] bg-white border border-[#3C3C4318] text-[12px] font-semibold hover:bg-[#F8F8F8] transition">Hoy</button>
            <button onClick={() => navigate(1)} className="w-8 h-8 rounded-[var(--radius-sm)] bg-white border border-[#3C3C4318] flex items-center justify-center hover:bg-[#F8F8F8] transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* WEEKLY VIEW */}
      {view === "semana" && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#3C3C4318]">
            <div className="p-2" />
            {weekDays.map((d, i) => {
              const isToday = formatDateKey(d) === today;
              return (
                <div key={i} className={`p-2 text-center border-l border-[#3C3C4312] ${isToday ? "bg-[var(--color-mint-light)]" : ""}`}>
                  <div className="text-[10px] font-semibold uppercase text-[var(--color-label-tertiary)]">{dayNames[i]}</div>
                  <div className={`text-[16px] font-bold mt-0.5 ${isToday ? "text-[var(--color-mint-dark)]" : ""}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
            {hours.map(h => (
              <div key={h} className="contents">
                <div className="h-16 border-b border-[#3C3C430A] flex items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] text-[var(--color-label-tertiary)]">{String(h).padStart(2, "0")}:00</span>
                </div>
                {weekDays.map((d, di) => {
                  const dateKey = formatDateKey(d);
                  const dayTurnos = (turnosByDate[dateKey] || []).filter(t => {
                    const tH = parseInt(t.hora_inicio.split(":")[0]);
                    return tH === h;
                  });
                  return (
                    <div key={di}
                      className="h-16 border-b border-l border-[#3C3C430A] relative group cursor-pointer hover:bg-[#34C75908]"
                      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("bg-[var(--color-mint-light)]"); }}
                      onDragLeave={e => e.currentTarget.classList.remove("bg-[var(--color-mint-light)]")}
                      onDrop={e => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-[var(--color-mint-light)]");
                        const turnoId = e.dataTransfer.getData("turnoId");
                        if (turnoId) handleDrop(turnoId, dateKey, `${String(h).padStart(2, "0")}:00`);
                      }}
                    >
                      {dayTurnos.map(t => (
                        <div key={t.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData("turnoId", t.id);
                            setDragTurno(t);
                          }}
                          onDragEnd={() => setDragTurno(null)}
                          className={`absolute inset-x-0.5 top-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] leading-tight cursor-grab active:cursor-grabbing z-10 ${estadoColors[t.estado] || "bg-gray-200"}`}
                          style={{ minHeight: "14px" }}
                        >
                          <div className="font-semibold truncate">{t.cliente?.nombre || "—"}</div>
                          <div className="opacity-75 truncate">{t.servicio?.nombre || ""}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {view === "mes" && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#3C3C4318]">
            {dayNames.map(d => (
              <div key={d} className="p-2 text-center text-[10px] font-semibold uppercase text-[var(--color-label-tertiary)]">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((d, i) => {
              const dateKey = formatDateKey(d);
              const isCurrentMonth = d.getMonth() === currentDate.getMonth();
              const isToday = dateKey === today;
              const dayTurnos = turnosByDate[dateKey] || [];
              const completados = dayTurnos.filter(t => t.estado === "completado").length;
              const pendientes = dayTurnos.filter(t => ["pendiente", "confirmado"].includes(t.estado)).length;

              return (
                <div key={i}
                  className={`min-h-[90px] p-1.5 border-b border-r border-[#3C3C430A] cursor-pointer hover:bg-[#F8F8F8] transition ${!isCurrentMonth ? "opacity-40" : ""}`}
                  onClick={() => setSelectedDay(selectedDay === dateKey ? null : dateKey)}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("bg-[var(--color-mint-light)]"); }}
                  onDragLeave={e => e.currentTarget.classList.remove("bg-[var(--color-mint-light)]")}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-[var(--color-mint-light)]");
                    const turnoId = e.dataTransfer.getData("turnoId");
                    if (turnoId) handleDrop(turnoId, dateKey);
                  }}
                >
                  <div className={`text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--color-mint)] text-white" : ""}`}>
                    {d.getDate()}
                  </div>
                  {dayTurnos.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayTurnos.slice(0, 3).map(t => (
                        <div key={t.id}
                          draggable
                          onDragStart={e => { e.dataTransfer.setData("turnoId", t.id); e.stopPropagation(); }}
                          className={`text-[9px] px-1 py-0.5 rounded truncate cursor-grab ${estadoColors[t.estado] || "bg-gray-200"}`}
                        >
                          {t.hora_inicio} {t.cliente?.nombre?.split(" ")[0] || ""}
                        </div>
                      ))}
                      {dayTurnos.length > 3 && (
                        <div className="text-[9px] text-[var(--color-label-tertiary)] pl-1">+{dayTurnos.length - 3} más</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day detail panel (monthly view) */}
      {view === "mes" && selectedDay && turnosByDate[selectedDay] && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
          <h3 className="text-[14px] font-semibold mb-3">
            {new Date(selectedDay + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <div className="space-y-2">
            {turnosByDate[selectedDay].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)]">
                <div className={`w-2 h-8 rounded-full ${estadoColors[t.estado]?.split(" ")[0] || "bg-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{t.hora_inicio} - {t.hora_fin}</div>
                  <div className="text-[12px] text-[var(--color-label-tertiary)]">{t.cliente?.nombre || "—"} · {t.servicio?.nombre || ""}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${estadoColors[t.estado] || ""}`}>{t.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {Object.entries({ confirmado: "Confirmado", en_progreso: "En progreso", pendiente: "Pendiente", completado: "Completado", cancelado: "Cancelado" }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${estadoColors[key]?.split(" ")[0] || "bg-gray-300"}`} />
            <span className="text-[var(--color-label-tertiary)]">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-3 h-3 text-[var(--color-label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
          <span className="text-[var(--color-label-tertiary)]">Arrastrá los turnos para moverlos</span>
        </div>
      </div>
    </div>
  );
}
