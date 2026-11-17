"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  Droplets,
  CheckCircle2,
  Coffee,
  KeyRound,
  Car,
  Sparkles,
} from "lucide-react";
import {
  suscribirTurnoPorId,
  suscribirTurnosActivos,
} from "@/services/lavaderoService";
import {
  guardarTurnoLocal,
  limpiarTurnoLocal,
  obtenerTurnoLocal,
} from "@/lib/turnoStorage";
import { EstadoTurno, TurnoActivo } from "@/types/lavadero";

export default function TrackerPage() {
  const params = useParams<{ id: string }>();
  const turnoId = params?.id;

  const [turno, setTurno] = useState<TurnoActivo | null>(null);
  const [turnosActivos, setTurnosActivos] = useState<TurnoActivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const estadoAnteriorRef = useRef<EstadoTurno | null>(null);

  useEffect(() => {
    if (!turnoId) return;

    // 1. Escucha en tiempo real del documento del cliente mediante onSnapshot
    const unsubTurno = suscribirTurnoPorId(
      turnoId,
      (data) => {
        if (data) {
          // Persistir en localStorage para recuperar si cierra la pestaña por error
          guardarTurnoLocal(data.id, data.patente);

          // Disparar vibración en el celular cuando el auto pasa a estado "listo"
          if (
            data.estado === "listo" &&
            estadoAnteriorRef.current !== "listo"
          ) {
            try {
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate([300, 120, 300, 120, 500]);
              }
            } catch {
              // Ignorar si el navegador o sistema operativo bloquea la API de vibración
            }
          }

          estadoAnteriorRef.current = data.estado;
        } else {
          // Si el turno ya fue entregado y eliminado de turnos_activos, limpiar localStorage
          if (obtenerTurnoLocal()?.id === turnoId) {
            limpiarTurnoLocal();
          }
          estadoAnteriorRef.current = null;
        }

        setTurno(data);
        setCargando(false);
      },
      () => {
        setCargando(false);
      }
    );

    // 2. Escucha en tiempo real de la fila activa para calcular la posición exacta
    const unsubFila = suscribirTurnosActivos((lista) => {
      setTurnosActivos(lista);
    });

    return () => {
      unsubTurno();
      unsubFila();
    };
  }, [turnoId]);

  // Calcular "Turnos por delante":
  // Autos activos (excluyendo los que ya están "listo") que ingresaron antes que el auto actual
  const calcularTurnosPorDelante = (): number => {
    if (!turno) return 0;

    const filaActiva = turnosActivos.filter((t) => t.estado !== "listo");
    const indiceActual = filaActiva.findIndex((t) => t.id === turno.id);

    if (indiceActual === -1) return 0;
    return indiceActual;
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">
          Conectando con el seguimiento en tiempo real...
        </p>
      </main>
    );
  }

  // Si el documento ya no existe en turnos_activos (por ej. ya fue marcado como "Entregado")
  if (!turno) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 w-full">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold">Lavado finalizado</h1>
          <p className="text-sm text-slate-400">
            Este vehículo ya fue retirado o el turno no se encuentra activo.
            ¡Gracias por elegir Deltawash!
          </p>
        </div>
      </main>
    );
  }

  const turnosPorDelante = calcularTurnosPorDelante();
  const enFila =
    turno.estado === "pendiente_llave" || turno.estado === "espera";
  const enLavado = turno.estado === "lavado";
  const estaListo = turno.estado === "listo";
  const mostrarPromoCafeteria =
    turno.estado === "pendiente_llave" ||
    turno.estado === "espera" ||
    turno.estado === "lavado";

  // Configuración visual dinámica de pantalla completa según estado
  const temaPantalla = enFila
    ? {
        bg: "bg-amber-400 text-slate-950",
        cardBg: "bg-slate-950/10 border-slate-950/15",
        badgeBg: "bg-slate-950 text-amber-400",
        etiquetaEstado:
          turno.estado === "pendiente_llave"
            ? "Pendiente de recepción de llave"
            : "En fila de espera",
      }
    : enLavado
    ? {
        bg: "bg-blue-600 text-white",
        cardBg: "bg-white/10 border-white/20",
        badgeBg: "bg-white text-blue-700",
        etiquetaEstado: "En pista de lavado",
      }
    : {
        // Estado "listo": Verde Flúor (#39FF14)
        bg: "bg-[#39FF14] text-slate-950",
        cardBg: "bg-slate-950/10 border-slate-950/20",
        badgeBg: "bg-slate-950 text-[#39FF14]",
        etiquetaEstado: "Lavado terminado",
      };

  return (
    <main
      className={`min-h-screen ${temaPantalla.bg} transition-colors duration-500 flex flex-col justify-between px-6 py-8`}
    >
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-between space-y-6">
        {/* Cabecera con patente del vehículo */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 opacity-80" />
            <span className="font-black tracking-tight text-sm uppercase">
              Deltawash Live
            </span>
          </div>

          <div
            className={`px-3.5 py-1 rounded-full font-mono font-black text-sm tracking-widest uppercase shadow-sm ${temaPantalla.badgeBg}`}
          >
            {turno.patente}
          </div>
        </header>

        {/* Bloque central de estado */}
        <section className="my-auto py-6 text-center space-y-6">
          {/* Ícono animado según estado */}
          <div className="flex justify-center">
            <div
              className={`w-24 h-24 rounded-3xl border flex items-center justify-center shadow-lg ${temaPantalla.cardBg}`}
            >
              {enFila && <Clock className="w-12 h-12 stroke-[2.2]" />}
              {enLavado && (
                <Droplets className="w-12 h-12 stroke-[2.2] animate-bounce" />
              )}
              {estaListo && <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />}
            </div>
          </div>

          {/* Píldora de sub-estado */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-current/20">
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {temaPantalla.etiquetaEstado}
          </div>

          {/* Texto principal requerido por especificación */}
          {enFila && (
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Tu auto está en fila. Turnos por delante: {turnosPorDelante}
              </h1>

              {turno.estado === "pendiente_llave" && (
                <div className="inline-flex items-center gap-2 text-xs font-bold bg-slate-950/15 px-4 py-2 rounded-xl">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>
                    Recordá entregar la llave en caja para confirmar tu lugar
                  </span>
                </div>
              )}
            </div>
          )}

          {enLavado && (
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                ¡Ya empezamos! Tu auto está siendo lavado.
              </h1>
              <p className="text-sm opacity-90 font-medium">
                La pantalla cambiará automáticamente cuando esté listo para
                retirar.
              </p>
            </div>
          )}

          {estaListo && (
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                ¡Listo! Vení a retirar tu auto.
              </h1>
              <p className="text-sm font-bold opacity-85">
                Acercate a la caja del lavadero para retirar tus llaves.
              </p>
            </div>
          )}
        </section>

        {/* Feature de Negocio: Tarjeta promocional de cafetería en pendiente_llave, espera y lavado */}
        <footer className="space-y-3">
          {mostrarPromoCafeteria && (
            <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-white/10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1 text-left">
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                  Beneficio Cliente en Espera
                </span>
                <p className="text-sm font-bold leading-snug text-slate-100">
                  Mostrá esta pantalla activa en la cafetería de la esquina y
                  obtené una medialuna de regalo con tu café
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-xs font-semibold opacity-75">
            Actualización automática en tiempo real • No cierres esta pestaña
          </p>
        </footer>
      </div>
    </main>
  );
}
