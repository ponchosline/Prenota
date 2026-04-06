"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import type { Comercio } from "@/types/database";
import { useEffect } from "react";

const navItems = [
  {
    name: "Tablero",
    href: "/dashboard",
    color: "green" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    name: "Mi Equipo",
    href: "/dashboard/equipo",
    color: "blue" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: "Servicios",
    href: "/dashboard/servicios",
    color: "purple" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: "Clientes & Rewards",
    href: "/dashboard/clientes",
    color: "orange" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    name: "Ajustes",
    href: "/dashboard/ajustes",
    color: "gray" as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const iconBgColors: Record<string, string> = {
  green: "bg-[#34C75926] text-[#34C759]",
  blue: "bg-[#007AFF26] text-[#007AFF]",
  purple: "bg-[#AF52DE26] text-[#AF52DE]",
  orange: "bg-[#FF950026] text-[#FF9500]",
  gray: "bg-[#8E8E9326] text-[#8E8E93]",
};

const planLabels: Record<string, { label: string; color: string }> = {
  basico: { label: "Plan Básico", color: "text-[#8E8E93]" },
  pro: { label: "Plan Pro", color: "text-[var(--color-mint-dark)]" },
  vip: { label: "Plan VIP", color: "text-[#AF52DE]" },
};

interface SidebarProps {
  comercioActivo: Comercio;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ comercioActivo, userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const plan = planLabels[comercioActivo.plan] || planLabels.basico;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[280px] lg:w-[260px]
          glass border-r border-[#3C3C4333]
          flex flex-col p-5 gap-6 shrink-0
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand + close button */}
        <div className="flex items-center justify-between px-3 pt-1">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--color-label-primary)]">
              Prenota
            </h1>
            <span className="text-[11px] font-medium text-[var(--color-label-tertiary)] uppercase tracking-wider">
              Panel de control
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full bg-[#78788028] flex items-center justify-center text-[var(--color-label-secondary)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isExactDashboard = item.href === "/dashboard" && pathname === "/dashboard";
            const active = isActive || isExactDashboard;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[15px] transition-all duration-150 ${
                  active
                    ? "bg-[var(--color-mint)] text-white font-medium"
                    : "text-[var(--color-label-primary)] hover:bg-[#78788028]"
                }`}
              >
                <div
                  className={`w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 ${
                    active ? "bg-white/30 text-white" : iconBgColors[item.color]
                  }`}
                >
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Plan Card */}
        <div className="bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)] p-4 border border-[#3C3C4333]">
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${plan.color}`}>
            {plan.label}
          </div>
          <div className="text-[13px] text-[var(--color-label-secondary)] mt-1 truncate">
            {comercioActivo.nombre}
          </div>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-[var(--color-mint)] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-[var(--color-label-secondary)] truncate">{userEmail}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-[var(--color-label-tertiary)] hover:text-[#FF3B30] transition-colors p-1"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
