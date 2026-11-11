import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, restaurarSemilla, type EspecieDB } from "../../db/db";
import { descargar, hoy } from "../../lib/descargar";
import { especiesACSV, leerEspeciesCSV } from "../../lib/especiesCsv";
import UmbralesCard from "./UmbralesCard";
import MetodoVCard from "./MetodoVCard";

const OPCIONES: { label: string; valor: number; hint: string }[] = [
  { label: "1/3", valor: 1 / 3, hint: "se sabe que NO" },
  { label: "2/3", valor: 2 / 3, hint: "sin información" },
  { label: "1", valor: 1, hint: "se sabe que SÍ" },
];

function Cat3Select({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const idx = OPCIONES.findIndex(o => Math.abs(o.valor - value) < 1e-9);
  return (
    <label className="campo">
      <span>{label}</span>
      <select value={idx} onChange={e => onChange(OPCIONES[Number(e.target.value)].valor)}>
        {OPCIONES.map((o, i) => (
          <option key={o.label} value={i}>{o.label} · {o.hint}</option>
        ))}
      </select>
    </label>
  );
}

export default function EspeciesPage() {
  const especies = useLiveQuery(() => db.especies.orderBy("cientifico").toArray(), []);
  const [q, setQ] = useState("");
  const [nuevo, setNuevo] = useState({ cientifico: "", comun: "" });
  const [error, setError] = useState("");

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (especies ?? []).filter(e => !t || e.cientifico.toLowerCase().includes(t) || e.comun.toLowerCase().includes(t));
  }, [especies, q]);

  async function agregar() {
    const cientifico = nuevo.cientifico.trim();
    if (!cientifico) return setError("Escribe el nombre científico.");
    if ((especies ?? []).some(e => e.cientifico.toLowerCase() === cientifico.toLowerCase()))
      return setError("Esa especie ya está en el catálogo.");
    // Sin informacion previa: 2/3 (regla del numeral 3.7.3)
    await db.especies.add({ cientifico, comun: nuevo.comun.trim(), spVolcamiento: 2 / 3, spCaidaRamas: 2 / 3 });
    setNuevo({ cientifico: "", comun: "" });
    setError("");
  }

  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);
  async function importar(file: File | undefined) {
    setAviso(null);
    if (!file) return;
    const r = leerEspeciesCSV(await file.text());
    if (r.columnasFaltantes.length)
      return setAviso({ error: true, texto: `Faltan columnas: ${r.columnasFaltantes.join(", ")}` });
    let nuevas = 0, actualizadas = 0;
    await db.transaction("rw", db.especies, async () => {
      for (const s of r.validas) {
        const ex = (await db.especies.toArray()).find(x => x.cientifico.trim().toLowerCase() === s.cientifico.toLowerCase());
        if (ex) { await db.especies.update(ex.id!, s); actualizadas++; } else { await db.especies.add(s); nuevas++; }
      }
    });
    const err = r.errores.length ? ` Con errores (no importadas): ${r.errores.slice(0, 5).map(e => `fila ${e.fila}: ${e.mensaje}`).join("; ")}${r.errores.length > 5 ? "…" : ""}` : "";
    setAviso({ error: r.errores.length > 0, texto: `${nuevas} nuevas y ${actualizadas} actualizadas.${err}` });
  }

  const actualizar = (e: EspecieDB, cambios: Partial<EspecieDB>) => db.especies.update(e.id!, cambios);

  return (
    <>
      <MetodoVCard />
      <UmbralesCard />
      <section className="card">
        <h2>Catálogo de especies</h2>
        <p className="muted">
          Sp indica qué se sabe de la especie: 1/3 no se vuelca / no pierde ramas, 2/3 sin información, 1 sí se
          vuelca / sí tiene poda natural. Una especie fuera del catálogo o «Indeterminado» usa 2/3.
        </p>
        <input className="buscar" type="search" placeholder="Buscar por nombre científico o común"
          value={q} onChange={e => setQ(e.target.value)} />
        <p className="muted">{filtradas.length} de {especies?.length ?? 0} especies</p>
      </section>

      <section className="card">
        <h3>Agregar especie</h3>
        <label className="campo"><span>Nombre científico</span>
          <input value={nuevo.cientifico} onChange={e => setNuevo({ ...nuevo, cientifico: e.target.value })} /></label>
        <label className="campo"><span>Nombre común</span>
          <input value={nuevo.comun} onChange={e => setNuevo({ ...nuevo, comun: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="grande" onClick={agregar}>Agregar (2/3 por defecto)</button>
      </section>

      {filtradas.map(e => (
        <section className="card" key={e.id}>
          <h3><i>{e.cientifico}</i></h3>
          <p className="muted">{e.comun || "—"}</p>
          <Cat3Select label="Sp · Volcamiento" value={e.spVolcamiento} onChange={v => actualizar(e, { spVolcamiento: v })} />
          <Cat3Select label="Sp · Caída de ramas" value={e.spCaidaRamas} onChange={v => actualizar(e, { spCaidaRamas: v })} />
          <button className="peligro" onClick={() => confirm(`¿Eliminar ${e.cientifico}?`) && db.especies.delete(e.id!)}>
            Eliminar
          </button>
        </section>
      ))}

      <section className="card">
        <h3>Catálogo de tu región</h3>
        <p className="muted">
          La lista inicial viene de las Tablas 67 y 68 del Plan Maestro de Envigado y su calibración (eucalipto = 1, las
          demás 1/3) es de allí. En otro lugar, ajusta los factores con lo que se sepa de las especies locales, o carga tu
          propio catálogo desde un CSV (columnas: cientifico, comun, sp_volcamiento, sp_caida_ramas).
        </p>
        <button className="secundario" disabled={!especies?.length}
          onClick={() => descargar(especiesACSV(especies ?? []), `catalogo-especies-${hoy()}.csv`, "text/csv;charset=utf-8")}>
          Exportar catálogo (CSV)
        </button>
        <label className="boton-archivo">
          📄 Importar catálogo (CSV)
          <input type="file" accept=".csv,text/csv" hidden onChange={e => { importar(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <p className="muted">Si una especie ya existe, se actualizan sus factores; las demás no se tocan.</p>
        {aviso && <p className={aviso.error ? "error banner" : "ok"} role="status">{aviso.texto}</p>}
        <button className="secundario" onClick={() => confirm("Restaurar los valores de la semilla (Tablas 67-68)?") && restaurarSemilla()}>
          Restaurar valores de la semilla
        </button>
        <button className="peligro" onClick={() => confirm("¿Vaciar todo el catálogo? Todas las especies pasarán a «sin información» (2/3) hasta que cargues otras.") && db.especies.clear()}>
          Vaciar catálogo
        </button>
      </section>
    </>
  );
}
