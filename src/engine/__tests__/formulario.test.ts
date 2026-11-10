import { describe, it, expect } from "vitest";
import { formVacio, validarForm, aEntrada, calcularRiesgo, categorizar, type FormEvaluacion, type Especie } from "../index";

const catalogo: Especie[] = [{ cientifico: "Eucalyptus spp.", comun: "Eucalipto", spVolcamiento: 1, spCaidaRamas: 1 }];

const completo = (): FormEvaluacion => ({
  ...formVacio("2026-11-10"),
  codigo: "A-001", especie: "Eucalyptus spp.", evaluador: "Ana", lat: 6.17, lon: -75.58,
  dap: 45, catDiametrica: "Fustal", alturaArbolM: 22, estadoGeneral: "regular-malo", inclinacionGrados: 20,
  ramaDiametroCm: 8, ramaEstado: "malo", ramaAlturaM: 6, raices: "bueno",
  personas: true, vehiculos: false, construcciones: false, redesAereas: false,
});

describe("validación del formulario", () => {
  it("un formulario vacío no se puede guardar y marca todas las variables", () => {
    const e = validarForm(formVacio());
    for (const k of ["codigo", "especie", "evaluador", "lat", "lon", "dap", "catDiametrica", "alturaArbolM",
      "estadoGeneral", "inclinacionGrados", "ramaDiametroCm", "ramaEstado", "ramaAlturaM", "raices",
      "personas", "vehiculos", "construcciones", "redesAereas"] as const)
      expect(e[k], k).toBeTruthy();
  });
  it("un formulario completo es válido", () => {
    expect(validarForm(completo())).toEqual({});
  });
  it("«No hay vehículos» (false) cuenta como respondido; sin responder (null) no", () => {
    expect(validarForm({ ...completo(), vehiculos: false }).vehiculos).toBeUndefined();
    expect(validarForm({ ...completo(), vehiculos: null }).vehiculos).toBeTruthy();
  });
  it("rechaza coordenadas, negativos e inclinación fuera de rango", () => {
    const e = validarForm({ ...completo(), lat: 95, lon: -200, alturaArbolM: -1, inclinacionGrados: 120 });
    expect(e.lat && e.lon && e.alturaArbolM && e.inclinacionGrados).toBeTruthy();
  });
  it("una decisión distinta del cálculo exige justificación", () => {
    const f = { ...completo(), decisionFinalId: "alto" };
    expect(validarForm(f, "medio-alto").justificacion).toBeTruthy();
    expect(validarForm({ ...f, justificacion: "Pudrición en la base" }, "medio-alto").justificacion).toBeUndefined();
    expect(validarForm({ ...f, decisionFinalId: "medio-alto" }, "medio-alto").justificacion).toBeUndefined();
  });
  it("pendiente y sitio de siembra son opcionales y no afectan el cálculo", () => {
    const f = completo();
    expect(validarForm(f)).toEqual({});
    const a = calcularRiesgo(aEntrada(f, catalogo)!);
    const b = calcularRiesgo(aEntrada({ ...f, pendiente: "35%", sitioSiembra: "talud" }, catalogo)!);
    expect(b).toEqual(a);
  });
});

describe("aEntrada", () => {
  it("devuelve null si falta una variable de cálculo", () => {
    expect(aEntrada({ ...completo(), raices: null }, catalogo)).toBeNull();
  });
  it("reproduce el caso 1 desde el formulario (eucalipto del catálogo)", () => {
    const r = calcularRiesgo(aEntrada(completo(), catalogo)!);
    expect(r.porcentaje).toBeCloseTo(58.3, 1);
    expect(categorizar(r.porcentaje).id).toBe("medio-alto");
  });
  it("especie fuera del catálogo usa 2/3", () => {
    const e = aEntrada({ ...completo(), especie: "Planta rara" }, catalogo)!;
    expect(e.volcamiento.spVolcamiento).toBeCloseTo(2 / 3);
    expect(e.caidaRamas.spCaidaRamas).toBeCloseTo(2 / 3);
  });
});
