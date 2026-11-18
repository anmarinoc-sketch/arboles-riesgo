import type { EntradaRiesgo } from "./types";
import { resolverSp, type Especie } from "./especies";

export const CATEGORIAS_DIAMETRICAS = ["Brinzal", "Latizal", "Fustal"] as const;
export type CategoriaDiametrica = (typeof CATEGORIAS_DIAMETRICAS)[number];
export type Estado = "bueno" | "malo";

/**
 * Campos de inventario (opcionales, NO entran al calculo del riesgo). Siguen las variables de las fichas
 * tecnicas de registro de individuos arboreos: habito, madurez, origen, fustes, fenologia, estado
 * fitosanitario y estructural, prioridad de intervencion, tomografia, tratamiento e interferencia.
 */
export const OPCIONES_INVENTARIO = {
  habito: ["Árbol", "Palma"],
  madurez: ["Juvenil", "Adulto"],
  origen: ["Nativa", "Introducida"],
  fustes: ["Tallo único", "Bifurcado", "Múltiples tallos"],
  fenologia: ["Vegetativo", "Florecido", "Fructificado"],
  estadoFitosanitario: ["Bueno", "Regular", "Deficiente"],
  prioridad: ["Alta", "Media", "Baja"],
  tratamientoRealizado: ["Ninguno", "Drench", "Endoterapia", "Drench y endoterapia"],
  interferencia: ["Ninguna", "Redes", "Mobiliario", "Redes y mobiliario"],
} as const;
/**
 * Señales de alerta que se pueden marcar en campo (informes tecnicos de visita y fichas de inventario). Ayudan a
 * decidir el estado general y a redactar el diagnostico; no entran al calculo.
 */
export const SENALES_ALERTA = [
  "Inclinación pronunciada del fuste",
  "Grietas en la base del suelo",
  "Raíces levantadas, cortadas o expuestas",
  "Cuello del árbol tapado por sustrato",
  "Hongos",
  "Cavidades, pudrición o huecos en el tronco",
  "Ramas o frondas secas, quebradas o muertas",
  "Hojas o frondas faltantes",
  "Corteza pelada",
  "Manchas hinchadas o protuberancias",
  "Hojas descoloridas",
  "Abundancia de líquenes o epífitas",
  "Podas inadecuadas",
  "Plantas o amarres artificiales sobre el fuste",
] as const;

/** Señales que apuntan a un problema estructural o sanitario real (no solo de manejo): si hay alguna, el estado general rara vez es «bueno». */
export const SENALES_DANO: readonly string[] = [
  "Inclinación pronunciada del fuste", "Grietas en la base del suelo", "Raíces levantadas, cortadas o expuestas", "Hongos",
  "Cavidades, pudrición o huecos en el tronco", "Ramas o frondas secas, quebradas o muertas", "Corteza pelada",
  "Manchas hinchadas o protuberancias",
];

/** Intervenciones frecuentes para agregar con un toque a «tratamiento recomendado». */
export const RECOMENDACIONES_RAPIDAS = [
  "Poda de mantenimiento (fitosanitaria: ramas quebradas, secas o enfermas)",
  "Poda de control de ramas o frondas a menos de 2 o 3 m de la construcción",
  "Retiro de hojas secas",
  "Destapar el cuello del árbol",
  "Limpieza de líquenes y epífitas",
  "Control fitosanitario",
  "Control nutricional",
  "Seguimiento y monitoreo periódico",
  "Malla de protección contra caída de ramas",
  "Apuntalamiento",
  "Trasplante (requiere permiso de la autoridad ambiental)",
  "Tala (requiere permiso y compensación)",
] as const;

/** Sitios de siembra frecuentes (sugerencias; el campo es de texto libre). */
export const SITIOS_SIEMBRA = [
  "Andén", "Separador vial", "Antejardín", "Parque o zona verde", "Talud",
  "Terraza o estructura artificial (muro de piedra, contención)", "Jardinera o alcorque", "Ronda hídrica",
] as const;

