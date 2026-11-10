import { describe, it, expect } from "vitest";
import { aEntrada, calcularRiesgo, categorizar, formVacio, type FormEvaluacion } from "../../engine";
import type { EvaluacionDB } from "../../db/db";
import { parseCSV, aCSV } from "../csv";
import { evaluacionesACSV, evaluacionesAGeoJSON, plantillaCSV } from "../exportar";
import { leerCSV } from "../importar";

const catalogo = [{ cientifico: "Eucalyptus spp.", comun: "Eucalipto", spVolcamiento: 1, spCaidaRamas: 1 }];

const form = (o: Partial<FormEvaluacion> = {}): FormEvaluacion => ({
  ...formVacio("2026-11-10"),
  codigo: "A-001", especie: "Eucalyptus spp.", evaluador: "Ana", lat: 6.17, lon: -75.58, dap: 45,
  catDiametrica: "Fustal", alturaArbolM: 22, estadoGeneral: "regular-malo", inclinacionGrados: 20,
  ramaDiametroCm: 8, ramaEstado: "malo", ramaAlturaM: 6, raices: "bueno",
  personas: true, vehiculos: false, construcciones: false, redesAereas: false, ...o,
});

function registro(f: FormEvaluacion): EvaluacionDB {
  const resultado = calcularRiesgo(aEntrada(f, catalogo)!);
  const c = categorizar(resultado.porcentaje);
  return { codigo: f.codigo, especie: f.especie, catDiametrica: f.catDiametrica!, categoriaId: c.id, categoriaNombre: c.nombre,
    creada: 0, actualizada: 0, sincronizada: 0, form: f, resultado };
}

describe("CSV", () => {
  it("lee comillas, comas y saltos de línea dentro de campos", () => {
    expect(parseCSV('a,b\r\n"x, y","l1\nl2"\r\n')).toEqual([["a", "b"], ["x, y", "l1\nl2"]]);
  });
  it("detecta punto y coma (Excel en español)", () => {
    expect(parseCSV("a;b\n1,5;2")).toEqual([["a", "b"], ["1,5", "2"]]);
  });
  it("escribe y vuelve a leer sin pérdida", () => {
    const filas = [["a", "b"], ['dice "hola"', "x,y"]];
    expect(parseCSV(aCSV(filas))).toEqual(filas);
  });
});

describe("exportación", () => {
  it("CSV trae entradas y resultados", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form())]));
    const r = Object.fromEntries(cab.map((c, i) => [c, fila[i]]));
    expect(r.codigo).toBe("A-001");
    expect(r.riesgo_pct).toBe("58.3");
    expect(r.categoria).toBe("Medio-Alto");
    expect(r.personas).toBe("si");
  });
  it("neutraliza fórmulas en texto del usuario", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form({ observaciones: "=1+1" }))]));
    expect(fila[cab.indexOf("observaciones")]).toBe("'=1+1");
  });
  it("GeoJSON: EPSG:4326, [lon, lat], sin lat/lon en propiedades y omite sin coordenadas", () => {
    const g = evaluacionesAGeoJSON([registro(form()), registro(form({ codigo: "A-002", lat: null, lon: null }))]);
    expect(g.crs.properties.name).toContain("4326");
    expect(g.features).toHaveLength(1);
    expect(g.features[0].geometry.coordinates).toEqual([-75.58, 6.17]);
    expect(g.features[0].properties.categoria).toBe("Medio-Alto");
    expect("lat" in g.features[0].properties).toBe(false);
  });
});

