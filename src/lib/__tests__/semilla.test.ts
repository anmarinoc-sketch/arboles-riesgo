import { describe, it, expect } from "vitest";
import { planActualizacionSemilla } from "../semilla";
import { especiesACSV, leerEspeciesCSV } from "../especiesCsv";

const UN3 = 1 / 3;
const semilla = [
  { cientifico: "Ceroxylon quindiuense", comun: "Palma de cera", spVolcamiento: UN3, spCaidaRamas: UN3, categoriaAmenaza: "EN" as const },
  { cientifico: "Handroanthus chrysanthus", comun: "Guayacán amarillo", spVolcamiento: UN3, spCaidaRamas: UN3, categoriaAmenaza: "VU" as const },
  { cientifico: "Ficus benjamina", comun: "Falso laurel", spVolcamiento: UN3, spCaidaRamas: UN3 },
];

describe("actualización de la semilla en un catálogo existente", () => {
  it("agrega las especies que faltan y la amenaza de las que no la tienen, sin tocar los factores editados", () => {
    const existentes = [
      { id: 1, cientifico: "handroanthus chrysanthus", comun: "Guayacán", spVolcamiento: 1, spCaidaRamas: 2 / 3 },
      { id: 2, cientifico: "Ficus benjamina", comun: "Falso laurel", spVolcamiento: 1, spCaidaRamas: 1 },
    ];
    const r = planActualizacionSemilla(existentes, semilla);
    expect(r.nuevas.map(e => e.cientifico)).toEqual(["Ceroxylon quindiuense"]);
    expect(r.actualizaciones).toEqual([{ id: 1, cambios: { categoriaAmenaza: "VU" } }]);
    // nada de lo editado (Sp) aparece en los cambios
    expect(JSON.stringify(r)).not.toContain("spVolcamiento\":1");
  });
  it("no pisa una categoría de amenaza que el usuario ya puso", () => {
    const r = planActualizacionSemilla([{ id: 1, cientifico: "Handroanthus chrysanthus", comun: "", spVolcamiento: UN3, spCaidaRamas: UN3, categoriaAmenaza: "LC" }], semilla);
    expect(r.actualizaciones).toEqual([]);
  });
});

describe("categoría de amenaza en el catálogo CSV", () => {
  it("viaja en el CSV y se valida", () => {
    const r = leerEspeciesCSV(especiesACSV(semilla));
    expect(r.errores).toEqual([]);
    expect(r.validas.find(e => e.cientifico === "Ceroxylon quindiuense")!.categoriaAmenaza).toBe("EN");
    expect(r.validas.find(e => e.cientifico === "Ficus benjamina")!.categoriaAmenaza).toBeUndefined();
    const mal = leerEspeciesCSV("cientifico,sp_volcamiento,sp_caida_ramas,categoria_amenaza\nA,1,1,raro\nB,1,1,vu");
    expect(mal.errores[0].mensaje).toMatch(/categoria_amenaza/);
    expect(mal.validas[0].categoriaAmenaza).toBe("VU"); // acepta minúsculas
  });
});
