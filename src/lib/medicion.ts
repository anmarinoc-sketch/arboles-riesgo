/**
 * Cálculos de apoyo para medir en campo (no entran al cálculo del riesgo: solo ayudan a obtener
 * bien los datos de entrada). Todo puro y sin dependencias para poder probarlo.
 */

export interface Gravedad { x: number; y: number; z: number }

const GRADOS = 180 / Math.PI;
const RAD = Math.PI / 180;

/** Redondea a n decimales. */
export const redondear = (v: number, n = 1) => Math.round(v * 10 ** n) / 10 ** n;

/**
 * Inclinación respecto a la vertical del eje largo del celular (0° = derecho, 90° = acostado).
 * El celular va de canto contra el fuste. Da igual hacia dónde se incline, y no depende del signo del sensor.
 */
export function anguloDesdeVertical(g: Gravedad): number {
  const total = Math.hypot(g.x, g.y, g.z);
  if (total < 1e-6) return NaN;
  return Math.acos(Math.min(1, Math.abs(g.y) / total)) * GRADOS;
}

/**
 * Ángulo de elevación de la cámara trasera sobre el horizonte, con el celular casi vertical
 * (positivo hacia arriba, negativo hacia abajo). El signo se normaliza con el de «y», así que sirve
 * aunque el sistema entregue el sensor con la convención invertida.
 */
export function elevacionCamara(g: Gravedad): number {
  const s = g.y < 0 ? -1 : 1;
  return Math.atan2(g.z * s, Math.abs(g.y)) * GRADOS;
}

/**
 * Altura entre dos puntos vistos desde una misma distancia horizontal, con ángulos de elevación con signo
 * (hacia arriba positivo). Para la altura total: cima = a la copa y base = al pie del fuste (negativo).
 * No necesita saber a qué altura está el ojo.
 */
export function alturaPorAngulos(distanciaM: number, elevacionArribaDeg: number, elevacionAbajoDeg: number): number {
  // Cerca de la vertical la tangente se dispara y la lectura no sirve: se pide alejarse más
  if (Math.abs(elevacionArribaDeg) > 80 || Math.abs(elevacionAbajoDeg) > 80) return NaN;
  const h = distanciaM * (Math.tan(elevacionArribaDeg * RAD) - Math.tan(elevacionAbajoDeg * RAD));
  return Number.isFinite(h) && h > 0 ? h : NaN;
}

/** Inclinación (°) a partir de cuánto se separa el fuste de una plomada, medido a una altura dada (por defecto 1 m). */
export function inclinacionPorPlomada(separacionCm: number, alturaMedidaCm = 100): number {
  if (!(alturaMedidaCm > 0) || !(separacionCm >= 0)) return NaN;
  return Math.atan(separacionCm / alturaMedidaCm) * GRADOS;
}

/** Separación (cm) de la plomada que corresponde a un ángulo, a la altura dada. */
export const separacionParaAngulo = (grados: number, alturaMedidaCm = 100) => Math.tan(grados * RAD) * alturaMedidaCm;

/** Metros recorridos con pasos de largo conocido. */
export const distanciaPorPasos = (pasos: number, largoPasoM: number) => pasos * largoPasoM;

/** Largo medio de un paso normal (m) a partir de una distancia conocida recorrida con N pasos. */
export const largoDePaso = (distanciaM: number, pasos: number) => (pasos > 0 ? distanciaM / pasos : NaN);

/** Diámetro (cm) a partir de la circunferencia medida con cinta o cuerda (cm). */
export const diametroDesdeCircunferencia = (circunferenciaCm: number) => circunferenciaCm / Math.PI;

/** Mediana de una lista (para promediar varias lecturas del sensor sin que pese un salto). */
export function mediana(v: number[]): number {
  const a = v.filter(Number.isFinite).sort((p, q) => p - q);
  if (!a.length) return NaN;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Largo de paso por defecto para quien aún no lo ha calibrado (adulto, paso normal). */
export const LARGO_PASO_DEFECTO_M = 0.75;
