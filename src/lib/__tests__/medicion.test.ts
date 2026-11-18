import { describe, it, expect } from "vitest";
import {
  alturaPorAngulos, anguloDesdeVertical, diametroDesdeCircunferencia, distanciaPorPasos, elevacionCamara,
  inclinacionPorPlomada, largoDePaso, mediana, separacionParaAngulo,
} from "../medicion";

const g = 9.81;
const rad = (d: number) => (d * Math.PI) / 180;

describe("inclinación con el celular de canto", () => {
  it("derecho = 0° y acostado = 90°", () => {
    expect(anguloDesdeVertical({ x: 0, y: g, z: 0 })).toBeCloseTo(0, 5);
    expect(anguloDesdeVertical({ x: g, y: 0, z: 0 })).toBeCloseTo(90, 5);
  });
  it("no depende de hacia dónde se incline ni del signo del sensor", () => {
    const a = 25;
    const lado = { x: g * Math.sin(rad(a)), y: g * Math.cos(rad(a)), z: 0 };
    const frente = { x: 0, y: g * Math.cos(rad(a)), z: g * Math.sin(rad(a)) };
    expect(anguloDesdeVertical(lado)).toBeCloseTo(a, 5);
    expect(anguloDesdeVertical(frente)).toBeCloseTo(a, 5);
    expect(anguloDesdeVertical({ x: -lado.x, y: -lado.y, z: -lado.z })).toBeCloseTo(a, 5);
  });
  it("sin lectura devuelve NaN", () => expect(anguloDesdeVertical({ x: 0, y: 0, z: 0 })).toBeNaN());
});

describe("elevación de la cámara", () => {
  it("horizonte = 0°, arriba positivo, abajo negativo", () => {
    expect(elevacionCamara({ x: 0, y: g, z: 0 })).toBeCloseTo(0, 5);
    expect(elevacionCamara({ x: 0, y: g * Math.cos(rad(40)), z: g * Math.sin(rad(40)) })).toBeCloseTo(40, 5);
    expect(elevacionCamara({ x: 0, y: g * Math.cos(rad(15)), z: -g * Math.sin(rad(15)) })).toBeCloseTo(-15, 5);
  });
  it("da lo mismo con la convención de signos invertida", () => {
    expect(elevacionCamara({ x: 0, y: -g * Math.cos(rad(40)), z: -g * Math.sin(rad(40)) })).toBeCloseTo(40, 5);
  });
});

describe("altura por ángulos", () => {
  it("a 10 m, 45° a la copa y 0° a la base = 10 m", () => {
    expect(alturaPorAngulos(10, 45, 0)).toBeCloseTo(10, 5);
  });
  it("suma la parte por debajo del ojo (base con ángulo negativo)", () => {
    // ojo a 1,6 m: la base se ve a atan(1,6/12) hacia abajo; copa a 18 m de altura
    const dist = 12, ojo = 1.6, h = 18;
    const cima = (Math.atan((h - ojo) / dist) * 180) / Math.PI;
    const base = -(Math.atan(ojo / dist) * 180) / Math.PI;
    expect(alturaPorAngulos(dist, cima, base)).toBeCloseTo(h, 5);
  });
  it("lecturas imposibles dan NaN", () => {
    expect(alturaPorAngulos(10, 10, 30)).toBeNaN();
    expect(alturaPorAngulos(10, 90, 0)).toBeNaN();
  });
});

describe("plomada", () => {
  it("58 cm a 1 m ≈ 30° y la ida y vuelta es consistente", () => {
    expect(inclinacionPorPlomada(57.735)).toBeCloseTo(30, 2);
    expect(inclinacionPorPlomada(separacionParaAngulo(30))).toBeCloseTo(30, 6);
    expect(inclinacionPorPlomada(100)).toBeCloseTo(45, 6);
    expect(inclinacionPorPlomada(0)).toBe(0);
  });
  it("valores inválidos dan NaN", () => {
    expect(inclinacionPorPlomada(-1)).toBeNaN();
    expect(inclinacionPorPlomada(10, 0)).toBeNaN();
  });
});

describe("pasos, circunferencia y mediana", () => {
  it("convierte pasos a metros y calibra el paso", () => {
    expect(distanciaPorPasos(20, 0.75)).toBe(15);
    expect(largoDePaso(15, 20)).toBe(0.75);
    expect(largoDePaso(15, 0)).toBeNaN();
  });
  it("diámetro desde la circunferencia", () => {
    expect(diametroDesdeCircunferencia(Math.PI * 5)).toBeCloseTo(5, 10);
    expect(diametroDesdeCircunferencia(15.7)).toBeCloseTo(5, 1);
  });
  it("mediana ignora saltos y valores no numéricos", () => {
    expect(mediana([30, 31, 90, 30.5, 29.5])).toBe(30.5);
    expect(mediana([1, 2, NaN, 3, 4])).toBe(2.5);
    expect(mediana([])).toBeNaN();
  });
});
