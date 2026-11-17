import { Timestamp } from "firebase/firestore";

export type EstadoTurno = "pendiente_llave" | "espera" | "lavado" | "listo";

export interface TurnoActivo {
  id: string;
  patente: string; // Uppercase (ej: "AB123CD" o "AA123BB")
  telefono?: string; // Opcional (WhatsApp)
  estado: EstadoTurno;
  creadoEn: Timestamp | null;
}

export interface HistorialLavado extends TurnoActivo {
  finalizadoEn: Timestamp | null;
}

export interface ConfiguracionGlobal {
  semaforo_publico_activo: boolean;
  minutos_promedio_por_auto: number;
}
