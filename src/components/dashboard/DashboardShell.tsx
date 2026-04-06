"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import TurnoModal from "@/components/dashboard/TurnoModal";
import { crearTurno } from "@/app/dashboard/crud-actions";
import type { Comercio } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";

interface DashboardShellProps {
  comercioActivo: Comercio;
  comercios: Comercio[];
  userEmail: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  comercioActivo,
  comercios,
  userEmail,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);
  const [servicios, setServicios] = useState<Array<{ id: string; nombre: string; duracion_minutos: number; precio: number }>>([]);
  const [personal, setPersonal] = useState<Array<{ id: string; nombre: string; especialidad: string | null }>>([]);
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string; telefono: string | null }>>([]);

  const loadTurnoData = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [svcRes, perRes, turnRes] = await Promise.all([
      supabase.from("servicios").select("id, nombre, duracion_minutos, precio").eq("comercio_id", comercioActivo.id).eq("activo", true).order("nombre"),
      supabase.from("personal").select("id, nombre, especialidad").eq("comercio_id", comercioActivo.id).eq("activo", true).order("nombre"),
      supabase.from("turnos").select("cliente_id").eq("comercio_id", comercioActivo.id),
    ]);

    setServicios(svcRes.data || []);
    setPersonal(perRes.data || []);

    // Get unique client IDs from turnos
    const clienteIds = [...new Set((turnRes.data || []).map(t => t.cliente_id).filter(Boolean))];
    if (clienteIds.length > 0) {
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nombre, telefono")
        .in("id", clienteIds)
        .order("nombre");
      setClientes(clientesData || []);
    }
  }, [comercioActivo.id]);

  const handleOpenTurnoModal = useCallback(async () => {
    await loadTurnoData();
    setTurnoModalOpen(true);
  }, [loadTurnoData]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        comercioActivo={comercioActivo}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--color-bg-primary)] min-w-0">
        <Header
          comercio={comercioActivo}
          comercios={comercios}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewTurno={handleOpenTurnoModal}
        />
        <main className="flex-1 p-4 sm:p-5 md:p-6">{children}</main>
      </div>

      <TurnoModal
        isOpen={turnoModalOpen}
        onClose={() => setTurnoModalOpen(false)}
        comercioId={comercioActivo.id}
        servicios={servicios}
        personal={personal}
        clientes={clientes}
        onSave={async (fd) => { await crearTurno(fd); }}
      />
    </div>
  );
}
