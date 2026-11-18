import { fmt } from "./util";

/**
 * Equivalencia entre pendiente en porcentaje y en grados (% = tan(grados) x 100). Entiende «32,2°», «32 grados»
 * y «62.8 %». Sin unidad no se puede saber cual es, asi que devuelve null.
 */
export function pendienteEquivalente(texto: string): string | null {
  const m = texto.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(%|°|º|grados?|deg)$/i);
  if (!m) return null;
  const v = Number(m[1].replace(",", "."));
  if (!Number.isFinite(v) || v < 0) return null;
  if (m[2] === "%") return `${fmt(v, 1)} % ≈ ${fmt((Math.atan(v / 100) * 180) / Math.PI, 1)}°`;
  if (v >= 90) return null;
  return `${fmt(v, 1)}° ≈ ${fmt(Math.tan((v * Math.PI) / 180) * 100, 1)} %`;
}

/** Agrega una recomendacion al texto sin repetirla. */
export function agregarRecomendacion(texto: string, item: string): string {
  const t = texto.trim();
  if (t.toLowerCase().includes(item.toLowerCase())) return texto;
  return t ? `${t.replace(/[.;,]\s*$/, "")}. ${item}` : item;
}

/** Quita una recomendacion agregada con agregarRecomendacion. */
export function quitarRecomendacion(texto: string, item: string): string {
  const i = texto.toLowerCase().indexOf(item.toLowerCase());
  if (i < 0) return texto;
  const resto = (texto.slice(0, i) + texto.slice(i + item.length)).replace(/^\s*[.;,]\s*/, "").replace(/\s*\.\s*\.\s*/g, ". ");
  return resto.replace(/[.;,]\s*$/, "").trim();
}

/** Si la construccion queda a una distancia menor que la altura del arbol, esta dentro de su alcance de caida. */
export const construccionEnAlcance = (distanciaM: number | null, alturaM: number | null) =>
  distanciaM !== null && alturaM !== null && distanciaM < alturaM;
