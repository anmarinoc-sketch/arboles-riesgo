import type { EvaluacionDB } from "../db/db";
import { aCSV } from "./csv";
import { catPorId } from "./filtros";
import { wgs84AOrigenNacional } from "./coordenadas";

/** Columnas de entrada: las mismas que lee la importacion. */
export const COLUMNAS_ENTRADA = [
  "codigo", "especie", "evaluador", "fecha", "zona", "lat", "lon", "dap", "cat_diametrica", "altura_m",
  "estado_general", "inclinacion_grados", "rama_diametro_cm", "rama_estado", "rama_altura_m", "raices",
  "personas", "vehiculos", "construcciones", "redes_aereas",
  "pendiente", "sitio_siembra", "observaciones",
  "familia", "habito", "madurez", "origen", "fustes", "diametro_copa_m", "fenologia", "estado_fitosanitario",
  "prioridad", "tomografia", "tratamiento_realizado", "interferencia", "recomendacion",
  "decision_final", "justificacion",
] as const;

/** Coordenadas planas MAGNA Origen Nacional (EPSG:9377). Salida; la importacion las acepta si faltan lat y lon. */
export const COLUMNAS_PLANAS = ["x_origen_nacional", "y_origen_nacional"] as const;

/** Columnas calculadas (solo salida; la importacion las ignora). */
export const COLUMNAS_RESULTADO = [
  "vo", "cr", "ra", "amenaza", "vulnerabilidad", "riesgo", "riesgo_pct", "categoria", "accion",
] as const;

const sn = (b: boolean | null) => (b === null ? "" : b ? "si" : "no");
/** Evita que Excel interprete texto del usuario como formula. */
const seguro = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s);

export function valoresEvaluacion(e: EvaluacionDB): Record<string, string | number> {
  const f = e.form, r = e.resultado;
  const cat = catPorId(e.categoriaId);
  const dec = f.decisionFinalId ? catPorId(f.decisionFinalId) : null;
  const plano = wgs84AOrigenNacional(f.lat, f.lon); // null fuera de Colombia
  return {
    codigo: seguro(f.codigo), especie: seguro(f.especie), evaluador: seguro(f.evaluador), fecha: f.fecha, zona: seguro(f.zona),
    lat: f.lat ?? "", lon: f.lon ?? "", x_origen_nacional: plano?.x ?? "", y_origen_nacional: plano?.y ?? "", dap: f.dap ?? "", cat_diametrica: f.catDiametrica ?? "",
    altura_m: f.alturaArbolM ?? "", estado_general: f.estadoGeneral ?? "",
    inclinacion_grados: f.inclinacionGrados ?? "", rama_diametro_cm: f.ramaDiametroCm ?? "",
    rama_estado: f.ramaEstado ?? "", rama_altura_m: f.ramaAlturaM ?? "", raices: f.raices ?? "",
    personas: sn(f.personas), vehiculos: sn(f.vehiculos), construcciones: sn(f.construcciones), redes_aereas: sn(f.redesAereas),
    pendiente: seguro(f.pendiente), sitio_siembra: seguro(f.sitioSiembra), observaciones: seguro(f.observaciones),
    familia: seguro(f.familia), habito: f.habito ?? "", madurez: f.madurez ?? "", origen: f.origen ?? "",
    fustes: f.fustes ?? "", diametro_copa_m: f.diametroCopaM ?? "", fenologia: f.fenologia ?? "",
    estado_fitosanitario: f.estadoFitosanitario ?? "", prioridad: f.prioridad ?? "", tomografia: sn(f.tomografia),
    tratamiento_realizado: f.tratamientoRealizado ?? "", interferencia: f.interferencia ?? "",
    recomendacion: seguro(f.recomendacion),
    decision_final: dec?.nombre ?? "", justificacion: seguro(f.justificacion),
    vo: round(r.Vo), cr: round(r.Cr), ra: r.Ra, amenaza: round(r.A), vulnerabilidad: r.V,
    riesgo: round(r.riesgo), riesgo_pct: Number(r.porcentaje.toFixed(1)), categoria: e.categoriaNombre,
    accion: cat?.accion ?? "",
  };
}
const round = (n: number) => Number(n.toFixed(4));

export function evaluacionesACSV(evals: EvaluacionDB[]): string {
  const cols = [...COLUMNAS_ENTRADA, ...COLUMNAS_PLANAS, ...COLUMNAS_RESULTADO];
  return aCSV([cols, ...evals.map(e => { const v = valoresEvaluacion(e); return cols.map(c => v[c]); })]);
}

const ejemplo: Record<string, string | number> = {
  codigo: "A-001", especie: "Eucalyptus spp.", evaluador: "Nombre Apellido", fecha: "2026-11-10", zona: "Parque ejemplo",
  lat: 6.1696, lon: -75.5833, dap: 45, cat_diametrica: "Fustal", altura_m: 22, estado_general: "regular-malo",
  inclinacion_grados: 20, rama_diametro_cm: 8, rama_estado: "malo", rama_altura_m: 6, raices: "bueno",
  personas: "si", vehiculos: "no", construcciones: "no", redes_aereas: "no", observaciones: "Ejemplo",
  familia: "Myrtaceae", habito: "Árbol", origen: "Introducida", prioridad: "Alta", tomografia: "no",
  recomendacion: "Poda de mantenimiento",
};

const plano0 = wgs84AOrigenNacional(Number(ejemplo.lat), Number(ejemplo.lon));
const valoresPlanos: Record<string, number | ""> = { x_origen_nacional: plano0?.x ?? "", y_origen_nacional: plano0?.y ?? "" };

/** Plantilla con una fila de ejemplo (los campos de inventario son opcionales). */
export function plantillaCSV(): string {
  return aCSV([
    [...COLUMNAS_ENTRADA, ...COLUMNAS_PLANAS],
    [...COLUMNAS_ENTRADA, ...COLUMNAS_PLANAS].map(c => ejemplo[c] ?? valoresPlanos[c] ?? ""),
  ]);
}

export interface FeatureCollection {
  type: "FeatureCollection";
  crs: { type: "name"; properties: { name: string } };
  features: {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, string | number>;
  }[];
}

/** GeoJSON en EPSG:4326, coordenadas [lon, lat]. Omite evaluaciones sin coordenadas. */
export function evaluacionesAGeoJSON(evals: EvaluacionDB[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::4326" } },
    features: evals
      .filter(e => e.form.lat !== null && e.form.lon !== null)
      .map(e => {
        const { lat, lon, ...props } = valoresEvaluacion(e);
        void lat; void lon;
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [e.form.lon!, e.form.lat!] as [number, number] },
          properties: { ...props, color: catPorId(e.categoriaId)?.color ?? "" },
        };
      }),
  };
}
