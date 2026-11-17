"use client";

import React, { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  Car,
  KeyRound,
  Clock,
  Droplets,
  CheckCircle2,
  LogOut,
  Lock,
  Mail,
  Activity,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  suscribirTurnosActivos,
  suscribirConfiguracionGlobal,
  cambiarEstadoTurno,
  marcarTurnoListo,
  entregarTurno,
  actualizarSemaforoPublico,
  CONFIGURACION_POR_DEFECTO,
} from "@/services/lavaderoService";
import { ConfiguracionGlobal, TurnoActivo } from "@/types/lavadero";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";

export default function AdminKanbanPage() {
  // Estado de Autenticación (Firebase Auth)
  const [usuario, setUsuario] = useState<User | null>(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // Estado en Tiempo Real del Tablero y Configuración
  const [turnos, setTurnos] = useState<TurnoActivo[]>([]);
  const [config, setConfig] = useState<ConfiguracionGlobal>(
    CONFIGURACION_POR_DEFECTO
  );
  const [actualizandoSemaforo, setActualizandoSemaforo] = useState(false);

  // 1. Verificar sesión de Firebase Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setVerificandoAuth(false);
    });
    return () => unsubAuth();
  }, []);

  // 2. Suscripciones en tiempo real (onSnapshot) una vez autenticado
  useEffect(() => {
    if (!usuario) return;

    const unsubTurnos = suscribirTurnosActivos((data) => {
      setTurnos(data);
    });

    const unsubConfig = suscribirConfiguracionGlobal((data) => {
      setConfig(data);
    });

    return () => {
      unsubTurnos();
      unsubConfig();
    };
  }, [usuario]);

  // Handler de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin("");
    setIniciandoSesion(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error("Error de autenticación:", err);
      setErrorLogin("Credenciales inválidas. Verificá tu correo y contraseña.");
    } finally {
      setIniciandoSesion(false);
    }
  };

  // Handler de Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  // Handler del Toggle Switch en el Header (semaforo_publico_activo)
  const handleToggleSemaforo = async (nuevoValor: boolean) => {
    try {
      setActualizandoSemaforo(true);
      await actualizarSemaforoPublico(nuevoValor);
    } catch (err) {
      console.error("Error al actualizar el semáforo público:", err);
    } finally {
      setActualizandoSemaforo(false);
    }
  };

  // Handlers de transición de las 4 columnas Kanban
  const handleConfirmarRecepcion = async (turno: TurnoActivo) => {
    await cambiarEstadoTurno(turno.id, "espera");
  };

  const handlePasarALavado = async (turno: TurnoActivo) => {
    await cambiarEstadoTurno(turno.id, "lavado");
  };

  const handleMarcarListo = async (turno: TurnoActivo) => {
    await marcarTurnoListo(turno);
  };

  const handleEntregar = async (turno: TurnoActivo) => {
    await entregarTurno(turno);
  };

  // Pantalla de carga inicial mientras se resuelve Firebase Auth
  if (verificandoAuth) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Verificando acceso...</p>
        </div>
      </main>
    );
  }

  // Vista de Login Simple (Exclusivo Cajero)
  if (!usuario) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-1">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              DELTAWASH ADMIN
            </h1>
            <p className="text-sm text-slate-400">
              Acceso exclusivo para caja y gestión de fila
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Correo electrónico"
              placeholder="caja@deltawash.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              error={errorLogin}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={iniciandoSesion}
              >
                Ingresar al Tablero
              </Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Agrupación de turnos según las 4 columnas
  const pendientesLlave = turnos.filter((t) => t.estado === "pendiente_llave");
  const enEspera = turnos.filter((t) => t.estado === "espera");
  const enProceso = turnos.filter((t) => t.estado === "lavado");
  const listosParaRetirar = turnos.filter((t) => t.estado === "listo");

  const autosCalculoDemora =
    pendientesLlave.length + enEspera.length + enProceso.length;
  const demoraActualMinutos =
    autosCalculoDemora * (config.minutos_promedio_por_auto || 12);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Superior (Desktop-First) */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Identidad + Resumen rápido de demora */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">
                  DELTAWASH • CAJA
                </h1>
                <span className="text-xs text-slate-400">
                  Tablero Kanban en Tiempo Real
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-slate-800/70 border border-slate-700/70 px-3.5 py-1.5 rounded-xl text-xs">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">
                Demora calculada:{" "}
                <strong className="text-white">
                  {demoraActualMinutos} min
                </strong>{" "}
                ({autosCalculoDemora} autos activos)
              </span>
            </div>
          </div>

          {/* Feature de Negocio: Toggle Switch para semaforo_publico_activo + Cerrar Sesión */}
          <div className="flex items-center gap-5">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
              <ToggleSwitch
                checked={config.semaforo_publico_activo}
                onChange={handleToggleSemaforo}
                disabled={actualizandoSemaforo}
                label="Semáforo Público"
                description={
                  config.semaforo_publico_activo
                    ? "Mostrando demora en /"
                    : 'Oculto ("Acercate al local")'
                }
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Tablero Kanban de 4 Columnas */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 h-full">
          {/* Columna 1: Pendiente de Llave */}
          <KanbanColumn
            titulo="Pendiente de Llave"
            subtitulo="Escaneó QR • Falta llave física"
            colorAcento="amber"
            icono={<KeyRound className="w-5 h-5" />}
            turnos={pendientesLlave}
            emptyText="No hay autos pendientes de entregar llave"
            onConfirmarRecepcion={handleConfirmarRecepcion}
            onPasarALavado={handlePasarALavado}
            onMarcarListo={handleMarcarListo}
            onEntregar={handleEntregar}
          />

          {/* Columna 2: En Espera */}
          <KanbanColumn
            titulo="En Espera"
            subtitulo="Llave en caja • Listos para lavar"
            colorAcento="blue"
            icono={<Clock className="w-5 h-5" />}
            turnos={enEspera}
            emptyText="No hay vehículos en fila de espera"
            onConfirmarRecepcion={handleConfirmarRecepcion}
            onPasarALavado={handlePasarALavado}
            onMarcarListo={handleMarcarListo}
            onEntregar={handleEntregar}
          />

          {/* Columna 3: En Proceso */}
          <KanbanColumn
            titulo="En Proceso"
            subtitulo="Autos actualmente en pista"
            colorAcento="sky"
            icono={<Droplets className="w-5 h-5" />}
            turnos={enProceso}
            emptyText="Ningún auto en pista de lavado"
            onConfirmarRecepcion={handleConfirmarRecepcion}
            onPasarALavado={handlePasarALavado}
            onMarcarListo={handleMarcarListo}
            onEntregar={handleEntregar}
          />

          {/* Columna 4: Listos para Retirar */}
          <KanbanColumn
            titulo="Listos para Retirar"
            subtitulo="Lavado finalizado • Esperando retiro"
            colorAcento="neonGreen"
            icono={<CheckCircle2 className="w-5 h-5" />}
            turnos={listosParaRetirar}
            emptyText="No hay autos pendientes de entrega"
            onConfirmarRecepcion={handleConfirmarRecepcion}
            onPasarALavado={handlePasarALavado}
            onMarcarListo={handleMarcarListo}
            onEntregar={handleEntregar}
          />
        </div>
      </main>
    </div>
  );
}
