import { describe, it, expect } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { calcularRiesgo, aEntrada, categorizar, formVacio } from "../../engine";
import type { EvaluacionDB, FotoDB } from "../../db/db";
import { crearRespaldoZip, leerRespaldoZip, nombreRespaldo, resumenRestauracion } from "../respaldo";

const catalogo = [{ cientifico: "Eucalyptus spp.", comun: "Eucalipto", spVolcamiento: 1, spCaidaRamas: 1, categoriaAmenaza: undefined }];
const form = (codigo: string) => ({
  ...formVacio("2026-11-10"), codigo, especie: "Eucalyptus spp.", evaluador: "Ana", lat: 6.17, lon: -75.58, dap: 45,
  catDiametrica: "Fustal" as const, alturaArbolM: 22, estadoGeneral: "regular-malo" as const, inclinacionGrados: 20,
  ramaDiametroCm: 8, ramaEstado: "malo" as const, ramaAlturaM: 6, raices: "bueno" as const,
  personas: true, vehiculos: false, construcciones: false, redesAereas: false, senales: ["Hongos"], observaciones: "tilde: árbol, ñandú",
});
const ev = (id: number, codigo: string): EvaluacionDB => {
  const f = form(codigo);
  const resultado = calcularRiesgo(aEntrada(f, catalogo)!, "promedio");
  const c = categorizar(resultado.porcentaje);
  return { id, codigo, especie: f.especie, catDiametrica: f.catDiametrica, categoriaId: c.id, categoriaNombre: c.nombre,
    creada: 1, actualizada: 2, sincronizada: 1, modoV: "promedio", form: f, resultado };
};
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 0xff, 0xd9]);
const foto = (id: number, evaluacionId: number, bytes = JPG): FotoDB => ({ id, evaluacionId, nombre: "foto.jpg", blob: new Blob([bytes], { type: "image/jpeg" }) });
const ajustes = { categorias: [{ id: "bajo", hasta: 25, inclusivo: false, color: "#2e9e4f", accion: "Nada" }], modoV: "promedio" as const };

async function respaldo() {
  return crearRespaldoZip({
    evaluaciones: [ev(1, "A-1"), ev(2, "B/2 ñ")], fotos: [foto(1, 1), foto(2, 1), foto(3, 2), foto(4, 99)],
    especies: [{ ...catalogo[0], categoriaAmenaza: "VU" as const }], ajustes, ahora: new Date("2026-11-18T10:00:00Z"),
  });
}

