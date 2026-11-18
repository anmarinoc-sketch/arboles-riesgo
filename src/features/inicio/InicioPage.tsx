import type { ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import Logo, { LEMA_APP, NOMBRE_APP } from "../../components/Logo";
import { IconoAjustes, IconoGrafica, IconoLibro, IconoMapa, IconoMas } from "../../components/Iconos";
import { useEnLinea } from "../sync/useSync";
import { useCategorias } from "../../lib/categorias";
import { contarSinRespaldar, describirAntiguedad, useUltimoRespaldo } from "../../lib/ultimoRespaldo";

export type Destino = "evaluar" | "mapa" | "aprender" | "resumen" | "ajustes" | "lista";

function Atajo({ icono, titulo, onClick }: { icono: ReactNode; titulo: string; onClick: () => void }) {
  return (
    <button type="button" className="atajo" onClick={onClick}>
      <span className="atajo-icono">{icono}</span>
      <span>{titulo}</span>
    </button>
  );
}

export default function InicioPage({ ir }: { ir: (d: Destino) => void }) {
  const enLinea = useEnLinea();
  const categorias = useCategorias();
  const evals = useLiveQuery(() => db.evaluaciones.toArray(), []) ?? [];
  const ultimo = useUltimoRespaldo();
  const sinRespaldar = contarSinRespaldar(evals, ultimo);
  const porCategoria = categorias.map(c => ({ c, n: evals.filter(e => e.categoriaId === c.id).length }));

  return (
    <section className="inicio">
      <div className="hero">
        <button type="button" className="hero-ajustes" onClick={() => ir("ajustes")} aria-label="Ajustes"><IconoAjustes /></button>
        <Logo tam={132} alt="" />
        <h1>{NOMBRE_APP}</h1>
        <p className="hero-lema">{LEMA_APP}</p>
        <p className="hero-sub">Califica el riesgo de caída de árboles urbanos, en campo y sin conexión.</p>
        <span className={"estado " + (enLinea ? "en-linea" : "sin-linea")} role="status">
          {enLinea ? "● En línea" : "● Sin conexión: todo se guarda en el dispositivo"}
        </span>
      </div>

      <div className="atajos">
        <Atajo icono={<IconoMas size={28} />} titulo="Evaluar árbol" onClick={() => ir("evaluar")} />
        <Atajo icono={<IconoMapa size={28} />} titulo="Ver en el mapa" onClick={() => ir("mapa")} />
        <Atajo icono={<IconoLibro size={28} />} titulo="Aprender y guía" onClick={() => ir("aprender")} />
        <Atajo icono={<IconoGrafica size={28} />} titulo="Resumen y exportar" onClick={() => ir("resumen")} />
      </div>

      <div className="card panel-estado">
        <h2>Tu inventario</h2>
        {evals.length === 0 ? (
          <p className="muted">Aún no hay evaluaciones. Toca «Evaluar árbol» para registrar la primera.</p>
        ) : (
          <>
            <p className="muted">{evals.length} {evals.length === 1 ? "árbol evaluado" : "árboles evaluados"} en este dispositivo.</p>
            <ul className="franjas">
              {porCategoria.map(({ c, n }) => (
                <li key={c.id} style={{ borderColor: c.color }}>
                  <b style={{ color: c.color }}>{n}</b>
                  <span>{c.nombre}</span>
                </li>
              ))}
            </ul>
            {sinRespaldar > 0 && (
              <p className="alerta">
                {sinRespaldar} {sinRespaldar === 1 ? "evaluación sin respaldar" : "evaluaciones sin respaldar"} (última copia: {describirAntiguedad(ultimo)}).
                {" "}<button type="button" className="enlace" onClick={() => ir("resumen")}>Hacer una copia</button>
              </p>
            )}
            <button type="button" className="secundario" onClick={() => ir("lista")}>Ver la lista</button>
          </>
        )}
      </div>
    </section>
  );
}
