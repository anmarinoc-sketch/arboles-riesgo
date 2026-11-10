/** Variable categórica: solo 1/3, 2/3 o 1 (se valida en validacion.ts). */
export type Cat3 = number;
export const CAT3_VALORES = [1 / 3, 2 / 3, 1] as const;
export type Dico = 0 | 1;

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
  Vo: number; Cr: number; Ra: number; A: number; V: Dico;
  riesgo: number;     // proporcion 0-1
  porcentaje: number; // 0-100
}

export interface CategoriaConfig {
  id: string; nombre: string; hasta: number | null; inclusivo: boolean;
  color: string; accion: string;
}
