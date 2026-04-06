"use client";

import { useState, useTransition } from "react";
import { crearPersonal, editarPersonal, eliminarPersonal } from "@/app/dashboard/crud-actions";
import type { Personal, Servicio } from "@/types/database";

interface StaffModalProps {
  staff?: Personal | null;
  servicios: Servicio[];
  staffServicios: string[]; // IDs of services this staff member performs
  comercioId: string;
  onClose: () => void;
}

export default function StaffModal({
  staff,
  servicios,
  staffServicios,
  comercioId,
  onClose,
}: StaffModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedServices, setSelectedServices] = useState<string[]>(staffServicios);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEditing = !!staff;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (formData: FormData) => {
    // Append selected services
    for (const sid of selectedServices) {
      formData.append("servicio_ids", sid);
    }
    startTransition(async () => {
      if (isEditing) {
        await editarPersonal(formData);
      } else {
        await crearPersonal(formData);
      }
      onClose();
    });
  };

  const handleDelete = () => {
    if (!staff) return;
    startTransition(async () => {
      await eliminarPersonal(staff.id);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-[20px] sm:rounded-[20px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-[#3C3C4333] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#3C3C4318]">
          <h2 className="text-[18px] font-bold tracking-tight">
            {isEditing ? "Editar Profesional" : "Nuevo Profesional"}
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

        {/* Form */}
        <form action={handleSubmit} className="p-5 space-y-4">
          {isEditing && <input type="hidden" name="id" value={staff.id} />}
          <input type="hidden" name="comercio_id" value={comercioId} />

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-mint-dark)] flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden shrink-0">
              {staff?.avatar_url ? (
                <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                staff?.nombre?.charAt(0) || "+"
              )}
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                URL de foto (opcional)
              </label>
              <input
                name="avatar_url"
                type="url"
                defaultValue={staff?.avatar_url || ""}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
              Nombre completo *
            </label>
            <input
              name="nombre"
              required
              defaultValue={staff?.nombre || ""}
              placeholder="Nombre y Apellido"
              className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
            />
          </div>

          {/* Specialty + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Especialidad
              </label>
              <input
                name="especialidad"
                defaultValue={staff?.especialidad || ""}
                placeholder="Ej: Cosmetóloga"
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Rol
              </label>
              <select
                name="rol"
                defaultValue={staff?.rol || "staff"}
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={staff?.email || ""}
                placeholder="email@ejemplo.com"
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-1">
                Teléfono
              </label>
              <input
                name="telefono"
                defaultValue={staff?.telefono || ""}
                placeholder="+54 11 ..."
                className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Services this staff can perform */}
          {servicios.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] block mb-2">
                Servicios que realiza
              </label>
              <div className="flex flex-wrap gap-2">
                {servicios.map((s) => {
                  const isSelected = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                        isSelected
                          ? "bg-[var(--color-mint)] text-white border-[var(--color-mint)]"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-label-secondary)] border-[#3C3C4330] hover:border-[var(--color-mint)]"
                      }`}
                    >
                      {isSelected && "✓ "}
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
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

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 rounded-[20px] flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#FF3B3015] flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold mb-1">¿Eliminar profesional?</h3>
              <p className="text-[13px] text-[var(--color-label-tertiary)] mb-4">
                Se desactivará a {staff?.nombre}. Podrás reactivarlo luego.
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
