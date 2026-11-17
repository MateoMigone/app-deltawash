const STORAGE_KEY = "deltawash_turno_activo";

export interface TurnoGuardadoLocal {
  id: string;
  patente: string;
  guardadoEn: number;
}

export function guardarTurnoLocal(id: string, patente: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload: TurnoGuardadoLocal = {
      id,
      patente: patente.toUpperCase(),
      guardadoEn: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("No se pudo guardar el turno en localStorage:", err);
  }
}

export function obtenerTurnoLocal(): TurnoGuardadoLocal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TurnoGuardadoLocal;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function limpiarTurnoLocal(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("No se pudo limpiar el turno de localStorage:", err);
  }
}
