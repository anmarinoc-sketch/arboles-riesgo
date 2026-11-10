import { describe, it, expect } from "vitest";
import { filtrar, SIN_FILTROS } from "../filtros";

const datos = [
  { id: 1, categoriaId: "alto", especie: "Ficus benjamina", catDiametrica: "Fustal" },
  { id: 2, categoriaId: "bajo", especie: "Eucalyptus spp.", catDiametrica: "Latizal" },
  { id: 3, categoriaId: "bajo", especie: "ficus benjamina", catDiametrica: "Brinzal" },
];

describe("filtrar", () => {
  it("sin filtros devuelve todo", () => expect(filtrar(datos, SIN_FILTROS)).toHaveLength(3));
  it("por categoría de riesgo", () => expect(filtrar(datos, { ...SIN_FILTROS, categoriaId: "bajo" }).map(d => d.id)).toEqual([2, 3]));
  it("por especie, sin distinguir mayúsculas", () => expect(filtrar(datos, { ...SIN_FILTROS, especie: "Ficus Benjamina" }).map(d => d.id)).toEqual([1, 3]));
  it("combina los tres filtros", () =>
    expect(filtrar(datos, { categoriaId: "bajo", especie: "ficus benjamina", catDiametrica: "Brinzal" }).map(d => d.id)).toEqual([3]));
});
