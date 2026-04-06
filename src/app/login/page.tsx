"use client";

import { useState } from "react";
import { login, signup } from "@/app/auth/actions";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = mode === "login" ? await login(formData) : await signup(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold tracking-tight text-[var(--color-label-primary)]">
            Prenota
          </h1>
          <p className="text-[14px] text-[var(--color-label-tertiary)] mt-1">
            {mode === "login" ? "Iniciá sesión en tu cuenta" : "Creá tu cuenta"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-md)]">
          {/* Segmented Control */}
          <div className="flex bg-[#78788028] rounded-lg p-0.5 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-[13px] font-medium rounded-[7px] transition-all ${
                mode === "login"
                  ? "bg-white shadow-sm text-[var(--color-label-primary)]"
                  : "text-[var(--color-label-tertiary)]"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-[13px] font-medium rounded-[7px] transition-all ${
                mode === "register"
                  ? "bg-white shadow-sm text-[var(--color-label-primary)]"
                  : "text-[var(--color-label-tertiary)]"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FF3B3015] border border-[#FF3B3040] text-[#FF3B30] text-[13px] font-medium px-3 py-2.5 rounded-[var(--radius-sm)] mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full h-11 px-3.5 bg-[var(--color-bg-primary)] border border-[#3C3C4333] rounded-[var(--radius-sm)] text-[15px] text-[var(--color-label-primary)] placeholder:text-[var(--color-label-tertiary)] focus:outline-none focus:border-[var(--color-mint)] focus:ring-2 focus:ring-[var(--color-mint-light)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-1.5">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 bg-[var(--color-bg-primary)] border border-[#3C3C4333] rounded-[var(--radius-sm)] text-[15px] text-[var(--color-label-primary)] placeholder:text-[var(--color-label-tertiary)] focus:outline-none focus:border-[var(--color-mint)] focus:ring-2 focus:ring-[var(--color-mint-light)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[var(--color-mint)] text-white font-semibold text-[15px] rounded-full hover:bg-[var(--color-mint-dark)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Cargando..."
                : mode === "login"
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 bg-white rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)] mb-3">
            Cuentas de prueba
          </div>
          <div className="space-y-2.5 text-[13px]">
            {[
              { email: "admin@esteticaharmony.com", biz: "Estética Harmony", plan: "VIP" },
              { email: "admin@barberking.com", biz: "BarberKing", plan: "PRO" },
              { email: "admin@wellnesszen.com", biz: "Wellness Zen", plan: "BAS" },
            ].map((acc) => (
              <button
                key={acc.email}
                onClick={() => {
                  const form = document.querySelector("form") as HTMLFormElement;
                  const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
                  const passInput = form.querySelector('input[name="password"]') as HTMLInputElement;
                  emailInput.value = acc.email;
                  passInput.value = "demo123456";
                  setMode("login");
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] hover:bg-[#78788012] transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-[var(--color-label-primary)]">{acc.biz}</div>
                  <div className="text-[12px] text-[var(--color-label-tertiary)]">{acc.email}</div>
                </div>
                <span className="text-[10px] font-bold text-[var(--color-mint-dark)]">{acc.plan}</span>
              </button>
            ))}
            <div className="text-[11px] text-[var(--color-label-tertiary)] pt-1">
              Password: <code className="bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded text-[var(--color-label-secondary)]">demo123456</code>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="text-center mt-4">
          <Link href="/" className="text-[13px] text-[var(--color-label-tertiary)] hover:text-[var(--color-mint-dark)]">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