describe("respaldo completo", () => {
  it("el ZIP trae respaldo.json y las fotos (sin las huérfanas), y no trae el token ni ids locales", async () => {
    const zip = await respaldo();
    const c = unzipSync(zip);
    const nombres = Object.keys(c).sort();
    expect(nombres).toContain("respaldo.json");
    expect(nombres.filter(n => n.startsWith("fotos/"))).toHaveLength(3); // la foto 4 no tiene evaluación
    const j = JSON.parse(strFromU8(c["respaldo.json"]));
    expect(j.formato).toBe("arboles-en-riesgo");
    expect(j.creado).toBe("2026-11-18T10:00:00.000Z");
    expect(JSON.stringify(j)).not.toMatch(/token|Authorization/i);
    expect(j.evaluaciones.every((e: Record<string, unknown>) => !("id" in e))).toBe(true);
  });

  it("ida y vuelta: las evaluaciones, el método, las especies, los ajustes y los bytes de las fotos no cambian", async () => {
    const leido = leerRespaldoZip(await respaldo());
    expect(leido.avisos).toEqual([]);
    const r = leido.respaldo;
    expect(r.evaluaciones.map(e => e.codigo)).toEqual(["A-1", "B/2 ñ"]);
    expect(r.evaluaciones[0].modoV).toBe("promedio");
    expect(r.evaluaciones[0].form.observaciones).toBe("tilde: árbol, ñandú");
    expect(r.evaluaciones[0].resultado.porcentaje).toBeCloseTo(ev(1, "A-1").resultado.porcentaje, 10);
    expect(r.especies[0]).toMatchObject({ cientifico: "Eucalyptus spp.", categoriaAmenaza: "VU" });
    expect(r.ajustes.modoV).toBe("promedio");
    expect(r.ajustes.categorias[0].hasta).toBe(25);
    expect(r.fotos.filter(f => f.codigo === "A-1")).toHaveLength(2);
    for (const f of r.fotos) expect([...leido.archivos.get(f.archivo)!]).toEqual([...JPG]);
  });

  it("rechaza archivos que no son un respaldo, con un mensaje claro", async () => {
    expect(() => leerRespaldoZip(strToU8("esto no es un zip"))).toThrow(/ZIP válido/);
    expect(() => leerRespaldoZip(zipSync({ "otro.txt": strToU8("x") }))).toThrow(/respaldo\.json/);
    expect(() => leerRespaldoZip(zipSync({ "respaldo.json": strToU8("{") }))).toThrow(/dañado/);
    expect(() => leerRespaldoZip(zipSync({ "respaldo.json": strToU8(JSON.stringify({ formato: "otra-app" })) }))).toThrow(/no es un respaldo/);
    expect(() => leerRespaldoZip(zipSync({ "respaldo.json": strToU8(JSON.stringify({ formato: "arboles-en-riesgo", version: 99, evaluaciones: [], especies: [] })) }))).toThrow(/versión más nueva/);
  });

  it("omite con aviso las evaluaciones incompletas o repetidas y las fotos que faltan o no son imágenes", async () => {
    const base = JSON.parse(strFromU8(unzipSync(await respaldo())["respaldo.json"]));
    base.evaluaciones.push({ codigo: "" }, { ...base.evaluaciones[0] });
    base.fotos.push({ codigo: "A-1", nombre: "x", tipo: "image/jpeg", archivo: "fotos/no-esta.jpg" }, { codigo: "A-1", nombre: "y", tipo: "text/html", archivo: "fotos/A-1_1.jpg" });
    const zip = zipSync({ ...unzipSync(await respaldo()), "respaldo.json": strToU8(JSON.stringify(base)) });
    const l = leerRespaldoZip(zip);
    expect(l.respaldo.evaluaciones).toHaveLength(2);
    expect(l.avisos.join("|")).toMatch(/datos incompletos/);
    expect(l.avisos.join("|")).toMatch(/repetida/);
    expect(l.avisos.join("|")).toMatch(/no-esta\.jpg/);
    expect(l.respaldo.fotos.every(f => f.tipo.startsWith("image/"))).toBe(true);
  });

  it("completa los campos que un respaldo antiguo no tenía", async () => {
    const base = JSON.parse(strFromU8(unzipSync(await respaldo())["respaldo.json"]));
    delete base.evaluaciones[0].form.senales; delete base.evaluaciones[0].form.zona;
    const zip = zipSync({ ...unzipSync(await respaldo()), "respaldo.json": strToU8(JSON.stringify(base)) });
    const f = leerRespaldoZip(zip).respaldo.evaluaciones[0].form;
    expect(f.senales).toEqual([]);
    expect(f.zona).toBe("");
  });

  it("resume qué pasa al restaurar con y sin reemplazo", async () => {
    const r = leerRespaldoZip(await respaldo()).respaldo;
    const existentes = new Set(["A-1", "Z-9"]);
    expect(resumenRestauracion(r, existentes, false)).toEqual({ nuevas: 1, yaExisten: 1, aplicadas: 1, omitidas: 1 });
    expect(resumenRestauracion(r, existentes, true)).toEqual({ nuevas: 1, yaExisten: 1, aplicadas: 2, omitidas: 0 });
  });

  it("nombre del archivo con la fecha", () => {
    expect(nombreRespaldo(new Date("2026-11-18T10:00:00Z"))).toBe("arboles-respaldo-2026-11-18.zip");
  });
});
