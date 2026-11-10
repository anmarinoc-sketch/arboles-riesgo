import { describe, it, expect } from "vitest";
import { calcularRiesgo, categorizar, resolverSp, type EntradaRiesgo } from "../index";

const sinVuln = { personas: false, vehiculos: false, construcciones: false, redesAereas: false };
const caso1: EntradaRiesgo = {
  volcamiento: { alturaArbolM: 22, spVolcamiento: 1, estadoGeneralMalo: true, inclinacionGrados: 20 },
  caidaRamas: { diametroRamaCm: 8, spCaidaRamas: 1, ramaMalEstado: true, alturaRamaM: 6 },
  raicesMalEstado: false,
  vulnerabilidad: { ...sinVuln, personas: true },
};

describe("motor de riesgo 3.7", () => {
  it("caso 1: eucalipto 22 m -> Medio-Alto 58,3 %", () => {
    const r = calcularRiesgo(caso1);
    expect(r.Vo).toBeCloseTo(0.75, 4);
    expect(r.Cr).toBeCloseTo(1, 4);
    expect(r.Ra).toBe(0);
    expect(r.A).toBeCloseTo(0.5833, 4);
    expect(r.porcentaje).toBeCloseTo(58.3, 1);
    expect(categorizar(r.porcentaje).nombre).toBe("Medio-Alto");
  });
  it("caso 2: 8 m, todo bueno -> Bajo 8,3 %", () => {
    const r = calcularRiesgo({
      volcamiento: { alturaArbolM: 8, spVolcamiento: 1 / 3, estadoGeneralMalo: false, inclinacionGrados: 0 },
      caidaRamas: { diametroRamaCm: 3, spCaidaRamas: 1 / 3, ramaMalEstado: false, alturaRamaM: 3 },
      raicesMalEstado: false,
      vulnerabilidad: { ...sinVuln, vehiculos: true },
    });
    expect(r.Vo).toBeCloseTo(0.1667, 4);
    expect(r.Cr).toBeCloseTo(0.0833, 4);
    expect(r.A).toBeCloseTo(0.0833, 4);
    expect(r.porcentaje).toBeCloseTo(8.3, 1);
    expect(categorizar(r.porcentaje).nombre).toBe("Bajo");
  });
  it("caso 3: sin vulnerables -> 0 % Bajo", () => {
    const r = calcularRiesgo({ ...caso1, vulnerabilidad: sinVuln });
    expect(r.V).toBe(0);
    expect(r.porcentaje).toBe(0);
    expect(categorizar(r.porcentaje).nombre).toBe("Bajo");
  });
  it("V = 1 con cualquier elemento, incluidas redes aéreas", () => {
    expect(calcularRiesgo({ ...caso1, vulnerabilidad: { ...sinVuln, redesAereas: true } }).V).toBe(1);
  });
  it("tamaño: 10 y 20 m => 2/3; 20,1 => 1; 9,9 => 1/3", () => {
    const vo = (h: number) =>
      calcularRiesgo({ ...caso1, volcamiento: { ...caso1.volcamiento, alturaArbolM: h } }).Vo;
    expect(vo(9.9)).toBeCloseTo((1 / 3 + 1 + 1 + 0) / 4);
    expect(vo(10)).toBeCloseTo((2 / 3 + 1 + 1 + 0) / 4);
    expect(vo(20)).toBeCloseTo((2 / 3 + 1 + 1 + 0) / 4);
    expect(vo(20.1)).toBeCloseTo(0.75);
  });
  it("inclinación 30° => 0; 30,1° => 1", () => {
    const vo = (i: number) =>
      calcularRiesgo({ ...caso1, volcamiento: { ...caso1.volcamiento, inclinacionGrados: i } }).Vo;
    expect(vo(30)).toBeCloseTo(0.75);
    expect(vo(30.1)).toBeCloseTo(1);
  });
});

describe("categorías (Tabla 64) y límites", () => {
  it.each([
    [0, "Bajo"], [29.99, "Bajo"], [30, "Medio-Bajo"], [49.99, "Medio-Bajo"],
    [50, "Medio-Alto"], [60, "Medio-Alto"], [60.01, "Alto"], [100, "Alto"],
  ])("%s %% => %s", (p, n) => expect(categorizar(p).nombre).toBe(n));
  it("tolera ruido de coma flotante en 30 / 50 / 60", () => {
    expect(categorizar(0.3 * 100).nombre).toBe("Medio-Bajo");
    expect(categorizar(0.5 * 100).nombre).toBe("Medio-Alto");
    expect(categorizar(0.6 * 100).nombre).toBe("Medio-Alto");
    expect(categorizar(0.1 * 3 * 100).nombre).toBe("Medio-Bajo");
  });
});

describe("resolución de especie", () => {
  const cat = [{ cientifico: "Eucalyptus spp.", comun: "Eucalipto", spVolcamiento: 1, spCaidaRamas: 1 }];
  it("catálogo, ausente e Indeterminado", () => {
    expect(resolverSp("eucalyptus spp.", cat).spVolcamiento).toBe(1);
    expect(resolverSp("Ficus nueva", cat).spCaidaRamas).toBeCloseTo(2 / 3);
    expect(resolverSp("Indeterminado", cat).spVolcamiento).toBeCloseTo(2 / 3);
    expect(resolverSp("  Eucalyptus sp. ", cat).spCaidaRamas).toBe(1); // sp. == spp.
  });
});
