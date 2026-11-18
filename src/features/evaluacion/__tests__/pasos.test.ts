import { describe, it, expect } from "vitest";
import { formVacio, validarForm } from "../../../engine";
import { PASO_DEL_CAMPO, pasosConError, primerPasoConError } from "../pasos";

describe("pasos del formulario", () => {
  it("un formulario vacío tiene errores en los pasos 1, 2 y 3, y el primero es el 1", () => {
    const e = validarForm(formVacio());
    expect(pasosConError(e)).toEqual([1, 2, 3]);
    expect(primerPasoConError(e)).toBe(1);
  });
  it("cada campo obligatorio del validador tiene un paso asignado", () => {
    const e = validarForm(formVacio());
    for (const k of Object.keys(e)) expect(PASO_DEL_CAMPO[k], k).toBeDefined();
  });
  it("sin errores no hay paso con error", () => {
    expect(pasosConError({})).toEqual([]);
    expect(primerPasoConError({})).toBeNull();
  });
  it("la justificación pendiente de la decisión final cae en el último paso", () => {
    expect(primerPasoConError({ justificacion: "falta" })).toBe(4);
  });
  it("si solo falta la ubicación, el paso es el 2", () => {
    expect(primerPasoConError({ lat: "x", lon: "y" })).toBe(2);
  });
});
