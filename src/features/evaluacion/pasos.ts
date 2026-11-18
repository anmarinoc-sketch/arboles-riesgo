import type { Errores } from "../../engine";

export const PASOS = [
  { n: 1, nombre: "Datos" },
  { n: 2, nombre: "Ubicación" },
  { n: 3, nombre: "Riesgo" },
  { n: 4, nombre: "Evidencia" },
] as const;

/** En que paso del formulario esta cada campo que puede tener error. */
export const PASO_DEL_CAMPO: Record<string, number> = {
  codigo: 1, especie: 1, evaluador: 1, fecha: 1, dap: 1, catDiametrica: 1, alturaArbolM: 1, distanciaConstruccionM: 1,
  lat: 2, lon: 2,
  estadoGeneral: 3, inclinacionGrados: 3, ramaDiametroCm: 3, ramaEstado: 3, ramaAlturaM: 3, raices: 3,
  personas: 3, vehiculos: 3, construcciones: 3, redesAereas: 3,
  diametroCopaM: 4, decisionFinalId: 4, justificacion: 4,
};

/** Pasos que tienen al menos un error. */
export function pasosConError(errores: Errores): number[] {
  const s = new Set<number>();
  for (const k of Object.keys(errores)) s.add(PASO_DEL_CAMPO[k] ?? 4);
  return [...s].sort((a, b) => a - b);
}

/** Primer paso con error (para llevar a la persona ahi al intentar guardar), o null si no hay. */
export const primerPasoConError = (errores: Errores): number | null => pasosConError(errores)[0] ?? null;
