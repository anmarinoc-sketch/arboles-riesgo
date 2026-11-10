import type { EntradaRiesgo, ResultadoRiesgo, Dico } from "./types";

/** Limites de las variables (numeral 3.7.3). El documento no define los bordes
 *  exactos (p. ej. rama de 5 cm justos); se fijan aqui en un unico lugar. */
export const LIMITES = {
  arbolBajoM: 10,        // <10 => 1/3
  arbolAltoM: 20,        // >20 => 1 ; 10..20 (inclusive) => 2/3
  inclinacionGrados: 30, // >30 => 1
  ramaDiametroCm: 5,     // >5 => 1 (5 exacto => 0)
  ramaAlturaM: 5,        // >5 => 1 (5 exacto => 0)
} as const;

const b = (x: boolean): Dico => (x ? 1 : 0);

export function tamanoArbol(alturaM: number): number {
  if (alturaM < LIMITES.arbolBajoM) return 1 / 3;
  if (alturaM <= LIMITES.arbolAltoM) return 2 / 3;
  return 1;
}

export function calcularRiesgo(e: EntradaRiesgo): ResultadoRiesgo {
  const v = e.volcamiento, c = e.caidaRamas;
  const Vo = (tamanoArbol(v.alturaArbolM) + v.spVolcamiento + b(v.estadoGeneralMalo) +
    b(v.inclinacionGrados > LIMITES.inclinacionGrados)) / 4;
  const Cr = (b(c.diametroRamaCm > LIMITES.ramaDiametroCm) + c.spCaidaRamas + b(c.ramaMalEstado) +
    b(c.alturaRamaM > LIMITES.ramaAlturaM)) / 4;
  const Ra = b(e.raicesMalEstado);
  const A = (Vo + Cr + Ra) / 3;
  const vu = e.vulnerabilidad;
  const V = b(vu.personas || vu.vehiculos || vu.construcciones || vu.redesAereas);
  const riesgo = A * V;
  return { Vo, Cr, Ra, A, V, riesgo, porcentaje: riesgo * 100 };
}
