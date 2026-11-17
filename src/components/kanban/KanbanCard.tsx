"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Play,
  CheckCircle2,
  PackageCheck,
  Phone,
  Clock,
} from "lucide-react";
import { TurnoActivo } from "@/types/lavadero";
import { Button } from "@/components/ui/Button";

interface KanbanCardProps {
  turno: TurnoActivo;
  onConfirmarRecepcion: (turno: TurnoActivo) => Promise<void>;
  onPasarALavado: (turno: TurnoActivo) => Promise<void>;
  onMarcarListo: (turno: TurnoActivo) => Promise<void>;
  onEntregar: (turno: TurnoActivo) => Promise<void>;
}

export function KanbanCard({
  turno,
  onConfirmarRecepcion,
  onPasarALavado,
  onMarcarListo,
  onEntregar,
}: KanbanCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn: (t: TurnoActivo) => Promise<void>) => {
    try {
      setLoading(true);
      await actionFn(turno);
    } finally {
      setLoading(false);
    }
  };

  // Formateo simple de hora de ingreso
  const horaIngreso = turno.creadoEn
    ? turno.creadoEn.toDate().toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recién";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all space-y-3.5">
      {/* Cabecera: Chapa Patente estilo Mercosur + Hora */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex flex-col bg-white text-slate-950 rounded-lg overflow-hidden border-2 border-slate-300 shadow-sm min-w-[125px]">
          <div className="bg-blue-700 text-[9px] text-white font-bold tracking-widest text-center py-0.5 uppercase">
            República Argentina
          </div>
          <div className="px-3 py-1 text-center font-mono text-xl font-black tracking-widest uppercase">
            {turno.patente}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/70 px-2.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{horaIngreso}</span>
        </div>
      </div>

      {/* Teléfono de contacto (si el cliente lo ingresó) */}
      {turno.telefono ? (
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate font-mono">{turno.telefono}</span>
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic px-1">
          Sin WhatsApp registrado
        </div>
      )}

      {/* Acción según la columna actual */}
      <div className="pt-1">
        {turno.estado === "pendiente_llave" && (
          <Button
            variant="amber"
            size="md"
            fullWidth
            isLoading={loading}
            leftIcon={<KeyRound className="w-4 h-4" />}
            onClick={() => handleAction(onConfirmarRecepcion)}
          >
            Confirmar Recepción
          </Button>
        )}

        {turno.estado === "espera" && (
          <Button
            variant="blue"
            size="md"
            fullWidth
            isLoading={loading}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
            onClick={() => handleAction(onPasarALavado)}
          >
            Pasar a Lavado
          </Button>
        )}

        {turno.estado === "lavado" && (
          <Button
            variant="neonGreen"
            size="md"
            fullWidth
            isLoading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => handleAction(onMarcarListo)}
          >
            Marcar Listo
          </Button>
        )}

        {turno.estado === "listo" && (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            isLoading={loading}
            leftIcon={<PackageCheck className="w-4 h-4 text-emerald-400" />}
            onClick={() => handleAction(onEntregar)}
          >
            Entregado
          </Button>
        )}
      </div>
    </div>
  );
}
