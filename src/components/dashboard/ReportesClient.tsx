"use client";

import { useState, useMemo } from "react";

interface TurnoData {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  precio_cobrado: number | null;
  cliente: { nombre: string; telefono: string | null } | null;
  servicio: { nombre: string; precio: number } | null;
  personal: { nombre: string } | null;
}

interface Props {
  comercioId: string;
  comercioNombre: string;
  comercioDireccion: string | null;
  turnos: TurnoData[];
}

type Period = "7d" | "30d" | "90d";

export default function ReportesClient({ comercioNombre, turnos }: Props) {
  const [period, setPeriod] = useState<Period>("30d");

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  const filtered = useMemo(() => turnos.filter(t => t.fecha >= cutoff), [turnos, cutoff]);

  // KPIs
  const completados = filtered.filter(t => t.estado === "completado");
  const cancelados = filtered.filter(t => t.estado === "cancelado");
  const ingresos = completados.reduce((s, t) => s + (t.precio_cobrado || 0), 0);
  const ticketPromedio = completados.length > 0 ? Math.round(ingresos / completados.length) : 0;
  const tasaCancelacion = filtered.length > 0 ? Math.round((cancelados.length / filtered.length) * 100) : 0;

  // Revenue by day (last N days)
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    const chartDays = Math.min(days, 14);
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      map[d] = 0;
    }
    completados.forEach(t => {
      if (map[t.fecha] !== undefined) map[t.fecha] += (t.precio_cobrado || 0);
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [completados, days]);

  const maxRevenue = Math.max(...revenueByDay.map(d => d.amount), 1);

  // Top 5 services
  const topServices = useMemo(() => {
    const map: Record<string, { nombre: string; count: number; revenue: number }> = {};
    completados.forEach(t => {
      const name = t.servicio?.nombre || "Sin servicio";
      if (!map[name]) map[name] = { nombre: name, count: 0, revenue: 0 };
      map[name].count++;
      map[name].revenue += t.precio_cobrado || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [completados]);

  const maxServiceCount = Math.max(...topServices.map(s => s.count), 1);

  // Top 5 clients
  const topClients = useMemo(() => {
    const map: Record<string, { nombre: string; count: number; revenue: number }> = {};
    completados.forEach(t => {
      const name = t.cliente?.nombre || "Sin cliente";
      if (!map[name]) map[name] = { nombre: name, count: 0, revenue: 0 };
      map[name].count++;
      map[name].revenue += t.precio_cobrado || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completados]);

  // Retention: recurrentes vs nuevos
  const retention = useMemo(() => {
    const clientVisits: Record<string, number> = {};
    completados.forEach(t => {
      const name = t.cliente?.nombre || "anon";
      clientVisits[name] = (clientVisits[name] || 0) + 1;
    });
    const total = Object.keys(clientVisits).length;
    const recurrentes = Object.values(clientVisits).filter(v => v > 1).length;
    const nuevos = total - recurrentes;
    return { recurrentes, nuevos, total };
  }, [completados]);

  const retPct = retention.total > 0 ? Math.round((retention.recurrentes / retention.total) * 100) : 0;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Reportes</h1>
          <p className="text-[13px] text-[var(--color-label-tertiary)]">{comercioNombre} — Últimos {days} días</p>
        </div>
        <div className="bg-[#78788014] rounded-[10px] p-1 flex shrink-0 w-fit">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${period === p ? "bg-white text-[var(--color-label-primary)] shadow-sm" : "text-[var(--color-label-tertiary)]"}`}>
              {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-mint-dark)]">Ingresos</div>
          <div className="text-[24px] font-bold mt-1">{formatCurrency(ingresos)}</div>
          <div className="text-[11px] text-[var(--color-label-tertiary)]">{completados.length} turnos completados</div>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#007AFF]">Turnos</div>
          <div className="text-[24px] font-bold mt-1">{filtered.length}</div>
          <div className="text-[11px] text-[var(--color-label-tertiary)]">{Math.round(filtered.length / Math.max(days, 1) * 10) / 10}/día avg</div>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#FF9500]">Ticket Promedio</div>
          <div className="text-[24px] font-bold mt-1">{formatCurrency(ticketPromedio)}</div>
          <div className="text-[11px] text-[var(--color-label-tertiary)]">por servicio completado</div>
        </div>
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#FF3B30]">Cancelación</div>
          <div className="text-[24px] font-bold mt-1">{tasaCancelacion}%</div>
          <div className="text-[11px] text-[var(--color-label-tertiary)]">{cancelados.length} cancelados</div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-5">
        <h3 className="text-[14px] font-semibold mb-4">Facturación diaria</h3>
        <div className="flex items-end gap-1.5 h-[160px]">
          {revenueByDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <div className="relative w-full">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--color-label-primary)] text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10 transition-opacity">
                  {formatCurrency(d.amount)}
                </div>
              </div>
              <div
                className="w-full bg-gradient-to-t from-[var(--color-mint)] to-[#5AC8FA] rounded-t-[4px] transition-all duration-300 hover:opacity-80 min-h-[2px]"
                style={{ height: `${Math.max((d.amount / maxRevenue) * 140, 2)}px` }}
              />
              <span className="text-[9px] text-[var(--color-label-tertiary)] -rotate-45 origin-top-left whitespace-nowrap">{formatDate(d.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top Services */}
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-5">
          <h3 className="text-[14px] font-semibold mb-3">Top Servicios</h3>
          <div className="space-y-3">
            {topServices.length === 0 && <p className="text-[12px] text-[var(--color-label-tertiary)]">Sin datos</p>}
            {topServices.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium truncate mr-2">{s.nombre}</span>
                  <span className="text-[var(--color-label-tertiary)] shrink-0">{s.count} turnos</span>
                </div>
                <div className="h-2 bg-[#78788014] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#AF52DE] to-[#5856D6] rounded-full transition-all duration-500"
                    style={{ width: `${(s.count / maxServiceCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-5">
          <h3 className="text-[14px] font-semibold mb-3">Top Clientes</h3>
          <div className="space-y-2.5">
            {topClients.length === 0 && <p className="text-[12px] text-[var(--color-label-tertiary)]">Sin datos</p>}
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[#5AC8FA] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {c.nombre.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{c.nombre}</div>
                  <div className="text-[10px] text-[var(--color-label-tertiary)]">{c.count} visitas</div>
                </div>
                <span className="text-[12px] font-semibold text-[var(--color-mint-dark)]">{formatCurrency(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retention donut */}
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-5">
          <h3 className="text-[14px] font-semibold mb-3">Retención de Clientes</h3>
          <div className="flex items-center gap-5">
            {/* CSS Donut */}
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#78788014" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-mint)" strokeWidth="4"
                  strokeDasharray={`${retPct * 0.88} ${88 - retPct * 0.88}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[16px] font-bold">{retPct}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-mint)]" />
                <span className="text-[12px]">Recurrentes: <b>{retention.recurrentes}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#78788030]" />
                <span className="text-[12px]">Nuevos: <b>{retention.nuevos}</b></span>
              </div>
              <div className="text-[11px] text-[var(--color-label-tertiary)] mt-1">
                {retention.total} clientes únicos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
