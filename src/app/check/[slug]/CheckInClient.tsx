"use client";

import { useState } from "react";
import RewardWheel from "@/components/gamification/RewardWheel";
import ScratchCard from "@/components/gamification/ScratchCard";
import { checkInTurno, checkOutTurno } from "./actions";

interface CheckInClientProps {
  comercio: { id: string; nombre: string; slug: string; logo_url: string | null; plan: string };
  turnos: Array<{
    id: string;
    estado: string;
    hora_inicio: string;
    hora_fin: string;
    cliente: { id: string; nombre: string; telefono: string; email: string } | null;
    servicio: { id: string; nombre: string; precio: number } | null;
    personal: { nombre: string } | null;
  }>;
  premios: Array<{
    id: string;
    nombre: string;
    descripcion: string | null;
    tipo: string;
    valor: number;
    probabilidad: number;
  }>;
  promociones: Array<{
    id: string;
    nombre: string;
    descripcion: string | null;
    cantidad_requerida: number;
    premio_descripcion: string;
    servicio: { nombre: string } | null;
  }>;
}

type Step = "search" | "found" | "checkedin" | "checkout" | "chooseReward" | "wheel" | "scratch" | "prizeWon" | "noPrize";

export default function CheckInClient({ comercio, turnos, premios, promociones }: CheckInClientProps) {
  const [step, setStep] = useState<Step>("search");
  const [phone, setPhone] = useState("");
  const [matchedTurno, setMatchedTurno] = useState<(typeof turnos)[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wonPrize, setWonPrize] = useState<(typeof premios)[0] | null>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const searchTurno = () => {
    setError("");
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 4 && !phone.includes("@")) {
      setError("Ingresá un número de teléfono o email válido");
      return;
    }
    const found = turnos.find(
      (t) =>
        t.cliente &&
        (t.cliente.telefono?.replace(/\D/g, "").includes(normalizedPhone) ||
          t.cliente.email?.toLowerCase() === phone.toLowerCase())
    );
    if (!found) {
      setError("No encontramos un turno para hoy con esos datos.");
      return;
    }
    setMatchedTurno(found);
    setStep(found.estado === "completado" ? "checkout" : "found");
  };

  const handleCheckIn = async () => {
    if (!matchedTurno) return;
    setLoading(true);
    const result = await checkInTurno(matchedTurno.id, comercio.id);
    setLoading(false);
    if (result.error) setError(result.error);
    else setStep("checkedin");
  };

  const handleCheckOut = async () => {
    if (!matchedTurno) return;
    setLoading(true);
    const result = await checkOutTurno(matchedTurno.id, comercio.id, matchedTurno.cliente?.id || "");
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEarnedPoints(result.puntos || 0);
      setStep(premios.length > 0 ? "chooseReward" : "noPrize");
    }
  };

  const handlePrizeWon = (prize: (typeof premios)[0]) => {
    setWonPrize(prize);
    setStep("prizeWon");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F2F7] to-white flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#3C3C4318] px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {comercio.logo_url ? (
            <img src={comercio.logo_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-mint-dark)] flex items-center justify-center text-white text-xs font-bold">
              {comercio.nombre.charAt(0)}
            </div>
          )}
          <h1 className="text-[18px] font-bold tracking-tight">{comercio.nombre}</h1>
        </div>
        <p className="text-[12px] text-[var(--color-label-tertiary)] mt-1">Sistema de check-in y rewards</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* STEP: Search */}
          {step === "search" && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-mint)] to-[#00C7BE] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-[22px] font-bold tracking-tight">¡Hola! 👋</h2>
                <p className="text-[14px] text-[var(--color-label-tertiary)] mt-1">Ingresá tu teléfono o email para hacer el check-in</p>
              </div>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchTurno()}
                placeholder="Tu teléfono o email"
                className="w-full border border-[#3C3C4330] rounded-[14px] px-4 py-3.5 text-[16px] bg-[#F8F8F8] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] focus:border-transparent text-center"
                autoFocus />
              {error && <p className="text-[#FF3B30] text-[13px] text-center mt-3">{error}</p>}
              <button onClick={searchTurno} className="w-full mt-4 bg-gradient-to-r from-[var(--color-mint)] to-[#00C7BE] text-white py-3.5 rounded-[14px] text-[16px] font-semibold hover:shadow-lg transition active:scale-[0.98]">
                Buscar mi turno
              </button>
              {promociones.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#3C3C4318]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-2">🎁 Promociones activas</p>
                  {promociones.map((p) => (
                    <div key={p.id} className="bg-gradient-to-r from-[#FF950008] to-[#FF2D5508] border border-[#FF950030] rounded-[10px] p-3 mb-2">
                      <div className="text-[13px] font-semibold">{p.nombre}</div>
                      <div className="text-[11px] text-[var(--color-label-tertiary)]">
                        {p.servicio?.nombre ? `${p.cantidad_requerida} ${p.servicio.nombre}` : `${p.cantidad_requerida} visitas`} → {p.premio_descripcion}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Found turno */}
          {step === "found" && matchedTurno && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up">
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-[20px] font-bold">¡Turno encontrado!</h2>
              </div>
              <div className="bg-[#F8F8F8] rounded-[14px] p-4 space-y-2">
                <div className="flex justify-between text-[14px]"><span className="text-[var(--color-label-tertiary)]">Cliente</span><span className="font-semibold">{matchedTurno.cliente?.nombre}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-[var(--color-label-tertiary)]">Servicio</span><span className="font-semibold">{matchedTurno.servicio?.nombre}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-[var(--color-label-tertiary)]">Hora</span><span className="font-semibold">{matchedTurno.hora_inicio.slice(0, 5)} - {matchedTurno.hora_fin.slice(0, 5)}</span></div>
                <div className="flex justify-between text-[14px]"><span className="text-[var(--color-label-tertiary)]">Profesional</span><span className="font-semibold">{matchedTurno.personal?.nombre}</span></div>
              </div>
              <button onClick={handleCheckIn} disabled={loading}
                className="w-full mt-5 bg-gradient-to-r from-[var(--color-mint)] to-[#00C7BE] text-white py-3.5 rounded-[14px] text-[16px] font-semibold hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50">
                {loading ? "Registrando..." : "✅ Hacer Check-In"}
              </button>
              {error && <p className="text-[#FF3B30] text-[13px] text-center mt-3">{error}</p>}
            </div>
          )}

          {/* STEP: Checked in */}
          {step === "checkedin" && matchedTurno && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
              <div className="w-24 h-24 bg-[var(--color-mint-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-[var(--color-mint-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[22px] font-bold">¡Check-in exitoso! ✨</h2>
              <p className="text-[14px] text-[var(--color-label-tertiary)] mt-2">
                {matchedTurno.cliente?.nombre}, tu turno de <strong>{matchedTurno.servicio?.nombre}</strong> está en curso.
              </p>
              <p className="text-[13px] text-[var(--color-label-tertiary)] mt-4">
                Cuando termine, volvé a escanear el QR para recibir tus puntos y participar por premios 🎁
              </p>
              <div className="mt-6 bg-gradient-to-r from-[#AF52DE15] to-[#5856D615] rounded-[14px] p-4">
                <p className="text-[12px] font-semibold text-[#AF52DE]">💡 Recordá</p>
                <p className="text-[12px] text-[var(--color-label-tertiary)]">Al finalizar, escaneá de nuevo para sumar puntos y participar por premios!</p>
              </div>
            </div>
          )}

          {/* STEP: Checkout */}
          {step === "checkout" && matchedTurno && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-[22px] font-bold">¡Servicio completado!</h2>
              <p className="text-[14px] text-[var(--color-label-tertiary)] mt-2">
                {matchedTurno.cliente?.nombre}, tu sesión de <strong>{matchedTurno.servicio?.nombre}</strong> terminó.
              </p>
              <p className="text-[14px] text-[var(--color-label-tertiary)] mt-1">¡Es hora de reclamar tus puntos y premios!</p>
              <button onClick={handleCheckOut} disabled={loading}
                className="w-full mt-5 bg-gradient-to-r from-[#FF9500] to-[#FF2D55] text-white py-3.5 rounded-[14px] text-[16px] font-semibold hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50">
                {loading ? "Procesando..." : "🎁 Reclamar Puntos y Premios"}
              </button>
              {error && <p className="text-[#FF3B30] text-[13px] text-center mt-3">{error}</p>}
            </div>
          )}

          {/* STEP: Choose reward type */}
          {step === "chooseReward" && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFD60A] to-[#FF9500] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">⭐</span>
              </div>
              <h2 className="text-[22px] font-bold">+{earnedPoints} puntos</h2>
              <p className="text-[14px] text-[var(--color-label-tertiary)] mt-1 mb-6">¡Ahora elegí cómo descubrir tu premio!</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep("wheel")}
                  className="bg-gradient-to-br from-[#FF2D55] to-[#AF52DE] text-white rounded-[16px] p-5 hover:shadow-lg transition active:scale-[0.97] group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">🎰</div>
                  <div className="text-[15px] font-bold">Ruleta</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Girá la rueda</div>
                </button>
                <button onClick={() => setStep("scratch")}
                  className="bg-gradient-to-br from-[#FFD60A] to-[#FF9500] text-white rounded-[16px] p-5 hover:shadow-lg transition active:scale-[0.97] group">
                  <div className="text-4xl mb-2 group-hover:animate-bounce">🎫</div>
                  <div className="text-[15px] font-bold">Raspadita</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Raspá y ganá</div>
                </button>
              </div>
            </div>
          )}

          {/* STEP: Wheel */}
          {step === "wheel" && (
            <RewardWheel premios={premios} onResult={handlePrizeWon} onNoPrize={() => setStep("noPrize")} />
          )}

          {/* STEP: Scratch Card */}
          {step === "scratch" && (
            <ScratchCard premios={premios} onResult={handlePrizeWon} onNoPrize={() => setStep("noPrize")} />
          )}

          {/* STEP: Prize Won */}
          {step === "prizeWon" && wonPrize && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
              <div className="text-6xl mb-3">🎊</div>
              <h2 className="text-[24px] font-bold bg-gradient-to-r from-[#FF9500] to-[#FF2D55] bg-clip-text text-transparent">¡Ganaste!</h2>
              <div className="bg-gradient-to-r from-[#FF950010] to-[#FF2D5510] border border-[#FF950040] rounded-[14px] p-5 mt-4">
                <div className="text-[20px] font-bold">{wonPrize.nombre}</div>
                {wonPrize.descripcion && <div className="text-[14px] text-[var(--color-label-tertiary)] mt-1">{wonPrize.descripcion}</div>}
                {wonPrize.tipo === "descuento_porcentaje" && <div className="text-[32px] font-black text-[#FF9500] mt-2">{wonPrize.valor}% OFF</div>}
                {wonPrize.tipo === "descuento_fijo" && <div className="text-[32px] font-black text-[#FF9500] mt-2">-${wonPrize.valor}</div>}
                {wonPrize.tipo === "puntos_extra" && <div className="text-[32px] font-black text-[#AF52DE] mt-2">+{wonPrize.valor} pts</div>}
                {wonPrize.tipo === "servicio_gratis" && <div className="text-[32px] font-black text-[#34C759] mt-2">¡GRATIS!</div>}
              </div>
              <p className="text-[13px] text-[var(--color-label-tertiary)] mt-4">Mostrá esta pantalla para usar tu premio. Queda guardado en tu historial.</p>
              <button onClick={() => { setStep("search"); setPhone(""); setError(""); }} className="w-full mt-5 bg-[#78788028] text-[var(--color-label-primary)] py-3 rounded-[14px] text-[14px] font-medium">
                Volver al inicio
              </button>
            </div>
          )}

          {/* STEP: No prize */}
          {step === "noPrize" && (
            <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
              <div className="w-20 h-20 bg-[var(--color-mint-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[var(--color-mint-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[22px] font-bold">¡Puntos sumados! 🎯</h2>
              <p className="text-[14px] text-[var(--color-label-tertiary)] mt-2">
                +{earnedPoints} puntos acreditados. ¡Seguí visitando para acumular y ganar premios!
              </p>
              <button onClick={() => { setStep("search"); setPhone(""); setError(""); }}
                className="w-full mt-5 bg-gradient-to-r from-[var(--color-mint)] to-[#00C7BE] text-white py-3 rounded-[14px] text-[14px] font-semibold">
                Finalizar
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 pt-2">
        <p className="text-[11px] text-[var(--color-label-tertiary)]">Powered by <strong>Prenota</strong> ✨</p>
      </div>
    </div>
  );
}
