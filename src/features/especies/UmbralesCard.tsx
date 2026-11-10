import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { CategoriaConfig } from "../../engine";
import { Campo, NumInput, Segmentado } from "../../components/controles";
import {
  CATEGORIAS_POR_DEFECTO, cambiosDeCategoria, describirRangos, guardarCategorias, restaurarCategorias,
  useCategorias, validarCategorias,
} from "../../lib/categorias";

const igual = (a: CategoriaConfig[], b: CategoriaConfig[]) => JSON.stringify(a) === JSON.stringify(b);

export default function UmbralesCard() {
  const activas = useCategorias();
  const [borrador, setBorrador] = useState<CategoriaConfig[]>(activas);
  const [aviso, setAviso] = useState("");
  useEffect(() => setBorrador(activas), [activas]);

  const errores = validarCategorias(borrador);
  const sinCambios = igual(borrador, activas);
  const esDefecto = igual(activas, CATEGORIAS_POR_DEFECTO);

  // Evaluaciones guardadas que quedarian en otra categoria con los umbrales vigentes
  const evals = useLiveQuery(() => db.evaluaciones.toArray(), []) ?? [];
  const cambios = cambiosDeCategoria(evals, activas);

  const editar = (i: number, c: Partial<CategoriaConfig>) =>
    setBorrador(b => b.map((x, k) => (k === i ? { ...x, ...c } : x)));

  function guardar() {
    const e = guardarCategorias(borrador);
    setAviso(e.length ? e.join(" ") : "Umbrales guardados. Se usan desde la próxima evaluación.");
  }

  async function recalcular() {
    if (!confirm(`¿Recalcular la categoría de ${cambios.length} evaluaciones con los umbrales actuales? La decisión final del técnico no se modifica.`)) return;
    await db.transaction("rw", db.evaluaciones, async () => {
      for (const c of cambios)
        await db.evaluaciones.update(c.id, { categoriaId: c.categoriaId, categoriaNombre: c.categoriaNombre, actualizada: Date.now(), sincronizada: 0 });
    });
    setAviso(`Se recalcularon ${cambios.length} evaluaciones.`);
  }

  return (
    <section className="card">
      <h2>Umbrales de riesgo</h2>
      <p className="muted">
        Cómo se agrupa el porcentaje de riesgo en categorías. Los valores iniciales son los de la Tabla 64 del Plan
        Maestro de Envigado; cámbialos si tu entidad usa otros. El modelo de cálculo (Vo, Cr, Ra, V) no cambia.
      </p>

      {borrador.map((c, i) => (
        <fieldset className="umbral" key={c.id}>
          <legend><i className="punto" style={{ background: c.color }} /> {c.nombre}</legend>
          {c.hasta !== null || i < borrador.length - 1 ? (
            <>
              <NumInput label="Límite superior" unidad="%" value={c.hasta} onChange={hasta => editar(i, { hasta })} />
              <Segmentado label="El valor exacto del límite pertenece a" value={c.inclusivo}
                options={[{ value: true, label: "Esta categoría" }, { value: false, label: "La siguiente" }]}
                onChange={inclusivo => editar(i, { inclusivo })} />
            </>
          ) : <p className="muted">Todo lo que supere el límite de la categoría anterior.</p>}
          <Campo label="Acción recomendada">
            <input value={c.accion} onChange={e => editar(i, { accion: e.target.value })} />
          </Campo>
          <Campo label="Color">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.color) ? c.color : "#777777"} onChange={e => editar(i, { color: e.target.value })} />
          </Campo>
        </fieldset>
      ))}

      <h3>Resultado</h3>
      <ul className="rangos">{describirRangos(borrador).map(t => <li key={t}>{t}</li>)}</ul>
      {errores.map(e => <p key={e} className="error" role="alert">{e}</p>)}

      <button className="grande" disabled={errores.length > 0 || sinCambios} onClick={guardar}>Guardar umbrales</button>
      <button className="secundario" disabled={esDefecto && sinCambios}
        onClick={() => { if (confirm("¿Volver a los umbrales de la Tabla 64?")) { restaurarCategorias(); setAviso("Se restauró la Tabla 64."); } }}>
        Restaurar Tabla 64
      </button>
      {aviso && <p className="ok" role="status">{aviso}</p>}

      {cambios.length > 0 && (
        <div className="decision">
          <p><b>{cambios.length}</b> evaluaciones guardadas quedarían en otra categoría con estos umbrales. Las ya
            guardadas conservan la categoría con la que se calcularon hasta que las recalcules.</p>
          <button className="secundario" onClick={recalcular}>Recalcular {cambios.length} evaluaciones</button>
        </div>
      )}
    </section>
  );
}
