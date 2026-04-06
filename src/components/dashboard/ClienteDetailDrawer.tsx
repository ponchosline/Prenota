"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { editarCliente, eliminarCliente } from "@/app/dashboard/crud-actions";

interface ClienteDetailProps {
  isOpen: boolean;
  onClose: () => void;
  comercioId: string;
  cliente: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    notas?: string | null;
    puntos_fidelizacion: number;
  };
}

interface VisitRecord {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  precio_cobrado: number | null;
  servicio: { nombre: string } | null;
  personal: { nombre: string } | null;
}

interface NotaRecord {
  id: string;
  contenido: string;
  tipo: string;
  created_at: string;
}

interface RewardRecord {
  id: string;
  puntos: number;
  tipo: string;
  descripcion: string | null;
  created_at: string;
}

type Tab = "perfil" | "historial" | "notas" | "puntos";

const ESTADO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  completado: { label: "Completado", color: "text-[#34C759]", bg: "bg-[#34C75915]" },
  confirmado: { label: "Confirmado", color: "text-[#007AFF]", bg: "bg-[#007AFF15]" },
  pendiente: { label: "Pendiente", color: "text-[#FF9500]", bg: "bg-[#FF950015]" },
  cancelado: { label: "Cancelado", color: "text-[#FF3B30]", bg: "bg-[#FF3B3015]" },
  en_progreso: { label: "En progreso", color: "text-[#AF52DE]", bg: "bg-[#AF52DE15]" },
  no_show: { label: "No asistió", color: "text-[#8E8E93]", bg: "bg-[#8E8E9315]" },
};

function getTier(points: number) {
  if (points >= 200) return { label: "💎 Diamante", color: "text-[#5856D6]", bg: "bg-[#5856D620]" };
  if (points >= 100) return { label: "🥇 Oro", color: "text-[#FF9500]", bg: "bg-[#FF950020]" };
  if (points >= 50) return { label: "🥈 Plata", color: "text-[#8E8E93]", bg: "bg-[#8E8E9320]" };
  return { label: "🥉 Bronce", color: "text-[#AC8E68]", bg: "bg-[#AC8E6820]" };
}

