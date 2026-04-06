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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    setLoading(true);

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
  }, [comercioId, cliente.id, supabase]);

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
  }, [isOpen, cliente]);

  const handleAddNota = async () => {
    if (!newNota.trim()) return;
    await supabase.from("cliente_notas").insert({
      cliente_id: cliente.id,
      comercio_id: comercioId,
      contenido: newNota.trim(),
      tipo: "nota",
    });
    setNewNota("");
    loadData();
  };

  const handleDeleteNota = async (notaId: string) => {
    await supabase.from("cliente_notas").delete().eq("id", notaId);
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#FF9500] to-[#FF2D55] p-5 pb-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg border-2 border-white/30">
              {initials}
            </div>
            <div className="text-white">
              <h2 className="text-[20px] font-bold">{cliente.nombre}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm`}>
                  {tier.label}
                </span>
                <span className="text-[12px] opacity-80">{cliente.puntos_fidelizacion} pts</span>
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-3 mt-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-[10px] px-3 py-2 flex-1 text-center">
              <div className="text-[18px] font-bold text-white">{visits.length}</div>
              <div className="text-[10px] text-white/70 uppercase">Visitas</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-[10px] px-3 py-2 flex-1 text-center">
              <div className="text-[18px] font-bold text-white">$ {totalSpent.toLocaleString("es-AR")}</div>
              <div className="text-[10px] text-white/70 uppercase">Gastado</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-[10px] px-3 py-2 flex-1 text-center">
              <div className="text-[18px] font-bold text-white">{notas.length}</div>
              <div className="text-[10px] text-white/70 uppercase">Notas</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#3C3C4318] bg-white -mt-3 mx-4 rounded-t-[12px] shadow-sm">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-center text-[12px] font-semibold transition-all relative ${
                tab === t.key ? "text-[var(--color-mint-dark)]" : "text-[var(--color-label-tertiary)]"
              }`}
            >
              <span>{t.icon} {t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 text-[10px] bg-[#78788018] px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
              {tab === t.key && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--color-mint)] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--color-mint)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* PROFILE TAB */}
              {tab === "perfil" && (
                <div className="space-y-4">
                  {editMode ? (
                    <>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Nombre</label>
                        <input value={nombre} onChange={e => setNombre(e.target.value)}
                          className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Email</label>
                          <input value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Teléfono</label>
                          <input value={telefono} onChange={e => setTelefono(e.target.value)}
                            className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditMode(false)} className="flex-1 py-2 rounded-full border border-[#3C3C4330] text-[13px]">Cancelar</button>
                        <button onClick={handleSaveProfile} disabled={isPending}
                          className="flex-1 py-2 rounded-full bg-[var(--color-mint)] text-white text-[13px] font-semibold disabled:opacity-50">
                          {isPending ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#F8F8F8] rounded-[var(--radius-md)] p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[12px] text-[var(--color-label-tertiary)]">Email</span>
                          <span className="text-[13px] font-medium">{cliente.email || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-[var(--color-label-tertiary)]">Teléfono</span>
                          <span className="text-[13px] font-medium">{cliente.telefono || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-[var(--color-label-tertiary)]">Puntos</span>
                          <span className="text-[13px] font-bold text-[var(--color-mint-dark)]">{cliente.puntos_fidelizacion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[12px] text-[var(--color-label-tertiary)]">Nivel</span>
                          <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                        </div>
                      </div>
                      <button onClick={() => setEditMode(true)}
                        className="w-full py-2.5 rounded-full border border-[var(--color-mint)] text-[var(--color-mint-dark)] text-[13px] font-semibold hover:bg-[var(--color-mint-light)] transition">
                        ✏️ Editar perfil
                      </button>
                      <div className="pt-4 border-t border-[#3C3C4318]">
                        {showDeleteConfirm ? (
                          <div className="flex gap-2">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-[13px] rounded-full border border-[#3C3C4330]">No, cancelar</button>
                            <button onClick={handleDelete} disabled={isPending}
                              className="flex-1 py-2 text-[13px] rounded-full bg-[#FF3B30] text-white font-semibold">Sí, eliminar</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowDeleteConfirm(true)} className="text-[13px] text-[#FF3B30] hover:underline">
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
