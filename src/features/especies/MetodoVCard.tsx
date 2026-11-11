import { MODOS_VULNERABILIDAD } from "../../engine";
import { DESCRIPCION_MODO, guardarModoV, useModoV } from "../../lib/metodo";

export default function MetodoVCard() {
  const modo = useModoV();
  return (
    <section className="card">
      <h2>Cálculo de la vulnerabilidad (V)</h2>
      <p className="muted">
        Las fórmulas de Vo, Cr, Ra y A son iguales en ambos métodos; solo cambia cómo se obtiene V. Elige el que pida
        el documento con el que trabajas. Cada evaluación guarda el método con el que se calculó y los ya guardados no se
        modifican al cambiarlo.
      </p>
      <div role="radiogroup" aria-label="Método de vulnerabilidad">
        {MODOS_VULNERABILIDAD.map(m => (
          <label key={m} className={"opcion-modo" + (modo === m ? " on" : "")}>
            <input type="radio" name="modoV" checked={modo === m} onChange={() => guardarModoV(m)} />
            <span>
              <b>{DESCRIPCION_MODO[m].titulo}</b>
              <code>{DESCRIPCION_MODO[m].formula}</code>
              <small className="muted">{DESCRIPCION_MODO[m].detalle}</small>
            </span>
          </label>
        ))}
      </div>
      <p className="muted">Con el mismo árbol, los dos métodos pueden dar categorías distintas: usa siempre el mismo dentro de un inventario.</p>
    </section>
  );
}
