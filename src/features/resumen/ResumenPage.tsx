import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type EvaluacionDB } from "../../db/db";
import { aEntrada, calcularRiesgo } from "../../engine";
import { categorizarActual, useCategorias } from "../../lib/categorias";
import { inventario, tabla65, tabla66 } from "../../lib/resumen";
import { evaluacionesACSV, evaluacionesAGeoJSON, plantillaCSV } from "../../lib/exportar";
import { leerCSV, type LecturaCSV } from "../../lib/importar";
import { descargar, hoy } from "../../lib/descargar";
import { fmt } from "../../lib/util";
import SyncCard from "../sync/SyncCard";

export default function ResumenPage() {
  const evals = useLiveQuery(() => db.evaluaciones.toArray(), []) ?? [];
  useCategorias(); // las tablas dependen de los umbrales vigentes
  const t65 = tabla65(evals), t66 = tabla66(evals), inv = inventario(evals);
  const [lectura, setLectura] = useState<{ nombre: string; datos: LecturaCSV } | null>(null);
  const [msg, setMsg] = useState("");

  async function elegirArchivo(file: File | undefined) {
    setMsg("");
    if (!file) return;
    const codigos = new Set((await db.evaluaciones.toArray()).map(e => e.codigo));
    setLectura({ nombre: file.name, datos: leerCSV(await file.text(), codigos, await db.especies.toArray()) });
  }

  async function importar() {
    if (!lectura) return;
    const catalogo = await db.especies.toArray();
    const ahora = Date.now();
    const nuevas: EvaluacionDB[] = [];
    for (const fila of lectura.datos.filas) {
      if (fila.errores.length) continue;
      const entrada = aEntrada(fila.form, catalogo);
      if (!entrada) continue;
      const resultado = calcularRiesgo(entrada);
      const cat = categorizarActual(resultado.porcentaje);
      if (fila.form.decisionFinalId && fila.form.decisionFinalId !== cat.id && !fila.form.justificacion) continue; // se informa abajo
      nuevas.push({
        codigo: fila.form.codigo, especie: fila.form.especie, catDiametrica: fila.form.catDiametrica!,
        categoriaId: cat.id, categoriaNombre: cat.nombre, creada: ahora, actualizada: ahora, sincronizada: 0,
        form: fila.form, resultado,
      });
    }
    await db.evaluaciones.bulkAdd(nuevas);
    const omitidas = lectura.datos.filas.length - nuevas.length;
    setMsg(`Se importaron ${nuevas.length} evaluaciones${omitidas ? ` y se omitieron ${omitidas} con errores` : ""}.`);
    setLectura(null);
  }

  const validas = lectura?.datos.filas.filter(f => f.errores.length === 0).length ?? 0;
  const conError = lectura?.datos.filas.filter(f => f.errores.length > 0) ?? [];

  return (
    <>
      <section className="card">
        <h2>Tabla 65 · Individuos por categoría diamétrica y de riesgo</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Categoría</th>{t65.columnas.map(c => <th key={c.id}>{c.nombre}</th>)}<th>Total</th></tr></thead>
            <tbody>
              {t65.filas.map(f => (
                <tr key={f.catDiametrica}><td>{f.catDiametrica}</td>
                  {t65.columnas.map(c => <td key={c.id}>{f.conteos[c.id]}</td>)}<td>{f.total}</td></tr>
              ))}
              <tr className="total"><td>Total</td>{t65.columnas.map(c => <td key={c.id}>{t65.totales[c.id]}</td>)}<td>{t65.total}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Tabla 66 · Eucaliptos frente al resto de especies</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Categoría</th><th>Resto</th><th>Eucaliptos</th><th>% resto</th><th>% euc.</th><th>Total</th></tr></thead>
            <tbody>
              {t66.filas.map(f => (
                <tr key={f.categoriaId}><td>{f.nombre}</td><td>{f.resto}</td><td>{f.eucaliptos}</td>
                  <td>{fmt(f.pctResto, 2)} %</td><td>{fmt(f.pctEucaliptos, 2)} %</td><td>{f.total}</td></tr>
              ))}
              <tr className="total"><td>Total</td><td>{t66.totalResto}</td><td>{t66.totalEucaliptos}</td><td>100 %</td><td>100 %</td><td>{t66.total}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted">«Resto» son todas las especies que no son <i>Eucalyptus</i>. Cada porcentaje es la parte de ese grupo que cae en la categoría.</p>
      </section>

      {inv.total > 0 && (
        <section className="card">
          <h2>Inventario por especie</h2>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr><th>Especie</th><th>Origen</th><th>Cantidad</th></tr></thead>
              <tbody>
                {inv.especies.map(e => <tr key={e.especie}><td><i>{e.especie}</i></td><td>{e.origen || "—"}</td><td>{e.cantidad}</td></tr>)}
                <tr className="total"><td>Total</td><td>{inv.especies.length} especies</td><td>{inv.total}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="muted">
            Nativas: {inv.nativas.especies} especies, {inv.nativas.individuos} individuos ({fmt(inv.total ? inv.nativas.individuos / inv.total * 100 : 0, 0)} %) ·
            Introducidas: {inv.introducidas.especies} especies, {inv.introducidas.individuos} individuos ({fmt(inv.total ? inv.introducidas.individuos / inv.total * 100 : 0, 0)} %) ·
            Sin origen: {inv.sinOrigen} individuos.
          </p>
          <h3>Prioridad de intervención</h3>
          <p className="muted">{Object.entries(inv.porPrioridad).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
          <h3>Estado fitosanitario y estructural</h3>
          <p className="muted">{Object.entries(inv.porEstado).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
        </section>
      )}

      <section className="card">
        <h2>Exportar</h2>
        <p className="muted">{evals.length} evaluaciones. Coordenadas en WGS84 (EPSG:4326).</p>
        <button className="secundario" disabled={!evals.length}
          onClick={() => descargar(evaluacionesACSV(evals), `evaluaciones-${hoy()}.csv`, "text/csv;charset=utf-8")}>Descargar CSV</button>
        <button className="secundario" disabled={!evals.length}
          onClick={() => descargar(JSON.stringify(evaluacionesAGeoJSON(evals), null, 2), `evaluaciones-${hoy()}.geojson`, "application/geo+json")}>Descargar GeoJSON</button>
        <p className="muted">La ficha PDF de cada árbol se descarga desde la pestaña Lista.</p>
      </section>

      <section className="card">
        <h2>Importar desde CSV</h2>
        <p className="muted">Usa el CSV exportado o la plantilla. Se revisan las mismas reglas del formulario fila por fila.</p>
        <button className="secundario" onClick={() => descargar(plantillaCSV(), "plantilla-evaluaciones.csv", "text/csv;charset=utf-8")}>Descargar plantilla</button>
        <label className="boton-archivo">
          📄 Elegir archivo CSV
          <input type="file" accept=".csv,text/csv" hidden onChange={e => { elegirArchivo(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {msg && <p className="ok" role="status">{msg}</p>}
        {lectura && (
          <div>
            <h3>{lectura.nombre}</h3>
            {lectura.datos.columnasFaltantes.length > 0 ? (
              <p className="error banner">Faltan columnas: {lectura.datos.columnasFaltantes.join(", ")}</p>
            ) : (
              <>
                <p><b>{validas}</b> filas válidas · <b>{conError.length}</b> con errores</p>
                {conError.length > 0 && (
                  <ul className="errores-import">
                    {conError.slice(0, 50).map(f => (
                      <li key={f.fila}><b>Fila {f.fila}{f.form.codigo ? ` (${f.form.codigo})` : ""}:</b> {f.errores.join("; ")}</li>
                    ))}
                    {conError.length > 50 && <li>… y {conError.length - 50} más</li>}
                  </ul>
                )}
                <button className="grande" disabled={validas === 0} onClick={importar}>Importar {validas} válidas</button>
              </>
            )}
            <button className="secundario" onClick={() => setLectura(null)}>Cancelar</button>
          </div>
        )}
      </section>
      <SyncCard />
    </>
  );
}
