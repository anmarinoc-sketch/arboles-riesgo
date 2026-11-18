import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { MODOS_VULNERABILIDAD, formVacio, type CategoriaConfig, type Especie, type ModoVulnerabilidad } from "../engine";
import type { EvaluacionDB, FotoDB } from "../db/db";

/**
 * Respaldo completo: un solo archivo ZIP con `respaldo.json` (evaluaciones, catalogo de especies y ajustes) y las
 * fotos originales en `fotos/`. Se puede restaurar en otro dispositivo. No incluye el token de sincronizacion.
 */
export const FORMATO = "arboles-en-riesgo";
export const VERSION_RESPALDO = 1;
const TIPOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export interface AjustesRespaldo {
  categorias: Pick<CategoriaConfig, "id" | "hasta" | "inclusivo" | "color" | "accion">[];
  modoV: ModoVulnerabilidad;
}

export interface Respaldo {
  formato: typeof FORMATO;
  version: number;
  creado: string; // ISO
  evaluaciones: Omit<EvaluacionDB, "id">[];
  fotos: { codigo: string; nombre: string; tipo: string; archivo: string }[];
  especies: Especie[];
  ajustes: AjustesRespaldo;
}

export interface DatosParaRespaldo {
  evaluaciones: EvaluacionDB[];
  fotos: FotoDB[];
  especies: Especie[];
  ajustes: AjustesRespaldo;
  ahora?: Date;
}

/** Arma el ZIP del respaldo. Las fotos van sin comprimir (ya son JPEG). */
export async function crearRespaldoZip(d: DatosParaRespaldo): Promise<Uint8Array> {
  const porId = new Map(d.evaluaciones.map(e => [e.id!, e]));
  const archivos: Record<string, Uint8Array> = {};
  const fotos: Respaldo["fotos"] = [];
  const contador = new Map<string, number>();
  for (const f of d.fotos) {
    const ev = porId.get(f.evaluacionId);
    const ext = TIPOS_FOTO[f.blob.type] ?? "jpg";
    if (!ev) continue; // foto huerfana
    const n = (contador.get(ev.codigo) ?? 0) + 1;
    contador.set(ev.codigo, n);
    const archivo = `fotos/${seguroParaArchivo(ev.codigo)}_${n}.${ext}`;
    archivos[archivo] = new Uint8Array(await f.blob.arrayBuffer());
    fotos.push({ codigo: ev.codigo, nombre: f.nombre, tipo: TIPOS_FOTO[f.blob.type] ? f.blob.type : "image/jpeg", archivo });
  }
  const respaldo: Respaldo = {
    formato: FORMATO, version: VERSION_RESPALDO, creado: (d.ahora ?? new Date()).toISOString(),
    evaluaciones: d.evaluaciones.map(({ id: _id, ...resto }) => resto),
    fotos,
    especies: d.especies.map(({ id: _id, ...resto }: Especie & { id?: number }) => resto),
    ajustes: d.ajustes,
  };
  archivos["respaldo.json"] = strToU8(JSON.stringify(respaldo));
  return zipSync(archivos, { level: 0 });
}

const seguroParaArchivo = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(0, 60) || "arbol";

export interface RespaldoLeido {
  respaldo: Respaldo;
  /** Bytes de cada foto, por la ruta que figura en respaldo.fotos. */
  archivos: Map<string, Uint8Array>;
  avisos: string[];
}