export default function ClienteDetailDrawer({ isOpen, onClose, comercioId, cliente }: ClienteDetailProps) {
  const [tab, setTab] = useState<Tab>("perfil");
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [notas, setNotas] = useState<NotaRecord[]>([]);
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNota, setNewNota] = useState("");
  const [isPending, startTransition] = useTransition();

  // Edit fields
  const [editMode, setEditMode] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getSupabase = useCallback(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    const [visitsRes, notasRes, rewardsRes] = await Promise.all([
      supabase
        .from("turnos")
        .select("id, fecha, hora_inicio, hora_fin, estado, precio_cobrado, servicio:servicios(nombre), personal:personal(nombre)")
        .eq("comercio_id", comercioId)
        .eq("cliente_id", cliente.id)
        .neq("notas", "__sistema: cliente creado manualmente__")
        .order("fecha", { ascending: false })
        .limit(50),
      supabase
        .from("cliente_notas")
        .select("id, contenido, tipo, created_at")
        .eq("cliente_id", cliente.id)
        .eq("comercio_id", comercioId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("reward_transacciones")
        .select("id, puntos, tipo, descripcion, created_at")
        .eq("cliente_id", cliente.id)
        .eq("comercio_id", comercioId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setVisits((visitsRes.data as unknown as VisitRecord[]) || []);
    setNotas((notasRes.data as NotaRecord[]) || []);
    setRewards((rewardsRes.data as RewardRecord[]) || []);
    setLoading(false);
  }, [comercioId, cliente.id, getSupabase]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTab("perfil");
      setEditMode(false);
      setNombre(cliente.nombre);
      setEmail(cliente.email || "");
      setTelefono(cliente.telefono || "");
      setNewNota("");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, cliente.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddNota = async () => {
    if (!newNota.trim()) return;
    await getSupabase().from("cliente_notas").insert({
      cliente_id: cliente.id,
      comercio_id: comercioId,
      contenido: newNota.trim(),
      tipo: "nota",
    });
    setNewNota("");
    loadData();
  };

  const handleDeleteNota = async (notaId: string) => {
    await getSupabase().from("cliente_notas").delete().eq("id", notaId);
    loadData();
  };

  const handleSaveProfile = () => {
    const fd = new FormData();
    fd.set("id", cliente.id);
    fd.set("comercio_id", comercioId);
    fd.set("nombre", nombre);
    fd.set("email", email);
    fd.set("telefono", telefono);
    startTransition(async () => {
      await editarCliente(fd);
      setEditMode(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await eliminarCliente(cliente.id);
      onClose();
    });
  };

  if (!isOpen) return null;

  const tier = getTier(cliente.puntos_fidelizacion);
  const initials = cliente.nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const totalSpent = visits.filter(v => v.estado === "completado").reduce((s, v) => s + (v.precio_cobrado || 0), 0);

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "perfil", label: "Perfil", icon: "👤" },
    { key: "historial", label: "Visitas", icon: "📅", count: visits.length },
    { key: "notas", label: "Notas", icon: "📝", count: notas.length },
    { key: "puntos", label: "Puntos", icon: "⭐", count: rewards.length },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[6px] z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[var(--color-bg-primary)] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header — softer brand gradient */}
        <div className="bg-gradient-to-br from-[var(--color-mint)] via-[#52C4A8] to-[#3AA08A] p-5 pb-6 relative shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/20 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold shadow-lg border border-white/30">
              {initials}
            </div>
            <div className="text-white flex-1 min-w-0">
              <h2 className="text-[18px] font-bold truncate">{cliente.nombre}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm">
                  {tier.label}
                </span>
                <span className="text-[12px] text-white/75 font-medium">{cliente.puntos_fidelizacion} puntos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats — floating card */}
        <div className="mx-4 -mt-4 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border border-[#3C3C4312] p-3 grid grid-cols-3 gap-2 shrink-0">
          <div className="text-center">
            <div className="text-[20px] font-bold text-[var(--color-label-primary)]">{visits.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Visitas</div>
          </div>
          <div className="text-center border-x border-[#3C3C4315]">
            <div className="text-[20px] font-bold text-[var(--color-label-primary)]">$ {totalSpent.toLocaleString("es-AR")}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Gastado</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-[var(--color-label-primary)]">{notas.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Notas</div>
          </div>
        </div>

        {/* Tabs — pill style */}
        <div className="mx-4 mt-3 mb-1 bg-[#78788014] rounded-[10px] p-1 flex shrink-0">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-center text-[12px] font-semibold rounded-[8px] transition-all duration-200 ${
                tab === t.key
                  ? "bg-white text-[var(--color-label-primary)] shadow-sm"
                  : "text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)]"
              }`}
            >
              {t.icon} {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-[var(--color-mint-light)] text-[var(--color-mint-dark)]" : "bg-[#78788018]"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--color-mint)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* PROFILE TAB */}
              {tab === "perfil" && (
                <div className="space-y-3">
                  {editMode ? (
                    <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4 space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Nombre</label>
                        <input value={nombre} onChange={e => setNombre(e.target.value)}
                          className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Email</label>
                          <input value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition" />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Teléfono</label>
                          <input value={telefono} onChange={e => setTelefono(e.target.value)}
                            className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 rounded-[var(--radius-sm)] border border-[#3C3C4325] text-[13px] font-medium hover:bg-[#F8F8F8] transition">Cancelar</button>
                        <button onClick={handleSaveProfile} disabled={isPending}
                          className="flex-1 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-mint)] text-white text-[13px] font-semibold disabled:opacity-50 hover:bg-[var(--color-mint-dark)] transition">
                          {isPending ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Info card */}
                      <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] divide-y divide-[#3C3C4310]">
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[var(--color-label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-[12px] text-[var(--color-label-tertiary)]">Email</span>
                          </div>
                          <span className="text-[13px] font-medium">{cliente.email || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[var(--color-label-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span className="text-[12px] text-[var(--color-label-tertiary)]">Teléfono</span>
                          </div>
                          <span className="text-[13px] font-medium">{cliente.telefono || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[var(--color-mint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            <span className="text-[12px] text-[var(--color-label-tertiary)]">Puntos</span>
                          </div>
                          <span className="text-[14px] font-bold text-[var(--color-mint-dark)]">{cliente.puntos_fidelizacion}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[#AF52DE]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                            <span className="text-[12px] text-[var(--color-label-tertiary)]">Nivel</span>
                          </div>
                          <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <button onClick={() => setEditMode(true)}
                        className="w-full py-3 rounded-[var(--radius-sm)] bg-white border border-[#3C3C4315] shadow-[var(--shadow-card)] text-[13px] font-semibold text-[var(--color-label-primary)] hover:border-[var(--color-mint)] hover:text-[var(--color-mint-dark)] transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editar perfil
                      </button>

                      {/* Danger zone */}
                      <div className="pt-2">
                        {showDeleteConfirm ? (
                          <div className="bg-[#FF3B3008] border border-[#FF3B3025] rounded-[var(--radius-sm)] p-3">
                            <p className="text-[12px] text-[#FF3B30] font-medium mb-2">¿Seguro que querés eliminar este cliente?</p>
                            <div className="flex gap-2">
                              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-[13px] rounded-[var(--radius-sm)] bg-white border border-[#3C3C4325] font-medium hover:bg-[#F8F8F8] transition">Cancelar</button>
                              <button onClick={handleDelete} disabled={isPending}
                                className="flex-1 py-2 text-[13px] rounded-[var(--radius-sm)] bg-[#FF3B30] text-white font-semibold hover:bg-[#E0342B] transition">Eliminar</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowDeleteConfirm(true)} className="text-[12px] text-[var(--color-label-tertiary)] hover:text-[#FF3B30] transition flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Eliminar cliente
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {tab === "historial" && (
                <div className="space-y-2">
                  {visits.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-label-tertiary)]">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-[14px]">Sin visitas registradas</p>
                    </div>
                  ) : visits.map(v => {
                    const badge = ESTADO_BADGE[v.estado] || ESTADO_BADGE.pendiente;
                    return (
                      <div key={v.id} className="bg-white border border-[#3C3C4315] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold">
                              {new Date(v.fecha + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          {v.precio_cobrado != null && v.precio_cobrado > 0 && (
                            <span className="text-[13px] font-bold text-[var(--color-mint-dark)]">
                              $ {v.precio_cobrado.toLocaleString("es-AR")}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[var(--color-label-tertiary)] mt-1">
                          {(v.servicio as Record<string, string>)?.nombre || "Servicio"} · {v.hora_inicio.slice(0, 5)} - {v.hora_fin.slice(0, 5)}
                        </div>
                        <div className="text-[11px] text-[var(--color-label-tertiary)] mt-0.5">
                          con {(v.personal as Record<string, string>)?.nombre || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NOTES TAB */}
              {tab === "notas" && (
                <div className="space-y-4">
                  {/* Add note */}
                  <div className="bg-[#F8F8F8] rounded-[var(--radius-md)] p-3">
                    <textarea
                      value={newNota}
                      onChange={e => setNewNota(e.target.value)}
                      placeholder="Escribí una nota sobre este cliente..."
                      rows={3}
                      className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] resize-none"
                    />
                    <button
                      onClick={handleAddNota}
                      disabled={!newNota.trim()}
                      className="mt-2 w-full py-2 rounded-full bg-[var(--color-mint)] text-white text-[13px] font-semibold disabled:opacity-40 hover:bg-[var(--color-mint-dark)] transition"
                    >
                      📝 Guardar nota
                    </button>
                  </div>

                  {/* Notes timeline */}
                  <div className="relative">
                    {notas.length === 0 ? (
                      <div className="text-center py-8 text-[var(--color-label-tertiary)]">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-[14px]">Sin notas todavía</p>
                        <p className="text-[12px] mt-1">Agregá notas para el seguimiento de este cliente.</p>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {notas.map((nota, idx) => (
                          <div key={nota.id} className="flex gap-3 group">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                                nota.tipo === "auto" ? "bg-[#FF9500] border-[#FF9500]" : "bg-[var(--color-mint)] border-[var(--color-mint)]"
                              }`} />
                              {idx < notas.length - 1 && <div className="w-0.5 flex-1 bg-[#3C3C4318] min-h-[20px]" />}
                            </div>
                            {/* Content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div className="text-[11px] text-[var(--color-label-tertiary)]">
                                  {new Date(nota.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  {nota.tipo === "auto" && <span className="ml-1 text-[#FF9500]">· automática</span>}
                                </div>
                                {nota.tipo === "nota" && (
                                  <button onClick={() => handleDeleteNota(nota.id)}
                                    className="text-[11px] text-[#FF3B30] opacity-0 group-hover:opacity-100 transition">
                                    Eliminar
                                  </button>
                                )}
                              </div>
                              <p className="text-[13px] mt-1 leading-relaxed">{nota.contenido}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* POINTS TAB */}
              {tab === "puntos" && (
                <div className="space-y-2">
                  {/* Points summary */}
                  <div className="bg-gradient-to-r from-[#AF52DE10] to-[#5856D610] rounded-[var(--radius-md)] p-4 text-center mb-4">
                    <div className="text-[28px] font-bold text-[#AF52DE]">{cliente.puntos_fidelizacion}</div>
                    <div className="text-[12px] text-[var(--color-label-tertiary)]">puntos acumulados</div>
                    <div className={`mt-2 inline-flex text-[12px] font-medium px-3 py-1 rounded-full ${tier.bg} ${tier.color}`}>
                      {tier.label}
                    </div>
                  </div>

                  {rewards.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-label-tertiary)]">
                      <div className="text-4xl mb-2">⭐</div>
                      <p className="text-[14px]">Sin transacciones de puntos</p>
                    </div>
                  ) : rewards.map(r => (
                    <div key={r.id} className="bg-white border border-[#3C3C4315] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-card)] flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 ${
                        r.tipo === "ganar" ? "bg-[#34C75915] text-[#34C759]" : "bg-[#FF3B3015] text-[#FF3B30]"
                      }`}>
                        {r.tipo === "ganar" ? `+${r.puntos}` : `-${r.puntos}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium">{r.descripcion || (r.tipo === "ganar" ? "Puntos ganados" : "Puntos canjeados")}</div>
                        <div className="text-[11px] text-[var(--color-label-tertiary)]">
                          {new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
