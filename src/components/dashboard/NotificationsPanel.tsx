"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface NotificationItem {
  id: string;
  type: "turno_proximo" | "turno_completado" | "nuevo_cliente" | "puntos";
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
}

interface NotificationsPanelProps {
  comercioId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ comercioId, isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const today = new Date().toISOString().split("T")[0];
    const items: NotificationItem[] = [];

    // 1. Today's upcoming turnos
    const { data: turnosHoy } = await supabase
      .from("turnos")
      .select(`
        id, hora_inicio, hora_fin, estado,
        cliente:clientes(nombre),
        servicio:servicios(nombre),
        personal:personal(nombre)
      `)
      .eq("comercio_id", comercioId)
      .eq("fecha", today)
      .in("estado", ["confirmado", "pendiente"])
      .order("hora_inicio");

    if (turnosHoy) {
      for (const t of turnosHoy) {
        const clienteNombre = (t.cliente as Record<string, string>)?.nombre || "Sin cliente";
        const servicioNombre = (t.servicio as Record<string, string>)?.nombre || "";
        const personalNombre = (t.personal as Record<string, string>)?.nombre || "";

        items.push({
          id: `turno-${t.id}`,
          type: "turno_proximo",
          title: `${clienteNombre} — ${t.hora_inicio.slice(0, 5)}`,
          subtitle: `${servicioNombre} con ${personalNombre}`,
          time: t.hora_inicio.slice(0, 5),
          icon: "📅",
          color: "#007AFF",
        });
      }
    }

    // 2. Completed today
    const { data: completados } = await supabase
      .from("turnos")
      .select(`
        id, hora_inicio, estado, updated_at,
        cliente:clientes(nombre),
        servicio:servicios(nombre)
      `)
      .eq("comercio_id", comercioId)
      .eq("fecha", today)
      .eq("estado", "completado")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (completados) {
      for (const t of completados) {
        const clienteNombre = (t.cliente as Record<string, string>)?.nombre || "Cliente";
        const servicioNombre = (t.servicio as Record<string, string>)?.nombre || "";
        items.push({
          id: `done-${t.id}`,
          type: "turno_completado",
          title: `✅ ${clienteNombre} completó su turno`,
          subtitle: servicioNombre,
          time: t.hora_inicio.slice(0, 5),
          icon: "✅",
          color: "#34C759",
        });
      }
    }

    // 3. Recent reward transactions
    const { data: rewards } = await supabase
      .from("reward_transacciones")
      .select(`
        id, puntos, tipo, descripcion, created_at,
        cliente:clientes(nombre)
      `)
      .eq("comercio_id", comercioId)
      .eq("tipo", "ganar")
      .order("created_at", { ascending: false })
      .limit(3);

    if (rewards) {
      for (const r of rewards) {
        const clienteNombre = (r.cliente as Record<string, string>)?.nombre || "Cliente";
        items.push({
          id: `reward-${r.id}`,
          type: "puntos",
          title: `⭐ ${clienteNombre} ganó ${r.puntos} puntos`,
          subtitle: r.descripcion || "Fidelización",
          time: new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
          icon: "⭐",
          color: "#FF9500",
        });
      }
    }

    setNotifications(items);
    setLoading(false);
  }, [comercioId]);

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;

  const upcoming = notifications.filter(n => n.type === "turno_proximo");
  const activity = notifications.filter(n => n.type !== "turno_proximo");

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-12 z-40 w-[340px] sm:w-[380px] bg-white rounded-[16px] shadow-2xl border border-[#3C3C4320] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3C3C4318] flex items-center justify-between">
          <h3 className="text-[15px] font-bold tracking-tight">Notificaciones</h3>
          <span className="text-[11px] font-medium text-[var(--color-mint-dark)] bg-[var(--color-mint-light)] px-2 py-0.5 rounded-full">
            {upcoming.length} próximos
          </span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[var(--color-mint)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[12px] text-[var(--color-label-tertiary)] mt-2">Cargando...</p>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] bg-[#F8F8F8]">
                    📅 Turnos pendientes hoy
                  </div>
                  {upcoming.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-[#3C3C430A] hover:bg-[#F8F8F8] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                          style={{ backgroundColor: `${n.color}15` }}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium leading-tight">{n.title}</div>
                          <div className="text-[11px] text-[var(--color-label-tertiary)] mt-0.5 truncate">{n.subtitle}</div>
                        </div>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-[#007AFF15] text-[#007AFF] shrink-0">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity */}
              {activity.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] bg-[#F8F8F8]">
                    🔔 Actividad reciente
                  </div>
                  {activity.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-[#3C3C430A] hover:bg-[#F8F8F8] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                          style={{ backgroundColor: `${n.color}15` }}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium leading-tight">{n.title}</div>
                          <div className="text-[11px] text-[var(--color-label-tertiary)] mt-0.5 truncate">{n.subtitle}</div>
                        </div>
                        <span className="text-[10px] text-[var(--color-label-tertiary)] shrink-0">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notifications.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔕</div>
                  <p className="text-[14px] font-medium">Todo en orden</p>
                  <p className="text-[12px] text-[var(--color-label-tertiary)] mt-1">No hay notificaciones por ahora</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#3C3C4318] bg-[#F8F8F8]">
          <p className="text-[11px] text-center text-[var(--color-label-tertiary)]">
            Actualizado hace un momento
          </p>
        </div>
      </div>
    </>
  );
}
