import type { CategoriaConfig, ResultadoRiesgo, FormEvaluacion, Errores } from "../../engine";
import Aviso from "../../components/Aviso";
import { Campo } from "../../components/controles";
import { fmt } from "../../lib/util";
import { useCategorias } from "../../lib/categorias";
import { DESCRIPCION_MODO, useModoV } from "../../lib/metodo";


interface Props {
  resultado: ResultadoRiesgo | null;
  categoria: CategoriaConfig | null;
  form: FormEvaluacion;
  errores: Errores;
  set: (c: Partial<FormEvaluacion>) => void;
}

export default function ResultadoPanel({ resultado, categoria, form, errores, set }: Props) {
  const CATS = useCategorias();
  const modoV = useModoV();
  if (!resultado || !categoria) {
    return (
      <section className="card">
        <h2>Resultado</h2>
        <p className="muted">Responde todas las variables de amenaza y vulnerabilidad para ver el riesgo.</p>
        <Aviso />
      </section>
    );
  }
  const filas: [string, string][] = [
    ["Vo · Volcamiento", fmt(resultado.Vo)],
    ["Cr · Caída de ramas", fmt(resultado.Cr)],
    ["Ra · Raíces", fmt(resultado.Ra)],
    ["A · Amenaza", fmt(resultado.A)],
    ["V · Vulnerabilidad", fmt(resultado.V)],
    ["Riesgo (A × V)", fmt(resultado.riesgo)],
  ];
  const difiere = !!form.decisionFinalId && form.decisionFinalId !== categoria.id;
  return (
    <section className="card">
      <h2>Resultado</h2>
      <div className="categoria" style={{ background: categoria.color }}>
        <strong>{categoria.nombre}</strong>
        <span>{fmt(resultado.porcentaje, 1)} %</span>
      </div>
      <p className="accion"><b>Acción recomendada:</b> {categoria.accion}</p>
      <table className="desglose">
        <tbody>
          {filas.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
          <tr><td>Riesgo (%)</td><td>{fmt(resultado.porcentaje, 1)} %</td></tr>
        </tbody>
      </table>
      <p className="muted">{DESCRIPCION_MODO[modoV].formula}. Cambia el método en Ajustes.</p>
      <Aviso />
      <Campo label="Decisión final del técnico (opcional)" error={errores.decisionFinalId}>
        <select value={form.decisionFinalId ?? ""}
          onChange={e => set({ decisionFinalId: e.target.value || null })}>
          <option value="">Igual al cálculo ({categoria.nombre})</option>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.accion}</option>)}
        </select>
      </Campo>
      {difiere && (
        <Campo label="Justificación de la decisión (obligatoria)" error={errores.justificacion}>
          <textarea rows={3} value={form.justificacion} onChange={e => set({ justificacion: e.target.value })} />
        </Campo>
      )}
    </section>
  );
}
