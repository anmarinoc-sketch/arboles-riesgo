import { describe, it, expect } from "vitest";
import { categorizar } from "../../engine";
import {
  CATEGORIAS_POR_DEFECTO as base, validarCategorias, describirRangos, cambiosDeCategoria,
  guardarCategorias, restaurarCategorias, categoriasActivas, categorizarActual,
} from "../categorias";

const con = (hastas: (number | null)[], inclusivos = [false, false, true, false]) =>
  base.map((c, i) => ({ ...c, hasta: hastas[i], inclusivo: inclusivos[i] }));

describe("umbrales editables", () => {
  it("los valores por defecto son válidos y describen la Tabla 64", () => {
    expect(validarCategorias(base)).toEqual([]);
    expect(describirRangos(base)).toEqual([
      "Bajo: < 30 %", "Medio-Bajo: ≥ 30 y < 50 %", "Medio-Alto: ≥ 50 y ≤ 60 %", "Alto: > 60 %",
    ]);
  });
  it("exige límites crecientes, hasta 100 y la última sin límite", () => {
    expect(validarCategorias(con([30, 30, 60, null]))[0]).toMatch(/mayor que el de la categoría anterior/);
    expect(validarCategorias(con([30, 50, 120, null])).join()).toMatch(/100/);
    expect(validarCategorias(con([30, 50, 60, 90])).join()).toMatch(/última categoría/);
    expect(validarCategorias(con([30, Number.NaN, 60, null])).join()).toMatch(/límite superior/);
  });
  it("valida color y acción", () => {
    const m = base.map(c => ({ ...c }));
    m[0].color = "verde"; m[1].accion = "  ";
    expect(validarCategorias(m)).toHaveLength(2);
  });
  it("rechaza categorías que no son las del modelo", () => {
    expect(validarCategorias(base.slice(0, 3))).toHaveLength(1);
  });
  it("con otros umbrales cambian las categorías (y los bordes)", () => {
    const c = con([20, 40, 70, null], [false, true, false, false]);
    expect(categorizar(19.9, c).id).toBe("bajo");
    expect(categorizar(20, c).id).toBe("medio-bajo");
    expect(categorizar(40, c).id).toBe("medio-bajo"); // inclusivo
    expect(categorizar(40.1, c).id).toBe("medio-alto");
    expect(categorizar(70, c).id).toBe("alto"); // no inclusivo
    expect(describirRangos(c)[2]).toBe("Medio-Alto: > 40 y < 70 %");
  });
  it("guardar cambia lo que usa la app; restaurar vuelve a la Tabla 64; guardar inválido no cambia nada", () => {
    expect(guardarCategorias(con([10, 20, 30, null]))).toEqual([]);
    expect(categorizarActual(35).id).toBe("alto");
    expect(guardarCategorias(con([50, 40, 60, null])).length).toBeGreaterThan(0);
    expect(categoriasActivas()[0].hasta).toBe(10);
    restaurarCategorias();
    expect(categorizarActual(35).id).toBe("medio-bajo");
  });
  it("detecta qué evaluaciones guardadas cambiarían de categoría", () => {
    const evs = [
      { id: 1, categoriaId: "bajo", resultado: { porcentaje: 25 } },
      { id: 2, categoriaId: "medio-alto", resultado: { porcentaje: 58.3 } },
    ];
    expect(cambiosDeCategoria(evs, base)).toEqual([]);
    expect(cambiosDeCategoria(evs, con([20, 40, 55, null]))).toEqual([
      { id: 1, categoriaId: "medio-bajo", categoriaNombre: "Medio-Bajo" },
      { id: 2, categoriaId: "alto", categoriaNombre: "Alto" },
    ]);
  });
});