describe("importación", () => {
  it("el CSV exportado se puede importar y da el mismo formulario", () => {
    const f = form({ observaciones: "con, coma", decisionFinalId: "alto", justificacion: "base podrida" });
    const lectura = leerCSV(evaluacionesACSV([registro(f)]));
    expect(lectura.columnasFaltantes).toEqual([]);
    expect(lectura.filas[0].errores).toEqual([]);
    expect(lectura.filas[0].form).toEqual(f);
  });
  it("los campos de inventario viajan en el CSV y vuelven iguales", () => {
    const f = form({
      familia: "Myrtaceae", habito: "Árbol", madurez: "Adulto", origen: "Introducida", fustes: "Bifurcado",
      diametroCopaM: 6.5, fenologia: "Florecido", estadoFitosanitario: "Regular", prioridad: "Alta", tomografia: true,
      tratamientoRealizado: "Drench y endoterapia", interferencia: "Redes y mobiliario", recomendacion: "Poda, y retiro de epífitas",
    });
    const l = leerCSV(evaluacionesACSV([registro(f)]));
    expect(l.filas[0].errores).toEqual([]);
    expect(l.filas[0].form).toEqual(f);
  });
  it("el inventario es opcional: un CSV sin esas columnas se importa", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form())]));
    const quitar = new Set(["familia", "habito", "origen", "prioridad", "tomografia", "recomendacion"]);
    const idx = cab.map((c, i) => (quitar.has(c) ? -1 : i)).filter(i => i >= 0);
    const l = leerCSV(aCSV([idx.map(i => cab[i]), idx.map(i => fila[i])]));
    expect(l.columnasFaltantes).toEqual([]);
    expect(l.filas[0].errores).toEqual([]);
    expect(l.filas[0].form.origen).toBeNull();
  });
  it("valores de inventario inválidos se reportan; tildes y mayúsculas se toleran", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form())]));
    const c = (n: string) => cab.indexOf(n);
    const f2 = [...fila]; f2[c("habito")] = "arbol"; f2[c("prioridad")] = "urgente"; f2[c("diametro_copa_m")] = "-2";
    const l = leerCSV(aCSV([cab, f2]));
    expect(l.filas[0].form.habito).toBe("Árbol");
    const e = l.filas[0].errores.join("|");
    expect(e).toMatch(/prioridad: «urgente» debe ser Alta, Media, Baja/);
    expect(e).toMatch(/diámetro de copa/);
  });
  it("el CSV trae X/Y MAGNA Origen Nacional (vacías fuera de Colombia)", () => {
    const t = (f: FormEvaluacion) => { const [cab, fila] = parseCSV(evaluacionesACSV([registro(f)])); return Object.fromEntries(cab.map((c, i) => [c, fila[i]])); };
    const colombia = t(form({ lat: 6.4713, lon: -75.1621 }));
    expect(Number(colombia.x_origen_nacional)).toBeGreaterThan(4_700_000);
    expect(Number(colombia.y_origen_nacional)).toBeGreaterThan(2_200_000);
    const madrid = t(form({ lat: 40.4, lon: -3.7 }));
    expect(madrid.x_origen_nacional).toBe("");
    expect(madrid.lat).toBe("40.4");
  });
  it("un CSV con solo X/Y planas se importa y se convierte a lat/lon", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form({ lat: 6.4713, lon: -75.1621 }))]));
    const c = (n: string) => cab.indexOf(n);
    const sinLatLon = [...fila]; sinLatLon[c("lat")] = ""; sinLatLon[c("lon")] = "";
    const quitar = new Set(["lat", "lon"]);
    const idx = cab.map((h, i) => (quitar.has(h) ? -1 : i)).filter(i => i >= 0);
    const l = leerCSV(aCSV([idx.map(i => cab[i]), idx.map(i => sinLatLon[i])]));
    expect(l.columnasFaltantes).toEqual([]);
    expect(l.filas[0].errores).toEqual([]);
    expect(l.filas[0].form.lat).toBeCloseTo(6.4713, 5);
    expect(l.filas[0].form.lon).toBeCloseTo(-75.1621, 5);
  });
  it("X/Y que no caen en Colombia se reportan; sin lat/lon ni X/Y es obligatorio", () => {
    const [cab, fila] = parseCSV(evaluacionesACSV([registro(form())]));
    const c = (n: string) => cab.indexOf(n);
    const mala = [...fila]; mala[c("lat")] = ""; mala[c("lon")] = ""; mala[c("x_origen_nacional")] = "100"; mala[c("y_origen_nacional")] = "100";
    expect(leerCSV(aCSV([cab, mala])).filas[0].errores.join("|")).toMatch(/no corresponden a un punto en Colombia/);
    const vacia = [...mala]; vacia[c("x_origen_nacional")] = ""; vacia[c("y_origen_nacional")] = "";
    expect(leerCSV(aCSV([cab, vacia])).filas[0].errores.join("|")).toMatch(/latitud/);
  });
  it("la plantilla es válida", () => {
    expect(leerCSV(plantillaCSV()).filas[0].errores).toEqual([]);
  });
  it("reporta columnas faltantes", () => {
    const r = leerCSV("codigo,especie\nA,B");
    expect(r.columnasFaltantes).toContain("raices");
    expect(r.filas).toEqual([]);
  });
  it("reporta errores por fila: campos vacíos, valores raros, códigos repetidos o existentes", () => {
    const base = parseCSV(plantillaCSV());
    const cab = base[0], ok = base[1];
    const col = (c: string) => cab.indexOf(c);
    const mal = [...ok]; mal[col("codigo")] = "B-1"; mal[col("raices")] = "";  mal[col("altura_m")] = "alto"; mal[col("personas")] = "quizás";
    const dup = [...ok];
    const lectura = leerCSV(aCSV([cab, ok, mal, dup]), new Set(["Z-9"]));
    expect(lectura.filas[0].errores).toEqual([]);
    expect(lectura.filas[1].fila).toBe(3);
    expect(lectura.filas[1].errores.join("|")).toMatch(/raíces.*obligatorio/);
    expect(lectura.filas[1].errores.join("|")).toMatch(/altura: «alto» no es un número/);
    expect(lectura.filas[1].errores.join("|")).toMatch(/personas.*sí o no/);
    expect(lectura.filas[2].errores.join("|")).toMatch(/repetido en el archivo/);
    expect(leerCSV(aCSV([cab, [...ok.slice(0, 0), ...ok.map((v, i) => (i === 0 ? "Z-9" : v))]]), new Set(["Z-9"])).filas[0].errores.join()).toMatch(/ya existe/);
  });
  it("decisión final distinta del cálculo sin justificación es error", () => {
    const f = form({ decisionFinalId: "alto", justificacion: "" });
    expect(leerCSV(evaluacionesACSV([registro(f)]), new Set(), catalogo).filas[0].errores.join()).toMatch(/justificación/);
    const ok = form({ decisionFinalId: "medio-alto", justificacion: "" }); // igual al calculo
    expect(leerCSV(evaluacionesACSV([registro(ok)]), new Set(), catalogo).filas[0].errores).toEqual([]);
  });
  it("acepta coma decimal, tildes y sinónimos", () => {
    const base = parseCSV(plantillaCSV());
    const fila = [...base[1]];
    const c = (n: string) => base[0].indexOf(n);
    fila[c("lat")] = "6,1696"; fila[c("personas")] = "Sí"; fila[c("estado_general")] = "Regular o malo"; fila[c("cat_diametrica")] = "fustal";
    const r = leerCSV(aCSV([base[0], fila]));
    expect(r.filas[0].errores).toEqual([]);
    expect(r.filas[0].form.lat).toBeCloseTo(6.1696);
    expect(r.filas[0].form.estadoGeneral).toBe("regular-malo");
  });
});
