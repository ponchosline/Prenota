"use client";

import { useState, useRef } from "react";

interface Prize {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  valor: number;
  probabilidad: number;
}

interface RewardWheelProps {
  premios: Prize[];
  onResult: (prize: Prize) => void;
  onNoPrize: () => void;
}

const COLORS = [
  "#FF2D55", "#FF9500", "#34C759", "#007AFF", "#AF52DE",
  "#5856D6", "#FF6482", "#FFD60A", "#30D158", "#64D2FF",
];

export default function RewardWheel({ premios, onResult, onNoPrize }: RewardWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Add a "Suerte" (no prize) segment if we want some chance of losing
  const segments = [...premios];
  const totalProb = segments.reduce((s, p) => s + p.probabilidad, 0);

  // Pick prize based on probability
  const pickWinner = (): Prize | null => {
    // Add chance of "no prize" = max(100 - totalProb, 0)
    const noPrizeChance = Math.max(100 - totalProb, 10);
    const totalWeight = totalProb + noPrizeChance;
    const roll = Math.random() * totalWeight;

    let cumulative = 0;
    for (const prize of segments) {
      cumulative += prize.probabilidad;
      if (roll < cumulative) return prize;
    }
    return null; // no prize
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);

    const winner = pickWinner();
    const segmentAngle = 360 / segments.length;

    let targetIdx: number;
    if (winner) {
      targetIdx = segments.findIndex((p) => p.id === winner.id);
    } else {
      // Land between segments for "no prize" effect
      targetIdx = Math.floor(Math.random() * segments.length);
    }

    // Calculate rotation: spin several full rotations + land on target
    const targetAngle = segmentAngle * targetIdx + segmentAngle / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const finalRotation = rotation + fullSpins * 360 + (360 - targetAngle);

    setRotation(finalRotation);

    // Wait for animation to finish
    setTimeout(() => {
      setSpinning(false);
      if (winner) {
        onResult(winner);
      } else {
        onNoPrize();
      }
    }, 4500);
  };

  return (
    <div className="bg-white rounded-[20px] shadow-lg p-6 animate-fade-in-up text-center">
      <h2 className="text-[22px] font-bold mb-1">🎰 ¡Girá la Ruleta!</h2>
      <p className="text-[13px] text-[var(--color-label-tertiary)] mb-5">
        Tus puntos fueron acreditados. ¡Ahora probá suerte!
      </p>

      {/* Wheel container */}
      <div className="relative w-[280px] h-[280px] mx-auto mb-6">
        {/* Pointer triangle */}
        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "20px solid #FF2D55",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}
          />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {segments.map((prize, idx) => {
              const angle = 360 / segments.length;
              const startAngle = idx * angle - 90;
              const endAngle = startAngle + angle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 100 + 100 * Math.cos(startRad);
              const y1 = 100 + 100 * Math.sin(startRad);
              const x2 = 100 + 100 * Math.cos(endRad);
              const y2 = 100 + 100 * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;

              // Text positioning
              const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
              const textX = 100 + 60 * Math.cos(midAngle);
              const textY = 100 + 60 * Math.sin(midAngle);
              const textRotation = (startAngle + endAngle) / 2 + 90;

              return (
                <g key={prize.id}>
                  <path
                    d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={COLORS[idx % COLORS.length]}
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={segments.length > 6 ? "6" : "7"}
                    fontWeight="bold"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {prize.nombre.length > 12
                      ? prize.nombre.substring(0, 10) + "..."
                      : prize.nombre}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center button */}
        <button
          onClick={spin}
          disabled={spinning}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg border-2 border-[#FFD60A] flex items-center justify-center text-[12px] font-black text-[#FF2D55] z-10 hover:scale-110 transition active:scale-95 disabled:opacity-100"
        >
          {spinning ? "🎰" : "GIRAR"}
        </button>
      </div>

      {/* Prize list */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {segments.map((p, i) => (
          <span
            key={p.id}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          >
            {p.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}