const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Lee y valida un respaldo. Lanza Error con un mensaje claro si no es un respaldo valido. */
export function leerRespaldoZip(bytes: Uint8Array): RespaldoLeido {
  let contenido: Record<string, Uint8Array>;
  try { contenido = unzipSync(bytes); } catch { throw new Error("El archivo no es un ZIP válido. Elige el respaldo que descargaste desde la app."); }
  const crudo = contenido["respaldo.json"];
  if (!crudo) throw new Error("El ZIP no trae «respaldo.json»: no es un respaldo de esta app.");
  let j: unknown;
  try { j = JSON.parse(strFromU8(crudo)); } catch { throw new Error("El respaldo está dañado (no se pudo leer respaldo.json)."); }
  if (!esObj(j) || j.formato !== FORMATO) throw new Error("Este archivo no es un respaldo de Árboles en Riesgo.");
  if (!esNum(j.version) || j.version > VERSION_RESPALDO)
    throw new Error("El respaldo es de una versión más nueva de la app. Actualiza la app e inténtalo de nuevo.");
  if (!Array.isArray(j.evaluaciones) || !Array.isArray(j.especies)) throw new Error("El respaldo está incompleto.");

  const avisos: string[] = [];
  const codigos = new Set<string>();
  const evaluaciones: Respaldo["evaluaciones"] = [];
  j.evaluaciones.forEach((e, i) => {
    const ok = esObj(e) && typeof e.codigo === "string" && e.codigo.trim() && esObj(e.form) && esObj(e.resultado) &&
      esNum((e.resultado as Record<string, unknown>).porcentaje) && typeof e.categoriaId === "string";
    if (!ok) return void avisos.push(`Evaluación ${i + 1}: datos incompletos, se omite.`);
    const ev = e as unknown as Respaldo["evaluaciones"][number];
    if (codigos.has(ev.codigo)) return void avisos.push(`Evaluación ${ev.codigo}: repetida en el respaldo, se usa la primera.`);
    codigos.add(ev.codigo);
    // se completan campos que una version anterior no tenia
    evaluaciones.push({ ...ev, form: { ...formVacio(), ...ev.form } });
  });

  const especies: Especie[] = [];
  for (const e of j.especies) {
    if (esObj(e) && typeof e.cientifico === "string" && e.cientifico.trim() && esNum(e.spVolcamiento) && esNum(e.spCaidaRamas))
      especies.push({ cientifico: e.cientifico, comun: typeof e.comun === "string" ? e.comun : "", spVolcamiento: e.spVolcamiento, spCaidaRamas: e.spCaidaRamas,
        ...(typeof e.categoriaAmenaza === "string" ? { categoriaAmenaza: e.categoriaAmenaza as Especie["categoriaAmenaza"] } : {}) });
  }

  const fotos: Respaldo["fotos"] = [];
  const archivos = new Map<string, Uint8Array>();
  for (const f of Array.isArray(j.fotos) ? j.fotos : []) {
    if (!esObj(f) || typeof f.archivo !== "string" || typeof f.codigo !== "string" || !codigos.has(f.codigo)) continue;
    const datos = contenido[f.archivo];
    const tipo = typeof f.tipo === "string" && f.tipo in TIPOS_FOTO ? f.tipo : "";
    if (!datos || !tipo) { avisos.push(`Foto ${String(f.archivo)}: falta o no es una imagen válida, se omite.`); continue; }
    fotos.push({ codigo: f.codigo, nombre: typeof f.nombre === "string" ? f.nombre : f.archivo, tipo, archivo: f.archivo });
    archivos.set(f.archivo, datos);
  }

  const aj = esObj(j.ajustes) ? j.ajustes : {};
  const categorias = Array.isArray(aj.categorias) ? (aj.categorias as unknown[]).filter(esObj).map(c => ({
    id: String(c.id), hasta: c.hasta === null ? null : Number(c.hasta), inclusivo: Boolean(c.inclusivo), color: String(c.color), accion: String(c.accion),
  })) : [];
  const modoV = MODOS_VULNERABILIDAD.includes(aj.modoV as ModoVulnerabilidad) ? (aj.modoV as ModoVulnerabilidad) : "al-menos-uno";

  return {
    respaldo: { formato: FORMATO, version: j.version, creado: typeof j.creado === "string" ? j.creado : "", evaluaciones, fotos, especies, ajustes: { categorias, modoV } },
    archivos, avisos,
  };
}

/** Que pasaria al restaurar: cuantas se agregan, cuantas ya existen y cuantas se reemplazarian. */
export function resumenRestauracion(r: Respaldo, codigosExistentes: Set<string>, reemplazar: boolean) {
  const yaExisten = r.evaluaciones.filter(e => codigosExistentes.has(e.codigo)).length;
  const nuevas = r.evaluaciones.length - yaExisten;
  return { nuevas, yaExisten, aplicadas: nuevas + (reemplazar ? yaExisten : 0), omitidas: reemplazar ? 0 : yaExisten };
}

/** Nombre del archivo de respaldo, p. ej. arboles-respaldo-2026-11-18.zip */
export const nombreRespaldo = (d = new Date()) => `arboles-respaldo-${d.toISOString().slice(0, 10)}.zip`;
