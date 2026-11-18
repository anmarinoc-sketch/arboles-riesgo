import type { Cat3 } from "./types";

/** Categorias de amenaza (UICN y listados nacionales, p. ej. la Resolucion 0126 de 2024 del MADS en Colombia). */
export const CATEGORIAS_AMENAZA = [
  { id: "CR", nombre: "En Peligro Crítico (CR)" },
  { id: "EN", nombre: "En Peligro (EN)" },
  { id: "VU", nombre: "Vulnerable (VU)" },
  { id: "NT", nombre: "Casi Amenazada (NT)" },
  { id: "LC", nombre: "Preocupación Menor (LC)" },
  { id: "DD", nombre: "Datos Insuficientes (DD)" },
] as const;
export type CategoriaAmenaza = (typeof CATEGORIAS_AMENAZA)[number]["id"];
export const nombreAmenaza = (id?: string | null) => CATEGORIAS_AMENAZA.find(c => c.id === id)?.nombre ?? "";
/** CR, EN y VU son las categorias de especies amenazadas. */
export const esAmenazada = (id?: string | null) => id === "CR" || id === "EN" || id === "VU";

export interface Especie {
  cientifico: string; comun: string;
  spVolcamiento: Cat3; spCaidaRamas: Cat3;
  /** Opcional: no entra al calculo; sirve para avisar que la tala o el trasplante requieren permiso. */
  categoriaAmenaza?: CategoriaAmenaza;
}

export const SIN_INFORMACION: Cat3 = 2 / 3;

/** Normaliza para comparar: minusculas, sin espacios extra y "sp."/"spp." equivalentes. */
const norm = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ").replace(/\bspp?\.?$/, "sp");

/** Busca una especie del catalogo por nombre cientifico (sin distinguir mayusculas; sp. = spp.). */
export function buscarEspecie(nombre: string, catalogo: Especie[]): Especie | undefined {
  const n = norm(nombre);
  return n ? catalogo.find(x => norm(x.cientifico) === n) : undefined;
}

/** Especie ausente o "Indeterminado" => 2/3 en ambos factores (3.7.3). */
export function resolverSp(nombre: string, catalogo: Especie[]): { spVolcamiento: Cat3; spCaidaRamas: Cat3 } {
  const n = norm(nombre);
  if (!n || n === "indeterminado") return { spVolcamiento: SIN_INFORMACION, spCaidaRamas: SIN_INFORMACION };
  const e = catalogo.find(x => norm(x.cientifico) === n);
  return e
    ? { spVolcamiento: e.spVolcamiento, spCaidaRamas: e.spCaidaRamas }
    : { spVolcamiento: SIN_INFORMACION, spCaidaRamas: SIN_INFORMACION };
}