export type CampoEnumerado = keyof typeof OPCIONES_INVENTARIO;
export const CAMPOS_ENUMERADOS = Object.keys(OPCIONES_INVENTARIO) as CampoEnumerado[];

/** Valores del formulario. null = sin responder (no se asume ningun valor por defecto). */
export interface FormEvaluacion {
  codigo: string;
  especie: string;
  evaluador: string;
  fecha: string; // AAAA-MM-DD
  zona: string; // opcional: municipio, barrio, proyecto... (texto libre, no entra al calculo)
  solicitud: string; // opcional: expediente, solicitud o tramite que origina la visita
  predio: string; // opcional: nombre del predio, matricula inmobiliaria o NPN
  lat: number | null;
  lon: number | null;
  altitudM: number | null; // opcional (la toma el GPS)
  dap: number | null; // cm
  catDiametrica: CategoriaDiametrica | null;
  alturaArbolM: number | null;
  estadoGeneral: "bueno" | "regular-malo" | null; // Eg del arbol
  inclinacionGrados: number | null;
  ramaDiametroCm: number | null;
  ramaEstado: Estado | null;
  ramaAlturaM: number | null;
  raices: Estado | null;
  personas: boolean | null;
  vehiculos: boolean | null;
  construcciones: boolean | null;
  redesAereas: boolean | null;
  // Descriptivos: NO entran al calculo (3.7.5)
  pendiente: string;
  sitioSiembra: string;
  observaciones: string; // diagnostico / observaciones
  // Inventario (opcional, tampoco entra al calculo)
  familia: string;
  habito: (typeof OPCIONES_INVENTARIO.habito)[number] | null;
  madurez: (typeof OPCIONES_INVENTARIO.madurez)[number] | null;
  origen: (typeof OPCIONES_INVENTARIO.origen)[number] | null;
  fustes: (typeof OPCIONES_INVENTARIO.fustes)[number] | null;
  diametroCopaM: number | null;
  fenologia: (typeof OPCIONES_INVENTARIO.fenologia)[number] | null;
  estadoFitosanitario: (typeof OPCIONES_INVENTARIO.estadoFitosanitario)[number] | null;
  prioridad: (typeof OPCIONES_INVENTARIO.prioridad)[number] | null;
  tomografia: boolean | null;
  tratamientoRealizado: (typeof OPCIONES_INVENTARIO.tratamientoRealizado)[number] | null;
  interferencia: (typeof OPCIONES_INVENTARIO.interferencia)[number] | null;
  recomendacion: string; // tratamiento / intervencion recomendada
  senales: string[]; // senales de alerta observadas (SENALES_ALERTA)
  distanciaConstruccionM: number | null; // del fuste a la construccion mas cercana (no entra al calculo)
  // Decision del tecnico (opcional)
  decisionFinalId: string | null;
  justificacion: string;
}

export function formVacio(hoy = new Date().toISOString().slice(0, 10)): FormEvaluacion {
  return {
    codigo: "", especie: "", evaluador: "", fecha: hoy, zona: "", solicitud: "", predio: "", lat: null, lon: null, altitudM: null, dap: null,
    catDiametrica: null, alturaArbolM: null, estadoGeneral: null, inclinacionGrados: null,
    ramaDiametroCm: null, ramaEstado: null, ramaAlturaM: null, raices: null,
    personas: null, vehiculos: null, construcciones: null, redesAereas: null,
    pendiente: "", sitioSiembra: "", observaciones: "",
    familia: "", habito: null, madurez: null, origen: null, fustes: null, diametroCopaM: null, fenologia: null,
    estadoFitosanitario: null, prioridad: null, tomografia: null, tratamientoRealizado: null, interferencia: null,
    recomendacion: "", senales: [], distanciaConstruccionM: null,
    decisionFinalId: null, justificacion: "",
  };
}

export type Errores = Partial<Record<keyof FormEvaluacion, string>>;

const REQ = "Obligatorio";
const nulo = (v: unknown) => v === null || v === undefined || v === "";
const noNeg = (v: number | null) => v !== null && Number.isFinite(v) && v >= 0;

