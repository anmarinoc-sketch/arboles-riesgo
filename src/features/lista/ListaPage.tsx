import { useState } from "react";
import { db, type EvaluacionDB } from "../../db/db";
import { descargar } from "../../lib/descargar";
import FiltrosBar from "../../components/FiltrosBar";
import { catPorId, type Filtros } from "../../lib/filtros";
import { fmt } from "../../lib/util";
import { useEvaluaciones } from "./useEvaluaciones";
import { useCategorias } from "../../lib/categorias";

export default function ListaPage({ filtros, onFiltros }: { filtros: Filtros; onFiltros: (f: Filtros) => void }) {
  useCategorias();
  const { cargando, total, lista, especies } = useEvaluaciones(filtros);

  const [generando, setGenerando] = useState<number | null>(null);
  async function ficha(e: EvaluacionDB) {
    setGenerando(e.id!);
    try {
      const fotos = await db.fotos.where("evaluacionId").equals(e.id!).toArray();
      const { generarFichaPDF } = await import("../../lib/ficha");
      descargar(await generarFichaPDF(e, fotos, await db.especies.toArray()), `ficha-${e.codigo.replace(/[^\w.-]+/g, "_")}.pdf`, "application/pdf");
    } finally {
      setGenerando(null);
    }
  }

  async function eliminar(id: number, codigo: string) {
    if (!confirm(`¿Eliminar la evaluación ${codigo}? No se puede deshacer.`)) return;
    await db.transaction("rw", db.evaluaciones, db.fotos, async () => {
      await db.fotos.where("evaluacionId").equals(id).delete();
      await db.evaluaciones.delete(id);
    });
  }

  return (
    <>
      <FiltrosBar filtros={filtros} onChange={onFiltros} especies={especies} total={total} mostrados={lista.length} />
      {!cargando && total === 0 && (
        <section className="card"><p className="muted">Aún no hay evaluaciones. Crea la primera en la pestaña Evaluar.</p></section>
      )}
      {lista.map(e => {
        const cat = catPorId(e.categoriaId);
        const dec = e.form.decisionFinalId && e.form.decisionFinalId !== e.categoriaId ? catPorId(e.form.decisionFinalId) : null;
        return (
          <section className="card item" key={e.id}>
            <div className="item-cab">
              <div>
                <h3>{e.codigo}</h3>
                <p className="muted"><i>{e.especie}</i> · {e.catDiametrica}{[e.form.habito, e.form.origen, e.form.prioridad ? `Prioridad ${e.form.prioridad.toLowerCase()}` : ""].filter(Boolean).map(x => ` · ${x}`).join("")}</p>
              </div>
              <span className="chip" style={{ background: cat?.color }}>{e.categoriaNombre} · {fmt(e.resultado.porcentaje, 1)} %</span>
            </div>
            <p className="muted">
              {e.form.zona ? `${e.form.zona} · ` : ""}{e.form.fecha} · {e.form.evaluador} · {e.form.lat?.toFixed(5)}, {e.form.lon?.toFixed(5)}
            </p>
            <p className="muted">Vo {fmt(e.resultado.Vo, 3)} · Cr {fmt(e.resultado.Cr, 3)} · Ra {e.resultado.Ra} · A {fmt(e.resultado.A, 3)} · V {e.resultado.V}</p>
            {dec && (
              <p className="decision"><b>Decisión del técnico: {dec.nombre}</b> — {e.form.justificacion}</p>
            )}
            {e.form.observaciones && <p className="muted">{e.form.observaciones}</p>}
            <button className="secundario" disabled={generando === e.id} onClick={() => ficha(e)}>
              {generando === e.id ? "Generando…" : "Descargar ficha PDF"}
            </button>
            <button className="peligro" onClick={() => eliminar(e.id!, e.codigo)}>Eliminar</button>
          </section>
        );
      })}
    </>
  );
}
