import type { Especie } from "../engine";
import { aCSV, parseCSV } from "./csv";
import { fracc } from "./util";

export const COLUMNAS_ESPECIES = ["cientifico", "comun", "sp_volcamiento", "sp_caida_ramas"] as const;

export function especiesACSV(especies: Especie[]): string {
  return aCSV([
    [...COLUMNAS_ESPECIES],
    ...especies.map(e => [e.cientifico, e.comun, fracc(e.spVolcamiento), fracc(e.spCaidaRamas)]),
  ]);
}

/** Acepta 1/3, 2/3 y 1, o sus decimales (0,33 / 0.67 / 1). Devuelve null si no es ninguno. */
export function leerSp(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "1/3") return 1 / 3;
  if (t === "2/3") return 2 / 3;
  const n = Number(t);
  if (t === "" || !Number.isFinite(n)) return null;
  for (const v of [1 / 3, 2 / 3, 1]) if (Math.abs(n - v) < 0.01) return v;
  return null;
}

const clave = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[\s\-]+/g, "_");

export interface LecturaEspecies {
  validas: Especie[];
  errores: { fila: number; mensaje: string }[];
  columnasFaltantes: string[];
}

/** Lee un CSV de especies. sp_* vacio => 2/3 (sin informacion). */
export function leerEspeciesCSV(texto: string): LecturaEspecies {
  const filas = parseCSV(texto);
  const cab = (filas[0] ?? []).map(clave);
  const columnasFaltantes = ["cientifico", "sp_volcamiento", "sp_caida_ramas"].filter(c => !cab.includes(c));
  if (columnasFaltantes.length) return { validas: [], errores: [], columnasFaltantes };
  const i = (c: string) => cab.indexOf(c);
  const validas: Especie[] = [], errores: { fila: number; mensaje: string }[] = [];
  const vistos = new Set<string>();
  filas.slice(1).forEach((r, k) => {
    const fila = k + 2;
    const cientifico = (r[i("cientifico")] ?? "").trim();
    if (!cientifico) return void errores.push({ fila, mensaje: "falta el nombre científico" });
    const sp = (col: string) => {
      const crudo = r[i(col)] ?? "";
      return crudo.trim() === "" ? 2 / 3 : leerSp(crudo);
    };
    const v = sp("sp_volcamiento"), c = sp("sp_caida_ramas");
    if (v === null) return void errores.push({ fila, mensaje: `${cientifico}: sp_volcamiento debe ser 1/3, 2/3 o 1` });
    if (c === null) return void errores.push({ fila, mensaje: `${cientifico}: sp_caida_ramas debe ser 1/3, 2/3 o 1` });
    const k2 = cientifico.toLowerCase();
    if (vistos.has(k2)) return void errores.push({ fila, mensaje: `${cientifico}: repetida en el archivo` });
    vistos.add(k2);
    validas.push({ cientifico, comun: i("comun") >= 0 ? (r[i("comun")] ?? "").trim() : "", spVolcamiento: v, spCaidaRamas: c });
  });
  return { validas, errores, columnasFaltantes: [] };
}
