import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ConfiguracionGlobal,
  EstadoTurno,
  TurnoActivo,
} from "@/types/lavadero";

// Nombres de colecciones y documentos en Firestore
export const COLECCION_TURNOS_ACTIVOS = "turnos_activos";
export const COLECCION_HISTORIAL = "historial_lavados";
export const COLECCION_CONFIGURACION = "configuracion";
export const DOC_CONFIG_GLOBAL = "global";

export const CONFIGURACION_POR_DEFECTO: ConfiguracionGlobal = {
  semaforo_publico_activo: true,
  minutos_promedio_por_auto: 12,
};

/**
 * 1. Crear nuevo turno al escanear el QR en /checkin
 * Estado inicial: "pendiente_llave"
 */
export async function crearTurnoCheckin(
  patenteInput: string,
  telefonoInput?: string
): Promise<string> {
  const patenteLimpia = patenteInput.trim().toUpperCase().replace(/\s+/g, "");
  const telefonoLimpio = telefonoInput?.trim() || "";

  if (!patenteLimpia) {
    throw new Error("La patente es obligatoria.");
  }

  const docRef = await addDoc(collection(db, COLECCION_TURNOS_ACTIVOS), {
    patente: patenteLimpia,
    ...(telefonoLimpio ? { telefono: telefonoLimpio } : {}),
    estado: "pendiente_llave" satisfies EstadoTurno,
    creadoEn: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * 2. Suscripción en tiempo real a todos los turnos activos (ordenados por orden de llegada)
 * Usado en:
 * - / (Semáforo Público)
 * - /admin (Tablero Kanban)
 * - /tracker/[id] (Cálculo de turnos por delante)
 */
export function suscribirTurnosActivos(
  callback: (turnos: TurnoActivo[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLECCION_TURNOS_ACTIVOS),
    orderBy("creadoEn", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const turnos: TurnoActivo[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          patente: data.patente ?? "",
          telefono: data.telefono ?? undefined,
          estado: (data.estado as EstadoTurno) ?? "pendiente_llave",
          creadoEn: data.creadoEn ?? null,
        };
      });
      callback(turnos);
    },
    (error) => {
      console.error("Error escuchando turnos_activos:", error);
      onError?.(error);
    }
  );
}

/**
 * 3. Suscripción en tiempo real a un turno específico por ID
 * Usado en /tracker/[id]
 */
export function suscribirTurnoPorId(
  turnoId: string,
  callback: (turno: TurnoActivo | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, COLECCION_TURNOS_ACTIVOS, turnoId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      const data = docSnap.data();
      callback({
        id: docSnap.id,
        patente: data.patente ?? "",
        telefono: data.telefono ?? undefined,
        estado: (data.estado as EstadoTurno) ?? "pendiente_llave",
        creadoEn: data.creadoEn ?? null,
      });
    },
    (error) => {
      console.error(`Error escuchando el turno ${turnoId}:`, error);
      onError?.(error);
    }
  );
}

/**
 * 4. Cambiar estado de un turno (Confirmar Recepción -> "espera" | Pasar a Lavado -> "lavado")
 */
export async function cambiarEstadoTurno(
  turnoId: string,
  nuevoEstado: Exclude<EstadoTurno, "listo">
): Promise<void> {
  const docRef = doc(db, COLECCION_TURNOS_ACTIVOS, turnoId);
  await updateDoc(docRef, {
    estado: nuevoEstado,
  });
}

/**
 * 5. Marcar auto como "listo" (En Proceso -> Listos para Retirar)
 * Incluye el bloque preparado para disparar el Webhook de WhatsApp en el futuro.
 */
export async function marcarTurnoListo(turno: TurnoActivo): Promise<void> {
  const docRef = doc(db, COLECCION_TURNOS_ACTIVOS, turno.id);

  await updateDoc(docRef, {
    estado: "listo" satisfies EstadoTurno,
  });

  // ============================================================================
  // FUTURA INTEGRACIÓN CON WHATSAPP API (WEBHOOK)
  // ============================================================================
  // if (turno.telefono) {
  //   try {
  //     await fetch("/api/webhooks/whatsapp", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         telefono: turno.telefono,
  //         patente: turno.patente,
  //         turnoId: turno.id,
  //         mensaje: `¡Hola! Tu vehículo patente ${turno.patente} ya está listo para retirar en Deltawash.`,
  //       }),
  //     });
  //   } catch (webhookError) {
  //     console.error("Error al enviar notificación de WhatsApp:", webhookError);
  //   }
  // }
  // ============================================================================
}

/**
 * 6. Entregar vehículo (Mueve de turnos_activos a historial_lavados de forma atómica)
 */
export async function entregarTurno(turno: TurnoActivo): Promise<void> {
  const batch = writeBatch(db);

  const turnoActivoRef = doc(db, COLECCION_TURNOS_ACTIVOS, turno.id);
  const historialRef = doc(db, COLECCION_HISTORIAL, turno.id);

  batch.set(historialRef, {
    patente: turno.patente,
    ...(turno.telefono ? { telefono: turno.telefono } : {}),
    estado: "listo" satisfies EstadoTurno,
    creadoEn: turno.creadoEn ?? serverTimestamp(),
    finalizadoEn: serverTimestamp(),
  });

  batch.delete(turnoActivoRef);

  await batch.commit();
}

/**
 * 7. Suscripción en tiempo real a la configuración global (Semáforo Público y Minutos Promedio)
 */
export function suscribirConfiguracionGlobal(
  callback: (config: ConfiguracionGlobal) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, COLECCION_CONFIGURACION, DOC_CONFIG_GLOBAL);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(CONFIGURACION_POR_DEFECTO);
        return;
      }
      const data = docSnap.data();
      callback({
        semaforo_publico_activo:
          typeof data.semaforo_publico_activo === "boolean"
            ? data.semaforo_publico_activo
            : CONFIGURACION_POR_DEFECTO.semaforo_publico_activo,
        minutos_promedio_por_auto:
          typeof data.minutos_promedio_por_auto === "number"
            ? data.minutos_promedio_por_auto
            : CONFIGURACION_POR_DEFECTO.minutos_promedio_por_auto,
      });
    },
    (error) => {
      console.error("Error escuchando configuracion global:", error);
      onError?.(error);
    }
  );
}

/**
 * 8. Actualizar el interruptor de Semáforo Público desde el Header de /admin
 */
export async function actualizarSemaforoPublico(
  activo: boolean
): Promise<void> {
  const docRef = doc(db, COLECCION_CONFIGURACION, DOC_CONFIG_GLOBAL);
  await setDoc(
    docRef,
    {
      semaforo_publico_activo: activo,
    },
    { merge: true }
  );
}

/**
 * 9. Actualizar los minutos promedio por auto en la configuración global
 */
export async function actualizarMinutosPromedio(
  minutos: number
): Promise<void> {
  const docRef = doc(db, COLECCION_CONFIGURACION, DOC_CONFIG_GLOBAL);
  await setDoc(
    docRef,
    {
      minutos_promedio_por_auto: minutos,
    },
    { merge: true }
  );
}
