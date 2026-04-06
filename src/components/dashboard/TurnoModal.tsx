"use client";

import { useState, useTransition, useEffect, useMemo } from "react";

interface Servicio { id: string; nombre: string; duracion_minutos: number; precio: number; }
interface Personal { id: string; nombre: string; especialidad: string | null; }
interface Cliente { id: string; nombre: string; telefono: string | null; }

interface TurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  comercioId: string;
  servicios: Servicio[];
  personal: Personal[];
  clientes: Cliente[];
  onSave: (formData: FormData) => Promise<void>;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

export default function TurnoModal({ isOpen, onClose, comercioId, servicios, personal, clientes, onSave }: TurnoModalProps) {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [servicioId, setServicioId] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [notas, setNotas] = useState("");

  // New client inline
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClienteName, setNewClienteName] = useState("");
  const [newClientePhone, setNewClientePhone] = useState("");

  // Client search
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setServicioId(servicios[0]?.id || "");
      setPersonalId(personal[0]?.id || "");
      setClienteId("");
      setFecha(new Date().toISOString().split("T")[0]);
      setHoraInicio("09:00");
      setNotas("");
      setShowNewClient(false);
      setNewClienteName(""); setNewClientePhone("");
      setClientSearch("");
    }
  }, [isOpen, servicios, personal]);

  const selectedService = useMemo(() => servicios.find(s => s.id === servicioId), [servicioId, servicios]);

  const horaFin = useMemo(() => {
    if (!selectedService) return horaInicio;
    const [h, m] = horaInicio.split(":").map(Number);
    const total = h * 60 + m + selectedService.duracion_minutos;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }, [horaInicio, selectedService]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clientes.slice(0, 8);
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.telefono?.includes(clientSearch)
    ).slice(0, 8);
  }, [clientSearch, clientes]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const fd = new FormData();
    fd.set("comercio_id", comercioId);
    fd.set("servicio_id", servicioId);
    fd.set("personal_id", personalId);
    fd.set("fecha", fecha);
    fd.set("hora_inicio", horaInicio);
    fd.set("notas", notas);

    if (showNewClient) {
      fd.set("new_cliente_name", newClienteName);
      fd.set("new_cliente_phone", newClientePhone);
    } else {
      fd.set("cliente_id", clienteId);
    }

    startTransition(async () => {
      await onSave(fd);
      onClose();
    });
  };

  const canSubmit = servicioId && personalId && fecha && horaInicio && (clienteId || (showNewClient && newClienteName));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-6">
        <div className="bg-white rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#3C3C4318] sticky top-0 bg-white z-10 rounded-t-[20px]">
            <div>
              <h2 className="text-[18px] font-bold tracking-tight">Nuevo Turno</h2>
              <p className="text-[12px] text-[var(--color-label-tertiary)] mt-0.5">Programá una nueva cita</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#78788028] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Service selection */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-2 block">
                Servicio *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {servicios.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServicioId(s.id)}
                    className={`text-left p-3 rounded-[var(--radius-md)] border transition-all ${
                      servicioId === s.id
                        ? "border-[var(--color-mint)] bg-[var(--color-mint-light)] shadow-sm"
                        : "border-[#3C3C4320] hover:border-[var(--color-mint)] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold">{s.nombre}</div>
                        <div className="text-[12px] text-[var(--color-label-tertiary)]">{s.duracion_minutos} min</div>
                      </div>
                      <div className="text-[14px] font-bold text-[var(--color-mint-dark)]">
                        $ {s.precio.toLocaleString("es-AR")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Professional */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-2 block">
                Profesional *
              </label>
              <div className="flex flex-wrap gap-2">
                {personal.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonalId(p.id)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                      personalId === p.id
                        ? "bg-[var(--color-mint)] text-white shadow-sm"
                        : "bg-[#F2F2F7] text-[var(--color-label-primary)] hover:bg-[#E5E5EA]"
                    }`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Fecha *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Hora *</label>
                <select
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
                >
                  {HOURS.map(h =>
                    [0, 30].map(m => {
                      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      return <option key={time} value={time}>{time}</option>;
                    })
                  )}
                </select>
              </div>
            </div>

            {/* Time summary */}
            {selectedService && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--color-label-tertiary)] bg-[#F2F2F7] rounded-[var(--radius-sm)] p-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{horaInicio} — {horaFin} ({selectedService.duracion_minutos} min)</span>
              </div>
            )}

            {/* Client selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => { setShowNewClient(!showNewClient); setClienteId(""); }}
                  className="text-[12px] font-medium text-[var(--color-mint-dark)] hover:underline"
                >
                  {showNewClient ? "Seleccionar existente" : "+ Nuevo cliente"}
                </button>
              </div>

              {showNewClient ? (
                <div className="space-y-2 p-3 bg-[#F2F2F7] rounded-[var(--radius-md)]">
                  <input
                    value={newClienteName} onChange={e => setNewClienteName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
                  />
                  <input
                    value={newClientePhone} onChange={e => setNewClientePhone(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]"
                  />
                </div>
              ) : (
                <div>
                  <input
                    value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClienteId(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-[13px] flex items-center justify-between transition ${
                          clienteId === c.id
                            ? "bg-[var(--color-mint-light)] border border-[var(--color-mint)]"
                            : "hover:bg-[#F2F2F7] border border-transparent"
                        }`}
                      >
                        <div>
                          <span className="font-medium">{c.nombre}</span>
                          {c.telefono && <span className="text-[var(--color-label-tertiary)] ml-2">{c.telefono}</span>}
                        </div>
                        {clienteId === c.id && (
                          <svg className="w-4 h-4 text-[var(--color-mint-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="text-center py-3 text-[12px] text-[var(--color-label-tertiary)]">
                        No se encontraron clientes.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Notas</label>
              <textarea
                value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Observaciones para este turno..."
                rows={2}
                className="w-full mt-1 border border-[#3C3C4330] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] resize-none"
              />
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="p-5 border-t border-[#3C3C4318] space-y-3">
            {selectedService && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--color-label-tertiary)]">Total a cobrar:</span>
                <span className="text-[18px] font-bold text-[var(--color-mint-dark)]">
                  $ {selectedService.precio.toLocaleString("es-AR")}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 text-[14px] text-[var(--color-label-secondary)] py-2.5 rounded-full border border-[#3C3C4330]">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !canSubmit}
                className="flex-1 bg-[var(--color-mint)] text-white py-2.5 rounded-full text-[14px] font-semibold disabled:opacity-50 hover:bg-[var(--color-mint-dark)] transition active:scale-[0.98]"
              >
                {isPending ? "Creando..." : "Confirmar Turno"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
