import { describe, it, expect, vi } from "vitest";
import { formVacio } from "../../engine";
import type { EvaluacionDB } from "../../db/db";
import { sincronizar, LOTE } from "../sync";

const ev = (id: number): EvaluacionDB => ({
  id, codigo: `C-${id}`, especie: "X", catDiametrica: "Fustal", categoriaId: "bajo", categoriaNombre: "Bajo",
  creada: 1, actualizada: 1, sincronizada: 0, form: formVacio("2026-11-10"),
  resultado: { Vo: 0, Cr: 0, Ra: 0, A: 0, V: 0, riesgo: 0, porcentaje: 0 },
});
const cfg = { url: "https://ejemplo.test/api", token: "" };
const respuesta = (status: number) => ({ ok: status >= 200 && status < 300, status }) as Response;

describe("sincronización", () => {
  it("envía por lotes y marca lo aceptado", async () => {
    const f = vi.fn().mockResolvedValue(respuesta(200));
    const marcar = vi.fn().mockResolvedValue(undefined);
    const pend = Array.from({ length: LOTE + 5 }, (_, i) => ev(i + 1));
    const r = await sincronizar(cfg, pend, marcar, f);
    expect(r).toEqual({ enviadas: LOTE + 5 });
    expect(f).toHaveBeenCalledTimes(2);
    expect(marcar).toHaveBeenCalledTimes(2);
    expect(JSON.parse(f.mock.calls[0][1].body).evaluaciones).toHaveLength(LOTE);
  });
  it("incluye el token como Bearer", async () => {
    const f = vi.fn().mockResolvedValue(respuesta(200));
    await sincronizar({ ...cfg, token: "abc" }, [ev(1)], async () => {}, f);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  });
  it("ante un error del servidor se detiene y no marca ese lote", async () => {
    const f = vi.fn().mockResolvedValueOnce(respuesta(200)).mockResolvedValueOnce(respuesta(500));
    const marcar = vi.fn().mockResolvedValue(undefined);
    const r = await sincronizar(cfg, Array.from({ length: LOTE * 2 + 1 }, (_, i) => ev(i + 1)), marcar, f);
    expect(r.enviadas).toBe(LOTE);
    expect(r.error).toMatch(/500/);
    expect(marcar).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("sin red devuelve error y no marca nada", async () => {
    const marcar = vi.fn();
    const r = await sincronizar(cfg, [ev(1)], marcar, () => Promise.reject(new TypeError("fail")));
    expect(r).toEqual({ enviadas: 0, error: "Sin conexión con el servidor" });
    expect(marcar).not.toHaveBeenCalled();
  });
  it("rechaza direcciones que no son http(s)", async () => {
    const f = vi.fn();
    expect((await sincronizar({ url: "ftp://x", token: "" }, [ev(1)], async () => {}, f)).error).toBeTruthy();
    expect(f).not.toHaveBeenCalled();
  });
});
