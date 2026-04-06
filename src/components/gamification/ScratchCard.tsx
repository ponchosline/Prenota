"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Prize {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  valor: number;
  probabilidad: number;
}

interface ScratchCardProps {
  premios: Prize[];
  onResult: (prize: Prize) => void;
  onNoPrize: () => void;
}

const EMOJI_MAP: Record<string, string> = {
  descuento_porcentaje: "🏷️",
  descuento_fijo: "💵",
  servicio_gratis: "🎁",
  puntos_extra: "⭐",
  producto: "🛍️",
};

export default function ScratchCard({ premios, onResult, onNoPrize }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Pick prize on mount
  useEffect(() => {
    const totalProb = premios.reduce((s, p) => s + p.probabilidad, 0);
    const noPrizeChance = Math.max(100 - totalProb, 10);
    const totalWeight = totalProb + noPrizeChance;
    const roll = Math.random() * totalWeight;

    let cumulative = 0;
    let winner: Prize | null = null;
    for (const p of premios) {
      cumulative += p.probabilidad;
      if (roll < cumulative) { winner = p; break; }
    }
    setPrize(winner);
  }, [premios]);

  // Draw scratch-off overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#C0C0C0");
    grad.addColorStop(0.3, "#E8E8E8");
    grad.addColorStop(0.5, "#D0D0D0");
    grad.addColorStop(0.7, "#E8E8E8");
    grad.addColorStop(1, "#B8B8B8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Scratchy sparkle pattern
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text
    ctx.fillStyle = "#888";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ RASPA AQUÍ ✨", w / 2, h / 2 - 5);
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Deslizá para descubrir tu premio", w / 2, h / 2 + 18);
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const scratch = useCallback((pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";

    if (lastPos.current) {
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    lastPos.current = pos;

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const percent = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercent(percent);

    if (percent > 50 && !revealed) {
      setRevealed(true);
      // Clear canvas with animation
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (prize) {
          onResult(prize);
        } else {
          onNoPrize();
        }
      }, 600);
    }
  }, [revealed, prize, onResult, onNoPrize]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    lastPos.current = getPos(e);
    scratch(getPos(e));
  }, [getPos, scratch]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isScratching) return;
    scratch(getPos(e));
  }, [isScratching, getPos, scratch]);

  const handleEnd = useCallback(() => {
    setIsScratching(false);
    lastPos.current = null;
  }, []);

  return (
    <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
      <h2 className="text-[22px] font-bold mb-1">🎫 ¡Raspa y Ganá!</h2>
      <p className="text-[13px] text-[var(--color-label-tertiary)] mb-5">
        Tus puntos fueron acreditados. ¡Raspá para descubrir tu premio!
      </p>

      {/* Scratch card */}
      <div className="relative w-[300px] h-[160px] mx-auto mb-4 rounded-[16px] overflow-hidden shadow-lg border-2 border-[#FFD60A]">
        {/* Prize underneath */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD60A] to-[#FF9500] flex items-center justify-center">
          {prize ? (
            <div className="text-center px-4">
              <div className="text-4xl mb-1">{EMOJI_MAP[prize.tipo] || "🎁"}</div>
              <div className="text-[18px] font-black text-white drop-shadow-md">
                {prize.nombre}
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                {prize.descripcion || "¡Premio especial!"}
              </div>
            </div>
          ) : (
            <div className="text-center px-4">
              <div className="text-4xl mb-1">😊</div>
              <div className="text-[16px] font-bold text-white drop-shadow-md">
                ¡Seguí intentando!
              </div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5">
                La próxima puede ser la tuya
              </div>
            </div>
          )}
        </div>

        {/* Scratch overlay canvas */}
        <canvas
          ref={canvasRef}
          width={300}
          height={160}
          className={`absolute inset-0 cursor-pointer touch-none transition-opacity duration-500 ${revealed ? "opacity-0" : "opacity-100"}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Progress indicator */}
      <div className="w-[300px] mx-auto">
        <div className="h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FFD60A] to-[#FF9500] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(scratchPercent * 2, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--color-label-tertiary)] mt-1.5">
          {revealed ? "🎉 ¡Revelado!" : `Raspá con el dedo o el mouse — ${Math.round(Math.min(scratchPercent * 2, 100))}%`}
        </p>
      </div>
    </div>
  );
}