/** Valida el formulario. `categoriaCalculadaId` es la categoria que arroja el modelo. */
export function validarForm(f: FormEvaluacion, categoriaCalculadaId?: string): Errores {
  const e: Errores = {};
  if (!f.codigo.trim()) e.codigo = REQ;
  if (!f.especie.trim()) e.especie = "Escribe la especie (o «Indeterminado»)";
  if (!f.evaluador.trim()) e.evaluador = REQ;
  if (!f.fecha) e.fecha = REQ;

  if (nulo(f.lat)) e.lat = "Falta la latitud";
  else if (f.lat! < -90 || f.lat! > 90) e.lat = "Latitud entre -90 y 90";
  if (nulo(f.lon)) e.lon = "Falta la longitud";
  else if (f.lon! < -180 || f.lon! > 180) e.lon = "Longitud entre -180 y 180";

  if (nulo(f.dap)) e.dap = REQ;
  else if (!(f.dap! > 0)) e.dap = "Debe ser mayor que 0";
  if (!f.catDiametrica) e.catDiametrica = REQ;

  if (nulo(f.alturaArbolM)) e.alturaArbolM = REQ;
  else if (!noNeg(f.alturaArbolM)) e.alturaArbolM = "No puede ser negativa";
  if (!f.estadoGeneral) e.estadoGeneral = REQ;
  if (nulo(f.inclinacionGrados)) e.inclinacionGrados = REQ;
  else if (f.inclinacionGrados! < 0 || f.inclinacionGrados! > 90) e.inclinacionGrados = "Entre 0° y 90°";

  if (nulo(f.ramaDiametroCm)) e.ramaDiametroCm = REQ;
  else if (!noNeg(f.ramaDiametroCm)) e.ramaDiametroCm = "No puede ser negativo";
  if (!f.ramaEstado) e.ramaEstado = REQ;
  if (nulo(f.ramaAlturaM)) e.ramaAlturaM = REQ;
  else if (!noNeg(f.ramaAlturaM)) e.ramaAlturaM = "No puede ser negativa";

  if (!f.raices) e.raices = REQ;
  for (const k of ["personas", "vehiculos", "construcciones", "redesAereas"] as const)
    if (f[k] === null) e[k] = REQ;

  if (f.diametroCopaM !== null && !noNeg(f.diametroCopaM)) e.diametroCopaM = "No puede ser negativo";
  if (f.distanciaConstruccionM !== null && !noNeg(f.distanciaConstruccionM)) e.distanciaConstruccionM = "No puede ser negativa";
  if (f.decisionFinalId && categoriaCalculadaId && f.decisionFinalId !== categoriaCalculadaId && !f.justificacion.trim())
    e.justificacion = "Justifica por qué la decisión final difiere del cálculo";
  return e;
}

/** Convierte el formulario a la entrada del motor; null si falta alguna variable de calculo. */
export function aEntrada(f: FormEvaluacion, catalogo: Especie[]): EntradaRiesgo | null {
  if (
    f.alturaArbolM === null || f.estadoGeneral === null || f.inclinacionGrados === null ||
    f.ramaDiametroCm === null || f.ramaEstado === null || f.ramaAlturaM === null || f.raices === null ||
    f.personas === null || f.vehiculos === null || f.construcciones === null || f.redesAereas === null
  ) return null;
  const sp = resolverSp(f.especie, catalogo);
  return {
    volcamiento: {
      alturaArbolM: f.alturaArbolM, spVolcamiento: sp.spVolcamiento,
      estadoGeneralMalo: f.estadoGeneral === "regular-malo", inclinacionGrados: f.inclinacionGrados,
    },
    caidaRamas: {
      diametroRamaCm: f.ramaDiametroCm, spCaidaRamas: sp.spCaidaRamas,
      ramaMalEstado: f.ramaEstado === "malo", alturaRamaM: f.ramaAlturaM,
    },
    raicesMalEstado: f.raices === "malo",
    vulnerabilidad: {
      personas: f.personas, vehiculos: f.vehiculos, construcciones: f.construcciones, redesAereas: f.redesAereas,
    },
  };
}
