import { useSyncExternalStore } from "react";

const KEY = "arboles.ultimoRespaldo";

function leer(): number | null {
  try { const v = Number(localStorage.getItem(KEY)); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; }
}

let ultimo: number | null = leer();
const oyentes = new Set<() => void>();

export const ultimoRespaldo = () => ultimo;

/** Anota que se acaba de sacar una copia (respaldo completo o CSV). */
export function marcarRespaldo(ahora = Date.now()): void {
  ultimo = ahora;
  try { localStorage.setItem(KEY, String(ahora)); } catch { /* vale solo para esta sesion */ }
  oyentes.forEach(f => f());
}

export function useUltimoRespaldo(): number | null {
  return useSyncExternalStore(f => { oyentes.add(f); return () => { oyentes.delete(f); }; }, ultimoRespaldo);
}

/** Evaluaciones creadas o modificadas despues de la ultima copia (todas, si nunca se hizo una). */
export function contarSinRespaldar(evals: { actualizada: number }[], ultimoRespaldoMs: number | null): number {
  return ultimoRespaldoMs === null ? evals.length : evals.filter(e => e.actualizada > ultimoRespaldoMs).length;
}

/** «nunca», «hoy», «ayer» o «hace N días». */
export function describirAntiguedad(ms: number | null, ahora = Date.now()): string {
  if (ms === null) return "nunca";
  const dias = Math.floor((new Date(ahora).setHours(0, 0, 0, 0) - new Date(ms).setHours(0, 0, 0, 0)) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}
