import {
  CAMPOS_ENUMERADOS, CATEGORIAS_DIAMETRICAS, OPCIONES_INVENTARIO, aEntrada, calcularRiesgo, formVacio, validarForm,
  type Especie, type FormEvaluacion,
} from "../engine";
import { COLUMNAS_ENTRADA } from "./exportar";
import { origenNacionalAWgs84 } from "./coordenadas";
import { parseCSV } from "./csv";
import { categoriasActivas, categorizarActual } from "./categorias";

export interface FilaImportada {
  fila: number; // numero de fila en el archivo (la 1 es el encabezado)
  form: FormEvaluacion;
  errores: string[];
}

export interface LecturaCSV {
  filas: FilaImportada[];
  columnasFaltantes: string[];
}

/** Columnas que pueden venir vacias. */
const OPCIONALES = new Set([
  "zona", "pendiente", "sitio_siembra", "observaciones", "decision_final", "justificacion", "familia", "habito", "madurez",
  "origen", "fustes", "diametro_copa_m", "fenologia", "estado_fitosanitario", "prioridad", "tomografia",
  "tratamiento_realizado", "interferencia", "recomendacion",
]);

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = (s: string) => sinTildes(s).trim().toLowerCase().replace(/[\s\-]+/g, "_");
const valor = (s: string) => sinTildes(s).trim().toLowerCase();
const desescapar = (s: string) => s.replace(/^'(?=[=+\-@])/, "");

const NOMBRE_CAMPO: Record<string, string> = {
  lat: "latitud", lon: "longitud", dap: "DAP", cat_diametrica: "categoría diamétrica", altura_m: "altura",
  estado_general: "estado general", inclinacion_grados: "inclinación", rama_diametro_cm: "diámetro de la rama",
  rama_estado: "estado de la rama", rama_altura_m: "altura de la rama", raices: "raíces",
  redes_aereas: "redes aéreas", x_origen_nacional: "coordenada X", y_origen_nacional: "coordenada Y", diametro_copa_m: "diámetro de copa", tomografia: "tomografía",
  estado_fitosanitario: "estado fitosanitario", tratamiento_realizado: "tratamiento realizado",
  habito: "hábito",
};

/** Columna del CSV de cada campo enumerado del inventario. */
const COLUMNA_ENUM: Record<(typeof CAMPOS_ENUMERADOS)[number], string> = {
  habito: "habito", madurez: "madurez", origen: "origen", fustes: "fustes", fenologia: "fenologia",
  estadoFitosanitario: "estado_fitosanitario", prioridad: "prioridad",
  tratamientoRealizado: "tratamiento_realizado", interferencia: "interferencia",
};

const FORM_A_COLUMNA: Record<string, string> = {
  codigo: "codigo", especie: "especie", evaluador: "evaluador", fecha: "fecha", lat: "lat", lon: "lon", dap: "dap",
  catDiametrica: "cat_diametrica", alturaArbolM: "altura_m", estadoGeneral: "estado_general",
  inclinacionGrados: "inclinacion_grados", ramaDiametroCm: "rama_diametro_cm", ramaEstado: "rama_estado",
  ramaAlturaM: "rama_altura_m", raices: "raices", personas: "personas", vehiculos: "vehiculos",
  construcciones: "construcciones", redesAereas: "redes_aereas", justificacion: "justificacion",
  diametroCopaM: "diametro_copa_m",
};

function num(s: string, err: string[], col: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) { err.push(`${NOMBRE_CAMPO[col] ?? col}: «${t}» no es un número`); return null; }
  return n;
}
function sino(s: string, err: string[], col: string): boolean | null {
  const v = valor(s);
  if (v === "") return null;
  if (["si", "s", "1", "true", "x", "yes", "y", "presente"].includes(v)) return true;
  if (["no", "n", "0", "false", "ausente"].includes(v)) return false;
  err.push(`${NOMBRE_CAMPO[col] ?? col}: «${s.trim()}» debe ser sí o no`);
  return null;
}
function estado<T extends string>(s: string, validos: Record<string, T>, err: string[], col: string): T | null {
  const v = valor(s).replace(/[\s_]+/g, "-");
  if (v === "") return null;
  if (v in validos) return validos[v];
  err.push(`${NOMBRE_CAMPO[col] ?? col}: «${s.trim()}» no es un valor válido`);
  return null;
}

