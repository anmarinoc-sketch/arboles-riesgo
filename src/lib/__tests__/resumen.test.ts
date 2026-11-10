import { describe, it, expect } from "vitest";
import { tabla65, tabla66, esEucalipto, inventario } from "../resumen";

const d = [
  { categoriaId: "alto", catDiametrica: "Fustal", especie: "Ficus benjamina" },
  { categoriaId: "alto", catDiametrica: "Latizal", especie: "Ficus benjamina" },
  { categoriaId: "medio-alto", catDiametrica: "Fustal", especie: "Eucalyptus spp." },
  { categoriaId: "medio-alto", catDiametrica: "Fustal", especie: "eucalyptus sp." },
  { categoriaId: "medio-alto", catDiametrica: "Brinzal", especie: "Mangifera indica" },
  { categoriaId: "bajo", catDiametrica: "Fustal", especie: "Psidium guajava" },
];

describe("resumen Tablas 65 y 66", () => {
  it("detecta eucaliptos por género", () => {
    expect(esEucalipto("Eucalyptus spp.")).toBe(true);
    expect(esEucalipto(" eucalyptus globulus")).toBe(true);
    expect(esEucalipto("Eucalypto")).toBe(false);
  });
  it("Tabla 65: conteo por categoría diamétrica × riesgo", () => {
    const t = tabla65(d);
    expect(t.columnas.map(c => c.id)).toEqual(["alto", "medio-alto", "medio-bajo", "bajo"]);
    const fustal = t.filas.find(f => f.catDiametrica === "Fustal")!;
    expect(fustal.conteos).toEqual({ alto: 1, "medio-alto": 2, "medio-bajo": 0, bajo: 1 });
    expect(fustal.total).toBe(4);
    expect(t.totales).toEqual({ alto: 2, "medio-alto": 3, "medio-bajo": 0, bajo: 1 });
    expect(t.total).toBe(6);
  });
  it("Tabla 66: eucaliptos frente al resto y porcentajes relativos", () => {
    const t = tabla66(d);
    const ma = t.filas.find(f => f.categoriaId === "medio-alto")!;
    expect(ma).toMatchObject({ resto: 1, eucaliptos: 2, total: 3 });
    expect(ma.pctEucaliptos).toBeCloseTo(100);
    expect(t.totalResto).toBe(4);
    expect(t.totalEucaliptos).toBe(2);
    expect(t.filas.find(f => f.categoriaId === "alto")!.pctResto).toBeCloseTo(50);
  });
  it("sin datos no divide por cero", () => {
    expect(tabla66([]).filas.every(f => f.pctResto === 0 && f.pctEucaliptos === 0)).toBe(true);
  });
});

describe("inventario", () => {
  const arbol = (especie: string, origen: string | null, prioridad: string | null = null, estado: string | null = null) =>
    ({ especie, form: { origen, prioridad, estadoFitosanitario: estado } });
  const datos = [
    arbol("Handroanthus chrysanthus", "Nativa", "Baja", "Bueno"), arbol("handroanthus chrysanthus", "Nativa", "Alta", "Regular"),
    arbol("Roystonea regia", "Introducida", "Media", "Bueno"), arbol("Tabebuia rosea", "Nativa"),
    arbol("Spathodea campanulata", null), arbol("Ficus sp.", "Nativa"), arbol("Ficus sp.", "Introducida"),
  ];
  it("cuenta individuos por especie sin distinguir mayúsculas y ordena por cantidad", () => {
    const r = inventario(datos);
    expect(r.total).toBe(7);
    // Empatan en 2: se ordenan alfabéticamente (Ficus antes que Handroanthus); luego las de 1
    expect(r.especies.map(e => e.cantidad)).toEqual([2, 2, 1, 1, 1]);
    expect(r.especies[1]).toEqual({ especie: "Handroanthus chrysanthus", origen: "Nativa", cantidad: 2 });
    expect(r.especies.find(e => e.especie === "Ficus sp.")).toMatchObject({ origen: "Mixto", cantidad: 2 });
    expect(r.especies.find(e => e.especie === "Spathodea campanulata")!.origen).toBe("");
  });
  it("separa nativas e introducidas (especies e individuos) y cuenta los sin origen", () => {
    const r = inventario(datos);
    expect(r.nativas).toEqual({ especies: 2, individuos: 4 });
    expect(r.introducidas).toEqual({ especies: 1, individuos: 2 });
    expect(r.sinOrigen).toBe(1);
  });
  it("cuenta prioridad y estado, con «Sin dato»", () => {
    const r = inventario(datos);
    expect(r.porPrioridad).toEqual({ Alta: 1, Media: 1, Baja: 1, "Sin dato": 4 });
    expect(r.porEstado).toEqual({ Bueno: 2, Regular: 1, Deficiente: 0, "Sin dato": 4 });
  });
});
