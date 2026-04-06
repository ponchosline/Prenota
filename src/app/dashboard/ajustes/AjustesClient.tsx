"use client";

import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { crearPremio, eliminarPremio, crearPromocion, eliminarPromocion } from "./actions";

interface AjustesClientProps {
  comercio: { id: string; nombre: string; slug: string; plan: string };
  premios: Array<{ id: string; nombre: string; descripcion: string | null; tipo: string; valor: number; probabilidad: number }>;
  promociones: Array<{ id: string; nombre: string; descripcion: string | null; cantidad_requerida: number; premio_descripcion: string; servicio: { nombre: string } | null }>;
  servicios: Array<{ id: string; nombre: string }>;
}

const PRIZE_TYPES = [
  { value: "descuento_porcentaje", label: "Descuento %", icon: "🏷️" },
  { value: "descuento_fijo", label: "Descuento fijo $", icon: "💵" },
  { value: "servicio_gratis", label: "Servicio gratis", icon: "🎁" },
  { value: "puntos_extra", label: "Puntos extra", icon: "⭐" },
  { value: "producto", label: "Producto/regalo", icon: "🧴" },
];

export default function AjustesClient({ comercio, premios, promociones, servicios }: AjustesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const checkInUrl = typeof window !== "undefined"
    ? `${window.location.origin}/check/${comercio.slug}`
    : `/check/${comercio.slug}`;

  const handleCreatePrize = async (formData: FormData) => {
    startTransition(async () => {
      await crearPremio(formData);
      setShowPrizeForm(false);
    });
  };

  const handleDeletePrize = (id: string) => {
    startTransition(async () => {
      await eliminarPremio(id);
    });
  };

  const handleCreatePromo = async (formData: FormData) => {
    startTransition(async () => {
      await crearPromocion(formData);
      setShowPromoForm(false);
    });
  };

  const handleDeletePromo = (id: string) => {
    startTransition(async () => {
      await eliminarPromocion(id);
    });
  };

  return (
    <div className="space-y-6">
      {/* QR Code Section */}
      <CollapsibleSection title="Código QR del Comercio" subtitle="Para check-in y rewards de clientes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* QR Display */}
          <div className="bg-white rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)] border border-[#3C3C4315] text-center">
            <div className="bg-white p-4 rounded-[16px] inline-block shadow-sm border border-[#3C3C4318]">
              <QRCodeSVG
                value={checkInUrl}
                size={200}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1C1C1E"
                includeMargin={false}
              />
            </div>
            <p className="text-[13px] font-semibold mt-4">{comercio.nombre}</p>
            <p className="text-[11px] text-[var(--color-label-tertiary)] mt-1 break-all">{checkInUrl}</p>
            <button
              onClick={() => navigator.clipboard.writeText(checkInUrl)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-mint)] text-white text-[12px] font-semibold hover:bg-[var(--color-mint-dark)] transition"
            >
              📋 Copiar enlace
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-card)] border border-[#3C3C4315]">
            <h3 className="text-[16px] font-bold mb-3">¿Cómo funciona?</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#34C75915] flex items-center justify-center shrink-0 text-[14px]">1</div>
                <div>
                  <div className="text-[13px] font-semibold">Check-in al llegar</div>
                  <div className="text-[11px] text-[var(--color-label-tertiary)]">
                    El cliente escanea el QR → ingresa su teléfono → confirma su turno → estado pasa a &quot;En progreso&quot;
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#007AFF15] flex items-center justify-center shrink-0 text-[14px]">2</div>
                <div>
                  <div className="text-[13px] font-semibold">Check-out al terminar</div>
                  <div className="text-[11px] text-[var(--color-label-tertiary)]">
                    Vuelve a escanear → recibe sus puntos de fidelización → accede a la ruleta de premios
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#AF52DE15] flex items-center justify-center shrink-0 text-[14px]">3</div>
                <div>
                  <div className="text-[13px] font-semibold">Ruleta + Premios</div>
                  <div className="text-[11px] text-[var(--color-label-tertiary)]">
                    El cliente gira la ruleta y puede ganar descuentos, servicios gratis, puntos extra, etc.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Prizes Config */}
      <CollapsibleSection
        title="Premios de la Ruleta"
        subtitle={`${premios.length} premios configurados`}
        headerRight={
          <button
            onClick={() => setShowPrizeForm(!showPrizeForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-mint)] text-white text-[13px] font-semibold hover:bg-[var(--color-mint-dark)] transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>
        }
      >
        {/* Create prize form */}
        {showPrizeForm && (
          <form action={handleCreatePrize} className="bg-gradient-to-r from-[#FF950008] to-[#FF2D5508] border border-[#FF950030] rounded-[var(--radius-lg)] p-4 mb-3">
            <input type="hidden" name="comercio_id" value={comercio.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                name="nombre"
                required
                placeholder="Nombre del premio (ej: 10% OFF)"
                className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white"
              />
              <input
                name="descripcion"
                placeholder="Descripción (opcional)"
                className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white"
              />
              <select name="tipo" required className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white">
                {PRIZE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
              <input name="valor" type="number" required placeholder="Valor (%, $, puntos...)" className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
              <input name="probabilidad" type="number" min={1} max={100} required placeholder="Probabilidad (1-100)" defaultValue={20} className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowPrizeForm(false)} className="px-4 py-2 rounded-full text-[13px] text-[var(--color-label-secondary)]">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="px-5 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-mint)] text-white disabled:opacity-50">
                {isPending ? "Guardando..." : "Crear premio"}
              </button>
            </div>
          </form>
        )}

        {/* Prize list */}
        <div className="space-y-2">
          {premios.map((p) => {
            const typeInfo = PRIZE_TYPES.find((t) => t.value === p.tipo);
            return (
              <div key={p.id} className="bg-white rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-card)] border border-[#3C3C4315] flex items-center gap-3">
                <div className="text-2xl">{typeInfo?.icon || "🎁"}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{p.nombre}</div>
                  <div className="text-[11px] text-[var(--color-label-tertiary)]">
                    {typeInfo?.label} · Valor: {p.valor} · Probabilidad: {p.probabilidad}%
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePrize(p.id)}
                  disabled={isPending}
                  className="text-[#FF3B30] text-[12px] font-medium hover:underline shrink-0 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            );
          })}
          {premios.length === 0 && (
            <div className="text-center py-8 text-[var(--color-label-tertiary)] text-[13px]">
              No hay premios configurados. ¡Agregá algunos para que tus clientes giren la ruleta! 🎰
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Promotions Config */}
      <CollapsibleSection
        title="Promociones Progresivas"
        subtitle="Ej: 3 cortes = 4to gratis"
        headerRight={
          <button
            onClick={() => setShowPromoForm(!showPromoForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF9500] text-white text-[13px] font-semibold hover:bg-[#E68A00] transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Agregar</span>
          </button>
        }
      >
        {showPromoForm && (
          <form action={handleCreatePromo} className="bg-gradient-to-r from-[#AF52DE08] to-[#5856D608] border border-[#AF52DE30] rounded-[var(--radius-lg)] p-4 mb-3">
            <input type="hidden" name="comercio_id" value={comercio.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input name="nombre" required placeholder="Nombre (ej: Promo Corte)" className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
              <input name="descripcion" placeholder="Descripción (opcional)" className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
              <select name="servicio_id" className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white">
                <option value="">Cualquier servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              <input name="cantidad_requerida" type="number" min={2} max={20} required placeholder="Cantidad (ej: 3)" defaultValue={3} className="border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
              <input name="premio_descripcion" required placeholder="Premio (ej: 4to corte gratis)" className="col-span-1 sm:col-span-2 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] bg-white" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowPromoForm(false)} className="px-4 py-2 rounded-full text-[13px] text-[var(--color-label-secondary)]">Cancelar</button>
              <button type="submit" disabled={isPending} className="px-5 py-2 rounded-full text-[13px] font-semibold bg-[#AF52DE] text-white disabled:opacity-50">
                {isPending ? "Guardando..." : "Crear promoción"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {promociones.map((p) => (
            <div key={p.id} className="bg-white rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-card)] border border-[#3C3C4315] flex items-center gap-3">
              <div className="text-2xl">🏆</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">{p.nombre}</div>
                <div className="text-[11px] text-[var(--color-label-tertiary)]">
                  {p.servicio?.nombre || "Cualquier servicio"} × {p.cantidad_requerida} → {p.premio_descripcion}
                </div>
              </div>
              <button
                onClick={() => handleDeletePromo(p.id)}
                disabled={isPending}
                className="text-[#FF3B30] text-[12px] font-medium hover:underline shrink-0 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          ))}
          {promociones.length === 0 && (
            <div className="text-center py-8 text-[var(--color-label-tertiary)] text-[13px]">
              No hay promociones activas. Creá una para fidelizar a tus clientes. 🏆
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
