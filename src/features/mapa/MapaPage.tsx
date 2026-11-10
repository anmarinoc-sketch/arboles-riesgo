import { useMemo } from "react";
import FiltrosBar from "../../components/FiltrosBar";
import { catPorId, type Filtros } from "../../lib/filtros";
import { fmt } from "../../lib/util";
import { useEvaluaciones } from "../lista/useEvaluaciones";
import MapaLeaflet, { type PuntoMapa } from "./MapaLeaflet";
import { useCategorias } from "../../lib/categorias";

export default function MapaPage({ filtros, onFiltros }: { filtros: Filtros; onFiltros: (f: Filtros) => void }) {
  const CATEGORIAS = useCategorias();
  const { total, lista, especies } = useEvaluaciones(filtros);
  const puntos = useMemo<PuntoMapa[]>(
    () => lista
      .filter(e => e.form.lat !== null && e.form.lon !== null)
      .map(e => ({
        id: e.id!, lat: e.form.lat!, lon: e.form.lon!,
        color: catPorId(e.categoriaId)?.color ?? "#777",
        titulo: `${e.codigo} · ${e.categoriaNombre} (${fmt(e.resultado.porcentaje, 1)} %)`,
        detalle: `${e.especie} · ${e.catDiametrica}`,
      })),
    [lista],
  );
  return (
    <>
      <FiltrosBar filtros={filtros} onChange={onFiltros} especies={especies} total={total} mostrados={lista.length} />
      <MapaLeaflet puntos={puntos} />
      <ul className="leyenda" aria-label="Leyenda">
        {CATEGORIAS.map(c => <li key={c.id}><i style={{ background: c.color }} />{c.nombre}</li>)}
      </ul>
    </>
  );
}
