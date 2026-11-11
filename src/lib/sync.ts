import type { EvaluacionDB } from "../db/db";

export interface SyncConfig {
  url: string;
  token: string; // opcional: se envia como "Authorization: Bearer <token>"
}

export const LOTE = 50;

/** Cuerpo que recibe el servidor: una evaluacion por codigo (el servidor debe hacer "upsert" por codigo). */
export function aPayload(e: EvaluacionDB) {
  return {
    codigo: e.codigo, creada: e.creada, actualizada: e.actualizada,
    especie: e.especie, catDiametrica: e.catDiametrica,
    categoriaId: e.categoriaId, categoriaNombre: e.categoriaNombre, modoV: e.modoV ?? "al-menos-uno",
    form: e.form, resultado: e.resultado,
  };
}

export interface ResultadoSync { enviadas: number; error?: string }

/**
 * Envia las evaluaciones pendientes por lotes. Marca como sincronizadas solo las de lotes que el
 * servidor acepto (2xx); ante un fallo se detiene y deja el resto pendiente para reintentar.
 * Las fotos no se envian en esta version.
 */
export async function sincronizar(
  cfg: SyncConfig,
  pendientes: EvaluacionDB[],
  marcar: (ids: number[]) => Promise<void>,
  fetchFn: typeof fetch = (...a) => fetch(...a),
): Promise<ResultadoSync> {
  if (!/^https?:\/\//i.test(cfg.url.trim())) return { enviadas: 0, error: "La dirección debe empezar por http:// o https://" };
  let enviadas = 0;
  for (let i = 0; i < pendientes.length; i += LOTE) {
    const lote = pendientes.slice(i, i + LOTE);
    try {
      const r = await fetchFn(cfg.url.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}) },
        body: JSON.stringify({ version: 1, evaluaciones: lote.map(aPayload) }),
      });
      if (!r.ok) return { enviadas, error: `El servidor respondió ${r.status}` };
    } catch {
      return { enviadas, error: "Sin conexión con el servidor" };
    }
    await marcar(lote.map(e => e.id!));
    enviadas += lote.length;
  }
  return { enviadas };
}
