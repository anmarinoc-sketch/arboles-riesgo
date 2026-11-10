import { describe, it, expect } from "vitest";
import { especiesACSV, leerEspeciesCSV, leerSp } from "../especiesCsv";

const cat = [
  { cientifico: "Eucalyptus spp.", comun: "Eucalipto", spVolcamiento: 1, spCaidaRamas: 1 },
  { cientifico: "Ficus benjamina", comun: "Falso laurel", spVolcamiento: 1 / 3, spCaidaRamas: 2 / 3 },
];

describe("catálogo de especies en CSV", () => {
  it("exporta e importa sin pérdida", () => {
    const r = leerEspeciesCSV(especiesACSV(cat));
    expect(r.errores).toEqual([]);
    expect(r.validas).toEqual(cat);
  });
  it("entiende fracciones y decimales", () => {
    expect(leerSp("1/3")).toBeCloseTo(1 / 3);
    expect(leerSp("0,33")).toBeCloseTo(1 / 3);
    expect(leerSp("0.67")).toBeCloseTo(2 / 3);
    expect(leerSp("1")).toBe(1);
    expect(leerSp("0.5")).toBeNull();
    expect(leerSp("")).toBeNull();
  });
  it("sp vacío = 2/3 (sin información)", () => {
    const r = leerEspeciesCSV("cientifico,sp_volcamiento,sp_caida_ramas\nQuercus robur,,1");
    expect(r.validas[0]).toMatchObject({ cientifico: "Quercus robur", comun: "" });
    expect(r.validas[0].spVolcamiento).toBeCloseTo(2 / 3);
    expect(r.validas[0].spCaidaRamas).toBe(1);
  });
  it("reporta columnas faltantes y errores por fila", () => {
    expect(leerEspeciesCSV("cientifico\nA").columnasFaltantes).toEqual(["sp_volcamiento", "sp_caida_ramas"]);
    const r = leerEspeciesCSV("cientifico,sp_volcamiento,sp_caida_ramas\n,1,1\nA,0.5,1\nB,1,1\nb,1,1");
    expect(r.errores.map(e => e.fila)).toEqual([2, 3, 5]);
    expect(r.validas.map(e => e.cientifico)).toEqual(["B"]);
  });
});
