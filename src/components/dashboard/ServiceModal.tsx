"use client";

import { useState, useTransition } from "react";
import { crearServicio, editarServicio, eliminarServicio } from "@/app/dashboard/crud-actions";
import type { Servicio } from "@/types/database";

interface ServiceModalProps {
  servicio?: Servicio | null;
  comercioId: string;
  onClose: () => void;
}

export default function ServiceModal({ servicio, comercioId, onClose }: ServiceModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEditing = !!servicio;

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      if (isEditing) {
        await editarServicio(formData);
      } else {
        await crearServicio(formData);
      }
      onClose();
    });
  };

  const handleDelete = () => {
    if (!servicio) return;
    startTransition(async () => {
      await eliminarServicio(servicio.id);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-[20px] sm:rounded-[20px] w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-[#3C3C4333] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#3C3C4318]">
          <h2 className="text-[18px] font-bold tracking-tight">
            {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#78788028] flex items-center justify-center text-[var(--color-label-secondary)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          {isEditing && <input type="hidden" name="id" value={servicio.id} />}
          <input type="hidden" name="comercio_id" value={comercioId} />

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
              Nombre del servicio *
            </label>
            <input
              name="nombre"
              required
              defaultValue={servicio?.nombre || ""}
              placeholder="Ej: Corte de pelo"
              className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              defaultValue={servicio?.descripcion || ""}
              placeholder="Descripción breve del servicio..."
              rows={2}
              className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
              Categoría
            </label>
            <input
              name="categoria"
              defaultValue={(servicio as Record<string, unknown>)?.categoria as string || ""}
              placeholder="Ej: Barbería, Facial, Masajes..."
              className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Duración (min) *
              </label>
              <input
                name="duracion_minutos"
                type="number"
                required
                min={5}
                step={5}
                defaultValue={servicio?.duracion_minutos || 30}
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Precio (ARS) *
              </label>
              <input
                name="precio"
                type="number"
                required
                min={0}
                step={100}
                defaultValue={servicio?.precio || ""}
                placeholder="5000"
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[#FF3B30] text-[13px] font-medium hover:underline"
              >
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[var(--color-label-secondary)] hover:bg-[#78788018] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-full text-[14px] font-semibold bg-[var(--color-mint)] text-white hover:bg-[var(--color-mint-dark)] transition disabled:opacity-50 shadow-sm"
            >
              {isPending ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 rounded-[20px] flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#FF3B3015] flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold mb-1">¿Eliminar servicio?</h3>
              <p className="text-[13px] text-[var(--color-label-tertiary)] mb-4">
                Se desactivará &quot;{servicio?.nombre}&quot;. Podrás reactivarlo luego.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2 rounded-full text-[13px] font-medium bg-[#78788018] hover:bg-[#78788028] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-5 py-2 rounded-full text-[13px] font-semibold bg-[#FF3B30] text-white hover:bg-[#FF2D20] transition disabled:opacity-50"
                >
                  {isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
