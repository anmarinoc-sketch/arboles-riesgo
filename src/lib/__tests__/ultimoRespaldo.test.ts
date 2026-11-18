import { describe, it, expect } from "vitest";
import { contarSinRespaldar, describirAntiguedad } from "../ultimoRespaldo";

const dia = 86_400_000;
describe("último respaldo", () => {
  it("sin copia previa, todo está sin respaldar", () => {
    expect(contarSinRespaldar([{ actualizada: 1 }, { actualizada: 2 }], null)).toBe(2);
    expect(contarSinRespaldar([], null)).toBe(0);
  });
  it("solo cuenta lo creado o modificado después de la copia", () => {
    expect(contarSinRespaldar([{ actualizada: 100 }, { actualizada: 200 }, { actualizada: 300 }], 200)).toBe(1);
    expect(contarSinRespaldar([{ actualizada: 100 }], 200)).toBe(0);
  });
  it("describe la antigüedad en palabras", () => {
    const ahora = new Date("2026-11-18T15:00:00").getTime();
    expect(describirAntiguedad(null, ahora)).toBe("nunca");
    expect(describirAntiguedad(ahora - 3_600_000, ahora)).toBe("hoy");
    expect(describirAntiguedad(ahora - dia, ahora)).toBe("ayer");
    expect(describirAntiguedad(ahora - 5 * dia, ahora)).toBe("hace 5 días");
  });
});
