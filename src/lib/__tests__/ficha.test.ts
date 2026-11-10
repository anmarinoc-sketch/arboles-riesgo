import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { aEntrada, calcularRiesgo, categorizar, formVacio } from "../../engine";
import type { EvaluacionDB } from "../../db/db";
import { generarFichaPDF } from "../ficha";

const catalogo = [{ cientifico: "Handroanthus chrysanthus", comun: "Guayacán amarillo", spVolcamiento: 1 / 3, spCaidaRamas: 1 / 3 }];
const f = {
  ...formVacio("2026-04-15"), codigo: "SD2_1", especie: "Handroanthus chrysanthus", evaluador: "Ana Pérez", zona: "Santo Domingo",
  lat: 6.4713, lon: -75.1621, dap: 13.1, catDiametrica: "Latizal" as const, alturaArbolM: 5.5, estadoGeneral: "bueno" as const,
  inclinacionGrados: 5, ramaDiametroCm: 6, ramaEstado: "malo" as const, ramaAlturaM: 4, raices: "bueno" as const,
  personas: true, vehiculos: false, construcciones: false, redesAereas: false,
  familia: "Bignoniaceae", habito: "Árbol" as const, origen: "Nativa" as const, madurez: "Adulto" as const,
  fustes: "Tallo único" as const, diametroCopaM: 3.2, fenologia: "Vegetativo" as const, estadoFitosanitario: "Regular" as const,
  prioridad: "Media" as const, tomografia: false, tratamientoRealizado: "Ninguno" as const, interferencia: "Mobiliario" as const,
  observaciones: "Ramas secas. Cuello tapado por sustrato. Abundancia de líquenes.",
  recomendacion: "Poda de mantenimiento (fitosanitaria). Destapar cuello del árbol. Limpieza de líquenes.",
  decisionFinalId: "medio-alto", justificacion: "Rama grande sobre zona de paso.",
};
const resultado = calcularRiesgo(aEntrada(f, catalogo)!);
const c = categorizar(resultado.porcentaje);
const ev: EvaluacionDB = { id: 1, codigo: f.codigo, especie: f.especie, catDiametrica: f.catDiametrica, categoriaId: c.id,
  categoriaNombre: c.nombre, creada: 0, actualizada: 0, sincronizada: 0, form: f, resultado };

describe("ficha PDF", () => {
  it("genera un PDF válido (sin fotos) y, si se pide, lo deja en disco para revisarlo", async () => {
    const blob = await generarFichaPDF(ev, [], catalogo);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(3000);
    if (process.env.FICHA_SALIDA) writeFileSync(process.env.FICHA_SALIDA, bytes);
  });
});
