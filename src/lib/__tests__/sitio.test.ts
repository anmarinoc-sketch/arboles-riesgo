import { describe, it, expect } from "vitest";
import { agregarRecomendacion, construccionEnAlcance, pendienteEquivalente, quitarRecomendacion } from "../sitio";

describe("pendiente", () => {
  it("convierte de grados a porcentaje y al revés", () => {
    expect(pendienteEquivalente("45°")).toBe("45 ° ≈ 100 %".replace(" °", "°"));
    expect(pendienteEquivalente("100 %")).toBe("100 % ≈ 45°");
    // El informe de Cornare cita «62,8 % o 32,2°»: son equivalentes salvo por redondeo (62,8 % ≈ 32,1°; 32,2° ≈ 63,0 %)
    expect(pendienteEquivalente("32,2°")).toBe("32,2° ≈ 63 %");
    expect(pendienteEquivalente("62,8 %")).toBe("62,8 % ≈ 32,1°");
    expect(pendienteEquivalente("30 grados")).toBe("30° ≈ 57,7 %");
  });
  it("sin unidad, con texto libre o fuera de rango no inventa nada", () => {
    expect(pendienteEquivalente("30")).toBeNull();
    expect(pendienteEquivalente("plano")).toBeNull();
    expect(pendienteEquivalente("")).toBeNull();
    expect(pendienteEquivalente("90°")).toBeNull();
    expect(pendienteEquivalente("-5%")).toBeNull();
  });
});

describe("recomendaciones rápidas", () => {
  it("agrega sin repetir, con punto entre ellas", () => {
    const a = agregarRecomendacion("", "Retiro de hojas secas");
    expect(a).toBe("Retiro de hojas secas");
    const b = agregarRecomendacion(a, "Destapar el cuello del árbol");
    expect(b).toBe("Retiro de hojas secas. Destapar el cuello del árbol");
    expect(agregarRecomendacion(b, "retiro de hojas secas")).toBe(b);
    expect(agregarRecomendacion("Poda leve.", "Control fitosanitario")).toBe("Poda leve. Control fitosanitario");
  });
  it("quita una recomendación agregada y deja el resto", () => {
    const t = "Retiro de hojas secas. Destapar el cuello del árbol. Control fitosanitario";
    expect(quitarRecomendacion(t, "Destapar el cuello del árbol")).toBe("Retiro de hojas secas. Control fitosanitario");
    expect(quitarRecomendacion(t, "Retiro de hojas secas")).toBe("Destapar el cuello del árbol. Control fitosanitario");
    expect(quitarRecomendacion(t, "Control fitosanitario")).toBe("Retiro de hojas secas. Destapar el cuello del árbol");
    expect(quitarRecomendacion("Solo una", "Solo una")).toBe("");
    expect(quitarRecomendacion("Texto", "otra")).toBe("Texto");
  });
});

describe("alcance de caída", () => {
  it("la construcción está en alcance si queda más cerca que la altura del árbol", () => {
    expect(construccionEnAlcance(2.6, 15)).toBe(true); // palma 1 del informe: fuste a 2,6 m de la pared, 15 m de altura
    expect(construccionEnAlcance(20, 15)).toBe(false);
    expect(construccionEnAlcance(null, 15)).toBe(false);
    expect(construccionEnAlcance(2, null)).toBe(false);
  });
});
