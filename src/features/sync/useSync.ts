import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { sincronizar, type SyncConfig } from "../../lib/sync";

const KEY = "arboles.sync";
function leer(): SyncConfig {
  try { return { url: "", token: "", ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return { url: "", token: "" }; }
}
function guardar(c: SyncConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
}

export function useEnLinea() {
  const [en, setEn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setEn(true), b = () => setEn(false);
    window.addEventListener("online", a); window.addEventListener("offline", b);
    return () => { window.removeEventListener("online", a); window.removeEventListener("offline", b); };
  }, []);
  return en;
}

/** Evaluaciones sin sincronizar (incluye todas si no hay servidor configurado). */
export function usePendientes() {
  return useLiveQuery(() => db.evaluaciones.where("sincronizada").equals(0).count(), []) ?? 0;
}

export function useSync() {
  const [cfg, setCfgState] = useState<SyncConfig>(leer);
  const [estado, setEstado] = useState<{ ocupado: boolean; mensaje: string }>({ ocupado: false, mensaje: "" });
  const ocupado = useRef(false);
  const enLinea = useEnLinea();

  const setCfg = (c: SyncConfig) => { setCfgState(c); guardar(c); };

  const ahora = useCallback(async (c: SyncConfig) => {
    if (ocupado.current || !c.url.trim()) return;
    ocupado.current = true;
    setEstado({ ocupado: true, mensaje: "Sincronizando…" });
    try {
      const pend = await db.evaluaciones.where("sincronizada").equals(0).toArray();
      if (pend.length === 0) return setEstado({ ocupado: false, mensaje: "Todo está sincronizado." });
      const r = await sincronizar(c, pend, ids => db.evaluaciones.bulkUpdate(ids.map(id => ({ key: id, changes: { sincronizada: 1 as const } }))).then(() => {}));
      setEstado({ ocupado: false, mensaje: r.error ? `${r.error}. Enviadas: ${r.enviadas}.` : `Se enviaron ${r.enviadas} evaluaciones.` });
    } finally {
      ocupado.current = false;
      setEstado(e => ({ ...e, ocupado: false }));
    }
  }, []);

  // Al recuperar la señal, reintenta solo si ya hay un servidor configurado
  useEffect(() => { if (enLinea && cfg.url.trim()) void ahora(cfg); }, [enLinea]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cfg, setCfg, estado, enLinea, sincronizarAhora: () => ahora(cfg) };
}