/** Lee un CSV (el de exportar o la plantilla) y valida cada fila con las mismas reglas del formulario. */
export function leerCSV(texto: string, codigosExistentes: Set<string> = new Set(), catalogo?: Especie[]): LecturaCSV {
  const filas = parseCSV(texto);
  if (filas.length === 0) return { filas: [], columnasFaltantes: [...COLUMNAS_ENTRADA].filter(c => !OPCIONALES.has(c)) };
  const cab = filas[0].map(clave);
  const idx = (c: string) => cab.indexOf(c);
  // Se puede traer la ubicacion en lat/lon (WGS84) o en X/Y planas (MAGNA Origen Nacional)
  const hayPlanas = idx("x_origen_nacional") >= 0 && idx("y_origen_nacional") >= 0;
  const columnasFaltantes = COLUMNAS_ENTRADA.filter(
    c => !OPCIONALES.has(c) && idx(c) < 0 && !(hayPlanas && (c === "lat" || c === "lon")));
  if (columnasFaltantes.length) return { filas: [], columnasFaltantes };

  const vistos = new Set<string>();
  const out: FilaImportada[] = filas.slice(1).map((r, i) => {
    const g = (c: string) => (idx(c) >= 0 ? (r[idx(c)] ?? "") : "");
    const err: string[] = [];
    const f = formVacio();
    f.codigo = desescapar(g("codigo")).trim();
    f.especie = desescapar(g("especie")).trim();
    f.evaluador = desescapar(g("evaluador")).trim();
    f.fecha = g("fecha").trim();
    f.zona = desescapar(g("zona")).trim();
    f.lat = num(g("lat"), err, "lat"); f.lon = num(g("lon"), err, "lon");
    if (f.lat === null && f.lon === null && hayPlanas) {
      const x = num(g("x_origen_nacional"), err, "x_origen_nacional"), y = num(g("y_origen_nacional"), err, "y_origen_nacional");
      if (x !== null && y !== null) {
        const p = origenNacionalAWgs84(x, y);
        if (p) { f.lat = p.lat; f.lon = p.lon; }
        else err.push(`coordenadas planas: X ${x} / Y ${y} no corresponden a un punto en Colombia (MAGNA Origen Nacional)`);
      }
    } f.dap = num(g("dap"), err, "dap");
    const cd = valor(g("cat_diametrica"));
    f.catDiametrica = CATEGORIAS_DIAMETRICAS.find(c => valor(c) === cd) ?? null;
    if (cd && !f.catDiametrica) err.push(`categoría diamétrica: «${g("cat_diametrica").trim()}» debe ser Brinzal, Latizal o Fustal`);
    f.alturaArbolM = num(g("altura_m"), err, "altura_m");
    f.estadoGeneral = estado(g("estado_general"), { bueno: "bueno", regular: "regular-malo", malo: "regular-malo", "regular-malo": "regular-malo", "regular-o-malo": "regular-malo" }, err, "estado_general");
    f.inclinacionGrados = num(g("inclinacion_grados"), err, "inclinacion_grados");
    f.ramaDiametroCm = num(g("rama_diametro_cm"), err, "rama_diametro_cm");
    f.ramaEstado = estado(g("rama_estado"), { bueno: "bueno", malo: "malo" }, err, "rama_estado");
    f.ramaAlturaM = num(g("rama_altura_m"), err, "rama_altura_m");
    f.raices = estado(g("raices"), { bueno: "bueno", malo: "malo" }, err, "raices");
    f.personas = sino(g("personas"), err, "personas");
    f.vehiculos = sino(g("vehiculos"), err, "vehiculos");
    f.construcciones = sino(g("construcciones"), err, "construcciones");
    f.redesAereas = sino(g("redes_aereas"), err, "redes_aereas");
    f.familia = desescapar(g("familia")).trim();
    f.diametroCopaM = num(g("diametro_copa_m"), err, "diametro_copa_m");
    f.tomografia = sino(g("tomografia"), err, "tomografia");
    f.recomendacion = desescapar(g("recomendacion")).trim();
    for (const campo of CAMPOS_ENUMERADOS) {
      const col = COLUMNA_ENUM[campo];
      const v = valor(g(col));
      if (!v) continue;
      const opcion = OPCIONES_INVENTARIO[campo].find(o => valor(o) === v);
      if (opcion) (f as unknown as Record<string, unknown>)[campo] = opcion;
      else err.push(`${NOMBRE_CAMPO[col] ?? col}: «${g(col).trim()}» debe ser ${OPCIONES_INVENTARIO[campo].join(", ")}`);
    }
    f.pendiente = desescapar(g("pendiente")).trim();
    f.sitioSiembra = desescapar(g("sitio_siembra")).trim();
    f.observaciones = desescapar(g("observaciones")).trim();
    f.justificacion = desescapar(g("justificacion")).trim();
    const dec = valor(g("decision_final"));
    if (dec) {
      const c = categoriasActivas().find(x => valor(x.nombre) === dec || x.id === dec);
      if (c) f.decisionFinalId = c.id; else err.push(`decisión final: «${g("decision_final").trim()}» no es una categoría`);
    }

    // Mismas reglas que el formulario (los errores de analisis ya se reportaron arriba)
    for (const [campo, msg] of Object.entries(validarForm(f))) {
      const col = FORM_A_COLUMNA[campo] ?? campo;
      const ya = err.some(e => e.startsWith(NOMBRE_CAMPO[col] ?? col));
      if (!ya) err.push(`${NOMBRE_CAMPO[col] ?? col}: ${msg.toLowerCase()}`);
    }
    // La decision final solo exige justificacion si difiere del calculo (requiere el catalogo)
    if (catalogo && f.decisionFinalId && !f.justificacion) {
      const entrada = aEntrada(f, catalogo);
      if (entrada && categorizarActual(calcularRiesgo(entrada).porcentaje).id !== f.decisionFinalId)
        err.push("justificación: obligatoria cuando la decisión final difiere del cálculo");
    }
    if (f.codigo) {
      if (codigosExistentes.has(f.codigo)) err.push(`código ${f.codigo}: ya existe en la aplicación`);
      else if (vistos.has(f.codigo)) err.push(`código ${f.codigo}: repetido en el archivo`);
      vistos.add(f.codigo);
    }
    return { fila: i + 2, form: f, errores: err };
  });
  return { filas: out, columnasFaltantes: [] };
}
