"use client";

import { useState, useTransition, useEffect } from "react";

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  comercioId: string;
  cliente?: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
    dni?: string | null;
    notas?: string | null;
    puntos_fidelizacion: number;
  } | null;
  onSave: (formData: FormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function ClienteModal({ isOpen, onClose, comercioId, cliente, onSave, onDelete }: ClienteModalProps) {
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [notas, setNotas] = useState("");
  const [puntos, setPuntos] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setEmail(cliente.email || "");
      setTelefono(cliente.telefono || "");
      setDni(cliente.dni || "");
      setNotas((cliente as Record<string, unknown>).notas as string || "");
      setPuntos(cliente.puntos_fidelizacion);
    } else {
      setNombre(""); setEmail(""); setTelefono(""); setDni(""); setNotas(""); setPuntos(0);
    }
    setShowDeleteConfirm(false);
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const fd = new FormData();
    if (cliente) fd.set("id", cliente.id);
    fd.set("comercio_id", comercioId);
    fd.set("nombre", nombre);
    fd.set("email", email);
    fd.set("telefono", telefono);
    fd.set("dni", dni);
    fd.set("notas", notas);
    fd.set("puntos_fidelizacion", String(puntos));
    startTransition(async () => {
      await onSave(fd);
      onClose();
    });
  };

  const handleDelete = () => {
    if (!cliente || !onDelete) return;
    startTransition(async () => {
      await onDelete(cliente.id);
      onClose();
    });
  };

  const isEdit = !!cliente;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-6">
        <div className="bg-white rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#3C3C4318]">
            <h2 className="text-[18px] font-bold tracking-tight">
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#78788028] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            {/* Avatar preview */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9500] to-[#FF2D55] flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {nombre ? nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?"}
              </div>
              <div>
                <div className="text-[14px] font-semibold">{nombre || "Nuevo cliente"}</div>
                {isEdit && (
                  <div className="text-[12px] text-[var(--color-label-tertiary)] flex items-center gap-1">
                    ⭐ {puntos} puntos
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Nombre completo *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y Apellido"
                className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">DNI</label>
              <input value={dni} onChange={e => setDni(e.target.value)} placeholder="12.345.678"
                className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email"
                  className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Teléfono</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 11 ..."
                  className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Notas</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Preferencias, alergias, etc."
                rows={2}
                className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] resize-none" />
            </div>

            {isEdit && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Puntos de fidelización</label>
                <input value={puntos} onChange={e => setPuntos(parseInt(e.target.value) || 0)} type="number" min={0}
                  className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-[#3C3C4318] flex items-center gap-3">
            {isEdit && onDelete && (
              showDeleteConfirm ? (
                <button onClick={handleDelete} disabled={isPending}
                  className="text-[13px] font-medium text-white bg-[#FF3B30] px-3 py-1.5 rounded-full disabled:opacity-50">
                  Confirmar eliminar
                </button>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="text-[13px] font-medium text-[#FF3B30] hover:underline">
                  Eliminar
                </button>
              )
            )}
            <div className="flex-1" />
            <button onClick={onClose} className="text-[14px] text-[var(--color-label-secondary)] px-4 py-2">Cancelar</button>
            <button onClick={handleSubmit} disabled={isPending || !nombre.trim()}
              className="bg-[var(--color-mint)] text-white px-5 py-2 rounded-full text-[14px] font-semibold disabled:opacity-50 hover:bg-[var(--color-mint-dark)] transition">
              {isPending ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
