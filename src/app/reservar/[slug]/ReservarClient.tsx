"use client";

import { useState, useMemo, useTransition } from "react";
import { crearReservaPublica } from "./actions";

interface ServicioData {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
  moneda: string;
}

interface PersonalData {
  id: string;
  nombre: string;
  especialidad: string | null;
}

interface TurnoExistente {
  personal_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface Props {
  comercio: { id: string; nombre: string; slug: string; direccion: string | null; logo_url: string | null };
  servicios: ServicioData[];
  personal: PersonalData[];
  turnosExistentes: TurnoExistente[];
}

type Step = 1 | 2 | 3 | 4 | 5;

function generateSlots(fecha: string, personalId: string, duracion: number, turnosExistentes: TurnoExistente[]): string[] {
  const busy = turnosExistentes.filter(t => t.personal_id === personalId && t.fecha === fecha);
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 30]) {
      if (h === 19 && m === 30) break;
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endMin = h * 60 + m + duracion;
      if (endMin > 20 * 60) continue;
      const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
      const conflicts = busy.some(b => start < b.hora_fin && end > b.hora_inicio);
      if (!conflicts) slots.push(start);
    }
  }
  return slots;
}

function getNextDays(count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function ReservarClient({ comercio, servicios, personal, turnosExistentes }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [selectedServicio, setSelectedServicio] = useState<ServicioData | null>(null);
  const [selectedPersonal, setSelectedPersonal] = useState<PersonalData | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [selectedFecha, setSelectedFecha] = useState<string>("");
  const [selectedHora, setSelectedHora] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const nextDays = useMemo(() => getNextDays(14), []);

  const availableSlots = useMemo(() => {
    if (!selectedServicio || !selectedFecha || !selectedPersonal) return [];
    return generateSlots(selectedFecha, selectedPersonal.id, selectedServicio.duracion_minutos, turnosExistentes);
  }, [selectedServicio, selectedFecha, selectedPersonal, turnosExistentes]);

  const handleSelectPersonal = (p: PersonalData | null) => {
    if (p === null) {
      setAutoAssign(true);
      // Pick the first one with most availability
      setSelectedPersonal(personal[0] || null);
    } else {
      setAutoAssign(false);
      setSelectedPersonal(p);
    }
    setStep(3);
  };

  const handleSelectFecha = (fecha: string) => {
    setSelectedFecha(fecha);
    setSelectedHora("");
    // If auto-assign, find best available professional for this date
    if (autoAssign && selectedServicio) {
      const best = personal.find(p => {
        const slots = generateSlots(fecha, p.id, selectedServicio.duracion_minutos, turnosExistentes);
        return slots.length > 0;
      });
      if (best) setSelectedPersonal(best);
    }
  };

  const handleSubmit = () => {
    if (!selectedServicio || !selectedPersonal || !selectedFecha || !selectedHora) return;
    const duracion = selectedServicio.duracion_minutos;
    const [h, m] = selectedHora.split(":").map(Number);
    const endMin = h * 60 + m + duracion;
    const horaFin = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const fd = new FormData();
    fd.set("comercio_id", comercio.id);
    fd.set("servicio_id", selectedServicio.id);
    fd.set("personal_id", selectedPersonal.id);
    fd.set("fecha", selectedFecha);
    fd.set("hora_inicio", selectedHora);
    fd.set("hora_fin", horaFin);
    fd.set("cliente_nombre", nombre);
    fd.set("cliente_telefono", telefono);
    fd.set("cliente_email", email);
    fd.set("cliente_dni", dni);

    startTransition(async () => {
      const result = await crearReservaPublica(fd);
      if (result.success) setSuccess(true);
    });
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2F2F7] to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-[20px] shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#34C75920] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-[20px] font-bold mb-2">¡Reserva confirmada!</h2>
          <p className="text-[14px] text-[var(--color-label-tertiary)] mb-4">Tu turno ha sido registrado. Te esperamos.</p>
          <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--color-label-tertiary)]">Servicio</span>
              <span className="font-medium">{selectedServicio?.nombre}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--color-label-tertiary)]">Profesional</span>
              <span className="font-medium">{selectedPersonal?.nombre}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--color-label-tertiary)]">Fecha</span>
              <span className="font-medium">{new Date(selectedFecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--color-label-tertiary)]">Hora</span>
              <span className="font-medium">{selectedHora}</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-label-tertiary)]">🌟 Ganaste 10 puntos de fidelización</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F2F7] to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-mint)] via-[#52C4A8] to-[#3AA08A] px-6 pt-8 pb-10 text-white">
        <div className="max-w-lg mx-auto">
          <h1 className="text-[24px] font-bold">{comercio.nombre}</h1>
          {comercio.direccion && <p className="text-[13px] text-white/75 mt-0.5">📍 {comercio.direccion}</p>}
          <p className="text-[14px] text-white/90 mt-2">Reservá tu turno online</p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-6 -mt-4">
        <div className="bg-white rounded-[14px] shadow-lg p-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${step >= s ? "bg-[var(--color-mint)] text-white" : "bg-[#78788018] text-[var(--color-label-tertiary)]"}`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? "bg-[var(--color-mint)]" : "bg-[#78788018]"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 px-0.5">
            <span className="text-[9px] text-[var(--color-label-tertiary)]">Servicio</span>
            <span className="text-[9px] text-[var(--color-label-tertiary)]">Profesional</span>
            <span className="text-[9px] text-[var(--color-label-tertiary)]">Horario</span>
            <span className="text-[9px] text-[var(--color-label-tertiary)]">Datos</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {/* Step 1: Service */}
        {step === 1 && (
          <>
            <h2 className="text-[16px] font-bold">¿Qué servicio necesitás?</h2>
            <div className="space-y-2">
              {servicios.map(s => (
                <button key={s.id} onClick={() => { setSelectedServicio(s); setStep(2); }}
                  className={`w-full text-left p-4 rounded-[var(--radius-md)] border transition-all ${
                    selectedServicio?.id === s.id ? "border-[var(--color-mint)] bg-[var(--color-mint-light)]" : "border-[#3C3C4318] bg-white hover:border-[var(--color-mint)]"
                  } shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[14px] font-semibold">{s.nombre}</div>
                      <div className="text-[12px] text-[var(--color-label-tertiary)] mt-0.5">⏱ {s.duracion_minutos} min</div>
                    </div>
                    <div className="text-[15px] font-bold text-[var(--color-mint-dark)]">{formatCurrency(s.precio)}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Professional */}
        {step === 2 && (
          <>
            <h2 className="text-[16px] font-bold">¿Con quién preferís?</h2>
            <button onClick={() => handleSelectPersonal(null)}
              className="w-full text-left p-4 rounded-[var(--radius-md)] border border-[#3C3C4318] bg-white hover:border-[var(--color-mint)] shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[#5AC8FA] flex items-center justify-center text-white text-sm">🎲</div>
                <div>
                  <div className="text-[14px] font-semibold">Cualquier profesional</div>
                  <div className="text-[12px] text-[var(--color-label-tertiary)]">El primero disponible</div>
                </div>
              </div>
            </button>
            {personal.map(p => (
              <button key={p.id} onClick={() => handleSelectPersonal(p)}
                className="w-full text-left p-4 rounded-[var(--radius-md)] border border-[#3C3C4318] bg-white hover:border-[var(--color-mint)] shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9500] to-[#FF2D55] flex items-center justify-center text-white text-[11px] font-bold">
                    {p.nombre.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">{p.nombre}</div>
                    {p.especialidad && <div className="text-[12px] text-[var(--color-label-tertiary)]">{p.especialidad}</div>}
                  </div>
                </div>
              </button>
            ))}
            <button onClick={() => setStep(1)} className="text-[13px] text-[var(--color-label-tertiary)] hover:underline">← Volver</button>
          </>
        )}

        {/* Step 3: Date + Time */}
        {step === 3 && selectedServicio && (
          <>
            <h2 className="text-[16px] font-bold">Elegí día y horario</h2>
            {/* Date pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {nextDays.map(d => {
                const key = d.toISOString().split("T")[0];
                const isSelected = key === selectedFecha;
                return (
                  <button key={key} onClick={() => handleSelectFecha(key)}
                    className={`shrink-0 w-14 py-2 rounded-[var(--radius-sm)] text-center border transition-all ${
                      isSelected ? "border-[var(--color-mint)] bg-[var(--color-mint)] text-white" : "border-[#3C3C4318] bg-white hover:border-[var(--color-mint)]"
                    }`}>
                    <div className="text-[10px] uppercase font-semibold">{d.toLocaleDateString("es-AR", { weekday: "short" })}</div>
                    <div className="text-[18px] font-bold">{d.getDate()}</div>
                    <div className="text-[10px]">{d.toLocaleDateString("es-AR", { month: "short" })}</div>
                  </button>
                );
              })}
            </div>
            {/* Time slots */}
            {selectedFecha && (
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--color-label-tertiary)] mb-2">
                  Horarios disponibles {autoAssign && selectedPersonal ? `(con ${selectedPersonal.nombre})` : ""}
                </h3>
                {availableSlots.length === 0 ? (
                  <p className="text-[13px] text-[var(--color-label-tertiary)] bg-[#FF950010] rounded-[var(--radius-sm)] p-3">
                    😕 No hay horarios disponibles este día. Probá otro.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button key={slot} onClick={() => { setSelectedHora(slot); setStep(4); }}
                        className={`py-2.5 rounded-[var(--radius-sm)] text-[13px] font-semibold border transition-all ${
                          selectedHora === slot ? "bg-[var(--color-mint)] text-white border-[var(--color-mint)]" : "bg-white border-[#3C3C4318] hover:border-[var(--color-mint)]"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setStep(2)} className="text-[13px] text-[var(--color-label-tertiary)] hover:underline">← Volver</button>
          </>
        )}

        {/* Step 4: Client data */}
        {step === 4 && (
          <>
            <h2 className="text-[16px] font-bold">Tus datos</h2>
            <div className="bg-white rounded-[var(--radius-md)] shadow-sm border border-[#3C3C4318] p-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Nombre completo *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
                  className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Teléfono *</label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 11 1234-5678" type="tel"
                  className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">DNI</label>
                  <input value={dni} onChange={e => setDni(e.target.value)} placeholder="12.345.678"
                    className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" type="email"
                    className="w-full mt-1 border border-[#3C3C4325] rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]" />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] p-4 space-y-2 border border-[#3C3C4318]">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">Resumen</h3>
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-label-tertiary)]">Servicio</span><span className="font-medium">{selectedServicio?.nombre}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-label-tertiary)]">Profesional</span><span className="font-medium">{selectedPersonal?.nombre}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-label-tertiary)]">Fecha</span><span className="font-medium">{new Date(selectedFecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-label-tertiary)]">Hora</span><span className="font-medium">{selectedHora}</span></div>
              <div className="border-t border-[#3C3C4318] pt-2 mt-2 flex justify-between text-[14px]">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-[var(--color-mint-dark)]">{formatCurrency(selectedServicio?.precio || 0)}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={isPending || !nombre.trim() || !telefono.trim()}
              className="w-full py-3.5 rounded-[var(--radius-sm)] bg-[var(--color-mint)] text-white text-[15px] font-bold disabled:opacity-50 hover:bg-[var(--color-mint-dark)] transition shadow-lg">
              {isPending ? "Reservando..." : "Confirmar reserva"}
            </button>
            <button onClick={() => setStep(3)} className="w-full text-[13px] text-[var(--color-label-tertiary)] hover:underline text-center">← Volver</button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-[11px] text-[var(--color-label-tertiary)]">
        Powered by <span className="font-semibold">Prenota</span>
      </div>
    </div>
  );
}
