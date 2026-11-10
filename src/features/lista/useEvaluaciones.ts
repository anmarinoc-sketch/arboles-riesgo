import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { filtrar, type Filtros } from "../../lib/filtros";

/** Evaluaciones guardadas, mas recientes primero, ya filtradas. */
export function useEvaluaciones(filtros: Filtros) {
  const todas = useLiveQuery(() => db.evaluaciones.orderBy("creada").reverse().toArray(), []);
  const especies = useMemo(
    () => [...new Set((todas ?? []).map(e => e.especie))].sort((a, b) => a.localeCompare(b)),
    [todas],
  );
  const lista = useMemo(() => filtrar(todas ?? [], filtros), [todas, filtros]);
  return { cargando: todas === undefined, total: todas?.length ?? 0, lista, especies };
}
