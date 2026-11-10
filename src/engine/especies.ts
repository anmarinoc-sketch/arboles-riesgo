import type { Cat3 } from "./types";

export interface Especie {
  cientifico: string; comun: string;
  spVolcamiento: Cat3; spCaidaRamas: Cat3;
}

export const SIN_INFORMACION: Cat3 = 2 / 3;

/** Normaliza para comparar: minusculas, sin espacios extra y "sp."/"spp." equivalentes. */
const norm = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ").replace(/\bspp?\.?$/, "sp");

/** Especie ausente o "Indeterminado" => 2/3 en ambos factores (3.7.3). */
export function resolverSp(nombre: string, catalogo: Especie[]): { spVolcamiento: Cat3; spCaidaRamas: Cat3 } {
  const n = norm(nombre);
  if (!n || n === "indeterminado") return { spVolcamiento: SIN_INFORMACION, spCaidaRamas: SIN_INFORMACION };
  const e = catalogo.find(x => norm(x.cientifico) === n);
  return e
    ? { spVolcamiento: e.spVolcamiento, spCaidaRamas: e.spCaidaRamas }
    : { spVolcamiento: SIN_INFORMACION, spCaidaRamas: SIN_INFORMACION };
}
