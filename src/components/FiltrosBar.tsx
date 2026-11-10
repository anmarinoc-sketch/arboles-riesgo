import { CATEGORIAS_DIAMETRICAS } from "../engine";
import { SIN_FILTROS, type Filtros } from "../lib/filtros";
import { useCategorias } from "../lib/categorias";

interface Props {
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  especies: string[];
  total: number;
  mostrados: number;
}

export default function FiltrosBar({ filtros, onChange, especies, total, mostrados }: Props) {
  const CATEGORIAS = useCategorias();
  const hay = filtros.categoriaId || filtros.especie || filtros.catDiametrica;
  return (
    <section className="card filtros">
      <div className="fila">
        <label className="campo"><span className="etq">Categoría de riesgo</span>
          <select value={filtros.categoriaId} onChange={e => onChange({ ...filtros, categoriaId: e.target.value })}>
            <option value="">Todas</option>
            {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select></label>
        <label className="campo"><span className="etq">Categoría diamétrica</span>
          <select value={filtros.catDiametrica} onChange={e => onChange({ ...filtros, catDiametrica: e.target.value })}>
            <option value="">Todas</option>
            {CATEGORIAS_DIAMETRICAS.map(c => <option key={c}>{c}</option>)}
          </select></label>
      </div>
      <label className="campo"><span className="etq">Especie</span>
        <select value={filtros.especie} onChange={e => onChange({ ...filtros, especie: e.target.value })}>
          <option value="">Todas</option>
          {especies.map(s => <option key={s}>{s}</option>)}
        </select></label>
      <p className="muted">
        {mostrados} de {total} evaluaciones
        {hay ? <> · <button type="button" className="enlace" onClick={() => onChange(SIN_FILTROS)}>Quitar filtros</button></> : null}
      </p>
    </section>
  );
}
