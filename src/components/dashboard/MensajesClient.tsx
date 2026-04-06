"use client";

import { useState, useMemo } from "react";

interface TurnoData {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  cliente: { nombre: string; telefono: string | null } | null;
  servicio: { nombre: string } | null;
  personal: { nombre: string } | null;
}

interface Props {
  comercioNombre: string;
  comercioDireccion: string | null;
  turnosManana: TurnoData[];
  turnosHoy: TurnoData[];
}

type Template = "recordatorio" | "confirmacion" | "agradecimiento";

const templates: Record<Template, { label: string; icon: string; build: (t: TurnoData, comercio: string, dir: string | null) => string }> = {
  recordatorio: {
    label: "Recordatorio",
    icon: "🔔",
    build: (t, comercio, dir) =>
      `Hola ${t.cliente?.nombre?.split(" ")[0] || ""}! 👋\nTe recordamos tu turno en *${comercio}*:\n📅 ${t.fecha} a las ${t.hora_inicio}\n✂️ ${t.servicio?.nombre || ""} con ${t.personal?.nombre || ""}\n${dir ? `📍 ${dir}\n` : ""}¡Te esperamos! 😊`,
  },
  confirmacion: {
    label: "Confirmación",
    icon: "✅",
    build: (t, comercio) =>
      `Hola ${t.cliente?.nombre?.split(" ")[0] || ""}! ✅\nTu turno en *${comercio}* está confirmado:\n📅 ${t.fecha} a las ${t.hora_inicio}\n✂️ ${t.servicio?.nombre || ""}\n¡Nos vemos! 🙌`,
  },
  agradecimiento: {
    label: "Agradecimiento",
    icon: "❤️",
    build: (t, comercio) =>
      `Hola ${t.cliente?.nombre?.split(" ")[0] || ""}! ❤️\nGracias por visitarnos en *${comercio}*.\n¡Esperamos verte pronto! Recordá que acumulás puntos de fidelización 🌟`,
  },
};

function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

export default function MensajesClient({ comercioNombre, comercioDireccion, turnosManana, turnosHoy }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>("recordatorio");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"manana" | "hoy">("manana");

  const activeTurnos = tab === "manana" ? turnosManana : turnosHoy;
  const turnosConTel = useMemo(() => activeTurnos.filter(t => cleanPhone(t.cliente?.telefono ?? null)), [activeTurnos]);

  const handleSend = (turno: TurnoData) => {
    const phone = cleanPhone(turno.cliente?.telefono ?? null);
    if (!phone) return;
    const msg = templates[selectedTemplate].build(turno, comercioNombre, comercioDireccion);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setSentIds(prev => new Set([...prev, turno.id]));
  };

  const handleSendAll = () => {
    turnosConTel.forEach((t, i) => {
      setTimeout(() => handleSend(t), i * 1500);
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">💬 Mensajes</h1>
          <p className="text-[13px] text-[var(--color-label-tertiary)]">Recordatorios de turnos vía WhatsApp</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-3">Plantilla de mensaje</h3>
        <div className="flex gap-2">
          {(Object.entries(templates) as [Template, typeof templates[Template]][]).map(([key, tmpl]) => (
            <button key={key} onClick={() => setSelectedTemplate(key)}
              className={`flex-1 py-2.5 px-3 rounded-[var(--radius-sm)] text-[12px] font-semibold border transition-all ${
                selectedTemplate === key
                  ? "bg-[#25D36610] border-[#25D366] text-[#128C7E]"
                  : "bg-white border-[#3C3C4318] text-[var(--color-label-secondary)] hover:border-[#25D36660]"
              }`}>
              {tmpl.icon} {tmpl.label}
            </button>
          ))}
        </div>
        {/* Preview */}
        <div className="mt-3 bg-[#DCF8C6] rounded-[12px] rounded-tl-none p-3 text-[12px] leading-relaxed whitespace-pre-line max-w-sm">
          {turnosConTel.length > 0
            ? templates[selectedTemplate].build(turnosConTel[0], comercioNombre, comercioDireccion)
            : "No hay turnos con teléfono para previsualizar"}
        </div>
      </div>

      {/* Tab + actions */}
      <div className="flex items-center justify-between">
        <div className="bg-[#78788014] rounded-[10px] p-1 flex">
          <button onClick={() => setTab("manana")}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${tab === "manana" ? "bg-white shadow-sm" : "text-[var(--color-label-tertiary)]"}`}>
            📅 Mañana ({turnosManana.length})
          </button>
          <button onClick={() => setTab("hoy")}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-[8px] transition-all ${tab === "hoy" ? "bg-white shadow-sm" : "text-[var(--color-label-tertiary)]"}`}>
            📅 Hoy ({turnosHoy.length})
          </button>
        </div>
        {turnosConTel.length > 0 && (
          <button onClick={handleSendAll}
            className="bg-[#25D366] text-white text-[12px] font-semibold px-4 py-2 rounded-[var(--radius-sm)] hover:bg-[#128C7E] transition flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.29-1.24l-.31-.18-2.87.85.85-2.87-.2-.31A8 8 0 1112 20z"/></svg>
            Enviar todos ({turnosConTel.length})
          </button>
        )}
      </div>

      {/* Turno list */}
      <div className="space-y-2">
        {activeTurnos.length === 0 && (
          <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-8 text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-[13px] text-[var(--color-label-tertiary)]">No hay turnos {tab === "manana" ? "para mañana" : "para hoy"}</p>
          </div>
        )}
        {activeTurnos.map(t => {
          const phone = cleanPhone(t.cliente?.telefono ?? null);
          const sent = sentIds.has(t.id);
          return (
            <div key={t.id} className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-card)] border border-[#3C3C4312] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[#5AC8FA] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {t.cliente?.nombre?.split(" ").map(n => n[0]).join("").substring(0, 2) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{t.cliente?.nombre || "Sin cliente"}</div>
                <div className="text-[11px] text-[var(--color-label-tertiary)]">
                  {t.hora_inicio} — {t.servicio?.nombre || ""} con {t.personal?.nombre || ""}
                </div>
                {!phone && <div className="text-[10px] text-[#FF9500] mt-0.5">⚠️ Sin teléfono</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {sent && <span className="text-[10px] text-[#25D366] font-semibold">✓ Enviado</span>}
                <button onClick={() => handleSend(t)} disabled={!phone}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                    phone ? "bg-[#25D366] text-white hover:bg-[#128C7E]" : "bg-[#78788018] text-[#8E8E93] cursor-not-allowed"
                  }`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.29-1.24l-.31-.18-2.87.85.85-2.87-.2-.31A8 8 0 1112 20z"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
