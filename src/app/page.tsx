"use client";

import React, { useEffect, useState } from "react";
import { Car, Clock, Sparkles, MapPin } from "lucide-react";
import {
  suscribirTurnosActivos,
  suscribirConfiguracionGlobal,
  CONFIGURACION_POR_DEFECTO,
} from "@/services/lavaderoService";
import { ConfiguracionGlobal, TurnoActivo } from "@/types/lavadero";
import { TurnoActivoBanner } from "@/components/ui/TurnoActivoBanner";

export default function SemaforoPublicoPage() {
  const [turnos, setTurnos] = useState<TurnoActivo[]>([]);
  const [config, setConfig] = useState<ConfiguracionGlobal>(
    CONFIGURACION_POR_DEFECTO
  );
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let turnosCargados = false;
    let configCargada = false;

    const verificarCarga = () => {
      if (turnosCargados && configCargada) {
        setCargando(false);
      }
    };

    const unsubTurnos = suscribirTurnosActivos(
      (data) => {
        setTurnos(data);
        turnosCargados = true;
        verificarCarga();
      },
      () => {
        turnosCargados = true;
        verificarCarga();
      }
    );

    const unsubConfig = suscribirConfiguracionGlobal(
      (data) => {
        setConfig(data);
        configCargada = true;
        verificarCarga();
      },
      () => {
        configCargada = true;
        verificarCarga();
      }
    );

    return () => {
      unsubTurnos();
      unsubConfig();
    };
  }, []);

  // Excluir los autos que ya están en estado "listo"
  const autosEnFilaOLavado = turnos.filter(
    (turno) => turno.estado !== "listo"
  ).length;

  const demoraEstimada =
    autosEnFilaOLavado * (config.minutos_promedio_por_auto || 12);

  // Determinación de color del semáforo:
  // Verde: < 20 min | Amarillo: 20-45 min | Rojo: > 45 min
  const obtenerEstiloSemaforo = (minutos: number) => {
    if (minutos < 20) {
      return {
        colorNombre: "Baja demanda",
        bgCircle: "bg-emerald-500",
        glow: "shadow-[0_0_80px_rgba(16,185,129,0.55)]",
        ring: "ring-emerald-400/30",
        badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    }
    if (minutos <= 45) {
      return {
        colorNombre: "Demanda moderada",
        bgCircle: "bg-amber-400",
        glow: "shadow-[0_0_80px_rgba(251,191,36,0.55)]",
        ring: "ring-amber-400/30",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      };
    }
    return {
      colorNombre: "Alta demanda",
      bgCircle: "bg-rose-500",
      glow: "shadow-[0_0_80px_rgba(244,63,94,0.55)]",
      ring: "ring-rose-500/30",
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    };
  };

  const estiloSemaforo = obtenerEstiloSemaforo(demoraEstimada);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-6 py-10 max-w-md mx-auto w-full">
      {/* Cabecera de marca */}
      <div className="space-y-4">
        <header className="flex items-center justify-center gap-2.5 pt-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-xl font-black tracking-tight text-white block leading-none">
              DELTAWASH
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Estado del lavadero en vivo
            </span>
          </div>
        </header>

        {/* Recuperación de turno activo si el cliente cerró la pestaña por error */}
        <TurnoActivoBanner />
      </div>

      {/* Cuerpo central: Semáforo Público */}
      <section className="my-auto py-8 flex flex-col items-center text-center">
        {cargando ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-44 h-44 rounded-full bg-slate-900 border border-slate-800 animate-pulse" />
            <p className="text-sm text-slate-400 animate-pulse">
              Consultando estado en tiempo real...
            </p>
          </div>
        ) : config.semaforo_publico_activo ? (
          <div className="flex flex-col items-center w-full space-y-8">
            {/* Indicador gigante del semáforo */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full ${estiloSemaforo.bgCircle} ${estiloSemaforo.glow} ring-8 ${estiloSemaforo.ring} flex flex-col items-center justify-center transition-all duration-500`}
              >
                <Clock className="w-10 h-10 text-slate-950/80 mb-1 stroke-[2.5]" />
                <span className="text-5xl sm:text-6xl font-black text-slate-950 tracking-tight leading-none">
                  {demoraEstimada}
                </span>
                <span className="text-sm font-extrabold uppercase tracking-widest text-slate-950/80 mt-1">
                  minutos
                </span>
              </div>
            </div>

            {/* Etiqueta y texto principal requerido */}
            <div className="space-y-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border ${estiloSemaforo.badge}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {estiloSemaforo.colorNombre}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Demora estimada: {demoraEstimada} minutos
              </h1>

              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                Calculado automáticamente en tiempo real según el flujo actual de
                la pista de lavado.
              </p>
            </div>
          </div>
        ) : (
          /* Estado cuando semaforo_publico_activo es false */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 w-full space-y-5 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                En vivo
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
                Abierto - Acercate a nuestro local
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                Te esperamos por orden de llegada. Al estacionar en la recepción
                podrás escanear el código QR para seguir tu lavado desde el
                celular.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Pie informativo (Sin ningún botón para anotarse desde aquí) */}
      <footer className="text-center space-y-2 border-t border-slate-900 pt-6">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Atención espontánea por orden de llegada en el local</span>
        </div>
      </footer>
    </main>
  );
}
