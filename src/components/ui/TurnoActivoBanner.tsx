"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, Sparkles, X } from "lucide-react";
import { obtenerTurnoLocal, limpiarTurnoLocal } from "@/lib/turnoStorage";
import { suscribirTurnoPorId } from "@/services/lavaderoService";
import { TurnoActivo } from "@/types/lavadero";

export function TurnoActivoBanner() {
  const [turnoActivo, setTurnoActivo] = useState<TurnoActivo | null>(null);
  const [ocultoManualmente, setOcultoManualmente] = useState(false);

  useEffect(() => {
    const guardado = obtenerTurnoLocal();
    if (!guardado?.id) return;

    // Verificar en tiempo real si el turno guardado sigue activo en Firestore
    const unsub = suscribirTurnoPorId(guardado.id, (turnoEnVivo) => {
      if (!turnoEnVivo) {
        // El auto ya fue entregado y borrado de turnos_activos: limpiamos localStorage
        limpiarTurnoLocal();
        setTurnoActivo(null);
        return;
      }
      setTurnoActivo(turnoEnVivo);
    });

    return () => unsub();
  }, []);

  if (!turnoActivo || ocultoManualmente) return null;

  const esListo = turnoActivo.estado === "listo";
  const esLavado = turnoActivo.estado === "lavado";

  const etiquetaEstado = esListo
    ? "¡Listo para retirar!"
    : esLavado
    ? "Lavándose en este momento"
    : "En fila de espera";

  const estilosBanner = esListo
    ? "bg-[#39FF14]/15 border-[#39FF14]/50 text-[#39FF14]"
    : esLavado
    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
    : "bg-amber-500/15 border-amber-500/40 text-amber-300";

  return (
    <div
      className={`w-full rounded-2xl border p-4 shadow-xl transition-all ${estilosBanner}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center shrink-0">
            {esListo ? (
              <Sparkles className="w-5 h-5 text-[#39FF14]" />
            ) : (
              <Car className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Tenés un lavado en curso
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 text-white font-mono text-xs font-black tracking-widest">
                {turnoActivo.patente}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Estado actual: <strong className="text-white">{etiquetaEstado}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOcultoManualmente(true)}
          aria-label="Ocultar aviso"
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Link
        href={`/tracker/${turnoActivo.id}`}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm"
      >
        <span>Volver al seguimiento en vivo</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
