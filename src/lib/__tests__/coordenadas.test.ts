import { describe, it, expect } from "vitest";
import { enColombia, origenNacionalAWgs84, wgs84AOrigenNacional } from "../coordenadas";

describe("MAGNA Origen Nacional (EPSG:9377)", () => {
  it("el origen del sistema cae en el falso este/norte", () => {
    const p = wgs84AOrigenNacional(4, -73)!;
    expect(p.x).toBeCloseTo(5_000_000, 2);
    expect(p.y).toBeCloseTo(2_000_000, 2);
  });
  it("ida y vuelta conserva la posición (menos de 1 mm)", () => {
    for (const [lat, lon] of [[6.4713, -75.1621], [4.598056, -74.076111], [-4.2153, -69.9406], [12.5847, -81.7006]]) {
      const p = wgs84AOrigenNacional(lat, lon)!;
      const q = origenNacionalAWgs84(p.x, p.y)!;
      expect(Math.abs(q.lat - lat)).toBeLessThan(1e-7);
      expect(Math.abs(q.lon - lon)).toBeLessThan(1e-7);
    }
  });
  it("las coordenadas de la ficha de Santo Domingo caen en ese municipio (Antioquia)", () => {
    // Ficha SD2_1: X 4761681,6582 / Y 2281471,74
    const q = origenNacionalAWgs84(4761681.6582, 2281471.74)!;
    expect(q.lat).toBeGreaterThan(6.4);
    expect(q.lat).toBeLessThan(6.55);
    expect(q.lon).toBeGreaterThan(-75.25);
    expect(q.lon).toBeLessThan(-75.1);
  });
  it("al norte y este del origen los valores crecen", () => {
    const o = wgs84AOrigenNacional(4, -73)!, n = wgs84AOrigenNacional(5, -73)!, e = wgs84AOrigenNacional(4, -72)!;
    expect(n.y).toBeGreaterThan(o.y);
    expect(e.x).toBeGreaterThan(o.x);
  });
  it("fuera de Colombia o sin datos devuelve null", () => {
    expect(wgs84AOrigenNacional(40.4, -3.7)).toBeNull(); // Madrid
    expect(wgs84AOrigenNacional(null, -75)).toBeNull();
    expect(origenNacionalAWgs84(Number.NaN, 1)).toBeNull();
    expect(origenNacionalAWgs84(100, 100)).toBeNull();
    expect(enColombia(6.17, -75.58)).toBe(true);
    expect(enColombia(0, 0)).toBe(false);
  });
});
