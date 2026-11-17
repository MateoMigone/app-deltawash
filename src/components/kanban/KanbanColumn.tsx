"use client";

import React from "react";
import { TurnoActivo } from "@/types/lavadero";
import { KanbanCard } from "@/components/kanban/KanbanCard";

interface KanbanColumnProps {
  titulo: string;
  subtitulo: string;
  colorAcento: "amber" | "blue" | "sky" | "neonGreen";
  icono: React.ReactNode;
  turnos: TurnoActivo[];
  emptyText: string;
  onConfirmarRecepcion: (turno: TurnoActivo) => Promise<void>;
  onPasarALavado: (turno: TurnoActivo) => Promise<void>;
  onMarcarListo: (turno: TurnoActivo) => Promise<void>;
  onEntregar: (turno: TurnoActivo) => Promise<void>;
}

const estilosColumna = {
  amber: {
    headerBorder: "border-t-4 border-t-amber-400",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    iconBox: "bg-amber-500/10 text-amber-400",
  },
  blue: {
    headerBorder: "border-t-4 border-t-blue-500",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    iconBox: "bg-blue-500/10 text-blue-400",
  },
  sky: {
    headerBorder: "border-t-4 border-t-sky-400",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    iconBox: "bg-sky-500/10 text-sky-400",
  },
  neonGreen: {
    headerBorder: "border-t-4 border-t-[#39FF14]",
    badge: "bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/30",
    iconBox: "bg-[#39FF14]/10 text-[#39FF14]",
  },
};

export function KanbanColumn({
  titulo,
  subtitulo,
  colorAcento,
  icono,
  turnos,
  emptyText,
  onConfirmarRecepcion,
  onPasarALavado,
  onMarcarListo,
  onEntregar,
}: KanbanColumnProps) {
  const estilo = estilosColumna[colorAcento];

  return (
    <section
      className={`bg-slate-900/50 border border-slate-800/90 rounded-2xl flex flex-col h-full min-h-[540px] overflow-hidden ${estilo.headerBorder}`}
    >
      {/* Cabecera de la Columna */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${estilo.iconBox}`}
          >
            {icono}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              {titulo}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${estilo.badge}`}
        >
          {turnos.length}
        </span>
      </div>

      {/* Lista de Tarjetas */}
      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        {turnos.length === 0 ? (
          <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center p-4 text-center">
            <p className="text-xs text-slate-500">{emptyText}</p>
          </div>
        ) : (
          turnos.map((turno) => (
            <KanbanCard
              key={turno.id}
              turno={turno}
              onConfirmarRecepcion={onConfirmarRecepcion}
              onPasarALavado={onPasarALavado}
              onMarcarListo={onMarcarListo}
              onEntregar={onEntregar}
            />
          ))
        )}
      </div>
    </section>
  );
}
