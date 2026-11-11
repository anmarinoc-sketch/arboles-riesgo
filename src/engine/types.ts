/** Variable categórica: solo 1/3, 2/3 o 1 (se valida en validacion.ts). */
export type Cat3 = number;
export const CAT3_VALORES = [1 / 3, 2 / 3, 1] as const;
export type Dico = 0 | 1;

/**
 * Como se obtiene la vulnerabilidad V a partir de los cuatro elementos expuestos (P, Ve, C, Re):
 * - "al-menos-uno": V = 1 si hay al menos uno, si no 0 (numeral 3.7 del Plan Maestro de Envigado).
 * - "promedio": V = (P + Ve + C + Re) / 4 (variante usada en otros informes, p. ej. el anexo del Consorcio Linar 2025).
 */
export type ModoVulnerabilidad = "al-menos-uno" | "promedio";
export const MODOS_VULNERABILIDAD: ModoVulnerabilidad[] = ["al-menos-uno", "promedio"];

export interface Volcamiento {
  alturaArbolM: number;       // T: <10 => 1/3; 10-20 => 2/3; >20 => 1
  spVolcamiento: Cat3;        // Sp
  estadoGeneralMalo: boolean; // Eg: regular o malo => 1
  inclinacionGrados: number;  // I: >30 => 1
}

export interface CaidaRamas {
  diametroRamaCm: number; // T: >5 => 1
  spCaidaRamas: Cat3;     // Sp
  ramaMalEstado: boolean; // Eg
  alturaRamaM: number;    // H: >5 => 1
}

export interface Vulnerabilidad {
  personas: boolean;
  vehiculos: boolean;
  construcciones: boolean;
  redesAereas: boolean;
}

export interface EntradaRiesgo {
  volcamiento: Volcamiento;
  caidaRamas: CaidaRamas;
  raicesMalEstado: boolean;
  vulnerabilidad: Vulnerabilidad;
}

export interface ResultadoRiesgo {
  Vo: number; Cr: number; Ra: number; A: number; V: number;
  riesgo: number;     // proporcion 0-1
  porcentaje: number; // 0-100
}

export interface CategoriaConfig {
  id: string; nombre: string; hasta: number | null; inclusivo: boolean;
  color: string; accion: string;
}
