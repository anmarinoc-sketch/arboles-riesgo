import { useSyncExternalStore } from "react";
import type { ModoVulnerabilidad } from "../engine";
import { MODOS_VULNERABILIDAD } from "../engine";

export const MODO_POR_DEFECTO: ModoVulnerabilidad = "al-menos-uno";

export const DESCRIPCION_MODO: Record<ModoVulnerabilidad, { titulo: string; formula: string; detalle: string }> = {
  "al-menos-uno": {
    titulo: "Al menos un elemento (numeral 3.7)",
    formula: "V = 1 si hay personas, vehículos, construcciones o redes aéreas; si no, V = 0",
    detalle: "Plan Maestro de Zonas Públicas Verdes de Envigado. El riesgo no depende de cuántos elementos están expuestos.",
  },
  promedio: {
    titulo: "Promedio de los cuatro elementos",
    formula: "V = (P + Ve + C + Re) / 4",
    detalle: "Variante del anexo de valoración del Consorcio Linar 2025. Más elementos expuestos, más vulnerabilidad (0, 0,25, 0,5, 0,75 o 1).",
  },
};

export const esModoV = (v: unknown): v is ModoVulnerabilidad => MODOS_VULNERABILIDAD.includes(v as ModoVulnerabilidad);

const KEY = "arboles.modoV";
function cargar(): ModoVulnerabilidad {
  try { const v = localStorage.getItem(KEY); if (esModoV(v)) return v; } catch { /* sin almacenamiento */ }
  return MODO_POR_DEFECTO;
}

let actual: ModoVulnerabilidad = cargar();
const oyentes = new Set<() => void>();

export const modoVActual = () => actual;

export function guardarModoV(m: ModoVulnerabilidad): void {
  actual = m;
  try { localStorage.setItem(KEY, m); } catch { /* vale solo para esta sesion */ }
  oyentes.forEach(f => f());
}

/** Hook: las pantallas se vuelven a dibujar si cambia el metodo. */
export function useModoV(): ModoVulnerabilidad {
  return useSyncExternalStore(f => { oyentes.add(f); return () => { oyentes.delete(f); }; }, modoVActual);
}
