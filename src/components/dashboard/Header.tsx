"use client";

import { useRouter } from "next/navigation";
import type { Comercio } from "@/types/database";
import { useState } from "react";
import { setComercioActivo } from "@/app/dashboard/actions";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";

interface HeaderProps {
  comercio: Comercio;
  comercios: Comercio[];
  onMenuToggle: () => void;
  onNewTurno?: () => void;
}

const planBadge: Record<string, string> = {
  basico: "BAS",
  pro: "PRO",
  vip: "VIP",
};

export default function Header({ comercio, comercios, onMenuToggle, onNewTurno }: HeaderProps) {
  const router = useRouter();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const switchComercio = async (slug: string) => {
    await setComercioActivo(slug);
    setShowSwitcher(false);
    router.refresh();
  };

  return (
    <header className="h-14 glass border-b border-[#3C3C4333] flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-10 gap-2">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0 relative">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 rounded-full bg-[#78788028] flex items-center justify-center text-[var(--color-label-secondary)] shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity min-w-0"
        >
          <span className="text-[15px] sm:text-[17px] font-semibold tracking-tight text-[var(--color-label-primary)] truncate">
            {comercio.nombre}
          </span>
          <svg className="w-3 h-3 text-[var(--color-label-tertiary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="hidden sm:inline text-[12px] font-medium text-white bg-[var(--color-mint)] px-2 py-0.5 rounded-md uppercase shrink-0">
          {planBadge[comercio.plan] || "BAS"}
        </span>
        <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] font-medium text-[#34C759] bg-[#34C75915] px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse-dot" />
          Abierto
        </span>

        {/* Switcher dropdown */}
        {showSwitcher && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowSwitcher(false)} />
            <div className="absolute top-10 left-0 z-30 bg-white rounded-[var(--radius-md)] shadow-lg border border-[#3C3C4333] py-1 min-w-[240px] sm:min-w-[260px]">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">
                Cambiar comercio
              </div>
              {comercios.map((c) => (
                <button
                  key={c.id}
                  onClick={() => switchComercio(c.slug)}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-[#78788012] transition-colors ${
                    c.id === comercio.id ? "bg-[var(--color-mint-light)]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[var(--color-label-primary)] truncate">{c.nombre}</div>
                    <div className="text-[12px] text-[var(--color-label-tertiary)] truncate">{c.direccion}</div>
                  </div>
                  <span className="text-[11px] font-semibold uppercase text-[var(--color-mint-dark)] shrink-0 ml-2">
                    {planBadge[c.plan]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
        <button className="hidden sm:flex w-9 h-9 rounded-full bg-[#78788028] items-center justify-center hover:bg-[#78788033] transition-colors text-[var(--color-label-secondary)]">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors text-[var(--color-label-secondary)] ${
            showNotifications ? "bg-[var(--color-mint-light)] ring-2 ring-[var(--color-mint)]" : "bg-[#78788028] hover:bg-[#78788033]"
          }`}
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF3B30] border-[1.5px] border-white" />
        </button>

        <NotificationsPanel
          comercioId={comercio.id}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        <button
          onClick={onNewTurno}
          className="bg-[var(--color-mint)] text-white font-semibold text-sm px-3 sm:px-5 py-2 rounded-full hover:bg-[var(--color-mint-dark)] hover:shadow-md transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          <span className="hidden sm:inline">+ Nuevo Turno</span>
          <span className="sm:hidden text-lg leading-none">+</span>
        </button>
        <div className="hidden sm:flex w-8 h-8 rounded-full bg-[var(--color-mint)] items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
          {comercio.nombre.charAt(0)}
        </div>
      </div>
    </header>
  );
}
